import type { CourseAssessment } from './rubrics.ts';

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

export interface UnitPerformanceCriterion {
  id: string;
  element: string;
  code: string;
  title: string;
  description?: string;
}

export function createDefaultPerformanceCriteria(): UnitPerformanceCriterion[] {
  return [
    {
      id: 'pc-default-1-1',
      element: 'Element 1: Establish and maintain consultative arrangements',
      code: '1.1',
      title: 'Identify and interpret statutory WHS obligations and relevant compliance standards',
      description:
        'Accurately identify and access applicable national and state/territory statutory requirements, codes of practice, and guidance notes relevant to organizational operations.'
    },
    {
      id: 'pc-default-1-2',
      element: 'Element 1: Establish and maintain consultative arrangements',
      code: '1.2',
      title: 'Facilitate participative workplace consultations with stakeholders',
      description:
        'Engage designated health and safety representatives, worker committees, and operational managers in constructive consultation regarding hazard identification and risk control.'
    },
    {
      id: 'pc-default-2-1',
      element: 'Element 2: Implement hazard identification and risk assessment procedures',
      code: '2.1',
      title: 'Conduct structured hazard identification and risk assessments',
      description:
        'Systematically identify workplace hazards, assess associated likelihood and severity, and prioritize corrective measures in accordance with the hierarchy of controls.'
    }
  ];
}

export function createPerformanceCriterion(
  element: string = 'Element 1: Core Competency Requirements',
  code: string = '1.1',
  title: string = 'New Performance Criterion',
  description: string = 'Consistently demonstrate skills and knowledge required to satisfy the unit benchmark.'
): UnitPerformanceCriterion {
  return {
    id: `pc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    element,
    code,
    title,
    description
  };
}

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

export function createDefaultUnit(customCode?: string, customTitle?: string): CourseUnit {
  return {
    id: `unit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    unitCode: customCode || 'UNIT101',
    unitTitle: customTitle || 'New Unit of Competency',
    nominalHours: 40,
    description: 'Unit description and learning outcomes.',
    performanceCriteria: createDefaultPerformanceCriteria(),
    lessons: [],
    assessments: []
  };
}

export interface DeleteUnitResult {
  updatedUnits: CourseUnit[];
  newActiveIndex: number;
  deletedUnit: CourseUnit | null;
}

/**
 * Deletes a Unit of Competency from a course's unit array.
 * Safely handles index shifting, boundary clamping, and fallback unit creation
 * when the last unit is deleted, ensuring the course builder state is never left empty or broken.
 */
export function deleteUnitFromCourse(
  units: CourseUnit[],
  unitIndexToDelete: number,
  currentActiveIndex: number
): DeleteUnitResult {
  if (unitIndexToDelete < 0 || unitIndexToDelete >= units.length) {
    return {
      updatedUnits: [...units],
      newActiveIndex: currentActiveIndex,
      deletedUnit: null
    };
  }

  const deletedUnit = units[unitIndexToDelete];
  const updatedUnits = units.filter((_, idx) => idx !== unitIndexToDelete);

  let newActiveIndex = currentActiveIndex;

  if (updatedUnits.length === 0) {
    const fallbackUnit = createDefaultUnit('UNIT101', 'New Unit of Competency');
    updatedUnits.push(fallbackUnit);
    newActiveIndex = 0;
  } else if (unitIndexToDelete < currentActiveIndex) {
    newActiveIndex = currentActiveIndex - 1;
  } else if (currentActiveIndex >= updatedUnits.length) {
    newActiveIndex = Math.max(0, updatedUnits.length - 1);
  }

  return {
    updatedUnits,
    newActiveIndex,
    deletedUnit
  };
}
