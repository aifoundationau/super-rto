import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  removeStudentFromUnit,
  isValidStudentEmail
} from '@/lib/courseBuilder/studentEnrolment';
import { syncEnrolledStudents, syncRemovedStudent, type EnrolmentSyncResult } from '@/lib/courseBuilder/enrolmentSync';

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

  // Two-step Enrolment State: details are reviewed in a confirmation popup before anything is saved
  const [pendingEnrolment, setPendingEnrolment] = useState<{
    studentName: string;
    studentEmail: string;
    studentId: string;
    courseCode: string;
    status: StudentEnrolmentStatus;
    scope: 'current_unit' | 'all_units';
  } | null>(null);

  // Spreadsheet import is previewed the same way before anything is saved
  const [pendingCsvImport, setPendingCsvImport] = useState<{
    fileName: string;
    rows: UnitEnrolledStudent[];
    skipped: string[];
  } | null>(null);

  useEffect(() => {
    if (!pendingEnrolment && !pendingCsvImport) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPendingEnrolment(null);
        setPendingCsvImport(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingEnrolment, pendingCsvImport]);

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

  // Local change is already applied; report the server sync (notifications, role) once it finishes.
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
    setStudentId(candidate.studentId);
    setIsDropdownOpen(false);
  };

  // Handle Manual Typing in Dropdown
  const handleWriteInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setWriteInName(val);
    setSelectedCandidate(null);
    setIsDropdownOpen(true);
  };

  // Add / Enrol Student: validate, then open the confirmation popup
  const handleAddStudent = () => {
    if (!writeInName.trim()) {
      setCsvStatusMessage({
        type: 'error',
        text: 'Please enter or select a student name.'
      });
      return;
    }
    if (!isValidStudentEmail(studentEmail)) {
      setCsvStatusMessage({
        type: 'error',
        text: "Please enter the student's email address. It must match the email they sign in with."
      });
      return;
    }

    setPendingEnrolment({
      studentName: writeInName.trim(),
      studentEmail: studentEmail.trim().toLowerCase(),
      studentId: studentId.trim() || `STU-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      courseCode,
      status: enrolmentStatus,
      scope: targetScope === 'all_units' && onBulkUpdateUnits && allUnits.length > 0 ? 'all_units' : 'current_unit'
    });
  };

  // Confirmed in the popup: apply locally, then save to Firebase
  const handleConfirmEnrolment = () => {
    if (!pendingEnrolment) return;
    const { scope, ...payload } = pendingEnrolment;
    setPendingEnrolment(null);

    let addedStudents: UnitEnrolledStudent[];
    let localText: string;
    if (scope === 'all_units' && onBulkUpdateUnits) {
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
    reportServerSync(localText, () => syncEnrolledStudents(addedStudents, courseCode, courseTitle, unitTitles));

    // Reset Form
    setWriteInName('');
    setStudentEmail('');
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

  // Units a spreadsheet row may target: every course unit when bulk updates are supported, else only this one
  const importableUnits = onBulkUpdateUnits && allUnits.length > 0 ? allUnits : [unit];

  // Parse the sheet and open the preview popup; nothing is saved until confirmed
  const buildImportPreview = (csvText: string, fileName: string) => {
    const { students: parsed, errors } = parseStudentEnrolmentCsv(csvText, courseCode, unit.unitCode);
    const unitCodes = new Set(importableUnits.map((u) => u.unitCode.toUpperCase()));
    const skipped = [...errors];
    const rows: UnitEnrolledStudent[] = [];

    parsed.forEach((s) => {
      const unitCode = (s.unitCode || unit.unitCode).toUpperCase();
      if (s.courseCode && s.courseCode.toUpperCase() !== courseCode.toUpperCase()) {
        skipped.push(`${s.studentName}: course ${s.courseCode} is not ${courseCode}.`);
      } else if (!unitCodes.has(unitCode)) {
        skipped.push(`${s.studentName}: unit ${unitCode} is not in this course.`);
      } else {
        rows.push({ ...s, unitCode });
      }
    });

    if (rows.length === 0 && skipped.length === 0) {
      setCsvStatusMessage({ type: 'error', text: `${fileName} has no student rows.` });
      return;
    }
    setPendingCsvImport({ fileName, rows, skipped });
  };

  // Spreadsheet Upload (.csv, or the first sheet of an Excel workbook)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Clear now so the same file can be chosen again after cancelling the preview
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      let csvText: string;
      if (/\.xlsx?$/i.test(file.name)) {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        csvText = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]], { blankrows: false });
      } else {
        csvText = await file.text();
      }
      buildImportPreview(csvText, file.name);
    } catch (err: any) {
      setCsvStatusMessage({ type: 'error', text: `Could not read ${file.name}: ${err?.message || 'unknown error'}` });
    }
  };

  // Confirmed in the preview popup: apply locally, then save to Firebase
  const handleConfirmCsvImport = () => {
    if (!pendingCsvImport) return;
    const { rows, skipped } = pendingCsvImport;
    setPendingCsvImport(null);

    const updatedUnits = importableUnits.map((u) => {
      let temp = u;
      rows
        .filter((r) => r.unitCode === u.unitCode.toUpperCase())
        .forEach((r) => {
          temp = addStudentToUnit(temp, r).updatedUnit;
        });
      return temp;
    });
    if (importableUnits.length > 1 && onBulkUpdateUnits) {
      onBulkUpdateUnits(updatedUnits);
    } else {
      onUpdateUnit(updatedUnits[0]);
    }

    const skippedNote = skipped.length > 0 ? ` ${skipped.length} row(s) skipped.` : '';
    reportServerSync(`Imported ${rows.length} enrolment(s).${skippedNote}`, () =>
      syncEnrolledStudents(rows, courseCode, courseTitle, unitTitles)
    );
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
                    Student Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    data-testid="student-email-input"
                    placeholder="student@example.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
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
                accept=".csv,.xlsx,.xls"
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

      {/* Enrolment Confirmation Popup */}
      {pendingEnrolment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
          onClick={() => setPendingEnrolment(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-enrolment-title"
            data-testid="confirm-enrolment-dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                <UserCheck className="w-4 h-4" />
              </span>
              <h3 id="confirm-enrolment-title" className="text-sm font-extrabold text-slate-900">
                Confirm student enrolment
              </h3>
            </div>

            <dl className="text-xs divide-y divide-slate-100 border border-slate-100 rounded-xl">
              <div className="flex justify-between gap-3 px-3 py-2">
                <dt className="text-slate-500 shrink-0">Name</dt>
                <dd className="font-bold text-slate-900 text-right break-all">{pendingEnrolment.studentName}</dd>
              </div>
              <div className="flex justify-between gap-3 px-3 py-2 bg-amber-50/60">
                <dt className="text-slate-500 shrink-0">Email</dt>
                <dd className="font-bold font-mono text-slate-900 text-right break-all">{pendingEnrolment.studentEmail}</dd>
              </div>
              <div className="flex justify-between gap-3 px-3 py-2">
                <dt className="text-slate-500 shrink-0">Student ID</dt>
                <dd className="font-mono text-slate-800 text-right">{pendingEnrolment.studentId}</dd>
              </div>
              <div className="flex justify-between gap-3 px-3 py-2">
                <dt className="text-slate-500 shrink-0">Status</dt>
                <dd className="text-slate-800 text-right">{pendingEnrolment.status}</dd>
              </div>
              <div className="flex justify-between gap-3 px-3 py-2">
                <dt className="text-slate-500 shrink-0">Enrol into</dt>
                <dd className="text-slate-800 text-right">
                  {pendingEnrolment.scope === 'all_units'
                    ? `All ${allUnits.length} units of ${courseCode}`
                    : `${unit.unitCode} – ${unit.unitTitle}`}
                </dd>
              </div>
            </dl>

            <p className="text-[11px] text-slate-500">
              The email must match the address the student signs in with, or they won't see this enrolment.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                data-testid="cancel-enrolment-btn"
                onClick={() => setPendingEnrolment(null)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Go back & edit
              </button>
              <button
                type="button"
                autoFocus
                data-testid="confirm-enrolment-btn"
                onClick={handleConfirmEnrolment}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Confirm & enrol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spreadsheet Import Preview Popup */}
      {pendingCsvImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
          onClick={() => setPendingCsvImport(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-import-title"
            data-testid="confirm-csv-import-dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h3 id="confirm-import-title" className="text-sm font-extrabold text-slate-900">
                  Confirm {pendingCsvImport.rows.length} enrolment{pendingCsvImport.rows.length === 1 ? '' : 's'}
                </h3>
                <p className="text-[11px] text-slate-500 break-all">{pendingCsvImport.fileName}</p>
              </div>
            </div>

            {pendingCsvImport.rows.length > 0 && (
              <ul className="text-xs divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-y-auto min-h-0">
                {pendingCsvImport.rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 break-words">{r.studentName}</div>
                      <div className="font-mono text-slate-700 break-all">{r.studentEmail}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-slate-800">{r.unitCode}</div>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {pendingCsvImport.skipped.length > 0 && (
              <div className="text-[11px] bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-2 space-y-0.5 max-h-28 overflow-y-auto shrink-0">
                <div className="font-bold">{pendingCsvImport.skipped.length} row(s) will be skipped:</div>
                {pendingCsvImport.skipped.map((reason, i) => (
                  <div key={i} className="break-words">{reason}</div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-slate-500 shrink-0">
              Check each email matches the address the student signs in with, or they won't see their enrolment.
            </p>

            <div className="flex justify-end gap-2 shrink-0">
              <button
                type="button"
                data-testid="cancel-csv-import-btn"
                onClick={() => setPendingCsvImport(null)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                disabled={pendingCsvImport.rows.length === 0}
                data-testid="confirm-csv-import-btn"
                onClick={handleConfirmCsvImport}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Confirm & enrol {pendingCsvImport.rows.length}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
