import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// 1. Roles & RBAC Tests
import {
  SYSTEM_ROLES,
  ROLE_DEFINITIONS,
  normalizeRole,
  isDirector,
  isSuperAdmin,
  PRIMARY_SUPERADMIN_EMAIL,
  SECONDARY_SUPERADMIN_EMAIL,
  SUPERADMIN_SHARED_WALLET_DOC,
  isProjectOwnerEmail
} from '../lib/auth/roles.ts';

import {
  getSuperadminSharedWallet,
  getUserTokenBalance,
  creditTokenWallet,
  spendTokens,
  PRIMARY_SUPERADMIN_UID,
  SECONDARY_SUPERADMIN_UID
} from '../lib/firebase/admin.ts';

import {
  DEFAULT_ROLE_PERMISSIONS,
  roleHasPermission,
  ADMIN_PANEL_TAB_ACCESS,
  isTabAccessibleForRole
} from '../lib/auth/permissions.ts';

import {
  STAFF_ROLE_DEFINITIONS,
  DEFAULT_STAFF_DIRECTORY,
  createBlankStaffProfile,
  formatStaffAsFacultyMember,
  getTeachingStaff
} from '../lib/staff/directory.ts';

// 2. Compliance Frameworks Tests
import {
  COMPLIANCE_FRAMEWORKS,
  DEFAULT_COMPLIANCE_CODES,
  getFramework,
  listAllFrameworks
} from '../lib/compliance/frameworks.ts';

import {
  computeDualPanelPrices,
  toStrictIntegerTokens,
  calculateFiatForTokens,
  getHoverPricingTooltip,
  DEFAULT_GLOBAL_TOKEN_CONFIG
} from '../lib/tokens/pricing.ts';

import {
  TOKEN_PURCHASE_PRESETS,
  TOKEN_SYSTEM_EXPLANATION,
  INITIAL_COMMUNITY_TOKEN_FUND,
  getAccumulatedFundState,
  addContributionToFund,
  isUserInAustralia,
  getLocalizedTokenPricing,
  computeTokenPackageTotal
} from '../lib/tokens/fund.ts';

// 4. Assessments & 5-Level Rubrics Tests
import {
  DEFAULT_RUBRIC_LEVEL_NAMES,
  DEFAULT_GENERIC_RUBRIC_DESCRIPTORS,
  FORMATIVE_RUBRIC_DESCRIPTORS,
  SUMMATIVE_RUBRIC_DESCRIPTORS,
  createDefaultRubricLevels,
  createFormativeRubricLevels,
  createSummativeRubricLevels,
  parseCsvLine,
  generateRubricsTemplateCsv,
  parseRubricsCsv,
  exportAssessmentsToCsv,
  sortAssessments,
  reorderAssessment
} from '../lib/courseBuilder/rubrics.ts';

// 5. Units of Competency Lifecycle & Deletion Tests
import {
  createDefaultUnit,
  deleteUnitFromCourse,
  createDefaultPerformanceCriteria,
  createPerformanceCriterion,
  getUniqueElementsFromUnit,
  addElementToUnit,
  addCriterionToElement
} from '../lib/courseBuilder/units.ts';

// 5b. Course CSV Architecture Tests
import {
  generateShortCourseTemplateCsv,
  generateSemesterCourseTemplateCsv,
  parseCourseCsv,
  exportCourseToCsv,
  COURSE_CSV_HEADERS
} from '../lib/courseBuilder/courseCsv.ts';

// 6. Program Admissions & Tertiary Profile Tests
import {
  DEFAULT_CAMPUSES,
  DEFAULT_INTAKES,
  createDefaultAdmissionsProfile,
  convertAtarToInternationalScores,
  formatAud,
  calculateAnnualTuition,
  calculateTotalTuition
} from '../lib/courseBuilder/admissions.ts';

// 7. Faculty Information Tests
import {
  DEFAULT_FACULTIES,
  createDefaultFacultyInfo,
  createFacultyStaffMember,
  addStaffMember,
  removeStaffMember,
  updateStaffMember
} from '../lib/courseBuilder/faculty.ts';

// 8. Multilingual RAG & Vector Store Tests
import {
  generate768Embedding,
  getVectorStoreStats,
  searchVectorChunks,
  deleteDocumentFromStore
} from '../lib/rag/vectorStore.ts';
import { ingestDocument } from '../lib/rag/ragPipeline.ts';

// 9. Unit Syllabi Bank Synchronization Tests
import {
  mapCourseUnitToUnitDetail,
  getStoredUnitSyllabi,
  saveUnitToSyllabiBank,
  syncAllUnitsToSyllabiBank,
  UNIT_SYLLABI_STORAGE_KEY
} from '../lib/courseBuilder/unitBank.ts';

// 10. Student Course Information Hub Tests
import {
  DEFAULT_COURSE,
  getStudentCourseData,
  buildCourseDataFromCatalog,
  getAllSelectableCourses
} from '../lib/courseBuilder/defaultCourse.ts';
import { COURSES_DATA } from '../data/courses.ts';

// 11. Student Unit Enrolment Tests
import {
  KNOWN_STUDENT_CANDIDATES,
  STUDENT_ENROLMENT_CSV_HEADERS,
  generateStudentEnrolmentTemplateCsv,
  parseStudentEnrolmentCsv,
  exportStudentsToCsv,
  createDefaultEnrolledStudents,
  addStudentToUnit,
  removeStudentFromUnit
} from '../lib/courseBuilder/studentEnrolment.ts';

