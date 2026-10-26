import React, { useState, useRef, useMemo } from 'react';
import {
  Users,
  UserPlus,
  UploadCloud,
  Download,
  Search,
  Check,
  Trash2,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  X,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  Clock
} from 'lucide-react';
import type { CourseUnit } from '@/lib/courseBuilder/units';
import {
  UnitEnrolledStudent,
  RegisteredStudentCandidate,
  StudentEnrolmentStatus,
  KNOWN_STUDENT_CANDIDATES,
  generateStudentEnrolmentTemplateCsv,
  parseStudentEnrolmentCsv,
  exportStudentsToCsv,
  addStudentToUnit,
  removeStudentFromUnit
} from '@/lib/courseBuilder/studentEnrolment';
import { syncEnrolledStudents, syncRemovedStudent, type EnrolmentSyncResult } from '@/lib/courseBuilder/enrolmentSync';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACEHOLDER_EMAIL_DOMAIN = '@student.rto.edu.au';

// A typed email address is used as-is; any other write-in name gets a placeholder address.
function deriveEmailFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  if (EMAIL_PATTERN.test(trimmed)) return trimmed.toLowerCase();
  return `${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '.')}${PLACEHOLDER_EMAIL_DOMAIN}`;
}

interface UnitStudentEnrolmentPanelProps {
  courseCode: string;
  courseTitle: string;
  unit: CourseUnit;
  allUnits: CourseUnit[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onUpdateUnit: (updatedUnit: CourseUnit) => void;
  onBulkUpdateUnits?: (updatedUnits: CourseUnit[]) => void;
}

export const UnitStudentEnrolmentPanel: React.FC<UnitStudentEnrolmentPanelProps> = ({
  courseCode,
  courseTitle,
  unit,
  allUnits,
  isCollapsed,
  onToggleCollapse,
  onUpdateUnit,
  onBulkUpdateUnits
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isPanelCollapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Add Student Dropdown / Write-in state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [writeInName, setWriteInName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  // True once the user types in the Email field; until then it follows the Name field.
  const [isEmailEdited, setIsEmailEdited] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [enrolmentStatus, setEnrolmentStatus] = useState<StudentEnrolmentStatus>('Enrolled');
  const [targetScope, setTargetScope] = useState<'current_unit' | 'all_units'>('current_unit');
  const [selectedCandidate, setSelectedCandidate] = useState<RegisteredStudentCandidate | null>(null);

  // CSV State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvStatusMessage, setCsvStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Two-step Deletion State (Confirm Delete Gate)
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  const enrolledStudents = unit.enrolledStudents || [];

  const unitTitles = useMemo(() => {
    const map: Record<string, string> = {};
    [...allUnits, unit].forEach((u) => {
      map[u.unitCode.toUpperCase()] = u.unitTitle;
    });
    return map;
  }, [allUnits, unit]);

  // Local change is already applied; report the server sync (notifications, email, role) once it finishes.
  const reportServerSync = async (localText: string, sync: () => Promise<EnrolmentSyncResult>) => {
    setCsvStatusMessage({ type: 'info', text: `${localText} Syncing with student accounts…` });
    const result = await sync();
    setCsvStatusMessage({ type: result.ok ? 'success' : 'error', text: `${localText} ${result.summary}` });
  };

  // Filter known candidates based on write-in query
  const matchingCandidates = useMemo(() => {
    if (!writeInName.trim()) return KNOWN_STUDENT_CANDIDATES;
    const q = writeInName.toLowerCase();
    return KNOWN_STUDENT_CANDIDATES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.studentId.toLowerCase().includes(q)
    );
  }, [writeInName]);

  // Filter enrolled students in active unit
  const filteredStudents = useMemo(() => {
    return enrolledStudents.filter((s) => {
      const matchesSearch =
        !searchQuery.trim() ||
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.studentId || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || s.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [enrolledStudents, searchQuery, statusFilter]);

  // Handle Candidate Selection from Dropdown
  const handleSelectCandidate = (candidate: RegisteredStudentCandidate) => {
    setSelectedCandidate(candidate);
    setWriteInName(candidate.name);
    setStudentEmail(candidate.email);
    setIsEmailEdited(false);
    setStudentId(candidate.studentId);
    setIsDropdownOpen(false);
  };

  // Handle Manual Typing in Dropdown
  const handleWriteInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setWriteInName(val);
    setSelectedCandidate(null);
    setIsDropdownOpen(true);
    if (!isEmailEdited) {
      setStudentEmail(deriveEmailFromName(val));
    }
  };

  // Add / Enrol Student
  const handleAddStudent = () => {
    if (!writeInName.trim()) {
      setCsvStatusMessage({
        type: 'error',
        text: 'Please enter or select a student name.'
      });
      return;
    }

    const payload = {
      studentName: writeInName.trim(),
      studentEmail: studentEmail.trim().toLowerCase() || deriveEmailFromName(writeInName),
      studentId: studentId.trim() || `STU-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      courseCode,
      status: enrolmentStatus
    };

    let addedStudents: UnitEnrolledStudent[];
    let localText: string;
    if (targetScope === 'all_units' && onBulkUpdateUnits && allUnits.length > 0) {
      addedStudents = [];
      const updatedUnits = allUnits.map((u) => {
        const { updatedUnit, newStudent } = addStudentToUnit(u, {
          ...payload,
          courseCode
        });
        addedStudents.push(newStudent);
        return updatedUnit;
      });
      onBulkUpdateUnits(updatedUnits);
      localText = `Enrolled "${payload.studentName}" into all ${allUnits.length} course units.`;
    } else {
      const { updatedUnit, newStudent } = addStudentToUnit(unit, payload);
      onUpdateUnit(updatedUnit);
      addedStudents = [newStudent];
      localText = `Enrolled "${payload.studentName}" into ${unit.unitCode}.`;
    }
    if (payload.studentEmail.endsWith(PLACEHOLDER_EMAIL_DOMAIN)) {
      localText += ` Warning: no real email was entered, so ${payload.studentName} won't see this in their account.`;
    }
    reportServerSync(localText, () => syncEnrolledStudents(addedStudents, courseCode, courseTitle, unitTitles));

    // Reset Form
    setWriteInName('');
    setStudentEmail('');
    setIsEmailEdited(false);
    setStudentId('');
    setSelectedCandidate(null);
    setIsDropdownOpen(false);
  };

  // Confirm Removal of Student
  const handleConfirmRemove = (idToRemove: string) => {
    const { updatedUnit, removedStudent } = removeStudentFromUnit(unit, idToRemove);
    onUpdateUnit(updatedUnit);
    setDeletingStudentId(null);
    const localText = `Removed "${removedStudent?.studentName || 'Student'}" from ${unit.unitCode}.`;
    if (removedStudent) {
      reportServerSync(localText, () => syncRemovedStudent(removedStudent, courseCode));
    } else {
      setCsvStatusMessage({ type: 'info', text: localText });
    }
  };

  // Download CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = generateStudentEnrolmentTemplateCsv(courseCode, unit.unitCode);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${unit.unitCode}_Student_Enrolment_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Current Enrolled Students
  const handleExportStudents = () => {
    const csvContent = exportStudentsToCsv(enrolledStudents, courseTitle);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${unit.unitCode}_Enrolled_Students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const { students: importedStudents, errors } = parseStudentEnrolmentCsv(
        text,
        courseCode,
        unit.unitCode
      );

      if (errors.length > 0 && importedStudents.length === 0) {
        setCsvStatusMessage({
          type: 'error',
          text: `CSV Import Failed: ${errors.join(', ')}`
        });
        return;
      }

      // Group students by unit code or assign to current unit
      const unitCodeUpper = unit.unitCode.toUpperCase();
      const currentUnitImports = importedStudents.filter(
        (s) => !s.unitCode || s.unitCode.toUpperCase() === unitCodeUpper
      );
      const otherUnitImports = importedStudents.filter(
        (s) => s.unitCode && s.unitCode.toUpperCase() !== unitCodeUpper
      );

      let updatedActiveUnit = { ...unit };
      currentUnitImports.forEach((s) => {
        const res = addStudentToUnit(updatedActiveUnit, s);
        updatedActiveUnit = res.updatedUnit;
      });

      let appliedImports = currentUnitImports;
      if (otherUnitImports.length > 0 && onBulkUpdateUnits && allUnits.length > 0) {
        const courseUnitCodes = new Set(allUnits.map((u) => u.unitCode.toUpperCase()));
        appliedImports = importedStudents.filter(
          (s) => !s.unitCode || courseUnitCodes.has(s.unitCode.toUpperCase())
        );
        const updatedAll = allUnits.map((u) => {
          if (u.unitCode.toUpperCase() === unitCodeUpper) {
            return updatedActiveUnit;
          }
          const matchingForThisUnit = otherUnitImports.filter(
            (s) => s.unitCode.toUpperCase() === u.unitCode.toUpperCase()
          );
          let temp = { ...u };
          matchingForThisUnit.forEach((s) => {
            const res = addStudentToUnit(temp, s);
            temp = res.updatedUnit;
          });
          return temp;
        });
        onBulkUpdateUnits(updatedAll);
      } else {
        onUpdateUnit(updatedActiveUnit);
      }

      const forCourse = appliedImports.map((s) => ({ ...s, unitCode: s.unitCode || unit.unitCode }));
      reportServerSync(`Successfully imported ${importedStudents.length} student enrolment(s) via CSV.`, () =>
        syncEnrolledStudents(forCourse, courseCode, courseTitle, unitTitles)
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const getStatusBadgeClass = (status: StudentEnrolmentStatus) => {
    switch (status) {
      case 'Enrolled':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Competent':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Deferred':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Withdrawn':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      data-agent-id="unit-student-enrolment-panel"
      data-testid="unit-student-enrolment-panel"
      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4"
    >
      {/* 1. Header with Collapse Toggle & Statistics */}
      <div
        onClick={toggleCollapse}
        className="flex items-center justify-between gap-3 flex-wrap cursor-pointer select-none hover:bg-slate-50/80 -m-2 p-2 rounded-2xl transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            data-testid="toggle-enrolment-panel-btn"
            data-agent-id="course-builder-toggle-enrolment-panel-btn"
            aria-label={isPanelCollapsed ? 'Expand student enrolment panel' : 'Collapse student enrolment panel'}
            aria-expanded={!isPanelCollapsed}
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
          >
            {isPanelCollapsed ? (
              <ChevronRight className="w-4 h-4 text-indigo-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Unit Enrolled Students & Cohort
              </h3>
              <span
                data-testid="enrolled-students-count-badge"
                className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 font-mono"
              >
                {enrolledStudents.length} Enrolled
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isPanelCollapsed
                ? `Click to expand • ${enrolledStudents.length} enrolled in ${unit.unitCode} (${unit.unitTitle})`
                : `Manage student enrolments for ${unit.unitCode} (${unit.unitTitle}) via write-in dropdown or bulk CSV upload.`}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-2 ml-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* CSV Download Template */}
          <button
            type="button"
            data-testid="download-student-enrolment-template-btn"
            onClick={handleDownloadTemplate}
            title="Download formatted CSV template for student unit enrolment"
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">CSV Template</span>
          </button>

          {/* Export Enrolled */}
          <button
            type="button"
            data-testid="export-enrolled-students-csv-btn"
            onClick={handleExportStudents}
            title="Export currently enrolled students to CSV"
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline ml-1">
            {isPanelCollapsed ? 'Click to expand' : 'Click to collapse'}
          </span>
        </div>
      </div>

      {/* CSV Status Message / Alerts */}
      {csvStatusMessage && (
        <div
          data-testid="enrolment-status-alert"
          className={`p-3 rounded-2xl text-xs font-medium flex items-center justify-between gap-2 ${
            csvStatusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : csvStatusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {csvStatusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{csvStatusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setCsvStatusMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {!isPanelCollapsed && (
        <div className="space-y-4 pt-1">
          {/* 2. Top Action Controls: Write-in Dropdown + CSV Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
            {/* Left: Dropdown with write-in student search & assignment */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                  Add Student by Dropdown / Write-In Name
                </label>
                <span className="text-[11px] text-slate-500">
                  Select candidate or type any new student name
                </span>
              </div>

              {/* Input & Dropdown Menu Container */}
              <div className="relative">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    data-testid="student-dropdown-input"
                    data-agent-id="student-dropdown-input"
                    placeholder="Type or select student name (e.g. Emma Watson)..."
                    value={writeInName}
                    onChange={handleWriteInChange}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  {writeInName && (
                    <button
                      type="button"
                      onClick={() => {
                        setWriteInName('');
                        setSelectedCandidate(null);
                        setStudentEmail('');
                        setIsEmailEdited(false);
                        setStudentId('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Dropdown Menu popover */}
                {isDropdownOpen && (
                  <div
                    data-testid="student-candidates-dropdown"
                    className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100"
                  >
                    {/* Option to create brand new write-in name if typed */}
                    {writeInName.trim() && (
                      <div
                        data-testid="write-in-custom-student-option"
                        onClick={() => {
                          setSelectedCandidate(null);
                          setIsDropdownOpen(false);
                        }}
                        className="p-2.5 hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between text-xs text-indigo-700 font-bold bg-indigo-50/30"
                      >
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Use write-in name: &ldquo;{writeInName}&rdquo;</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          Custom Student
                        </span>
                      </div>
                    )}

                    {/* Pre-populated candidates */}
                    {matchingCandidates.map((cand) => (
                      <div
                        key={cand.id}
                        data-testid={`candidate-option-${cand.id}`}
                        onClick={() => handleSelectCandidate(cand)}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${
                              cand.avatarColor || 'bg-indigo-500'
                            }`}
                          >
                            {cand.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{cand.name}</div>
                            <div className="text-[10px] text-slate-500">{cand.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {cand.studentId}
                          </span>
                        </div>
                      </div>
                    ))}

                    {matchingCandidates.length === 0 && !writeInName.trim() && (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No candidate matches. Type to write in custom student name.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sub-fields for Student Details: Email, Student ID, Status, Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Student Email
                  </label>
                  <input
                    type="email"
                    data-testid="student-email-input"
                    placeholder="student@example.com"
                    value={studentEmail}
                    onChange={(e) => {
                      setStudentEmail(e.target.value);
                      setIsEmailEdited(e.target.value.trim() !== '');
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Student ID / USI
                  </label>
                  <input
                    type="text"
                    data-testid="student-id-input"
                    placeholder="STU-2026-..."
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Enrolment Status
                  </label>
                  <select
                    data-testid="enrolment-status-select"
                    value={enrolmentStatus}
                    onChange={(e) => setEnrolmentStatus(e.target.value as StudentEnrolmentStatus)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Enrolled">Enrolled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Competent">Competent</option>
                    <option value="Deferred">Deferred</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Target Assignment
                  </label>
                  <select
                    data-testid="enrolment-target-select"
                    value={targetScope}
                    onChange={(e) => setTargetScope(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="current_unit">This Unit ({unit.unitCode})</option>
                    <option value="all_units">All Course Units ({allUnits.length})</option>
                  </select>
                </div>
              </div>

              {/* Enrol Student Action Button */}
              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  data-testid="enrol-student-btn"
                  data-agent-id="enrol-student-btn"
                  aria-label="Enrol student into unit"
                  onClick={handleAddStudent}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Enrol Student</span>
                </button>
              </div>
            </div>

            {/* Right: CSV Upload Dropzone for Course Units */}
            <div className="lg:col-span-4 bg-white p-3.5 rounded-2xl border border-slate-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                  CSV Bulk Upload
                </span>
                <span className="text-[10px] font-mono text-slate-400">.csv only</span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Bulk enrol multiple students into {unit.unitCode} or all course units from a CSV spreadsheet.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                data-testid="student-enrolment-csv-input"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                data-testid="upload-student-enrolment-csv-btn"
                data-agent-id="upload-student-enrolment-csv-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                <span>Upload Student Enrolments (.csv)</span>
              </button>

              <div className="text-[10px] text-slate-400 text-center">
                Need the columns? Click <button type="button" onClick={handleDownloadTemplate} className="underline text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">CSV Template</button> above.
              </div>
            </div>
          </div>

          {/* 3. Search & Filter Bar for Enrolled Students */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  data-testid="search-enrolled-students-input"
                  placeholder="Filter enrolled students by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-all"
                />
              </div>

              <select
                data-testid="filter-enrolled-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Enrolled">Enrolled</option>
                <option value="In Progress">In Progress</option>
                <option value="Competent">Competent</option>
                <option value="Deferred">Deferred</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredStudents.length} of {enrolledStudents.length} students
            </div>
          </div>

          {/* 4. Enrolled Students Cards List */}
          {filteredStudents.length === 0 ? (
            <div
              data-testid="empty-enrolled-students-message"
              className="p-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2"
            >
              <Users className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-xs font-bold text-slate-700">No students enrolled yet</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Use the write-in dropdown menu above to enrol students or upload a CSV roster for {unit.unitCode}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {filteredStudents.map((student) => {
                const isConfirmingDelete = deletingStudentId === student.id;

                return (
                  <div
                    key={student.id}
                    data-testid={`enrolled-student-card-${student.id}`}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {student.studentName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {student.studentName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {student.studentEmail}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadgeClass(
                          student.status
                        )}`}
                      >
                        {student.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                          {student.studentId || 'NO-ID'}
                        </span>
                        <span className="flex items-center gap-1 text-[10px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {student.enrolledAt}
                        </span>
                      </div>

                      {/* Remove Student Action with Confirm Gate */}
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            data-testid={`confirm-remove-student-${student.id}`}
                            data-agent-id={`confirm-remove-student-${student.id}`}
                            onClick={() => handleConfirmRemove(student.id)}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            data-testid={`cancel-remove-student-${student.id}`}
                            onClick={() => setDeletingStudentId(null)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          data-testid={`remove-student-${student.id}-btn`}
                          data-agent-id={`remove-student-${student.id}-btn`}
                          onClick={() => setDeletingStudentId(student.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={`Remove ${student.studentName} from this unit`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
