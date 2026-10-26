import { NextRequest, NextResponse } from 'next/server';
import { getUserTokenBalance, getSuperadminSharedWallet } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const userEmail = searchParams.get('userEmail') || undefined;

    const balanceInfo = await getUserTokenBalance({ userId, userEmail });

    return NextResponse.json({
      success: true,
      tokenBalance: balanceInfo.tokenBalance,
      balance: balanceInfo.balance,
      isSuperAdmin: balanceInfo.isSuperadminWallet,
      isSuperadminWallet: balanceInfo.isSuperadminWallet,
      isSharedWallet: balanceInfo.isSharedWallet,
      walletId: balanceInfo.walletId
    });
  } catch (err: any) {
    console.error('[Token Balance API] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error retrieving token balance' },
      { status: 500 }
    );
  }
}
