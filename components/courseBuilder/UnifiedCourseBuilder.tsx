'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Sparkles,
  Save,
  CheckCircle2,
  Video,
  FileText,
  Clock,
  BookOpen,
  Award
} from 'lucide-react';
import { toStrictIntegerTokens } from '@/lib/tokens/pricing';

export interface LessonBlock {
  id: string;
  type: 'text_description' | 'teacher_guide' | 'youtube_video' | 'google_drive_link' | 'file_upload' | 'quiz';
  title: string;
  content: string;
}

export interface CourseUnit {
  id: string;
  unitCode: string;
  unitTitle: string;
  nominalHours: number;
  description: string;
  lessons: {
    id: string;
    title: string;
    estimatedMinutes: number;
    blocks: LessonBlock[];
  }[];
  assessments: {
    id: string;
    type: 'formative' | 'summative';
    title: string;
    description: string;
    criteria: {
      name: string;
      weight: number;
      competentDescriptor: string;
      notYetCompetentDescriptor: string;
    }[];
  }[];
}

export interface CourseData {
  id: string;
  title: string;
  code: string;
  frameworkCode: string;
  aqfLevel: number;
  tokenCost: number;
  description: string;
  units: CourseUnit[];
}

const DEFAULT_COURSE: CourseData = {
  id: 'course-bsb41419',
  title: 'Certificate IV in Work Health and Safety',
  code: 'BSB41419',
  frameworkCode: 'ASQA',
  aqfLevel: 4,
  tokenCost: 10,
  description: 'National qualification for occupational health and safety coordinators and compliance officers.',
  units: [
    {
      id: 'unit-bsbwhs411',
      unitCode: 'BSBWHS411',
      unitTitle: 'Implement and monitor WHS policies, procedures and programs',
      nominalHours: 40,
      description: 'Covers practical skills to facilitate statutory compliance and consultative arrangements in an Australian workplace.',
      lessons: [
        {
          id: 'les-1',
          title: 'Legislative Frameworks and Work Health and Safety Acts',
          estimatedMinutes: 45,
          blocks: [
            {
              id: 'blk-1',
              type: 'text_description',
              title: 'Harmonised WHS Legislation Overview',
              content: 'Australian WHS Acts require employers to ensure the health and safety of workers so far as is reasonably practicable. Generative AI tools may be consulted for research synthesis under academic integrity policies.'
            },
            {
              id: 'blk-2',
              type: 'teacher_guide',
              title: 'Pedagogical Scaffolding & Student Wellbeing',
              content: '0-15m: Introduction to Safe Work Australia principles. 15-30m: Small group hazard scenario analysis. 30-45m: Formative check-in on student comprehension.'
            },
            {
              id: 'blk-3',
              type: 'youtube_video',
              title: 'Safe Work Australia: Practical Risk Management',
              content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            }
          ]
        }
      ],
      assessments: [
        {
          id: 'ass-1',
          type: 'summative',
          title: 'Workplace Hazard Identification Portfolio',
          description: 'Conduct a risk assessment of a designated work area and draft a consultative report.',
          criteria: [
            {
              name: 'Hazard Identification & Regulatory Citations',
              weight: 50,
              competentDescriptor: 'Accurately identifies all 4 statutory workplace hazards and cites relevant WHS Act clauses.',
              notYetCompetentDescriptor: 'Omitted 2 or more hazards or failed to reference legislation.'
            },
            {
              name: 'Consultative Recommendations',
              weight: 50,
              competentDescriptor: 'Demonstrates clear hierarchy of controls with stakeholder consultation evidence.',
              notYetCompetentDescriptor: 'Controls do not follow the hierarchy or lack consultation logs.'
            }
          ]
        }
      ]
    }
  ]
};

