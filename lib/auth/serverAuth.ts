/**
 * Server-Side Authentication & RBAC Verification Middleware
 * 
 * Cryptographically verifies Firebase ID Tokens on all incoming API requests.
 * Eliminates spoofing: ensures routes NEVER trust unverified client-supplied UIDs or emails.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase/admin';
import { isProjectOwnerEmail, normalizeRole, SystemRole, isDirector } from '@/lib/auth/roles';
import { roleHasPermission } from '@/lib/auth/permissions';

export interface VerifiedCaller {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  role: SystemRole;
  isSuperAdmin: boolean;
  tenantTag: string;
  decodedToken: any;
}

/**
 * Extracts and cryptographically verifies the Firebase ID token from the request.
 * Checks "Authorization: Bearer <token>" and session cookies.
 */
export async function verifyBearerToken(req: NextRequest): Promise<any | null> {
  if (!isFirebaseConfigured) {
    return null;
  }

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    const cookieToken = req.cookies.get('firebase_id_token')?.value || req.cookies.get('__session')?.value;
    if (cookieToken) {
      token = cookieToken.trim();
    }
  }

  if (!token) {
    return null;
  }

  try {
    const decodedToken = await auth.verifyIdToken(token, true);
    return decodedToken;
  } catch (err: any) {
    console.warn('[serverAuth] Token verification failed:', err.message);
    return null;
  }
}

/**
 * Resolves the authenticated caller's identity and canonical Firestore RBAC role.
 */
export async function getVerifiedCaller(req: NextRequest): Promise<VerifiedCaller | null> {
  const decoded = await verifyBearerToken(req);
  if (!decoded || !decoded.uid) {
    return null;
  }

  const uid = decoded.uid;
  const email = (decoded.email || '').toLowerCase().trim();
  const emailVerified = Boolean(decoded.email_verified);
  const displayName = decoded.name || '';
  const photoURL = decoded.picture || '';

  const isOwner = isProjectOwnerEmail(email) && (emailVerified || process.env.NODE_ENV === 'development');

  if (isOwner) {
    return {
      uid,
      email,
      emailVerified,
      displayName,
      photoURL,
      role: 'superadmin',
      isSuperAdmin: true,
      tenantTag: 'super-rto',
      decodedToken: decoded,
    };
  }

  let role: SystemRole = 'supporter';
  let isSuper = false;

  if (isFirebaseConfigured) {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const data = userDoc.data() || {};
        const storedRole = normalizeRole(data.role || data.status);
        if (storedRole === 'superadmin' || data.isSuperAdmin === true) {
          role = 'superadmin';
          isSuper = true;
        } else if (storedRole === 'director') {
          role = 'director';
          isSuper = true;
        } else {
          role = storedRole;
        }
      } else {
        role = 'supporter';
      }
    } catch (dbErr) {
      console.warn(`[getVerifiedCaller] Firestore lookup failed for uid ${uid}:`, dbErr);
      if (decoded.role) {
        role = normalizeRole(decoded.role);
        isSuper = role === 'superadmin' || role === 'director' || decoded.isSuperAdmin === true;
      }
    }
  } else if (decoded.role) {
    role = normalizeRole(decoded.role);
    isSuper = role === 'superadmin' || role === 'director' || decoded.isSuperAdmin === true;
  }

  return {
    uid,
    email,
    emailVerified,
    displayName,
    photoURL,
    role,
    isSuperAdmin: isSuper,
    tenantTag: 'super-rto',
    decodedToken: decoded,
  };
}

/**
 * Requires a cryptographically verified Superadmin caller.
 */
export async function requireSuperAdminCaller(
  req: NextRequest
): Promise<{ caller: VerifiedCaller } | { errorResponse: NextResponse }> {
  const caller = await getVerifiedCaller(req);

  if (!caller) {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'Unauthorized: Valid Firebase ID token is required in the Authorization header.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    };
  }

  if (!caller.isSuperAdmin && caller.role !== 'superadmin' && caller.role !== 'director') {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'Forbidden: Superadmin or Director authorization is required to perform this action.',
          code: 'FORBIDDEN',
          currentRole: caller.role,
        },
        { status: 403 }
      )
    };
  }

  return { caller };
}

/**
 * Requires any cryptographically verified authenticated caller.
 */
export async function requireAuthenticatedCaller(
  req: NextRequest
): Promise<{ caller: VerifiedCaller } | { errorResponse: NextResponse }> {
  const caller = await getVerifiedCaller(req);

  if (!caller) {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'Unauthorized: Valid Firebase ID token is required in the Authorization header.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    };
  }

  return { caller };
}

/**
 * Requires Administration, Director, or Superadmin verified caller.
 */
export async function requireAdministrationOrSuperAdminCaller(
  req: NextRequest
): Promise<{ caller: VerifiedCaller } | { errorResponse: NextResponse }> {
  const caller = await getVerifiedCaller(req);

  if (!caller) {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'Unauthorized: Valid Firebase ID token is required in the Authorization header.',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    };
  }

  const isSuper = caller.isSuperAdmin || caller.role === 'superadmin' || caller.role === 'director';
  const isAdmin = caller.role === 'administration';

  if (!isSuper && !isAdmin) {
    return {
      errorResponse: NextResponse.json(
        {
          error: 'Forbidden: Administration, Director, or Superadmin authorization is required to perform this action.',
          code: 'FORBIDDEN',
          currentRole: caller.role,
        },
        { status: 403 }
      )
    };
  }

  return { caller };
}

/**
 * Checks a verified caller against the RBAC matrix (Firestore /roles, falling back to defaults).
 * Superadmins and Directors always pass.
 */
export async function callerHasPermission(caller: VerifiedCaller, permissionId: string): Promise<boolean> {
  if (caller.isSuperAdmin || caller.role === 'superadmin' || caller.role === 'director') return true;

  let customMap: Record<string, string[]> | undefined;
  if (isFirebaseConfigured) {
    try {
      const roleDoc = await db.collection('roles').doc(caller.role).get();
      const saved = roleDoc.exists ? roleDoc.data()?.permissions : null;
      if (Array.isArray(saved)) customMap = { [caller.role]: saved };
    } catch (err) {
      console.warn(`[callerHasPermission] Could not load saved permissions for ${caller.role}, using defaults:`, err);
    }
  }
  return roleHasPermission(caller.role, permissionId, customMap);
}

/**
 * Requires a verified caller whose role grants the given RBAC permission.
 */
export async function requirePermissionCaller(
  req: NextRequest,
  permissionId: string
): Promise<{ caller: VerifiedCaller } | { errorResponse: NextResponse }> {
  const authCheck = await requireAuthenticatedCaller(req);
  if ('errorResponse' in authCheck) return authCheck;

  if (!(await callerHasPermission(authCheck.caller, permissionId))) {
    return {
      errorResponse: NextResponse.json(
        {
          error: `Forbidden: your role does not have the "${permissionId}" permission.`,
          code: 'FORBIDDEN',
          currentRole: authCheck.caller.role,
        },
        { status: 403 }
      )
    };
  }
  return authCheck;
}
