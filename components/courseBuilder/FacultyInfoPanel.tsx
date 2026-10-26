'use client';

import React, { useState } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Clock,
  Award,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  Search,
  X
} from 'lucide-react';
import {
  CourseFacultyInfo,
  FacultyStaffMember,
  createFacultyStaffMember,
  addStaffMember,
  removeStaffMember,
  updateStaffMember,
  DEFAULT_FACULTIES
} from '@/lib/courseBuilder/faculty';
import {
  getStoredStaffDirectory,
  getTeachingStaff,
  formatStaffAsFacultyMember,
  StaffMemberProfile
} from '@/lib/staff/directory';

export interface FacultyInfoPanelProps {
  facultyInfo: CourseFacultyInfo;
  onChange: (updatedInfo: CourseFacultyInfo) => void;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const FacultyInfoPanel: React.FC<FacultyInfoPanelProps> = ({
  facultyInfo,
  onChange,
  isCollapsible = true,
  defaultCollapsed = false,
  isCollapsed: controlledCollapsed,
  onToggleCollapse
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [newAccreditationInput, setNewAccreditationInput] = useState('');
  const [selectedStaffDropdownId, setSelectedStaffDropdownId] = useState('');
  const [registeredTeachingStaff, setRegisteredTeachingStaff] = useState<StaffMemberProfile[]>([]);

  // Search-by-name / last-name state for auto-adding staff (does not automatically show names)
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setRegisteredTeachingStaff(getTeachingStaff());
    const handleUpdate = () => {
      setRegisteredTeachingStaff(getTeachingStaff());
    };
    window.addEventListener('super_rto_staff_directory_updated', handleUpdate);
    return () => window.removeEventListener('super_rto_staff_directory_updated', handleUpdate);
  }, []);

