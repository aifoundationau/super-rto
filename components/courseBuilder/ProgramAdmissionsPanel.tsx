'use client';

import React, { useState } from 'react';
import {
  Globe,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  GraduationCap,
  FileText,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Shield,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ProgramAdmissionsProfile,
  StudentType,
  DeliveryMode,
  DomesticFundingType,
  CampusLocation,
  convertAtarToInternationalScores,
  formatAud,
  calculateAnnualTuition,
  calculateTotalTuition
} from '@/lib/courseBuilder/admissions';

export interface ProgramAdmissionsPanelProps {
  profile: ProgramAdmissionsProfile;
  onChange: (updatedProfile: ProgramAdmissionsProfile) => void;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ProgramAdmissionsPanel: React.FC<ProgramAdmissionsPanelProps> = ({
  profile,
  onChange,
  isCollapsible = true,
  defaultCollapsed = false,
  isCollapsed: controlledCollapsed,
  onToggleCollapse
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (!isCollapsible) return;
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);

  const isDomestic = profile.studentType === 'domestic';
  const activeCampus =
    profile.campuses.find((c) => c.id === profile.selectedCampusId) || profile.campuses[0];
  const activeIntake =
    profile.intakes.find((i) => i.id === profile.selectedIntakeId) || profile.intakes[0];

  const annualTuition = calculateAnnualTuition(profile, profile.studentType);
  const totalTuition = calculateTotalTuition(profile, profile.studentType);

  const handleStudentTypeChange = (type: StudentType) => {
    onChange({
      ...profile,
      studentType: type
    });
  };

  const handleCampusChange = (campusId: string) => {
    onChange({
      ...profile,
      selectedCampusId: campusId
    });
  };

  const handleDeliveryModeChange = (mode: DeliveryMode) => {
    onChange({
      ...profile,
      selectedDeliveryMode: mode
    });
  };

  const handleAtarChange = (newAtar: number) => {
    const validAtar = Math.max(30, Math.min(99.95, isNaN(newAtar) ? 70 : newAtar));
    const internationalScores = convertAtarToInternationalScores(validAtar);
    onChange({
      ...profile,
      entryThresholds: {
        ...profile.entryThresholds,
        atar: validAtar,
        gpa: internationalScores.gpa,
        sat: internationalScores.sat,
        act: internationalScores.act,
        aLevels: internationalScores.aLevels,
        ucasPoints: internationalScores.ucasPoints,
        ibPoints: internationalScores.ibPoints
      }
    });
  };

  const handleCopyCode = (key: string, value: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopiedCodeKey(key);
      setTimeout(() => setCopiedCodeKey(null), 2000);
    }
  };

