/**
 * Super-RTO Multi-Jurisdiction Compliance & Accreditation Registry
 * 
 * Default Frameworks:
 * - ASQA (Australian Skills Quality Authority - Vocational Education & Training / RTO Standards)
 * - TEQSA (Tertiary Education Quality and Standards Agency - Higher Education Standards)
 * 
 * Additional Global Options:
 * - NZQA (New Zealand Qualifications Authority)
 * - UK QAA (UK Quality Assurance Agency for Higher Education)
 * - UK Ofsted (Office for Standards in Education)
 * - US CHEA / Regional (Higher Education Accreditation)
 * - AACSB (International Business Accreditation)
 * - Singapore SSG / CPE (SkillsFuture Singapore & Committee for Private Education)
 * - International Open Framework
 */

export interface ComplianceFramework {
  code: string;
  name: string;
  shortName: string;
  jurisdiction: string;
  flagEmoji: string;
  educationLevel: 'Vocational (VET)' | 'Higher Education' | 'Dual Sector' | 'Professional';
  regulatoryBody: string;
  website: string;
  description: string;
  defaultGrading: 'COMPETENCY_C_NYC' | 'FOUR_TIER_RUBRIC' | 'PERCENTAGE_GPA';
  standardLevels: string[];
  mandatoryRequirements: string[];
}

