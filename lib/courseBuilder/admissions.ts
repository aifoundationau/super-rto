/**
 * Admissions, Delivery & Tuition Profile data contracts and calculations for Tertiary Programs.
 * Supports dynamic Domestic vs. International student switching, tuition models (CSP / Full Fee / CRICOS),
 * international entry ranking conversions (ATAR, GPA + SAT/ACT, A-Levels, UCAS, IB),
 * campus location commute filtering, duration study loads, admissions codes, and academic intake periods.
 */

export type StudentType = 'domestic' | 'international';

export type DeliveryMode = 'on_campus' | 'hybrid' | 'online';

export type DomesticFundingType = 'csp' | 'full_fee' | 'state_subsidised';

export interface CampusLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  isRegional: boolean;
  transitInfo?: string;
  address?: string;
}

export interface EntryThresholds {
  atar: number; // Australian Tertiary Admission Rank (e.g. 70.00)
  gpa: number; // US/International High School GPA on 4.0 scale (e.g. 3.0)
  sat: number; // SAT Composite Score (400-1600, e.g. 1150)
  act: number; // ACT Composite Score (1-36, e.g. 23)
  aLevels: string; // UK GCE A-Levels benchmark (e.g. 'BBC')
  ucasPoints: number; // UK UCAS Tariff points (e.g. 112)
  ibPoints: number; // International Baccalaureate Diploma score (e.g. 28)
  ieltsOverall?: number; // Minimum IELTS Academic overall band (e.g. 6.5)
  ieltsMinBand?: number; // Minimum IELTS sub-band (e.g. 6.0)
  toeflIbt?: number; // TOEFL iBT score (e.g. 79)
  pteAcademic?: number; // Pearson PTE Academic score (e.g. 58)
}

export interface AdmissionsCodes {
  uac?: string; // Universities Admissions Centre (NSW/ACT)
  vtac?: string; // Victorian Tertiary Admissions Centre (VIC)
  qtac?: string; // Queensland Tertiary Admissions Centre (QLD)
  directCode: string; // Central Direct Institution Code
  cricosCode?: string; // CRICOS Registered Course Code (for Overseas Visa 500)
}

export interface AcademicIntake {
  id: string;
  name: string;
  term: string;
  startMonth: string;
  year: number;
  isOpen: boolean;
  deadlineDomestic?: string;
  deadlineInternational?: string;
  orientationDate?: string;
}

export interface ProgramAdmissionsProfile {
  studentType: StudentType;
  campuses: CampusLocation[];
  selectedCampusId: string;
  deliveryModes: DeliveryMode[];
  selectedDeliveryMode: DeliveryMode;
  entryThresholds: EntryThresholds;
  durationYears: number; // Baseline full-time duration in years (e.g. 3.0)
  partTimeYears: number; // Part-time equivalency duration in years (e.g. 6.0)
  acceleratedYears?: number; // Optional accelerated trimester duration in years (e.g. 2.0)
  domesticFundingType: DomesticFundingType;
  annualTuitionDomestic: number; // Indicative annual tuition in AUD for domestic students
  annualTuitionInternational: number; // Indicative annual tuition in AUD for international students
  ssafAnnualFee: number; // Student Services and Amenities Fee in AUD (e.g. 351)
  admissionsCodes: AdmissionsCodes;
  intakes: AcademicIntake[];
  selectedIntakeId: string;
  visaNotesInternational?: string;
  pathwaysDomestic?: string;
}

/**
 * Default campuses across metropolitan and regional innovation hubs
 */
