import { NextRequest, NextResponse } from 'next/server';
import { getAccumulatedFundState, addContributionToFund } from '@/lib/tokens/fund';
import { creditTokenWallet, getSuperadminSharedWallet } from '@/lib/firebase/admin';
import { toStrictIntegerTokens } from '@/lib/tokens/pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  const fundState = getAccumulatedFundState();
  const superadminWallet = await getSuperadminSharedWallet();
  return NextResponse.json({
    success: true,
    data: {
      ...fundState,
      totalTokensInFund: superadminWallet.tokenBalance
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tokens = toStrictIntegerTokens(body.tokens);
    if (tokens <= 0) {
      return NextResponse.json(
        { success: false, error: 'Tokens must be a positive integer' },
        { status: 400 }
      );
    }

    // Credits the superadmin token account (token_wallets/superadmin_shared)
    const creditResult = await creditTokenWallet({
      tokens,
      currency: (body.currency || 'AUD').toUpperCase(),
      fiatAmount: Number(body.fiatAmount) || 0,
      contributorName: body.contributorName || 'Anonymous Supporter',
      userEmail: body.contributorEmail,
      isCommunityFund: true,
      stripeSessionId: body.stripeSessionId,
      note: body.note
    });

    const contribution = addContributionToFund({
      tokens,
      currency: (body.currency || 'AUD').toUpperCase() as 'AUD' | 'USD',
      fiatAmount: Number(body.fiatAmount) || 0,
      contributorName: body.contributorName || 'Anonymous Supporter',
      contributorEmail: body.contributorEmail,
      isAnonymous: Boolean(body.isAnonymous),
      note: body.note,
      stripeSessionId: body.stripeSessionId,
      targetAllocation: 'COMMUNITY_FUND'
    });

    return NextResponse.json({
      success: true,
      contribution,
      creditResult,
      updatedFund: {
        ...getAccumulatedFundState(),
        totalTokensInFund: creditResult.newBalance
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error processing fund contribution' },
      { status: 500 }
    );
  }
}

