'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  UserPlus,
  HeartHandshake,
  Crown,
  Server,
  DollarSign,
  FileCheck,
  ExternalLink,
  Edit3,
  X,
  Save,
  Check
} from 'lucide-react';
import {
  StaffMemberProfile,
  StaffRole,
  STAFF_ROLE_DEFINITIONS,
  getStoredStaffDirectory,
  saveStoredStaffDirectory,
  getTeachingStaff,
  formatStaffAsFacultyMember,
  createBlankStaffProfile
} from '@/lib/staff/directory';
import {
  CourseFacultyInfo,
  FacultyStaffMember,
  createDefaultFacultyInfo,
  createFacultyStaffMember,
  addStaffMember,
  removeStaffMember,
  updateStaffMember,
  DEFAULT_FACULTIES
} from '@/lib/courseBuilder/faculty';

export const FacultyStaffDirectoryView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'faculty_setup' | 'staff_directory'>('faculty_setup');

  // Staff Directory State
  const [staffList, setStaffList] = useState<StaffMemberProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedStaffForModal, setSelectedStaffForModal] = useState<StaffMemberProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Faculty Admin Setup State
  const [facultySetup, setFacultySetup] = useState<CourseFacultyInfo>(() => createDefaultFacultyInfo('BSB41419', 'Certificate IV in Work Health and Safety', 4));
  const [selectedTeachingDropdownId, setSelectedTeachingDropdownId] = useState<string>('');
  const [deletingPostcardId, setDeletingPostcardId] = useState<string | null>(null);
  const [newAccreditationInput, setNewAccreditationInput] = useState('');
  const [facultySavedSuccess, setFacultySavedSuccess] = useState(false);

  // Load staff directory
  useEffect(() => {
    const list = getStoredStaffDirectory();
    setStaffList(list);

    // Try to load any previously saved faculty setup
    try {
      const storedFaculty = localStorage.getItem('super_rto_institutional_faculty_preset');
      if (storedFaculty) {
        setFacultySetup(JSON.parse(storedFaculty));
      }
    } catch (e) {}

    const handleUpdate = () => {
      setStaffList(getStoredStaffDirectory());
    };
    window.addEventListener('super_rto_staff_directory_updated', handleUpdate);
    return () => window.removeEventListener('super_rto_staff_directory_updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Filter staff
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.appointmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.campus.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter === 'ALL') return true;
    const meta = STAFF_ROLE_DEFINITIONS[s.role];
    return meta?.category === categoryFilter;
  });

  const teachingCandidates = getTeachingStaff(staffList);
  const deanCandidates = staffList.filter((s) => s.role === 'dean' || s.role === 'director' || s.appointmentTitle.toLowerCase().includes('dean'));
  const coordinatorCandidates = staffList.filter((s) => s.role === 'coordinator' || s.role === 'teacher' || s.appointmentTitle.toLowerCase().includes('coordinator'));

  // Faculty field changes
  const handleFacultyChange = (field: keyof CourseFacultyInfo, value: any) => {
    setFacultySetup((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Add teaching staff from dropdown to postcards
  const handleAddStaffFromDropdown = (staffId: string) => {
    if (!staffId) return;
    const target = staffList.find((s) => s.id === staffId);
    if (!target) return;

    // Check if already in postcards
    const existing = facultySetup.staffMembers.find((m) => m.id === target.id);
    if (existing) {
      showToast(`${target.fullName} is already in the information postcards list.`);
      setSelectedTeachingDropdownId('');
      return;
    }

    const postcardMember: FacultyStaffMember = formatStaffAsFacultyMember(target);
    setFacultySetup((prev) => addStaffMember(prev, postcardMember));
    setSelectedTeachingDropdownId('');
    showToast(`Added ${target.fullName} to Information Postcards.`);
  };

  // Remove postcard
  const handleRemovePostcard = (id: string) => {
    setFacultySetup((prev) => removeStaffMember(prev, id));
    setDeletingPostcardId(null);
    showToast('Postcard removed.');
  };

  // Update postcard
  const handleUpdatePostcard = (id: string, field: keyof FacultyStaffMember, val: string) => {
    setFacultySetup((prev) => updateStaffMember(prev, id, { [field]: val }));
  };

  // Accreditations
  const handleAddAccreditation = () => {
    if (!newAccreditationInput.trim()) return;
    if (!facultySetup.accreditations.includes(newAccreditationInput.trim())) {
      setFacultySetup((prev) => ({
        ...prev,
        accreditations: [...prev.accreditations, newAccreditationInput.trim()]
      }));
    }
    setNewAccreditationInput('');
  };

  const handleRemoveAccreditation = (acc: string) => {
    setFacultySetup((prev) => ({
      ...prev,
      accreditations: prev.accreditations.filter((a) => a !== acc)
    }));
  };

  // Save Faculty Setup as Institutional Preset
  const handleSaveFacultyPreset = () => {
    try {
      localStorage.setItem('super_rto_institutional_faculty_preset', JSON.stringify(facultySetup));
      setFacultySavedSuccess(true);
      showToast('Faculty Configuration & Postcards saved as Institutional Default!');
      setTimeout(() => setFacultySavedSuccess(false), 3000);
    } catch (e) {
      showToast('Failed to save configuration.');
    }
  };

  // Open modal for registration
  const handleOpenRegisterModal = () => {
    setSelectedStaffForModal(createBlankStaffProfile('trainer'));
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffMemberProfile) => {
    setSelectedStaffForModal({ ...staff });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Save staff member from modal
  const handleSaveStaffFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForModal || !selectedStaffForModal.fullName.trim() || !selectedStaffForModal.email.trim()) {
      showToast('Please enter both Full Name and Email address.');
      return;
    }

    let updated: StaffMemberProfile[];
    if (modalMode === 'create') {
      updated = [selectedStaffForModal, ...staffList];
      showToast(`Registered ${selectedStaffForModal.fullName} (${STAFF_ROLE_DEFINITIONS[selectedStaffForModal.role].label}).`);
    } else {
      updated = staffList.map((s) => (s.id === selectedStaffForModal.id ? selectedStaffForModal : s));
      showToast(`Updated profile for ${selectedStaffForModal.fullName}.`);
    }

    setStaffList(updated);
    saveStoredStaffDirectory(updated);
    setIsModalOpen(false);
    setSelectedStaffForModal(null);
  };

  // Delete staff member
  const handleDeleteStaffMember = (id: string) => {
    const target = staffList.find((s) => s.id === id);
    const updated = staffList.filter((s) => s.id !== id);
    setStaffList(updated);
    saveStoredStaffDirectory(updated);
    setDeletingStaffId(null);
    showToast(`Deleted staff record: ${target?.fullName || id}`);
  };

  return (
    <div
      data-agent-id="admin-faculty-staff-directory-view"
      data-testid="faculty-staff-directory-view"
      className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6"
    >
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-900 text-lg">Institutional Faculty &amp; Staff Governance</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Configure governing Academic Faculties, Schools, Executive Deans, and Program Coordinators. Manage role-specific staff registration profiles and automatically populate teaching staff information postcards via interactive dropdowns.
          </p>
        </div>

        {/* Sub-Tab Navigation Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('faculty_setup')}
            data-testid="subtab-faculty-setup-btn"
            aria-label="Faculty & Department Setup Tab"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'faculty_setup'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Faculty &amp; Postcards Setup</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('staff_directory')}
            data-testid="subtab-staff-directory-btn"
            aria-label="Staff Directory & Registration Tab"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'staff_directory'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Directory ({staffList.length})</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SUBTAB 1: FACULTY SETUP & INFORMATION POSTCARDS */}
      {activeSubTab === 'faculty_setup' && (
        <div className="space-y-6">
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Governing Faculty &amp; Academic Leadership</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Defines the academic jurisdiction, executive dean, coordinator, and office location for all programs.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveFacultyPreset}
                data-testid="save-faculty-preset-btn"
                aria-label="Save Faculty Configuration"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
              >
                {facultySavedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Saved Preset!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Institutional Preset</span>
                  </>
                )}
              </button>
            </div>

            {/* Core Faculty Form Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Faculty Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Faculty Name
                </label>
                <input
                  type="text"
                  list="faculty-name-suggestions"
                  value={facultySetup.facultyName}
                  onChange={(e) => handleFacultyChange('facultyName', e.target.value)}
                  data-testid="admin-faculty-name-input"
                  aria-label="Faculty Name"
                  placeholder="e.g. Faculty of Business, Technology & Vocational Safety"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs font-medium"
                />
                <datalist id="faculty-name-suggestions">
                  {DEFAULT_FACULTIES.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>

              {/* School or Department */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  School or Department
                </label>
                <input
                  type="text"
                  value={facultySetup.schoolDepartment}
                  onChange={(e) => handleFacultyChange('schoolDepartment', e.target.value)}
                  data-testid="admin-school-dept-input"
                  aria-label="School or Department"
                  placeholder="e.g. School of Work Health & Safety Compliance"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs font-medium"
                />
              </div>

              {/* Executive Dean / Head of Faculty */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Executive Dean / Head of Faculty
                  </label>
                  {deanCandidates.length > 0 && (
                    <select
                      onChange={(e) => {
                        const dean = staffList.find((s) => s.id === e.target.value);
                        if (dean) {
                          handleFacultyChange('deanName', dean.fullName);
                          handleFacultyChange('deanTitle', dean.appointmentTitle);
                        }
                      }}
                      defaultValue=""
                      className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold rounded px-1.5 py-0.5 border border-indigo-200 outline-none cursor-pointer"
                    >
                      <option value="" disabled>Select from Registered Deans...</option>
                      {deanCandidates.map((d) => (
                        <option key={d.id} value={d.id}>{d.fullName} ({d.appointmentTitle})</option>
                      ))}
                    </select>
                  )}
                </div>
                <input
                  type="text"
                  value={facultySetup.deanName || ''}
                  onChange={(e) => handleFacultyChange('deanName', e.target.value)}
                  data-testid="admin-dean-name-input"
                  aria-label="Executive Dean Name"
                  placeholder="e.g. Dr. Gregory Hayes, EdD, MBA, MAICD"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs font-medium"
                />
              </div>

              {/* Coordinator Name & Appointment Title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Coordinator Name
                  </label>
                  {coordinatorCandidates.length > 0 && (
                    <select
                      onChange={(e) => {
                        const coord = staffList.find((s) => s.id === e.target.value);
                        if (coord) {
                          handleFacultyChange('courseCoordinatorName', coord.fullName);
                          handleFacultyChange('courseCoordinatorTitle', coord.appointmentTitle);
                          handleFacultyChange('courseCoordinatorEmail', coord.email);
                          handleFacultyChange('courseCoordinatorPhone', coord.phone);
                        }
                      }}
                      defaultValue=""
                      className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold rounded px-1.5 py-0.5 border border-indigo-200 outline-none cursor-pointer"
                    >
                      <option value="" disabled>Select from Registered Coordinators...</option>
                      {coordinatorCandidates.map((c) => (
                        <option key={c.id} value={c.id}>{c.fullName} ({c.appointmentTitle})</option>
                      ))}
                    </select>
                  )}
                </div>
                <input
                  type="text"
                  value={facultySetup.courseCoordinatorName}
                  onChange={(e) => handleFacultyChange('courseCoordinatorName', e.target.value)}
                  data-testid="admin-coordinator-name-input"
                  aria-label="Coordinator Name"
                  placeholder="e.g. Dr. Marcus Sterling"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs font-medium"
                />
              </div>

              {/* Appointment Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Appointment Title
                </label>
                <input
                  type="text"
                  value={facultySetup.courseCoordinatorTitle}
                  onChange={(e) => handleFacultyChange('courseCoordinatorTitle', e.target.value)}
                  data-testid="admin-appointment-title-input"
                  aria-label="Appointment Title"
                  placeholder="e.g. Course Coordinator & Lead Safety Auditor"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs font-medium"
                />
              </div>

              {/* Direct Email & Contact Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Direct Email
                  </label>
                  <input
                    type="email"
                    value={facultySetup.courseCoordinatorEmail}
                    onChange={(e) => handleFacultyChange('courseCoordinatorEmail', e.target.value)}
                    data-testid="admin-direct-email-input"
                    aria-label="Direct Email"
                    placeholder="coordinator@super-rto.edu.au"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={facultySetup.courseCoordinatorPhone || ''}
                    onChange={(e) => handleFacultyChange('courseCoordinatorPhone', e.target.value)}
                    data-testid="admin-contact-phone-input"
                    aria-label="Contact Phone"
                    placeholder="+61 2 9514 2040"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Campus Office Location */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Campus Office Location
                </label>
                <input
                  type="text"
                  value={facultySetup.facultyOfficeLocation || ''}
                  onChange={(e) => handleFacultyChange('facultyOfficeLocation', e.target.value)}
                  data-testid="admin-office-location-input"
                  aria-label="Campus Office Location"
                  placeholder="e.g. Sydney Broadway Campus, Building 1, Level 5, Room 512"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                />
              </div>

              {/* Faculty Enquiries Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Faculty Enquiries Email
                </label>
                <input
                  type="email"
                  value={facultySetup.facultyEmail || ''}
                  onChange={(e) => handleFacultyChange('facultyEmail', e.target.value)}
                  data-testid="admin-faculty-enquiries-email-input"
                  aria-label="Faculty Enquiries Email"
                  placeholder="faculty.whs@super-rto.edu.au"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                />
              </div>

              {/* Accreditations & Industry Endorsements */}
              <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-200/60">
                <label className="block text-[11px] font-bold text-slate-700">
                  Accreditations &amp; Industry Endorsements
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {facultySetup.accreditations.map((acc) => (
                    <span
                      key={acc}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{acc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAccreditation(acc)}
                        aria-label={`Remove accreditation ${acc}`}
                        className="text-emerald-500 hover:text-emerald-800 text-sm font-bold leading-none ml-1 cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 max-w-md pt-1">
                  <input
                    type="text"
                    value={newAccreditationInput}
                    onChange={(e) => setNewAccreditationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAccreditation())}
                    placeholder="Add accreditation (e.g. AIHS Endorsed, ASQA, ACS)..."
                    data-testid="admin-new-accreditation-input"
                    aria-label="New Accreditation Name"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-600 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAccreditation}
                    data-testid="admin-add-accreditation-btn"
                    aria-label="Add Accreditation"
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 shadow-2xs transition-colors"
                  >
                    Add Tag
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: TEACHING FACULTY, TRAINERS & ASSESSORS (2) POSTCARDS */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Teaching Faculty, Trainers &amp; Assessors ({facultySetup.staffMembers.length})</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Select registered staff members from the dropdown below to automatically populate all their details into the information postcard cards.
                </p>
              </div>

              {/* Dropdown to Auto-Add Registered Staff */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedTeachingDropdownId}
                  onChange={(e) => {
                    setSelectedTeachingDropdownId(e.target.value);
                    handleAddStaffFromDropdown(e.target.value);
                  }}
                  data-testid="teaching-staff-dropdown-selector"
                  aria-label="Select Registered Teaching Staff Member"
                  className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="">+ Select Registered Staff to Auto-Add...</option>
                  {teachingCandidates.map((cand) => (
                    <option key={cand.id} value={cand.id}>
                      {cand.fullName} — {cand.appointmentTitle} ({STAFF_ROLE_DEFINITIONS[cand.role]?.label || cand.role})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const blank = createFacultyStaffMember('New Academic Educator', 'Trainer & Assessor');
                    setFacultySetup((prev) => addStaffMember(prev, blank));
                    showToast('Added custom blank staff postcard.');
                  }}
                  data-testid="add-custom-staff-card-btn"
                  aria-label="Add Custom Staff Card"
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manual</span>
                </button>
              </div>
            </div>

            {/* Postcard Cards Grid */}
            {facultySetup.staffMembers.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Teaching Staff Postcards Added Yet</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Use the dropdown menu above to select registered Trainers, Assessors, and Lecturers. All their verified credentials, experience, and consultation hours will populate automatically!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facultySetup.staffMembers.map((staff, idx) => (
                  <div
                    key={staff.id}
                    data-testid={`faculty-postcard-${staff.id}`}
                    className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3.5 relative overflow-hidden transition-all hover:border-indigo-300"
                  >
                    {/* Postcard Ribbon indicator */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Information Postcard
                          </span>
                        </div>
                        {/* Full Name */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                          <input
                            type="text"
                            value={staff.name}
                            onChange={(e) => handleUpdatePostcard(staff.id, 'name', e.target.value)}
                            data-testid={`postcard-name-${staff.id}`}
                            aria-label={`Full Name for ${staff.id}`}
                            className="text-xs font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 outline-none w-full py-0.5"
                          />
                        </div>
                        {/* Appointment Title */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Appointment Title</label>
                          <input
                            type="text"
                            value={staff.role}
                            onChange={(e) => handleUpdatePostcard(staff.id, 'role', e.target.value)}
                            data-testid={`postcard-role-${staff.id}`}
                            aria-label={`Appointment Title for ${staff.id}`}
                            className="text-[11px] font-semibold text-indigo-700 bg-transparent border-b border-dashed border-slate-200 focus:border-indigo-600 outline-none w-full py-0.5"
                          />
                        </div>
                      </div>

                      {/* Confirm Delete Safety Controls */}
                      <div className="shrink-0">
                        {deletingPostcardId === staff.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in duration-200">
                            <button
                              type="button"
                              onClick={() => handleRemovePostcard(staff.id)}
                              data-testid={`confirm-delete-postcard-${staff.id}`}
                              aria-label={`Confirm Delete Postcard for ${staff.name}`}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPostcardId(null)}
                              data-testid={`cancel-delete-postcard-${staff.id}`}
                              aria-label="Cancel Delete"
                              className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingPostcardId(staff.id)}
                            data-testid={`delete-postcard-btn-${staff.id}`}
                            aria-label={`Delete Postcard for ${staff.name}`}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                            title="Delete Postcard"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Automatically Added: Academic Qualifications & Vocational Credentials */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Academic Qualifications &amp; Vocational Credentials</span>
                        <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1 rounded ml-auto">Auto-populated</span>
                      </label>
                      <input
                        type="text"
                        value={staff.qualifications}
                        onChange={(e) => handleUpdatePostcard(staff.id, 'qualifications', e.target.value)}
                        data-testid={`postcard-qualifications-${staff.id}`}
                        aria-label={`Academic Qualifications for ${staff.name}`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                      />
                    </div>

                    {/* Automatically Added: Industry Experience & Professional Currency */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Industry Experience &amp; Professional Currency</span>
                        <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1 rounded ml-auto">Auto-populated</span>
                      </label>
                      <textarea
                        rows={2}
                        value={staff.industryExperience}
                        onChange={(e) => handleUpdatePostcard(staff.id, 'industryExperience', e.target.value)}
                        data-testid={`postcard-experience-${staff.id}`}
                        aria-label={`Industry Experience for ${staff.name}`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white resize-y"
                      />
                    </div>

                    {/* Automatically Added: Email, Office & Student Consultation Hours */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>Email</span>
                        </span>
                        <input
                          type="email"
                          value={staff.email}
                          onChange={(e) => handleUpdatePostcard(staff.id, 'email', e.target.value)}
                          data-testid={`postcard-email-${staff.id}`}
                          aria-label={`Email for ${staff.name}`}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-[11px] font-mono text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Office / Campus</span>
                        </span>
                        <input
                          type="text"
                          value={staff.officeLocation || ''}
                          onChange={(e) => handleUpdatePostcard(staff.id, 'officeLocation', e.target.value)}
                          data-testid={`postcard-office-${staff.id}`}
                          aria-label={`Office Location for ${staff.name}`}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-[11px] text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Student Consultation Hours</span>
                          <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1 rounded ml-auto">Auto-populated</span>
                        </span>
                        <input
                          type="text"
                          value={staff.consultationHours || ''}
                          onChange={(e) => handleUpdatePostcard(staff.id, 'consultationHours', e.target.value)}
                          data-testid={`postcard-consultation-${staff.id}`}
                          aria-label={`Consultation Hours for ${staff.name}`}
                          placeholder="e.g. Tuesdays & Thursdays 1:00 PM – 3:00 PM (AEST)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-[11px] text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
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

      {/* SUBTAB 2: STAFF DIRECTORY & REGISTRATION SYSTEM */}
      {activeSubTab === 'staff_directory' && (
        <div className="space-y-6">
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by Name, Email, Role, Campus..."
                data-testid="staff-directory-search-input"
                aria-label="Search Staff Directory"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto py-1">
              {['ALL', 'Academic & Teaching', 'Student Support', 'Executive Leadership', 'Technical Operations', 'Institutional Administration'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  data-testid={`filter-category-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  aria-label={`Filter by ${cat}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <button
                type="button"
                onClick={handleOpenRegisterModal}
                data-testid="register-new-staff-btn"
                aria-label="Register New Staff Member"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Register Staff</span>
              </button>
            </div>
          </div>

          {/* Staff Members Table */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Staff Name &amp; Title</th>
                  <th className="p-3.5">Role &amp; Category</th>
                  <th className="p-3.5">Department &amp; Campus</th>
                  <th className="p-3.5">Key Role-Specific Credentials</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No staff members match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const meta = STAFF_ROLE_DEFINITIONS[staff.role] || STAFF_ROLE_DEFINITIONS.trainer;
                    return (
                      <tr key={staff.id} data-testid={`staff-row-${staff.id}`} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name & Title */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 text-xs">{staff.fullName}</div>
                          <div className="text-slate-500 text-[11px] font-medium">{staff.appointmentTitle}</div>
                        </td>

                        {/* Role & Category */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                            {meta.label}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">{meta.category}</div>
                        </td>

                        {/* Department & Campus */}
                        <td className="p-3.5 text-slate-600 max-w-[180px]">
                          <div className="font-medium text-slate-800 truncate">{staff.department}</div>
                          <div className="text-[11px] text-slate-500">{staff.campus}</div>
                        </td>

                        {/* Role-Specific Credentials Snapshot */}
                        <td className="p-3.5 max-w-[240px]">
                          {/* Teaching */}
                          {(staff.role === 'trainer' || staff.role === 'assessor' || staff.role === 'teacher' || staff.role === 'coordinator' || staff.role === 'dean') && (
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-semibold text-slate-800 line-clamp-1">{staff.qualifications}</div>
                              {staff.consultationHours && (
                                <div className="text-[10px] text-indigo-600 flex items-center gap-1">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{staff.consultationHours}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Student Counsellor */}
                          {staff.role === 'student_counsellor' && (
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-pink-700 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded">
                                {staff.counsellingCredentials || 'PACFA Registered'}
                              </span>
                              <div className="text-[10px] text-slate-500">WWCC: {staff.wwccNumber || 'Verified'}</div>
                            </div>
                          )}

                          {/* Executives */}
                          {(staff.role === 'chancellor' || staff.role === 'president' || staff.role === 'vice_president' || staff.role === 'ceo' || staff.role === 'coo' || staff.role === 'director') && (
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-bold text-slate-800">Term: {staff.boardTerm || '2024-2029'}</div>
                              <div className="text-[10px] text-slate-500 truncate">{staff.strategicDelegations}</div>
                            </div>
                          )}

                          {/* CFO */}
                          {staff.role === 'cfo' && (
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-bold text-emerald-800">{staff.accountingAccreditation}</div>
                              <div className="text-[10px] text-slate-500">Delegation: {staff.financialDelegationLimit}</div>
                            </div>
                          )}

                          {/* CTO / Tech Admin */}
                          {(staff.role === 'cto' || staff.role === 'tech_admin') && (
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded">
                                {staff.securityClearance || 'Security Clearance'}
                              </span>
                              <div className="text-[10px] text-slate-500 truncate">{staff.criticalEmergencyOnCall}</div>
                            </div>
                          )}

                          {/* Admin */}
                          {staff.role === 'admin' && (
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-semibold text-slate-800">{staff.administrativePortfolio}</div>
                              <div className="text-[10px] text-slate-500">SMS: {staff.smsSystemAccess}</div>
                            </div>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="text-slate-800 font-mono text-[11px]">{staff.email}</div>
                          <div className="text-slate-500 font-mono text-[10px]">{staff.phone}</div>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(staff)}
                              data-testid={`edit-staff-${staff.id}`}
                              aria-label={`Edit ${staff.fullName}`}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {/* Two-step confirm delete */}
                            {deletingStaffId === staff.id ? (
                              <div className="inline-flex items-center gap-1 animate-in fade-in duration-200">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStaffMember(staff.id)}
                                  data-testid={`confirm-delete-staff-${staff.id}`}
                                  aria-label={`Confirm Delete ${staff.fullName}`}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                                >
                                  <Trash2 className="w-2.5 h-2.5" /> Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingStaffId(null)}
                                  data-testid={`cancel-delete-staff-${staff.id}`}
                                  aria-label="Cancel Delete"
                                  className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingStaffId(staff.id)}
                                data-testid={`delete-staff-${staff.id}`}
                                aria-label={`Delete ${staff.fullName}`}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                                title="Delete Staff Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DYNAMIC ROLE-ADAPTIVE STAFF REGISTRATION MODAL */}
      {isModalOpen && selectedStaffForModal && (
        <div
          data-testid="staff-registration-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {modalMode === 'create' ? 'Register New Staff Member' : `Edit Profile: ${selectedStaffForModal.fullName}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Role-adaptive fields automatically adapt to academic, counselling, executive, and IT requirements.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveStaffFromModal} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Role Selector with neat categories */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Institutional Staff Role (Adapts Registration Requirements)
                </label>
                <select
                  value={selectedStaffForModal.role}
                  onChange={(e) => {
                    const nextRole = e.target.value as StaffRole;
                    const blank = createBlankStaffProfile(nextRole);
                    setSelectedStaffForModal({
                      ...blank,
                      fullName: selectedStaffForModal.fullName,
                      email: selectedStaffForModal.email,
                      phone: selectedStaffForModal.phone,
                      id: selectedStaffForModal.id
                    });
                  }}
                  data-testid="staff-role-selector-input"
                  aria-label="Staff Role"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                >
                  <optgroup label="Academic &amp; Teaching Faculty">
                    <option value="trainer">Vocational Trainer (Cert IV TAE / RTO)</option>
                    <option value="assessor">Vocational Assessor (ASQA Competency)</option>
                    <option value="teacher">Teaching Faculty / Lecturer (Higher Ed)</option>
                    <option value="coordinator">Course Coordinator / Program Director</option>
                    <option value="dean">Executive Dean / Head of Faculty</option>
                  </optgroup>
                  <optgroup label="Student Support &amp; Wellbeing">
                    <option value="student_counsellor">Student Counsellor (PACFA / Crisis Care)</option>
                  </optgroup>
                  <optgroup label="Executive Leadership &amp; Governance">
                    <option value="chancellor">Chancellor (University Council Head)</option>
                    <option value="president">President / Vice-Chancellor</option>
                    <option value="vice_president">Vice President (Enterprise &amp; Academics)</option>
                    <option value="ceo">Chief Executive Officer (CEO)</option>
                    <option value="coo">Chief Operating Officer (COO)</option>
                    <option value="cfo">Chief Financial Officer (CFO)</option>
                    <option value="director">College / Academic Director</option>
                  </optgroup>
                  <optgroup label="Technical &amp; Systems Operations">
                    <option value="cto">Chief Technology Officer (CTO)</option>
                    <option value="tech_admin">Technical Administrator (Cloud / SysAdmin)</option>
                  </optgroup>
                  <optgroup label="Institutional Administration">
                    <option value="admin">Institutional Administrator (Registrar / SMS)</option>
                  </optgroup>
                </select>
              </div>

              {/* Core Identity Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={selectedStaffForModal.fullName}
                    onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, fullName: e.target.value })}
                    data-testid="staff-modal-fullname-input"
                    aria-label="Full Name"
                    placeholder="e.g. Dr. Marcus Sterling"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Appointment Title *</label>
                  <input
                    type="text"
                    required
                    value={selectedStaffForModal.appointmentTitle}
                    onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, appointmentTitle: e.target.value })}
                    data-testid="staff-modal-appointment-input"
                    aria-label="Appointment Title"
                    placeholder="e.g. Lead Trainer & Safety Auditor"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Direct Email *</label>
                  <input
                    type="email"
                    required
                    value={selectedStaffForModal.email}
                    onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, email: e.target.value })}
                    data-testid="staff-modal-email-input"
                    aria-label="Direct Email"
                    placeholder="staff@super-rto.edu.au"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={selectedStaffForModal.phone}
                    onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, phone: e.target.value })}
                    data-testid="staff-modal-phone-input"
                    aria-label="Contact Phone"
                    placeholder="+61 2 9514 2040"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Campus Location</label>
                  <select
                    value={selectedStaffForModal.campus}
                    onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, campus: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs font-medium"
                  >
                    <option value="Sydney Broadway Campus">Sydney Broadway Campus</option>
                    <option value="Melbourne Central Campus">Melbourne Central Campus</option>
                    <option value="Brisbane Regional Training Centre">Brisbane Regional Training Centre</option>
                    <option value="Perth Innovation Campus">Perth Innovation Campus</option>
                    <option value="100% Online Delivery Division">100% Online Delivery Division</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Office / Room Location</label>
                  <input
                    type="text"
                    value={selectedStaffForModal.officeLocation}
                    onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, officeLocation: e.target.value })}
                    placeholder="e.g. Building 1, Level 5, Room 512"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Department / School</label>
                  <input
                    type="text"
                    value={selectedStaffForModal.department}
                    onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, department: e.target.value })}
                    placeholder="e.g. School of Work Health & Safety Compliance"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* DYNAMIC ROLE-SPECIFIC FIELD SECTIONS */}
              {/* 1. TEACHING FACULTY / TRAINERS & ASSESSORS */}
              {(selectedStaffForModal.role === 'trainer' ||
                selectedStaffForModal.role === 'assessor' ||
                selectedStaffForModal.role === 'teacher' ||
                selectedStaffForModal.role === 'coordinator' ||
                selectedStaffForModal.role === 'dean') && (
                <div className="space-y-3 pt-3 border-t border-slate-100 bg-amber-50/40 p-4 rounded-2xl border border-amber-200/60">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-amber-600" />
                    <span>Academic &amp; Vocational Teaching Requirements</span>
                  </h4>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Academic Qualifications &amp; Vocational Credentials
                    </label>
                    <input
                      type="text"
                      value={selectedStaffForModal.qualifications || ''}
                      onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, qualifications: e.target.value })}
                      placeholder="e.g. PhD (Ergonomics, USyd), Cert IV TAE40122, COHSPr"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Industry Experience &amp; Professional Currency
                    </label>
                    <textarea
                      rows={2}
                      value={selectedStaffForModal.industryExperience || ''}
                      onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, industryExperience: e.target.value })}
                      placeholder="Detail 5+ years verified practical experience in industry, statutory audits, or certifications..."
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Student Consultation Hours
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.consultationHours || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, consultationHours: e.target.value })}
                        placeholder="e.g. Tuesdays & Thursdays 1:00 PM – 3:00 PM (AEST)"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="asqa-verified-check"
                        checked={selectedStaffForModal.asqaTrainerMatrixVerified || false}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, asqaTrainerMatrixVerified: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <label htmlFor="asqa-verified-check" className="text-xs font-semibold text-slate-800 select-none">
                        ASQA Trainer &amp; Assessor Competency Matrix Verified
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. STUDENT COUNSELLOR */}
              {selectedStaffForModal.role === 'student_counsellor' && (
                <div className="space-y-3 pt-3 border-t border-slate-100 bg-pink-50/40 p-4 rounded-2xl border border-pink-200/60">
                  <h4 className="text-xs font-bold text-pink-900 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-pink-600" />
                    <span>Student Counsellor &amp; Clinical Wellbeing Credentials</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Clinical Counselling Credentials
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.counsellingCredentials || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, counsellingCredentials: e.target.value })}
                        placeholder="e.g. Master of Counselling, PACFA Reg Clinical 24901"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Working With Children Check (WWCC)
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.wwccNumber || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, wwccNumber: e.target.value })}
                        placeholder="e.g. WWC0849201E (Valid to Nov 2028 - NSW)"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Confidential Student Booking URL
                      </label>
                      <input
                        type="url"
                        value={selectedStaffForModal.confidentialBookingLink || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, confidentialBookingLink: e.target.value })}
                        placeholder="https://counselling.super-rto.edu.au/book/..."
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        24/7 Crisis Support On-Call Contact
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.emergencyCrisisPhone || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, emergencyCrisisPhone: e.target.value })}
                        placeholder="+61 400 111 999 (Crisis Pager)"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Crisis Specialisation &amp; Care Areas
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.crisisSpecialisation || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, crisisSpecialisation: e.target.value })}
                        placeholder="e.g. Crisis De-escalation, Academic Anxiety, Youth Mental Health First Aid"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. EXECUTIVE SUITE: CHANCELLOR, PRESIDENT, VICE PRESIDENT, CEO, COO, DIRECTOR */}
              {(selectedStaffForModal.role === 'chancellor' ||
                selectedStaffForModal.role === 'president' ||
                selectedStaffForModal.role === 'vice_president' ||
                selectedStaffForModal.role === 'ceo' ||
                selectedStaffForModal.role === 'coo' ||
                selectedStaffForModal.role === 'director') && (
                <div className="space-y-3 pt-3 border-t border-slate-100 bg-sky-50/40 p-4 rounded-2xl border border-sky-200/60">
                  <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-sky-600" />
                    <span>Executive Governance &amp; Statutory Authority</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Board Appointment Term
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.boardTerm || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, boardTerm: e.target.value })}
                        placeholder="e.g. 2024 – 2029 (Second Term)"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Executive Assistant (EA) Email
                      </label>
                      <input
                        type="email"
                        value={selectedStaffForModal.executiveAssistantEmail || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, executiveAssistantEmail: e.target.value })}
                        placeholder="executive.ea@super-rto.edu.au"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Strategic Delegations &amp; Expenditure Authority
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.strategicDelegations || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, strategicDelegations: e.target.value })}
                        placeholder="e.g. University Council sign-off, contracts up to AUD $10M, Academic Senate"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. CFO */}
              {selectedStaffForModal.role === 'cfo' && (
                <div className="space-y-3 pt-3 border-t border-slate-100 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200/60">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Chief Financial Officer (CFO) Fiscal Portfolio</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Accounting Professional Accreditation
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.accountingAccreditation || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, accountingAccreditation: e.target.value })}
                        placeholder="e.g. FCPA, CA ANZ, GAICD"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Statutory Spending Delegation Limit
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.financialDelegationLimit || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, financialDelegationLimit: e.target.value })}
                        placeholder="e.g. AUD $10,000,000"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Audit &amp; Treasury Governance Oversight
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.auditGovernancePortfolio || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, auditGovernancePortfolio: e.target.value })}
                        placeholder="e.g. National Audits Group, Commonwealth CSP Reconciliations, Token Treasury"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CTO & TECH ADMIN */}
              {(selectedStaffForModal.role === 'cto' || selectedStaffForModal.role === 'tech_admin') && (
                <div className="space-y-3 pt-3 border-t border-slate-100 bg-violet-50/40 p-4 rounded-2xl border border-violet-200/60">
                  <h4 className="text-xs font-bold text-violet-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-violet-600" />
                    <span>Technical Architecture &amp; Security Clearance</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Security Clearance Level
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.securityClearance || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, securityClearance: e.target.value })}
                        placeholder="e.g. Australian Government NV2 Clearance, ISO 27001"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        24/7 Critical Incident Emergency Pager
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.criticalEmergencyOnCall || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, criticalEmergencyOnCall: e.target.value })}
                        placeholder="+61 400 999 111 (Pager)"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. ADMIN */}
              {selectedStaffForModal.role === 'admin' && (
                <div className="space-y-3 pt-3 border-t border-slate-100 bg-cyan-50/40 p-4 rounded-2xl border border-cyan-200/60">
                  <h4 className="text-xs font-bold text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-cyan-600" />
                    <span>Registrar &amp; Institutional Administration</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Administrative Portfolio
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.administrativePortfolio || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, administrativePortfolio: e.target.value })}
                        placeholder="e.g. Student Admissions, USI & AVETMISS Reporting"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Student Management System (SMS) Access
                      </label>
                      <input
                        type="text"
                        value={selectedStaffForModal.smsSystemAccess || ''}
                        onChange={(e) => setSelectedStaffForModal({ ...selectedStaffForModal, smsSystemAccess: e.target.value })}
                        placeholder="e.g. VETtrak, EduPulse SMS, PRISMS"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-staff-registration-btn"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{modalMode === 'create' ? 'Register Staff Member' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
