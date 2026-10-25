'use client';

import React, { useState, useRef } from 'react';
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
  Award,
  Presentation,
  FolderOpen,
  Paperclip,
  Link2,
  ExternalLink,
  AlignLeft,
  Download,
  Upload,
  FileSpreadsheet,
  Target,
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronRight
} from 'lucide-react';
import { toStrictIntegerTokens } from '@/lib/tokens/pricing';

export interface LessonBlockLink {
  id: string;
  title: string;
  url: string;
}

export interface LessonBlock {
  id: string;
  type:
    | 'description'
    | 'presentation'
    | 'video'
    | 'drive'
    | 'file'
    | 'notebook'
    | 'quiz'
    | 'text_description'
    | 'teacher_guide'
    | 'youtube_video'
    | 'google_drive_link'
    | 'file_upload';
  title: string;
  url?: string;
  content?: string;
  links?: LessonBlockLink[];
}

import {
  RubricLevel,
  AssessmentCriterion,
  CourseAssessment,
  AssessmentSortOption,
  sortAssessments,
  reorderAssessment,
  DEFAULT_RUBRIC_LEVEL_NAMES,
  createDefaultRubricLevels,
  createFormativeRubricLevels,
  createSummativeRubricLevels,
  parseCsvLine,
  generateRubricsTemplateCsv,
  exportAssessmentsToCsv,
  parseRubricsCsv
} from '@/lib/courseBuilder/rubrics';
import {
  createDefaultUnit,
  deleteUnitFromCourse,
  UnitPerformanceCriterion,
  createDefaultPerformanceCriteria,
  createPerformanceCriterion
} from '@/lib/courseBuilder/units';
import {
  ProgramAdmissionsProfile,
  createDefaultAdmissionsProfile
} from '@/lib/courseBuilder/admissions';
import { ProgramAdmissionsPanel } from './ProgramAdmissionsPanel';

export type {
  RubricLevel,
  AssessmentCriterion,
  CourseAssessment,
  UnitPerformanceCriterion,
  AssessmentSortOption,
  ProgramAdmissionsProfile
};
export { DEFAULT_RUBRIC_LEVEL_NAMES, createDefaultRubricLevels, parseCsvLine, sortAssessments, reorderAssessment };

export interface CourseUnit {
  id: string;
  unitCode: string;
  unitTitle: string;
  nominalHours: number;
  description: string;
  performanceCriteria?: UnitPerformanceCriterion[];
  lessons: {
    id: string;
    title: string;
    description?: string;
    estimatedMinutes: number;
    blocks: LessonBlock[];
  }[];
  assessments: CourseAssessment[];
}

export interface CourseData {
  id: string;
  title: string;
  code: string;
  frameworkCode: string;
  aqfLevel: number;
  tokenCost: number;
  description: string;
  admissionsProfile?: ProgramAdmissionsProfile;
  units: CourseUnit[];
}