export const COMPLIANCE_FRAMEWORKS: Record<string, ComplianceFramework> = {
  ASQA: {
    code: 'ASQA',
    name: 'Australian Skills Quality Authority (Standards for RTOs)',
    shortName: 'ASQA (VET)',
    jurisdiction: 'Australia',
    flagEmoji: '🇦🇺',
    educationLevel: 'Vocational (VET)',
    regulatoryBody: 'Australian Skills Quality Authority',
    website: 'https://www.asqa.gov.au',
    description: 'Statutory national regulator for Australia’s vocational education and training sector. Enforces Standards for Registered Training Organisations (RTOs) and Training Packages.',
    defaultGrading: 'COMPETENCY_C_NYC',
    standardLevels: ['Certificate I', 'Certificate II', 'Certificate III', 'Certificate IV', 'Diploma', 'Advanced Diploma'],
    mandatoryRequirements: [
      'Units of Competency mapping with Elements & Performance Criteria',
      'Assessor competency & industry currency matrices',
      'Competency Outcome tracking (Competent / Not Yet Competent - C/NYC)',
      'AVETMISS NAT file statistical compliance data reporting',
      'Unique Student Identifier (USI) validation prior to credential issuance',
      'Continuous improvement and industry engagement documentation'
    ]
  },

  TEQSA: {
    code: 'TEQSA',
    name: 'Tertiary Education Quality and Standards Agency (Threshold Standards 2021)',
    shortName: 'TEQSA (Higher Ed)',
    jurisdiction: 'Australia',
    flagEmoji: '🇦🇺',
    educationLevel: 'Higher Education',
    regulatoryBody: 'Tertiary Education Quality and Standards Agency',
    website: 'https://www.teqsa.gov.au',
    description: 'Australia’s independent national quality assurance and regulatory agency for higher education (Higher Education Standards Framework 2021).',
    defaultGrading: 'FOUR_TIER_RUBRIC',
    standardLevels: ['AQF 7: Bachelor Degree', 'AQF 8: Graduate Certificate / Honours', 'AQF 9: Masters Degree', 'AQF 10: Doctoral Degree'],
    mandatoryRequirements: [
      'Course learning outcomes aligned with Australian Qualifications Framework (AQF Levels 7-9)',
      'Assurance of Learning & academic integrity protocols (contract cheating defense & Gen AI policy)',
      'Criterion-referenced 4-tier grading rubrics (Novice, Competent, Proficient, Advanced)',
      'Student wellbeing and academic support scaffolding embedded in lesson designs',
      'Research-informed curriculum and peer-reviewed academic resource packs'
    ]
  },

  NZQA: {
    code: 'NZQA',
    name: 'New Zealand Qualifications Authority (NZQF)',
    shortName: 'NZQA',
    jurisdiction: 'New Zealand',
    flagEmoji: '🇳🇿',
    educationLevel: 'Dual Sector',
    regulatoryBody: 'New Zealand Qualifications Authority',
    website: 'https://www.nzqa.govt.nz',
    description: 'Ensures New Zealand qualifications are valued internationally, managing the New Zealand Qualifications Framework (NZQF Levels 1-10) and pastoral care codes.',
    defaultGrading: 'COMPETENCY_C_NYC',
    standardLevels: ['NZQF Levels 1-6 (Certificates/Diplomas)', 'NZQF Level 7 (Bachelor)', 'NZQF Levels 8-10 (Postgraduate)'],
    mandatoryRequirements: [
      'Māori and Pacific learner success integration',
      'Code of Pastoral Care compliance',
      'External evaluation and review (EER) evidence documentation'
    ]
  },

  UK_QAA: {
    code: 'UK_QAA',
    name: 'UK Quality Assurance Agency for Higher Education (FHEQ)',
    shortName: 'UK QAA',
    jurisdiction: 'United Kingdom',
    flagEmoji: '🇬🇧',
    educationLevel: 'Higher Education',
    regulatoryBody: 'Quality Assurance Agency for Higher Education',
    website: 'https://www.qaa.ac.uk',
    description: 'Monitors standards in UK universities and colleges via the Framework for Higher Education Qualifications (FHEQ Levels 4-8).',
    defaultGrading: 'PERCENTAGE_GPA',
    standardLevels: ['FHEQ 4 (CertHE)', 'FHEQ 5 (DipHE/Fd)', 'FHEQ 6 (Bachelor with Hons)', 'FHEQ 7 (Master)'],
    mandatoryRequirements: [
      'Subject Benchmark Statements alignment',
      'External examiner oversight system',
      'Credit accumulator and transfer scheme (CATS) weighting'
    ]
  },

  UK_OFSTED: {
    code: 'UK_OFSTED',
    name: 'UK Office for Standards in Education (Further Education & Skills)',
    shortName: 'UK Ofsted',
    jurisdiction: 'United Kingdom',
    flagEmoji: '🇬🇧',
    educationLevel: 'Vocational (VET)',
    regulatoryBody: 'Ofsted / ESFA',
    website: 'https://www.gov.uk/government/organisations/ofsted',
    description: 'Inspects services providing skills and education for learners in further education, apprenticeships, and vocational training.',
    defaultGrading: 'COMPETENCY_C_NYC',
    standardLevels: ['Level 1-3 Apprenticeships', 'T-Levels', 'Higher Technical Qualifications (HTQ)'],
    mandatoryRequirements: [
      'Intent, Implementation, and Impact (Three I’s) curriculum documentation',
      'Safeguarding and Prevent duty compliance',
      'Off-the-job training hour logs for apprenticeships'
    ]
  },

  US_CHEA: {
    code: 'US_CHEA',
    name: 'US Higher Education Accreditation (CHEA & Regional Commissions)',
    shortName: 'US Regional / CHEA',
    jurisdiction: 'United States',
    flagEmoji: '🇺🇸',
    educationLevel: 'Higher Education',
    regulatoryBody: 'Council for Higher Education Accreditation & US Dept of Education',
    website: 'https://www.chea.org',
    description: 'Coordinates regional institutional accreditation bodies (e.g. SACSCOC, WASC, HLC, MSCHE) for US degree granting colleges and universities.',
    defaultGrading: 'PERCENTAGE_GPA',
    standardLevels: ['Associate Degree', 'Bachelor Degree', 'Graduate / Master', 'Doctorate'],
    mandatoryRequirements: [
      'Credit hour calculations (Carnegie Unit: 1 credit = 45-50 total student effort hours)',
      'Substantive change compliance notifications',
      'Faculty credential verification and course syllabus disclosures'
    ]
  },

  AACSB: {
    code: 'AACSB',
    name: 'AACSB International (Business Accreditation Standards)',
    shortName: 'AACSB Business',
    jurisdiction: 'Global',
    flagEmoji: '🌐',
    educationLevel: 'Professional',
    regulatoryBody: 'Association to Advance Collegiate Schools of Business',
    website: 'https://www.aacsb.edu',
    description: 'Gold-standard global collegiate accreditation for business administration and accounting schools worldwide.',
    defaultGrading: 'FOUR_TIER_RUBRIC',
    standardLevels: ['Undergraduate Business', 'MBA / Specialized Masters', 'Doctoral Business Programs'],
    mandatoryRequirements: [
      'Assurance of Learning (AoL) continuous closing-the-loop cycles',
      'Faculty qualifications (Scholarly Academic vs Practice Academic)',
      'Societal impact integration within business curriculum'
    ]
  },

  SG_SSG: {
    code: 'SG_SSG',
    name: 'SkillsFuture Singapore & Committee for Private Education (CPE)',
    shortName: 'Singapore SSG / CPE',
    jurisdiction: 'Singapore',
    flagEmoji: '🇸🇬',
    educationLevel: 'Dual Sector',
    regulatoryBody: 'SkillsFuture Singapore (SSG)',
    website: 'https://www.skillsfuture.gov.sg',
    description: 'Statutory board supervising lifelong learning, the Singapore Skills Framework (SFw), and Private Education Institution (PEI) EduTrust regulations.',
    defaultGrading: 'COMPETENCY_C_NYC',
    standardLevels: ['WSQ Level 1-6', 'Private Diploma', 'External Degree Programs'],
    mandatoryRequirements: [
      'Skills Framework for the Information Age (SFw) competency mapping',
      'EduTrust Fee Protection Scheme (FPS) adherence',
      'Trainer and curriculum developer approval records'
    ]
  },

  INTERNATIONAL: {
    code: 'INTERNATIONAL',
    name: 'International Open Curriculum Standard',
    shortName: 'International',
    jurisdiction: 'Global',
    flagEmoji: '🌍',
    educationLevel: 'Dual Sector',
    regulatoryBody: 'Open Institutional Academic Board',
    website: '',
    description: 'Flexible modular framework suited for global online learning, corporate training academies, and micro-credential providers.',
    defaultGrading: 'FOUR_TIER_RUBRIC',
    standardLevels: ['Level 1 Introductory', 'Level 2 Intermediate', 'Level 3 Advanced', 'Level 4 Executive'],
    mandatoryRequirements: [
      'Modular objective breakdown with estimated learning hours',
      'Self-paced formative quizzes and summative evaluation',
      'Verifiable digital completion credentials'
    ]
  }
};

export const DEFAULT_COMPLIANCE_CODES = ['ASQA', 'TEQSA'] as const;

export function getFramework(code: string): ComplianceFramework {
  return COMPLIANCE_FRAMEWORKS[code] || COMPLIANCE_FRAMEWORKS.ASQA;
}

export function listAllFrameworks(): ComplianceFramework[] {
  return Object.values(COMPLIANCE_FRAMEWORKS);
}
