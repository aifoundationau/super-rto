import React, { useState, useEffect, useMemo } from 'react';
import { GraduationCap, RefreshCw } from 'lucide-react';
import { authenticatedFetch } from '@/lib/firebase/client';
import type { StudentEnrolmentStatus } from '@/lib/courseBuilder/studentEnrolment';

interface EnrolmentRow {
  id: string;
  courseCode: string;
  courseTitle: string;
  unitCode: string;
  unitTitle: string;
  status: StudentEnrolmentStatus;
  enrolledAt: string;
}

const STATUS_BADGE: Record<StudentEnrolmentStatus, string> = {
  Enrolled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Competent: 'bg-purple-50 text-purple-700 border-purple-200',
  Deferred: 'bg-amber-50 text-amber-700 border-amber-200',
  Withdrawn: 'bg-rose-50 text-rose-700 border-rose-200',
};

/**
 * Lists the signed-in user's server-side course/unit enrolments. Renders nothing when there are none.
 */
export const MyEnrolmentsPanel: React.FC = () => {
  const [enrolments, setEnrolments] = useState<EnrolmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch('/api/enrolments');
      if (res.ok) {
        const data = await res.json();
        setEnrolments(Array.isArray(data.enrolments) ? data.enrolments : []);
      }
    } catch (err) {
      console.warn('Failed to load enrolments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const byCourse = useMemo(() => {
    const groups = new Map<string, { courseTitle: string; units: EnrolmentRow[] }>();
    enrolments.forEach((e) => {
      const group = groups.get(e.courseCode) || { courseTitle: e.courseTitle, units: [] };
      group.units.push(e);
      groups.set(e.courseCode, group);
    });
    return Array.from(groups.entries());
  }, [enrolments]);

  if (!isLoading && enrolments.length === 0) return null;

  return (
    <div data-testid="my-enrolments-panel" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div>
            <h4 className="font-extrabold text-slate-900 text-base">My Enrolments</h4>
            <p className="text-[11px] text-slate-500">Courses and units you have been enrolled in</p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={isLoading}
          aria-label="Refresh enrolments"
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading && enrolments.length === 0 ? (
        <p className="text-xs text-slate-500">Loading your enrolments…</p>
      ) : (
        byCourse.map(([courseCode, group]) => (
          <div key={courseCode} className="space-y-2">
            <p className="text-xs font-bold text-slate-700">
              <span className="font-mono text-indigo-700">{courseCode}</span> · {group.courseTitle}
            </p>
            <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {group.units.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                  <span className="min-w-0 text-xs text-slate-800">
                    <span className="font-mono font-bold">{u.unitCode}</span> – {u.unitTitle}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[u.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                    {u.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};
