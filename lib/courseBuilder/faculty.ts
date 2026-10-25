/**
 * Faculty Information data models, contracts, and helpers for Tertiary & RTO Programs.
 * Covers governing Academic Faculty, School/Department, Executive Dean, Course Coordinator,
 * teaching faculty members / trainers & assessors, ASQA/TEQSA compliance credentials,
 * industry accreditations, and academic consultation channels.
 */

export interface FacultyStaffMember {
  id: string;
  name: string;
  role: string; // e.g. "Lead Trainer & Assessor", "Associate Professor", "Senior Industry Fellow"
  qualifications: string; // e.g. "PhD (Ergonomics), MAppSc, Cert IV TAE40122, COHSPr"
  industryExperience: string; // e.g. "15+ years in high-risk industrial compliance and statutory audit"
  email: string;
  officeLocation?: string;
  consultationHours?: string;
}

export interface CourseFacultyInfo {
  facultyName: string; // Governing Faculty Name
  schoolDepartment: string; // School or Department offering the course
  deanName?: string; // Executive Dean / Head of Faculty
  deanTitle?: string; // e.g. "Executive Dean of Faculty"
  courseCoordinatorName: string; // Program Director / Course Coordinator
  courseCoordinatorTitle: string; // Title & academic appointment
  courseCoordinatorEmail: string; // Primary academic enquiry email
  courseCoordinatorPhone?: string; // Contact phone / extension
  facultyOfficeLocation?: string; // Physical campus building & room
  facultyEmail?: string; // Central faculty enquiries inbox
  accreditations: string[]; // Industry and professional board accreditations
  staffMembers: FacultyStaffMember[]; // Teaching faculty, instructors & assessors
}

/**
 * Standard Australian and international academic faculties
 */
export const DEFAULT_FACULTIES = [
  'Faculty of Business, Technology & Vocational Safety',
  'Faculty of Engineering & Computer Science',
  'Faculty of Health, Science & Community Services',
  'Faculty of Law, Governance & Compliance',
  'Faculty of Design, Architecture & Built Environment',
  'School of Vocational Education & Applied Training (TAFE/VET)'
];

/**
 * Creates default faculty information tailored to course code, qualification title and AQF level.
 */
