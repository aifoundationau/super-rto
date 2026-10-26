'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, RefreshCw, Search, AlertCircle, GraduationCap, Clock } from 'lucide-react';
import { authenticatedFetch } from '@/lib/firebase/client';
import { SYSTEM_ROLES, getRoleMeta, type SystemRole } from '@/lib/auth/roles';

interface StudentCheckRow {
  uid: string | null;
  name: string;
  email: string;
  role: SystemRole | null;
  lastLoginAt: string | null;
  courses: {
    courseCode: string;
    courseTitle: string;
    units: { unitCode: string; unitTitle: string; status: string }[];
  }[];
  unitCount: number;
}

type Filter = 'all' | 'not_enrolled' | 'enrolled';

const LIMITED_ROLES: SystemRole[] = ['student', 'supporter'];

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export const StudentCheckView: React.FC = () => {
  const [students, setStudents] = useState<StudentCheckRow[]>([]);
  const [canAssignAnyRole, setCanAssignAnyRole] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [draftRoles, setDraftRoles] = useState<Record<string, SystemRole>>({});
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await authenticatedFetch('/api/admin/student-check');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setStudents(Array.isArray(data.students) ? data.students : []);
      setCanAssignAnyRole(data.canAssignAnyRole === true);
      setDraftRoles({});
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const notEnrolledCount = students.filter((s) => s.unitCount === 0).length;

  const visibleStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (filter === 'not_enrolled' && s.unitCount > 0) return false;
      if (filter === 'enrolled' && s.unitCount === 0) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.includes(q) ||
        s.courses.some((c) => c.courseCode.toLowerCase().includes(q) || c.units.some((u) => u.unitCode.toLowerCase().includes(q)))
      );
    });
  }, [students, filter, search]);

  const roleOptions: readonly SystemRole[] = canAssignAnyRole ? SYSTEM_ROLES : LIMITED_ROLES;

  const handleUpdateRole = async (row: StudentCheckRow) => {
    const newRole = row.uid ? draftRoles[row.uid] : undefined;
    if (!row.uid || !newRole || newRole === row.role) return;

    setSavingUid(row.uid);
    setFeedback(null);
    try {
      const res = await authenticatedFetch('/api/admin/student-check', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: row.uid, role: newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

      setStudents((prev) => prev.map((s) => (s.uid === row.uid ? { ...s, role: newRole } : s)));
      setDraftRoles((prev) => {
        const next = { ...prev };
        delete next[row.uid as string];
        return next;
      });
      setFeedback({ type: 'success', text: `${row.name} is now ${getRoleMeta(newRole).label}.` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: `Could not update ${row.name}: ${err.message}` });
    } finally {
      setSavingUid(null);
    }
  };

  const filterButton = (id: Filter, label: string, count: number, activeClass: string) => (
    <button
      type="button"
      onClick={() => setFilter(id)}
      data-testid={`student-check-filter-${id}`}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
        filter === id ? activeClass : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
      }`}
    >
      {label} <span className="opacity-75">({count})</span>
    </button>
  );

  return (
    <div
      data-agent-id="student-check-view"
      data-testid="student-check-view"
      className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-2xl shadow-md">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">Student Check</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Every student account and the courses and units they are enrolled in
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={isLoading}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        Roles also follow enrolment automatically at sign-in: an enrolled Supporter becomes a Student, and a Student
        with no enrolment returns to Supporter.
        {!canAssignAnyRole && ' Your role can switch accounts between Student and Supporter only.'}
      </p>

      {loadError ? (
        <div className="flex items-start gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {filterButton('all', 'All', students.length, 'bg-indigo-600 text-white border-indigo-600')}
              {filterButton('not_enrolled', 'Not enrolled', notEnrolledCount, 'bg-rose-600 text-white border-rose-600')}
              {filterButton('enrolled', 'Enrolled', students.length - notEnrolledCount, 'bg-emerald-600 text-white border-emerald-600')}
            </div>
            <div className="relative sm:ml-auto sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, course or unit"
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`text-xs rounded-xl px-3 py-2 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {isLoading && students.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Loading students…</p>
          ) : visibleStudents.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No students match this view.</p>
          ) : (
            <ul className="space-y-3">
              {visibleStudents.map((s) => {
                const notEnrolled = s.unitCount === 0;
                const roleMeta = s.role ? getRoleMeta(s.role) : null;
                const draft = s.uid ? draftRoles[s.uid] : undefined;
                const selectedRole = draft || s.role || 'supporter';
                // A limited caller cannot touch accounts that already hold a staff role.
                const canEditRole = Boolean(s.uid) && (canAssignAnyRole || (s.role !== null && LIMITED_ROLES.includes(s.role)));

                return (
                  <li
                    key={s.uid || s.email}
                    data-testid={notEnrolled ? 'student-check-row-not-enrolled' : 'student-check-row'}
                    className={`rounded-2xl border p-4 space-y-3 ${
                      notEnrolled ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`font-extrabold text-sm break-words ${notEnrolled ? 'text-rose-900' : 'text-slate-900'}`}>
                          {s.name}
                        </div>
                        <div className="text-xs font-mono text-slate-600 break-all">{s.email}</div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last sign-in: {s.uid ? formatDate(s.lastLoginAt) : 'Never (no account yet)'}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {roleMeta && (
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide border ${roleMeta.badgeBg} ${roleMeta.badgeText} ${roleMeta.badgeBorder}`}>
                            {roleMeta.label}
                          </span>
                        )}
                        {notEnrolled ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-600 text-white">
                            Not enrolled in any course
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {s.unitCount} unit{s.unitCount === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </div>

                    {s.courses.length > 0 && (
                      <div className="space-y-2">
                        {s.courses.map((c) => (
                          <div key={c.courseCode} className="text-xs">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="font-mono text-indigo-700">{c.courseCode}</span>
                              <span className="break-words">{c.courseTitle}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5 pl-5">
                              {c.units.map((u) => (
                                <span
                                  key={u.unitCode}
                                  title={`${u.unitTitle} (${u.status})`}
                                  className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-700"
                                >
                                  <span className="font-mono font-bold">{u.unitCode}</span> · {u.status}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!notEnrolled && s.role && s.role !== 'student' && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                        Enrolled, but their role is {roleMeta?.label}.
                      </p>
                    )}

                    {s.uid ? (
                      canEditRole && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/70">
                          <label className="text-[11px] font-bold text-slate-600" htmlFor={`role-${s.uid}`}>
                            Change role
                          </label>
                          <select
                            id={`role-${s.uid}`}
                            value={selectedRole}
                            onChange={(e) => setDraftRoles((prev) => ({ ...prev, [s.uid as string]: e.target.value as SystemRole }))}
                            className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                          >
                            {roleOptions.map((r) => (
                              <option key={r} value={r}>
                                {getRoleMeta(r).label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!draft || draft === s.role || savingUid === s.uid}
                            onClick={() => handleUpdateRole(s)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            {savingUid === s.uid ? 'Updating…' : 'Update role'}
                          </button>
                        </div>
                      )
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        Hasn't signed in yet. They become a Student automatically at their first sign-in.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
};