  return (
    <div
      data-agent-id="course-builder-admissions-panel"
      data-testid="program-admissions-panel"
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
              data-agent-id="course-builder-toggle-admissions-panel-btn"
              data-testid="toggle-admissions-panel-btn"
              aria-label="Toggle Program Admissions Panel"
              aria-expanded={!isCollapsed}
              className="p-1 rounded hover:bg-slate-200 text-indigo-600 transition-colors shrink-0"
              title={isCollapsed ? 'Expand Admissions Panel' : 'Collapse Admissions Panel'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-indigo-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          )}

          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-indigo-700" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Admissions, Delivery &amp; Program Profile
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isDomestic
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-sky-100 text-sky-800 border border-sky-200'
                }`}
              >
                {isDomestic ? 'Domestic (CSP / HECS-HELP)' : 'International (CRICOS / Visa 500)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Dynamic student selector, campus locations, entry thresholds (ATAR, GPA, SAT, A-Levels, UCAS), duration, indicative tuition &amp; tertiary codes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Quick Student Type Toggle in Header */}
          <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => handleStudentTypeChange('domestic')}
              data-agent-id="student-type-domestic-pill-btn"
              data-testid="student-type-domestic-btn"
              aria-label="Select Domestic Student"
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                isDomestic
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇦🇺 Domestic
            </button>
            <button
              type="button"
              onClick={() => handleStudentTypeChange('international')}
              data-agent-id="student-type-international-pill-btn"
              data-testid="student-type-international-btn"
              aria-label="Select International Student"
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                !isDomestic
                  ? 'bg-white text-sky-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌏 International
            </button>
          </div>

          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            {isCollapsed ? 'Click to expand' : 'Click to collapse'}
          </span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-5 space-y-6">
          {/* 1. Student Type Master Banner */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isDomestic
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-sky-50/60 border-sky-200 text-sky-950'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{isDomestic ? '🇦🇺' : '🌏'}</span>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {isDomestic
                      ? 'Domestic Student Profile (Australian / NZ Citizens & PR)'
                      : 'International Student Profile (Overseas / Student Visa Subclass 500)'}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isDomestic
                    ? 'Tuition is calculated on Commonwealth Supported Place (CSP) bands with HECS-HELP deferred loans. Flexible part-time study loads and domestic admission center preferences apply.'
                    : `CRICOS Registered Code: ${profile.admissionsCodes.cricosCode || '0101854K'}. Under the ESOS Act, international visa holders must study onshore full-time (minimum 75-100% load) with max 33% online coursework.`}
                </p>
              </div>

              {/* Student Type Selector Segmented Controls */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white border border-slate-300 rounded-lg p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleStudentTypeChange('domestic')}
                  data-agent-id="course-builder-select-domestic-btn"
                  data-testid="select-domestic-mode-btn"
                  aria-label="Set Mode to Domestic Student"
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isDomestic
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isDomestic ? 'text-white' : 'text-slate-400'}`} />
                  <span>Domestic</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStudentTypeChange('international')}
                  data-agent-id="course-builder-select-international-btn"
                  data-testid="select-international-mode-btn"
                  aria-label="Set Mode to International Student"
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    !isDomestic
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 ${!isDomestic ? 'text-white' : 'text-slate-400'}`} />
                  <span>International</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2x2 Grid of Key Program Admissions Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 2. Campus & Delivery Mode (Location) */}
            <div
              data-testid="panel-campus-delivery"
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>Campus &amp; Location</span>
                </span>
                {activeCampus.isRegional && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Regional Migration Category
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Primary Campus Location
                </label>
                <select
                  value={profile.selectedCampusId}
                  onChange={(e) => handleCampusChange(e.target.value)}
                  data-agent-id="course-builder-campus-select"
                  data-testid="campus-select"
                  aria-label="Select Campus Location"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 shadow-2xs cursor-pointer"
                >
                  {profile.campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city}, {c.state}) {c.isRegional ? '• Regional' : ''}
                    </option>
                  ))}
                </select>
                {activeCampus.transitInfo && (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{activeCampus.transitInfo}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Delivery Mode (Commute &amp; Study Preference)
                </label>
                <div className="grid grid-cols-3 gap-1 bg-white border border-slate-300 rounded-lg p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleDeliveryModeChange('on_campus')}
                    data-testid="delivery-mode-on-campus-btn"
                    className={`px-2 py-1.5 rounded text-[11px] font-bold text-center transition-all ${
                      profile.selectedDeliveryMode === 'on_campus'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    On-Campus
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeliveryModeChange('hybrid')}
                    data-testid="delivery-mode-hybrid-btn"
                    className={`px-2 py-1.5 rounded text-[11px] font-bold text-center transition-all ${
                      profile.selectedDeliveryMode === 'hybrid'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Hybrid
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeliveryModeChange('online')}
                    data-testid="delivery-mode-online-btn"
                    className={`px-2 py-1.5 rounded text-[11px] font-bold text-center transition-all ${
                      profile.selectedDeliveryMode === 'online'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    100% Online
                  </button>
                </div>
                {!isDomestic && profile.selectedDeliveryMode === 'online' && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-1.5 mt-1.5">
                    ⚠️ ESOS Warning: Student Visa 500 holders cannot enroll in 100% online courses onshore.
                  </p>
                )}
              </div>
            </div>

            {/* 3. Entry Threshold (Standardized High School & International Standards) */}
            <div
              data-testid="panel-entry-threshold"
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Entry Threshold</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                  Most Recent Intake Benchmark
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    {isDomestic ? 'Minimum Selection Rank (ATAR)' : 'ATAR Benchmark Equivalent'}
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Range 30.00 – 99.95</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="30"
                    max="99.95"
                    value={profile.entryThresholds.atar}
                    onChange={(e) => handleAtarChange(parseFloat(e.target.value))}
                    data-agent-id="course-builder-atar-input"
                    data-testid="entry-threshold-atar-input"
                    aria-label="Minimum ATAR Entry Threshold"
                    className="w-24 bg-white border border-slate-300 rounded-lg p-2 text-sm font-mono font-bold text-emerald-700 outline-none focus:border-emerald-600 shadow-2xs"
                  />
                  <div className="text-[11px] text-slate-500 leading-tight">
                    {isDomestic ? (
                      <span>EAS adjustments apply (up to +5 ATAR bonus points for regional/hardship).</span>
                    ) : (
                      <span>Auto-converts into international qualifications below.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* International Rankings Equivalency Grid */}
              <div className="border border-slate-200 rounded-lg bg-white p-2.5 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  International Ranking Standards
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200/80">
                    <span className="text-slate-400 block text-[9px] font-bold">GPA + SAT / ACT</span>
                    <span className="font-mono font-bold text-slate-800">
                      GPA {profile.entryThresholds.gpa.toFixed(1)} &bull; SAT {profile.entryThresholds.sat}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200/80">
                    <span className="text-slate-400 block text-[9px] font-bold">GCE A-Levels</span>
                    <span className="font-mono font-bold text-slate-800">
                      {profile.entryThresholds.aLevels}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200/80">
                    <span className="text-slate-400 block text-[9px] font-bold">UCAS Tariff</span>
                    <span className="font-mono font-bold text-slate-800">
                      {profile.entryThresholds.ucasPoints} pts
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200/80">
                    <span className="text-slate-400 block text-[9px] font-bold">IB Diploma</span>
                    <span className="font-mono font-bold text-slate-800">
                      {profile.entryThresholds.ibPoints} pts
                    </span>
                  </div>
                </div>

                {!isDomestic && (
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-600">
                    <span className="font-bold">English Requirement:</span>
                    <span className="font-mono">IELTS {profile.entryThresholds.ieltsOverall} &bull; TOEFL {profile.entryThresholds.toeflIbt} &bull; PTE {profile.entryThresholds.pteAcademic}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Duration & Study Load */}
            <div
              data-testid="panel-duration"
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Program Duration</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  Standard Full-Time Load
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Full-Time Baseline (Years)
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {profile.durationYears * 2} Semesters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="6"
                      value={profile.durationYears}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        onChange({
                          ...profile,
                          durationYears: val,
                          partTimeYears: val * 2
                        });
                      }}
                      data-agent-id="course-builder-duration-input"
                      data-testid="duration-years-input"
                      aria-label="Full-Time Duration in Years"
                      className="w-24 bg-white border border-slate-300 rounded-lg p-2 text-sm font-mono font-bold text-amber-800 outline-none focus:border-amber-600 shadow-2xs"
                    />
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...profile,
                              durationYears: yr,
                              partTimeYears: yr * 2
                            })
                          }
                          data-testid={`duration-preset-${yr}yr`}
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                            profile.durationYears === yr
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {yr} yr
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg bg-white p-2.5 space-y-1 text-xs shadow-2xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold">Part-Time Equivalent:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {profile.partTimeYears} Years (50% study load)
                    </span>
                  </div>
                  {profile.acceleratedYears && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Accelerated Trimesters:</span>
                      <span className="font-mono font-bold text-indigo-700">
                        {profile.acceleratedYears} Years (3 terms/year)
                      </span>
                    </div>
                  )}
                  {!isDomestic && (
                    <p className="text-[10px] text-sky-800 font-medium pt-1 border-t border-slate-100">
                      ℹ️ Visa 500 holders must complete within standard {profile.durationYears} years (100% full-time load).
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Indicative Fees & Funding Type */}
            <div
              data-testid="panel-fees-funding"
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Indicative Fees &amp; Funding</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isDomestic
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-sky-100 text-sky-900 border border-sky-300'
                  }`}
                >
                  {isDomestic ? 'CSP Supported' : 'Full-Fee Overseas'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Funding Type
                </label>
                {isDomestic ? (
                  <select
                    value={profile.domesticFundingType}
                    onChange={(e) =>
                      onChange({
                        ...profile,
                        domesticFundingType: e.target.value as DomesticFundingType
                      })
                    }
                    data-agent-id="course-builder-funding-type-select"
                    data-testid="funding-type-select"
                    aria-label="Domestic Funding Type"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 shadow-2xs cursor-pointer"
                  >
                    <option value="csp">Commonwealth Supported Place (CSP) - HECS-HELP</option>
                    <option value="full_fee">Domestic Full-Fee Paying - FEE-HELP</option>
                    <option value="state_subsidised">State Subsidised / Smart and Skilled / TAFE</option>
                  </select>
                ) : (
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 text-xs font-bold text-sky-900 shadow-2xs">
                    International Full-Fee Paying (Self-Funded / Overseas Sponsor)
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Annual Indicative Tuition ({profile.studentType.toUpperCase()})
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">AUD per Year</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={isDomestic ? profile.annualTuitionDomestic : profile.annualTuitionInternational}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      if (isDomestic) {
                        onChange({ ...profile, annualTuitionDomestic: val });
                      } else {
                        onChange({ ...profile, annualTuitionInternational: val });
                      }
                    }}
                    data-agent-id="course-builder-tuition-input"
                    data-testid="annual-tuition-input"
                    aria-label="Annual Indicative Tuition in AUD"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm font-mono font-bold text-slate-900 outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg bg-white p-2.5 space-y-1 text-xs shadow-2xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Total Estimated Program Fee:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatAud(totalTuition)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>SSAF Amenities: {formatAud(profile.ssafAnnualFee)}/yr</span>
                  <span>{isDomestic ? 'HECS-HELP eligible' : 'OSHC health cover required'}</span>
                </div>
              </div>
            </div>

            {/* 6. Admissions Code (Tertiary Central Processing Codes) */}
            <div
              data-testid="panel-admissions-code"
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Admissions Codes</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  Tertiary Preferences
                </span>
              </div>

              <div className="space-y-2">
                {isDomestic ? (
                  <>
                    {/* UAC / VTAC / QTAC Codes */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          UAC Code (NSW/ACT)
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {profile.admissionsCodes.uac || '602050'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode('uac', profile.admissionsCodes.uac || '602050')}
                        data-testid="copy-uac-code-btn"
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                        title="Copy UAC Code"
                      >
                        {copiedCodeKey === 'uac' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          VTAC Code (VIC)
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {profile.admissionsCodes.vtac || '3400212341'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode('vtac', profile.admissionsCodes.vtac || '3400212341')}
                        data-testid="copy-vtac-code-btn"
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                        title="Copy VTAC Code"
                      >
                        {copiedCodeKey === 'vtac' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* CRICOS Course Code for Overseas Visa Holders */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50 border border-sky-200 shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-sky-800 block uppercase">
                          CRICOS Course Code (Visa 500)
                        </span>
                        <span className="text-xs font-mono font-bold text-sky-950">
                          {profile.admissionsCodes.cricosCode || '0101854K'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode('cricos', profile.admissionsCodes.cricosCode || '0101854K')}
                        data-testid="copy-cricos-code-btn"
                        className="p-1 rounded text-sky-600 hover:text-sky-900 hover:bg-sky-100 transition-colors"
                        title="Copy CRICOS Code"
                      >
                        {copiedCodeKey === 'cricos' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* Direct Institution Admission Code */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Direct Application Code
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-700">
                      {profile.admissionsCodes.directCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode('direct', profile.admissionsCodes.directCode)}
                    data-testid="copy-direct-code-btn"
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                    title="Copy Direct Code"
                  >
                    {copiedCodeKey === 'direct' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 7. Intake / Start Period */}
            <div
              data-testid="panel-intake-period"
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>Intake &amp; Start Periods</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  Admissions Open
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Select Target Intake
                </label>
                <select
                  value={profile.selectedIntakeId}
                  onChange={(e) =>
                    onChange({
                      ...profile,
                      selectedIntakeId: e.target.value
                    })
                  }
                  data-agent-id="course-builder-intake-select"
                  data-testid="intake-select"
                  aria-label="Select Intake Period"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 shadow-2xs cursor-pointer"
                >
                  {profile.intakes.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} {i.isOpen ? '• Open' : '• Closed'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border border-slate-200 rounded-lg bg-white p-2.5 space-y-1.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Start Period:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {activeIntake.startMonth} {activeIntake.year}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">
                    {isDomestic ? 'Domestic Deadline:' : 'International Deadline:'}
                  </span>
                  <span className="font-mono font-bold text-rose-600">
                    {isDomestic
                      ? activeIntake.deadlineDomestic || '31 Jan 2027'
                      : activeIntake.deadlineInternational || '15 Dec 2026'}
                  </span>
                </div>
                {activeIntake.orientationDate && (
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Orientation Week:</span>
                    <span>{activeIntake.orientationDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