export const DEFAULT_CAMPUSES: CampusLocation[] = [
  {
    id: 'campus-syd-central',
    name: 'Sydney Central Campus (Broadway)',
    city: 'Sydney',
    state: 'NSW',
    isRegional: false,
    transitInfo: '3 min walk from Central Station & Light Rail; 12 bus routes',
    address: '15 Broadway, Ultimo NSW 2007'
  },
  {
    id: 'campus-melb-flagstaff',
    name: 'Melbourne Flagstaff Precinct',
    city: 'Melbourne',
    state: 'VIC',
    isRegional: false,
    transitInfo: 'Direct access to Flagstaff underground loop & La Trobe St trams',
    address: '380 William St, Melbourne VIC 3000'
  },
  {
    id: 'campus-bris-riverside',
    name: 'Brisbane Riverside Tech Hub',
    city: 'Brisbane',
    state: 'QLD',
    isRegional: false,
    transitInfo: '5 min walk from Eagle St Pier Ferry & Central Station',
    address: '123 Eagle St, Brisbane QLD 4000'
  },
  {
    id: 'campus-gold-coast',
    name: 'Gold Coast Innovation Campus (Regional)',
    city: 'Gold Coast',
    state: 'QLD',
    isRegional: true,
    transitInfo: 'G:link Tram Station on-campus; Regional migration incentive zone (Category 2)',
    address: 'Parklands Drive, Southport QLD 4215'
  },
  {
    id: 'campus-cloud-online',
    name: 'Super-RTO Cloud Campus (100% Online)',
    city: 'National Online',
    state: 'All States',
    isRegional: false,
    transitInfo: 'Zero commute; 24/7 high-speed global CDN & virtual labs access',
    address: 'Digital Cloud Network'
  }
];

/**
 * Standard Australian academic intakes
 */
export const DEFAULT_INTAKES: AcademicIntake[] = [
  {
    id: 'intake-sem1-2027',
    name: 'Semester 1 (Feb / March 2027)',
    term: 'Semester 1',
    startMonth: 'February',
    year: 2027,
    isOpen: true,
    deadlineDomestic: '2027-01-31',
    deadlineInternational: '2026-12-15',
    orientationDate: '2027-02-15'
  },
  {
    id: 'intake-sem2-2027',
    name: 'Semester 2 (July / August 2027)',
    term: 'Semester 2',
    startMonth: 'July',
    year: 2027,
    isOpen: true,
    deadlineDomestic: '2027-06-30',
    deadlineInternational: '2027-05-15',
    orientationDate: '2027-07-12'
  },
  {
    id: 'intake-term3-2027',
    name: 'Term 3 / Summer Trimester (Nov 2027)',
    term: 'Term 3',
    startMonth: 'November',
    year: 2027,
    isOpen: true,
    deadlineDomestic: '2027-10-15',
    deadlineInternational: '2027-09-01',
    orientationDate: '2027-11-01'
  }
];

/**
 * Converts an ATAR score into equivalent international ranking standards.
 */
export function convertAtarToInternationalScores(atar: number): {
  gpa: number;
  sat: number;
  act: number;
  aLevels: string;
  ucasPoints: number;
  ibPoints: number;
} {
  const clampedAtar = Math.max(30, Math.min(99.95, atar));

  if (clampedAtar >= 95) {
    return { gpa: 3.9, sat: 1480, act: 33, aLevels: 'A*A*A', ucasPoints: 168, ibPoints: 38 };
  }
  if (clampedAtar >= 90) {
    return { gpa: 3.7, sat: 1380, act: 30, aLevels: 'A*AA', ucasPoints: 152, ibPoints: 34 };
  }
  if (clampedAtar >= 85) {
    return { gpa: 3.5, sat: 1310, act: 28, aLevels: 'AAA', ucasPoints: 144, ibPoints: 32 };
  }
  if (clampedAtar >= 80) {
    return { gpa: 3.3, sat: 1250, act: 26, aLevels: 'ABB', ucasPoints: 128, ibPoints: 30 };
  }
  if (clampedAtar >= 75) {
    return { gpa: 3.1, sat: 1190, act: 24, aLevels: 'BBB', ucasPoints: 120, ibPoints: 29 };
  }
  if (clampedAtar >= 70) {
    return { gpa: 3.0, sat: 1150, act: 23, aLevels: 'BBC', ucasPoints: 112, ibPoints: 28 };
  }
  if (clampedAtar >= 65) {
    return { gpa: 2.8, sat: 1090, act: 21, aLevels: 'BCC', ucasPoints: 104, ibPoints: 26 };
  }
  return { gpa: 2.5, sat: 1020, act: 19, aLevels: 'CCC', ucasPoints: 96, ibPoints: 24 };
}

