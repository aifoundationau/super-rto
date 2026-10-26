import type { CourseFacultyInfo } from './faculty.ts';
import { createDefaultFacultyInfo } from './faculty.ts';
import type { ProgramAdmissionsProfile } from './admissions.ts';
import { createDefaultAdmissionsProfile } from './admissions.ts';
import type { CourseUnit } from './units.ts';
import { createDefaultPerformanceCriteria } from './units.ts';
import type { CourseAssessment } from './rubrics.ts';
import { createDefaultRubricLevels } from './rubrics.ts';
import type { CourseProgram } from '../../data/courses.ts';
import { COURSES_DATA } from '../../data/courses.ts';
import { getStoredUnitSyllabi } from './unitBank.ts';
import type { UnitEnrolledStudent } from './studentEnrolment.ts';
import { createDefaultEnrolledStudents } from './studentEnrolment.ts';

export interface CourseData {
  id: string;
  title: string;
  code: string;
  frameworkCode: string;
  aqfLevel: number;
  tokenCost: number;
  description: string;
  facultyInfo?: CourseFacultyInfo;
  admissionsProfile?: ProgramAdmissionsProfile;
  units: CourseUnit[];
}

export const DEFAULT_COURSE: CourseData = {
  id: 'course-bsb41419',
  title: 'Certificate IV in Work Health and Safety',
  code: 'BSB41419',
  frameworkCode: 'ASQA',
  aqfLevel: 4,
  tokenCost: 0,
  description:
    'National qualification for occupational health and safety coordinators and compliance officers.',
  facultyInfo: createDefaultFacultyInfo(
    'BSB41419',
    'Certificate IV in Work Health and Safety',
    4
  ),
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
      description:
        'Covers practical skills to facilitate statutory compliance and consultative arrangements in an Australian workplace.',
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
          description:
            'This foundational module introduces statutory WHS duties, employer obligations under Safe Work Australia harmonised model laws, and principles for consultative workplace risk management.',
          estimatedMinutes: 45,
          blocks: [
            {
              id: 'blk-intro',
              type: 'description',
              title: 'Module Overview & Reading Instructions',
              url: undefined
            },
            {
              id: 'blk-1',
              type: 'presentation',
              title: 'WHS Harmonisation & Duty Holders Slides',
              url: 'https://docs.google.com/presentation/d/demo-whs-framework/edit'
            },
            {
              id: 'blk-2',
              type: 'video',
              title: 'Safe Work Australia: Practical Risk Management',
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            },
            {
              id: 'blk-3',
              type: 'notebook',
              title: 'WHS Incident Analysis & Research Notebook',
              url: 'https://colab.research.google.com/drive/demo-whs-risk-modeling'
            }
          ]
        },
        {
          id: 'les-2',
          title: 'Hazard Identification, Risk Registers & Control Hierarchy',
          description:
            'Operational procedures for conducting workplace inspections, formulating risk registers, and applying elimination, substitution, engineering, and administrative controls.',
          estimatedMinutes: 60,
          blocks: [
            {
              id: 'blk-2-1',
              type: 'presentation',
              title: 'Hierarchy of Controls Operational Guide',
              url: 'https://docs.google.com/presentation/d/demo-hierarchy-controls/edit'
            },
            {
              id: 'blk-2-2',
              type: 'file',
              title: 'Standardised Workplace Risk Register Template (XLSX)',
              url: 'https://drive.google.com/file/d/demo-risk-register/view'
            }
          ]
        }
      ],
      assessments: [
        {
          id: 'ass-formative-1',
          type: 'formative',
          title: 'Formative Knowledge Check & Practice Activity',
          description:
            'Continuous formative assessment measuring foundational concepts, applied problem-solving, and reflective practice.',
          examNumber: 1,
          dueDate: '2026-11-10',
          criteria: [
            {
              id: 'crit-f-1',
              name: 'Foundational Knowledge & Principles',
              weight: 50,
              competentDescriptor:
                'Meets competency benchmark: consistently and accurately applies core principles and concepts.',
              notYetCompetentDescriptor:
                'Critical gaps: fundamental concepts are missing, inaccurate, or non-compliant.',
              levels: createDefaultRubricLevels('Foundational Knowledge & Principles')
            },
            {
              id: 'crit-f-2',
              name: 'Applied Practice & Consultative Reflection',
              weight: 50,
              competentDescriptor:
                'Meets competency benchmark: reliably executes standard procedures and participates constructively.',
              notYetCompetentDescriptor:
                'Critical gaps: unable to complete routine tasks or engage with collaborative procedures.',
              levels: createDefaultRubricLevels('Applied Practice & Consultative Reflection')
            }
          ]
        },
        {
          id: 'ass-summative-1',
          type: 'summative',
          title: 'Summative Performance Portfolio & Capstone Evaluation',
          description:
            'Formal summative evaluation assessing end-to-end practical execution, regulatory compliance documentation, and portfolio deliverables.',
          examNumber: 2,
          dueDate: '2026-11-24',
          criteria: [
            {
              id: 'crit-s-1',
              name: 'Demonstration & Execution Rigor',
              weight: 50,
              competentDescriptor:
                'Meets competency benchmark: independently satisfies all assessment rubric criteria to required industry quality.',
              notYetCompetentDescriptor:
                'Critical gaps: fails to meet essential execution standards; critical steps omitted.',
              levels: createDefaultRubricLevels('Demonstration & Execution Rigor')
            },
            {
              id: 'crit-s-2',
              name: 'Analysis, Evaluation & Quality Assurance',
              weight: 50,
              competentDescriptor:
                'Meets competency benchmark: produces structured, evidence-based reports adhering to standards.',
              notYetCompetentDescriptor:
                'Critical gaps: analysis lacks structure, evidence, or actionable recommendations.',
              levels: createDefaultRubricLevels('Analysis, Evaluation & Quality Assurance')
            }
          ]
        }
      ],
      enrolledStudents: createDefaultEnrolledStudents('BSB41419', 'BSBWHS411')
    },
    {
      id: 'unit-bsbwhs513',
      unitCode: 'BSBWHS513',
      unitTitle: 'Lead WHS risk management in an organisation',
      nominalHours: 60,
      description:
        'Strategic oversight, continuous auditing, and executive risk governance across organizational facilities.',
      performanceCriteria: [
        {
          id: 'pc-513-1',
          element: 'Element 1: Establish organizational risk management framework',
          code: '1.1',
          title: 'Evaluate existing safety management system architecture',
          description:
            'Conduct comprehensive audit of existing systems and define organizational risk tolerances.'
        },
        {
          id: 'pc-513-2',
          element: 'Element 2: Review and report on statutory compliance',
          code: '2.1',
          title: 'Prepare compliance reports for executive leadership',
          description:
            'Compile executive risk summaries and action plans aligned with AS/NZS ISO 45001 standards.'
        }
      ],
      lessons: [
        {
          id: 'les-513-1',
          title: 'ISO 45001 & Enterprise Safety Risk Leadership',
          description:
            'Global standards for occupational health and safety management systems and executive due diligence.',
          estimatedMinutes: 60,
          blocks: [
            {
              id: 'blk-513-1',
              type: 'presentation',
              title: 'Executive Due Diligence Slides',
              url: 'https://docs.google.com/presentation/d/demo-iso45001/edit'
            }
          ]
        }
      ],
      assessments: [
        {
          id: 'ass-513-summative',
          type: 'summative',
          title: 'Executive WHS Risk Audit & Strategic Presentation',
          description:
            'Develop an enterprise-grade risk management framework and deliver an executive board briefing.',
          examNumber: 1,
          dueDate: '2026-12-05',
          criteria: [
            {
              id: 'crit-513-1',
              name: 'Strategic Compliance Architecture',
              weight: 60,
              competentDescriptor:
                'Meets competency benchmark: establishes fully compliant governance systems.',
              notYetCompetentDescriptor:
                'Critical gaps: non-compliant with ISO 45001 or model WHS regulations.',
              levels: createDefaultRubricLevels('Strategic Compliance Architecture')
            },
            {
              id: 'crit-513-2',
              name: 'Executive Consultation & Presentation',
              weight: 40,
              competentDescriptor:
                'Meets competency benchmark: communicates strategic risks clearly to senior executives.',
              notYetCompetentDescriptor:
                'Critical gaps: unclear presentation or ungrounded conclusions.',
              levels: createDefaultRubricLevels('Executive Consultation & Presentation')
            }
          ]
        }
      ],
      enrolledStudents: createDefaultEnrolledStudents('BSB41419', 'BSBWHS513')
    }
  ]
};

