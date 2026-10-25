import { NextRequest, NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase/admin';
import {
  SYSTEM_ROLES,
  normalizeRole,
  isValidRole,
  type SystemRole
} from '@/lib/auth/roles';
import {
  SYSTEM_PERMISSIONS,
  ALL_PERMISSION_IDS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CATEGORIES
} from '@/lib/auth/permissions';
import { requireSuperAdminCaller } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/permissions
 * Fetches all active role permissions from Firestore /roles collection (with baseline fallback).
 */
export async function GET() {
  try {
    const rolePermissions: Record<string, string[]> = { ...DEFAULT_ROLE_PERMISSIONS };
    const customRolesList: Array<{ id: string; name: string; permissions: string[] }> = [];

    if (isFirebaseConfigured) {
      try {
        // Query the canonical /roles collection
        const snapshot = await db.collection('roles').get();
        if (!snapshot.empty) {
          snapshot.forEach((doc: any) => {
            const roleKey = doc.id.toLowerCase().trim();
            const data = doc.data();
            if (data && Array.isArray(data.permissions)) {
              if (roleKey === 'superadmin') {
                rolePermissions.superadmin = [...ALL_PERMISSION_IDS];
              } else {
                rolePermissions[roleKey] = data.permissions;
              }
              customRolesList.push({
                id: roleKey,
                name: data.roleName || roleKey.toUpperCase(),
                permissions: rolePermissions[roleKey],
              });
            }
          });
        } else {
          // Fallback to legacy role_permissions if /roles is empty
          const legacySnap = await db.collection('role_permissions').get();
          if (!legacySnap.empty) {
            legacySnap.forEach((doc: any) => {
              const roleKey = normalizeRole(doc.id);
              const data = doc.data();
              if (data && Array.isArray(data.permissions)) {
                if (roleKey === 'superadmin') {
                  rolePermissions.superadmin = [...ALL_PERMISSION_IDS];
                } else {
                  rolePermissions[roleKey] = data.permissions;
                }
              }
            });
          }
        }
      } catch (dbErr) {
        console.warn('Firestore fetch for /roles failed, using defaults:', dbErr);
      }
    }

    return NextResponse.json({
      rolePermissions,
      availablePermissions: SYSTEM_PERMISSIONS,
      categories: PERMISSION_CATEGORIES,
      roles: SYSTEM_ROLES,
      customRoles: customRolesList,
    });
  } catch (err: any) {
    console.error('Error fetching role permissions:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch permissions' }, { status: 500 });
  }
}

/**
 * POST /api/permissions
 * Updates permissions for a specific role or multiple roles in /roles collection.
 * Supports creating new custom roles at any time.
 */
export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireSuperAdminCaller(req);
    if ('errorResponse' in authCheck) {
      return authCheck.errorResponse;
    }

    const body = await req.json();
    const now = new Date().toISOString();

    // 1. Single Role Update or Creation
    if (body.role) {
      const targetRole = body.role.toLowerCase().trim();
      const roleName = body.roleName || (targetRole.charAt(0).toUpperCase() + targetRole.slice(1));

      if (targetRole === 'superadmin') {
        // Superadmin retains all permissions
        return NextResponse.json({
          success: true,
          role: 'superadmin',
          permissions: ALL_PERMISSION_IDS,
          message: 'Superadmin permissions are permanently locked to full system access.'
        });
      }

      const rawPerms = Array.isArray(body.permissions) ? body.permissions : [];
      const validPerms = rawPerms.filter((p: string) => ALL_PERMISSION_IDS.includes(p));

      try {
        // Save to canonical /roles collection
        await db.collection('roles').doc(targetRole).set(
          {
            roleName,
            roleId: targetRole,
            permissions: validPerms,
            updatedAt: now,
            isSystemRole: isValidRole(targetRole),
            tenantTag: 'super-rto',
            databaseCode: 'super-rto'
          },
          { merge: true }
        );

        // Also mirror to legacy /role_permissions for backward compatibility
        await db.collection('role_permissions').doc(targetRole).set(
          {
            role: targetRole,
            permissions: validPerms,
            updatedAt: now,
            tenantTag: 'super-rto',
            databaseCode: 'super-rto'
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn(`Firestore save for role "${targetRole}" failed:`, dbErr);
      }

      return NextResponse.json({
        success: true,
        role: targetRole,
        roleName,
        permissions: validPerms,
        updatedAt: now,
        message: `Successfully saved permissions for role "${roleName}" (${targetRole}).`
      });
    }

    // 2. Bulk Role Permissions Update
    if (body.rolePermissions && typeof body.rolePermissions === 'object') {
      const updatedMap: Record<string, string[]> = {};

      for (const [r, perms] of Object.entries(body.rolePermissions)) {
        const norm = r.toLowerCase().trim();
        if (norm === 'superadmin') {
          updatedMap.superadmin = [...ALL_PERMISSION_IDS];
          continue;
        }

        if (Array.isArray(perms)) {
          const valid = perms.filter((p) => ALL_PERMISSION_IDS.includes(p));
          updatedMap[norm] = valid;

          try {
            await db.collection('roles').doc(norm).set(
              {
                roleName: norm.charAt(0).toUpperCase() + norm.slice(1),
                roleId: norm,
                permissions: valid,
                updatedAt: now,
                isSystemRole: isValidRole(norm),
                tenantTag: 'super-rto',
                databaseCode: 'super-rto'
              },
              { merge: true }
            );

            await db.collection('role_permissions').doc(norm).set(
              {
                role: norm,
                permissions: valid,
                updatedAt: now,
                tenantTag: 'super-rto',
                databaseCode: 'super-rto'
              },
              { merge: true }
            );
          } catch (dbErr) {
            console.warn(`Firestore bulk save for role "${norm}" failed:`, dbErr);
          }
        }
      }

      return NextResponse.json({
        success: true,
        rolePermissions: updatedMap,
        updatedAt: now,
        message: `Successfully updated bulk permissions across ${Object.keys(updatedMap).length} roles.`
      });
    }

    return NextResponse.json(
      { error: 'Invalid request body. Expected "role" or "rolePermissions".' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Error in /api/permissions POST:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update permissions' },
      { status: 500 }
    );
  }
}