describe('Super-RTO Unified Platform Test Suite', () => {

  describe('Unified RBAC & Director Role Verification', () => {
    it('should include the new Director role in SYSTEM_ROLES', () => {
      assert.ok(SYSTEM_ROLES.includes('director'), 'SYSTEM_ROLES must include director');
      assert.strictEqual(ROLE_DEFINITIONS.director.category, 'Executive');
      assert.strictEqual(ROLE_DEFINITIONS.director.hierarchyLevel, 95);
    });

    it('should correctly normalize director aliases', () => {
      assert.strictEqual(normalizeRole('director'), 'director');
      assert.strictEqual(normalizeRole('Dean'), 'director');
      assert.strictEqual(normalizeRole('Principal'), 'director');
      assert.strictEqual(normalizeRole('executive_director'), 'director');
    });

    it('should verify isDirector returns true for director and superadmin', () => {
      assert.strictEqual(isDirector('director'), true);
      assert.strictEqual(isDirector('superadmin'), true);
      assert.strictEqual(isDirector('student'), false);
      assert.strictEqual(isDirector('supporter'), false);
    });

    it('should confirm Director has institutional permission defaults', () => {
      assert.ok(roleHasPermission('director', 'institution.defaults.manage'));
      assert.ok(roleHasPermission('director', 'tokens.rates.director'));
      assert.ok(roleHasPermission('director', 'compliance.framework.manage'));
      assert.ok(roleHasPermission('director', 'courses.create'));
      assert.ok(roleHasPermission('director', 'courses.publish'));
      // Student cannot configure defaults
      assert.strictEqual(roleHasPermission('student', 'tokens.rates.director'), false);
    });
  });

  describe('Compliance Frameworks & Regulatory Standards Verification', () => {
    it('should have ASQA and TEQSA as defaults', () => {
      assert.deepStrictEqual(DEFAULT_COMPLIANCE_CODES, ['ASQA', 'TEQSA']);
      const asqa = getFramework('ASQA');
      assert.strictEqual(asqa.regulatoryBody, 'Australian Skills Quality Authority');
      assert.strictEqual(asqa.defaultGrading, 'COMPETENCY_C_NYC');

      const teqsa = getFramework('TEQSA');
      assert.strictEqual(teqsa.regulatoryBody, 'Tertiary Education Quality and Standards Agency');
      assert.strictEqual(teqsa.defaultGrading, 'FOUR_TIER_RUBRIC');
    });

    it('should support global regulatory framework profiles', () => {
      const frameworks = listAllFrameworks();
      const codes = frameworks.map(f => f.code);
      assert.ok(codes.includes('NZQA'), 'Must include NZQA');
      assert.ok(codes.includes('UK_QAA'), 'Must include UK QAA');
      assert.ok(codes.includes('UK_OFSTED'), 'Must include UK Ofsted');
      assert.ok(codes.includes('US_CHEA'), 'Must include US Regional/CHEA');
      assert.ok(codes.includes('AACSB'), 'Must include AACSB');
      assert.ok(codes.includes('SG_SSG'), 'Must include Singapore SSG');
    });
  });

  describe('Dual-Panel Token & Multi-Currency Engine Verification', () => {
    it('should compute bidirectional USD -> AUD conversion accurately', () => {
      // 1 USD at rate 1.54 -> 1.54 AUD
      const { tokenPriceUsd, tokenPriceAud } = computeDualPanelPrices('USD', 1.00, 1.54);
      assert.strictEqual(tokenPriceUsd, 1.00);
      assert.strictEqual(tokenPriceAud, 1.54);
    });

    it('should compute bidirectional AUD -> USD conversion accurately', () => {
      // 1.54 AUD at rate 1.54 -> 1.00 USD
      const { tokenPriceUsd, tokenPriceAud } = computeDualPanelPrices('AUD', 1.54, 1.54);
      assert.strictEqual(tokenPriceAud, 1.54);
      assert.strictEqual(tokenPriceUsd, 1.00);
    });

    it('should strictly enforce whole integers on tokens (no decimals)', () => {
      assert.strictEqual(toStrictIntegerTokens(10.7), 11);
      assert.strictEqual(toStrictIntegerTokens(10.2), 10);
      assert.strictEqual(toStrictIntegerTokens(0.4), 0);
      assert.strictEqual(toStrictIntegerTokens(25.5), 26);
    });

    it('should calculate fiat pricing for whole tokens', () => {
      const config = {
        ...DEFAULT_GLOBAL_TOKEN_CONFIG,
        tokenPriceUsd: 1.00,
        tokenPriceAud: 1.54
      };
      assert.strictEqual(calculateFiatForTokens(10, 'USD', config), 10.00);
      assert.strictEqual(calculateFiatForTokens(10, 'AUD', config), 15.40);
    });

    it('should format hover tooltip displaying AUD strictly to Australian visitors', () => {
      const config = {
        ...DEFAULT_GLOBAL_TOKEN_CONFIG,
        isUsdEnabled: true,
        isAudEnabled: true,
        tokenPriceUsd: 1.00,
        tokenPriceAud: 1.54
      };

      // In Australia: shows USD / AUD
      const inAus = getHoverPricingTooltip(10, config, true);
      assert.strictEqual(inAus, '$10.00 USD / $15.40 AUD');

      // International visitor: AUD is gated, shows USD only
      const international = getHoverPricingTooltip(10, config, false);
      assert.strictEqual(international, '$10.00 USD');
    });
  });

  describe('Assessments & 5-Level Rubrics Verification (Formative & Summative)', () => {
    it('should define all 5 standardized AQF performance levels', () => {
      assert.strictEqual(DEFAULT_RUBRIC_LEVEL_NAMES.length, 5);
      assert.strictEqual(DEFAULT_RUBRIC_LEVEL_NAMES[0], 'Level 1 - Not Yet Competent (NYC)');
      assert.strictEqual(DEFAULT_RUBRIC_LEVEL_NAMES[1], 'Level 2 - Developing / Threshold');
      assert.strictEqual(DEFAULT_RUBRIC_LEVEL_NAMES[2], 'Level 3 - Competent (C) / Proficient');
      assert.strictEqual(DEFAULT_RUBRIC_LEVEL_NAMES[3], 'Level 4 - Advanced / Accomplished');
      assert.strictEqual(DEFAULT_RUBRIC_LEVEL_NAMES[4], 'Level 5 - Exemplary / Mastered');
    });

    it('should generate 5 fully populated generic rubric levels explaining how to think about the score', () => {
      const levels = createDefaultRubricLevels('Performance Criterion');
      assert.strictEqual(levels.length, 5);
      levels.forEach((lvl, idx) => {
        assert.strictEqual(lvl.level, idx + 1);
        assert.strictEqual(lvl.label, DEFAULT_RUBRIC_LEVEL_NAMES[idx]);
        assert.strictEqual(lvl.descriptor, DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[idx]);
        assert.ok(lvl.descriptor.length > 50, `Level ${idx + 1} must have a detailed score explanation`);
        assert.ok(lvl.descriptor.startsWith('How to think about this score'), `Level ${idx + 1} must explain how to think about the score`);
      });
    });

    it('should generate 5 specialized formative rubric levels explaining diagnostic and developmental benchmarks', () => {
      const levels = createFormativeRubricLevels('Diagnostic Exam Knowledge');
      assert.strictEqual(levels.length, 5);
      levels.forEach((lvl, idx) => {
        assert.strictEqual(lvl.level, idx + 1);
        assert.strictEqual(lvl.descriptor, FORMATIVE_RUBRIC_DESCRIPTORS[idx]);
        assert.ok(lvl.descriptor.includes('formative score'), 'Must explicitly explain formative score thinking');
      });
    });

    it('should generate 5 specialized summative rubric levels explaining competency and verification benchmarks', () => {
      const levels = createSummativeRubricLevels('Summative Exam Performance');
      assert.strictEqual(levels.length, 5);
      levels.forEach((lvl, idx) => {
        assert.strictEqual(lvl.level, idx + 1);
        assert.strictEqual(lvl.descriptor, SUMMATIVE_RUBRIC_DESCRIPTORS[idx]);
        assert.ok(lvl.descriptor.includes('summative score'), 'Must explicitly explain summative score thinking');
      });
    });

    it('should correctly parse CSV lines with quoted commas', () => {
      const line = 'formative,"Diagnostic WHS Quiz, Form 1","Weekly check-in, WHS",50';
      const parsed = parseCsvLine(line);
      assert.strictEqual(parsed.length, 4);
      assert.strictEqual(parsed[0], 'formative');
      assert.strictEqual(parsed[1], 'Diagnostic WHS Quiz, Form 1');
      assert.strictEqual(parsed[2], 'Weekly check-in, WHS');
      assert.strictEqual(parsed[3], '50');
    });

    it('should generate and parse rubrics template with Formative and Summative assessments', () => {
      const template = generateRubricsTemplateCsv();
      assert.ok(template.includes('AssessmentType,AssessmentTitle'));
      assert.ok(template.includes('formative'));
      assert.ok(template.includes('summative'));

      const parsed = parseRubricsCsv(template);
      assert.strictEqual(parsed.length, 2);

      const formative = parsed.find((a) => a.type === 'formative');
      assert.ok(formative, 'Must contain formative assessment');
      assert.strictEqual(formative.criteria.length, 2);
      assert.strictEqual(formative.criteria[0].levels.length, 5);

      const summative = parsed.find((a) => a.type === 'summative');
      assert.ok(summative, 'Must contain summative assessment');
      assert.strictEqual(summative.criteria.length, 2);
      assert.strictEqual(summative.criteria[0].levels.length, 5);
    });

    it('should export assessments back to CSV matching 5-level format', () => {
      const template = generateRubricsTemplateCsv();
      const parsed = parseRubricsCsv(template);
      const exported = exportAssessmentsToCsv(parsed);

      assert.ok(exported.startsWith('AssessmentType,AssessmentTitle'));
      const reParsed = parseRubricsCsv(exported);
      assert.strictEqual(reParsed.length, 2);
      assert.strictEqual(reParsed[0].criteria.length, 2);
      assert.strictEqual(reParsed[0].criteria[0].levels.length, 5);
    });
  });

  describe('Unit of Competency Lifecycle & Deletion Verification', () => {
    it('should create default unit with standard 40 nominal hours and empty lessons/assessments', () => {
      const unit = createDefaultUnit('BSBWHS411', 'Implement WHS policies');
      assert.strictEqual(unit.unitCode, 'BSBWHS411');
      assert.strictEqual(unit.unitTitle, 'Implement WHS policies');
      assert.strictEqual(unit.nominalHours, 40);
      assert.deepStrictEqual(unit.lessons, []);
      assert.deepStrictEqual(unit.assessments, []);
      assert.ok(unit.id.startsWith('unit-'));
    });

    it('should safely delete a unit from the middle of the units list', () => {
      const u1 = createDefaultUnit('UNIT1', 'First Unit');
      const u2 = createDefaultUnit('UNIT2', 'Second Unit');
      const u3 = createDefaultUnit('UNIT3', 'Third Unit');
      const initialUnits = [u1, u2, u3];

      const { updatedUnits, newActiveIndex, deletedUnit } = deleteUnitFromCourse(initialUnits, 1, 1);
      assert.strictEqual(deletedUnit?.unitCode, 'UNIT2');
      assert.strictEqual(updatedUnits.length, 2);
      assert.strictEqual(updatedUnits[0].unitCode, 'UNIT1');
      assert.strictEqual(updatedUnits[1].unitCode, 'UNIT3');
      assert.strictEqual(newActiveIndex, 1);
    });

    it('should shift active index down when deleting a unit before the active unit', () => {
      const u1 = createDefaultUnit('UNIT1', 'First Unit');
      const u2 = createDefaultUnit('UNIT2', 'Second Unit');
      const u3 = createDefaultUnit('UNIT3', 'Third Unit');
      const initialUnits = [u1, u2, u3];

      // Current active index is 2 (UNIT3), we delete index 0 (UNIT1)
      const { updatedUnits, newActiveIndex, deletedUnit } = deleteUnitFromCourse(initialUnits, 0, 2);
      assert.strictEqual(deletedUnit?.unitCode, 'UNIT1');
      assert.strictEqual(updatedUnits.length, 2);
      assert.strictEqual(updatedUnits[1].unitCode, 'UNIT3');
      assert.strictEqual(newActiveIndex, 1); // UNIT3 is now at index 1
    });

    it('should clamp active index when deleting the last unit in the list', () => {
      const u1 = createDefaultUnit('UNIT1', 'First Unit');
      const u2 = createDefaultUnit('UNIT2', 'Second Unit');
      const initialUnits = [u1, u2];

      // Current active index is 1 (UNIT2), we delete index 1 (UNIT2)
      const { updatedUnits, newActiveIndex, deletedUnit } = deleteUnitFromCourse(initialUnits, 1, 1);
      assert.strictEqual(deletedUnit?.unitCode, 'UNIT2');
      assert.strictEqual(updatedUnits.length, 1);
      assert.strictEqual(updatedUnits[0].unitCode, 'UNIT1');
      assert.strictEqual(newActiveIndex, 0); // Focus moves to UNIT1
    });

    it('should create a clean fallback unit if all units are deleted so builder never breaks', () => {
      const u1 = createDefaultUnit('UNIT1', 'Sole Unit');
      const initialUnits = [u1];

      const { updatedUnits, newActiveIndex, deletedUnit } = deleteUnitFromCourse(initialUnits, 0, 0);
      assert.strictEqual(deletedUnit?.unitCode, 'UNIT1');
      assert.strictEqual(updatedUnits.length, 1);
      assert.strictEqual(updatedUnits[0].unitCode, 'UNIT101');
      assert.strictEqual(updatedUnits[0].unitTitle, 'New Unit of Competency');
      assert.strictEqual(newActiveIndex, 0);
    });

    it('should return unchanged units if target index is out of bounds', () => {
      const u1 = createDefaultUnit('UNIT1', 'First Unit');
      const initialUnits = [u1];

      const { updatedUnits, newActiveIndex, deletedUnit } = deleteUnitFromCourse(initialUnits, 5, 0);
      assert.strictEqual(deletedUnit, null);
      assert.strictEqual(updatedUnits.length, 1);
      assert.strictEqual(newActiveIndex, 0);
    });
  });

  describe('Performance Criteria & Hierarchy Verification', () => {
    it('should create default performance criteria with Australian competency standard items', () => {
      const criteria = createDefaultPerformanceCriteria();
      assert.strictEqual(criteria.length, 3);
      assert.strictEqual(criteria[0].code, '1.1');
      assert.strictEqual(criteria[1].code, '1.2');
      assert.strictEqual(criteria[2].code, '2.1');
      assert.ok(criteria[0].title.includes('statutory WHS obligations'));
      assert.ok(criteria[0].element.includes('Element 1'));
    });

    it('should create custom performance criterion with valid identifier and fields', () => {
      const pc = createPerformanceCriterion(
        'Element 3: Emergency response',
        '3.1',
        'Initiate workplace evacuation drill',
        'Coordinate warden network according to AS 3745.'
      );
      assert.ok(pc.id.startsWith('pc-'));
      assert.strictEqual(pc.code, '3.1');
      assert.strictEqual(pc.element, 'Element 3: Emergency response');
      assert.strictEqual(pc.title, 'Initiate workplace evacuation drill');
      assert.strictEqual(pc.description, 'Coordinate warden network according to AS 3745.');
    });

    it('should initialize new units of competency with default performance criteria', () => {
      const unit = createDefaultUnit('BSBWHS513', 'Lead WHS risk management');
      assert.strictEqual(unit.unitCode, 'BSBWHS513');
      assert.ok(Array.isArray(unit.performanceCriteria));
      assert.strictEqual(unit.performanceCriteria.length, 3);
      assert.strictEqual(unit.performanceCriteria[0].code, '1.1');
    });

    it('should verify in UnifiedCourseBuilder that Performance Criteria card is positioned strictly ABOVE Assessment', () => {
      const filePath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      const performanceCriteriaIndex = content.indexOf('data-testid="performance-criteria-card"');
      const assessmentSectionIndex = content.indexOf('data-testid="toggle-assessments-section-btn"');

      assert.ok(performanceCriteriaIndex > 0, 'Performance criteria card must exist in UnifiedCourseBuilder');
      assert.ok(assessmentSectionIndex > 0, 'Assessment section must exist in UnifiedCourseBuilder');
      assert.ok(
        performanceCriteriaIndex < assessmentSectionIndex,
        'Performance criteria card MUST be positioned above Assessment section'
      );
    });

    it('should verify confirm delete safety button is present for performance criteria', () => {
      const filePath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      assert.ok(content.includes('confirm-delete-pc-'));
      assert.ok(content.includes('cancel-delete-pc-'));
      assert.ok(content.includes('Confirm Delete'));
      assert.ok(content.includes('data-testid="performance-criteria-card"'));
      assert.ok(content.includes('data-agent-id="course-builder-toggle-performance-criteria-btn"'));
    });

    it('should verify that Performance Criteria is not in assessments and assessments strictly use Scoring Rubrics', () => {
      const filePath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      // The assessment section begins after toggle-assessments-section-btn and ends at Units of Competency
      const assStartIndex = content.indexOf('data-testid="toggle-assessments-section-btn"');
      const assEndIndex = content.indexOf('Units of Competency');
      const assessmentContent = content.slice(assStartIndex, assEndIndex);

      assert.ok(
        !assessmentContent.toLowerCase().includes('performance criteria'),
        'Assessment section must NOT contain Performance Criteria'
      );
      assert.ok(
        !assessmentContent.includes('PC 1'),
        'Assessment rubric items must not use PC prefix'
      );
      assert.ok(
        assessmentContent.includes('5-Level AQF Scoring Rubrics'),
        'Assessment section must strictly use Scoring Rubrics'
      );
    });
  });

  describe('Assessment Ordering & Sorting Verification (Exam Number & Date)', () => {
    const mockAssessments = [
      {
        id: 'ass-3',
        type: 'summative',
        title: 'Summative Practical Exam #3',
        description: 'Final exam',
        examNumber: 3,
        dueDate: '2026-12-15',
        criteria: []
      },
      {
        id: 'ass-1',
        type: 'formative',
        title: 'Formative Knowledge Check #1',
        description: 'First check',
        examNumber: 1,
        dueDate: '2026-11-01',
        criteria: []
      },
      {
        id: 'ass-2',
        type: 'summative',
        title: 'Summative Midterm Exam #2',
        description: 'Midterm exam',
        examNumber: 2,
        dueDate: '2026-11-20',
        criteria: []
      }
    ];

    it('should sort assessments in ascending order by exam number (1 -> N)', () => {
      const sorted = sortAssessments(mockAssessments, 'exam_number_asc');
      assert.strictEqual(sorted.length, 3);
      assert.strictEqual(sorted[0].examNumber, 1);
      assert.strictEqual(sorted[1].examNumber, 2);
      assert.strictEqual(sorted[2].examNumber, 3);
      assert.strictEqual(sorted[0].id, 'ass-1');
      assert.strictEqual(sorted[2].id, 'ass-3');
    });

    it('should sort assessments in descending order by exam number (N -> 1)', () => {
      const sorted = sortAssessments(mockAssessments, 'exam_number_desc');
      assert.strictEqual(sorted.length, 3);
      assert.strictEqual(sorted[0].examNumber, 3);
      assert.strictEqual(sorted[1].examNumber, 2);
      assert.strictEqual(sorted[2].examNumber, 1);
      assert.strictEqual(sorted[0].id, 'ass-3');
      assert.strictEqual(sorted[2].id, 'ass-1');
    });

    it('should sort assessments by scheduled due date in ascending order (Earliest First)', () => {
      const mixed = [
        { id: 'b', title: 'Exam B', dueDate: '2026-12-01', criteria: [] },
        { id: 'c', title: 'Exam C', dueDate: '2026-10-15', criteria: [] },
        { id: 'a', title: 'Exam A', dueDate: '2026-11-15', criteria: [] }
      ];
      const sorted = sortAssessments(mixed, 'date_asc');
      assert.strictEqual(sorted[0].id, 'c');
      assert.strictEqual(sorted[1].id, 'a');
      assert.strictEqual(sorted[2].id, 'b');
    });

    it('should sort assessments by scheduled due date in descending order (Latest First)', () => {
      const mixed = [
        { id: 'b', title: 'Exam B', dueDate: '2026-12-01', criteria: [] },
        { id: 'c', title: 'Exam C', dueDate: '2026-10-15', criteria: [] },
        { id: 'a', title: 'Exam A', dueDate: '2026-11-15', criteria: [] }
      ];
      const sorted = sortAssessments(mixed, 'date_desc');
      assert.strictEqual(sorted[0].id, 'b');
      assert.strictEqual(sorted[1].id, 'a');
      assert.strictEqual(sorted[2].id, 'c');
    });

    it('should fallback to extracting exam number from title when examNumber property is absent', () => {
      const noProps = [
        { id: 'p2', title: 'Practical Assessment No. 2', criteria: [] },
        { id: 'p1', title: 'Knowledge Exam 1', criteria: [] }
      ];
      const sorted = sortAssessments(noProps, 'exam_number_asc');
      assert.strictEqual(sorted[0].id, 'p1');
      assert.strictEqual(sorted[1].id, 'p2');
    });

    it('should reorder assessments manually with boundary bounds protection', () => {
      const reordered = reorderAssessment(mockAssessments, 0, 2);
      assert.strictEqual(reordered[0].id, 'ass-1');
      assert.strictEqual(reordered[1].id, 'ass-2');
      assert.strictEqual(reordered[2].id, 'ass-3');

      // Out of bounds check returns shallow copy unmodified
      const unchanged = reorderAssessment(mockAssessments, -1, 5);
      assert.strictEqual(unchanged[0].id, mockAssessments[0].id);
    });

    it('should verify UnifiedCourseBuilder has sort selector, exam number inputs, date picker, and move controls', () => {
      const filePath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      assert.ok(content.includes('data-testid="assessment-sort-select"'), 'Must have assessment sort select');
      assert.ok(content.includes('value="exam_number_asc"'), 'Must support exam_number_asc');
      assert.ok(content.includes('value="exam_number_desc"'), 'Must support exam_number_desc');
      assert.ok(content.includes('value="date_asc"'), 'Must support date_asc');
      assert.ok(content.includes('value="date_desc"'), 'Must support date_desc');
      assert.ok(content.includes('value="manual"'), 'Must support manual');

      assert.ok(content.includes('assessment-exam-number-'), 'Must have exam number inputs');
      assert.ok(content.includes('assessment-due-date-'), 'Must have due date inputs');
      assert.ok(content.includes('move-up-assessment-'), 'Must have move up controls');
      assert.ok(content.includes('move-down-assessment-'), 'Must have move down controls');
    });
  });

  describe('Course Metadata & Description Box Verification', () => {
    it('should verify Course Details & Configuration includes title, code, token cost, and course description box', () => {
      const filePath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      assert.ok(
        content.includes('Course Details & Configuration'),
        'Must contain Course Details & Configuration header'
      );
      assert.ok(
        content.includes('data-testid="course-title-input"'),
        'Must have course-title-input'
      );
      assert.ok(
        content.includes('data-testid="course-code-input"'),
        'Must have course-code-input'
      );
      assert.ok(
        content.includes('data-testid="course-token-cost-input"'),
        'Must have course-token-cost-input'
      );
      assert.ok(
        content.includes('data-testid="course-description-input"'),
        'Must have course-description-input'
      );
      assert.ok(
        content.includes('Course Description'),
        'Must display Course Description label'
      );
    });
  });

  describe('Program Admissions, Delivery & Tuition Profile Panel Verification', () => {
    it('should create default admissions profile with all 7 core pillars populated', () => {
      const profile = createDefaultAdmissionsProfile('CS100', 'Bachelor of Computer Science', 7);

      assert.strictEqual(profile.studentType, 'domestic');
      assert.strictEqual(profile.durationYears, 3.0);
      assert.strictEqual(profile.partTimeYears, 6.0);
      assert.strictEqual(profile.acceleratedYears, 2.0);
      assert.strictEqual(profile.domesticFundingType, 'csp');
      assert.strictEqual(profile.annualTuitionDomestic, 9850);
      assert.strictEqual(profile.annualTuitionInternational, 35600);
      assert.strictEqual(profile.entryThresholds.atar, 72.0);
      assert.ok(profile.campuses.length >= 3);
      assert.ok(profile.intakes.length >= 2);
      assert.ok(profile.admissionsCodes.cricosCode);
      assert.ok(profile.admissionsCodes.directCode);
    });

    it('should convert ATAR entry thresholds into international ranking standards', () => {
      // Benchmark at ATAR 70
      const scores70 = convertAtarToInternationalScores(70);
      assert.strictEqual(scores70.gpa, 3.0);
      assert.strictEqual(scores70.sat, 1150);
      assert.strictEqual(scores70.act, 23);
      assert.strictEqual(scores70.aLevels, 'BBC');
      assert.strictEqual(scores70.ucasPoints, 112);
      assert.strictEqual(scores70.ibPoints, 28);

      // High academic benchmark at ATAR 90
      const scores90 = convertAtarToInternationalScores(90);
      assert.strictEqual(scores90.gpa, 3.7);
      assert.strictEqual(scores90.sat, 1380);
      assert.strictEqual(scores90.act, 30);
      assert.strictEqual(scores90.aLevels, 'A*AA');
      assert.strictEqual(scores90.ucasPoints, 152);
      assert.strictEqual(scores90.ibPoints, 34);
    });

    it('should compute indicative annual and total tuition dynamically for domestic vs international', () => {
      const profile = createDefaultAdmissionsProfile('HE-BCS', 'Bachelor of Computer Science', 7);

      const annualDom = calculateAnnualTuition(profile, 'domestic');
      const totalDom = calculateTotalTuition(profile, 'domestic');
      assert.strictEqual(annualDom, 9850);
      assert.strictEqual(totalDom, 9850 * 3); // 29,550 AUD

      const annualInt = calculateAnnualTuition(profile, 'international');
      const totalInt = calculateTotalTuition(profile, 'international');
      assert.strictEqual(annualInt, 35600);
      assert.strictEqual(totalInt, 35600 * 3); // 106,800 AUD

      assert.strictEqual(formatAud(annualDom), '$9,850 AUD');
      assert.strictEqual(formatAud(totalInt), '$106,800 AUD');
    });

    it('should verify ProgramAdmissionsPanel contains all 7 user-requested controls', () => {
      const panelPath = path.resolve('components/courseBuilder/ProgramAdmissionsPanel.tsx');
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // 1. Student Type Selector
      assert.ok(panelContent.includes('data-testid="student-type-domestic-btn"'), 'Must have domestic student button');
      assert.ok(panelContent.includes('data-testid="student-type-international-btn"'), 'Must have international student button');
      assert.ok(panelContent.includes('data-testid="select-domestic-mode-btn"'), 'Must have select domestic mode button');
      assert.ok(panelContent.includes('data-testid="select-international-mode-btn"'), 'Must have select international mode button');

      // 2. Campus & Delivery Mode (Location)
      assert.ok(panelContent.includes('data-testid="panel-campus-delivery"'), 'Must have Campus & Delivery Mode section');
      assert.ok(panelContent.includes('data-testid="campus-select"'), 'Must have campus selector');
      assert.ok(panelContent.includes('data-testid="delivery-mode-on-campus-btn"'), 'Must have on-campus button');
      assert.ok(panelContent.includes('data-testid="delivery-mode-hybrid-btn"'), 'Must have hybrid button');
      assert.ok(panelContent.includes('data-testid="delivery-mode-online-btn"'), 'Must have online button');

      // 3. Entry Threshold (ATAR, GPA + SAT/ACT, A-Levels, UCAS, IB)
      assert.ok(panelContent.includes('data-testid="panel-entry-threshold"'), 'Must have Entry Threshold section');
      assert.ok(panelContent.includes('data-testid="entry-threshold-atar-input"'), 'Must have ATAR input');
      assert.ok(panelContent.includes('GPA + SAT / ACT'), 'Must display GPA + SAT/ACT');
      assert.ok(panelContent.includes('GCE A-Levels'), 'Must display GCE A-Levels');
      assert.ok(panelContent.includes('UCAS Tariff'), 'Must display UCAS Tariff');
      assert.ok(panelContent.includes('IB Diploma'), 'Must display IB Diploma');

      // 4. Duration
      assert.ok(panelContent.includes('data-testid="panel-duration"'), 'Must have Program Duration section');
      assert.ok(panelContent.includes('data-testid="duration-years-input"'), 'Must have duration input');
      assert.ok(panelContent.includes('Part-Time Equivalent:'), 'Must show part-time equivalency');

      // 5. Indicative Fees & Funding Type
      assert.ok(panelContent.includes('data-testid="panel-fees-funding"'), 'Must have Fees & Funding section');
      assert.ok(panelContent.includes('data-testid="annual-tuition-input"'), 'Must have annual tuition input');
      assert.ok(panelContent.includes('Commonwealth Supported Place (CSP)'), 'Must support CSP');
      assert.ok(panelContent.includes('Total Estimated Program Fee:'), 'Must show total estimated fee');

      // 6. Admissions Code
      assert.ok(panelContent.includes('data-testid="panel-admissions-code"'), 'Must have Admissions Code section');
      assert.ok(panelContent.includes('data-testid="copy-direct-code-btn"'), 'Must have copy direct code button');
      assert.ok(panelContent.includes('data-testid="copy-cricos-code-btn"'), 'Must have copy CRICOS code button');

      // 7. Intake / Start Period
      assert.ok(panelContent.includes('data-testid="panel-intake-period"'), 'Must have Intake Period section');
      assert.ok(panelContent.includes('data-testid="intake-select"'), 'Must have intake select dropdown');
    });

    it('should verify UnifiedCourseBuilder embeds ProgramAdmissionsPanel in the layout', () => {
      const builderPath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const builderContent = fs.readFileSync(builderPath, 'utf8');

      assert.ok(
        builderContent.includes('<ProgramAdmissionsPanel'),
        'UnifiedCourseBuilder must embed ProgramAdmissionsPanel'
      );
      assert.ok(
        builderContent.includes('admissionsProfile: createDefaultAdmissionsProfile'),
        'UnifiedCourseBuilder must initialize admissionsProfile in DEFAULT_COURSE'
      );
    });
  });

  describe('Faculty & Academic Staff Information Verification', () => {
    it('should create default faculty info for VET course with Dean, Coordinator and Staff', () => {
      const faculty = createDefaultFacultyInfo('BSB41419', 'Certificate IV in WHS', 4);

      assert.strictEqual(faculty.facultyName, 'Faculty of Business, Technology & Vocational Safety');
      assert.strictEqual(faculty.schoolDepartment, 'School of Work Health & Safety Compliance');
      assert.ok(faculty.deanName.includes('Dr. Gregory Hayes'));
      assert.strictEqual(faculty.courseCoordinatorName, 'Dr. Marcus Sterling');
      assert.ok(faculty.staffMembers.length >= 2);
      assert.ok(faculty.accreditations.length >= 2);
      assert.ok(faculty.courseCoordinatorEmail.includes('@super-rto.edu.au'));
    });

    it('should create default faculty info for Higher Ed degree with ACS/Engineers Australia accreditations', () => {
      const faculty = createDefaultFacultyInfo('CS100', 'Bachelor of Computer Science', 7);

      assert.strictEqual(faculty.facultyName, 'Faculty of Engineering & Computer Science');
      assert.strictEqual(faculty.schoolDepartment, 'School of Software Systems & Applied AI');
      assert.ok(faculty.deanName.includes('Prof. Alistair Finch'));
      assert.strictEqual(faculty.courseCoordinatorName, 'A/Prof. Elena Rostova');
      assert.ok(faculty.accreditations.some((a) => a.includes('ACS')));
    });

    it('should support faculty staff member lifecycle: create, add, update, and remove', () => {
      const initial = createDefaultFacultyInfo('BSB41419', 'Certificate IV in WHS', 4);
      const originalCount = initial.staffMembers.length;

      // 1. Create and add
      const newStaff = createFacultyStaffMember('Dr. Liam O’Connor', 'Senior Lecturer in Ergonomics');
      const added = addStaffMember(initial, newStaff);
      assert.strictEqual(added.staffMembers.length, originalCount + 1);
      assert.strictEqual(added.staffMembers[added.staffMembers.length - 1].name, 'Dr. Liam O’Connor');

      // 2. Update
      const updated = updateStaffMember(added, newStaff.id, {
        qualifications: 'PhD, CPE, Cert IV TAE40122'
      });
      const targetStaff = updated.staffMembers.find((s) => s.id === newStaff.id);
      assert.strictEqual(targetStaff.qualifications, 'PhD, CPE, Cert IV TAE40122');

      // 3. Remove
      const removed = removeStaffMember(updated, newStaff.id);
      assert.strictEqual(removed.staffMembers.length, originalCount);
      assert.ok(!removed.staffMembers.some((s) => s.id === newStaff.id));
    });

    it('should verify FacultyInfoPanel contains all accessible controls and confirm delete buttons', () => {
      const panelPath = path.resolve('components/courseBuilder/FacultyInfoPanel.tsx');
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      assert.ok(panelContent.includes('data-testid="faculty-info-panel"'), 'Must have faculty-info-panel');
      assert.ok(panelContent.includes('data-testid="faculty-name-input"'), 'Must have faculty-name-input');
      assert.ok(panelContent.includes('data-testid="faculty-school-dept-input"'), 'Must have faculty-school-dept-input');
      assert.ok(panelContent.includes('data-testid="faculty-dean-name-input"'), 'Must have faculty-dean-name-input');
      assert.ok(panelContent.includes('data-testid="faculty-coordinator-name-input"'), 'Must have faculty-coordinator-name-input');
      assert.ok(panelContent.includes('data-testid="faculty-coordinator-email-input"'), 'Must have faculty-coordinator-email-input');
      assert.ok(panelContent.includes('data-testid="add-faculty-member-btn"'), 'Must have add-faculty-member-btn');
      assert.ok(panelContent.includes('confirm-delete-staff-'), 'Must have confirm delete staff button');
      assert.ok(panelContent.includes('cancel-delete-staff-'), 'Must have cancel delete staff button');
      assert.ok(panelContent.includes('Confirm Delete'), 'Must display Confirm Delete text');
    });

    it('should verify UnifiedCourseBuilder embeds FacultyInfoPanel and links governing faculty in metadata', () => {
      const builderPath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const builderContent = fs.readFileSync(builderPath, 'utf8');

      assert.ok(
        builderContent.includes('<FacultyInfoPanel'),
        'UnifiedCourseBuilder must embed FacultyInfoPanel'
      );
      assert.ok(
        builderContent.includes('data-testid="course-meta-faculty-input"'),
        'UnifiedCourseBuilder must have course-meta-faculty-input in Course Details'
      );
      assert.ok(
        builderContent.includes('facultyInfo: createDefaultFacultyInfo'),
        'UnifiedCourseBuilder must initialize facultyInfo in DEFAULT_COURSE'
      );
    });
  });

  // 12. Institutional Faculty Admin & Role-Specific Staff Directory Verification
  describe('Institutional Faculty Admin & Role-Specific Staff Directory Verification', () => {
    it('should verify expanded SYSTEM_ROLES and ROLE_DEFINITIONS include Vice President, CTO, Tech Admin, Admin, and Student Counsellor', () => {
      assert.ok(SYSTEM_ROLES.includes('vice_president'), 'Must include vice_president');
      assert.ok(SYSTEM_ROLES.includes('cto'), 'Must include cto');
      assert.ok(SYSTEM_ROLES.includes('tech_admin'), 'Must include tech_admin');
      assert.ok(SYSTEM_ROLES.includes('admin'), 'Must include admin');
      assert.ok(SYSTEM_ROLES.includes('student_counsellor'), 'Must include student_counsellor');

      assert.strictEqual(normalizeRole('VP'), 'vice_president');
      assert.strictEqual(normalizeRole('Chief_Technology_Officer'), 'cto');
      assert.strictEqual(normalizeRole('sysadmin'), 'tech_admin');
      assert.strictEqual(normalizeRole('student counsellor'), 'student_counsellor');
      assert.strictEqual(normalizeRole('admin'), 'admin');

      assert.strictEqual(ROLE_DEFINITIONS.vice_president.label, 'Vice President');
      assert.strictEqual(ROLE_DEFINITIONS.cto.label, 'CTO');
      assert.strictEqual(ROLE_DEFINITIONS.student_counsellor.label, 'Student Counsellor');
    });

    it('should verify default staff directory includes teaching, student support, executive, and tech profiles', () => {
      assert.ok(DEFAULT_STAFF_DIRECTORY.length >= 10, 'Must have at least 10 seeded staff profiles');

      const teaching = getTeachingStaff(DEFAULT_STAFF_DIRECTORY);
      assert.ok(teaching.length >= 4, 'Must have at least 4 teaching candidates');

      const counsellor = DEFAULT_STAFF_DIRECTORY.find((s) => s.role === 'student_counsellor');
      assert.ok(counsellor, 'Must have a registered student counsellor');
      assert.ok(counsellor.counsellingCredentials?.includes('PACFA'), 'Must have PACFA registration');
      assert.ok(counsellor.wwccNumber, 'Must have WWCC number');

      const cfo = DEFAULT_STAFF_DIRECTORY.find((s) => s.role === 'cfo');
      assert.ok(cfo, 'Must have CFO');
      assert.ok(cfo.accountingAccreditation?.includes('FCPA'), 'CFO must have FCPA');
      assert.ok(cfo.financialDelegationLimit, 'CFO must have financial delegation limit');

      const cto = DEFAULT_STAFF_DIRECTORY.find((s) => s.role === 'cto');
      assert.ok(cto, 'Must have CTO');
      assert.ok(cto.securityClearance?.includes('NV2'), 'CTO must have security clearance');
    });

    it('should generate role-specific schemas for student counsellor, cfo, cto, and trainer via createBlankStaffProfile', () => {
      const counsellor = createBlankStaffProfile('student_counsellor');
      assert.strictEqual(counsellor.role, 'student_counsellor');
      assert.ok(counsellor.counsellingCredentials, 'Must provide default counsellingCredentials');
      assert.ok(counsellor.wwccNumber, 'Must provide default wwccNumber');
      assert.ok(counsellor.confidentialBookingLink, 'Must provide default confidentialBookingLink');

      const cfo = createBlankStaffProfile('cfo');
      assert.strictEqual(cfo.role, 'cfo');
      assert.ok(cfo.accountingAccreditation, 'Must provide default accountingAccreditation');
      assert.ok(cfo.financialDelegationLimit, 'Must provide default financialDelegationLimit');

      const cto = createBlankStaffProfile('cto');
      assert.strictEqual(cto.role, 'cto');
      assert.ok(cto.securityClearance, 'Must provide default securityClearance');
      assert.strictEqual(cto.disasterRecoveryLead, true, 'CTO must be disaster recovery lead');

      const trainer = createBlankStaffProfile('trainer');
      assert.strictEqual(trainer.role, 'trainer');
      assert.ok(trainer.qualifications?.includes('TAE40122'), 'Trainer must have Cert IV TAE default');
      assert.ok(trainer.consultationHours, 'Trainer must have consultation hours');
    });

    it('should format staff profile into FacultyStaffMember to auto-populate information postcards', () => {
      const trainer = DEFAULT_STAFF_DIRECTORY.find((s) => s.fullName.includes('Marcus Sterling'));
      assert.ok(trainer, 'Marcus Sterling profile must exist');

      const postcard = formatStaffAsFacultyMember(trainer);
      assert.strictEqual(postcard.name, 'Dr. Marcus Sterling');
      assert.strictEqual(postcard.role, 'Lead Trainer & Safety Auditor');
      assert.ok(postcard.qualifications.includes('PhD (Ergonomics, USyd)'), 'Must auto-populate qualifications');
      assert.ok(postcard.industryExperience.includes('20+ years leading statutory safety compliance'), 'Must auto-populate industry currency');
      assert.strictEqual(postcard.email, 'm.sterling@super-rto.edu.au');
      assert.ok(postcard.officeLocation.includes('Building 1, Level 5, Room 512'), 'Must auto-populate office');
      assert.ok(postcard.consultationHours.includes('Tuesdays & Thursdays'), 'Must auto-populate consultation hours');
    });

    it('should verify FacultyStaffDirectoryView contains all 10 requested faculty fields and confirm delete safety', () => {
      const viewPath = path.resolve('components/admin/FacultyStaffDirectoryView.tsx');
      assert.ok(fs.existsSync(viewPath), 'FacultyStaffDirectoryView.tsx must exist');
      const content = fs.readFileSync(viewPath, 'utf8');

      // 10 user requested fields
      assert.ok(content.includes('data-testid="admin-faculty-name-input"'), 'Must have Faculty Name');
      assert.ok(content.includes('data-testid="admin-school-dept-input"'), 'Must have School or Department');
      assert.ok(content.includes('data-testid="admin-dean-name-input"'), 'Must have Executive Dean / Head of Faculty');
      assert.ok(content.includes('data-testid="admin-coordinator-name-input"'), 'Must have Coordinator Name');
      assert.ok(content.includes('data-testid="admin-appointment-title-input"'), 'Must have Appointment Title');
      assert.ok(content.includes('data-testid="admin-direct-email-input"'), 'Must have Direct Email');
      assert.ok(content.includes('data-testid="admin-contact-phone-input"'), 'Must have Contact Phone');
      assert.ok(content.includes('data-testid="admin-office-location-input"'), 'Must have Campus Office Location');
      assert.ok(content.includes('data-testid="admin-faculty-enquiries-email-input"'), 'Must have Faculty Enquiries Email');
      assert.ok(content.includes('data-testid="admin-new-accreditation-input"'), 'Must have Accreditations & Industry Endorsements');

      // Teaching faculty dropdown & postcards
      assert.ok(content.includes('data-testid="teaching-staff-dropdown-selector"'), 'Must have dropdown selector for teaching faculty');
      assert.ok(content.includes('confirm-delete-postcard-'), 'Must have confirm delete on postcards');
      assert.ok(content.includes('confirm-delete-staff-'), 'Must have confirm delete on staff members');
      assert.ok(content.includes('data-testid="staff-registration-modal"'), 'Must have role-adaptive staff registration modal');
    });

    it('should verify Teaching Faculty dropdown selector and information postcard auto-population in Course Builder', () => {
      const panelPath = path.resolve('components/courseBuilder/FacultyInfoPanel.tsx');
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      assert.ok(
        panelContent.includes('data-testid="course-builder-staff-dropdown"'),
        'Course Builder FacultyInfoPanel must have course-builder-staff-dropdown'
      );
      assert.ok(
        panelContent.includes('Information Postcard'),
        'FacultyInfoPanel must display Information Postcard'
      );
      assert.ok(
        panelContent.includes('formatStaffAsFacultyMember'),
        'FacultyInfoPanel must use formatStaffAsFacultyMember to auto-populate cards'
      );
    });

    it('should verify Course Builder staff search does not give names automatically and searches by first and last name', () => {
      const panelPath = path.resolve('components/courseBuilder/FacultyInfoPanel.tsx');
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // 1. Verify search input elements
      assert.ok(
        panelContent.includes('data-testid="course-builder-staff-search-input"'),
        'FacultyInfoPanel must have search input for staff'
      );
      assert.ok(
        panelContent.includes('placeholder="+ Search by name or last name..."'),
        'FacultyInfoPanel must have placeholder guiding name/last name search'
      );
      assert.ok(
        panelContent.includes('if (!q) return [];'),
        'FacultyInfoPanel must NOT return names when search query is empty'
      );

      // 2. Unit test the search filter algorithm
      const searchStaff = (staffList, query) => {
        const q = (query || '').trim().toLowerCase();
        if (!q) return [];
        const normalizedQ = q.replace(/['’]/g, '');

        return staffList.filter((cand) => {
          const full = cand.fullName.toLowerCase();
          const normalizedFull = full.replace(/['’]/g, '');
          if (full.includes(q) || normalizedFull.includes(normalizedQ)) return true;

          const cleanedName = full
            .replace(/^(dr\.|prof\.|a\/prof\.|associate professor|mr\.|ms\.|mrs\.)\s+/i, '')
            .replace(/,\s*(phd|mappsc|bsc|msc|beng|dip\s+whs|cohspr|cissp|fcpa|ca\s+anz).*$/i, '');

          const words = cleanedName.split(/\s+/).filter(Boolean);
          const wordMatch = words.some((word) => {
            const cleanWord = word.replace(/['’]/g, '');
            return cleanWord.startsWith(normalizedQ) || cleanWord.includes(normalizedQ);
          });
          if (wordMatch) return true;
          if (cand.appointmentTitle?.toLowerCase().includes(q)) return true;
          if (cand.department?.toLowerCase().includes(q)) return true;
          return false;
        });
      };

      // Empty query returns NO names
      assert.strictEqual(searchStaff(DEFAULT_STAFF_DIRECTORY, '').length, 0, 'Empty query must return 0 names');
      assert.strictEqual(searchStaff(DEFAULT_STAFF_DIRECTORY, '   ').length, 0, 'Whitespace query must return 0 names');

      // Search by first name
      const sarahResults = searchStaff(DEFAULT_STAFF_DIRECTORY, 'sarah');
      assert.ok(sarahResults.some((s) => s.fullName.includes('Sarah Chen')), 'Must find Sarah by first name');

      const marcusResults = searchStaff(DEFAULT_STAFF_DIRECTORY, 'marcus');
      assert.ok(marcusResults.some((s) => s.fullName.includes('Marcus Sterling')), 'Must find Marcus by first name');

      // Search by last name
      const chenResults = searchStaff(DEFAULT_STAFF_DIRECTORY, 'chen');
      assert.ok(chenResults.some((s) => s.fullName.includes('Sarah Chen')), 'Must find Chen by last name');

      const sterlingResults = searchStaff(DEFAULT_STAFF_DIRECTORY, 'sterling');
      assert.ok(sterlingResults.some((s) => s.fullName.includes('Marcus Sterling')), 'Must find Sterling by last name');

      const rostovaResults = searchStaff(DEFAULT_STAFF_DIRECTORY, 'rostova');
      assert.ok(rostovaResults.some((s) => s.fullName.includes('Elena Rostova')), 'Must find Rostova by last name');

      const thorneResults = searchStaff(DEFAULT_STAFF_DIRECTORY, 'thorne');
      assert.ok(thorneResults.some((s) => s.fullName.includes('David K. Thorne')), 'Must find Thorne by last name');

      // Non-matching query returns 0
      assert.strictEqual(searchStaff(DEFAULT_STAFF_DIRECTORY, 'nonexistentxyz').length, 0);
    });

    it('should verify AdminDashboardView registers Faculty & Staff Directory tab', () => {
      const adminPath = path.resolve('components/admin/AdminDashboardView.tsx');
      const adminContent = fs.readFileSync(adminPath, 'utf8');

      assert.ok(
        adminContent.includes('data-testid="tab-faculty-staff-directory"'),
        'AdminDashboardView must have tab-faculty-staff-directory button'
      );
      assert.ok(
        adminContent.includes('<FacultyStaffDirectoryView />'),
        'AdminDashboardView must render FacultyStaffDirectoryView'
      );
    });
  });

  describe('Multilingual RAG & Cloud Vector Store Verification', () => {
    it('should generate a 768-dimensional normalized embedding vector for Firestore', () => {
      const vec = generate768Embedding('Australian Higher Education Standards AQF Level 7');
      assert.strictEqual(vec.length, 768, 'Embedding must have exactly 768 dimensions');
      assert.ok(vec.some((v) => v > 0), 'Embedding vector must contain positive values');
      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      assert.ok(Math.abs(norm - 1.0) < 0.01, 'Embedding vector must be L2-normalized close to 1.0');
    });

    it('should report vector store stats with Firestore collection topology', async () => {
      const stats = await getVectorStoreStats();
      assert.ok(stats.totalChunks >= 4, 'Stats must include indexed chunks');
      assert.ok(stats.distinctLanguages.includes('en'), 'Stats must include English');
      assert.strictEqual(stats.firestoreCollections?.documents, 'rag_documents');
      assert.strictEqual(stats.firestoreCollections?.embeddings, 'knowledge_embeddings');
    });

    it('should ingest and auto-vectorize new documents with sliding chunks', async () => {
      const result = await ingestDocument({
        id: 'test-doc-audit-01',
        title: 'Australian Skills Quality Authority Standards',
        content: 'ASQA ensures national quality education. Registered training organisations must comply with all VET standards.',
        category: 'Compliance',
        language: 'en'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.documentId, 'test-doc-audit-01');
      assert.ok(result.chunkCount >= 1);

      // Verify searchable
      const chunks = await searchVectorChunks('ASQA quality standards');
      assert.ok(chunks.length > 0);
      assert.ok(chunks.some((c) => c.documentId === 'test-doc-audit-01'));

      // Clean up test document
      await deleteDocumentFromStore('test-doc-audit-01');
    });
  });

  describe('Front Page Campus Metrics & Dynamic 5-Box Customization Verification', () => {
    it('should verify /api/campus-metrics/route.ts defines all 5 customizable boxes with visibility flags', () => {
      const apiPath = path.resolve('app/api/campus-metrics/route.ts');
      const apiContent = fs.readFileSync(apiPath, 'utf8');

      // 5 boxes values
      assert.ok(apiContent.includes('totalStudents'), 'Must support totalStudents');
      assert.ok(apiContent.includes('placementRate'), 'Must support placementRate');
      assert.ok(apiContent.includes('facultyStaff'), 'Must support facultyStaff');
      assert.ok(apiContent.includes('onlineCourses'), 'Must support onlineCourses');
      assert.ok(apiContent.includes('communityCourses'), 'Must support communityCourses');

      // 5 boxes customizable titles
      assert.ok(apiContent.includes('studentsTitle'), 'Must support studentsTitle');
      assert.ok(apiContent.includes('placementTitle'), 'Must support placementTitle');
      assert.ok(apiContent.includes('facultyTitle'), 'Must support facultyTitle');
      assert.ok(apiContent.includes('onlineCoursesTitle'), 'Must support onlineCoursesTitle');
      assert.ok(apiContent.includes('communityCoursesTitle'), 'Must support communityCoursesTitle');

      // 5 boxes visibility checkboxes
      assert.ok(apiContent.includes('showTotalStudents'), 'Must support showTotalStudents');
      assert.ok(apiContent.includes('showPlacementRate'), 'Must support showPlacementRate');
      assert.ok(apiContent.includes('showFacultyStaff'), 'Must support showFacultyStaff');
      assert.ok(apiContent.includes('showOnlineCourses'), 'Must support showOnlineCourses');
      assert.ok(apiContent.includes('showCommunityCourses'), 'Must support showCommunityCourses');
    });

    it('should verify CampusMetricsManager includes 5 customizable boxes with visibility checkboxes', () => {
      const managerPath = path.resolve('components/admin/CampusMetricsManager.tsx');
      const managerContent = fs.readFileSync(managerPath, 'utf8');

      // Checkbox toggles in admin
      assert.ok(managerContent.includes('showTotalStudents'), 'CampusMetricsManager must have showTotalStudents toggle');
      assert.ok(managerContent.includes('showPlacementRate'), 'CampusMetricsManager must have showPlacementRate toggle');
      assert.ok(managerContent.includes('showFacultyStaff'), 'CampusMetricsManager must have showFacultyStaff toggle');
      assert.ok(managerContent.includes('showOnlineCourses'), 'CampusMetricsManager must have showOnlineCourses toggle');
      assert.ok(managerContent.includes('showCommunityCourses'), 'CampusMetricsManager must have showCommunityCourses toggle');

      // Box 4 & Box 5 headings and presets
      assert.ok(managerContent.includes('Online Courses'), 'CampusMetricsManager must feature Online Courses');
      assert.ok(managerContent.includes('Community Courses'), 'CampusMetricsManager must feature Community Courses');
      assert.ok(managerContent.includes('formatOnline'), 'CampusMetricsManager must have formatOnline');
      assert.ok(managerContent.includes('formatCommunity'), 'CampusMetricsManager must have formatCommunity');
    });

    it('should verify HomeView dynamically renders all 5 boxes when enabled and respects visibility toggles', () => {
      const homePath = path.resolve('components/home/HomeView.tsx');
      const homeContent = fs.readFileSync(homePath, 'utf8');

      // Desktop test IDs
      assert.ok(homeContent.includes('data-testid="hero-desktop-metrics"'), 'HomeView must have hero-desktop-metrics');
      assert.ok(homeContent.includes('data-testid="metric-box-students"'), 'HomeView must have metric-box-students');
      assert.ok(homeContent.includes('data-testid="metric-box-placement"'), 'HomeView must have metric-box-placement');
      assert.ok(homeContent.includes('data-testid="metric-box-faculty"'), 'HomeView must have metric-box-faculty');
      assert.ok(homeContent.includes('data-testid="metric-box-online-courses"'), 'HomeView must have metric-box-online-courses');
      assert.ok(homeContent.includes('data-testid="metric-box-community-courses"'), 'HomeView must have metric-box-community-courses');

      // Mobile test ID
      assert.ok(homeContent.includes('data-testid="hero-mobile-metrics"'), 'HomeView must have hero-mobile-metrics');

      // Visibility checks in HomeView
      assert.ok(homeContent.includes('campusMetrics.showTotalStudents ?? true'), 'Must check showTotalStudents');
      assert.ok(homeContent.includes('campusMetrics.showPlacementRate ?? true'), 'Must check showPlacementRate');
      assert.ok(homeContent.includes('campusMetrics.showFacultyStaff ?? true'), 'Must check showFacultyStaff');
      assert.ok(homeContent.includes('campusMetrics.showOnlineCourses ?? true'), 'Must check showOnlineCourses');
      assert.ok(homeContent.includes('campusMetrics.showCommunityCourses ?? true'), 'Must check showCommunityCourses');
    });

    it('should correctly format metric values with default fallbacks and custom titles', () => {
      const formatStudents = (val, title) => {
        const raw = (val || '5,000+').trim();
        if (title && title.trim() && title.trim() !== 'Total Students') {
          return raw.toLowerCase().includes(title.toLowerCase()) ? raw : `${raw} ${title.trim()}`;
        }
        return raw.toLowerCase().includes('student') ? raw : `${raw} Students`;
      };

      const formatOnline = (val, title) => {
        const raw = (val || '120+').trim();
        if (title && title.trim() && title.trim() !== 'Online Courses') {
          return raw.toLowerCase().includes(title.toLowerCase()) ? raw : `${raw} ${title.trim()}`;
        }
        return raw.toLowerCase().includes('course') ? raw : `${raw} Online Courses`;
      };

      const formatCommunity = (val, title) => {
        const raw = (val || '45+').trim();
        if (title && title.trim() && title.trim() !== 'Community Courses') {
          return raw.toLowerCase().includes(title.toLowerCase()) ? raw : `${raw} ${title.trim()}`;
        }
        return raw.toLowerCase().includes('course') ? raw : `${raw} Community Courses`;
      };

      // Default formats
      assert.strictEqual(formatStudents('6,200+'), '6,200+ Students');
      assert.strictEqual(formatStudents('6,200+ Students'), '6,200+ Students');
      assert.strictEqual(formatOnline('150+'), '150+ Online Courses');
      assert.strictEqual(formatCommunity('50+'), '50+ Community Courses');

      // Custom titles
      assert.strictEqual(formatOnline('200+', 'Digital Units'), '200+ Digital Units');
      assert.strictEqual(formatCommunity('80+', 'Regional Workshops'), '80+ Regional Workshops');
    });
  });

  describe('Navbar Navigation & Backpanel Admin Course Builder Verification', () => {
    it('should verify front page Navbar does not include Course Builder', () => {
      const navPath = path.resolve('components/Navbar.tsx');
      const navContent = fs.readFileSync(navPath, 'utf8');

      // navItems must NOT have Course Builder
      assert.strictEqual(
        navContent.includes("{ id: 'builder' as NavTab, label: 'Course Builder', icon: Layers }"),
        false,
        'Front page Navbar must not have Course Builder in navItems'
      );
      assert.strictEqual(
        navContent.includes("label: 'Course Builder'"),
        false,
        'Front page Navbar must not display Course Builder label'
      );

      // Verify legitimate public items are present
      assert.ok(navContent.includes("label: 'Home'"), 'Navbar must have Home');
      assert.ok(navContent.includes("label: 'Degree Programs'"), 'Navbar must have Degree Programs');
      assert.ok(navContent.includes("label: 'Unit Syllabi'"), 'Navbar must have Unit Syllabi');
      assert.ok(navContent.includes("label: 'Application Form'"), 'Navbar must have Application Form');
      assert.ok(navContent.includes("label: 'Events & Calendar'"), 'Navbar must have Events & Calendar');
      assert.ok(navContent.includes("label: 'AI Assist'"), 'Navbar must have AI Assist');
    });

    it('should verify backpanel Admin retains Course Builder view and tab', () => {
      const adminPath = path.resolve('components/admin/AdminDashboardView.tsx');
      const adminContent = fs.readFileSync(adminPath, 'utf8');

      assert.ok(
        adminContent.includes("activeTab === 'course_builder'"),
        'AdminDashboardView must have activeTab course_builder'
      );
      assert.ok(
        adminContent.includes('<CourseBuilderView apiKey={apiKeys.gemini} />'),
        'AdminDashboardView must render CourseBuilderView'
      );
    });
  });

  describe('Google Drive Upload Setup & Proof of Identity Verification Storage', () => {
    it('should verify root folder ID configuration points to 0AB6rUwSYF0xlUk9PVA', () => {
      const gdrivePath = path.resolve('lib/drive/googleDrive.ts');
      const gdriveContent = fs.readFileSync(gdrivePath, 'utf8');

      assert.ok(
        gdriveContent.includes("DEFAULT_ROOT_FOLDER_ID = '0AB6rUwSYF0xlUk9PVA'"),
        'googleDrive.ts must define DEFAULT_ROOT_FOLDER_ID as 0AB6rUwSYF0xlUk9PVA'
      );

      // Verify uploadBufferToGoogleDrive is implemented
      assert.ok(
        gdriveContent.includes('export async function uploadBufferToGoogleDrive'),
        'googleDrive.ts must export uploadBufferToGoogleDrive'
      );

      // Verify start-upload route references DEFAULT_ROOT_FOLDER_ID
      const startUploadPath = path.resolve('app/api/drive/start-upload/route.ts');
      const startUploadContent = fs.readFileSync(startUploadPath, 'utf8');
      assert.ok(
        startUploadContent.includes('DEFAULT_ROOT_FOLDER_ID'),
        'start-upload route must use DEFAULT_ROOT_FOLDER_ID as fallback'
      );
    });

    it('should verify Admin panel mounts the 📤 Upload tab with AdminDriveUploadPanel', () => {
      const adminPath = path.resolve('components/admin/AdminDashboardView.tsx');
      const adminContent = fs.readFileSync(adminPath, 'utf8');

      // Check activeTab union includes 'drive_upload'
      assert.ok(
        adminContent.includes("'drive_upload'"),
        'AdminDashboardView activeTab union must include drive_upload'
      );

      // Check tab button exists with data-testid="tab-drive-upload"
      assert.ok(
        adminContent.includes('data-testid="tab-drive-upload"'),
        'AdminDashboardView must have tab button with data-testid="tab-drive-upload"'
      );
      assert.ok(
        adminContent.includes('📤 Upload'),
        'AdminDashboardView tab button must have label 📤 Upload'
      );

      // Check AdminDriveUploadPanel is imported and rendered
      assert.ok(
        adminContent.includes("import { AdminDriveUploadPanel } from './AdminDriveUploadPanel'"),
        'AdminDashboardView must import AdminDriveUploadPanel'
      );
      assert.ok(
        adminContent.includes("activeTab === 'drive_upload'"),
        'AdminDashboardView must conditionally render AdminDriveUploadPanel'
      );
      assert.ok(
        adminContent.includes('<AdminDriveUploadPanel'),
        'AdminDashboardView must render <AdminDriveUploadPanel'
      );
    });

    it('should verify Proof of Identity documents are archived to Google Drive and audit includes drive links', () => {
      // 1. Verify verify-document route archives to Google Drive
      const verifyRoutePath = path.resolve('app/api/applications/verify-document/route.ts');
      const verifyRouteContent = fs.readFileSync(verifyRoutePath, 'utf8');
      assert.ok(
        verifyRouteContent.includes('uploadBufferToGoogleDrive'),
        'verify-document route must call uploadBufferToGoogleDrive'
      );
      assert.ok(
        verifyRouteContent.includes('driveFileId: driveUploadInfo?.fileId'),
        'verify-document route must attach driveFileId to audit'
      );
      assert.ok(
        verifyRouteContent.includes('driveFileUrl: driveUploadInfo?.webViewLink'),
        'verify-document route must attach driveFileUrl to audit'
      );

      // 2. Verify ApplicationPortalView sends applicantEmail and displays Google Drive storage confirmation
      const portalPath = path.resolve('components/application/ApplicationPortalView.tsx');
      const portalContent = fs.readFileSync(portalPath, 'utf8');
      assert.ok(
        portalContent.includes('applicantEmail: application.personalDetails.email'),
        'ApplicationPortalView must include applicantEmail for drive folder organization'
      );
      assert.ok(
        portalContent.includes('Archived to Google Drive: 0AB6rUwSYF0xlUk9PVA'),
        'ApplicationPortalView must display Google Drive archiving badge'
      );
      assert.ok(
        portalContent.includes('Open in Google Drive'),
        'ApplicationPortalView must display Open in Google Drive link'
      );

      // 3. Verify ApplicationDetailModal displays Google Drive links for Admissions Officers
      const modalPath = path.resolve('components/admin/ApplicationDetailModal.tsx');
      const modalContent = fs.readFileSync(modalPath, 'utf8');
      assert.ok(
        modalContent.includes('data-testid="link-view-gdrive-identity-modal"'),
        'ApplicationDetailModal must have link-view-gdrive-identity-modal'
      );
      assert.ok(
        modalContent.includes('Archived in Google Drive:'),
        'ApplicationDetailModal must indicate document is archived in Google Drive'
      );
    });

    it('should verify DocumentAuthenticityAudit data model supports Google Drive metadata', () => {
      const dataAppsPath = path.resolve('data/applications.ts');
      const dataAppsContent = fs.readFileSync(dataAppsPath, 'utf8');

      assert.ok(
        dataAppsContent.includes('driveFileId?: string'),
        'DocumentAuthenticityAudit must declare driveFileId'
      );
      assert.ok(
        dataAppsContent.includes('driveFileUrl?: string'),
        'DocumentAuthenticityAudit must declare driveFileUrl'
      );
      assert.ok(
        dataAppsContent.includes('driveFolderPath?: string'),
        'DocumentAuthenticityAudit must declare driveFolderPath'
      );
    });

    it('should verify small + button is deleted from work history header and only one single major + Work History button exists', () => {
      const portalPath = path.resolve('components/application/ApplicationPortalView.tsx');
      const portalContent = fs.readFileSync(portalPath, 'utf8');

      // 1. Verify small + Work History button in the header is deleted
      const headerSnippet = portalContent.slice(
        portalContent.indexOf('Step 4: Employment & Work History'),
        portalContent.indexOf('Self-Employment & Entrepreneurial Endeavours Welcome')
      );
      assert.strictEqual(
        headerSnippet.includes('+ Work History'),
        false,
        'Header of Step 4 must not contain a small + Work History button'
      );

      // 2. Verify single major + Work History button exists at the bottom
      assert.ok(
        portalContent.includes('data-testid="btn-add-work-history-major"'),
        'ApplicationPortalView must have single major + Work History button with data-testid="btn-add-work-history-major"'
      );

      // Count occurrences of handleAddWorkHistory in JSX
      const matches = portalContent.match(/onClick=\{handleAddWorkHistory\}/g) || [];
      assert.strictEqual(
        matches.length,
        1,
        'There must be exactly ONE handleAddWorkHistory button in the work history section'
      );
    });
  });

  describe('Step 5: Degree & Major Preferences Scroll-Down List & Search Verification', () => {
    it('should verify Step 5 contains search input and scrollable degree list container', () => {
      const portalPath = path.resolve('components/application/ApplicationPortalView.tsx');
      const portalContent = fs.readFileSync(portalPath, 'utf8');

      // Verify search input with test ID exists
      assert.ok(
        portalContent.includes('data-testid="input-degree-search"'),
        'ApplicationPortalView must have data-testid="input-degree-search"'
      );
      assert.ok(
        portalContent.includes('placeholder="Type degree name, code, or keyword to find closest matches'),
        'Search input must guide user to type degree name, code, or keyword'
      );

      // Verify scrollable container exists for scroll down selection (handling 500+ degrees)
      assert.ok(
        portalContent.includes('data-testid="scrollable-degree-list"'),
        'ApplicationPortalView must have data-testid="scrollable-degree-list"'
      );
      assert.ok(
        portalContent.includes('overflow-y-auto'),
        'Scrollable degree list must have overflow-y-auto'
      );
      assert.ok(
        portalContent.includes('max-h-72') || portalContent.includes('max-h-80'),
        'Scrollable degree list must constrain vertical height for smooth scrolling'
      );

      // Verify closest match filtering algorithm is present
      assert.ok(
        portalContent.includes('filteredCourses'),
        'ApplicationPortalView must compute filteredCourses'
      );
      assert.ok(
        portalContent.includes('degreeSearchQuery'),
        'ApplicationPortalView must track degreeSearchQuery'
      );
    });

    it('should verify closest-match ranking prioritizes exact code and title matches', () => {
      const courses = [
        { id: 'b-cs', code: 'CS100', title: 'Bachelor of Computer Science', degreeLevel: 'Undergraduate', overview: 'Theory and practice', majors: [{ name: 'AI' }] },
        { id: 'm-it', code: 'IT500', title: 'Master of Information Technology', degreeLevel: 'Postgraduate', overview: 'Advanced computing', majors: [{ name: 'Cloud' }] },
        { id: 'b-nurs', code: 'NUR100', title: 'Bachelor of Nursing', degreeLevel: 'Undergraduate', overview: 'Clinical care', majors: [] },
      ];

      function searchDegrees(query, level = 'ALL') {
        const q = query.trim().toLowerCase();
        let list = courses;
        if (level !== 'ALL') list = list.filter((c) => c.degreeLevel === level);
        if (!q) return list;

        const terms = q.split(/\s+/).filter(Boolean);
        return list
          .map((c) => {
            const titleLower = c.title.toLowerCase();
            const codeLower = c.code.toLowerCase();
            let score = 0;
            if (codeLower === q) score += 100;
            else if (codeLower.includes(q)) score += 60;
            if (titleLower === q) score += 90;
            else if (titleLower.startsWith(q)) score += 50;
            else if (titleLower.includes(q)) score += 30;
            for (const t of terms) {
              if (titleLower.includes(t)) score += 20;
              if (codeLower.includes(t)) score += 15;
            }
            return { course: c, score };
          })
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((item) => item.course);
      }

      // Exact code match
      const codeMatch = searchDegrees('CS100');
      assert.strictEqual(codeMatch.length, 1);
      assert.strictEqual(codeMatch[0].id, 'b-cs');

      // Title partial match
      const compMatch = searchDegrees('Computer Science');
      assert.strictEqual(compMatch.length, 1);
      assert.strictEqual(compMatch[0].id, 'b-cs');

      // Level filter match
      const postgradMatch = searchDegrees('', 'Postgraduate');
      assert.strictEqual(postgradMatch.length, 1);
      assert.strictEqual(postgradMatch[0].id, 'm-it');

      // Empty query returns all
      const allMatch = searchDegrees('');
      assert.strictEqual(allMatch.length, 3);
    });
  });

  describe('AI Course Builder Assistant Skill & Flexible Course CSV Verification', () => {
    it('should verify course-builder-assistant skill file exists and conforms to Antigravity skill specification', () => {
      const workspaceSkillPath = path.resolve('.agents/skills/course-builder-assistant/SKILL.md');
      assert.ok(fs.existsSync(workspaceSkillPath), 'Skill file must exist in workspace .agents/skills/');
      const content = fs.readFileSync(workspaceSkillPath, 'utf8');

      // Verify YAML frontmatter
      assert.ok(content.startsWith('---'), 'Skill must start with YAML frontmatter');
      assert.ok(content.includes('name: course-builder-assistant'), 'Skill must have correct name');
      assert.ok(content.includes('short courses'), 'Skill description must reference short courses');
      assert.ok(content.includes('long semester courses'), 'Skill description must reference long semester courses');
      assert.ok(content.includes('multiple Elements of Competency'), 'Skill description must mention multiple elements');

      // Verify comprehensive sections
      assert.ok(content.includes('ASQA'), 'Skill must cover ASQA framework');
      assert.ok(content.includes('TEQSA'), 'Skill must cover TEQSA framework');
      assert.ok(content.includes('Short Courses (1–4 Weeks'), 'Skill must have dedicated short course strategy');
      assert.ok(content.includes('Long Semester Courses (14–15 Weeks'), 'Skill must have dedicated semester strategy');
      assert.ok(content.includes('5-Level Scoring Rubrics'), 'Skill must detail 5-level rubrics');
      assert.ok(content.includes('Course CSV Schema & Data Contracts'), 'Skill must document CSV schema');
    });

    it('should verify global skill file exists in user customizations directory', () => {
      const globalSkillPath = 'C:\\Users\\david\\.gemini\\config\\skills\\course-builder-assistant\\SKILL.md';
      assert.ok(fs.existsSync(globalSkillPath), 'Skill file must exist in global customizations directory');
      const content = fs.readFileSync(globalSkillPath, 'utf8');
      assert.ok(content.includes('name: course-builder-assistant'));
      assert.ok(content.includes('multiple Elements of Competency'));
    });

    it('should generate flexible Short Course CSV template with 2+ units, multiple elements per unit, and 5-level rubrics', () => {
      const csv = generateShortCourseTemplateCsv();
      assert.ok(typeof csv === 'string');
      assert.ok(csv.startsWith(COURSE_CSV_HEADERS[0]));
      assert.ok(csv.includes('CERT-AI-BOOTCAMP'));
      assert.ok(csv.includes('Applied AI and LLM Engineering Bootcamp'));
      assert.ok(csv.includes('AIE101'));
      assert.ok(csv.includes('AIE102'));
      assert.ok(csv.includes('Element 1: Structured Prompt Design'));
      assert.ok(csv.includes('Element 2: Multi-Modal Ingestion'));
      assert.ok(csv.includes('Element 1: Vector Embeddings'));
      assert.ok(csv.includes('Level1_NYC'));
      assert.ok(csv.includes('Level5_Exemplary'));
      assert.ok(csv.includes('Critical gap in competency'));
      assert.ok(csv.includes('Comprehensive mastery'));
    });

    it('should generate flexible Semester Course CSV template with 15 weekly topics, multiple elements per unit, and mid/final exams', () => {
      const csv = generateSemesterCourseTemplateCsv();
      assert.ok(typeof csv === 'string');
      assert.ok(csv.includes('CYB401-SEM'));
      assert.ok(csv.includes('Bachelor of Cyber Security & Enterprise Systems Defense'));
      assert.ok(csv.includes('CYB401'));
      assert.ok(csv.includes('CYB402'));
      assert.ok(csv.includes('15')); // 15 weeks
      assert.ok(csv.includes('Week 1: Enterprise Security'));
      assert.ok(csv.includes('Week 7: Mid-Semester Practical Examination'));
      assert.ok(csv.includes('Week 15: Final Comprehensive Examination'));
      assert.ok(csv.includes('Element 1: Threat Surface Modeling'));
      assert.ok(csv.includes('Element 2: Cryptographic Protocols'));
      assert.ok(csv.includes('Element 3: Statutory WHS, ASQA & TEQSA'));
      assert.ok(csv.includes('Element 1: Cloud Architecture Hardening'));
      assert.ok(csv.includes('Element 2: Digital Forensics'));
      assert.ok(csv.includes('Element 3: Post-Breach Remediation'));
    });

    it('should parse Short Course CSV into structured Course data preserving multiple elements per unit', () => {
      const csv = generateShortCourseTemplateCsv();
      const parsed = parseCourseCsv(csv);

      assert.strictEqual(parsed.code, 'CERT-AI-BOOTCAMP');
      assert.strictEqual(parsed.durationWeeks, 4);
      assert.strictEqual(parsed.units.length, 2);

      // Verify Unit 1 has multiple elements
      const u1 = parsed.units[0];
      assert.strictEqual(u1.unitCode, 'AIE101');
      assert.ok(u1.performanceCriteria && u1.performanceCriteria.length >= 4);
      const u1Elements = getUniqueElementsFromUnit(u1);
      assert.ok(u1Elements.length >= 2, 'Unit 1 must contain multiple elements of competency');
      assert.ok(u1Elements.some(e => e.includes('Element 1')));
      assert.ok(u1Elements.some(e => e.includes('Element 2')));

      // Verify Unit 2 has multiple elements
      const u2 = parsed.units[1];
      assert.strictEqual(u2.unitCode, 'AIE102');
      const u2Elements = getUniqueElementsFromUnit(u2);
      assert.ok(u2Elements.length >= 2, 'Unit 2 must contain multiple elements of competency');

      // Verify assessments and rubrics
      assert.ok(u1.assessments.length >= 2);
      assert.strictEqual(u1.assessments[0].type, 'formative');
      assert.strictEqual(u1.assessments[1].type, 'summative');
      assert.strictEqual(u1.assessments[0].criteria[0].levels.length, 5);
    });

    it('should parse Long Semester Course CSV into structured 15-week curriculum with multiple elements per unit', () => {
      const csv = generateSemesterCourseTemplateCsv();
      const parsed = parseCourseCsv(csv);

      assert.strictEqual(parsed.code, 'CYB401-SEM');
      assert.strictEqual(parsed.durationWeeks, 15);
      assert.strictEqual(parsed.units.length, 2);

      // Verify Unit 1 has 3 elements
      const u1 = parsed.units[0];
      const u1Elements = getUniqueElementsFromUnit(u1);
      assert.ok(u1Elements.length >= 3, 'Unit 1 must have at least 3 elements of competency');

      // Verify Unit 2 has 3 elements
      const u2 = parsed.units[1];
      const u2Elements = getUniqueElementsFromUnit(u2);
      assert.ok(u2Elements.length >= 3, 'Unit 2 must have at least 3 elements of competency');

      // Total lessons across course must cover all 15 weeks
      const totalLessons = u1.lessons.length + u2.lessons.length;
      assert.strictEqual(totalLessons, 15, 'Semester course must cover 15 weekly lessons');
      assert.ok(u2.lessons.some(l => l.title.includes('Week 15')));
    });

    it('should export active Course data back to valid Course CSV format', () => {
      const testCourse = {
        code: 'ENG501',
        title: 'Advanced Mechanical Systems',
        durationWeeks: 15,
        units: [
          createDefaultUnit('ENG501A', 'Thermodynamic Modeling')
        ]
      };

      const exportedCsv = exportCourseToCsv(testCourse);
      assert.ok(typeof exportedCsv === 'string');
      assert.ok(exportedCsv.includes('ENG501'));
      assert.ok(exportedCsv.includes('Advanced Mechanical Systems'));
      assert.ok(exportedCsv.includes('ENG501A'));
      assert.ok(exportedCsv.includes('Thermodynamic Modeling'));

      // Round-trip parse
      const reimported = parseCourseCsv(exportedCsv);
      assert.strictEqual(reimported.code, 'ENG501');
      assert.strictEqual(reimported.units.length, 1);
      assert.strictEqual(reimported.units[0].unitCode, 'ENG501A');
    });

    it('should verify static template files exist in public/templates/', () => {
      const shortPath = path.resolve('public/templates/course-template-short.csv');
      const semPath = path.resolve('public/templates/course-template-semester.csv');

      assert.ok(fs.existsSync(shortPath), 'Short course template must exist in public/templates/');
      assert.ok(fs.existsSync(semPath), 'Semester course template must exist in public/templates/');

      const shortContent = fs.readFileSync(shortPath, 'utf8');
      const semContent = fs.readFileSync(semPath, 'utf8');

      assert.ok(shortContent.includes('CERT-AI-BOOTCAMP'));
      assert.ok(semContent.includes('CYB401-SEM'));
    });

    it('should dynamically add new Elements of Competency with addElementToUnit and addCriterionToElement', () => {
      const unit = createDefaultUnit('TEST101', 'Test Competency');
      const initialElements = getUniqueElementsFromUnit(unit);
      assert.strictEqual(initialElements.length, 2, 'Default unit starts with Element 1 and Element 2');

      // Add a third element
      const { updatedUnit: uWithElem3, newCriterion: c3 } = addElementToUnit(unit);
      assert.strictEqual(c3.code, '3.1');
      assert.ok(c3.element.includes('Element 3'));
      const elementsAfterAdd = getUniqueElementsFromUnit(uWithElem3);
      assert.strictEqual(elementsAfterAdd.length, 3, 'Unit must now have 3 distinct elements');

      // Add a second criterion under Element 3
      const { updatedUnit: uWith3_2, newCriterion: c3_2 } = addCriterionToElement(uWithElem3, c3.element);
      assert.strictEqual(c3_2.code, '3.2');
      assert.strictEqual(c3_2.element, c3.element);
      assert.strictEqual(uWith3_2.performanceCriteria.length, unit.performanceCriteria.length + 2);
    });

    it('should verify UnifiedCourseBuilder includes CSV download buttons, import/export controls, + Add Element button, and AI modal presets', () => {
      const filePath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      // CSV buttons
      assert.ok(content.includes('data-testid="download-short-course-csv-btn"'), 'Must have download-short-course-csv-btn');
      assert.ok(content.includes('data-testid="download-semester-course-csv-btn"'), 'Must have download-semester-course-csv-btn');
      assert.ok(content.includes('data-testid="import-full-course-csv-btn"'), 'Must have import-full-course-csv-btn');
      assert.ok(content.includes('data-testid="export-full-course-csv-btn"'), 'Must have export-full-course-csv-btn');
      assert.ok(content.includes('data-testid="course-csv-file-input"'), 'Must have course-csv-file-input');

      // Multiple elements controls
      assert.ok(content.includes('data-testid="add-element-btn"'), 'Must have add-element-btn');
      assert.ok(content.includes('data-testid="elements-count-badge"'), 'Must have elements-count-badge');
      assert.ok(content.includes('Filter Element:'), 'Must provide element filter toolbar');

      // AI modal presets grounded in course-builder-assistant
      assert.ok(content.includes('data-testid="ai-preset-short-course-btn"'), 'Must have ai-preset-short-course-btn');
      assert.ok(content.includes('data-testid="ai-preset-semester-course-btn"'), 'Must have ai-preset-semester-course-btn');
      assert.ok(content.includes('data-testid="ai-preset-short-csv-btn"'), 'Must have ai-preset-short-csv-btn');
      assert.ok(content.includes('data-testid="ai-preset-semester-csv-btn"'), 'Must have ai-preset-semester-csv-btn');
      assert.ok(content.includes('course-builder-assistant'), 'Must mention course-builder-assistant skill');
    });

    it('should verify rubrics are unified directly in Course Builder CSV and separate assessment CSV buttons are removed', () => {
      const filePath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      // Verify separate Assessment toolbar CSV buttons are removed
      assert.strictEqual(content.includes('data-testid="upload-csv-btn"'), false, 'Separate upload-csv-btn must be removed from Assessment toolbar');
      assert.strictEqual(content.includes('data-testid="download-csv-template-btn"'), false, 'Separate download-csv-template-btn must be removed from Assessment toolbar');
      assert.strictEqual(content.includes('data-testid="export-rubrics-btn"'), false, 'Separate export-rubrics-btn must be removed from Assessment toolbar');

      // Verify unified Course Builder CSV buttons are retained
      assert.ok(content.includes('data-testid="download-short-course-csv-btn"'), 'Must retain download-short-course-csv-btn');
      assert.ok(content.includes('data-testid="download-semester-course-csv-btn"'), 'Must retain download-semester-course-csv-btn');
      assert.ok(content.includes('data-testid="import-full-course-csv-btn"'), 'Must retain import-full-course-csv-btn');
      assert.ok(content.includes('data-testid="export-full-course-csv-btn"'), 'Must retain export-full-course-csv-btn');

      // Verify Course Builder CSV contains 5-level rubric headers
      const shortCsv = generateShortCourseTemplateCsv();
      assert.ok(shortCsv.includes('RubricCriterion'), 'Course CSV must contain RubricCriterion header');
      assert.ok(shortCsv.includes('Level1_NYC'), 'Course CSV must contain Level1_NYC header');
      assert.ok(shortCsv.includes('Level3_Competent'), 'Course CSV must contain Level3_Competent header');
      assert.ok(shortCsv.includes('Level5_Exemplary'), 'Course CSV must contain Level5_Exemplary header');

      // Verify parseCourseCsv creates full rubric criteria and levels
      const parsed = parseCourseCsv(shortCsv);
      assert.ok(parsed.units.length >= 2, 'Must parse units from Course CSV');
      const unit1 = parsed.units[0];
      assert.ok(unit1.assessments.length >= 2, 'Unit must have assessments from Course CSV');
      const ass1 = unit1.assessments[0];
      assert.ok(ass1.criteria.length >= 1, 'Assessment must have rubric criteria populated from Course CSV');
      assert.strictEqual(ass1.criteria[0].levels.length, 5, 'Criterion must have all 5 AQF levels');
      assert.ok(ass1.criteria[0].levels[0].descriptor.length > 0, 'Level 1 NYC descriptor must be populated');
      assert.ok(ass1.criteria[0].levels[2].descriptor.length > 0, 'Level 3 Competent descriptor must be populated');
      assert.ok(ass1.criteria[0].levels[4].descriptor.length > 0, 'Level 5 Exemplary descriptor must be populated');
    });
  });

  describe('Navbar Tokens Button, Geolocation Pricing, Unregistered Fund & Stripe Gateway Verification', () => {
    it('should verify Navbar renders Tokens button in desktop header and mobile bar with accessible attributes', () => {
      const navbarPath = path.resolve('components/Navbar.tsx');
      const navbarContent = fs.readFileSync(navbarPath, 'utf8');

      // Desktop Tokens button
      assert.ok(navbarContent.includes('data-testid="navbar-tokens-btn"'), 'Navbar must include desktop navbar-tokens-btn');
      assert.ok(navbarContent.includes('data-agent-id="navbar-tokens-button"'), 'Navbar must include data-agent-id for automated agent');
      assert.ok(navbarContent.includes('aria-label="Community Token Fund and Buy Tokens"'), 'Must have accessible aria-label');
      assert.ok(navbarContent.includes('Coins'), 'Must render Coins icon from lucide-react');

      // Mobile Tokens button
      assert.ok(navbarContent.includes('data-testid="mobile-navbar-tokens-btn"'), 'Navbar must include mobile navbar-tokens-btn');
      assert.ok(navbarContent.includes('aria-label="Tokens & Community Fund"'), 'Mobile bar must have accessible aria-label');
    });

    it('should verify Token system explanation and geolocation pricing rule (AUD for Australia, USD for international)', () => {
      assert.ok(TOKEN_SYSTEM_EXPLANATION.title.includes('Token System'), 'Must describe Token System');
      assert.ok(TOKEN_SYSTEM_EXPLANATION.useCases.length >= 4, 'Must detail at least 4 key AI use cases');
      assert.ok(TOKEN_SYSTEM_EXPLANATION.pricingSummary.aud.includes('$1.54 AUD'), 'AUD pricing must be $1.54');
      assert.ok(TOKEN_SYSTEM_EXPLANATION.pricingSummary.usd.includes('$1.00 USD'), 'USD pricing must be $1.00');

      // Geolocation detection tests
      assert.strictEqual(isUserInAustralia('Australia/Sydney'), true, 'Sydney timezone must be Australian');
      assert.strictEqual(isUserInAustralia('Australia/Melbourne'), true, 'Melbourne timezone must be Australian');
      assert.strictEqual(isUserInAustralia('Australia/Brisbane'), true, 'Brisbane timezone must be Australian');
      assert.strictEqual(isUserInAustralia('Australia/Perth'), true, 'Perth timezone must be Australian');
      assert.strictEqual(isUserInAustralia('America/New_York'), false, 'New York timezone must not be Australian');
      assert.strictEqual(isUserInAustralia('Europe/London'), false, 'London timezone must not be Australian');
      assert.strictEqual(isUserInAustralia(undefined, 'AU'), true, 'Country code AU must be Australian');
      assert.strictEqual(isUserInAustralia(undefined, 'US'), false, 'Country code US must not be Australian');

      // Price determination based on geolocation
      const ausPricing = getLocalizedTokenPricing(true);
      assert.strictEqual(ausPricing.currency, 'AUD');
      assert.strictEqual(ausPricing.tokenPrice, 1.54);
      assert.strictEqual(ausPricing.priceFormatted, '$1.54 AUD');

      const intlPricing = getLocalizedTokenPricing(false);
      assert.strictEqual(intlPricing.currency, 'USD');
      assert.strictEqual(intlPricing.tokenPrice, 1.00);
      assert.strictEqual(intlPricing.priceFormatted, '$1.00 USD');
    });

    it('should verify unregistered users can contribute to Accumulated Token Fund without registering', () => {
      const stateBefore = getAccumulatedFundState();
      assert.ok(stateBefore.totalTokensInFund > 0, 'Fund must have active initial balance');
      assert.ok(stateBefore.recentContributions.length > 0, 'Fund must display recent contributions');

      // Add anonymous contribution without any account registration
      const contribution = addContributionToFund({
        tokens: 50,
        currency: 'AUD',
        fiatAmount: 77.00,
        contributorName: '',
        isAnonymous: true,
        note: 'For regional indigenous learners'
      });

      assert.strictEqual(contribution.tokens, 50);
      assert.strictEqual(contribution.contributorName, 'Anonymous Supporter');
      assert.strictEqual(contribution.status, 'completed');
      assert.strictEqual(contribution.targetAllocation, 'COMMUNITY_FUND');

      const stateAfter = getAccumulatedFundState();
      assert.strictEqual(stateAfter.totalTokensInFund, stateBefore.totalTokensInFund + 50);
      assert.strictEqual(stateAfter.totalContributionsCount, stateBefore.totalContributionsCount + 1);

      // Verify invalid non-positive tokens throws an error
      assert.throws(() => {
        addContributionToFund({
          tokens: 0,
          currency: 'USD',
          fiatAmount: 0,
          contributorName: 'Test',
          isAnonymous: false
        });
      }, /positive whole integer/);
    });

    it('should compute accurate pricing for token packages: 50, 100, 500, 1000, and Custom', () => {
      assert.deepStrictEqual(TOKEN_PURCHASE_PRESETS, [50, 100, 500, 1000]);

      // 50 Tokens Package
      const pkg50Usd = computeTokenPackageTotal(50, 'USD');
      assert.strictEqual(pkg50Usd.totalFiat, 50.00);
      const pkg50Aud = computeTokenPackageTotal(50, 'AUD');
      assert.strictEqual(pkg50Aud.totalFiat, 77.00);

      // 100 Tokens Package
      const pkg100Usd = computeTokenPackageTotal(100, 'USD');
      assert.strictEqual(pkg100Usd.totalFiat, 100.00);
      const pkg100Aud = computeTokenPackageTotal(100, 'AUD');
      assert.strictEqual(pkg100Aud.totalFiat, 154.00);

      // 500 Tokens Package
      const pkg500Usd = computeTokenPackageTotal(500, 'USD');
      assert.strictEqual(pkg500Usd.totalFiat, 500.00);
      const pkg500Aud = computeTokenPackageTotal(500, 'AUD');
      assert.strictEqual(pkg500Aud.totalFiat, 770.00);

      // 1000 Tokens Package
      const pkg1000Usd = computeTokenPackageTotal(1000, 'USD');
      assert.strictEqual(pkg1000Usd.totalFiat, 1000.00);
      const pkg1000Aud = computeTokenPackageTotal(1000, 'AUD');
      assert.strictEqual(pkg1000Aud.totalFiat, 1540.00);

      // Custom Tokens (e.g. 250 tokens)
      const customPkg = computeTokenPackageTotal(250, 'AUD');
      assert.strictEqual(customPkg.tokens, 250);
      assert.strictEqual(customPkg.totalFiat, 385.00);

      // Strict integer verification (decimals are strictly rounded)
      const roundedPkg = computeTokenPackageTotal(99.7, 'USD');
      assert.strictEqual(roundedPkg.tokens, 100);
      assert.strictEqual(roundedPkg.totalFiat, 100.00);

      // Dual tooltip format
      assert.strictEqual(pkg100Usd.dualTooltip, '$100.00 USD / $154.00 AUD');
    });

    it('should verify Stripe Payment Gateway route and TokenFundModal integration', () => {
      // Check Stripe Checkout Session API Route
      const routePath = path.resolve('app/api/stripe/create-checkout-session/route.ts');
      assert.ok(fs.existsSync(routePath), 'Stripe checkout route must exist');
      const routeContent = fs.readFileSync(routePath, 'utf8');
      assert.ok(routeContent.includes("from 'stripe'"), 'Route must import stripe package');
      assert.ok(routeContent.includes('toStrictIntegerTokens'), 'Route must enforce strict integer tokens');
      assert.ok(routeContent.includes('addContributionToFund'), 'Route must support adding to accumulated fund');

      // Check TokenFundModal UI component
      const modalPath = path.resolve('components/tokens/TokenFundModal.tsx');
      assert.ok(fs.existsSync(modalPath), 'TokenFundModal must exist');
      const modalContent = fs.readFileSync(modalPath, 'utf8');
      assert.ok(modalContent.includes('data-testid="token-fund-modal"'), 'Modal must have data-testid');
      assert.ok(modalContent.includes('data-testid="pay-with-stripe-btn"'), 'Modal must have pay-with-stripe-btn');
      assert.ok(modalContent.includes('data-testid="custom-token-input"'), 'Modal must have custom-token-input');
      assert.ok(modalContent.includes('data-testid="community-fund-checkbox"'), 'Modal must have community-fund-checkbox');
      assert.ok(modalContent.includes('data-testid={`token-preset-${tokens}`}'), 'Modal must dynamically bind preset testid for each token package');
      assert.ok(modalContent.includes('data-testid="token-preset-custom"'), 'Modal must have token-preset-custom');
      assert.ok(modalContent.includes('/api/stripe/create-checkout-session'), 'Modal must call Stripe checkout route');

      // Check app/page.tsx mounts modal and wires onOpenTokens
      const pagePath = path.resolve('app/page.tsx');
      const pageContent = fs.readFileSync(pagePath, 'utf8');
      assert.ok(pageContent.includes('<TokenFundModal'), 'app/page.tsx must mount TokenFundModal');
      assert.ok(pageContent.includes('onOpenTokens={() => setIsTokenModalOpen(true)}'), 'app/page.tsx must pass onOpenTokens');
    });

    it('should verify TokenFundModal has screen-fitted responsive geometry and excludes How Tokens Are Used section', () => {
      const modalPath = path.resolve('components/tokens/TokenFundModal.tsx');
      const modalContent = fs.readFileSync(modalPath, 'utf8');

      // Responsive viewport & container sizing
      assert.ok(modalContent.includes('max-w-3xl'), 'Modal must have max-w-3xl bounds to fit screen better');
      assert.ok(modalContent.includes('max-h-[92vh]'), 'Modal must be bounded by 92vh viewport height');
      assert.ok(modalContent.includes('flex flex-col'), 'Modal must use flex column layout');
      assert.ok(modalContent.includes('overflow-y-auto'), 'Modal body must be scrollable to prevent viewport clipping');

      // Responsive Geolocation & Pricing banner
      assert.ok(modalContent.includes('Geolocation:'), 'Must display Geolocation indicator');
      assert.ok(modalContent.includes('1 Token ='), 'Must display 1 Token pricing');
      assert.ok(modalContent.includes('flex flex-col sm:flex-row sm:items-center justify-between gap-2.5'), 'Geolocation banner must adapt fluidly between mobile and desktop');

      // User directive: "do not add: How Tokens Are Used Across Super-RTO"
      assert.strictEqual(
        modalContent.includes('How Tokens Are Used Across Super-RTO'),
        false,
        'TokenFundModal must NOT contain How Tokens Are Used Across Super-RTO section'
      );
      assert.strictEqual(
        modalContent.includes('AI Curriculum Ingestion & Course Synthesis'),
        false,
        'TokenFundModal must NOT contain AI Curriculum Ingestion useCase card'
      );
      assert.strictEqual(
        modalContent.includes('Automated 5-Level Rubric Grading'),
        false,
        'TokenFundModal must NOT contain Rubric Grading useCase card'
      );
    });
  });

  describe('PRO-LMS FUSION Course Builder Responsive Fluid Geometry & Layout Verification', () => {
    it('should verify UnifiedCourseBuilder container and header adapt fluidly across mobile, tablet, and desktop', () => {
      const filePath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      // Container responsive bounds
      assert.ok(content.includes('max-w-7xl'), 'Container must have max-w-7xl bounds');
      assert.ok(content.includes('overflow-hidden'), 'Container must prevent horizontal overflow clipping');
      assert.ok(content.includes('p-3.5 sm:p-5 md:p-6'), 'Container must have responsive padding scale');

      // Header and badge responsiveness
      assert.ok(content.includes('flex flex-col lg:flex-row lg:items-center justify-between gap-4'), 'Header must break into column on mobile/tablet and row on desktop');
      assert.ok(content.includes('PRO-LMS FUSION'), 'Header must display PRO-LMS FUSION badge');
      assert.ok(content.includes('flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end'), 'Action buttons must wrap cleanly across screen widths');
    });

    it('should verify CSV toolbar and metadata forms use fluid responsive grids', () => {
      const filePath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      // CSV toolbar horizontal scroll & wrapping
      assert.ok(content.includes('overflow-x-auto'), 'CSV toolbar must allow horizontal scrolling on narrow screens');
      assert.ok(content.includes('flex-wrap sm:flex-nowrap'), 'CSV toolbar must adapt wrap between mobile and tablet');

      // Course metadata grid
      assert.ok(
        content.includes('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-1'),
        'Course metadata form must scale 1-col on mobile, 2-cols on tablet, 4-cols on desktop'
      );
      assert.ok(
        content.includes('col-span-1 sm:col-span-2 lg:col-span-4'),
        'Course description textarea must span full width across all breakpoint sizes'
      );
    });

    it('should verify 5-level AQF rubrics grid refactors into legible responsive columns', () => {
      const filePath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      // 5-level rubrics responsive grid
      assert.ok(
        content.includes('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3'),
        'Rubrics grid must scale 1 col (mobile), 2 cols (tablet), 3 cols (laptop), 5 cols (desktop)'
      );
    });

    it('should verify units list is bounded with responsive max-height scroll and AI modal is viewport-constrained', () => {
      const filePath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      // Units sidebar max-height bounds on mobile/tablet
      assert.ok(
        content.includes('max-h-72 sm:max-h-96 lg:max-h-none overflow-y-auto pr-1'),
        'Units list must be scroll-bounded on mobile/tablet to avoid pushing lessons offscreen'
      );

      // AI Modal viewport constraints
      assert.ok(
        content.includes('max-h-[90vh] overflow-y-auto'),
        'AI Assistant modal must have max-height 90vh scroll to prevent clipping off viewport'
      );
      assert.ok(
        content.includes('w-full max-w-2xl p-4 sm:p-6'),
        'AI Assistant modal card must have responsive width and padding'
      );
    });
  });

  describe('Unified Superadmin Identity & Shared Token Account Architecture', () => {
    it('should verify admin@aifoundation.net.au has been completely purged from roles, seeds, and env example', () => {
      const rolesFile = fs.readFileSync(path.resolve('lib/auth/roles.ts'), 'utf8');
      const seedFile = fs.readFileSync(path.resolve('app/api/course-builder/route.ts'), 'utf8');
      const envExampleFile = fs.readFileSync(path.resolve('.env.example'), 'utf8');

      assert.strictEqual(
        rolesFile.includes('admin@aifoundation.net.au'),
        false,
        'lib/auth/roles.ts must not contain admin@aifoundation.net.au'
      );
      assert.strictEqual(
        seedFile.includes('admin@aifoundation.net.au'),
        false,
        'app/api/course-builder/route.ts must not contain admin@aifoundation.net.au'
      );
      assert.strictEqual(
        envExampleFile.includes('admin@aifoundation.net.au'),
        false,
        '.env.example must not contain admin@aifoundation.net.au'
      );
    });

    it('should verify primary and secondary superadmin emails and project owner recognition', () => {
      assert.strictEqual(PRIMARY_SUPERADMIN_EMAIL, 'support@aifoundation.net.au');
      assert.strictEqual(SECONDARY_SUPERADMIN_EMAIL, 'davidrobertson.info@gmail.com');
      assert.strictEqual(SUPERADMIN_SHARED_WALLET_DOC, 'superadmin_shared');

      assert.strictEqual(isProjectOwnerEmail('support@aifoundation.net.au'), true);
      assert.strictEqual(isProjectOwnerEmail('SUPPORT@AIFOUNDATION.NET.AU'), true);
      assert.strictEqual(isProjectOwnerEmail('davidrobertson.info@gmail.com'), true);
      assert.strictEqual(isProjectOwnerEmail('DAVIDROBERTSON.INFO@GMAIL.COM'), true);
      assert.strictEqual(isProjectOwnerEmail('admin@aifoundation.net.au'), false);
      assert.strictEqual(isProjectOwnerEmail('random@student.edu.au'), false);
    });

    it('should verify the shared superadmin token account architecture in lib/firebase/admin.ts', async () => {
      assert.strictEqual(PRIMARY_SUPERADMIN_UID, 'L5euSJAfNKdDOX6mT0qmrCGjUA53');

      // 1. Both superadmins must point to the identical shared wallet balance
      const initialWallet = await getSuperadminSharedWallet();
      const initialBalance = initialWallet.tokenBalance;
      assert.ok(typeof initialBalance === 'number');

      const primaryBalance = await getUserTokenBalance({ userEmail: 'support@aifoundation.net.au' });
      const secondaryBalance = await getUserTokenBalance({ userEmail: 'davidrobertson.info@gmail.com' });

      assert.strictEqual(
        primaryBalance.balance,
        initialBalance,
        'Primary superadmin balance must match shared wallet'
      );
      assert.strictEqual(
        secondaryBalance.balance,
        initialBalance,
        'Secondary superadmin balance must match shared wallet'
      );
      assert.strictEqual(primaryBalance.isSharedWallet, true);
      assert.strictEqual(secondaryBalance.isSharedWallet, true);

      // 2. Community Fund contribution must credit the shared superadmin wallet
      const creditRes = await creditTokenWallet({
        tokens: 50,
        isCommunityFund: true,
        contributorName: 'Test Supporter',
        currency: 'AUD',
        fiatAmount: 77
      });
      assert.strictEqual(creditRes.success, true);
      assert.strictEqual(creditRes.targetWallet, 'superadmin_shared');

      const updatedWallet = await getSuperadminSharedWallet();
      assert.strictEqual(updatedWallet.tokenBalance, initialBalance + 50);

      // Verify secondary superadmin immediately sees the credited tokens
      const updatedSecondary = await getUserTokenBalance({ userEmail: 'davidrobertson.info@gmail.com' });
      assert.strictEqual(updatedSecondary.balance, initialBalance + 50);

      // 3. Spending by secondary superadmin deducts from the shared pool
      const spendRes = await spendTokens({
        tokens: 10,
        userEmail: 'davidrobertson.info@gmail.com',
        action: 'AI_SYNTHESIS_TEST',
        reason: 'Testing unified shared deduction'
      });
      assert.strictEqual(spendRes.success, true);
      assert.strictEqual(spendRes.walletId, 'superadmin_shared');
      assert.strictEqual(spendRes.remainingBalance, initialBalance + 40);

      // Verify primary superadmin reflects the deduction
      const updatedPrimary = await getUserTokenBalance({ userEmail: 'support@aifoundation.net.au' });
      assert.strictEqual(updatedPrimary.balance, initialBalance + 40);
    });

    it('should verify token endpoints and course builder spend integration', () => {
      const courseBuilderPath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const navbarPath = path.resolve('components/Navbar.tsx');
      const spendRoutePath = path.resolve('app/api/tokens/spend/route.ts');
      const balanceRoutePath = path.resolve('app/api/tokens/balance/route.ts');

      assert.ok(fs.existsSync(spendRoutePath), 'POST /api/tokens/spend route must exist');
      assert.ok(fs.existsSync(balanceRoutePath), 'GET /api/tokens/balance route must exist');

      const cbContent = fs.readFileSync(courseBuilderPath, 'utf8');
      assert.ok(
        cbContent.includes('/api/tokens/spend'),
        'Course builder must call /api/tokens/spend on AI ingest'
      );
      assert.ok(
        cbContent.includes('super_rto_tokens_updated'),
        'Course builder must dispatch super_rto_tokens_updated event'
      );

      const navContent = fs.readFileSync(navbarPath, 'utf8');
      assert.ok(
        navContent.includes('/api/tokens/balance'),
        'Navbar must query /api/tokens/balance'
      );
      assert.ok(
        navContent.includes('super_rto_tokens_updated'),
        'Navbar must listen for super_rto_tokens_updated'
      );
    });

    it('should route any token not purchased for a specific account directly to the superadmin accumulated token fund', async () => {
      // 1. Purchase without userId (e.g. unauthenticated web visitor) must go to superadmin_shared
      const unauthPurchase = await creditTokenWallet({
        tokens: 100,
        isCommunityFund: false, // Even if false, no specific account provided!
        contributorName: 'Unregistered Visitor',
        contributorEmail: 'guest@visitor.com'
      });
      assert.strictEqual(unauthPurchase.success, true);
      assert.strictEqual(
        unauthPurchase.targetWallet,
        'superadmin_shared',
        'Unallocated purchase must route to the superadmin accumulated token fund'
      );

      // 2. Explicit community fund contribution must also route to superadmin_shared
      const fundDonation = await creditTokenWallet({
        tokens: 25,
        isCommunityFund: true,
        userId: 'some_user_123', // Even if logged in, explicitly chose community fund!
        contributorName: 'Generous Donor'
      });
      assert.strictEqual(fundDonation.success, true);
      assert.strictEqual(
        fundDonation.targetWallet,
        'superadmin_shared',
        'Community fund contribution must route to the superadmin accumulated token fund'
      );

      // 3. Authenticated purchase with valid userId and isCommunityFund: false routes to that specific user
      const userPurchase = await creditTokenWallet({
        tokens: 30,
        userId: 'specific_student_456',
        isCommunityFund: false,
        contributorName: 'Enrolled Student'
      });
      assert.strictEqual(userPurchase.success, true);
      assert.strictEqual(
        userPurchase.targetWallet,
        'specific_student_456',
        'Purchase for a specific account must route to that specific user'
      );

      // 4. Superadmin UID purchases automatically resolve to the shared superadmin token fund
      const superUidPurchase = await creditTokenWallet({
        tokens: 40,
        userId: PRIMARY_SUPERADMIN_UID,
        isCommunityFund: false,
        contributorName: 'Superadmin Direct'
      });
      assert.strictEqual(superUidPurchase.success, true);
      assert.strictEqual(
        superUidPurchase.targetWallet,
        'superadmin_shared',
        'Superadmin purchase even with personal flag must go to superadmin_shared'
      );

      // 5. Querying balance by UID for both superadmins must resolve to the shared pool
      const primaryByUid = await getUserTokenBalance({ userId: PRIMARY_SUPERADMIN_UID });
      const secondaryByUid = await getUserTokenBalance({ userId: SECONDARY_SUPERADMIN_UID });
      assert.strictEqual(primaryByUid.isSharedWallet, true);
      assert.strictEqual(secondaryByUid.isSharedWallet, true);
      assert.strictEqual(primaryByUid.walletId, 'superadmin_shared');
      assert.strictEqual(secondaryByUid.walletId, 'superadmin_shared');
      assert.strictEqual(primaryByUid.tokenBalance, secondaryByUid.tokenBalance);

      // 6. Verify /api/tokens/fund route links directly to superadmin shared wallet
      const fundRoutePath = path.resolve('app/api/tokens/fund/route.ts');
      const fundRouteContent = fs.readFileSync(fundRoutePath, 'utf8');
      assert.ok(
        fundRouteContent.includes('getSuperadminSharedWallet'),
        '/api/tokens/fund must sync with getSuperadminSharedWallet'
      );
      assert.ok(
        fundRouteContent.includes('creditTokenWallet'),
        '/api/tokens/fund must credit superadmin token wallet'
      );
    });
  });

  describe('21. Superadmin Multi-Role Perspective Impersonator & Admin Panel Tab Access', () => {
    it('defines access rules for all 22 admin tabs and grants Superadmin 100% access to all tabs', () => {
      const allTabIds = Object.keys(ADMIN_PANEL_TAB_ACCESS);
      assert.strictEqual(allTabIds.length, 22, 'ADMIN_PANEL_TAB_ACCESS must contain all 22 admin tabs');

      // Superadmin must be able to view every single tab
      for (const tabId of allTabIds) {
        assert.strictEqual(
          isTabAccessibleForRole(tabId, 'superadmin'),
          true,
          `Superadmin must have access to tab: ${tabId}`
        );
      }

      // Universal tabs like account_profile are accessible to all roles
      for (const role of ['student', 'teacher', 'supporter', 'cfo', 'director', 'administration']) {
        assert.strictEqual(
          isTabAccessibleForRole('account_profile', role),
          true,
          `account_profile must be universally accessible for role: ${role}`
        );
      }
    });

    it('correctly gates and restricts tabs for non-superadmin roles based on RBAC permissions', () => {
      // 1. Teacher access tests
      assert.strictEqual(isTabAccessibleForRole('course_builder', 'teacher'), true);
      assert.strictEqual(isTabAccessibleForRole('classroom', 'teacher'), true);
      assert.strictEqual(isTabAccessibleForRole('rag_pipeline', 'teacher'), true);
      assert.strictEqual(isTabAccessibleForRole('knowledge', 'teacher'), true);
      // Teacher cannot access governance/management tabs
      assert.strictEqual(isTabAccessibleForRole('role_permissions', 'teacher'), false);
      assert.strictEqual(isTabAccessibleForRole('compliance', 'teacher'), false);
      assert.strictEqual(isTabAccessibleForRole('api_key', 'teacher'), false);
      assert.strictEqual(isTabAccessibleForRole('user_management', 'teacher'), false);
      assert.strictEqual(isTabAccessibleForRole('campus_metrics', 'teacher'), false);

      // 2. Student access tests: Students can only view courses, NOT access Course Builder
      assert.strictEqual(isTabAccessibleForRole('account_profile', 'student'), true);
      assert.strictEqual(
        isTabAccessibleForRole('course_builder', 'student'),
        false,
        'Students should only be allowed to view courses, never build or edit courses in Course Builder'
      );
      assert.strictEqual(
        roleHasPermission('student', 'courses.view'),
        true,
        'Students must have courses.view to inspect degrees, courses, and unit syllabi'
      );
      assert.strictEqual(
        roleHasPermission('student', 'courses.create'),
        false,
        'Students must NOT have courses.create permission'
      );
      assert.strictEqual(isTabAccessibleForRole('role_permissions', 'student'), false);
      assert.strictEqual(isTabAccessibleForRole('user_management', 'student'), false);
      assert.strictEqual(isTabAccessibleForRole('tokens', 'student'), false);
      assert.strictEqual(isTabAccessibleForRole('api_key', 'student'), false);

      // 3. CFO access tests
      assert.strictEqual(isTabAccessibleForRole('tokens', 'cfo'), true);
      assert.strictEqual(isTabAccessibleForRole('account_profile', 'cfo'), true);
      assert.strictEqual(isTabAccessibleForRole('classroom', 'cfo'), false);
      assert.strictEqual(isTabAccessibleForRole('embed_code', 'cfo'), false);

      // 4. Administration access tests
      assert.strictEqual(isTabAccessibleForRole('applications', 'administration'), true);
      assert.strictEqual(isTabAccessibleForRole('user_management', 'administration'), true);
      assert.strictEqual(isTabAccessibleForRole('sheets_sync', 'administration'), true);
      assert.strictEqual(isTabAccessibleForRole('drive_upload', 'administration'), true);
    });

    it('verifies AdminDashboardView component integrates the Superadmin Role Switcher UI controls', () => {
      const dashboardPath = path.resolve('components/admin/AdminDashboardView.tsx');
      assert.ok(fs.existsSync(dashboardPath), 'AdminDashboardView.tsx must exist');
      const content = fs.readFileSync(dashboardPath, 'utf8');

      // Perspective switcher test ID and agent ID
      assert.ok(
        content.includes('data-testid="superadmin-role-switcher-bar"'),
        'AdminDashboardView must render superadmin-role-switcher-bar'
      );
      assert.ok(
        content.includes('data-agent-id="superadmin-role-switcher-bar"'),
        'AdminDashboardView must have data-agent-id for automated inspection'
      );

      // Select dropdown test ID and all key role options
      assert.ok(
        content.includes('data-testid="role-perspective-select"'),
        'AdminDashboardView must render role-perspective-select dropdown'
      );
      assert.ok(content.includes('value="director"'), 'Dropdown must include director role');
      assert.ok(content.includes('value="cfo"'), 'Dropdown must include cfo role');
      assert.ok(content.includes('value="teacher"'), 'Dropdown must include teacher role');
      assert.ok(content.includes('value="student"'), 'Dropdown must include student role');
      assert.ok(content.includes('value="administration"'), 'Dropdown must include administration role');
      assert.ok(content.includes('value="tech_admin"'), 'Dropdown must include tech_admin role');

      // Locked tabs toggle and Reset button
      assert.ok(
        content.includes('data-testid="toggle-locked-tabs-btn"'),
        'AdminDashboardView must render toggle-locked-tabs-btn'
      );
      assert.ok(
        content.includes('data-testid="reset-role-perspective-btn"'),
        'AdminDashboardView must render reset-role-perspective-btn'
      );

      // Role preview active banner
      assert.ok(
        content.includes('data-testid="role-preview-active-banner"'),
        'AdminDashboardView must render role-preview-active-banner'
      );

      // Tab gating integration
      assert.ok(
        content.includes('isTabAccessibleForRole'),
        'AdminDashboardView must use isTabAccessibleForRole to dynamically gate tabs'
      );
      assert.ok(
        content.includes('ADMIN_TABS.map'),
        'AdminDashboardView must map dynamically over ADMIN_TABS'
      );
    });

    it('verifies RolePermissionsManager provides responsive zero-scrollbar Matrix with tier filtering and card deck', () => {
      const matrixPath = path.resolve('components/admin/RolePermissionsManager.tsx');
      assert.ok(fs.existsSync(matrixPath), 'RolePermissionsManager.tsx must exist');
      const content = fs.readFileSync(matrixPath, 'utf8');

      // 1. Verify overflow-x-auto has been eliminated to ensure zero horizontal scrollbars
      assert.strictEqual(
        content.includes('overflow-x-auto'),
        false,
        'RolePermissionsManager must not use overflow-x-auto'
      );

      // 2. Verify all 5 matrix tiers are supported
      assert.ok(content.includes('data-testid="matrix-tier-all-btn"'), 'Must have All Roles tier button');
      assert.ok(content.includes('data-testid="matrix-tier-executive-btn"'), 'Must have Executive tier button');
      assert.ok(content.includes('data-testid="matrix-tier-operations-btn"'), 'Must have Tech & Ops tier button');
      assert.ok(content.includes('data-testid="matrix-tier-academic-btn"'), 'Must have Academic tier button');
      assert.ok(content.includes('data-testid="matrix-tier-compare-btn"'), 'Must have Side-by-Side compare tier button');

      // 3. Verify Table and Card layout toggles exist
      assert.ok(content.includes('data-testid="matrix-layout-table-btn"'), 'Must have Table layout button');
      assert.ok(content.includes('data-testid="matrix-layout-cards-btn"'), 'Must have Cards layout button');
      assert.ok(content.includes('data-testid="role-matrix-table"'), 'Must render role-matrix-table');
      assert.ok(content.includes('data-testid="role-cards-grid"'), 'Must render role-cards-grid');

      // 4. Verify confirm delete/revoke safety protocol is implemented
      assert.ok(content.includes('confirmRevokeRole'), 'Must track confirmRevokeRole state');
      assert.ok(content.includes('data-testid="confirm-revoke-btn"'), 'Must have confirm-revoke-btn');
      assert.ok(content.includes('data-testid="cancel-revoke-btn"'), 'Must have cancel-revoke-btn');

      // 5. Verify dynamic 17 system roles count and data-agent-id
      assert.ok(content.includes('data-agent-id="role-permissions-manager"'), 'Must have data-agent-id');
      assert.ok(content.includes('SYSTEM_ROLES.length'), 'Must dynamically display SYSTEM_ROLES count');
    });
  });

  describe('Suite 22: Unit Syllabi Bank Automated Synchronization & Nomenclature Standards', () => {
    it('should map CourseUnit into valid UnitDetail shape conforming to ASQA/TEQSA syllabus standards', () => {
      const customUnit = createDefaultUnit('CYBR502', 'Advanced Cloud Infrastructure Security');
      customUnit.nominalHours = 60;
      customUnit.description = 'Comprehensive vocational syllabus on zero-trust architectures and cloud compliance.';
      customUnit.performanceCriteria = [
        {
          id: 'pc-1-1',
          element: 'Element 1: Implement Zero-Trust Network Controls',
          code: '1.1',
          title: 'Design distributed firewall policies',
          description: 'Enforce perimeter-less network segmentation across hybrid cloud environments.'
        },
        {
          id: 'pc-2-1',
          element: 'Element 2: Audit Regulatory Compliance',
          code: '2.1',
          title: 'Conduct cryptographic key lifecycle review',
          description: 'Verify HSM key rotation complies with Australian Privacy Principles.'
        }
      ];

      const mapped = mapCourseUnitToUnitDetail(customUnit, 'MS-CYBR', 'Master of Cybersecurity');

      assert.strictEqual(mapped.code, 'CYBR502');
      assert.strictEqual(mapped.title, 'Advanced Cloud Infrastructure Security');
      assert.strictEqual(mapped.level, 'Postgraduate');
      assert.strictEqual(mapped.creditPoints, 6);
      assert.ok(mapped.learningOutcomes.length >= 2);
      assert.ok(mapped.learningOutcomes[0].includes('1.1 Design distributed firewall policies'));
      assert.ok(mapped.topics.length > 0);
      assert.ok(mapped.assessments.length > 0);
      assert.ok(mapped.overview.includes('CYBR502'));
    });

    it('should synchronize newly created units to Unit Syllabi Bank and retrieve them seamlessly', () => {
      const mockStorage = new Map();
      const mockEvents = [];

      global.window = {
        dispatchEvent: (event) => mockEvents.push(event)
      };
      global.localStorage = {
        getItem: (key) => mockStorage.get(key) || null,
        setItem: (key, val) => mockStorage.set(key, val)
      };
      global.CustomEvent = class CustomEvent {
        constructor(name, params) {
          this.type = name;
          this.detail = params?.detail;
        }
      };

      const testUnit = createDefaultUnit('AI601', 'Autonomous Agentic Architectures');
      const savedDetail = saveUnitToSyllabiBank(testUnit, 'MIT-AI', 'Master of Artificial Intelligence');

      assert.strictEqual(savedDetail.code, 'AI601');
      assert.strictEqual(mockEvents.length, 1);
      assert.strictEqual(mockEvents[0].type, 'edupulse_units_updated');
      assert.strictEqual(mockEvents[0].detail.unit.code, 'AI601');

      const allBankUnits = getStoredUnitSyllabi();
      const retrieved = allBankUnits.find(u => u.code === 'AI601');
      assert.ok(retrieved, 'AI601 must be present in the Unit Syllabi bank');
      assert.strictEqual(retrieved.title, 'Autonomous Agentic Architectures');

      // Test batch synchronization
      const batchUnits = [
        createDefaultUnit('DATA401', 'Applied BigQuery Analytics'),
        createDefaultUnit('WHS402', 'Statutory Workplace Risk Audit')
      ];
      syncAllUnitsToSyllabiBank(batchUnits, 'BSB41419', 'Certificate IV in WHS');
      const updatedBank = getStoredUnitSyllabi();
      assert.ok(updatedBank.some(u => u.code === 'DATA401'));
      assert.ok(updatedBank.some(u => u.code === 'WHS402'));
    });

    it('should verify UnifiedCourseBuilder has automated hooks to add and sync units to Unit Syllabi bank', () => {
      const builderPath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const builderContent = fs.readFileSync(builderPath, 'utf8');

      // Verify saveUnitToSyllabiBank and syncAllUnitsToSyllabiBank are imported and called
      assert.ok(builderContent.includes('saveUnitToSyllabiBank'), 'UnifiedCourseBuilder must import saveUnitToSyllabiBank');
      assert.ok(builderContent.includes('syncAllUnitsToSyllabiBank'), 'UnifiedCourseBuilder must import syncAllUnitsToSyllabiBank');
      assert.ok(builderContent.includes('data-testid="add-unit-btn"'), 'Must have add-unit-btn');
      assert.ok(builderContent.includes('data-testid="save-course-btn"'), 'Must have save-course-btn');
      assert.ok(builderContent.includes('saveUnitToSyllabiBank(newUnit'), 'handleAddUnit must call saveUnitToSyllabiBank');
    });

    it('should verify standardized "Unit Syllabi" terminology across Navbar, Catalog, and Admin', () => {
      const navPath = path.resolve('components/Navbar.tsx');
      const navContent = fs.readFileSync(navPath, 'utf8');
      assert.ok(navContent.includes("label: 'Unit Syllabi'"), 'Navbar must display "Unit Syllabi"');

      const catalogPath = path.resolve('components/catalog/UnitCatalogView.tsx');
      const catalogContent = fs.readFileSync(catalogPath, 'utf8');
      assert.ok(catalogContent.includes('Individual Unit Descriptions & Syllabi'), 'Catalog must show "Individual Unit Descriptions & Syllabi"');
      assert.ok(catalogContent.includes('Unit & Subject Syllabi Directory'), 'Catalog badge must show "Unit & Subject Syllabi Directory"');
      assert.ok(catalogContent.includes('getStoredUnitSyllabi'), 'Catalog must consume getStoredUnitSyllabi');
      assert.ok(catalogContent.includes('edupulse_units_updated'), 'Catalog must listen to edupulse_units_updated');

      const adminPath = path.resolve('components/admin/AdminDashboardView.tsx');
      const adminContent = fs.readFileSync(adminPath, 'utf8');
      assert.ok(adminContent.includes('Download Unit Syllabi Template (.csv)'), 'Admin CSV template button must say Unit Syllabi');
    });
  });

  describe('Suite 23: Student-Facing Course Info Panel & Enrolled Units Hub', () => {
    it('should provide structured course and units data via DEFAULT_COURSE and getStudentCourseData', () => {
      const course = getStudentCourseData();
      assert.ok(course, 'Course data must be returned');
      assert.strictEqual(course.code, 'BSB41419');
      assert.strictEqual(course.aqfLevel, 4);
      assert.strictEqual(course.frameworkCode, 'ASQA');
      assert.ok(course.units.length >= 2, 'Default course must have multiple units of competency');

      const primaryUnit = course.units[0];
      assert.strictEqual(primaryUnit.unitCode, 'BSBWHS411');
      assert.ok(primaryUnit.performanceCriteria.length >= 3, 'Must have multiple performance criteria');
      assert.ok(primaryUnit.lessons.length >= 2, 'Must have multiple weekly lessons with courseware');
      assert.ok(primaryUnit.assessments.length >= 2, 'Must have formative and summative assessments');

      // Verify 5-level rubric levels exist on assessment criteria
      const formativeCrit = primaryUnit.assessments[0].criteria[0];
      assert.strictEqual(formativeCrit.levels.length, 5, 'Criteria must have 5-level AQF rubrics');
      assert.ok(formativeCrit.competentDescriptor, 'Must have competent descriptor');
      assert.ok(formativeCrit.notYetCompetentDescriptor, 'Must have not-yet-competent descriptor');
    });

    it('should build full student-facing course data from degree catalog programs', () => {
      const bcs = COURSES_DATA.find((c) => c.code === 'CS100');
      assert.ok(bcs, 'CS100 must exist in catalog');

      const studentCourse = buildCourseDataFromCatalog(bcs);
      assert.strictEqual(studentCourse.code, 'CS100');
      assert.strictEqual(studentCourse.aqfLevel, 7);
      assert.ok(studentCourse.units.length > 0, 'Must have units mapped from coreUnits');

      const selectable = getAllSelectableCourses();
      assert.ok(selectable.length >= 5, 'Must list multiple selectable qualifications');
      assert.ok(selectable.some((s) => s.code === 'BSB41419'), 'Must include BSB41419');
      assert.ok(selectable.some((s) => s.code === 'CS100'), 'Must include CS100');
    });

    it('should verify StudentCourseInfoPanel component exists with accessible subtabs and no horizontal scrollbars', () => {
      const panelPath = path.resolve('components/student/StudentCourseInfoPanel.tsx');
      assert.ok(fs.existsSync(panelPath), 'StudentCourseInfoPanel.tsx must exist');

      const panelContent = fs.readFileSync(panelPath, 'utf8');
      assert.ok(panelContent.includes('data-agent-id="student-course-info-panel"'), 'Must have data-agent-id');
      assert.ok(panelContent.includes('data-testid="student-course-info-panel"'), 'Must have data-testid');
      assert.ok(panelContent.includes('data-testid="student-course-selector"'), 'Must have student-course-selector');
      assert.ok(panelContent.includes('data-testid="student-download-syllabus-btn"'), 'Must have download syllabus button');
      assert.ok(panelContent.includes('student-subtab-curriculum'), 'Must have curriculum subtab');
      assert.ok(panelContent.includes('student-subtab-elements'), 'Must have elements subtab');
      assert.ok(panelContent.includes('student-subtab-lessons'), 'Must have lessons subtab');
      assert.ok(panelContent.includes('student-subtab-assessments'), 'Must have assessments subtab');
      assert.ok(panelContent.includes('5-Level AQF Performance Descriptors'), 'Must display 5-level rubric descriptors');

      // Verify layout stability: zero horizontal scrollbars
      assert.strictEqual(
        panelContent.includes('overflow-x-auto'),
        false,
        'StudentCourseInfoPanel must avoid overflow-x-auto to eliminate horizontal scrollbars'
      );
    });

    it('should verify AdminDashboardView mounts StudentCourseInfoPanel for student role and admin preview', () => {
      const adminPath = path.resolve('components/admin/AdminDashboardView.tsx');
      const adminContent = fs.readFileSync(adminPath, 'utf8');

      assert.ok(adminContent.includes('StudentCourseInfoPanel'), 'AdminDashboardView must import StudentCourseInfoPanel');
      assert.ok(adminContent.includes('data-testid="student-tab-courses"'), 'Must have student-tab-courses button');
      assert.ok(adminContent.includes('data-testid="student-tab-profile"'), 'Must have student-tab-profile button');
      assert.ok(adminContent.includes('data-testid="preview-student-courses-btn"'), 'Must have preview-student-courses-btn for staff');
    });

    it('should verify UnifiedCourseBuilder renders StudentCourseInfoPanel for student role while preserving security gating', () => {
      const builderPath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const builderContent = fs.readFileSync(builderPath, 'utf8');

      assert.ok(builderContent.includes('StudentCourseInfoPanel'), 'UnifiedCourseBuilder must import StudentCourseInfoPanel');
      assert.ok(builderContent.includes('data-testid="student-course-builder-restricted"'), 'Must retain student-course-builder-restricted testid');
      assert.ok(builderContent.includes('data-testid="student-view-courses-btn"'), 'Must retain student-view-courses-btn');
      assert.ok(builderContent.includes('<StudentCourseInfoPanel'), 'Must render StudentCourseInfoPanel when isStudent is true');
    });
  });

  describe('Suite 24: Course Builder Student Unit Enrolment & CSV Bulk Import', () => {
    it('should verify registered student candidates directory and CSV headers', () => {
      assert.ok(KNOWN_STUDENT_CANDIDATES.length >= 5, 'Must have multiple known candidate students');
      assert.ok(KNOWN_STUDENT_CANDIDATES.some((c) => c.name === 'Emma Watson'), 'Must include Emma Watson');
      assert.ok(KNOWN_STUDENT_CANDIDATES.some((c) => c.name === 'Marcus Chen'), 'Must include Marcus Chen');
      assert.ok(KNOWN_STUDENT_CANDIDATES.some((c) => c.name === 'Sophia Nguyen'), 'Must include Sophia Nguyen');

      assert.ok(STUDENT_ENROLMENT_CSV_HEADERS.includes('Student Name'));
      assert.ok(STUDENT_ENROLMENT_CSV_HEADERS.includes('Student Email'));
      assert.ok(STUDENT_ENROLMENT_CSV_HEADERS.includes('Unit Code'));
      assert.ok(STUDENT_ENROLMENT_CSV_HEADERS.includes('Status'));
    });

    it('should generate valid enrolment CSV template and parse student rows accurately', () => {
      const template = generateStudentEnrolmentTemplateCsv('BSB41419', 'BSBWHS411');
      assert.ok(template.includes('"Student Name"'), 'Template must include Student Name header');
      assert.ok(template.includes('BSBWHS411'), 'Template must include target unit code');
      assert.ok(template.includes('Emma Watson'), 'Template must include sample student rows');

      const { students, errors } = parseStudentEnrolmentCsv(template, 'BSB41419', 'BSBWHS411');
      assert.strictEqual(errors.length, 0, 'Must have zero parsing errors on standard template');
      assert.ok(students.length >= 3, 'Must parse multiple student enrolments');

      const first = students[0];
      assert.strictEqual(first.studentName, 'Emma Watson');
      assert.strictEqual(first.studentEmail, 'emma.w@example.com');
      assert.strictEqual(first.unitCode, 'BSBWHS411');
      assert.strictEqual(first.status, 'Enrolled');

      // Export back to CSV
      const exportedCsv = exportStudentsToCsv(students, 'Certificate IV in Work Health and Safety');
      assert.ok(exportedCsv.includes('Emma Watson'), 'Exported CSV must contain student name');
      assert.ok(exportedCsv.includes('BSBWHS411'), 'Exported CSV must contain unit code');
    });

    it('should add, update, and remove students from a unit with enrolment helper functions', () => {
      const dummyUnit = createDefaultUnit('BSBWHS411', 'Implement WHS');
      assert.strictEqual((dummyUnit.enrolledStudents || []).length, 0, 'New unit starts empty');

      // Add a write-in student
      const { updatedUnit: u1, newStudent } = addStudentToUnit(dummyUnit, {
        studentName: 'Alex Robinson',
        studentEmail: 'alex.r@student.rto.edu.au',
        studentId: 'STU-9901',
        status: 'Enrolled'
      });

      assert.strictEqual(u1.enrolledStudents?.length, 1, 'Must have 1 enrolled student');
      assert.strictEqual(newStudent.studentName, 'Alex Robinson');
      assert.strictEqual(newStudent.unitCode, 'BSBWHS411');

      // Update same student status
      const { updatedUnit: u2 } = addStudentToUnit(u1, {
        studentName: 'Alex Robinson',
        studentEmail: 'alex.r@student.rto.edu.au',
        studentId: 'STU-9901',
        status: 'In Progress'
      });
      assert.strictEqual(u2.enrolledStudents?.length, 1, 'Must not duplicate student with same email');
      assert.strictEqual(u2.enrolledStudents?.[0].status, 'In Progress');

      // Remove student
      const { updatedUnit: u3, removedStudent } = removeStudentFromUnit(u2, newStudent.id);
      assert.strictEqual(u3.enrolledStudents?.length, 0, 'Must have 0 students after removal');
      assert.strictEqual(removedStudent?.id, newStudent.id);
    });

    it('should verify UnitStudentEnrolmentPanel component exists with dropdown, CSV upload, and zero horizontal scrollbars', () => {
      const panelPath = path.resolve('components/courseBuilder/UnitStudentEnrolmentPanel.tsx');
      assert.ok(fs.existsSync(panelPath), 'UnitStudentEnrolmentPanel.tsx must exist');

      const panelContent = fs.readFileSync(panelPath, 'utf8');
      assert.ok(panelContent.includes('data-agent-id="unit-student-enrolment-panel"'), 'Must have data-agent-id');
      assert.ok(panelContent.includes('data-testid="unit-student-enrolment-panel"'), 'Must have data-testid');
      assert.ok(panelContent.includes('data-testid="toggle-enrolment-panel-btn"'), 'Must have toggle-enrolment-panel-btn');
      assert.ok(panelContent.includes('isPanelCollapsed'), 'Must have isPanelCollapsed state');
      assert.ok(panelContent.includes('data-testid="student-dropdown-input"'), 'Must have write-in dropdown input');
      assert.ok(panelContent.includes('data-testid="student-candidates-dropdown"'), 'Must have candidates dropdown popover');
      assert.ok(panelContent.includes('data-testid="enrol-student-btn"'), 'Must have enrol-student-btn');
      assert.ok(panelContent.includes('data-testid="student-enrolment-csv-input"'), 'Must have CSV file input');
      assert.ok(panelContent.includes('data-testid="upload-student-enrolment-csv-btn"'), 'Must have upload CSV button');
      assert.ok(panelContent.includes('data-testid="download-student-enrolment-template-btn"'), 'Must have download CSV template button');
      assert.ok(panelContent.includes('data-testid="export-enrolled-students-csv-btn"'), 'Must have export CSV button');
      assert.ok(panelContent.includes('confirm-remove-student-'), 'Must have two-step confirm delete student gate');

      // Verify zero horizontal scrollbars
      assert.strictEqual(
        panelContent.includes('overflow-x-auto'),
        false,
        'UnitStudentEnrolmentPanel must avoid overflow-x-auto to eliminate horizontal scrollbars'
      );
    });

    it('should verify UnifiedCourseBuilder mounts UnitStudentEnrolmentPanel inside active unit editor and coordinates collapsible state', () => {
      const builderPath = path.resolve('components/courseBuilder/UnifiedCourseBuilder.tsx');
      const builderContent = fs.readFileSync(builderPath, 'utf8');

      assert.ok(builderContent.includes('UnitStudentEnrolmentPanel'), 'UnifiedCourseBuilder must import UnitStudentEnrolmentPanel');
      assert.ok(builderContent.includes('<UnitStudentEnrolmentPanel'), 'UnifiedCourseBuilder must render UnitStudentEnrolmentPanel');
      assert.ok(builderContent.includes('isEnrolledStudentsCollapsed'), 'Must maintain isEnrolledStudentsCollapsed state');
      assert.ok(builderContent.includes('isCollapsed={isEnrolledStudentsCollapsed}'), 'Must pass isCollapsed prop to UnitStudentEnrolmentPanel');
      assert.ok(builderContent.includes('enrolledStudents'), 'UnifiedCourseBuilder must support enrolledStudents on CourseUnit');
    });
  });
});








