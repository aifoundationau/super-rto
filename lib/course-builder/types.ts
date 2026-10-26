/**
 * Super-RTO Course Builder Types & Data Contracts
 */

export interface AssessmentItem {
  id: string;
  title: string;
  type: 'formative' | 'summative' | 'diagnostic' | 'holistic';
  weight: number; // Percentage (e.g. 50)
  dueDate?: string;
  rubricId?: string;
  examNumber?: number;
}

export interface UnitDocument {
  id: string;
  code: string;
  title: string;
  nominalHours: number;
  programId?: string;
  aqfLevel?: number;
  performanceCriteria?: Array<{
    id: string;
    element: string;
    description: string;
  }>;
  assessments?: AssessmentItem[];
  lessons?: any[];
  status?: 'draft' | 'under_review' | 'approved' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgramDocument {
  id: string;
  code: string;
  title: string;
  aqfLevel: number;
  tokenCost?: number;
  description?: string;
  governingFaculty?: string;
  schoolDepartment?: string;
  deliveryMode?: string;
  units?: UnitDocument[];
  complianceFramework?: string;
  status?: 'draft' | 'under_review' | 'approved' | 'published';
  createdAt?: string;
  updatedAt?: string;
  versions?: string[];
}

export interface TenantConfig {
  tenantId: string;
  tenantName: string;
  defaultCompliance: 'ASQA' | 'TEQSA' | 'VRQA';
  isTokenSystemEnabled: boolean;
  isAudEnabled: boolean;
  isUsdEnabled: boolean;
  tokensPerAud: number;
  tokensPerUsd: number;
}
