/**
 * Super-RTO Accumulated Token Fund & Currency Engine
 * 
 * Directives:
 * 1. Tokens are strictly integers: Math.round() on all values (no fractions/decimals).
 * 2. Geolocation dictates currency:
 *    - Australia: 1 Token = $1.54 AUD (includes GST compliance)
 *    - Global/International: 1 Token = $1.00 USD
 * 3. Public/Unregistered Contributions:
 *    - Anyone can contribute to the Accumulated Token Fund without registering or creating an account.
 * 4. Presets:
 *    - 50, 100, 500, 1000, and Custom token purchase options.
 * 5. Stripe as Payment Gateway:
 *    - Connected to Stripe Checkout Session API.
 */

import {
  DEFAULT_GLOBAL_TOKEN_CONFIG,
  toStrictIntegerTokens,
  calculateFiatForTokens
} from './pricing.ts';
import type { TokenCurrencyConfig } from './pricing.ts';

export const TOKEN_PURCHASE_PRESETS = [50, 100, 500, 1000] as const;

export type TokenPreset = typeof TOKEN_PURCHASE_PRESETS[number];

export interface TokenFundContribution {
  id: string;
  tokens: number; // Strict integer
  currency: 'USD' | 'AUD';
  fiatAmount: number;
  contributorName: string;
  contributorEmail?: string;
  isAnonymous: boolean;
  note?: string;
  createdAt: string;
  stripeSessionId?: string;
  status: 'completed' | 'pending';
  targetAllocation: 'COMMUNITY_FUND' | 'SELF' | 'UNREGISTERED_ESCROW';
}

export interface AccumulatedTokenFundState {
  totalTokensInFund: number;
  totalContributionsCount: number;
  lastUpdated: string;
  recentContributions: TokenFundContribution[];
}

// Initial seeded community fund with realistic active student subsidy pool
export const INITIAL_COMMUNITY_TOKEN_FUND: AccumulatedTokenFundState = {
  totalTokensInFund: 18450,
  totalContributionsCount: 142,
  lastUpdated: '2026-10-26T00:00:00.000Z',
  recentContributions: [
    {
      id: 'contrib-seed-001',
      tokens: 1000,
      currency: 'AUD',
      fiatAmount: 1540.00,
      contributorName: 'Sydney EdTech Foundation',
      isAnonymous: false,
      note: 'Subsidizing 2026 Indigenous and Regional VET learners',
      createdAt: '2026-10-25T14:30:00.000Z',
      status: 'completed',
      targetAllocation: 'COMMUNITY_FUND'
    },
    {
      id: 'contrib-seed-002',
      tokens: 500,
      currency: 'USD',
      fiatAmount: 500.00,
      contributorName: 'Anonymous Alumni',
      isAnonymous: true,
      note: 'Open token access for AI course building',
      createdAt: '2026-10-25T09:15:00.000Z',
      status: 'completed',
      targetAllocation: 'COMMUNITY_FUND'
    },
    {
      id: 'contrib-seed-003',
      tokens: 100,
      currency: 'AUD',
      fiatAmount: 154.00,
      contributorName: 'Community Sponsor',
      isAnonymous: false,
      note: 'For regional nurse and aged care student modules',
      createdAt: '2026-10-24T18:40:00.000Z',
      status: 'completed',
      targetAllocation: 'COMMUNITY_FUND'
    }
  ]
};

// In-memory fund state for fast reactive rendering and server routes
let currentFundState: AccumulatedTokenFundState = { ...INITIAL_COMMUNITY_TOKEN_FUND };

/**
 * Retrieves current accumulated token fund pool.
 */
export function getAccumulatedFundState(): AccumulatedTokenFundState {
  return currentFundState;
}

/**
 * Adds an unregistered or registered token contribution to the accumulated fund pool.
 */
