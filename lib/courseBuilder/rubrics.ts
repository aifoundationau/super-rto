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

export function createDefaultRubricLevels(
  criterionName: string
): [RubricLevel, RubricLevel, RubricLevel, RubricLevel, RubricLevel] {
  return [
    {
      level: 1,
      label: DEFAULT_RUBRIC_LEVEL_NAMES[0],
      descriptor: `Unable to demonstrate foundational knowledge or practical competency for ${criterionName}; key regulatory requirements and critical standards omitted.`
    },
    {
      level: 2,
      label: DEFAULT_RUBRIC_LEVEL_NAMES[1],
      descriptor: `Demonstrates partial understanding of ${criterionName}; identifies surface components but lacks systematic rigor or complete compliance.`
    },
    {
      level: 3,
      label: DEFAULT_RUBRIC_LEVEL_NAMES[2],
      descriptor: `Consistently meets statutory competency benchmark for ${criterionName}; applies standard methodology accurately with verified evidence.`
    },
    {
      level: 4,
      label: DEFAULT_RUBRIC_LEVEL_NAMES[3],
      descriptor: `Demonstrates thorough command of ${criterionName}; analyzes complex workplace variables and produces comprehensive, defensible solutions.`
    },
    {
      level: 5,
      label: DEFAULT_RUBRIC_LEVEL_NAMES[4],
      descriptor: `Exemplary mastery of ${criterionName}; innovatively synthesizes industry best practices, mentors peers, and presents board-ready documentation.`
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
  return [
    CSV_RUBRIC_HEADER,
    'formative,"Diagnostic WHS Quiz & Consultation Check","Weekly formative check-in on workplace health & safety procedures.","Hazard Identification & Reporting",50,"Unable to identify basic workplace hazards; omits statutory compliance provisions.","Identifies obvious physical hazards only; incomplete statutory references.","Accurately identifies all workplace hazards and cites relevant WHS Act and Regulation provisions.","Identifies compound and systemic risks; articulates cross-departmental liability.","Demonstrates forensic workplace safety analysis and models predictive hazard controls."',
    'formative,"Diagnostic WHS Quiz & Consultation Check","Weekly formative check-in on workplace health & safety procedures.","Consultative Feedback & Safety Protocol",50,"Does not participate in consultative discussions or fails to record worker safety concerns.","Participates passively; records feedback with significant gaps in consultative protocol.","Actively facilitates consultative safety checks and accurately logs worker inputs according to WHS consultation procedures.","Constructively guides peer safety evaluations; resolves differing risk ratings.","Exemplifies institutional safety leadership; mentors colleagues into proactive policies."',
    'summative,"Workplace Hazard Identification & Consultative Portfolio","Holistic workplace portfolio containing risk assessments and hierarchy of controls.","Risk Assessment & Control Hierarchy Implementation",50,"Fails to apply the hierarchy of control; suggests ineffective or non-compliant controls.","Applies lower-order administrative controls only without evaluating higher-order engineering solutions.","Systematically applies hierarchy of controls with viable, compliant risk mitigation controls.","Designs multi-tiered control strategies with contingency planning and monitoring mechanisms.","Develops institutional-grade risk management framework compliant with ISO 31000 & WHS regulations."',
    'summative,"Workplace Hazard Identification & Consultative Portfolio","Holistic workplace portfolio containing risk assessments and hierarchy of controls.","Continuous Improvement & Incident Reporting",50,"Fails to produce structured incident report; omits corrective action timelines.","Recommendations are generic and lack implementation timelines, review milestones, or resource allocations.","Delivers clear, professional executive report with measurable control milestones and review dates.","Produces polished executive briefing with cost-benefit analysis and strategic change-management timelines.","Publishes board-ready institutional report integrating continuous audit schedules and statutory sign-offs."'
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
