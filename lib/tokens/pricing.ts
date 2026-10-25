/**
 * Super-RTO Dual-Panel Token & Multi-Currency Engine
 * 
 * Directives:
 * 1. Tokens are strictly integers: Math.round() on all token values (no fractions/decimals).
 * 2. Dual Panel:
 *    - Base USD: Enter price in USD for 1 token -> secondary panel calculates AUD equivalent.
 *    - Base AUD: Enter price in AUD for 1 token -> secondary panel calculates USD equivalent.
 * 3. Scope & Defaults:
 *    - Superadmin defines system-wide global defaults.
 *    - Directors (College/University senior management) can configure institutional defaults.
 * 4. UI Visibility:
 *    - Token icon & amount displayed prominently on items.
 *    - AUD/USD prices displayed strictly on hover.
 *    - AUD displays strictly to visitors located in Australia (via geolocation check).
 *    - Currencies are independently toggleable: isTokenSystemEnabled, isAudEnabled, isUsdEnabled.
 */

export interface TokenCurrencyConfig {
  scope: 'GLOBAL' | 'INSTITUTION';
  institutionId?: string;
  configuredByRole: 'superadmin' | 'director';
  configuredByName?: string;
  
  // Base currency selection: 'USD' or 'AUD'
  baseCurrency: 'USD' | 'AUD';
  
  // Token prices per 1 token
  tokenPriceUsd: number;
  tokenPriceAud: number;
  exchangeRateUsdToAud: number; // e.g. 1.54 (1 USD = 1.54 AUD)
  
  // Independent currency toggles
  isTokenSystemEnabled: boolean;
  isAudEnabled: boolean;
  isUsdEnabled: boolean;
  
  // System operational token fees (Strict whole integers)
  dailyAccessCostTokens: number;
  aiCourseAssistCostTokens: number;
  
  updatedAt: string;
}

export const DEFAULT_EXCHANGE_RATE_USD_TO_AUD = 1.54;

export const DEFAULT_GLOBAL_TOKEN_CONFIG: TokenCurrencyConfig = {
  scope: 'GLOBAL',
  configuredByRole: 'superadmin',
  configuredByName: 'Super Admin',
  baseCurrency: 'USD',
  tokenPriceUsd: 1.00,
  tokenPriceAud: 1.54,
  exchangeRateUsdToAud: DEFAULT_EXCHANGE_RATE_USD_TO_AUD,
  isTokenSystemEnabled: true,
  isAudEnabled: true,
  isUsdEnabled: true,
  dailyAccessCostTokens: 1,
  aiCourseAssistCostTokens: 10,
  updatedAt: new Date().toISOString()
};

/**
 * Recalculates dual currency panel prices when base currency or base price changes.
 */
export function computeDualPanelPrices(
  baseCurrency: 'USD' | 'AUD',
  basePrice: number,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE_USD_TO_AUD
): { tokenPriceUsd: number; tokenPriceAud: number } {
  const safeRate = exchangeRate > 0 ? exchangeRate : DEFAULT_EXCHANGE_RATE_USD_TO_AUD;
  const safeBase = Math.max(0.01, Number(basePrice) || 1.0);

  if (baseCurrency === 'USD') {
    const usd = Number(safeBase.toFixed(2));
    const aud = Number((usd * safeRate).toFixed(2));
    return { tokenPriceUsd: usd, tokenPriceAud: aud };
  } else {
    const aud = Number(safeBase.toFixed(2));
    const usd = Number((aud / safeRate).toFixed(2));
    return { tokenPriceUsd: usd, tokenPriceAud: aud };
  }
}

/**
 * Strictly rounds any token calculation to whole integers.
 */
export function toStrictIntegerTokens(rawAmount: number): number {
  if (isNaN(rawAmount) || rawAmount < 0) return 0;
  return Math.round(rawAmount);
}

/**
 * Calculates fiat price for a given whole token count.
 */
export function calculateFiatForTokens(
  tokens: number,
  currency: 'USD' | 'AUD',
  config: TokenCurrencyConfig = DEFAULT_GLOBAL_TOKEN_CONFIG
): number {
  const safeTokens = toStrictIntegerTokens(tokens);
  const rate = currency === 'USD' ? config.tokenPriceUsd : config.tokenPriceAud;
  return Number((safeTokens * rate).toFixed(2));
}

/**
 * Formats token display badge: e.g. "10 🪙"
 */
export function formatTokenPill(tokens: number): string {
  return `${toStrictIntegerTokens(tokens)} 🪙`;
}

/**
 * Generates the strictly hover-only price tooltip per global directives.
 * AUD is only shown if isAudEnabled AND user is located in Australia.
 * USD is shown if isUsdEnabled.
 */
export function getHoverPricingTooltip(
  tokens: number,
  config: TokenCurrencyConfig = DEFAULT_GLOBAL_TOKEN_CONFIG,
  userInAustralia: boolean = true
): string {
  const safeTokens = toStrictIntegerTokens(tokens);
  const parts: string[] = [];

  if (config.isUsdEnabled) {
    const usd = (safeTokens * config.tokenPriceUsd).toFixed(2);
    parts.push(`$${usd} USD`);
  }

  if (config.isAudEnabled && userInAustralia) {
    const aud = (safeTokens * config.tokenPriceAud).toFixed(2);
    parts.push(`$${aud} AUD`);
  }

  if (parts.length === 0) {
    return `${safeTokens} Tokens`;
  }

  return parts.join(' / ');
}
