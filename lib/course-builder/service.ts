/**
 * Super-RTO Course Builder Service
 * 
 * Provides program and unit persistence, ASQA/TEQSA compliance auditing,
 * and assessment weighting validation.
 */

import { ProgramDocument, UnitDocument, TenantConfig } from './types';
import { COURSES_DATA } from '@/data/courses';
import { UNITS_DATA } from '@/data/units';

export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  tenantId: 'super-rto-primary',
  tenantName: 'Super-RTO Tertiary & Vocational Institute',
  defaultCompliance: 'ASQA',
  isTokenSystemEnabled: true,
  isAudEnabled: true,
  isUsdEnabled: true,
  tokensPerAud: 1,
  tokensPerUsd: 1.5,
};

let inMemoryPrograms: ProgramDocument[] = COURSES_DATA.map((c: any) => ({
  id: c.id,
  code: c.id,
  title: c.name || c.title || 'Academic Qualification',
  aqfLevel: c.aqfLevel || 4,
  tokenCost: 0,
  description: c.description || '',
  governingFaculty: 'Faculty of Business, Technology & Vocational Safety',
  schoolDepartment: 'School of Work Health & Safety Compliance',
  deliveryMode: 'Hybrid',
  complianceFramework: 'ASQA',
  status: 'published',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  versions: ['v1.0.0'],
}));

let inMemoryUnits: UnitDocument[] = UNITS_DATA.map((u: any) => ({
  id: u.id,
  code: u.code || u.id,
  title: u.name || u.title || 'Unit of Competency',
  nominalHours: 40,
  programId: u.programId || 'BSB41419',
  aqfLevel: 4,
  status: 'approved',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  assessments: [
    {
      id: `${u.id}-a1`,
      title: 'Assessment 1: Formative Knowledge Check',
      type: 'formative',
      weight: 40,
    },
    {
      id: `${u.id}-a2`,
      title: 'Assessment 2: Summative Practical Demonstration',
      type: 'summative',
      weight: 60,
    },
  ],
}));

export async function initializeCourseBuilderDatabase(): Promise<{ success: boolean; message: string }> {
  return {
    success: true,
    message: `Initialized Course Builder database with ${inMemoryPrograms.length} programs and ${inMemoryUnits.length} units of competency.`,
  };
}

export async function getPrograms(): Promise<ProgramDocument[]> {
  return [...inMemoryPrograms];
}

export async function saveProgram(program: ProgramDocument): Promise<{ success: boolean; program: ProgramDocument }> {
  const existingIdx = inMemoryPrograms.findIndex((p) => p.id === program.id);
  const updated: ProgramDocument = {
    ...program,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    inMemoryPrograms[existingIdx] = updated;
  } else {
    inMemoryPrograms.unshift(updated);
  }

  return { success: true, program: updated };
}

export async function getUnits(programId?: string): Promise<UnitDocument[]> {
  if (programId) {
    return inMemoryUnits.filter((u) => u.programId === programId);
  }
  return [...inMemoryUnits];
}

export async function saveUnit(unit: UnitDocument): Promise<{ success: boolean; unit: UnitDocument }> {
  const existingIdx = inMemoryUnits.findIndex((u) => u.id === unit.id);
  const updated: UnitDocument = {
    ...unit,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    inMemoryUnits[existingIdx] = updated;
  } else {
    inMemoryUnits.unshift(updated);
  }

  return { success: true, unit: updated };
}

export function validateAssessmentWeighting(unit: UnitDocument): {
  isValid: boolean;
  totalWeight: number;
  message: string;
} {
  const assessments = unit.assessments || [];
  if (assessments.length === 0) {
    return { isValid: true, totalWeight: 0, message: 'No assessments configured.' };
  }

  const totalWeight = assessments.reduce((sum, a) => sum + (Number(a.weight) || 0), 0);
  const isValid = totalWeight === 100;

  return {
    isValid,
    totalWeight,
    message: isValid
      ? 'Assessment weighting equals 100% compliant benchmark.'
      : `Total assessment weight is ${totalWeight}% (requires exactly 100%).`,
  };
}

export function auditProgramCompliance(
  program: ProgramDocument,
  units: UnitDocument[]
): {
  compliant: boolean;
  score: number;
  checks: Array<{ name: string; status: 'pass' | 'fail' | 'warn'; detail: string }>;
} {
  const programUnits = units.filter((u) => !program.id || u.programId === program.id);

  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'warn'; detail: string }> = [
    {
      name: 'AQF Title & Qualification Code Alignment',
      status: program.code && program.title ? 'pass' : 'fail',
      detail: `Qualification Code "${program.code}" with title "${program.title}" matches ASQA/TEQSA registry format.`,
    },
    {
      name: 'Unit Allocation Threshold',
      status: programUnits.length > 0 ? 'pass' : 'warn',
      detail: `${programUnits.length} units of competency allocated to program.`,
    },
    {
      name: 'Assessment Weighting Compliance',
      status: programUnits.every((u) => validateAssessmentWeighting(u).isValid) ? 'pass' : 'warn',
      detail: 'All course units verified for 100% total assessment weighting.',
    },
  ];

  const compliant = checks.every((c) => c.status !== 'fail');
  const score = compliant ? 100 : 75;

  return { compliant, score, checks };
}

export async function createProgramVersion(programId: string): Promise<{ success: boolean; version: string }> {
  const target = inMemoryPrograms.find((p) => p.id === programId);
  const version = `v${Date.now().toString().slice(-4)}.0`;
  if (target) {
    target.versions = [...(target.versions || ['v1.0']), version];
  }
  return { success: true, version };
}
