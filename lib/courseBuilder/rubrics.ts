export interface RubricLevel {
  level: number;
  label: string;
  descriptor: string;
}

export interface AssessmentCriterion {
  id: string;
  name: string;
  weight: number;
  competentDescriptor?: string;
  notYetCompetentDescriptor?: string;
  levels: [RubricLevel, RubricLevel, RubricLevel, RubricLevel, RubricLevel];
}

export interface CourseAssessment {
  id: string;
  type: 'formative' | 'summative';
  title: string;
  description: string;
  criteria: AssessmentCriterion[];
}

export const DEFAULT_RUBRIC_LEVEL_NAMES: [string, string, string, string, string] = [
  'Level 1 - Not Yet Competent (NYC)',
  'Level 2 - Developing / Threshold',
  'Level 3 - Competent (C) / Proficient',
  'Level 4 - Advanced / Accomplished',
  'Level 5 - Exemplary / Mastered'
];

export const DEFAULT_GENERIC_RUBRIC_DESCRIPTORS: [string, string, string, string, string] = [
  'How to think about this score (0–49%): Critical gap in competency. The learner has not yet demonstrated foundational understanding or minimum safety/procedural requirements. Fundamental concepts are missing, inaccurate, or non-compliant. Requires targeted re-instruction and formal re-assessment before competency can be awarded.',
  'How to think about this score (50–64%): Emerging capability under guidance. The learner grasps basic concepts and attempts routine tasks, but execution is inconsistent, surface-level, or relies on regular scaffolding and supervision. Does not yet demonstrate reliable independent delivery.',
  'How to think about this score (65–74%): Benchmark for competency. The learner consistently, accurately, and independently satisfies all core performance criteria. Follows standard operating procedures, solves routine workplace problems reliably, and complies with industry requirements without supervision.',
  'How to think about this score (75–84%): Exceeds baseline competency. The learner demonstrates analytical depth, effectively adapts procedures to non-routine variables or complex workplace situations, justifies decisions with clear evidence, and maintains high standards of quality assurance.',
  'How to think about this score (85–100%): Comprehensive mastery and leadership. The learner delivers exceptional, insightful work that synthesizes multi-dimensional factors, models industry best practices, anticipates systemic risks, and produces institutional-grade outcomes capable of guiding or mentoring peers.'
];

export function createDefaultRubricLevels(
  _criterionName?: string
): [RubricLevel, RubricLevel, RubricLevel, RubricLevel, RubricLevel] {
  return [
    {
      level: 1,
      label: DEFAULT_RUBRIC_LEVEL_NAMES[0],
      descriptor: DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[0]
    },
    {
      level: 2,
      label: DEFAULT_RUBRIC_LEVEL_NAMES[1],
      descriptor: DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[1]
    },
    {
      level: 3,
      label: DEFAULT_RUBRIC_LEVEL_NAMES[2],
      descriptor: DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[2]
    },
    {
      level: 4,
      label: DEFAULT_RUBRIC_LEVEL_NAMES[3],
      descriptor: DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[3]
    },
    {
      level: 5,
      label: DEFAULT_RUBRIC_LEVEL_NAMES[4],
      descriptor: DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[4]
    }
  ];
}

export function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

export const CSV_RUBRIC_HEADER =
  'AssessmentType,AssessmentTitle,AssessmentDescription,CriterionName,Weight,Level1_NYC,Level2_Developing,Level3_Competent,Level4_Advanced,Level5_Exemplary';

export function generateRubricsTemplateCsv(): string {
  const esc = (val: string) => `"${val.replace(/"/g, '""')}"`;
  return [
    CSV_RUBRIC_HEADER,
    `formative,"Formative Knowledge Check & Practice Activity","Continuous formative assessment to reinforce key concepts and provide developmental feedback.","Foundational Principles & Knowledge",50,${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[0])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[1])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[2])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[3])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[4])}`,
    `formative,"Formative Knowledge Check & Practice Activity","Continuous formative assessment to reinforce key concepts and provide developmental feedback.","Applied Problem Solving & Reflection",50,${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[0])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[1])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[2])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[3])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[4])}`,
    `summative,"Summative Practical Assessment & Portfolio","Formal summative assessment to assess practical competency and evidence of skills against performance standards.","Core Competency Execution & Evidence",50,${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[0])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[1])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[2])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[3])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[4])}`,
    `summative,"Summative Practical Assessment & Portfolio","Formal summative assessment to assess practical competency and evidence of skills against performance standards.","Analysis, Evaluation & Quality Assurance",50,${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[0])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[1])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[2])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[3])},${esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[4])}`
  ].join('\n') + '\n';
}

