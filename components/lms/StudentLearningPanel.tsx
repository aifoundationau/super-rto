'use client';

import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  Award,
  BookOpen,
  FileText,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { toStrictIntegerTokens } from '@/lib/tokens/pricing';

export const StudentLearningPanel: React.FC = () => {
  const [activeLessonId, setActiveLessonId] = useState<string>('les-1');
  const [submissionLink, setSubmissionLink] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCompetent, setIsCompetent] = useState<boolean>(false);
  const [certificateIssued, setCertificateIssued] = useState<boolean>(false);

  const handleSubmitAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionLink.trim()) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsCompetent(true);
    }, 1500);
  };

  const handleIssueCertificate = () => {
    setCertificateIssued(true);
  };

  return (
    <div
      data-agent-id="lms-player"
      data-testid="student-learning-panel-container"
      className="bg-white border border-slate-200/90 rounded-2xl p-6 text-slate-900 shadow-sm space-y-6 max-w-6xl mx-auto"
    >
      {/* Course Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              BSB41419 • AQF LEVEL 4
            </span>
            <span className="text-xs text-slate-500 font-mono">ASQA Registered Qualification</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Certificate IV in Work Health and Safety
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit: BSBWHS411 - Implement and monitor WHS policies, procedures and programs
          </p>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Competency Progress</span>
            <span className="text-sm font-bold text-emerald-700 font-mono">
              {isCompetent ? '100% Competent (C)' : isSubmitted ? 'Under Assessor Review' : 'In Progress'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 shadow-2xs">
            {isCompetent ? '✓' : '45%'}
          </div>
        </div>
      </div>

      {/* Main Learning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Content Viewer (2 Cols) */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Simulated Video Player */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center group shadow-md">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
            <div className="text-center z-10 space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform cursor-pointer">
                <Play className="w-6 h-6 ml-1 fill-current" />
              </div>
              <p className="text-xs text-slate-100 font-semibold">Safe Work Australia: Practical Hazard Management</p>
              <span className="text-[10px] font-mono text-slate-400">Asynchronous Video Lecture • 14:20 min</span>
            </div>
          </div>

          {/* Core Theory & Gen AI Protocol */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Lesson 1: Harmonised WHS Legislation & Risk Management</span>
            </h3>
            
            <p className="text-xs text-slate-700 leading-relaxed">
              Under the Model Work Health and Safety (WHS) Act, duty holders must eliminate risks to health and safety so far as is reasonably practicable. If elimination is not reasonably practicable, risks must be minimized using the <strong>Hierarchy of Control Measures</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <strong className="text-emerald-700 block mb-0.5">1. Elimination & Substitution</strong>
                <span className="text-slate-500 text-[11px]">Physically remove the hazard or substitute with a safer material.</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <strong className="text-sky-700 block mb-0.5">2. Engineering Controls</strong>
                <span className="text-slate-500 text-[11px]">Isolate people from the hazard via physical guarding and ventilation.</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <strong className="text-amber-700 block mb-0.5">3. Administrative Controls</strong>
                <span className="text-slate-500 text-[11px]">Change workplace policies, signage, and standard operating procedures.</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <strong className="text-rose-700 block mb-0.5">4. Personal Protective Equipment (PPE)</strong>
                <span className="text-slate-500 text-[11px]">Last line of defense; helmets, eyewear, masks, and steel-capped boots.</span>
              </div>
            </div>

            {/* Academic Integrity & Generative AI Guidance */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 text-[11px] text-indigo-950 space-y-1">
              <span className="font-bold text-indigo-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> TEQSA & ASQA Academic Integrity Policy:
              </span>
              <p className="text-slate-600 leading-relaxed">
                Generative AI tools may be consulted for research synthesis. Direct copying of AI-synthesized responses without genuine workplace evidence is strictly prohibited under institutional integrity standards.
              </p>
            </div>
          </div>

          {/* Assessment Submission Portal */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Summative Assessment 1: Workplace Hazard Identification</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                Competency Sign-Off Required
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Submit your completed risk evaluation spreadsheet or PDF portfolio demonstrating consultation with workplace health and safety representatives.
            </p>

            {!isSubmitted ? (
              <form onSubmit={handleSubmitAssessment} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    placeholder="Enter Google Drive, OneDrive, or Canvas submission link..."
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 font-mono shadow-2xs"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    Submit Portfolio
                  </button>
                </div>
              </form>
            ) : isCompetent ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between text-emerald-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Outcome: Competent (C) Awarded</span>
                  </span>
                  <span className="font-mono text-[10px] text-emerald-700">Assessor: J. Thompson (TAE40116)</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  "Comprehensive risk assessment with excellent hazard stratification according to the WHS Act. Clear hierarchy of controls."
                </p>

                {/* Credential Issuance */}
                {!certificateIssued ? (
                  <button
                    type="button"
                    onClick={handleIssueCertificate}
                    className="mt-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Award className="w-4 h-4" />
                    <span>Generate Official Statement of Attainment</span>
                  </button>
                ) : (
                  <div className="mt-2 p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-slate-900 font-bold block">Statement of Attainment #SOA-2026-94812</span>
                      <span className="text-[10px] text-slate-500 font-mono">ASQA Registered Credential • USI Validated</span>
                    </div>
                    <a
                      href="#download"
                      onClick={(e) => { e.preventDefault(); alert('Downloading verified PDF Statement of Attainment...'); }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Portfolio submitted. Assessor review in progress (ASQA standards SLA: 48h).</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Course Outline */}
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Unit Curriculum Outline
            </h4>

            <div className="space-y-1.5">
              {[
                { id: 'les-1', title: '1. Legislative Frameworks & WHS Acts', duration: '45m', completed: true },
                { id: 'les-2', title: '2. Consultative Arrangements & WHS Reps', duration: '45m', completed: isSubmitted },
                { id: 'les-3', title: '3. Hazard Identification & Risk Matrix', duration: '60m', completed: isCompetent },
                { id: 'les-4', title: '4. Hierarchy of Control Implementation', duration: '45m', completed: isCompetent },
                { id: 'les-5', title: '5. Incident Reporting & Continuous Review', duration: '45m', completed: isCompetent }
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveLessonId(item.id)}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                    activeLessonId === item.id
                      ? 'bg-white border-indigo-400 text-indigo-950 font-bold shadow-xs'
                      : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      item.completed ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {item.completed ? '✓' : '•'}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{item.duration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Support Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-900 block">Assessor Support & Consultation</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Have questions regarding competency requirements or workplace evidence? Message your designated trainer directly.
            </p>
            <button
              type="button"
              onClick={() => alert('Opening trainer messaging channel...')}
              className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs text-indigo-700 font-bold transition-all shadow-2xs"
            >
              💬 Contact Assessor
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