/**
 * Formats a numeric currency value as an Australian Dollar (AUD) string with commas.
 */
export function formatAud(amount: number): string {
  const integerAmount = Math.round(amount || 0);
  return `$${integerAmount.toLocaleString('en-AU')} AUD`;
}

/**
 * Calculates the active indicative annual tuition based on student type.
 */
export function calculateAnnualTuition(
  profile: ProgramAdmissionsProfile,
  studentType: StudentType = profile.studentType
): number {
  return studentType === 'domestic'
    ? Math.round(profile.annualTuitionDomestic || 0)
    : Math.round(profile.annualTuitionInternational || 0);
}

/**
 * Calculates the total estimated program cost over standard full-time duration.
 */
export function calculateTotalTuition(
  profile: ProgramAdmissionsProfile,
  studentType: StudentType = profile.studentType
): number {
  const annual = calculateAnnualTuition(profile, studentType);
  const years = profile.durationYears || 3;
  return Math.round(annual * years);
}

/**
 * Creates a fully populated default admissions profile tailored to degree / vocational level.
 */
export function createDefaultAdmissionsProfile(
  courseCode: string = 'BSB41419',
  title: string = 'Certificate IV in Work Health and Safety',
  aqfLevel: number = 4
): ProgramAdmissionsProfile {
  const isHigherEd = aqfLevel >= 7;
  const isDiploma = aqfLevel === 5 || aqfLevel === 6;

  const durationYears = isHigherEd ? 3.0 : isDiploma ? 1.5 : 1.0;
  const partTimeYears = durationYears * 2.0;
  const acceleratedYears = isHigherEd ? 2.0 : undefined;

  const defaultAtar = isHigherEd ? 72.0 : 60.0;
  const internationalScores = convertAtarToInternationalScores(defaultAtar);

  // Domestic CSP vs Domestic Full Fee vs International Tuition (AUD)
  const annualDomestic = isHigherEd ? 9850 : 4200;
  const annualInternational = isHigherEd ? 35600 : 14800;

  return {
    studentType: 'domestic',
    campuses: DEFAULT_CAMPUSES,
    selectedCampusId: DEFAULT_CAMPUSES[0].id,
    deliveryModes: ['on_campus', 'hybrid', 'online'],
    selectedDeliveryMode: 'hybrid',
    entryThresholds: {
      atar: defaultAtar,
      gpa: internationalScores.gpa,
      sat: internationalScores.sat,
      act: internationalScores.act,
      aLevels: internationalScores.aLevels,
      ucasPoints: internationalScores.ucasPoints,
      ibPoints: internationalScores.ibPoints,
      ieltsOverall: 6.5,
      ieltsMinBand: 6.0,
      toeflIbt: 79,
      pteAcademic: 58
    },
    durationYears,
    partTimeYears,
    acceleratedYears,
    domesticFundingType: isHigherEd ? 'csp' : 'state_subsidised',
    annualTuitionDomestic: annualDomestic,
    annualTuitionInternational: annualInternational,
    ssafAnnualFee: 351,
    admissionsCodes: {
      uac: isHigherEd ? '602050' : undefined,
      vtac: isHigherEd ? '3400212341' : undefined,
      qtac: isHigherEd ? '723412' : undefined,
      directCode: `${courseCode.toUpperCase()}-DIRECT`,
      cricosCode: isHigherEd ? '0101854K' : '098124M'
    },
    intakes: DEFAULT_INTAKES,
    selectedIntakeId: DEFAULT_INTAKES[0].id,
    visaNotesInternational:
      'CRICOS registered program. Under the Education Services for Overseas Students (ESOS) Act 2000, Student Visa (Subclass 500) holders must remain enrolled full-time (100% study load) onshore and may complete a maximum of 33% of units online.',
    pathwaysDomestic:
      'Recognised prior learning (RPL), VET articulating diplomas, and regional school leaver bonus point schemes (EAS up to 5 points) apply for domestic admissions.'
  };
}
