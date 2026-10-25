/**
 * Super-RTO Firebase Admin SDK Initialization & Persistence Services
 * 
 * Secure backend operations authorized via custom claims and service account credentials.
 */

import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { type SystemRole, normalizeRole, isProjectOwnerEmail } from '../auth/roles.ts';
import { type TokenCurrencyConfig, DEFAULT_GLOBAL_TOKEN_CONFIG } from '../tokens/pricing.ts';

function getCredentials() {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '';
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || 'ai-foundation-firebase';

  return { privateKey, clientEmail, projectId };
}

const creds = getCredentials();
export const isFirebaseConfigured = Boolean(
  creds.privateKey && creds.privateKey.includes('BEGIN PRIVATE KEY') && !creds.privateKey.includes('YOUR_PRIVATE_KEY')
);

function getAdminApp(): App {
  const appName = 'super-rto-admin';
  const existing = getApps().find(a => a.name === appName || a.name === '[DEFAULT]');
  if (existing) return existing;

  try {
    if (isFirebaseConfigured) {
      return initializeApp({
        credential: cert({
          projectId: creds.projectId,
          clientEmail: creds.clientEmail,
          privateKey: creds.privateKey,
        }),
      }, appName);
    } else {
      return initializeApp({ projectId: creds.projectId }, appName);
    }
  } catch (err) {
    console.warn('[FirebaseAdmin] Initialization fallback during build:', err);
    return getApps()[0] || initializeApp({ projectId: creds.projectId });
  }
}

const adminApp = getAdminApp();
export const auth = getAuth(adminApp);
export const db = getFirestore(adminApp);

try {
  db.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // Already initialized settings
}

/**
 * Assigns a unified role (including 'director') to a user and sets Firebase Auth Custom Claims.
 */
