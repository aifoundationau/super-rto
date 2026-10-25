'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Award,
  Globe,
  Sliders,
  AlertCircle
} from 'lucide-react';
import {
  COMPLIANCE_FRAMEWORKS,
  DEFAULT_COMPLIANCE_CODES,
  ComplianceFramework,
  listAllFrameworks
} from '@/lib/compliance/frameworks';

interface ComplianceFrameworkSelectorProps {
  currentUserRole?: string;
  institutionId?: string;
  institutionName?: string;
  initialPrimary?: string;
  initialSecondary?: string;
  onSave?: (selected: { primary: string; secondary: string; additional: string[] }) => void;
}

export const ComplianceFrameworkSelector: React.FC<ComplianceFrameworkSelectorProps> = ({
  currentUserRole = 'superadmin',
  institutionId = 'inst-default-college',
  institutionName = 'Australasian Institute of Technology',
  initialPrimary = 'ASQA',
  initialSecondary = 'TEQSA',
  onSave
}) => {
  const isSuperAdmin = currentUserRole === 'superadmin';
  const isDirector = currentUserRole === 'director' || isSuperAdmin;

  const [primaryCode, setPrimaryCode] = useState<string>(initialPrimary);
  const [secondaryCode, setSecondaryCode] = useState<string>(initialSecondary);
  const [additionalCodes, setAdditionalCodes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'ASQA' | 'TEQSA' | string>('ASQA');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const allFrameworks = listAllFrameworks();
  const currentViewFramework = COMPLIANCE_FRAMEWORKS[activeTab] || COMPLIANCE_FRAMEWORKS.ASQA;

  const handleToggleAdditional = (code: string) => {
    if (code === primaryCode || code === secondaryCode) return;
    setAdditionalCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        primary: primaryCode,
        secondary: secondaryCode,
        additional: additionalCodes
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div
      data-agent-id="compliance-framework-selector"
      data-testid="compliance-selector-container"
      className="bg-white border border-slate-200/90 rounded-2xl p-6 text-slate-900 shadow-sm space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sky-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Institutional Compliance & Standards</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                DEFAULT: ASQA & TEQSA
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select national or global regulatory bodies. Directors configure curriculum compliance profiles for their colleges.
            </p>
          </div>
        </div>

        {isDirector && (
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Building2 className="w-4 h-4 text-rose-600" />
            <span className="text-slate-600">
              Institution: <strong className="text-slate-900">{institutionName}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Primary & Secondary Selector Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Regulator */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Primary Governing Framework</span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold">Default: ASQA</span>
          </label>
          <select
            value={primaryCode}
            onChange={(e) => {
              setPrimaryCode(e.target.value);
              setActiveTab(e.target.value);
            }}
            data-testid="primary-framework-select"
            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 shadow-2xs"
          >
            {allFrameworks.map(f => (
              <option key={f.code} value={f.code}>
                {f.flagEmoji} {f.shortName} - {f.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500">
            Drives primary unit structures, nominal hour calculations, and statutory reporting exports.
          </p>
        </div>

        {/* Secondary Regulator */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Secondary / Higher Ed Framework</span>
            <span className="text-[10px] text-sky-700 font-mono font-bold">Default: TEQSA</span>
          </label>
          <select
            value={secondaryCode}
            onChange={(e) => {
              setSecondaryCode(e.target.value);
              setActiveTab(e.target.value);
            }}
            data-testid="secondary-framework-select"
            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-sky-600 shadow-2xs"
          >
            {allFrameworks.map(f => (
              <option key={f.code} value={f.code}>
                {f.flagEmoji} {f.shortName} - {f.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500">
            Drives degree-level assessment rubrics (AQF 7-9 / FHEQ) and academic integrity checks.
          </p>
        </div>
      </div>

      {/* Global Frameworks Navigation Pills */}
      <div>
        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
          <span>Global Compliance & Accreditation Library</span>
          <span className="text-[11px] text-slate-500">Click to inspect standards or enable dual accreditation</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allFrameworks.map(f => {
            const isPrimary = f.code === primaryCode;
            const isSecondary = f.code === secondaryCode;
            const isAdditional = additionalCodes.includes(f.code);
            const isSelectedTab = activeTab === f.code;

            return (
              <button
                key={f.code}
                type="button"
                onClick={() => setActiveTab(f.code)}
                data-testid={`framework-tab-${f.code}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                  isSelectedTab
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{f.flagEmoji}</span>
                <span>{f.shortName}</span>
                {isPrimary && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${isSelectedTab ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    Primary
                  </span>
                )}
                {isSecondary && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${isSelectedTab ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'}`}>
                    Secondary
                  </span>
                )}
                {isAdditional && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${isSelectedTab ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Framework Deep Dive Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentViewFramework.flagEmoji}</span>
              <div>
                <h3 className="text-base font-bold text-slate-900">{currentViewFramework.name}</h3>
                <span className="text-xs text-slate-500 font-mono">{currentViewFramework.jurisdiction} • {currentViewFramework.educationLevel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentViewFramework.website && (
              <a
                href={currentViewFramework.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 flex items-center gap-1 border border-slate-200 shadow-2xs"
              >
                <span>Official Portal</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            {currentViewFramework.code !== primaryCode && currentViewFramework.code !== secondaryCode && (
              <button
                type="button"
                onClick={() => handleToggleAdditional(currentViewFramework.code)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  additionalCodes.includes(currentViewFramework.code)
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                }`}
              >
                {additionalCodes.includes(currentViewFramework.code)
                  ? 'Remove Dual Accreditation'
                  : '+ Add as Dual Accreditation'}
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {currentViewFramework.description}
        </p>

        {/* Mandatory Requirements Checklist */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Core Standards & Mandatory Delivery Rules</span>
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
            {currentViewFramework.mandatoryRequirements.map((req, idx) => (
              <li key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start gap-2 shadow-2xs">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Standard Levels & Default Grading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-medium block mb-1">Recognized Qualification Levels:</span>
            <div className="flex flex-wrap gap-1.5">
              {currentViewFramework.standardLevels.map((lvl, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-white text-slate-700 font-mono text-[10px] border border-slate-200 font-semibold shadow-2xs">
                  {lvl}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-medium block mb-1">Default Assessment Marking Schema:</span>
            <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs font-bold inline-block">
              {currentViewFramework.defaultGrading === 'COMPETENCY_C_NYC'
                ? 'Competency-Based (C / NYC - Competent / Not Yet Competent)'
                : currentViewFramework.defaultGrading === 'FOUR_TIER_RUBRIC'
                ? '4-Tier Matrix (Novice, Competent, Proficient, Advanced)'
                : 'Percentage / GPA Grade Scale'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="text-xs text-slate-500">
          {savedSuccess ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Compliance defaults applied successfully!
            </span>
          ) : (
            <span>Defaults: ASQA (VET) & TEQSA (Higher Ed). Configurable by Superadmin & College Directors.</span>
          )}
        </div>

        <button
          type="button"
          data-testid="save-compliance-btn"
          onClick={handleSave}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
        >
          Save Compliance Configuration
        </button>
      </div>
    </div>
  );
};