  // Close search popover on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter staff by search query (by first name, last name, full name, or title)
  // CRITICAL: Returns [] when query is empty so names are NEVER displayed automatically
  const filteredTeachingStaff = React.useMemo(() => {
    const q = staffSearchQuery.trim().toLowerCase();
    if (!q) return [];

    const normalizedQ = q.replace(/['’]/g, '');

    return registeredTeachingStaff.filter((cand) => {
      const full = cand.fullName.toLowerCase();
      const normalizedFull = full.replace(/['’]/g, '');

      // 1. Direct full name match
      if (full.includes(q) || normalizedFull.includes(normalizedQ)) return true;

      // 2. Strip titles & degree suffixes to isolate first name & last name words
      const cleanedName = full
        .replace(/^(dr\.|prof\.|a\/prof\.|associate professor|mr\.|ms\.|mrs\.)\s+/i, '')
        .replace(/,\s*(phd|mappsc|bsc|msc|beng|dip\s+whs|cohspr|cissp|fcpa|ca\s+anz).*$/i, '');

      const words = cleanedName.split(/\s+/).filter(Boolean);
      const wordMatch = words.some((word) => {
        const cleanWord = word.replace(/['’]/g, '');
        return cleanWord.startsWith(normalizedQ) || cleanWord.includes(normalizedQ);
      });
      if (wordMatch) return true;

      // 3. Match appointment title or department
      if (cand.appointmentTitle?.toLowerCase().includes(q)) return true;
      if (cand.department?.toLowerCase().includes(q)) return true;

      return false;
    });
  }, [registeredTeachingStaff, staffSearchQuery]);

  const handleSelectStaff = (cand: StaffMemberProfile) => {
    const postcard = formatStaffAsFacultyMember(cand);
    onChange(addStaffMember(facultyInfo, postcard));
    setStaffSearchQuery('');
    setIsSearchOpen(false);
    setSelectedStaffDropdownId('');
  };

  const handleAddFromDropdown = (staffId: string) => {
    if (!staffId) return;
    const target = registeredTeachingStaff.find((s) => s.id === staffId);
    if (!target) return;
    handleSelectStaff(target);
  };

  const toggleCollapse = () => {
    if (!isCollapsible) return;
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const handleFieldChange = (field: keyof CourseFacultyInfo, value: any) => {
    onChange({
      ...facultyInfo,
      [field]: value
    });
  };

  const handleAddStaff = () => {
    const newStaff = createFacultyStaffMember(
      'New Faculty Member / Trainer',
      'Trainer & Assessor'
    );
    onChange(addStaffMember(facultyInfo, newStaff));
  };

  const handleDeleteStaff = (staffId: string) => {
    onChange(removeStaffMember(facultyInfo, staffId));
    setDeletingStaffId(null);
  };

  const handleUpdateStaff = (
    staffId: string,
    field: keyof FacultyStaffMember,
    value: string
  ) => {
    onChange(updateStaffMember(facultyInfo, staffId, { [field]: value }));
  };

  const handleAddAccreditation = () => {
    if (!newAccreditationInput.trim()) return;
    if (!facultyInfo.accreditations.includes(newAccreditationInput.trim())) {
      onChange({
        ...facultyInfo,
        accreditations: [...facultyInfo.accreditations, newAccreditationInput.trim()]
      });
    }
    setNewAccreditationInput('');
  };

  const handleRemoveAccreditation = (accName: string) => {
    onChange({
      ...facultyInfo,
      accreditations: facultyInfo.accreditations.filter((a) => a !== accName)
    });
  };

  return (
    <div
      data-agent-id="course-builder-faculty-info-panel"
      data-testid="faculty-info-panel"
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
    >
      {/* Panel Header */}
      <div
        onClick={() => toggleCollapse()}
        className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {isCollapsible && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse();
              }}
              data-agent-id="course-builder-toggle-faculty-panel-btn"
              data-testid="toggle-faculty-panel-btn"
              aria-label="Toggle Faculty Information Panel"
              aria-expanded={!isCollapsed}
              className="p-1 rounded hover:bg-slate-200 text-indigo-600 transition-colors shrink-0"
              title={isCollapsed ? 'Expand Faculty Panel' : 'Collapse Faculty Panel'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-indigo-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          )}

          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-indigo-700" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Faculty &amp; Academic Staff Information
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 truncate">
                {facultyInfo.facultyName}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                {facultyInfo.staffMembers.length} Academic Staff
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Governing school, executive dean, course coordinator, teaching faculty credentials &amp; consultation hours.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleAddStaff}
            data-agent-id="course-builder-add-faculty-member-btn"
            data-testid="add-faculty-member-btn"
            aria-label="Add Faculty Member"
            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
            title="Add a new teaching faculty member, trainer, or assessor"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Add Faculty Member</span>
          </button>

          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            {isCollapsed ? 'Click to expand' : 'Click to collapse'}
          </span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-5 space-y-6">
          {/* Section 1: Governing Faculty & Academic Leadership Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Governing Faculty & School */}
            <div
              data-testid="faculty-governing-box"
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Governing Faculty
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Faculty Name
                </label>
                <input
                  type="text"
                  list="faculty-options"
                  value={facultyInfo.facultyName}
                  onChange={(e) => handleFieldChange('facultyName', e.target.value)}
                  data-agent-id="course-builder-faculty-name-input"
                  data-testid="faculty-name-input"
                  aria-label="Governing Faculty Name"
                  placeholder="e.g. Faculty of Business, Technology & Vocational Safety"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 shadow-2xs"
                />
                <datalist id="faculty-options">
                  {DEFAULT_FACULTIES.map((fac) => (
                    <option key={fac} value={fac} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  School or Department
                </label>
                <input
                  type="text"
                  value={facultyInfo.schoolDepartment}
                  onChange={(e) => handleFieldChange('schoolDepartment', e.target.value)}
                  data-agent-id="course-builder-school-dept-input"
                  data-testid="faculty-school-dept-input"
                  aria-label="School or Department"
                  placeholder="e.g. School of Work Health & Safety Compliance"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-semibold outline-none focus:border-indigo-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Executive Dean / Head of Faculty
                </label>
                <input
                  type="text"
                  value={facultyInfo.deanName || ''}
                  onChange={(e) => handleFieldChange('deanName', e.target.value)}
                  data-agent-id="course-builder-dean-name-input"
                  data-testid="faculty-dean-name-input"
                  aria-label="Executive Dean Name"
                  placeholder="e.g. Prof. Gregory Hayes, EdD, MBA, MAICD"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                />
              </div>
            </div>

            {/* Course Coordinator & Academic Directorship */}
            <div
              data-testid="faculty-coordinator-box"
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Course Coordinator &amp; Academic Director
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Coordinator Name
                </label>
                <input
                  type="text"
                  value={facultyInfo.courseCoordinatorName}
                  onChange={(e) => handleFieldChange('courseCoordinatorName', e.target.value)}
                  data-agent-id="course-builder-coordinator-name-input"
                  data-testid="faculty-coordinator-name-input"
                  aria-label="Course Coordinator Name"
                  placeholder="e.g. Dr. Marcus Sterling"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Appointment Title
                </label>
                <input
                  type="text"
                  value={facultyInfo.courseCoordinatorTitle}
                  onChange={(e) => handleFieldChange('courseCoordinatorTitle', e.target.value)}
                  data-agent-id="course-builder-coordinator-title-input"
                  data-testid="faculty-coordinator-title-input"
                  aria-label="Coordinator Appointment Title"
                  placeholder="e.g. Course Coordinator & Lead Safety Auditor"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Direct Email
                  </label>
                  <input
                    type="email"
                    value={facultyInfo.courseCoordinatorEmail}
                    onChange={(e) => handleFieldChange('courseCoordinatorEmail', e.target.value)}
                    data-agent-id="course-builder-coordinator-email-input"
                    data-testid="faculty-coordinator-email-input"
                    aria-label="Coordinator Email"
                    placeholder="coordinator@super-rto.edu.au"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={facultyInfo.courseCoordinatorPhone || ''}
                    onChange={(e) => handleFieldChange('courseCoordinatorPhone', e.target.value)}
                    data-agent-id="course-builder-coordinator-phone-input"
                    data-testid="faculty-coordinator-phone-input"
                    aria-label="Coordinator Phone"
                    placeholder="+61 2 9514 2040"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Central Faculty Office & Enquiries */}
            <div
              data-testid="faculty-office-box"
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Faculty Office &amp; Inquiries
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Campus Office Location
                </label>
                <input
                  type="text"
                  value={facultyInfo.facultyOfficeLocation || ''}
                  onChange={(e) => handleFieldChange('facultyOfficeLocation', e.target.value)}
                  data-agent-id="course-builder-office-location-input"
                  data-testid="faculty-office-location-input"
                  aria-label="Campus Office Location"
                  placeholder="e.g. Sydney Broadway Campus, Building 1, Level 5, Room 512"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Faculty Enquiries Email
                </label>
                <input
                  type="email"
                  value={facultyInfo.facultyEmail || ''}
                  onChange={(e) => handleFieldChange('facultyEmail', e.target.value)}
                  data-agent-id="course-builder-faculty-email-input"
                  data-testid="faculty-email-input"
                  aria-label="Faculty Enquiries Email"
                  placeholder="faculty.whs@super-rto.edu.au"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                />
              </div>

              {/* Accreditations tags */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Accreditations &amp; Industry Endorsements
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {facultyInfo.accreditations.map((acc) => (
                    <span
                      key={acc}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{acc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAccreditation(acc)}
                        aria-label={`Remove accreditation ${acc}`}
                        className="text-emerald-500 hover:text-emerald-800 text-xs font-bold leading-none ml-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newAccreditationInput}
                    onChange={(e) => setNewAccreditationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAccreditation())}
                    placeholder="Add accreditation (e.g. AIHS Endorsed)..."
                    data-testid="new-accreditation-input"
                    aria-label="New Accreditation Name"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] outline-none focus:border-indigo-600 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAccreditation}
                    data-testid="add-accreditation-btn"
                    aria-label="Add Accreditation"
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-300 shadow-2xs transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Teaching Faculty Members & Assessors */}
          <div className="space-y-3 pt-2 border-t border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Teaching Faculty, Trainers &amp; Assessors ({facultyInfo.staffMembers.length})
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {/* Search Registered Staff by Name / Last Name (does not automatically give names) */}
                <div
                  ref={searchContainerRef}
                  className="relative"
                  data-testid="course-builder-staff-dropdown"
                  data-agent-id="course-builder-staff-search-container"
                >
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-indigo-500 absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={staffSearchQuery}
                      onChange={(e) => {
                        setStaffSearchQuery(e.target.value);
                        setIsSearchOpen(true);
                      }}
                      onFocus={() => setIsSearchOpen(true)}
                      placeholder="+ Search by name or last name..."
                      aria-label="Select Registered Staff Member to Auto-Add"
                      data-testid="course-builder-staff-search-input"
                      data-agent-id="course-builder-staff-search-input"
                      className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg pl-8 pr-7 py-1 text-xs font-bold placeholder:text-indigo-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 cursor-text shadow-2xs w-60 sm:w-72 transition-all"
                    />
                    {staffSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setStaffSearchQuery('');
                          setIsSearchOpen(false);
                        }}
                        aria-label="Clear staff search"
                        className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Results (Visible ONLY when user searches or focuses) */}
                  {isSearchOpen && (
                    <div
                      data-testid="course-builder-staff-search-results"
                      className="absolute right-0 sm:left-0 mt-1.5 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-indigo-100 overflow-hidden z-50 text-slate-800 divide-y divide-slate-100"
                    >
                      {staffSearchQuery.trim() === '' ? (
                        <div className="p-3 text-center space-y-1">
                          <p className="text-[11px] font-bold text-slate-700">
                            Search Registered Staff
                          </p>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Start entering a first name or last name to search and auto-add staff (e.g. Sterling, Chen, Rostova, Thorne).
                          </p>
                        </div>
                      ) : filteredTeachingStaff.length === 0 ? (
                        <div className="p-3 text-center space-y-0.5">
                          <p className="text-xs font-bold text-slate-700">No staff found</p>
                          <p className="text-[10px] text-slate-400">
                            No registered staff matching &ldquo;{staffSearchQuery}&rdquo;. Try another name or last name.
                          </p>
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                          <div className="px-2.5 py-1.5 bg-slate-50 text-[10px] font-bold text-indigo-900 uppercase tracking-wider flex items-center justify-between">
                            <span>Matching Registered Staff ({filteredTeachingStaff.length})</span>
                            <span className="text-[9px] text-slate-400 lowercase font-normal">click to auto-add</span>
                          </div>
                          {filteredTeachingStaff.map((cand) => (
                            <button
                              key={cand.id}
                              type="button"
                              onClick={() => handleSelectStaff(cand)}
                              data-testid={`staff-search-result-${cand.id}`}
                              className="w-full text-left p-2.5 hover:bg-indigo-50/70 transition-colors flex items-start gap-2.5 group cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                {cand.fullName.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-900">
                                    {cand.fullName}
                                  </span>
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-200 text-indigo-700">
                                    {cand.role}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {cand.appointmentTitle}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {cand.department}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddStaff}
                  data-agent-id="course-builder-add-staff-bottom-btn"
                  data-testid="add-staff-bottom-btn"
                  aria-label="Add Teaching Staff Member"
                  className="px-2 py-1 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-indigo-600" />
                  <span>Manual</span>
                </button>
              </div>
            </div>

            {facultyInfo.staffMembers.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No faculty teaching staff defined yet.</p>
                <p className="text-[11px] text-slate-500">
                  Click &ldquo;+ Add Faculty Member&rdquo; to add lead educators, industry fellows, and accredited trainers &amp; assessors.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facultyInfo.staffMembers.map((staff, idx) => (
                  <div
                    key={staff.id}
                    data-testid={`faculty-staff-card-${staff.id}`}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                  >
                    {/* Staff Card Header */}
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded uppercase tracking-wider">
                            Information Postcard
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={staff.name}
                            onChange={(e) => handleUpdateStaff(staff.id, 'name', e.target.value)}
                            data-agent-id={`course-builder-staff-name-${staff.id}`}
                            data-testid={`staff-name-${staff.id}`}
                            aria-label={`Staff Member Name for ${staff.id}`}
                            placeholder="Full Name (e.g. Dr. Marcus Sterling)..."
                            className="text-xs font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 outline-none w-full"
                          />
                        </div>
                        <input
                          type="text"
                          value={staff.role}
                          onChange={(e) => handleUpdateStaff(staff.id, 'role', e.target.value)}
                          data-agent-id={`course-builder-staff-role-${staff.id}`}
                          data-testid={`staff-role-${staff.id}`}
                          aria-label={`Staff Role for ${staff.id}`}
                          placeholder="Academic Appointment / Industry Role..."
                          className="text-[11px] font-semibold text-indigo-700 bg-transparent border-b border-dashed border-slate-200 focus:border-indigo-600 outline-none w-full"
                        />
                      </div>

                      {/* Confirm Delete Safety Controls */}
                      <div className="shrink-0">
                        {deletingStaffId === staff.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in duration-200">
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff.id)}
                              data-agent-id={`course-builder-confirm-delete-staff-${staff.id}-btn`}
                              data-testid={`confirm-delete-staff-${staff.id}`}
                              aria-label={`Confirm Delete Staff Member ${staff.name}`}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingStaffId(null)}
                              data-agent-id={`course-builder-cancel-delete-staff-${staff.id}-btn`}
                              data-testid={`cancel-delete-staff-${staff.id}`}
                              aria-label={`Cancel Delete Staff Member ${staff.name}`}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingStaffId(staff.id)}
                            data-agent-id={`course-builder-delete-staff-${staff.id}-btn`}
                            data-testid={`delete-staff-${staff.id}`}
                            aria-label={`Delete Staff Member ${staff.name}`}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded hover:bg-rose-50"
                            title="Delete Staff Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Qualifications & Compliance Credentials */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-slate-400" />
                        <span>Academic Qualifications &amp; Vocational Credentials</span>
                      </label>
                      <input
                        type="text"
                        value={staff.qualifications}
                        onChange={(e) => handleUpdateStaff(staff.id, 'qualifications', e.target.value)}
                        data-agent-id={`course-builder-staff-qualifications-${staff.id}`}
                        data-testid={`staff-qualifications-${staff.id}`}
                        aria-label={`Staff Qualifications for ${staff.name}`}
                        placeholder="e.g. PhD, MAppSc, Cert IV TAE40122, COHSPr..."
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 outline-none focus:border-indigo-600"
                      />
                    </div>

                    {/* Industry Experience & Currency */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        <span>Industry Experience &amp; Professional Currency</span>
                      </label>
                      <textarea
                        rows={2}
                        value={staff.industryExperience}
                        onChange={(e) => handleUpdateStaff(staff.id, 'industryExperience', e.target.value)}
                        data-agent-id={`course-builder-staff-experience-${staff.id}`}
                        data-testid={`staff-experience-${staff.id}`}
                        aria-label={`Industry Experience for ${staff.name}`}
                        placeholder="Detail practical industry experience, statutory audit history, or professional achievements..."
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 outline-none focus:border-indigo-600 resize-y"
                      />
                    </div>

                    {/* Email, Office & Consultation Hours */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Email</span>
                        <input
                          type="email"
                          value={staff.email}
                          onChange={(e) => handleUpdateStaff(staff.id, 'email', e.target.value)}
                          data-testid={`staff-email-${staff.id}`}
                          aria-label={`Email for ${staff.name}`}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-mono text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Office / Campus</span>
                        <input
                          type="text"
                          value={staff.officeLocation || ''}
                          onChange={(e) => handleUpdateStaff(staff.id, 'officeLocation', e.target.value)}
                          data-testid={`staff-office-${staff.id}`}
                          aria-label={`Office Location for ${staff.name}`}
                          placeholder="Building 1, Room 512"
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[11px] text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Student Consultation Hours</span>
                        </span>
                        <input
                          type="text"
                          value={staff.consultationHours || ''}
                          onChange={(e) => handleUpdateStaff(staff.id, 'consultationHours', e.target.value)}
                          data-testid={`staff-consultation-${staff.id}`}
                          aria-label={`Consultation Hours for ${staff.name}`}
                          placeholder="e.g. Tuesdays & Thursdays 1:00 PM – 3:00 PM (AEST)"
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[11px] text-slate-800 outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
