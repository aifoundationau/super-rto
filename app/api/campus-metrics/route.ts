import { NextRequest, NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase/admin';
import { requireAdministrationOrSuperAdminCaller } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

export interface CampusMetricsData {
  heroBadgeText?: string;
  // Box 1: Total Students
  totalStudents: string;
  studentsTitle?: string;
  studentsSubtitle?: string;
  showTotalStudents?: boolean;
  // Box 2: Placement Rate
  placementRate: string;
  placementTitle?: string;
  placementSubtitle?: string;
  showPlacementRate?: boolean;
  // Box 3: Faculty & Staff
  facultyStaff: string;
  facultyTitle?: string;
  facultySubtitle?: string;
  showFacultyStaff?: boolean;
  // Box 4: Online Courses (NEW)
  onlineCourses: string;
  onlineCoursesTitle?: string;
  onlineCoursesSubtitle?: string;
  showOnlineCourses?: boolean;
  // Box 5: Community Courses (NEW)
  communityCourses: string;
  communityCoursesTitle?: string;
  communityCoursesSubtitle?: string;
  showCommunityCourses?: boolean;
  // Severe Emergency Update (Weather / Environmental Hazard)
  emergencyAlert?: string;
  emergencyTitle?: string;
  emergencyActive?: boolean;
  emergencySeverity?: 'critical' | 'severe' | 'warning';
  emergencyUpdatedAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_CAMPUS_METRICS: CampusMetricsData = {
  heroBadgeText: 'Your Future is Now • Powered by Gemini',
  // Box 1
  totalStudents: '5,000+',
  studentsTitle: 'Total Students',
  studentsSubtitle: 'Active learners across all faculties',
  showTotalStudents: true,
  // Box 2
  placementRate: '96%',
  placementTitle: 'Graduate Placement',
  placementSubtitle: 'Graduate employment within 90 days',
  showPlacementRate: true,
  // Box 3
  facultyStaff: '350+',
  facultyTitle: 'Faculty & Staff',
  facultySubtitle: 'Academic educators & operational staff',
  showFacultyStaff: true,
  // Box 4
  onlineCourses: '120+',
  onlineCoursesTitle: 'Online Courses',
  onlineCoursesSubtitle: 'Flexible remote & self-paced credential pathways',
  showOnlineCourses: true,
  // Box 5
  communityCourses: '45+',
  communityCoursesTitle: 'Community Courses',
  communityCoursesSubtitle: 'Regional outreach & adult vocational learning',
  showCommunityCourses: true,
  // Emergency
  emergencyAlert: '',
  emergencyTitle: '',
  emergencyActive: false,
  emergencySeverity: 'severe',
  emergencyUpdatedAt: '',
};

// In-memory runtime cache for high-speed local updates
let runtimeCache: CampusMetricsData = { ...DEFAULT_CAMPUS_METRICS };

export async function GET() {
  if (!isFirebaseConfigured) {
    return NextResponse.json({
      success: true,
      metrics: runtimeCache,
      source: 'memory_fallback',
    });
  }
  try {
    try {
      const docSnap = await db.collection('site_settings').doc('campus_metrics').get();
      if (docSnap.exists) {
        const data = docSnap.data() as CampusMetricsData;
        runtimeCache = {
          ...DEFAULT_CAMPUS_METRICS,
          ...data,
        };
        return NextResponse.json({
          success: true,
          metrics: runtimeCache,
          source: 'firestore',
        });
      }
    } catch (dbErr: any) {
      console.warn('[/api/campus-metrics GET] Firestore read fallback:', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      metrics: runtimeCache,
      source: 'memory_fallback',
    });
  } catch (err: any) {
    console.error('[/api/campus-metrics GET] Error:', err);
    return NextResponse.json({
      success: true,
      metrics: runtimeCache,
      error: err.message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      heroBadgeText,
      totalStudents,
      studentsTitle,
      studentsSubtitle,
      showTotalStudents,
      placementRate,
      placementTitle,
      placementSubtitle,
      showPlacementRate,
      facultyStaff,
      facultyTitle,
      facultySubtitle,
      showFacultyStaff,
      onlineCourses,
      onlineCoursesTitle,
      onlineCoursesSubtitle,
      showOnlineCourses,
      communityCourses,
      communityCoursesTitle,
      communityCoursesSubtitle,
      showCommunityCourses,
      emergencyAlert,
      emergencyTitle,
      emergencyActive,
      emergencySeverity,
    } = body;

    // RBAC check: only administration and superadmin can modify campus metrics
    let updatedBy = 'system_admin';
    const authResult = await requireAdministrationOrSuperAdminCaller(req);
    if ('errorResponse' in authResult) {
      // In development mode without active auth headers, allow graceful admin fallback with warning
      if (process.env.NODE_ENV === 'development' && !req.headers.get('authorization')) {
        console.warn('[/api/campus-metrics POST] Dev mode: bypassing token check.');
        updatedBy = 'dev_admin';
      } else {
        return authResult.errorResponse;
      }
    } else {
      updatedBy = authResult.caller.email || authResult.caller.role;
    }

    const hasEmergencyContent = typeof emergencyAlert === 'string' && emergencyAlert.trim().length > 0;
    const isEmergencyActive = Boolean(emergencyActive && hasEmergencyContent);

    const updatedMetrics: CampusMetricsData = {
      heroBadgeText: heroBadgeText !== undefined ? heroBadgeText.trim() : (runtimeCache.heroBadgeText || 'Your Future is Now • Powered by Gemini'),
      // Box 1: Total Students
      totalStudents: totalStudents?.trim() || runtimeCache.totalStudents || '5,000+',
      studentsTitle: studentsTitle?.trim() || runtimeCache.studentsTitle || 'Total Students',
      studentsSubtitle: studentsSubtitle?.trim() || runtimeCache.studentsSubtitle || 'Active learners across all faculties',
      showTotalStudents: showTotalStudents !== undefined ? Boolean(showTotalStudents) : (runtimeCache.showTotalStudents ?? true),
      // Box 2: Placement Rate
      placementRate: placementRate?.trim() || runtimeCache.placementRate || '96%',
      placementTitle: placementTitle?.trim() || runtimeCache.placementTitle || 'Graduate Placement',
      placementSubtitle: placementSubtitle?.trim() || runtimeCache.placementSubtitle || 'Graduate employment within 90 days',
      showPlacementRate: showPlacementRate !== undefined ? Boolean(showPlacementRate) : (runtimeCache.showPlacementRate ?? true),
      // Box 3: Faculty & Staff
      facultyStaff: facultyStaff?.trim() || runtimeCache.facultyStaff || '350+',
      facultyTitle: facultyTitle?.trim() || runtimeCache.facultyTitle || 'Faculty & Staff',
      facultySubtitle: facultySubtitle?.trim() || runtimeCache.facultySubtitle || 'Academic educators & operational staff',
      showFacultyStaff: showFacultyStaff !== undefined ? Boolean(showFacultyStaff) : (runtimeCache.showFacultyStaff ?? true),
      // Box 4: Online Courses
      onlineCourses: onlineCourses?.trim() || runtimeCache.onlineCourses || '120+',
      onlineCoursesTitle: onlineCoursesTitle?.trim() || runtimeCache.onlineCoursesTitle || 'Online Courses',
      onlineCoursesSubtitle: onlineCoursesSubtitle?.trim() || runtimeCache.onlineCoursesSubtitle || 'Flexible remote & self-paced credential pathways',
      showOnlineCourses: showOnlineCourses !== undefined ? Boolean(showOnlineCourses) : (runtimeCache.showOnlineCourses ?? true),
      // Box 5: Community Courses
      communityCourses: communityCourses?.trim() || runtimeCache.communityCourses || '45+',
      communityCoursesTitle: communityCoursesTitle?.trim() || runtimeCache.communityCoursesTitle || 'Community Courses',
      communityCoursesSubtitle: communityCoursesSubtitle?.trim() || runtimeCache.communityCoursesSubtitle || 'Regional outreach & adult vocational learning',
      showCommunityCourses: showCommunityCourses !== undefined ? Boolean(showCommunityCourses) : (runtimeCache.showCommunityCourses ?? true),
      // Emergency
      emergencyAlert: typeof emergencyAlert === 'string' ? emergencyAlert.trim() : (runtimeCache.emergencyAlert || ''),
      emergencyTitle: typeof emergencyTitle === 'string' ? emergencyTitle.trim() : (runtimeCache.emergencyTitle || ''),
      emergencyActive: isEmergencyActive,
      emergencySeverity: emergencySeverity || runtimeCache.emergencySeverity || 'severe',
      emergencyUpdatedAt: isEmergencyActive ? (runtimeCache.emergencyActive && runtimeCache.emergencyAlert === emergencyAlert?.trim() && runtimeCache.emergencyUpdatedAt ? runtimeCache.emergencyUpdatedAt : new Date().toISOString()) : '',
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    runtimeCache = { ...updatedMetrics };

    try {
      await db.collection('site_settings').doc('campus_metrics').set(updatedMetrics, { merge: true });
    } catch (dbErr: any) {
      console.warn('[/api/campus-metrics POST] Firestore write warning:', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      metrics: updatedMetrics,
      message: 'Campus metrics updated successfully.',
    });
  } catch (err: any) {
    console.error('[/api/campus-metrics POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update campus metrics' },
      { status: 500 }
    );
  }
}
