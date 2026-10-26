import type { UnitDetail } from '../../data/units.ts';
import { UNITS_DATA } from '../../data/units.ts';
import type { CourseUnit } from './units.ts';

export const UNIT_SYLLABI_STORAGE_KEY = 'edupulse_unit_syllabi_bank';

/**
 * Maps an LMS CourseUnit from the Course Builder into the UnitDetail shape
 * expected by the Unit Syllabi bank (UnitCatalogView and Student Assist).
 */
export function mapCourseUnitToUnitDetail(
  unit: CourseUnit,
  courseCode?: string,
  courseTitle?: string
): UnitDetail {
  const code = (unit.unitCode || 'UNIT101').toUpperCase().trim();
  const title = unit.unitTitle || 'New Unit of Competency';

  // Format performance criteria as learning outcomes
  const learningOutcomes =
    unit.performanceCriteria && unit.performanceCriteria.length > 0
      ? unit.performanceCriteria.map((pc) =>
          `${pc.code} ${pc.title}${pc.description ? `: ${pc.description}` : ''}`.trim()
        )
      : [
          '1.1 Demonstrate foundational knowledge and operational principles.',
          '1.2 Apply critical thinking and analysis to execute workplace benchmarks.',
          '2.1 Formulate and deliver compliant vocational and higher education outcomes.'
        ];

  // Format lessons as weekly syllabus topics
  const topics =
    unit.lessons && unit.lessons.length > 0
      ? unit.lessons.map((lesson, idx) => ({
          week: idx + 1,
          title: lesson.title,
          summary:
            lesson.description ||
            `${lesson.estimatedMinutes || 60} mins guided study and competency practice.`
        }))
      : [
          {
            week: 1,
            title: 'Foundations & Statutory Standards',
            summary: 'Core principles, ASQA/TEQSA compliance, and regulatory frameworks.'
          },
          {
            week: 2,
            title: 'Operational Methodology & Case Studies',
            summary: 'Practical case study execution, consultations, and performance benchmarks.'
          },
          {
            week: 3,
            title: 'Review, Synthesis & Summative Readiness',
            summary: 'Summative assessment readiness, evidence gathering, and rubric evaluation.'
          }
        ];

  // Format assessments
  const assessments =
    unit.assessments && unit.assessments.length > 0
      ? unit.assessments.map((ass, idx) => ({
          name: ass.title || `Assessment Task ${idx + 1}`,
          weight: Number(ass.criteria?.[0]?.weight) || (idx === 0 ? 40 : 60),
          type: (ass.type === 'formative' ? 'Assignment' : 'Project') as any,
          description: ass.description || `${ass.type} competency assessment task.`,
          dueWeek: ass.dueDate ? `Due ${ass.dueDate}` : `Week ${idx * 6 + 4}`
        }))
      : [
          {
            name: 'Assessment 1: Formative Knowledge Check',
            weight: 40,
            type: 'Assignment' as const,
            description: 'Continuous formative assessment assessing core knowledge.',
            dueWeek: 'Week 4'
          },
          {
            name: 'Assessment 2: Summative Practical Demonstration',
            weight: 60,
            type: 'Project' as const,
            description: 'Summative practical demonstration assessed against AQF performance rubrics.',
            dueWeek: 'Week 8'
          }
        ];

  return {
    code,
    title,
    faculty: 'Faculty of Engineering & Computer Science',
    level:
      code.includes('5') || code.includes('6') || code.includes('7')
        ? 'Postgraduate'
        : 'Undergraduate',
    creditPoints: 6,
    semestersOffered: ['Semester 1', 'Semester 2'],
    deliveryMode: 'Blended',
    coordinator: {
      name: 'Academic Faculty Team',
      email: 'faculty@edupulse.edu.au',
      office: 'Curriculum & LMS Hub'
    },
    overview: unit.description
      ? `${code} - ${title}: ${unit.description}`
      : `Accredited unit syllabus for ${title} (${code}) in program ${
          courseCode || 'BSB41419'
        }. Nominal hours: ${unit.nominalHours || 40}h.`,
    learningOutcomes,
    prerequisites: ['None'],
    topics,
    assessments,
    prescribedResources: [
      'Official Training Package syllabus & unit descriptor',
      'LMS lecture notes, laboratory guides, and 5-level rubric benchmarks'
    ]
  };
}

/**
 * Retrieves the complete Unit Syllabi bank, seamlessly merging default seed units
 * with dynamically created units from Course Builder.
 */
export function getStoredUnitSyllabi(): UnitDetail[] {
  if (typeof window === 'undefined') return [...UNITS_DATA];

  try {
    const raw = localStorage.getItem(UNIT_SYLLABI_STORAGE_KEY);
    if (!raw) return [...UNITS_DATA];

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const codeMap = new Map<string, UnitDetail>();
      // Baseline seeds
      UNITS_DATA.forEach((u) => codeMap.set(u.code.toUpperCase(), u));
      // Dynamic units from Course Builder take precedence
      parsed.forEach((u: UnitDetail) => {
        if (u && u.code) {
          codeMap.set(u.code.toUpperCase(), u);
        }
      });
      return Array.from(codeMap.values());
    }
  } catch (e) {
    console.warn('Error reading stored unit syllabi bank:', e);
  }

  return [...UNITS_DATA];
}

/**
 * Saves a CourseUnit from the Course Builder directly into the Unit Syllabi bank.
 * Persists to localStorage, notifies all active components via custom event,
 * and asynchronously records it on the server.
 */
export function saveUnitToSyllabiBank(
  unit: CourseUnit,
  courseCode?: string,
  courseTitle?: string
): UnitDetail {
  const detail = mapCourseUnitToUnitDetail(unit, courseCode, courseTitle);

  if (typeof window !== 'undefined') {
    try {
      const current = getStoredUnitSyllabi();
      const existingIdx = current.findIndex(
        (u) => u.code.toUpperCase() === detail.code.toUpperCase()
      );
      let updated: UnitDetail[];
      if (existingIdx >= 0) {
        updated = [...current];
        updated[existingIdx] = detail;
      } else {
        updated = [detail, ...current];
      }
      localStorage.setItem(UNIT_SYLLABI_STORAGE_KEY, JSON.stringify(updated));

      // Real-time reactive broadcast to all views (UnitCatalogView, HomeView, Navbar)
      window.dispatchEvent(
        new CustomEvent('edupulse_units_updated', {
          detail: { unit: detail, allUnits: updated }
        })
      );
    } catch (e) {
      console.warn('Error saving to local unit syllabi bank:', e);
    }
  }

  // Asynchronously synchronize with backend server
  try {
    fetch('/api/course-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_unit',
        payload: {
          unit: {
            id: unit.id || detail.code,
            code: detail.code,
            title: detail.title,
            nominalHours: unit.nominalHours || 40,
            programId: courseCode || 'BSB41419',
            aqfLevel: detail.level === 'Postgraduate' ? 8 : 4,
            status: 'published',
            overview: detail.overview,
            assessments: detail.assessments,
            learningOutcomes: detail.learningOutcomes
          }
        }
      })
    }).catch(() => {});
  } catch (e) {}

  return detail;
}

/**
 * Synchronizes an array of CourseUnits from Course Builder into the Unit Syllabi bank.
 */
export function syncAllUnitsToSyllabiBank(
  units: CourseUnit[],
  courseCode?: string,
  courseTitle?: string
): UnitDetail[] {
  if (!units || units.length === 0) return [];
  return units.map((u) => saveUnitToSyllabiBank(u, courseCode, courseTitle));
}
