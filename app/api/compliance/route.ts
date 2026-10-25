import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { COMPLIANCE_FRAMEWORKS, listAllFrameworks } from '@/lib/compliance/frameworks';

const ComplianceUpdateRequestSchema = z.object({
  institutionId: z.string().min(1),
  primaryFramework: z.string(),
  secondaryFramework: z.string(),
  additionalFrameworks: z.array(z.string()).default([]),
  assessmentGradingType: z.enum(['COMPETENCY_C_NYC', 'FOUR_TIER_RUBRIC', 'PERCENTAGE_GPA']).default('COMPETENCY_C_NYC')
}).strict();

// In-memory institution compliance storage fallback
const institutionComplianceMap: Record<string, any> = {
  'inst-default-college': {
    institutionId: 'inst-default-college',
    institutionName: 'Oxford International College',
    primaryFramework: 'ASQA',
    secondaryFramework: 'TEQSA',
    additionalFrameworks: [],
    assessmentGradingType: 'COMPETENCY_C_NYC',
    updatedAt: new Date().toISOString()
  }
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get('institutionId') || 'inst-default-college';

    const config = institutionComplianceMap[institutionId] || {
      institutionId,
      primaryFramework: 'ASQA',
      secondaryFramework: 'TEQSA',
      additionalFrameworks: [],
      assessmentGradingType: 'COMPETENCY_C_NYC'
    };

    return NextResponse.json({
      success: true,
      config,
      availableFrameworks: listAllFrameworks()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch compliance frameworks' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const idempotencyKey = req.headers.get('x-idempotency-key');
    const body = await req.json();

    const parsed = ComplianceUpdateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    institutionComplianceMap[data.institutionId] = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      config: institutionComplianceMap[data.institutionId],
      idempotencyKey: idempotencyKey || null
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update compliance settings' },
      { status: 500 }
    );
  }
}
