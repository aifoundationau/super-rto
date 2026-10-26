import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { spendTokens } from '@/lib/firebase/admin';
import { toStrictIntegerTokens } from '@/lib/tokens/pricing';

const SpendTokensRequestSchema = z.object({
  tokens: z.number().int().min(1),
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  action: z.string().min(1),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional()
}).strict();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = SpendTokensRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid spend tokens payload',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const {
      tokens,
      userId,
      userEmail,
      action,
      reason,
      metadata
    } = parseResult.data;

    const strictTokens = toStrictIntegerTokens(tokens);

    const result = await spendTokens({
      tokens: strictTokens,
      userId,
      userEmail,
      action,
      reason,
      metadata
    });

    return NextResponse.json({
      success: true,
      spentTokens: result.spentTokens,
      remainingBalance: result.remainingBalance,
      walletId: result.walletId,
      transactionId: result.transactionId
    });
  } catch (err: any) {
    console.warn('[Spend Tokens API] Error:', err.message);
    const isInsufficient = err.message && err.message.includes('Insufficient tokens');

    return NextResponse.json(
      {
        success: false,
        error: isInsufficient ? 'INSUFFICIENT_TOKENS' : err.message,
        message: err.message
      },
      { status: isInsufficient ? 402 : 500 }
    );
  }
}