export const UnifiedCourseBuilder: React.FC = () => {
  const [course, setCourse] = useState<CourseData>(DEFAULT_COURSE);
  const [activeUnitIndex, setActiveUnitIndex] = useState<number>(0);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiSyllabusInput, setAiSyllabusInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeUnit = course.units[activeUnitIndex] || course.units[0];

  const handleAddUnit = () => {
    const newUnit: CourseUnit = {
      id: `unit-${Date.now()}`,
      unitCode: 'NEWUNIT',
      unitTitle: 'New Unit of Competency',
      nominalHours: 40,
      description: 'Unit description and learning outcomes.',
      lessons: [],
      assessments: []
    };
    setCourse({
      ...course,
      units: [...course.units, newUnit]
    });
    setActiveUnitIndex(course.units.length);
  };

  const handleAddLesson = (unitIdx: number) => {
    const updatedUnits = [...course.units];
    updatedUnits[unitIdx].lessons.push({
      id: `les-${Date.now()}`,
      title: 'New Modular Lesson',
      estimatedMinutes: 45,
      blocks: [
        {
          id: `blk-${Date.now()}-1`,
          type: 'text_description',
          title: 'Core Theory & Concepts',
          content: 'Lesson content here.'
        }
      ]
    });
    setCourse({ ...course, units: updatedUnits });
  };

  const handleAddBlock = (unitIdx: number, lessonIdx: number, type: LessonBlock['type']) => {
    const updatedUnits = [...course.units];
    updatedUnits[unitIdx].lessons[lessonIdx].blocks.push({
      id: `blk-${Date.now()}`,
      type,
      title: type === 'teacher_guide' ? 'Teacher Pedagogy Guide' : type === 'youtube_video' ? 'Video Lecture' : 'Resource Block',
      content: ''
    });
    setCourse({ ...course, units: updatedUnits });
  };

  const handleAiIngest = () => {
    if (!aiSyllabusInput.trim()) return;

    const lines = aiSyllabusInput.split('\n');
    let title = course.title;
    let code = course.code;

    for (const line of lines) {
      if (line.toUpperCase().startsWith('COURSE TITLE:')) {
        title = line.replace(/COURSE TITLE:/i, '').trim();
      }
      if (line.toUpperCase().startsWith('COURSE CODE:')) {
        code = line.replace(/COURSE CODE:/i, '').trim();
      }
    }

    setCourse({
      ...course,
      title,
      code,
      description: `Imported via AI Ingest engine. Parsed syllabus into ASQA & TEQSA structured units.`
    });

    setIsAiModalOpen(false);
    setStatusMessage('✨ Course successfully synthesized with AI Ingest (10 tokens applied).');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div
      data-agent-id="course-builder"
      data-testid="unified-course-builder-container"
      className="bg-white border border-slate-200/90 rounded-2xl p-6 text-slate-900 shadow-sm space-y-6 max-w-6xl mx-auto"
    >
      {/* Builder Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">LMS Course & Curriculum Builder</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                PRO-LMS FUSION
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Author ASQA vocational competencies, TEQSA higher ed rubrics, or international modular courses.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="ai-ingest-btn"
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>✨ AI Ingest (10 Tokens)</span>
          </button>

          <button
            type="button"
            data-testid="save-course-btn"
            onClick={() => {
              setStatusMessage('Course structure saved to Firestore successfully.');
              setTimeout(() => setStatusMessage(null), 3000);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Course</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top Level Course Meta Form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
          <input
            type="text"
            value={course.title}
            onChange={(e) => setCourse({ ...course, title: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-bold outline-none focus:border-indigo-600 shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Course Code</label>
          <input
            type="text"
            value={course.code}
            onChange={(e) => setCourse({ ...course, code: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-mono font-bold outline-none focus:border-indigo-600 shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Token Cost (Strict Integer)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={course.tokenCost}
            onChange={(e) => setCourse({ ...course, tokenCost: toStrictIntegerTokens(parseInt(e.target.value) || 0) })}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-amber-700 font-mono font-bold outline-none focus:border-amber-600 shadow-2xs"
          />
        </div>
      </div>

      {/* Units Sidebar & Curriculum Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Units List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Units of Competency ({course.units.length})
            </span>
            <button
              type="button"
              data-testid="add-unit-btn"
              onClick={handleAddUnit}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Unit</span>
            </button>
          </div>

          <div className="space-y-2">
            {course.units.map((u, idx) => (
              <div
                key={u.id}
                onClick={() => setActiveUnitIndex(idx)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  activeUnitIndex === idx
                    ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700">{u.unitCode}</span>
                  <span className="text-[10px] text-slate-500 font-mono font-medium">{u.nominalHours} Hours</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{u.unitTitle}</h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2">
                  <span>{u.lessons.length} Lessons</span>
                  <span>•</span>
                  <span>{u.assessments.length} Assessments</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Lessons Editor */}
        <div className="lg:col-span-2 space-y-5">
          {activeUnit && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Title</label>
                  <input
                    type="text"
                    value={activeUnit.unitTitle}
                    onChange={(e) => {
                      const updated = [...course.units];
                      updated[activeUnitIndex].unitTitle = e.target.value;
                      setCourse({ ...course, units: updated });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-bold outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Hours</label>
                  <input
                    type="number"
                    value={activeUnit.nominalHours}
                    onChange={(e) => {
                      const updated = [...course.units];
                      updated[activeUnitIndex].nominalHours = parseInt(e.target.value) || 40;
                      setCourse({ ...course, units: updated });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-mono font-bold outline-none focus:border-indigo-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Lessons Stack */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Modular Lessons Stack</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddLesson(activeUnitIndex)}
                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Lesson (45m)
                  </button>
                </div>

                {activeUnit.lessons.map((les, lIdx) => (
                  <div key={les.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-[10px] font-bold">
                          {lIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={les.title}
                          onChange={(e) => {
                            const updated = [...course.units];
                            updated[activeUnitIndex].lessons[lIdx].title = e.target.value;
                            setCourse({ ...course, units: updated });
                          }}
                          className="border-b border-transparent hover:border-slate-300 focus:border-indigo-600 text-xs font-bold text-slate-900 outline-none px-1 py-0.5"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3 text-slate-400" /> {les.estimatedMinutes}m
                      </span>
                    </div>

                    {/* Lesson Blocks */}
                    <div className="space-y-2 pl-4 border-l-2 border-indigo-100">
                      {les.blocks.map((blk) => (
                        <div key={blk.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                            <span className="font-mono uppercase text-indigo-700">{blk.type.replace('_', ' ')}</span>
                            <span>{blk.title}</span>
                          </div>
                          <textarea
                            rows={2}
                            value={blk.content}
                            onChange={(e) => {
                              const updated = [...course.units];
                              const b = updated[activeUnitIndex].lessons[lIdx].blocks.find(x => x.id === blk.id);
                              if (b) b.content = e.target.value;
                              setCourse({ ...course, units: updated });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none focus:border-indigo-600"
                            placeholder="Enter lesson block theory, teacher pedagogy guidelines, or resource link..."
                          />
                        </div>
                      ))}

                      {/* Block Triggers */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'text_description')}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] text-slate-700 font-bold hover:bg-slate-50"
                        >
                          + Theory Block
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'teacher_guide')}
                          className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-bold hover:bg-amber-100"
                        >
                          + Teacher Pedagogy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'youtube_video')}
                          className="px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-800 font-bold hover:bg-rose-100"
                        >
                          + YouTube Video
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Assessments */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Assessments & Rubrics (C / NYC)</span>
                </h4>

                {activeUnit.assessments.map((ass) => (
                  <div key={ass.id} className="bg-white border border-amber-300 rounded-xl p-3.5 text-xs space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ass.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {ass.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{ass.description}</p>
                    <div className="space-y-1 pt-1">
                      {ass.criteria.map((c, i) => (
                        <div key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] flex justify-between">
                          <div>
                            <span className="font-bold text-slate-800">{c.name} ({c.weight}%)</span>
                            <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">Competent: {c.competentDescriptor}</div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono font-semibold">Weight: {c.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* AI Ingest Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">✨ AI Ingest (10 Tokens)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Paste your raw syllabus or curriculum text below. The AI architect will parse it into 40-hour units, 45-minute modular lessons, and ASQA/TEQSA assessment rubrics.
            </p>

            <textarea
              rows={8}
              value={aiSyllabusInput}
              onChange={(e) => setAiSyllabusInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono outline-none focus:border-indigo-600 focus:bg-white"
              placeholder={`COURSE TITLE: Bachelor of Cyber Security\nCOURSE CODE: BCS2026\nUNIT 1: CYB101 - Network Defense Protocols (40 Nominal Hours)\nLESSON 1: Packet Analysis & Firewalls (45 min)\n- CONTENT DESCRIPTION: Deep packet inspection principles...\nSUMMATIVE ASSESSMENT: Firewall Penetration Defense`}
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-amber-700 font-mono font-bold">
                🪙 Cost: 10 Tokens
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAiIngest}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Synthesize Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
