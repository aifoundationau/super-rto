import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import {
  toStrictIntegerTokens,
  DEFAULT_GLOBAL_TOKEN_CONFIG
} from '@/lib/tokens/pricing';
import { addContributionToFund } from '@/lib/tokens/fund';
import { creditTokenWallet } from '@/lib/firebase/admin';

// Strict schema validation for Stripe checkout request
const StripeCheckoutRequestSchema = z.object({
  tokens: z.number().int().min(1).max(100000),
  currency: z.enum(['usd', 'aud', 'USD', 'AUD']),
  isCommunityFund: z.boolean().default(true),
  contributorName: z.string().max(120).optional(),
  contributorEmail: z.string().email().optional().or(z.literal('')),
  userId: z.string().max(128).optional(),
  note: z.string().max(500).optional()
}).strict();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = StripeCheckoutRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token purchase payload',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const {
      tokens,
      currency: rawCurrency,
      isCommunityFund,
      contributorName,
      contributorEmail,
      userId,
      note
    } = parseResult.data;

    const strictTokens = toStrictIntegerTokens(tokens);
    const currency = rawCurrency.toLowerCase() as 'usd' | 'aud';
    const isAud = currency === 'aud';

    const unitPrice = isAud
      ? DEFAULT_GLOBAL_TOKEN_CONFIG.tokenPriceAud
      : DEFAULT_GLOBAL_TOKEN_CONFIG.tokenPriceUsd;

    const totalFiat = Number((strictTokens * unitPrice).toFixed(2));
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // Detect if we have a real Stripe Secret Key configured
    const isRealStripeKey = Boolean(
      stripeKey &&
      stripeKey.startsWith('sk_') &&
      !stripeKey.includes('your_key') &&
      !stripeKey.includes('placeholder')
    );

    // Get origin host for success/cancel redirects
    const host = req.headers.get('host') || 'localhost:3005';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${proto}://${host}`;

    if (isRealStripeKey && stripeKey) {
      const stripe = new Stripe(stripeKey, {
        apiVersion: '2025-02-24.acacia' as any
      });

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: isCommunityFund
                  ? `${strictTokens} Tokens — Accumulated Community Token Fund`
                  : `${strictTokens} EduPulse AI Learning Credits`,
                description: isCommunityFund
                  ? `Community token contribution to subsidize AI vocational & higher education credits for disadvantaged learners.`
                  : `Computational tokens for course synthesis, automated rubrics, and RAG vector searches.`,
                images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80']
              },
              unit_amount: Math.round(unitPrice * 100) // Stripe requires amount in smallest currency unit (cents)
            },
            quantity: strictTokens
          }
        ],
        mode: 'payment',
        customer_email: contributorEmail || undefined,
        success_url: `${baseUrl}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}&tokens=${strictTokens}&currency=${currency.toUpperCase()}`,
        cancel_url: `${baseUrl}/?payment_cancelled=true`,
        metadata: {
          tokens: String(strictTokens),
          currency: currency.toUpperCase(),
          isCommunityFund: String(isCommunityFund),
          contributorName: contributorName || 'Anonymous Supporter',
          userId: userId || '',
          note: note || ''
        }
      });

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url,
        isDemoMode: false,
        tokens: strictTokens,
        currency: currency.toUpperCase(),
        totalFiat
      });
    }

    // DEMO / TEST SANDBOX FALLBACK
    // If Stripe credentials are not yet configured in local environment, provide seamless
    // interactive testing that increments the accumulated token fund and simulates payment.
    const mockSessionId = `mock_cs_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Execute Firestore Token Crediting:
    // If isCommunityFund: credits the ONE Superadmin Shared Token Account in Firestore.
    // If personal purchase: credits user's account in Firestore.
    const creditResult = await creditTokenWallet({
      tokens: strictTokens,
      userId: userId || undefined,
      userEmail: contributorEmail || undefined,
      isCommunityFund,
      contributorName: contributorName || 'Anonymous Supporter',
      fiatAmount: totalFiat,
      currency: currency.toUpperCase(),
      stripeSessionId: mockSessionId,
      note
    });

    if (isCommunityFund) {
      addContributionToFund({
        tokens: strictTokens,
        currency: currency.toUpperCase() as 'USD' | 'AUD',
        fiatAmount: totalFiat,
        contributorName: contributorName || 'Anonymous Supporter',
        contributorEmail: contributorEmail || undefined,
        isAnonymous: !contributorName || contributorName.toLowerCase().includes('anonymous'),
        note,
        stripeSessionId: mockSessionId,
        targetAllocation: 'COMMUNITY_FUND'
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: mockSessionId,
      checkoutUrl: null,
      isDemoMode: true,
      tokens: strictTokens,
      currency: currency.toUpperCase(),
      totalFiat,
      walletId: creditResult.targetWallet,
      newBalance: creditResult.newBalance,
      message: creditResult.targetWallet === 'superadmin_shared'
        ? `Tokens successfully credited directly to the Superadmin Accumulated Token Fund (${creditResult.targetWallet}).`
        : `Tokens successfully credited to your personal account (${creditResult.targetWallet}).`,
      instructions: 'To process live credit cards with Stripe, configure STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local.'
    });
  } catch (error: any) {
    console.error('[Stripe Checkout API] Error generating checkout session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal error creating Stripe checkout session'
      },
      { status: 500 }
    );
  }
}