export function parseRubricsCsv(csvText: string): CourseAssessment[] {
  if (!csvText || !csvText.trim()) return [];

  const rawLines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (rawLines.length < 2) return [];

  const headers = parseCsvLine(rawLines[0]).map((h) => h.toLowerCase().replace(/[\s_-]/g, ''));
  const findColIndex = (keywords: string[], fallback: number): number => {
    for (let i = 0; i < headers.length; i++) {
      if (keywords.some((k) => headers[i].includes(k))) return i;
    }
    return fallback;
  };

  const typeCol = findColIndex(['type', 'kind'], 0);
  const titleCol = findColIndex(['title', 'assessmenttitle', 'assessmentname'], 1);
  const descCol = findColIndex(['desc', 'instruction', 'summary'], 2);
  const critCol = findColIndex(['crit', 'criterion', 'criteria', 'performancecriteria'], 3);
  const weightCol = findColIndex(['weight', 'percentage', 'mark'], 4);
  const lvl1Col = findColIndex(['level1', 'nyc', 'notyetcompetent', 'novice'], 5);
  const lvl2Col = findColIndex(['level2', 'developing', 'threshold'], 6);
  const lvl3Col = findColIndex(['level3', 'competent', 'proficient'], 7);
  const lvl4Col = findColIndex(['level4', 'advanced', 'accomplished'], 8);
  const lvl5Col = findColIndex(['level5', 'exemplary', 'mastered'], 9);

  const importedAssessments: CourseAssessment[] = [];
  const titleToAssIndex = new Map<string, number>();

  for (let i = 1; i < rawLines.length; i++) {
    const cols = parseCsvLine(rawLines[i]);
    if (cols.length === 0 || !cols.some((c) => c.length > 0)) continue;

    const rawType = (cols[typeCol] || 'summative').toLowerCase().trim();
    const type: 'formative' | 'summative' = rawType.includes('form') ? 'formative' : 'summative';
    const title = cols[titleCol]?.trim() || `${type === 'formative' ? 'Formative' : 'Summative'} Assessment`;
    const description = cols[descCol]?.trim() || '';
    const critName = cols[critCol]?.trim() || `Criterion ${i}`;
    const weight = parseInt(cols[weightCol]?.replace(/[^\d]/g, '') || '50', 10) || 50;

    const defaultLevels = createDefaultRubricLevels(critName);
    const lvl1Text = cols[lvl1Col]?.trim() || defaultLevels[0].descriptor;
    const lvl2Text = cols[lvl2Col]?.trim() || defaultLevels[1].descriptor;
    const lvl3Text = cols[lvl3Col]?.trim() || defaultLevels[2].descriptor;
    const lvl4Text = cols[lvl4Col]?.trim() || defaultLevels[3].descriptor;
    const lvl5Text = cols[lvl5Col]?.trim() || defaultLevels[4].descriptor;

    const criterion: AssessmentCriterion = {
      id: `crit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: critName,
      weight,
      competentDescriptor: lvl3Text,
      notYetCompetentDescriptor: lvl1Text,
      levels: [
        { level: 1, label: DEFAULT_RUBRIC_LEVEL_NAMES[0], descriptor: lvl1Text },
        { level: 2, label: DEFAULT_RUBRIC_LEVEL_NAMES[1], descriptor: lvl2Text },
        { level: 3, label: DEFAULT_RUBRIC_LEVEL_NAMES[2], descriptor: lvl3Text },
        { level: 4, label: DEFAULT_RUBRIC_LEVEL_NAMES[3], descriptor: lvl4Text },
        { level: 5, label: DEFAULT_RUBRIC_LEVEL_NAMES[4], descriptor: lvl5Text }
      ]
    };

    const key = `${type}:::${title}`;
    if (titleToAssIndex.has(key)) {
      const idx = titleToAssIndex.get(key)!;
      importedAssessments[idx].criteria.push(criterion);
      if (description && !importedAssessments[idx].description) {
        importedAssessments[idx].description = description;
      }
    } else {
      const newAss: CourseAssessment = {
        id: `ass-${type}-${Date.now()}-${importedAssessments.length + 1}`,
        type,
        title,
        description,
        criteria: [criterion]
      };
      titleToAssIndex.set(key, importedAssessments.length);
      importedAssessments.push(newAss);
    }
  }

  return importedAssessments;
}

export function exportAssessmentsToCsv(assessments: CourseAssessment[]): string {
  const rows: string[] = [CSV_RUBRIC_HEADER];
  (assessments || []).forEach((ass) => {
    (ass.criteria || []).forEach((c) => {
      const lvls = c.levels || createDefaultRubricLevels(c.name);
      const escape = (val: string | number | undefined) => `"${String(val || '').replace(/"/g, '""')}"`;
      rows.push(
        [
          escape(ass.type),
          escape(ass.title),
          escape(ass.description),
          escape(c.name),
          escape(c.weight),
          escape(lvls[0]?.descriptor || c.notYetCompetentDescriptor || ''),
          escape(lvls[1]?.descriptor || ''),
          escape(lvls[2]?.descriptor || c.competentDescriptor || ''),
          escape(lvls[3]?.descriptor || ''),
          escape(lvls[4]?.descriptor || '')
        ].join(',')
      );
    });
  });
  return rows.join('\n');
}