export async function assignUserRole(params: {
  uid: string;
  role: SystemRole | string;
  institutionId?: string;
  institutionName?: string;
  email?: string;
  displayName?: string;
}) {
  const { uid, role, institutionId, institutionName, email, displayName } = params;
  const normalized = normalizeRole(role);
  const isSuper = normalized === 'superadmin' || isProjectOwnerEmail(email);
  const isDir = normalized === 'director';

  const customClaims: Record<string, any> = {
    role: normalized,
    isSuperAdmin: isSuper,
    isDirector: isDir,
    institutionId: institutionId || null,
  };

  if (isFirebaseConfigured) {
    try {
      await auth.setCustomUserClaims(uid, customClaims);
    } catch (e) {
      console.warn(`[assignUserRole] Could not set claims for ${uid}:`, e);
    }
  }

  const profileData: Record<string, any> = {
    uid,
    role: normalized,
    isSuperAdmin: isSuper,
    isDirector: isDir,
    institutionId: institutionId || null,
    institutionName: institutionName || null,
    email: email || '',
    displayName: displayName || '',
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (isFirebaseConfigured) {
    await db.collection('users').doc(uid).set(profileData, { merge: true });
  }

  return {
    success: true,
    uid,
    role: normalized,
    customClaims,
  };
}

/**
 * In-memory fallback for token configs
 */
let memoryGlobalTokenConfig: TokenCurrencyConfig = { ...DEFAULT_GLOBAL_TOKEN_CONFIG };
const memoryInstitutionTokenConfigs: Record<string, TokenCurrencyConfig> = {};

/**
 * Persists token currency configuration (Global Superadmin or Institution Director).
 */
export async function saveTokenConfig(config: TokenCurrencyConfig) {
  if (config.scope === 'GLOBAL') {
    memoryGlobalTokenConfig = { ...config, updatedAt: new Date().toISOString() };
    if (isFirebaseConfigured) {
      await db.collection('settings').doc('token_currency_global').set({
        ...memoryGlobalTokenConfig,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  } else if (config.institutionId) {
    memoryInstitutionTokenConfigs[config.institutionId] = { ...config, updatedAt: new Date().toISOString() };
    if (isFirebaseConfigured) {
      await db.collection('institution_token_settings').doc(config.institutionId).set({
        ...config,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
  return { success: true, config };
}

/**
 * Retrieves the effective token currency configuration for an institution or global.
 */
export async function getTokenConfig(institutionId?: string): Promise<TokenCurrencyConfig> {
  if (institutionId) {
    if (isFirebaseConfigured) {
      try {
        const snap = await db.collection('institution_token_settings').doc(institutionId).get();
        if (snap.exists) {
          return snap.data() as TokenCurrencyConfig;
        }
      } catch (e) {
        // Fallback to memory or global
      }
    }
    if (memoryInstitutionTokenConfigs[institutionId]) {
      return memoryInstitutionTokenConfigs[institutionId];
    }
  }

  // Global default
  if (isFirebaseConfigured) {
    try {
      const snap = await db.collection('settings').doc('token_currency_global').get();
      if (snap.exists) {
        return snap.data() as TokenCurrencyConfig;
      }
    } catch (e) {
      // Fallback
    }
  }

  return memoryGlobalTokenConfig;
}

function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = cleanUndefined(v);
      }
    }
    return clean;
  }
  return obj;
}

export async function recordActivity(event: {
  category: string;
  action: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  databaseCode?: string;
  systemId?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  userAgent?: string;
  ip?: string;
}) {
  if (!isFirebaseConfigured) {
    return { success: true, logId: 'local-log-unconfigured' };
  }
  try {
    const eventTime = event.timestamp ? new Date(event.timestamp) : new Date();
    const docData = cleanUndefined({
      databaseCode: 'super-rto',
      systemId: 'super-rto',
      ...event,
      timestamp: eventTime.toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    });

    const logRef = await db.collection('activity_logs').add(docData);

    const metricsRef = db.collection('metrics').doc('platform_stats');
    const updatePayload: Record<string, any> = {
      totalEvents: FieldValue.increment(1),
      [`categories.${event.category}`]: FieldValue.increment(1),
      lastEventAt: FieldValue.serverTimestamp(),
      lastAction: event.action,
    };
    if (event.userEmail) {
      updatePayload.lastActiveUser = event.userEmail;
    }
    await metricsRef.set(updatePayload, { merge: true });

    return { success: true, logId: logRef.id };
  } catch (error) {
    console.warn('[recordActivity] Firestore write failed:', error);
    return { success: false, error };
  }
}

export async function getRecentActivityLogs(limitCount = 40) {
  if (!isFirebaseConfigured) {
    return [];
  }
  try {
    const snapshot = await db.collection('activity_logs')
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();
    
    const logs: any[] = [];
    snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
    return logs;
  } catch (error) {
    console.warn('[getRecentActivityLogs] Fallback sort:', error);
    try {
      const snapshot = await db.collection('activity_logs').limit(limitCount).get();
      const logs: any[] = [];
      snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
      logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      return logs;
    } catch {
      return [];
    }
  }
}

export async function saveApplicationToFirestore(appData: any) {
  if (!isFirebaseConfigured) {
    return { success: true, id: appData?.id || 'local-app' };
  }
  try {
    if (!appData?.id) return { success: false, error: 'No application ID' };

    const docRef = db.collection('applications').doc(appData.id);
    await docRef.set(
      {
        databaseCode: 'super-rto',
        systemId: 'super-rto',
        ...appData,
        savedToFirestoreAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await recordActivity({
      category: 'APPLICATION',
      action: appData.status === 'Submitted' ? 'APPLICATION_SUBMITTED' : 'APPLICATION_UPDATED',
      userEmail: appData.personalDetails?.email,
      userId: appData.id,
      metadata: {
        applicationId: appData.id,
        applicantName: appData.personalDetails?.fullName,
        degree: appData.coursePreferences?.firstChoiceCourseName,
        degreeCode: appData.coursePreferences?.firstChoiceCourseId,
        status: appData.status,
      },
    });

    return { success: true, id: appData.id };
  } catch (error) {
    console.error('[saveApplicationToFirestore] Error:', error);
    return { success: false, error };
  }
}

export async function getApplicationsFromFirestore() {
  if (!isFirebaseConfigured) {
    return [];
  }
  try {
    const snapshot = await db.collection('applications').orderBy('updatedAt', 'desc').get();
    if (!snapshot.empty) {
      const apps: any[] = [];
      snapshot.forEach(doc => apps.push({ ...doc.data(), id: doc.id }));
      return apps;
    }
    return [];
  } catch (error) {
    console.warn('[getApplicationsFromFirestore] Fallback:', error);
    return [];
  }
}
