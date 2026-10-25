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

export interface CourseUnit {
  id: string;
  unitCode: string;
  unitTitle: string;
  nominalHours: number;
  description: string;
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
