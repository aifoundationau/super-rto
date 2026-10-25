import { describe, it } from 'node:test';
import assert from 'node:assert';

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
  createDefaultRubricLevels,
  parseCsvLine,
  generateRubricsTemplateCsv,
  parseRubricsCsv,
  exportAssessmentsToCsv
} from '../lib/courseBuilder/rubrics.ts';

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

    it('should generate 5 fully populated rubric levels for a given criterion', () => {
      const levels = createDefaultRubricLevels('Hazard Identification');
      assert.strictEqual(levels.length, 5);
      levels.forEach((lvl, idx) => {
        assert.strictEqual(lvl.level, idx + 1);
        assert.strictEqual(lvl.label, DEFAULT_RUBRIC_LEVEL_NAMES[idx]);
        assert.ok(lvl.descriptor.length > 20, `Level ${idx + 1} must have a non-trivial descriptor`);
        assert.ok(lvl.descriptor.includes('Hazard Identification'));
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

});