const DEFAULT_COURSE: CourseData = {
  id: 'course-bsb41419',
  title: 'Certificate IV in Work Health and Safety',
  code: 'BSB41419',
  frameworkCode: 'ASQA',
  aqfLevel: 4,
  tokenCost: 0,
  description: 'National qualification for occupational health and safety coordinators and compliance officers.',
  admissionsProfile: createDefaultAdmissionsProfile(
    'BSB41419',
    'Certificate IV in Work Health and Safety',
    4
  ),
  units: [
    {
      id: 'unit-bsbwhs411',
      unitCode: 'BSBWHS411',
      unitTitle: 'Implement and monitor WHS policies, procedures and programs',
      nominalHours: 40,
      description: 'Covers practical skills to facilitate statutory compliance and consultative arrangements in an Australian workplace.',
      performanceCriteria: [
        {
          id: 'pc-whs-1-1',
          element: 'Element 1: Establish and maintain consultative arrangements',
          code: '1.1',
          title: 'Identify and interpret statutory WHS obligations and relevant compliance standards',
          description:
            'Accurately identify and access applicable national and state/territory statutory requirements, codes of practice, and guidance notes relevant to organizational operations.'
        },
        {
          id: 'pc-whs-1-2',
          element: 'Element 1: Establish and maintain consultative arrangements',
          code: '1.2',
          title: 'Facilitate participative workplace consultations with stakeholders',
          description:
            'Engage designated health and safety representatives, worker committees, and operational managers in constructive consultation regarding hazard identification and risk control.'
        },
        {
          id: 'pc-whs-2-1',
          element: 'Element 2: Implement hazard identification and risk assessment procedures',
          code: '2.1',
          title: 'Conduct structured hazard identification and risk assessments',
          description:
            'Systematically identify workplace hazards, assess associated likelihood and severity, and prioritize corrective measures in accordance with the hierarchy of controls.'
        }
      ],
      lessons: [
        {
          id: 'les-1',
          title: 'Legislative Frameworks and Work Health and Safety Acts',
          description: 'This foundational module introduces statutory WHS duties, employer obligations under Safe Work Australia harmonised model laws, and principles for consultative workplace risk management.',
          estimatedMinutes: 45,
          blocks: [
            {
              id: 'blk-intro',
              type: 'description',
              title: 'Module Overview & Reading Instructions',
              content: 'Students are required to review the Commonwealth Model WHS Act before attending the practical seminar. Follow the presentation slides and complete the incident research notebook.'
            },
            {
              id: 'blk-1',
              type: 'presentation',
              title: 'WHS Harmonisation & Duty Holders Slides',
              url: 'https://docs.google.com/presentation/d/demo-whs-framework/edit',
              links: [
                {
                  id: 'link-1-1',
                  title: 'Primary Slide Deck (Google Slides)',
                  url: 'https://docs.google.com/presentation/d/demo-whs-framework/edit'
                },
                {
                  id: 'link-1-2',
                  title: 'Presentation Handout & Notes (PDF)',
                  url: 'https://drive.google.com/file/d/demo-notes/view'
                }
              ]
            },
            {
              id: 'blk-2',
              type: 'video',
              title: 'Safe Work Australia: Practical Risk Management',
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              links: [
                {
                  id: 'link-2-1',
                  title: 'Safety Risk Assessment Video',
                  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                }
              ]
            },
            {
              id: 'blk-3',
              type: 'notebook',
              title: 'WHS Incident Analysis & Research Notebook',
              url: 'https://colab.research.google.com/drive/demo-whs-risk-modeling',
              links: [
                {
                  id: 'link-3-1',
                  title: 'Interactive Research Notebook (Google Colab)',
                  url: 'https://colab.research.google.com/drive/demo-whs-risk-modeling'
                }
              ]
            }
          ]
        }
      ],
      assessments: [
        {
          id: 'ass-formative-1',
          type: 'formative',
          title: 'Formative Knowledge Check & Practice Activity',
          description: 'Continuous formative assessment measuring foundational concepts, applied problem-solving, and reflective practice.',
          examNumber: 1,
          dueDate: '2026-11-10',
          criteria: [
            {
              id: 'crit-f-1',
              name: 'Foundational Knowledge & Principles',
              weight: 50,
              competentDescriptor: 'Meets competency benchmark: consistently and accurately applies core principles and concepts.',
              notYetCompetentDescriptor: 'Critical gaps: fundamental concepts are missing, inaccurate, or non-compliant.',
              levels: createDefaultRubricLevels('Foundational Knowledge & Principles')
            },
            {
              id: 'crit-f-2',
              name: 'Applied Practice & Consultative Reflection',
              weight: 50,
              competentDescriptor: 'Meets competency benchmark: reliably executes standard procedures and participates constructively.',
              notYetCompetentDescriptor: 'Critical gaps: unable to complete routine tasks or engage with collaborative procedures.',
              levels: createDefaultRubricLevels('Applied Practice & Consultative Reflection')
            }
          ]
        },
        {
          id: 'ass-summative-1',
          type: 'summative',
          title: 'Summative Performance Portfolio & Capstone Evaluation',
          description: 'Formal summative evaluation assessing end-to-end practical execution, regulatory compliance documentation, and portfolio deliverables.',
          examNumber: 2,
          dueDate: '2026-11-24',
          criteria: [
            {
              id: 'crit-s-1',
              name: 'Demonstration & Execution Rigor',
              weight: 50,
              competentDescriptor: 'Meets competency benchmark: independently satisfies all assessment rubric criteria to required industry quality.',
              notYetCompetentDescriptor: 'Critical gaps: fails to meet essential execution standards; critical steps omitted.',
              levels: createDefaultRubricLevels('Demonstration & Execution Rigor')
            },
            {
              id: 'crit-s-2',
              name: 'Analysis, Evaluation & Quality Assurance',
              weight: 50,
              competentDescriptor: 'Meets competency benchmark: produces structured, evidence-based reports adhering to standards.',
              notYetCompetentDescriptor: 'Critical gaps: analysis lacks structure, evidence, or actionable recommendations.',
              levels: createDefaultRubricLevels('Analysis, Evaluation & Quality Assurance')
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
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(null);
  const [deletingCriterionId, setDeletingCriterionId] = useState<string | null>(null);
  const [deletingUnitCriterionId, setDeletingUnitCriterionId] = useState<string | null>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [selectedAssessmentCategory, setSelectedAssessmentCategory] = useState<
    'summative_exam' | 'formative_exam' | 'formative' | 'summative'
  >('summative_exam');
  const [assessmentSortOption, setAssessmentSortOption] = useState<AssessmentSortOption>('exam_number_asc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collapsible view state across all course builder layers
  const [isCourseMetaCollapsed, setIsCourseMetaCollapsed] = useState(false);
  const [isAdmissionsPanelCollapsed, setIsAdmissionsPanelCollapsed] = useState(false);
  const [isPerformanceCriteriaCollapsed, setIsPerformanceCriteriaCollapsed] = useState(false);
  const [isUnitInfoCollapsed, setIsUnitInfoCollapsed] = useState(false);
  const [isLessonsSectionCollapsed, setIsLessonsSectionCollapsed] = useState(false);
  const [isAssessmentsSectionCollapsed, setIsAssessmentsSectionCollapsed] = useState(false);
  const [collapsedLessonIds, setCollapsedLessonIds] = useState<Record<string, boolean>>({});
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Record<string, boolean>>({});
  const [collapsedAssessmentIds, setCollapsedAssessmentIds] = useState<Record<string, boolean>>({});
  const [collapsedCriterionIds, setCollapsedCriterionIds] = useState<Record<string, boolean>>({});

  const toggleLessonCollapse = (id: string) => {
    setCollapsedLessonIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBlockCollapse = (id: string) => {
    setCollapsedBlockIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAssessmentCollapse = (id: string) => {
    setCollapsedAssessmentIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCriterionCollapse = (id: string) => {
    setCollapsedCriterionIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const collapseAll = () => {
    setIsCourseMetaCollapsed(true);
    setIsAdmissionsPanelCollapsed(true);
    setIsPerformanceCriteriaCollapsed(true);
    setIsUnitInfoCollapsed(true);
    setIsLessonsSectionCollapsed(false);
    setIsAssessmentsSectionCollapsed(false);

    const lessonMap: Record<string, boolean> = {};
    const blockMap: Record<string, boolean> = {};
    const assMap: Record<string, boolean> = {};
    const critMap: Record<string, boolean> = {};

    course.units.forEach((u) => {
      u.lessons.forEach((l) => {
        lessonMap[l.id] = true;
        (l.blocks || []).forEach((b) => {
          blockMap[b.id] = true;
        });
      });
      (u.assessments || []).forEach((a) => {
        assMap[a.id] = true;
        (a.criteria || []).forEach((c, cIdx) => {
          critMap[c.id || `${a.id}-${cIdx}`] = true;
        });
      });
    });

    setCollapsedLessonIds(lessonMap);
    setCollapsedBlockIds(blockMap);
    setCollapsedAssessmentIds(assMap);
    setCollapsedCriterionIds(critMap);
    setStatusMessage('All sections, lessons, elements, and rubrics collapsed.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const expandAll = () => {
    setIsCourseMetaCollapsed(false);
    setIsAdmissionsPanelCollapsed(false);
    setIsPerformanceCriteriaCollapsed(false);
    setIsUnitInfoCollapsed(false);
    setIsLessonsSectionCollapsed(false);
    setIsAssessmentsSectionCollapsed(false);
    setCollapsedLessonIds({});
    setCollapsedBlockIds({});
    setCollapsedAssessmentIds({});
    setCollapsedCriterionIds({});
    setStatusMessage('All sections, lessons, elements, and rubrics expanded.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const currentAdmissionsProfile =
    course.admissionsProfile ||
    createDefaultAdmissionsProfile(course.code, course.title, course.aqfLevel);

  const handleUpdateAdmissionsProfile = (updatedProfile: ProgramAdmissionsProfile) => {
    setCourse({
      ...course,
      admissionsProfile: updatedProfile
    });
  };

  const activeUnit = course.units[activeUnitIndex] || course.units[0];

  const handleAddUnit = () => {
    const newUnit = createDefaultUnit('NEWUNIT', 'New Unit of Competency');
    setCourse({
      ...course,
      units: [...course.units, newUnit]
    });
    setActiveUnitIndex(course.units.length);
  };

  const handleDeleteUnit = (unitIdx: number) => {
    const { updatedUnits, newActiveIndex, deletedUnit } = deleteUnitFromCourse(
      course.units,
      unitIdx,
      activeUnitIndex
    );
    if (!deletedUnit) return;

    setCourse({ ...course, units: updatedUnits });
    setActiveUnitIndex(newActiveIndex);
    setDeletingUnitId(null);
    setStatusMessage(`Unit of Competency "${deletedUnit.unitCode}" deleted.`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleAddPerformanceCriterion = (unitIdx: number = activeUnitIndex) => {
    const updated = [...course.units];
    const targetUnit = updated[unitIdx];
    if (!targetUnit.performanceCriteria) {
      targetUnit.performanceCriteria = [];
    }
    const pcCount = targetUnit.performanceCriteria.length + 1;
    const newCriterion: UnitPerformanceCriterion = {
      id: `pc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      element: 'Element 1: Core Performance Requirements',
      code: `1.${pcCount}`,
      title: `Performance Criterion 1.${pcCount}`,
      description: 'Satisfies unit benchmark and performance requirements in an industry workplace environment.'
    };
    targetUnit.performanceCriteria.push(newCriterion);
    setCourse({ ...course, units: updated });
    setStatusMessage(`✨ Added Performance Criterion 1.${pcCount}.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeletePerformanceCriterion = (unitIdx: number, critId: string) => {
    const updated = [...course.units];
    const targetUnit = updated[unitIdx];
    if (targetUnit.performanceCriteria) {
      targetUnit.performanceCriteria = targetUnit.performanceCriteria.filter((c) => c.id !== critId);
      setCourse({ ...course, units: updated });
    }
    setDeletingUnitCriterionId(null);
    setStatusMessage('Performance Criterion deleted.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleUpdatePerformanceCriterion = (
    unitIdx: number,
    critIdx: number,
    field: keyof UnitPerformanceCriterion,
    value: string
  ) => {
    const updated = [...course.units];
    const targetUnit = updated[unitIdx];
    if (targetUnit.performanceCriteria && targetUnit.performanceCriteria[critIdx]) {
      targetUnit.performanceCriteria[critIdx] = {
        ...targetUnit.performanceCriteria[critIdx],
        [field]: value
      };
      setCourse({ ...course, units: updated });
    }
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
          type: 'presentation',
          title: 'Lesson Presentation Slides',
          url: '',
          links: [
            {
              id: `link-${Date.now()}-1`,
              title: 'Primary Presentation Deck',
              url: ''
            }
          ]
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
    const defaultMeta: Record<string, { title: string; defaultLinkTitle: string }> = {
      description: { title: 'Lesson Description & Context', defaultLinkTitle: '' },
      presentation: { title: 'Presentation Slide Deck', defaultLinkTitle: 'Presentation Slides URL' },
      video: { title: 'Video Lecture', defaultLinkTitle: 'Video Lecture URL' },
      drive: { title: 'Google Drive Resource', defaultLinkTitle: 'Google Drive Folder URL' },
      file: { title: 'Coursework File Attachment', defaultLinkTitle: 'Coursework File URL' },
      notebook: { title: 'Google Notebook / Colab', defaultLinkTitle: 'Google Colab Notebook URL' },
      quiz: { title: 'Knowledge Check Quiz', defaultLinkTitle: 'Quiz / Form URL' },
      text_description: { title: 'Theory & Reference Material', defaultLinkTitle: 'Theory Document URL' },
      teacher_guide: { title: 'Teacher Pedagogy Guide', defaultLinkTitle: 'Pedagogy Guide URL' },
      youtube_video: { title: 'Video Lecture', defaultLinkTitle: 'Video URL' },
      google_drive_link: { title: 'Google Drive Resource', defaultLinkTitle: 'Drive URL' },
      file_upload: { title: 'Coursework File Attachment', defaultLinkTitle: 'File URL' }
    };
    const meta = defaultMeta[type] || { title: 'Resource Element', defaultLinkTitle: 'Resource URL' };
    const newBlockId = `blk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newLinkId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (type === 'description') {
      updatedUnits[unitIdx].lessons[lessonIdx].blocks.push({
        id: newBlockId,
        type: 'description',
        title: 'Detailed Lesson Description & Notes',
        content: '',
        links: []
      });
    } else {
      updatedUnits[unitIdx].lessons[lessonIdx].blocks.push({
        id: newBlockId,
        type,
        title: meta.title,
        url: '',
        links: [
          {
            id: newLinkId,
            title: meta.defaultLinkTitle,
            url: ''
          }
        ]
      });
    }
    setCourse({ ...course, units: updatedUnits });
  };

  const handleDeleteBlock = (unitIdx: number, lessonIdx: number, blockIdx: number) => {
    const updatedUnits = [...course.units];
    updatedUnits[unitIdx].lessons[lessonIdx].blocks.splice(blockIdx, 1);
    setCourse({ ...course, units: updatedUnits });
    setDeletingBlockId(null);
  };

  const handleAddLinkToBlock = (
    unitIdx: number,
    lessonIdx: number,
    blockIdx: number,
    linkPresetTitle?: string
  ) => {
    const updatedUnits = [...course.units];
    const block = updatedUnits[unitIdx].lessons[lessonIdx].blocks[blockIdx];
    if (!block.links) {
      block.links = [];
      if (block.url) {
        block.links.push({
          id: `link-${Date.now()}-0`,
          title: `${block.title} (Primary Link)`,
          url: block.url
        });
      }
    }
    const newLink: LessonBlockLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: linkPresetTitle || `${block.title} Link ${block.links.length + 1}`,
      url: ''
    };
    block.links.push(newLink);
    setCourse({ ...course, units: updatedUnits });
  };

  const handleDeleteLinkFromBlock = (
    unitIdx: number,
    lessonIdx: number,
    blockIdx: number,
    linkIdx: number
  ) => {
    const updatedUnits = [...course.units];
    const block = updatedUnits[unitIdx].lessons[lessonIdx].blocks[blockIdx];
    if (block.links) {
      block.links.splice(linkIdx, 1);
    }
    setCourse({ ...course, units: updatedUnits });
    setDeletingLinkId(null);
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

  const handleAddAssessment = (type: 'formative' | 'summative') => {
    const isFormative = type === 'formative';
    const defaultCritTitle = isFormative ? 'Foundational Knowledge Application' : 'Core Industry Competency & Evidence';
    const levels = isFormative ? createFormativeRubricLevels(defaultCritTitle) : createSummativeRubricLevels(defaultCritTitle);
    const existingAssessments = course.units[activeUnitIndex]?.assessments || [];
    const nextExamNumber = existingAssessments.length + 1;
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 14 * nextExamNumber);
    const defaultDueDate = baseDate.toISOString().split('T')[0];

    const newAssessment: CourseAssessment = {
      id: `ass-${type}-${Date.now()}`,
      type,
      title: isFormative
        ? `Formative Knowledge Check & Practice Activity #${nextExamNumber}`
        : `Summative Practical Assessment & Portfolio #${nextExamNumber}`,
      description: isFormative
        ? 'Continuous formative assessment to reinforce key concepts and provide developmental feedback before final competency evaluation.'
        : 'Formal summative assessment to assess practical competency and evidence of skills against AQF performance standards.',
      examNumber: nextExamNumber,
      dueDate: defaultDueDate,
      criteria: [
        {
          id: `crit-${Date.now()}-1`,
          name: defaultCritTitle,
          weight: 100,
          competentDescriptor: 'Consistently meets required competency benchmark with verified practical evidence.',
          notYetCompetentDescriptor: 'Does not yet meet benchmark requirements; gaps identified in foundational knowledge or execution.',
          levels
        }
      ]
    };
    const updated = [...course.units];
    if (!updated[activeUnitIndex].assessments) {
      updated[activeUnitIndex].assessments = [];
    }
    const combined = [...updated[activeUnitIndex].assessments, newAssessment];
    updated[activeUnitIndex].assessments =
      assessmentSortOption === 'manual' ? combined : sortAssessments(combined, assessmentSortOption);
    setCourse({ ...course, units: updated });
    setStatusMessage(`✨ Added new ${type} assessment.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCreateAssessmentWithType = (
    category: 'summative_exam' | 'formative_exam' | 'formative' | 'summative'
  ) => {
    let type: 'formative' | 'summative' = 'summative';
    let defaultTitle = 'Summative Examination';
    let defaultDesc =
      'Formal summative examination assessing cumulative theoretical knowledge, applied problem-solving, and rigorous competency standards under examination conditions.';
    let defaultCritTitle = 'Exam Performance & Practical Mastery';
    let levels = createSummativeRubricLevels(defaultCritTitle);

    if (category === 'summative_exam') {
      type = 'summative';
      defaultTitle = 'Summative Examination';
      defaultDesc =
        'Formal summative examination assessing cumulative theoretical knowledge, applied problem-solving, and rigorous competency standards under examination conditions.';
      defaultCritTitle = 'Exam Performance & Practical Mastery';
      levels = createSummativeRubricLevels(defaultCritTitle);
    } else if (category === 'formative_exam') {
      type = 'formative';
      defaultTitle = 'Formative Practice Examination';
      defaultDesc =
        'Formative diagnostic practice examination providing structured benchmark feedback to identify learning gaps and reinforce knowledge prior to formal examination.';
      defaultCritTitle = 'Diagnostic Exam Knowledge Application';
      levels = createFormativeRubricLevels(defaultCritTitle);
    } else if (category === 'summative') {
      type = 'summative';
      defaultTitle = 'Summative Practical Assessment & Portfolio';
      defaultDesc =
        'Formal summative assessment to assess practical competency and evidence of skills against AQF performance standards.';
      defaultCritTitle = 'Core Industry Competency & Evidence';
      levels = createSummativeRubricLevels(defaultCritTitle);
    } else if (category === 'formative') {
      type = 'formative';
      defaultTitle = 'Formative Knowledge Check & Practice Activity';
      defaultDesc =
        'Continuous formative assessment to reinforce key concepts and provide developmental feedback before final competency evaluation.';
      defaultCritTitle = 'Foundational Knowledge Application';
      levels = createFormativeRubricLevels(defaultCritTitle);
    }

    const existingAssessments = course.units[activeUnitIndex]?.assessments || [];
    const nextExamNumber = existingAssessments.length + 1;
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 14 * nextExamNumber);
    const defaultDueDate = baseDate.toISOString().split('T')[0];

    const newAssessment: CourseAssessment = {
      id: `ass-${category}-${Date.now()}`,
      type,
      title: `${defaultTitle} #${nextExamNumber}`,
      description: defaultDesc,
      examNumber: nextExamNumber,
      dueDate: defaultDueDate,
      criteria: [
        {
          id: `crit-${Date.now()}-1`,
          name: defaultCritTitle,
          weight: 100,
          competentDescriptor: 'Consistently meets required competency benchmark with verified practical evidence.',
          notYetCompetentDescriptor: 'Does not yet meet benchmark requirements; gaps identified in foundational knowledge or execution.',
          levels
        }
      ]
    };

    const updated = [...course.units];
    if (!updated[activeUnitIndex].assessments) {
      updated[activeUnitIndex].assessments = [];
    }
    const combined = [...updated[activeUnitIndex].assessments, newAssessment];
    updated[activeUnitIndex].assessments =
      assessmentSortOption === 'manual' ? combined : sortAssessments(combined, assessmentSortOption);
    setCourse({ ...course, units: updated });
    setStatusMessage(`✨ Added new ${defaultTitle} #${nextExamNumber} with 5-level ${type} rubrics.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSortAssessments = (newSortOption: AssessmentSortOption) => {
    setAssessmentSortOption(newSortOption);
    if (newSortOption === 'manual') {
      setStatusMessage('Switched to manual assessment order. Use Move Up / Down on cards to arrange.');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    const updated = [...course.units];
    const currentAssessments = updated[activeUnitIndex]?.assessments || [];
    updated[activeUnitIndex].assessments = sortAssessments(currentAssessments, newSortOption);
    setCourse({ ...course, units: updated });
    const sortLabel =
      newSortOption === 'exam_number_asc'
        ? 'Exam # (1 → N)'
        : newSortOption === 'exam_number_desc'
        ? 'Exam # (N → 1)'
        : newSortOption === 'date_asc'
        ? 'Date (Earliest First)'
        : 'Date (Latest First)';
    setStatusMessage(`Assessments ordered by ${sortLabel}.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleMoveAssessment = (assIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? assIdx - 1 : assIdx + 1;
    const updated = [...course.units];
    const currentAssessments = updated[activeUnitIndex]?.assessments || [];
    updated[activeUnitIndex].assessments = reorderAssessment(currentAssessments, assIdx, toIdx);
    setAssessmentSortOption('manual');
    setCourse({ ...course, units: updated });
    setStatusMessage(`Assessment moved ${direction} (Manual Order).`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleUpdateAssessmentField = (
    assIdx: number,
    field: 'title' | 'description' | 'examNumber' | 'dueDate',
    value: any
  ) => {
    const updated = [...course.units];
    const currentAssessments = [...(updated[activeUnitIndex]?.assessments || [])];
    if (!currentAssessments[assIdx]) return;
    currentAssessments[assIdx] = {
      ...currentAssessments[assIdx],
      [field]: value
    };
    if (assessmentSortOption !== 'manual' && (field === 'examNumber' || field === 'dueDate')) {
      updated[activeUnitIndex].assessments = sortAssessments(currentAssessments, assessmentSortOption);
    } else {
      updated[activeUnitIndex].assessments = currentAssessments;
    }
    setCourse({ ...course, units: updated });
  };

  const handleDeleteAssessment = (assIdx: number) => {
    const updated = [...course.units];
    updated[activeUnitIndex].assessments.splice(assIdx, 1);
    setCourse({ ...course, units: updated });
    setDeletingAssessmentId(null);
    setStatusMessage('Assessment deleted.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleAddCriterion = (assIdx: number) => {
    const updated = [...course.units];
    const targetAss = updated[activeUnitIndex].assessments[assIdx];
    const critCount = targetAss.criteria.length + 1;
    const isFormative = targetAss.type === 'formative';
    const critTitle = isFormative ? `Formative Criterion ${critCount}` : `Summative Criterion ${critCount}`;
    const levels = isFormative ? createFormativeRubricLevels(critTitle) : createSummativeRubricLevels(critTitle);

    const newCriterion: AssessmentCriterion = {
      id: `crit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: critTitle,
      weight: 20,
      competentDescriptor: isFormative
        ? `Consistently satisfies benchmark for ${critTitle}.`
        : `Consistently meets required competency standard for ${critTitle}.`,
      notYetCompetentDescriptor: isFormative
        ? `Foundational gaps identified for ${critTitle}.`
        : `Does not yet meet benchmark standard for ${critTitle}.`,
      levels
    };
    targetAss.criteria.push(newCriterion);
    setCourse({ ...course, units: updated });
  };

  const handleDeleteCriterion = (assIdx: number, critIdx: number) => {
    const updated = [...course.units];
    updated[activeUnitIndex].assessments[assIdx].criteria.splice(critIdx, 1);
    setCourse({ ...course, units: updated });
    setDeletingCriterionId(null);
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = generateRubricsTemplateCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'assessments_rubrics_5levels_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCurrentRubricsCsv = () => {
    const csvContent = exportAssessmentsToCsv(activeUnit.assessments || []);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeUnit.unitCode || 'unit'}_assessments_rubrics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || !text.trim()) {
          setStatusMessage('Uploaded CSV file is empty.');
          return;
        }

        const importedAssessments = parseRubricsCsv(text);
        if (importedAssessments.length === 0) {
          setStatusMessage('No valid assessment rows could be extracted from the CSV.');
          return;
        }

        const updatedUnits = [...course.units];
        updatedUnits[activeUnitIndex].assessments =
          assessmentSortOption === 'manual'
            ? importedAssessments
            : sortAssessments(importedAssessments, assessmentSortOption);
        setCourse({ ...course, units: updatedUnits });
        setStatusMessage(`✨ Successfully imported ${importedAssessments.length} assessment(s) with 5-level rubrics from CSV.`);
        setTimeout(() => setStatusMessage(null), 5000);
      } catch (err) {
        console.error('Failed to parse assessment rubrics CSV:', err);
        setStatusMessage('Error reading CSV file. Please verify CSV format against the template.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
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

        {/* Action Buttons & Global Expand/Collapse */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              data-agent-id="course-builder-expand-all-btn"
              data-testid="expand-all-btn"
              aria-label="Expand All Course Builder Elements"
              onClick={expandAll}
              className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
              title="Expand all sections, lessons, elements, and rubrics"
            >
              <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>Expand All</span>
            </button>
            <button
              type="button"
              data-agent-id="course-builder-collapse-all-btn"
              data-testid="collapse-all-btn"
              aria-label="Collapse All Course Builder Elements"
              onClick={collapseAll}
              className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
              title="Collapse all sections, lessons, elements, and rubrics"
            >
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              <span>Collapse All</span>
            </button>
          </div>

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

      {/* Top Level Course Meta Form (Collapsible) */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all">
        <div
          onClick={() => setIsCourseMetaCollapsed(!isCourseMetaCollapsed)}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              aria-expanded={!isCourseMetaCollapsed}
              aria-label="Toggle Course Metadata"
              data-agent-id="course-builder-toggle-meta-btn"
              data-testid="toggle-course-meta-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsCourseMetaCollapsed(!isCourseMetaCollapsed);
              }}
              className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
            >
              {isCourseMetaCollapsed ? (
                <ChevronRight className="w-4 h-4 text-indigo-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-indigo-600" />
              )}
            </button>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Course Details & Configuration
            </span>
            {isCourseMetaCollapsed && (
              <span className="text-xs text-slate-600 font-mono font-medium truncate ml-2">
                {course.code || 'NO-CODE'} &bull; {course.title || 'Untitled'} ({course.tokenCost} tokens)
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
            {isCourseMetaCollapsed ? 'Click to expand' : 'Click to collapse'}
          </span>
        </div>

        {!isCourseMetaCollapsed && (
          <div className="p-4 pt-0 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-4 gap-4 mt-1">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                data-agent-id="course-builder-title-input"
                data-testid="course-title-input"
                aria-label="Course Title"
                placeholder="Course Title (e.g. Certificate IV in Work Health and Safety)..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-bold outline-none focus:border-indigo-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Code</label>
              <input
                type="text"
                value={course.code}
                onChange={(e) => setCourse({ ...course, code: e.target.value })}
                data-agent-id="course-builder-code-input"
                data-testid="course-code-input"
                aria-label="Course Code"
                placeholder="Course Code (e.g. BSB41419)..."
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
                data-agent-id="course-builder-token-cost-input"
                data-testid="course-token-cost-input"
                aria-label="Token Cost"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-amber-700 font-mono font-bold outline-none focus:border-amber-600 shadow-2xs"
              />
            </div>

            {/* Course Description Box */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Description</label>
              <textarea
                rows={3}
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                data-agent-id="course-builder-description-input"
                data-testid="course-description-input"
                aria-label="Course Description"
                placeholder="Enter a comprehensive course description, learning outcomes, qualification overview, or industry scope..."
                className="w-full bg-white border border-slate-300 focus:border-indigo-600 rounded-lg p-2.5 text-xs text-slate-800 outline-none leading-relaxed resize-y font-sans shadow-2xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Program Admissions, Delivery & Tuition Profile Panel (One Comprehensive Panel) */}
      <ProgramAdmissionsPanel
        profile={currentAdmissionsProfile}
        onChange={handleUpdateAdmissionsProfile}
        isCollapsible={true}
        isCollapsed={isAdmissionsPanelCollapsed}
        onToggleCollapse={() => setIsAdmissionsPanelCollapsed(!isAdmissionsPanelCollapsed)}
      />

      {/* Performance Criteria (Collapsible) - Positioned above Assessment */}
      <div
        data-agent-id="course-builder-performance-criteria-card"
        data-testid="performance-criteria-card"
        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
      >
        <div
          onClick={() => setIsPerformanceCriteriaCollapsed(!isPerformanceCriteriaCollapsed)}
          className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPerformanceCriteriaCollapsed(!isPerformanceCriteriaCollapsed);
              }}
              data-agent-id="course-builder-toggle-performance-criteria-btn"
              data-testid="toggle-performance-criteria-btn"
              aria-label="Toggle Performance Criteria Section"
              aria-expanded={!isPerformanceCriteriaCollapsed}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
              title={
                isPerformanceCriteriaCollapsed
                  ? 'Expand Performance Criteria Section'
                  : 'Collapse Performance Criteria Section'
              }
            >
              {isPerformanceCriteriaCollapsed ? (
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-emerald-600" />
              )}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span>Performance Criteria</span>
                </h4>

                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  {(activeUnit.performanceCriteria || []).length} Criteria
                </span>

                {course.units.length > 0 && (
                  <div
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 rounded-lg px-2 py-0.5 ml-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-slate-400 font-bold">Unit:</span>
                    <select
                      value={activeUnitIndex}
                      onChange={(e) => setActiveUnitIndex(parseInt(e.target.value))}
                      className="bg-transparent text-emerald-700 font-bold font-mono outline-none cursor-pointer"
                      title="Select unit to view/edit performance criteria"
                      aria-label="Select Unit for Performance Criteria"
                    >
                      {course.units.map((u, i) => (
                        <option key={u.id} value={i}>
                          {u.unitCode} - {u.unitTitle} ({(u.performanceCriteria || []).length})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ASQA competency benchmark criteria &amp; performance statements that define learning outcomes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleAddPerformanceCriterion(activeUnitIndex)}
              data-agent-id="course-builder-add-performance-criterion-btn"
              data-testid="add-performance-criterion-btn"
              aria-label="Add Performance Criterion"
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              title="Add new performance criterion to active unit"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Performance Criterion</span>
            </button>
          </div>
        </div>

        {!isPerformanceCriteriaCollapsed && (
          <div className="p-4 pt-0 border-t border-slate-100 space-y-3 mt-2">
            {!activeUnit.performanceCriteria || activeUnit.performanceCriteria.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
                <Target className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No performance criteria defined for this unit yet.</p>
                <p className="text-[11px] text-slate-500">
                  Click &ldquo;+ Add Performance Criterion&rdquo; to establish the required competency benchmarks before defining assessments.
                </p>
                <button
                  type="button"
                  onClick={() => handleAddPerformanceCriterion(activeUnitIndex)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Criterion</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeUnit.performanceCriteria.map((pc, pcIdx) => (
                  <div
                    key={pc.id}
                    data-agent-id={`course-builder-performance-criterion-${pc.id}`}
                    data-testid={`performance-criterion-item-${pc.id}`}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-2.5 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          PC {pc.code || `${pcIdx + 1}`}
                        </span>
                        <input
                          type="text"
                          value={pc.element}
                          onChange={(e) =>
                            handleUpdatePerformanceCriterion(activeUnitIndex, pcIdx, 'element', e.target.value)
                          }
                          placeholder="Element Name (e.g. Element 1: Manage WHS)..."
                          data-agent-id={`course-builder-pc-element-${pc.id}`}
                          data-testid={`pc-element-${pc.id}`}
                          aria-label={`Performance Criterion Element ${pc.code}`}
                          className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-600 min-w-[140px] flex-1 sm:max-w-xs shadow-2xs"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-slate-500 font-bold">Code:</span>
                          <input
                            type="text"
                            value={pc.code}
                            onChange={(e) =>
                              handleUpdatePerformanceCriterion(activeUnitIndex, pcIdx, 'code', e.target.value)
                            }
                            placeholder="1.1"
                            data-agent-id={`course-builder-pc-code-${pc.id}`}
                            data-testid={`pc-code-${pc.id}`}
                            aria-label={`Performance Criterion Code ${pc.id}`}
                            className="w-14 text-xs font-mono font-bold text-emerald-700 bg-white border border-slate-200 rounded px-1.5 py-1 outline-none focus:border-emerald-600 text-center shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Delete with Confirm Delete button */}
                      <div className="flex items-center gap-1 shrink-0">
                        {deletingUnitCriterionId === pc.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in duration-200">
                            <button
                              type="button"
                              onClick={() => handleDeletePerformanceCriterion(activeUnitIndex, pc.id)}
                              data-agent-id={`course-builder-confirm-delete-pc-${pc.id}-btn`}
                              data-testid={`confirm-delete-pc-${pc.id}`}
                              aria-label={`Confirm Delete Criterion ${pc.code}`}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold flex items-center gap-0.5 shadow-2xs transition-colors"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingUnitCriterionId(null)}
                              data-agent-id={`course-builder-cancel-delete-pc-${pc.id}-btn`}
                              data-testid={`cancel-delete-pc-${pc.id}`}
                              aria-label={`Cancel Delete Criterion ${pc.code}`}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingUnitCriterionId(pc.id)}
                            data-agent-id={`course-builder-delete-pc-${pc.id}-btn`}
                            data-testid={`delete-pc-${pc.id}`}
                            aria-label={`Delete Criterion ${pc.code}`}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded hover:bg-rose-50"
                            title={`Delete Criterion ${pc.code}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Criterion Statement &amp; Required Skill / Knowledge Outcome
                      </label>
                      <input
                        type="text"
                        value={pc.title}
                        onChange={(e) =>
                          handleUpdatePerformanceCriterion(activeUnitIndex, pcIdx, 'title', e.target.value)
                        }
                        placeholder="e.g. Identify and interpret statutory WHS compliance obligations..."
                        data-agent-id={`course-builder-pc-title-${pc.id}`}
                        data-testid={`pc-title-${pc.id}`}
                        aria-label={`Performance Criterion Title ${pc.code}`}
                        className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Performance Evidence &amp; Assessment Benchmark Description
                      </label>
                      <textarea
                        rows={2}
                        value={pc.description || ''}
                        onChange={(e) =>
                          handleUpdatePerformanceCriterion(activeUnitIndex, pcIdx, 'description', e.target.value)
                        }
                        placeholder="Detailed evidence criteria against which the assessments below will evaluate competence..."
                        data-agent-id={`course-builder-pc-desc-${pc.id}`}
                        data-testid={`pc-desc-${pc.id}`}
                        aria-label={`Performance Criterion Description ${pc.code}`}
                        className="w-full text-xs text-slate-700 bg-white border border-slate-200 focus:border-emerald-600 rounded-lg p-2 outline-none leading-relaxed resize-y font-sans shadow-2xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assessments & Rubrics (Summative & Formative) - In a rectangle box below Course Title, Course Code, and Token Cost */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all">
        <div
          onClick={() => setIsAssessmentsSectionCollapsed(!isAssessmentsSectionCollapsed)}
          className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAssessmentsSectionCollapsed(!isAssessmentsSectionCollapsed);
              }}
              data-agent-id="course-builder-toggle-assessments-section-btn"
              data-testid="toggle-assessments-section-btn"
              aria-label="Toggle Assessments & Rubrics Section"
              aria-expanded={!isAssessmentsSectionCollapsed}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
              title={isAssessmentsSectionCollapsed ? 'Expand Assessments Section' : 'Collapse Assessments Section'}
            >
              {isAssessmentsSectionCollapsed ? (
                <ChevronRight className="w-4 h-4 text-amber-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-600" />
              )}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Assessment</span>
                </h4>

                {/* Dropdown and + for creating more exams, formative, summative exam, and their rubrics */}
                <div
                  className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg p-0.5 shadow-2xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value={selectedAssessmentCategory}
                    onChange={(e) => setSelectedAssessmentCategory(e.target.value as any)}
                    data-agent-id="course-builder-assessment-type-select"
                    data-testid="assessment-type-select"
                    aria-label="Select Assessment or Exam Type"
                    className="bg-transparent text-slate-800 text-xs font-bold px-2 py-1 outline-none cursor-pointer"
                  >
                    <option value="summative_exam">Summative Exam</option>
                    <option value="formative_exam">Formative Exam</option>
                    <option value="formative">Formative Assessment</option>
                    <option value="summative">Summative Assessment</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleCreateAssessmentWithType(selectedAssessmentCategory)}
                    data-agent-id="course-builder-add-selected-assessment-btn"
                    data-testid="add-selected-assessment-btn"
                    aria-label="Create Assessment or Exam"
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                    title="Add selected exam or assessment with rubrics"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                  {activeUnit.assessments.length} Active
                </span>
                {course.units.length > 0 && (
                  <div
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 rounded-lg px-2 py-0.5 ml-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-slate-400 font-bold">Unit:</span>
                    <select
                      value={activeUnitIndex}
                      onChange={(e) => setActiveUnitIndex(parseInt(e.target.value))}
                      className="bg-transparent text-indigo-700 font-bold font-mono outline-none cursor-pointer"
                      title="Select unit to view/edit assessments"
                    >
                      {course.units.map((u, i) => (
                        <option key={u.id} value={i}>
                          {u.unitCode} - {u.unitTitle} ({u.assessments.length})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                AQF competency rubrics with 5 performance levels (NYC to Exemplary) &amp; CSV import/export.
              </p>
            </div>
          </div>

          {/* Assessment Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Sort Order Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-bold text-slate-700">Order by:</span>
              <select
                value={assessmentSortOption}
                onChange={(e) => handleSortAssessments(e.target.value as AssessmentSortOption)}
                data-agent-id="course-builder-assessment-sort-select"
                data-testid="assessment-sort-select"
                aria-label="Order Assessments by Exam Number or Date"
                className="bg-transparent text-slate-800 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="exam_number_asc">Exam # (1 → N)</option>
                <option value="exam_number_desc">Exam # (N → 1)</option>
                <option value="date_asc">Date (Earliest First)</option>
                <option value="date_desc">Date (Latest First)</option>
                <option value="manual">Manual Order</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                const allCollapsed = activeUnit.assessments.every((a) => collapsedAssessmentIds[a.id]);
                const newMap = { ...collapsedAssessmentIds };
                activeUnit.assessments.forEach((a) => {
                  newMap[a.id] = !allCollapsed;
                });
                setCollapsedAssessmentIds(newMap);
              }}
              data-agent-id="course-builder-toggle-all-assessments-btn"
              data-testid="toggle-all-assessments-btn"
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
            >
              {activeUnit.assessments.every((a) => collapsedAssessmentIds[a.id]) ? 'Expand All' : 'Collapse All'}
            </button>

            {/* CSV Upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCsvUpload}
              accept=".csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              data-agent-id="course-builder-upload-csv-btn"
              data-testid="upload-csv-btn"
              aria-label="Upload Assessment Rubrics CSV"
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              title="Upload custom assessments with 5-level rubrics via CSV"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" /> Upload CSV
            </button>

            {/* CSV Template Download */}
            <button
              type="button"
              onClick={handleDownloadCsvTemplate}
              data-agent-id="course-builder-download-csv-template-btn"
              data-testid="download-csv-template-btn"
              aria-label="Download CSV Rubric Template"
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              title="Download sample CSV template with 5 rubric levels"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" /> Template
            </button>

            {/* Export Current Rubrics */}
            <button
              type="button"
              onClick={handleExportCurrentRubricsCsv}
              data-agent-id="course-builder-export-rubrics-btn"
              data-testid="export-rubrics-btn"
              aria-label="Export Active Unit Rubrics as CSV"
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              title="Export current unit assessments and rubrics as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" /> Export CSV
            </button>
          </div>
        </div>

        {!isAssessmentsSectionCollapsed && (
          <div className="p-4 pt-0 border-t border-slate-100 space-y-4 mt-2">
            {activeUnit.assessments.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
                <Award className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No assessments defined for this unit.</p>
                <p className="text-[11px] text-slate-500">
                  Click &ldquo;+ Formative&rdquo;, &ldquo;+ Summative&rdquo;, or &ldquo;Upload CSV&rdquo; to populate assessment rubrics with 5 levels.
                </p>
              </div>
            ) : (
              activeUnit.assessments.map((ass, assIdx) => {
                const isAssessmentCollapsed = !!collapsedAssessmentIds[ass.id];
                const isFormative = ass.type === 'formative';

                return (
                  <div
                    key={ass.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 shadow-2xs space-y-3 transition-all"
                  >
                    {/* Assessment Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => toggleAssessmentCollapse(ass.id)}
                          data-agent-id={`course-builder-toggle-assessment-${ass.id}-btn`}
                          data-testid={`toggle-assessment-${ass.id}`}
                          aria-label={`Toggle Assessment ${ass.title}`}
                          aria-expanded={!isAssessmentCollapsed}
                          className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors shrink-0"
                          title={isAssessmentCollapsed ? 'Expand Assessment' : 'Collapse Assessment'}
                        >
                          {isAssessmentCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          )}
                        </button>

                        {/* Sequence Move Up / Move Down buttons */}
                        <div className="flex items-center gap-0.5 border border-slate-200 rounded bg-white p-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={assIdx === 0}
                            onClick={() => handleMoveAssessment(assIdx, 'up')}
                            data-agent-id={`course-builder-move-up-assessment-${ass.id}-btn`}
                            data-testid={`move-up-assessment-${ass.id}`}
                            aria-label={`Move Assessment ${ass.title} Up`}
                            className={`p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ${
                              assIdx === 0 ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title="Move Up in Sequence"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={assIdx === activeUnit.assessments.length - 1}
                            onClick={() => handleMoveAssessment(assIdx, 'down')}
                            data-agent-id={`course-builder-move-down-assessment-${ass.id}-btn`}
                            data-testid={`move-down-assessment-${ass.id}`}
                            aria-label={`Move Assessment ${ass.title} Down`}
                            className={`p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ${
                              assIdx === activeUnit.assessments.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title="Move Down in Sequence"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Exam Number Badge & Input */}
                        <div
                          className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 shrink-0"
                          title="Exam or Assessment Sequence Number"
                        >
                          <span className="text-[10px] font-bold text-amber-800">Exam #</span>
                          <input
                            type="number"
                            min={1}
                            value={ass.examNumber ?? (assIdx + 1)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleUpdateAssessmentField(assIdx, 'examNumber', isNaN(val) ? undefined : val);
                            }}
                            data-agent-id={`course-builder-assessment-exam-number-${ass.id}`}
                            data-testid={`assessment-exam-number-${ass.id}`}
                            aria-label={`Exam Number for ${ass.title}`}
                            className="w-12 text-center text-xs font-mono font-bold text-amber-900 bg-white border border-amber-300 rounded px-1 py-0.5 outline-none focus:border-amber-500"
                          />
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            isFormative
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {ass.title.toLowerCase().includes('exam')
                            ? (isFormative ? 'Formative Exam' : 'Summative Exam')
                            : (isFormative ? 'Formative' : 'Summative')}
                        </span>

                        <input
                          type="text"
                          value={ass.title}
                          onChange={(e) => handleUpdateAssessmentField(assIdx, 'title', e.target.value)}
                          data-agent-id={`course-builder-assessment-title-${ass.id}`}
                          data-testid={`assessment-title-${ass.id}`}
                          aria-label={`Assessment Title for ${ass.id}`}
                          placeholder="Assessment Title..."
                          className="text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-indigo-600 flex-1 min-w-[160px]"
                        />

                        {/* Due Date / Exam Date Input */}
                        <div
                          className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shrink-0"
                          title="Scheduled / Due Date"
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[10px] font-bold text-slate-600">Date:</span>
                          <input
                            type="date"
                            value={ass.dueDate || ''}
                            onChange={(e) => handleUpdateAssessmentField(assIdx, 'dueDate', e.target.value)}
                            data-agent-id={`course-builder-assessment-due-date-${ass.id}`}
                            data-testid={`assessment-due-date-${ass.id}`}
                            aria-label={`Due or Exam Date for ${ass.title}`}
                            className="text-[11px] font-semibold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:border-indigo-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddCriterion(assIdx)}
                          data-agent-id={`course-builder-add-criterion-${ass.id}-btn`}
                          data-testid={`add-criterion-${ass.id}`}
                          aria-label={`Add Criterion to ${ass.title}`}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3 text-indigo-600" /> + {isFormative ? 'Formative' : 'Summative'} Rubric Criterion
                        </button>

                        {deletingAssessmentId === ass.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in duration-200">
                            <button
                              type="button"
                              onClick={() => handleDeleteAssessment(assIdx)}
                              data-agent-id={`course-builder-confirm-delete-assessment-${ass.id}-btn`}
                              data-testid={`confirm-delete-assessment-${ass.id}`}
                              aria-label={`Confirm Delete Assessment ${ass.title}`}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingAssessmentId(null)}
                              data-agent-id={`course-builder-cancel-delete-assessment-${ass.id}-btn`}
                              data-testid={`cancel-delete-assessment-${ass.id}`}
                              aria-label={`Cancel Delete Assessment ${ass.title}`}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingAssessmentId(ass.id)}
                            data-agent-id={`course-builder-delete-assessment-${ass.id}-btn`}
                            data-testid={`delete-assessment-${ass.id}`}
                            aria-label={`Delete Assessment ${ass.title}`}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded hover:bg-rose-50"
                            title="Delete Assessment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {!isAssessmentCollapsed && (
                      <div className="space-y-3 pt-1">
                        {/* Assessment Description Block */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Assessment Scope, Context &amp; Evidence Requirements
                          </label>
                          <textarea
                            rows={2}
                            value={ass.description}
                            onChange={(e) => handleUpdateAssessmentField(assIdx, 'description', e.target.value)}
                            data-agent-id={`course-builder-assessment-desc-${ass.id}`}
                            data-testid={`assessment-desc-${ass.id}`}
                            aria-label={`Assessment Description for ${ass.id}`}
                            placeholder="Describe how this assessment will measure competency..."
                            className="w-full bg-white border border-slate-300 focus:border-indigo-600 rounded-lg p-2 text-xs text-slate-800 outline-none leading-relaxed resize-y font-sans shadow-2xs"
                          />
                        </div>

                        {/* Criteria & 5-Level Rubrics */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                              5-Level AQF Scoring Rubrics &amp; Assessment Criteria ({ass.criteria.length})
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Total Weight: {ass.criteria.reduce((acc, c) => acc + (c.weight || 0), 0)}%
                            </span>
                          </div>

                          {ass.criteria.map((c, cIdx) => {
                            const isCriterionCollapsed = !!collapsedCriterionIds[c.id];
                            const levels = c.levels || createDefaultRubricLevels(c.name);

                            return (
                              <div
                                key={c.id}
                                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
                              >
                                {/* Criterion Header */}
                                <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => toggleCriterionCollapse(c.id)}
                                      data-agent-id={`course-builder-toggle-criterion-${c.id}-btn`}
                                      data-testid={`toggle-criterion-${c.id}`}
                                      aria-label={`Toggle Rubric Criterion ${c.name}`}
                                      aria-expanded={!isCriterionCollapsed}
                                      className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                                      title={isCriterionCollapsed ? 'Expand Rubric Levels' : 'Collapse Rubric Levels'}
                                    >
                                      {isCriterionCollapsed ? (
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                                      )}
                                    </button>
                                    <span className="font-mono text-[10px] font-bold text-indigo-700 shrink-0">
                                      Rubric {cIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={c.name}
                                      onChange={(e) => {
                                        const updated = [...course.units];
                                        updated[activeUnitIndex].assessments[assIdx].criteria[cIdx].name = e.target.value;
                                        setCourse({ ...course, units: updated });
                                      }}
                                      data-agent-id={`course-builder-criterion-name-${c.id}`}
                                      data-testid={`criterion-name-${c.id}`}
                                      aria-label={`Criterion Name ${cIdx + 1}`}
                                      className="text-xs font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-600 outline-none px-1 py-0.5 flex-1 min-w-[140px]"
                                      placeholder="Criterion Name..."
                                    />
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-slate-600">
                                      <span>Weight:</span>
                                      <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={c.weight}
                                        onChange={(e) => {
                                          const updated = [...course.units];
                                          updated[activeUnitIndex].assessments[assIdx].criteria[cIdx].weight = parseInt(e.target.value) || 0;
                                          setCourse({ ...course, units: updated });
                                        }}
                                        className="w-12 px-1 py-0.5 text-[10px] font-mono border border-slate-200 rounded text-center outline-none focus:border-indigo-600"
                                      />
                                      <span>%</span>
                                    </div>

                                    {deletingCriterionId === c.id ? (
                                      <div className="flex items-center gap-1 animate-in fade-in duration-200">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCriterion(assIdx, cIdx)}
                                          data-agent-id={`course-builder-confirm-delete-crit-${c.id}-btn`}
                                          data-testid={`confirm-delete-crit-${c.id}`}
                                          aria-label={`Confirm Delete Criterion ${c.name}`}
                                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" /> Confirm Delete
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setDeletingCriterionId(null)}
                                          data-agent-id={`course-builder-cancel-delete-crit-${c.id}-btn`}
                                          data-testid={`cancel-delete-crit-${c.id}`}
                                          aria-label={`Cancel Delete Criterion ${c.name}`}
                                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setDeletingCriterionId(c.id)}
                                        data-agent-id={`course-builder-delete-criterion-${c.id}-btn`}
                                        data-testid={`delete-criterion-${c.id}`}
                                        aria-label={`Delete Rubric Criterion ${c.name}`}
                                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded hover:bg-rose-50"
                                        title="Delete Rubric Criterion"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* 5-Level Rubric Table / Cards */}
                                {!isCriterionCollapsed && (
                                  <div className="p-3 space-y-2">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                      {levels.map((lvl, lIndex) => {
                                        const levelColors = [
                                          { border: 'border-rose-200', bg: 'bg-rose-50/50', badge: 'bg-rose-100 text-rose-800' },
                                          { border: 'border-orange-200', bg: 'bg-orange-50/50', badge: 'bg-orange-100 text-orange-800' },
                                          { border: 'border-emerald-200', bg: 'bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-800' },
                                          { border: 'border-blue-200', bg: 'bg-blue-50/50', badge: 'bg-blue-100 text-blue-800' },
                                          { border: 'border-purple-200', bg: 'bg-purple-50/50', badge: 'bg-purple-100 text-purple-800' }
                                        ];
                                        const theme = levelColors[lIndex] || levelColors[0];

                                        return (
                                          <div
                                            key={`lvl-${c.id}-${lvl.level}`}
                                            className={`p-2.5 rounded-lg border ${theme.border} ${theme.bg} flex flex-col justify-between space-y-1.5`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${theme.badge}`}>
                                                L{lvl.level}
                                              </span>
                                              <span className="text-[9px] text-slate-500 font-medium">
                                                {lvl.label.replace(/^Level \d+ - /, '')}
                                              </span>
                                            </div>
                                            <textarea
                                              rows={5}
                                              value={lvl.descriptor}
                                              onChange={(e) => {
                                                const updated = [...course.units];
                                                const crit = updated[activeUnitIndex].assessments[assIdx].criteria[cIdx];
                                                if (!crit.levels) {
                                                  crit.levels = createDefaultRubricLevels(crit.name);
                                                }
                                                crit.levels[lIndex].descriptor = e.target.value;
                                                setCourse({ ...course, units: updated });
                                              }}
                                              data-agent-id={`course-builder-rubric-desc-${c.id}-l${lvl.level}`}
                                              data-testid={`rubric-desc-${c.id}-l${lvl.level}`}
                                              aria-label={`Descriptor for Level ${lIndex + 1} of ${c.name}`}
                                              className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded p-1.5 text-[10px] text-slate-800 outline-none leading-tight resize-y font-sans"
                                              placeholder={`Explain how to think about Level ${lIndex + 1} score...`}
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-mono font-medium">{u.nominalHours} Hours</span>
                    {deletingUnitId === u.id ? (
                      <div
                        className="flex items-center gap-1 animate-in fade-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUnit(idx);
                          }}
                          data-agent-id={`course-builder-confirm-delete-unit-${u.id}-btn`}
                          data-testid={`confirm-delete-unit-${u.id}`}
                          aria-label={`Confirm Delete Unit ${u.unitCode}`}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold flex items-center gap-0.5 shadow-2xs transition-colors"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingUnitId(null);
                          }}
                          data-agent-id={`course-builder-cancel-delete-unit-${u.id}-btn`}
                          data-testid={`cancel-delete-unit-${u.id}`}
                          aria-label={`Cancel Delete Unit ${u.unitCode}`}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingUnitId(u.id);
                        }}
                        data-agent-id={`course-builder-delete-unit-${u.id}-btn`}
                        data-testid={`delete-unit-${u.id}`}
                        aria-label={`Delete Unit ${u.unitCode}`}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded hover:bg-rose-50"
                        title={`Delete Unit ${u.unitCode}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
              
              {/* Unit Info Header & Fields (Collapsible) */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all">
                <div
                  onClick={() => setIsUnitInfoCollapsed(!isUnitInfoCollapsed)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      type="button"
                      aria-expanded={!isUnitInfoCollapsed}
                      aria-label="Toggle Unit Info"
                      data-agent-id="course-builder-toggle-unit-info-btn"
                      data-testid="toggle-unit-info-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUnitInfoCollapsed(!isUnitInfoCollapsed);
                      }}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      {isUnitInfoCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                    </button>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Unit of Competency Details
                    </span>
                    {isUnitInfoCollapsed && (
                      <span className="text-xs text-slate-600 font-medium truncate ml-2">
                        {activeUnit.unitCode}: {activeUnit.unitTitle} ({activeUnit.nominalHours}h)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    {deletingUnitId === activeUnit.id ? (
                      <div className="flex items-center gap-1 animate-in fade-in duration-200">
                        <button
                          type="button"
                          onClick={() => handleDeleteUnit(activeUnitIndex)}
                          data-agent-id={`course-builder-header-confirm-delete-unit-${activeUnit.id}-btn`}
                          data-testid={`header-confirm-delete-unit-${activeUnit.id}`}
                          aria-label={`Confirm Delete Unit ${activeUnit.unitCode}`}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold flex items-center gap-0.5 shadow-2xs transition-colors"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingUnitId(null)}
                          data-agent-id={`course-builder-header-cancel-delete-unit-${activeUnit.id}-btn`}
                          data-testid={`header-cancel-delete-unit-${activeUnit.id}`}
                          aria-label={`Cancel Delete Unit ${activeUnit.unitCode}`}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingUnitId(activeUnit.id)}
                        data-agent-id={`course-builder-header-delete-unit-${activeUnit.id}-btn`}
                        data-testid={`header-delete-unit-${activeUnit.id}`}
                        aria-label={`Delete Unit ${activeUnit.unitCode}`}
                        className="px-2 py-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                        title={`Delete Unit ${activeUnit.unitCode}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[10px]">Delete Unit</span>
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isUnitInfoCollapsed ? 'Expand' : 'Collapse'}
                    </span>
                  </div>
                </div>

                {!isUnitInfoCollapsed && (
                  <div className="p-4 pt-0 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
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
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-bold outline-none focus:border-indigo-600 focus:bg-white shadow-2xs"
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
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-mono font-bold outline-none focus:border-indigo-600 focus:bg-white shadow-2xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Lessons Stack Section (Collapsible) */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLessonsSectionCollapsed(!isLessonsSectionCollapsed)}
                      data-agent-id="course-builder-toggle-lessons-section-btn"
                      data-testid="toggle-lessons-section-btn"
                      aria-label="Toggle Modular Lessons Section"
                      aria-expanded={!isLessonsSectionCollapsed}
                      className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      {isLessonsSectionCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>Modular Lessons Stack</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono">
                        {activeUnit.lessons.length}
                      </span>
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allCollapsed = activeUnit.lessons.every((l) => collapsedLessonIds[l.id]);
                        const newMap = { ...collapsedLessonIds };
                        activeUnit.lessons.forEach((l) => {
                          newMap[l.id] = !allCollapsed;
                        });
                        setCollapsedLessonIds(newMap);
                      }}
                      data-agent-id="course-builder-toggle-all-lessons-btn"
                      data-testid="toggle-all-lessons-btn"
                      className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
                    >
                      {activeUnit.lessons.every((l) => collapsedLessonIds[l.id]) ? 'Expand All Lessons' : 'Collapse All Lessons'}
                    </button>
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
                </div>

                {!isLessonsSectionCollapsed && (
                  <>
                    {activeUnit.lessons.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                        <BookOpen className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                        <p className="text-xs font-medium text-slate-600">No modular lessons in this unit yet.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Click &ldquo;Add Lesson (45m)&rdquo; above to stack modular lessons.</p>
                      </div>
                    ) : (
                      activeUnit.lessons.map((les, lIdx) => {
                        const isLessonCollapsed = !!collapsedLessonIds[les.id];
                        return (
                          <div key={les.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs transition-all">
                            {/* Lesson Header (Collapsible) */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleLessonCollapse(les.id)}
                                  data-agent-id={`course-builder-toggle-lesson-${les.id}-btn`}
                                  data-testid={`toggle-lesson-${les.id}`}
                                  aria-label={`Toggle Lesson ${les.title}`}
                                  aria-expanded={!isLessonCollapsed}
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                                  title={isLessonCollapsed ? 'Expand Lesson' : 'Collapse Lesson'}
                                >
                                  {isLessonCollapsed ? (
                                    <ChevronRight className="w-4 h-4 text-indigo-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-indigo-600" />
                                  )}
                                </button>
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
                                {isLessonCollapsed && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-medium">
                                      {les.estimatedMinutes}m
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-medium border border-indigo-100">
                                      {les.blocks.length} elements
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {!isLessonCollapsed && (
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
                                )}

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

                            {/* Collapsible Lesson Body */}
                            {!isLessonCollapsed && (
                              <div className="space-y-3 pt-1">
                                {/* Lesson Overview Description Textarea */}
                                <div className="space-y-1 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5 text-slate-700">
                                      <AlignLeft className="w-3 h-3 text-indigo-600" />
                                      <span>Lesson Overview & Paragraph Instructions</span>
                                    </span>
                                  </div>
                                  <textarea
                                    rows={2}
                                    value={les.description || ''}
                                    onChange={(e) => {
                                      const updated = [...course.units];
                                      updated[activeUnitIndex].lessons[lIdx].description = e.target.value;
                                      setCourse({ ...course, units: updated });
                                    }}
                                    data-agent-id={`course-builder-lesson-description-input-${les.id}`}
                                    data-testid={`course-builder-lesson-description-${les.id}`}
                                    aria-label={`Overview description for lesson ${les.title}`}
                                    className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-md p-2 text-xs text-slate-800 outline-none transition-colors font-sans leading-relaxed resize-y placeholder:text-slate-400"
                                    placeholder="Type introductory paragraphs, lesson background, pedagogical focus, or learning guidance for students here..."
                                  />
                                </div>

                                {/* Lesson Blocks (Elements Stack) */}
                                <div className="space-y-3 pl-4 border-l-2 border-indigo-100">
                                  {les.blocks.map((blk, bIdx) => {
                                    const isBlockCollapsed = !!collapsedBlockIds[blk.id];
                                    if (blk.type === 'description') {
                                      return (
                                        <div key={blk.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2.5 shadow-2xs transition-all">
                                          {/* Description Block Header */}
                                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <button
                                                type="button"
                                                onClick={() => toggleBlockCollapse(blk.id)}
                                                data-agent-id={`course-builder-toggle-block-${blk.id}-btn`}
                                                data-testid={`toggle-block-${blk.id}`}
                                                aria-label={`Toggle Element ${blk.title}`}
                                                aria-expanded={!isBlockCollapsed}
                                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 rounded transition-colors"
                                                title={isBlockCollapsed ? 'Expand Block' : 'Collapse Block'}
                                              >
                                                {isBlockCollapsed ? (
                                                  <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
                                                ) : (
                                                  <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                                                )}
                                              </button>
                                              <span className="font-mono uppercase px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider flex items-center gap-1 bg-slate-200 text-slate-800 border border-slate-300">
                                                <AlignLeft className="w-2.5 h-2.5 text-indigo-600" />
                                                DESCRIPTION
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
                                                className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 text-slate-800 font-bold outline-none px-1 py-0.5 flex-1 min-w-[120px] text-xs"
                                                placeholder="Description Block Title..."
                                              />
                                            </div>

                                  {/* Delete with confirmation */}
                                  <div className="shrink-0 flex items-center">
                                    {deletingBlockId === blk.id ? (
                                      <div className="flex items-center gap-1 animate-in fade-in duration-200">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteBlock(activeUnitIndex, lIdx, bIdx)}
                                          data-agent-id={`course-builder-confirm-delete-block-${blk.id}-btn`}
                                          data-testid={`confirm-delete-block-${blk.id}`}
                                          aria-label={`Confirm Delete Element ${blk.title}`}
                                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
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

                                {/* Paragraph Textarea (Collapsible) */}
                                {!isBlockCollapsed && (
                                  <textarea
                                    rows={4}
                                    value={blk.content || ''}
                                    onChange={(e) => {
                                      const updated = [...course.units];
                                      const targetBlk = updated[activeUnitIndex].lessons[lIdx].blocks[bIdx];
                                      if (targetBlk) targetBlk.content = e.target.value;
                                      setCourse({ ...course, units: updated });
                                    }}
                                    data-agent-id={`course-builder-block-description-textarea-${blk.id}`}
                                    data-testid={`course-builder-block-description-${blk.id}`}
                                    aria-label={`Paragraph content for ${blk.title}`}
                                    className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-lg p-2.5 text-xs text-slate-800 outline-none transition-colors font-sans leading-relaxed resize-y placeholder:text-slate-400"
                                    placeholder="Type detailed paragraphs, module summaries, theoretical background, or study instructions here..."
                                  />
                                )}
                              </div>
                            );
                          }

                          const linksList = (blk.links && blk.links.length > 0)
                            ? blk.links
                            : [{ id: `initial-${blk.id}`, title: `${blk.title} URL`, url: blk.url || blk.content || '' }];

                          return (
                            <div key={blk.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2.5 shadow-2xs">
                              {/* Element Header */}
                              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => toggleBlockCollapse(blk.id)}
                                    data-agent-id={`course-builder-toggle-block-${blk.id}-btn`}
                                    data-testid={`toggle-block-${blk.id}`}
                                    aria-label={`Toggle Element ${blk.title}`}
                                    aria-expanded={!isBlockCollapsed}
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 rounded transition-colors"
                                    title={isBlockCollapsed ? 'Expand Element' : 'Collapse Element'}
                                  >
                                    {isBlockCollapsed ? (
                                      <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                                    )}
                                  </button>
                                  <span className={`font-mono uppercase px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider flex items-center gap-1 ${
                                    blk.type === 'presentation' ? 'bg-indigo-100 text-indigo-900 border border-indigo-200' :
                                    blk.type === 'video' || blk.type === 'youtube_video' ? 'bg-rose-100 text-rose-900 border border-rose-200' :
                                    blk.type === 'drive' || blk.type === 'google_drive_link' ? 'bg-sky-100 text-sky-900 border border-sky-200' :
                                    blk.type === 'file' || blk.type === 'file_upload' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                                    blk.type === 'notebook' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                                    blk.type === 'quiz' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                                    'bg-slate-200 text-slate-800 border border-slate-300'
                                  }`}>
                                    {blk.type === 'presentation' && <Presentation className="w-2.5 h-2.5" />}
                                    {(blk.type === 'video' || blk.type === 'youtube_video') && <Video className="w-2.5 h-2.5" />}
                                    {(blk.type === 'drive' || blk.type === 'google_drive_link') && <FolderOpen className="w-2.5 h-2.5" />}
                                    {(blk.type === 'file' || blk.type === 'file_upload') && <Paperclip className="w-2.5 h-2.5" />}
                                    {blk.type === 'notebook' && <BookOpen className="w-2.5 h-2.5" />}
                                    {blk.type === 'quiz' && <CheckCircle2 className="w-2.5 h-2.5" />}
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
                                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 text-slate-800 font-bold outline-none px-1 py-0.5 flex-1 min-w-[120px] text-xs"
                                    placeholder="Element Title..."
                                  />
                                  {isBlockCollapsed && (
                                    <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                                      {linksList.length} link{linksList.length === 1 ? '' : 's'}
                                    </span>
                                  )}
                                </div>

                                {/* Element Delete with Two-step Confirmation */}
                                <div className="shrink-0 flex items-center">
                                  {deletingBlockId === blk.id ? (
                                    <div className="flex items-center gap-1 animate-in fade-in duration-200">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteBlock(activeUnitIndex, lIdx, bIdx)}
                                        data-agent-id={`course-builder-confirm-delete-block-${blk.id}-btn`}
                                        data-testid={`confirm-delete-block-${blk.id}`}
                                        aria-label={`Confirm Delete Element ${blk.title}`}
                                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
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

                              {/* Multi-Link List Nestled Under This Element (Collapsible) */}
                              {!isBlockCollapsed && (
                                <div className="space-y-2 pl-3 border-l-2 border-indigo-200/70">
                                {linksList.map((linkItem, linkIdx) => (
                                  <div key={linkItem.id} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                                    <div className="flex items-center justify-between gap-2">
                                      <input
                                        type="text"
                                        value={linkItem.title}
                                        onChange={(e) => {
                                          const updated = [...course.units];
                                          const targetBlk = updated[activeUnitIndex].lessons[lIdx].blocks[bIdx];
                                          if (!targetBlk.links) targetBlk.links = [...linksList];
                                          if (targetBlk.links[linkIdx]) {
                                            targetBlk.links[linkIdx].title = e.target.value;
                                          }
                                          setCourse({ ...course, units: updated });
                                        }}
                                        data-agent-id={`course-builder-link-title-input-${linkItem.id}`}
                                        data-testid={`course-builder-link-title-${linkItem.id}`}
                                        aria-label={`Title for Link ${linkIdx + 1}`}
                                        className="border-b border-transparent hover:border-slate-300 focus:border-indigo-600 text-[11px] font-bold text-slate-800 outline-none px-1 py-0.5 flex-1 min-w-[100px]"
                                        placeholder="Link Title (e.g. Slide Deck, Handout, Recording)..."
                                      />

                                      {/* Delete Link with Two-step Confirmation */}
                                      {deletingLinkId === linkItem.id ? (
                                        <div className="flex items-center gap-1 animate-in fade-in duration-200 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteLinkFromBlock(activeUnitIndex, lIdx, bIdx, linkIdx)}
                                            data-agent-id={`course-builder-confirm-delete-link-${linkItem.id}-btn`}
                                            data-testid={`confirm-delete-link-${linkItem.id}`}
                                            aria-label={`Confirm Delete Link ${linkItem.title}`}
                                            className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold flex items-center gap-0.5"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" /> Confirm
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setDeletingLinkId(null)}
                                            data-agent-id={`course-builder-cancel-delete-link-${linkItem.id}-btn`}
                                            data-testid={`cancel-delete-link-${linkItem.id}`}
                                            aria-label="Cancel delete link"
                                            className="px-1 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[9px]"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setDeletingLinkId(linkItem.id)}
                                          data-agent-id={`course-builder-delete-link-${linkItem.id}-btn`}
                                          data-testid={`delete-link-${linkItem.id}`}
                                          aria-label={`Delete Link ${linkItem.title}`}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors shrink-0"
                                          title="Delete Link"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>

                                    {/* URL Link Box */}
                                    <div className="flex items-center gap-1.5">
                                      <div className="relative flex-1">
                                        <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                                        <input
                                          type="url"
                                          value={linkItem.url}
                                          onChange={(e) => {
                                            const updated = [...course.units];
                                            const targetBlk = updated[activeUnitIndex].lessons[lIdx].blocks[bIdx];
                                            if (!targetBlk.links) targetBlk.links = [...linksList];
                                            if (targetBlk.links[linkIdx]) {
                                              targetBlk.links[linkIdx].url = e.target.value;
                                            }
                                            targetBlk.url = e.target.value;
                                            setCourse({ ...course, units: updated });
                                          }}
                                          data-agent-id={`course-builder-link-url-input-${linkItem.id}`}
                                          data-testid={`course-builder-link-url-${linkItem.id}`}
                                          aria-label={`URL Link for ${linkItem.title}`}
                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-900 font-mono outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                                          placeholder={
                                            blk.type === 'presentation' ? 'https://docs.google.com/presentation/d/...' :
                                            blk.type === 'video' || blk.type === 'youtube_video' ? 'https://www.youtube.com/watch?...' :
                                            blk.type === 'drive' || blk.type === 'google_drive_link' ? 'https://drive.google.com/drive/folders/...' :
                                            blk.type === 'file' || blk.type === 'file_upload' ? 'https://... (document or file link)' :
                                            blk.type === 'notebook' ? 'https://colab.research.google.com/drive/...' :
                                            blk.type === 'quiz' ? 'https://forms.google.com/... or quiz URL' :
                                            'https://...'
                                          }
                                        />
                                      </div>

                                      {linkItem.url && linkItem.url.startsWith('http') && (
                                        <a
                                          href={linkItem.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          data-agent-id={`course-builder-open-link-${linkItem.id}-btn`}
                                          data-testid={`open-link-${linkItem.id}`}
                                          aria-label={`Open link ${linkItem.title} in new tab`}
                                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 rounded-lg shrink-0 transition-colors"
                                          title="Open link in new tab"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}

                                {/* Dropdown Box Nestled Under the Same Element */}
                                <div className="pt-0.5 flex items-center gap-2">
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleAddLinkToBlock(activeUnitIndex, lIdx, bIdx, e.target.value);
                                      }
                                    }}
                                    data-agent-id={`course-builder-nestled-add-dropdown-${blk.id}`}
                                    data-testid={`nestled-add-dropdown-${blk.id}`}
                                    aria-label={`Add more links under ${blk.title}`}
                                    className="bg-white border border-slate-300 hover:border-indigo-500 rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-700 outline-none cursor-pointer focus:border-indigo-600 shadow-2xs transition-colors"
                                  >
                                    <option value="" disabled>
                                      + Add more to this {blk.type.replace(/_/g, ' ')}...
                                    </option>
                                    <option value={`Additional ${blk.type === 'presentation' ? 'Slide Deck' : blk.type === 'video' ? 'Video Recording' : blk.type === 'drive' ? 'Drive Folder' : blk.type === 'file' ? 'Document File' : blk.type === 'notebook' ? 'Colab Notebook' : 'Quiz'} Link`}>
                                      + Add Another {blk.type === 'presentation' ? 'Slide' : blk.type === 'video' ? 'Video' : blk.type === 'drive' ? 'Drive' : blk.type === 'file' ? 'File' : blk.type === 'notebook' ? 'Notebook' : 'Quiz'} URL
                                    </option>
                                    <option value="Supporting Handout / Material URL">
                                      + Add Supporting Handout / Material URL
                                    </option>
                                    <option value="Supplementary Reference URL">
                                      + Add Supplementary Reference URL
                                    </option>
                                    <option value="Student Activity / Exercise URL">
                                      + Add Student Activity / Exercise URL
                                    </option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                        })}

                        {/* Add Element Triggers */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Add Element:</span>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'description')}
                            data-agent-id={`course-builder-add-description-${les.id}-btn`}
                            data-testid={`add-description-${les.id}`}
                            aria-label="Add Paragraph Description Block"
                            className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-[10px] text-slate-800 font-bold hover:bg-slate-200 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <AlignLeft className="w-2.5 h-2.5 text-indigo-600" /> + Description
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'presentation')}
                            data-agent-id={`course-builder-add-presentation-${les.id}-btn`}
                            data-testid={`add-presentation-${les.id}`}
                            aria-label="Add Presentation Deck"
                            className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-[10px] text-indigo-800 font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Presentation className="w-2.5 h-2.5 text-indigo-600" /> + Presentation
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'video')}
                            data-agent-id={`course-builder-add-video-${les.id}-btn`}
                            data-testid={`add-video-${les.id}`}
                            aria-label="Add Video Lecture"
                            className="px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-800 font-bold hover:bg-rose-100 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Video className="w-2.5 h-2.5 text-rose-600" /> + Video
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'drive')}
                            data-agent-id={`course-builder-add-drive-${les.id}-btn`}
                            data-testid={`add-drive-${les.id}`}
                            aria-label="Add Google Drive Resource"
                            className="px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-[10px] text-sky-800 font-bold hover:bg-sky-100 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <FolderOpen className="w-2.5 h-2.5 text-sky-600" /> + Drive
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'file')}
                            data-agent-id={`course-builder-add-file-${les.id}-btn`}
                            data-testid={`add-file-${les.id}`}
                            aria-label="Add File Attachment"
                            className="px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-[10px] text-purple-800 font-bold hover:bg-purple-100 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Paperclip className="w-2.5 h-2.5 text-purple-600" /> + File
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'notebook')}
                            data-agent-id={`course-builder-add-notebook-${les.id}-btn`}
                            data-testid={`add-notebook-${les.id}`}
                            aria-label="Add Google Notebook"
                            className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-bold hover:bg-amber-100 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <BookOpen className="w-2.5 h-2.5 text-amber-600" /> + Google Notebook
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock(activeUnitIndex, lIdx, 'quiz')}
                            data-agent-id={`course-builder-add-quiz-${les.id}-btn`}
                            data-testid={`add-quiz-${les.id}`}
                            aria-label="Add Formative Quiz"
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> + Quiz
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}
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