export function createDefaultFacultyInfo(
  courseCode: string = 'BSB41419',
  title: string = 'Certificate IV in Work Health and Safety',
  aqfLevel: number = 4
): CourseFacultyInfo {
  const isHigherEd = aqfLevel >= 7;

  if (isHigherEd) {
    return {
      facultyName: 'Faculty of Engineering & Computer Science',
      schoolDepartment: 'School of Software Systems & Applied AI',
      deanName: 'Prof. Alistair Finch, PhD, FTSE, FIEAust',
      deanTitle: 'Executive Dean of Faculty',
      courseCoordinatorName: 'A/Prof. Elena Rostova',
      courseCoordinatorTitle: 'Program Director & Head of Artificial Intelligence',
      courseCoordinatorEmail: 'e.rostova@super-rto.edu.au',
      courseCoordinatorPhone: '+61 2 9514 1800',
      facultyOfficeLocation: 'Sydney Broadway Campus, Building 11, Level 6',
      facultyEmail: 'engineering.admissions@super-rto.edu.au',
      accreditations: [
        'Australian Computer Society (ACS) - Professional Level',
        'Engineers Australia (Washington Accord)',
        'Tertiary Education Quality and Standards Agency (TEQSA)'
      ],
      staffMembers: [
        {
          id: 'staff-1',
          name: 'A/Prof. Elena Rostova',
          role: 'Program Director & Associate Professor in Computer Science',
          qualifications: 'PhD (Machine Learning, UNSW), MSc, BEng (Hons I)',
          industryExperience: 'Former Senior AI Research Scientist at Google DeepMind & CSIRO Data61; 14+ years research leadership.',
          email: 'e.rostova@super-rto.edu.au',
          officeLocation: 'Building 11, Room 614',
          consultationHours: 'Wednesdays 2:00 PM – 4:00 PM (AEST) or via Zoom'
        },
        {
          id: 'staff-2',
          name: 'Dr. David K. Thorne',
          role: 'Senior Lecturer in Cloud Architectures & Systems Security',
          qualifications: 'PhD (Distributed Systems, ANU), CISSP, AWS Certified Solutions Architect',
          industryExperience: 'Principal Infrastructure Architect for Australian Government defense projects; 18+ years cloud engineering.',
          email: 'd.thorne@super-rto.edu.au',
          officeLocation: 'Building 11, Room 620',
          consultationHours: 'Thursdays 10:00 AM – 12:00 PM (AEST)'
        }
      ]
    };
  }

  // Vocational / RTO default (e.g. Cert IV in WHS)
  return {
    facultyName: 'Faculty of Business, Technology & Vocational Safety',
    schoolDepartment: 'School of Work Health & Safety Compliance',
    deanName: 'Dr. Gregory Hayes, EdD, MBA, MAICD',
    deanTitle: 'Executive Director of Academic & Vocational Studies',
    courseCoordinatorName: 'Dr. Marcus Sterling',
    courseCoordinatorTitle: 'Course Coordinator & Lead Safety Auditor',
    courseCoordinatorEmail: 'm.sterling@super-rto.edu.au',
    courseCoordinatorPhone: '+61 2 9514 2040',
    facultyOfficeLocation: 'Sydney Broadway Campus, Building 1, Level 5, Room 512',
    facultyEmail: 'whs.faculty@super-rto.edu.au',
    accreditations: [
      'Australian Skills Quality Authority (ASQA) Standards for RTOs',
      'Australian Institute of Health & Safety (AIHS) Endorsed',
      'Safe Work Australia National Model Harmonisation Compliant'
    ],
    staffMembers: [
      {
        id: 'staff-1',
        name: 'Dr. Marcus Sterling',
        role: 'Course Coordinator & Lead Trainer & Assessor',
        qualifications: 'PhD (Ergonomics, USyd), Cert IV TAE40122, Lead Statutory Safety Auditor, COHSPr',
        industryExperience: '20+ years leading statutory safety compliance audits across Australian mining, civil construction and transport logistics.',
        email: 'm.sterling@super-rto.edu.au',
        officeLocation: 'Building 1, Room 512 (Broadway Campus)',
        consultationHours: 'Tuesdays & Thursdays 1:00 PM – 3:00 PM (AEST) or online appointment'
      },
      {
        id: 'staff-2',
        name: 'Sarah Chen, MAppSc',
        role: 'Senior Industry Fellow & Workplace Safety Practitioner',
        qualifications: 'MAppSc (Occupational Health), BSafeSc, Dip WHS, Cert IV TAE40116/TAE40122',
        industryExperience: 'Former Senior SafeWork NSW Inspector and Risk Director at Multiplex Australasia; certified incident investigator.',
        email: 's.chen@super-rto.edu.au',
        officeLocation: 'Building 1, Room 518',
        consultationHours: 'Mondays & Fridays 10:00 AM – 12:00 PM (AEST)'
      }
    ]
  };
}

/**
 * Creates a new blank faculty staff member.
 */
export function createFacultyStaffMember(
  name: string = 'New Academic Educator',
  role: string = 'Trainer & Assessor'
): FacultyStaffMember {
  return {
    id: `staff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    role,
    qualifications: 'Cert IV TAE40122, Relevant Industry Qualifications',
    industryExperience: 'Demonstrated current industry currency and compliance with Standards for RTOs / TEQSA guidelines.',
    email: 'academic.staff@super-rto.edu.au',
    officeLocation: 'Main Campus Academic Wing',
    consultationHours: 'By appointment via Student Portal'
  };
}

/**
 * Adds a new staff member to faculty info.
 */
export function addStaffMember(
  facultyInfo: CourseFacultyInfo,
  newStaff: FacultyStaffMember
): CourseFacultyInfo {
  return {
    ...facultyInfo,
    staffMembers: [...facultyInfo.staffMembers, newStaff]
  };
}

/**
 * Removes a staff member by ID.
 */
export function removeStaffMember(
  facultyInfo: CourseFacultyInfo,
  staffId: string
): CourseFacultyInfo {
  return {
    ...facultyInfo,
    staffMembers: facultyInfo.staffMembers.filter((s) => s.id !== staffId)
  };
}

/**
 * Updates a staff member's fields.
 */
export function updateStaffMember(
  facultyInfo: CourseFacultyInfo,
  staffId: string,
  updates: Partial<FacultyStaffMember>
): CourseFacultyInfo {
  return {
    ...facultyInfo,
    staffMembers: facultyInfo.staffMembers.map((s) =>
      s.id === staffId ? { ...s, ...updates } : s
    )
  };
}
