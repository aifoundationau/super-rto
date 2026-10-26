import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedCaller } from '@/lib/auth/serverAuth';
import { getNotificationsForEmail, markNotificationsRead } from '@/lib/enrolments/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications
 * Returns the verified caller's most recent in-app notifications.
 */
export async function GET(req: NextRequest) {
  const authCheck = await requireAuthenticatedCaller(req);
  if ('errorResponse' in authCheck) return authCheck.errorResponse;

  try {
    const notifications = await getNotificationsForEmail(authCheck.caller.email);
    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (err: any) {
    console.error('[GET /api/notifications]', err);
    return NextResponse.json({ error: err.message || 'Failed to load notifications' }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * { ids?: string[] } marks those notifications (or all when omitted) as read.
 */
export async function PATCH(req: NextRequest) {
  const authCheck = await requireAuthenticatedCaller(req);
  if ('errorResponse' in authCheck) return authCheck.errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids) ? body.ids : undefined;
    const marked = await markNotificationsRead(authCheck.caller.email, ids);
    return NextResponse.json({ success: true, marked });
  } catch (err: any) {
    console.error('[PATCH /api/notifications]', err);
    return NextResponse.json({ error: err.message || 'Failed to update notifications' }, { status: 500 });
  }
}