/**
 * Retrieves the student-facing course data.
 * Checks for user customizations from Course Builder in localStorage or defaults to DEFAULT_COURSE.
 */
export function getStudentCourseData(courseCode?: string): CourseData {
  if (typeof window === 'undefined') {
    return DEFAULT_COURSE;
  }

  try {
    const rawSaved = localStorage.getItem('edupulse_course_builder_saved');
    if (rawSaved) {
      const parsed = JSON.parse(rawSaved);
      if (parsed && parsed.code && (!courseCode || parsed.code.toUpperCase() === courseCode.toUpperCase())) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading stored course builder course for student:', e);
  }

  // If a specific course code from COURSES_DATA is requested, build a student course from it
  if (courseCode && courseCode.toUpperCase() !== DEFAULT_COURSE.code.toUpperCase()) {
    const catalogMatch = COURSES_DATA.find((c) => c.code.toUpperCase() === courseCode.toUpperCase());
    if (catalogMatch) {
      return buildCourseDataFromCatalog(catalogMatch);
    }
  }

  return DEFAULT_COURSE;
}

/**
 * Builds a full CourseData structure from a catalog course and stored syllabi bank
 */
export function buildCourseDataFromCatalog(program: CourseProgram): CourseData {
  const bankUnits = getStoredUnitSyllabi();
  const bankUnitMap = new Map(bankUnits.map((u) => [u.code.toUpperCase(), u]));

  const courseUnits: CourseUnit[] = program.coreUnits.map((uCode, idx) => {
    const unitDetail = bankUnitMap.get(uCode.toUpperCase());
    const unitTitle = unitDetail ? unitDetail.title : `Core Study Unit ${idx + 1}`;
    const nominalHours = unitDetail ? (unitDetail.creditPoints || 6) * 10 : 40;

    return {
      id: `unit-${uCode.toLowerCase()}`,
      unitCode: uCode,
      unitTitle,
      nominalHours,
      description:
        unitDetail?.overview ||
        `Core accredited curriculum unit for ${program.title} (${uCode}).`,
      performanceCriteria: [
        {
          id: `pc-${uCode.toLowerCase()}-1`,
          element: 'Element 1: Core Theoretical Foundations & Principles',
          code: '1.1',
          title: `Demonstrate mastery of core principles in ${unitTitle}`,
          description: `Accurately apply foundational knowledge, technical benchmarks, and theoretical frameworks.`
        },
        {
          id: 'pc-' + uCode.toLowerCase() + '-2',
          element: 'Element 2: Applied Industry Practice & Synthesis',
          code: '2.1',
          title: 'Execute structured workplace problem-solving',
          description: 'Apply industry methodologies to formulate and deliver compliant outcomes.'
        }
      ],
      lessons: (unitDetail?.topics || []).map((t, lIdx) => ({
        id: `les-${uCode.toLowerCase()}-${lIdx + 1}`,
        title: `Week ${t.week || lIdx + 1}: ${t.title}`,
        description: t.summary || 'Scheduled lecture, seminar, and guided learning activities.',
        estimatedMinutes: 60,
        blocks: [
          {
            id: `blk-${uCode.toLowerCase()}-${lIdx + 1}-1`,
            type: 'presentation',
            title: `${t.title} Presentation Slides`,
            url: 'https://docs.google.com/presentation/d/demo-courseware/edit'
          }
        ]
      })),
      assessments: (unitDetail?.assessments || []).map((a, aIdx) => ({
        id: `ass-${uCode.toLowerCase()}-${aIdx + 1}`,
        type: a.type === 'Assignment' ? 'formative' : 'summative',
        title: a.name,
        description: a.description || `Assessment evaluated against AQF standards.`,
        examNumber: aIdx + 1,
        dueDate: a.dueWeek ? `Due ${a.dueWeek}` : `Week ${(aIdx + 1) * 6}`,
        criteria: [
          {
            id: `crit-${uCode.toLowerCase()}-${aIdx + 1}`,
            name: `${a.name} Competency Standard`,
            weight: Number(a.weight) || 50,
            competentDescriptor: 'Meets competency benchmark with verified practical and theoretical evidence.',
            notYetCompetentDescriptor: 'Gaps identified; performance criteria not yet satisfied.',
            levels: createDefaultRubricLevels(a.name)
          }
        ]
      })),
      enrolledStudents: createDefaultEnrolledStudents(program.code, uCode)
    };
  });

  return {
    id: `course-${program.code.toLowerCase()}`,
    title: program.title,
    code: program.code,
    frameworkCode: program.code.startsWith('BSB') ? 'ASQA' : 'TEQSA',
    aqfLevel: program.degreeLevel === 'Master' ? 9 : 7,
    tokenCost: 0,
    description: program.overview,
    facultyInfo: createDefaultFacultyInfo(
      program.code,
      program.title,
      program.degreeLevel === 'Master' ? 9 : 7
    ),
    admissionsProfile: createDefaultAdmissionsProfile(
      program.code,
      program.title,
      program.degreeLevel === 'Master' ? 9 : 7
    ),
    units: courseUnits
  };
}

/**
 * Returns the list of all selectable qualifications for the student course info hub
 */
export function getAllSelectableCourses(): { code: string; title: string; level: string; unitsCount: number }[] {
  const defaultEntry = {
    code: DEFAULT_COURSE.code,
    title: DEFAULT_COURSE.title,
    level: `AQF Level ${DEFAULT_COURSE.aqfLevel} (${DEFAULT_COURSE.frameworkCode})`,
    unitsCount: DEFAULT_COURSE.units.length
  };

  const catalogEntries = COURSES_DATA.map((c) => ({
    code: c.code,
    title: c.title,
    level: `${c.degreeLevel} (AQF ${c.degreeLevel === 'Master' ? 'Level 9' : 'Level 7'})`,
    unitsCount: c.coreUnits.length
  }));

  return [defaultEntry, ...catalogEntries];
}
