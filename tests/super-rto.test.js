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
  isSuperAdmin
} from '../lib/auth/roles.ts';

import {
  DEFAULT_ROLE_PERMISSIONS,
  roleHasPermission
} from '../lib/auth/permissions.ts';

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
  createPerformanceCriterion
} from '../lib/courseBuilder/units.ts';

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

});