export function addContributionToFund(
  contribution: Omit<TokenFundContribution, 'id' | 'createdAt' | 'status'> & { id?: string; createdAt?: string }
): TokenFundContribution {
  const strictTokens = toStrictIntegerTokens(contribution.tokens);
  if (strictTokens <= 0) {
    throw new Error('Token contribution must be a positive whole integer');
  }

  const record: TokenFundContribution = {
    id: contribution.id || `contrib-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    tokens: strictTokens,
    currency: contribution.currency,
    fiatAmount: Number(contribution.fiatAmount.toFixed(2)),
    contributorName: contribution.isAnonymous
      ? 'Anonymous Supporter'
      : (contribution.contributorName?.trim() || 'Anonymous Supporter'),
    contributorEmail: contribution.contributorEmail,
    isAnonymous: contribution.isAnonymous,
    note: contribution.note?.trim(),
    createdAt: contribution.createdAt || new Date().toISOString(),
    stripeSessionId: contribution.stripeSessionId,
    status: 'completed',
    targetAllocation: contribution.targetAllocation || 'COMMUNITY_FUND'
  };

  currentFundState = {
    totalTokensInFund: currentFundState.totalTokensInFund + strictTokens,
    totalContributionsCount: currentFundState.totalContributionsCount + 1,
    lastUpdated: new Date().toISOString(),
    recentContributions: [record, ...currentFundState.recentContributions].slice(0, 20)
  };

  return record;
}

/**
 * Geolocation currency detection:
 * Checks whether visitor is in Australia via browser timezone, language locales,
 * or provided overrides.
 */
export function isUserInAustralia(timeZoneOverride?: string, countryCodeOverride?: string): boolean {
  if (countryCodeOverride) {
    return countryCodeOverride.toUpperCase() === 'AU' || countryCodeOverride.toUpperCase() === 'AUS';
  }

  let tz = timeZoneOverride;
  if (!tz && typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      tz = '';
    }
  }

  if (tz) {
    const lower = tz.toLowerCase();
    if (
      lower.startsWith('australia/') ||
      lower === 'australia/sydney' ||
      lower === 'australia/melbourne' ||
      lower === 'australia/brisbane' ||
      lower === 'australia/perth' ||
      lower === 'australia/adelaide' ||
      lower === 'australia/hobart' ||
      lower === 'australia/darwin' ||
      lower === 'antarctica/macquarie' ||
      lower === 'indian/christmas' ||
      lower === 'indian/cocos'
    ) {
      return true;
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('edupulse_geo_country');
      if (stored && (stored.toUpperCase() === 'AU' || stored.toLowerCase() === 'australia')) {
        return true;
      }
      const navLang = navigator.language || (navigator.languages && navigator.languages[0]);
      if (navLang && (navLang.toLowerCase() === 'en-au' || navLang.endsWith('-AU'))) {
        return true;
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  return false;
}

/**
 * Determines primary display currency & unit token price based on geolocation.
 */
export function getLocalizedTokenPricing(
  userInAustralia: boolean,
  config: TokenCurrencyConfig = DEFAULT_GLOBAL_TOKEN_CONFIG
): {
  currency: 'AUD' | 'USD';
  tokenPrice: number;
  currencySymbol: string;
  priceFormatted: string;
  isAustralia: boolean;
  rateDescription: string;
} {
  if (userInAustralia && config.isAudEnabled) {
    return {
      currency: 'AUD',
      tokenPrice: config.tokenPriceAud,
      currencySymbol: '$',
      priceFormatted: `$${config.tokenPriceAud.toFixed(2)} AUD`,
      isAustralia: true,
      rateDescription: `1 Token = $${config.tokenPriceAud.toFixed(2)} AUD (Australian GST inclusive)`
    };
  }

  return {
    currency: 'USD',
    tokenPrice: config.tokenPriceUsd,
    currencySymbol: '$',
    priceFormatted: `$${config.tokenPriceUsd.toFixed(2)} USD`,
    isAustralia: false,
    rateDescription: `1 Token = $${config.tokenPriceUsd.toFixed(2)} USD (Global standard rate)`
  };
}

/**
 * Calculates purchase price for a package or custom token count.
 */
export function computeTokenPackageTotal(
  tokens: number,
  currency: 'USD' | 'AUD',
  config: TokenCurrencyConfig = DEFAULT_GLOBAL_TOKEN_CONFIG
): {
  tokens: number;
  currency: 'USD' | 'AUD';
  unitPrice: number;
  totalFiat: number;
  totalFormatted: string;
  dualTooltip: string;
} {
  const safeTokens = toStrictIntegerTokens(tokens);
  const totalFiat = calculateFiatForTokens(safeTokens, currency, config);
  const unitPrice = currency === 'USD' ? config.tokenPriceUsd : config.tokenPriceAud;

  const usdTotal = (safeTokens * config.tokenPriceUsd).toFixed(2);
  const audTotal = (safeTokens * config.tokenPriceAud).toFixed(2);

  return {
    tokens: safeTokens,
    currency,
    unitPrice,
    totalFiat,
    totalFormatted: `$${totalFiat.toFixed(2)} ${currency}`,
    dualTooltip: `$${usdTotal} USD / $${audTotal} AUD`
  };
}

/**
 * Token System Explanation Details for UI and User Education
 */
export const TOKEN_SYSTEM_EXPLANATION = {
  title: 'EduPulse AI Token System',
  subtitle: 'Decentralized Computational & Learning Credits for Vocational & Higher Education',
  description:
    'Tokens (🪙) represent strictly whole-integer computational credits that power the autonomous AI features across Super-RTO. They enable institutions, educators, and learners to generate compliant ASQA/TEQSA courses, run forensic document authentications, and receive instant rubric assessments.',
  pricingSummary: {
    aud: '$1.54 AUD per Token (Australian Domestic Rate)',
    usd: '$1.00 USD per Token (International Standard Rate)',
    rule: 'Geolocation automatically detects your country: Australian visitors see pricing in AUD, while international visitors see USD. All token amounts are strictly integers (no fractional tokens).'
  },
  communityFund: {
    headline: 'Accumulated Community Token Fund (No Account Required)',
    description:
      'Anyone—whether an individual supporter, philanthropist, alum, or industry partner—can add tokens to the Accumulated Token Fund without registering or signing in. Contributed tokens subsidize free AI learning credits for disadvantaged learners, regional students, and open vocational workshops.',
    unregisteredBadge: '100% Open Access • No Sign-In or Registration Required'
  },
  useCases: [
    {
      title: 'AI Curriculum Ingestion & Course Synthesis',
      cost: '10 🪙 per Unit',
      detail: 'Synthesize full 14–15 week semester or 1–4 week bootcamps, Elements of Competency, and Performance Criteria.'
    },
    {
      title: 'Automated 5-Level Rubric Grading',
      cost: '2 🪙 per Submission',
      detail: 'AI-assisted formative and summative rubric scoring aligned with Australian Quality Framework (AQF).'
    },
    {
      title: 'Cloud Vector Knowledge Retrieval (RAG)',
      cost: '1 🪙 per 50 Queries',
      detail: 'Semantic search across training.gov.au packages, unit syllabi, and regulatory compliance standards.'
    },
    {
      title: 'Admissions Document Forensic Verification',
      cost: '5 🪙 per Document',
      detail: 'Multi-factor ID verification and Google Drive archive auditing for applicant credentials.'
    }
  ]
};
