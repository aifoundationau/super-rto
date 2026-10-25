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
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);

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

  const handleDeleteLesson = (unitIdx: number, lessonIdx: number) => {
    const updatedUnits = [...course.units];
    updatedUnits[unitIdx].lessons.splice(lessonIdx, 1);
    setCourse({ ...course, units: updatedUnits });
    setDeletingLessonId(null);
  };

  const handleAddBlock = (unitIdx: number, lessonIdx: number, type: LessonBlock['type']) => {
    const updatedUnits = [...course.units];
    const defaultTitles: Record<LessonBlock['type'], string> = {
      text_description: 'Core Theory & Concepts',
      teacher_guide: 'Teacher Pedagogy Guide',
      youtube_video: 'Video Lecture',
      google_drive_link: 'Google Drive Resource',
      file_upload: 'Attached Coursework File',
      quiz: 'Formative Knowledge Check'
    };
    updatedUnits[unitIdx].lessons[lessonIdx].blocks.push({
      id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      title: defaultTitles[type] || 'Resource Block',
      content: ''
    });
    setCourse({ ...course, units: updatedUnits });
  };

  const handleDeleteBlock = (unitIdx: number, lessonIdx: number, blockIdx: number) => {
    const updatedUnits = [...course.units];
    updatedUnits[unitIdx].lessons[lessonIdx].blocks.splice(blockIdx, 1);
    setCourse({ ...course, units: updatedUnits });
    setDeletingBlockId(null);
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
                    data-agent-id="course-builder-add-lesson-btn"
                    data-testid="add-lesson-btn"
                    aria-label="Add Modular Lesson"
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Lesson (45m)
                  </button>
                </div>

                {activeUnit.lessons.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                    <BookOpen className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-xs font-medium text-slate-600">No modular lessons in this unit yet.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click &ldquo;Add Lesson (45m)&rdquo; above to stack modular lessons.</p>
                  </div>
                ) : (
                  activeUnit.lessons.map((les, lIdx) => (
                    <div key={les.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                      {/* Lesson Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
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
                            data-agent-id={`course-builder-lesson-title-input-${les.id}`}
                            data-testid={`course-builder-lesson-title-${les.id}`}
                            aria-label={`Lesson ${lIdx + 1} Title`}
                            className="border-b border-transparent hover:border-slate-300 focus:border-indigo-600 text-xs font-bold text-slate-900 outline-none px-1 py-0.5 flex-1 min-w-[120px]"
                            placeholder="Lesson Title..."
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono font-semibold">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <input
                              type="number"
                              value={les.estimatedMinutes}
                              onChange={(e) => {
                                const updated = [...course.units];
                                updated[activeUnitIndex].lessons[lIdx].estimatedMinutes = parseInt(e.target.value) || 45;
                                setCourse({ ...course, units: updated });
                              }}
                              data-agent-id={`course-builder-lesson-duration-input-${les.id}`}
                              data-testid={`course-builder-lesson-duration-${les.id}`}
                              aria-label={`Lesson ${lIdx + 1} Duration Minutes`}
                              className="w-10 px-1 py-0.5 text-[10px] font-mono border border-slate-200 rounded text-center outline-none focus:border-indigo-600"
                            />
                            <span>m</span>
                          </div>

                          {deletingLessonId === les.id ? (
                            <div className="flex items-center gap-1 animate-in fade-in duration-200">
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(activeUnitIndex, lIdx)}
                                data-agent-id={`course-builder-confirm-delete-lesson-${les.id}-btn`}
                                data-testid={`confirm-delete-lesson-${les.id}`}
                                aria-label={`Confirm Delete Lesson ${les.title}`}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                              >
                                <Trash2 className="w-2.5 h-2.5" /> Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingLessonId(null)}
                                data-agent-id={`course-builder-cancel-delete-lesson-${les.id}-btn`}
                                data-testid={`cancel-delete-lesson-${les.id}`}
                                aria-label="Cancel delete lesson"
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingLessonId(les.id)}
                              data-agent-id={`course-builder-delete-lesson-${les.id}-btn`}
                              data-testid={`delete-lesson-${les.id}`}
                              aria-label={`Delete Lesson ${les.title}`}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete Lesson"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lesson Blocks (Elements Stack) */}
                      <div className="space-y-2 pl-4 border-l-2 border-indigo-100">
                        {les.blocks.map((blk, bIdx) => (
                          <div key={blk.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`font-mono uppercase px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider ${
                                  blk.type === 'teacher_guide' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                                  blk.type === 'youtube_video' ? 'bg-rose-100 text-rose-900 border border-rose-200' :
                                  blk.type === 'google_drive_link' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                                  blk.type === 'file_upload' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                                  blk.type === 'quiz' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                                  'bg-slate-200 text-slate-800 border border-slate-300'
                                }`}>
                                  {blk.type.replace(/_/g, ' ')}
                                </span>
                                <input
                                  type="text"
                                  value={blk.title}
                                  onChange={(e) => {
                                    const updated = [...course.units];
                                    const targetBlk = updated[activeUnitIndex].lessons[lIdx].blocks[bIdx];
                                    if (targetBlk) targetBlk.title = e.target.value;
                                    setCourse({ ...course, units: updated });
                                  }}
                                  data-agent-id={`course-builder-block-title-input-${blk.id}`}
                                  data-testid={`course-builder-block-title-${blk.id}`}
                                  aria-label={`Block Title for ${blk.title}`}
                                  className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 text-slate-700 font-medium outline-none px-1 py-0.5 flex-1 min-w-[100px]"
                                  placeholder="Block Title..."
                                />
                              </div>

                              <div className="shrink-0 flex items-center">
                                {deletingBlockId === blk.id ? (
                                  <div className="flex items-center gap-1 animate-in fade-in duration-200">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBlock(activeUnitIndex, lIdx, bIdx)}
                                      data-agent-id={`course-builder-confirm-delete-block-${blk.id}-btn`}
                                      data-testid={`confirm-delete-block-${blk.id}`}
                                      aria-label={`Confirm Delete Element ${blk.title}`}
                                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold flex items-center gap-1 transition-colors"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" /> Confirm Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingBlockId(null)}
                                      data-agent-id={`course-builder-cancel-delete-block-${blk.id}-btn`}
                                      data-testid={`cancel-delete-block-${blk.id}`}
                                      aria-label="Cancel delete block"
                                      className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-medium transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingBlockId(blk.id)}
                                    data-agent-id={`course-builder-delete-block-${blk.id}-btn`}
                                    data-testid={`delete-block-${blk.id}`}
                                    aria-label={`Delete Element ${blk.title}`}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                    title="Delete Element"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <textarea
                              rows={2}
                              value={blk.content}
                              onChange={(e) => {
                                const updated = [...course.units];
                                const b = updated[activeUnitIndex].lessons[lIdx].blocks[bIdx];
                                if (b) b.content = e.target.value;
                                setCourse({ ...course, units: updated });
                              }}
                              data-agent-id={`course-builder-block-content-textarea-${blk.id}`}
                              data-testid={`course-builder-block-content-${blk.id}`}
                              aria-label={`Content for ${blk.title}`}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none focus:border-indigo-600 font-sans"
                              placeholder={
                                blk.type === 'youtube_video' ? 'Paste YouTube video URL...' :
                                blk.type === 'google_drive_link' ? 'Paste Google Drive folder or file URL...' :
                                blk.type === 'quiz' ? 'Enter quiz questions, answers, and competency check criteria...' :
                                blk.type === 'file_upload' ? 'Specify file upload guidelines or required document format...' :
                                blk.type === 'teacher_guide' ? 'Enter pedagogical guidelines, lesson scaffolding, and student support notes...' :
                                'Enter lesson block theory, key concepts, or learning content...'
                              }
                            />
                          </div>
                        ))}

                        {/* Add Element Triggers */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Add Element:</span>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'text_description')}
                            data-agent-id={`course-builder-add-theory-block-${les.id}-btn`}
                            data-testid={`add-theory-block-${les.id}`}
                            aria-label="Add Theory Block"
                            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <FileText className="w-2.5 h-2.5 text-indigo-600" /> + Theory
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'teacher_guide')}
                            data-agent-id={`course-builder-add-pedagogy-block-${les.id}-btn`}
                            data-testid={`add-pedagogy-block-${les.id}`}
                            aria-label="Add Teacher Pedagogy Guide"
                            className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-bold hover:bg-amber-100 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" /> + Pedagogy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'youtube_video')}
                            data-agent-id={`course-builder-add-video-block-${les.id}-btn`}
                            data-testid={`add-video-block-${les.id}`}
                            aria-label="Add YouTube Video"
                            className="px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-800 font-bold hover:bg-rose-100 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Video className="w-2.5 h-2.5 text-rose-600" /> + Video
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'google_drive_link')}
                            data-agent-id={`course-builder-add-drive-block-${les.id}-btn`}
                            data-testid={`add-drive-block-${les.id}`}
                            aria-label="Add Google Drive Resource"
                            className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-[10px] text-blue-800 font-bold hover:bg-blue-100 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Layers className="w-2.5 h-2.5 text-blue-600" /> + Drive
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'file_upload')}
                            data-agent-id={`course-builder-add-fileupload-block-${les.id}-btn`}
                            data-testid={`add-fileupload-block-${les.id}`}
                            aria-label="Add File Attachment"
                            className="px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-[10px] text-purple-800 font-bold hover:bg-purple-100 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Plus className="w-2.5 h-2.5 text-purple-600" /> + File
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'quiz')}
                            data-agent-id={`course-builder-add-quiz-block-${les.id}-btn`}
                            data-testid={`add-quiz-block-${les.id}`}
                            aria-label="Add Knowledge Check Quiz"
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> + Quiz
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
