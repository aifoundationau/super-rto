'use client';

import React, { useState, useEffect } from 'react';
import {
  Coins,
  DollarSign,
  ArrowRightLeft,
  Settings,
  ShieldCheck,
  Building2,
  CheckCircle2,
  HelpCircle,
  Eye,
  Globe
} from 'lucide-react';
import {
  TokenCurrencyConfig,
  DEFAULT_GLOBAL_TOKEN_CONFIG,
  computeDualPanelPrices,
  toStrictIntegerTokens,
  getHoverPricingTooltip
} from '@/lib/tokens/pricing';

interface DualCurrencyTokenPanelProps {
  currentUserRole?: string;
  institutionId?: string;
  institutionName?: string;
  initialConfig?: TokenCurrencyConfig;
  onSave?: (config: TokenCurrencyConfig) => Promise<void> | void;
}

export const DualCurrencyTokenPanel: React.FC<DualCurrencyTokenPanelProps> = ({
  currentUserRole = 'superadmin',
  institutionId = 'inst-default-college',
  institutionName = 'Australasian Institute of Technology',
  initialConfig = DEFAULT_GLOBAL_TOKEN_CONFIG,
  onSave
}) => {
  const isSuperAdmin = currentUserRole === 'superadmin';
  const isDirector = currentUserRole === 'director' || isSuperAdmin;

  const [selectedScope, setSelectedScope] = useState<'GLOBAL' | 'INSTITUTION'>(
    isSuperAdmin ? 'GLOBAL' : 'INSTITUTION'
  );

  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'AUD'>(initialConfig.baseCurrency || 'USD');
  const [basePriceInput, setBasePriceInput] = useState<string>(
    String(initialConfig.baseCurrency === 'USD' ? initialConfig.tokenPriceUsd : initialConfig.tokenPriceAud)
  );
  const [exchangeRate, setExchangeRate] = useState<string>(
    String(initialConfig.exchangeRateUsdToAud || 1.54)
  );

  const [computedUsd, setComputedUsd] = useState<number>(initialConfig.tokenPriceUsd || 1.00);
  const [computedAud, setComputedAud] = useState<number>(initialConfig.tokenPriceAud || 1.54);

  const [isTokenSystemEnabled, setIsTokenSystemEnabled] = useState<boolean>(initialConfig.isTokenSystemEnabled ?? true);
  const [isAudEnabled, setIsAudEnabled] = useState<boolean>(initialConfig.isAudEnabled ?? true);
  const [isUsdEnabled, setIsUsdEnabled] = useState<boolean>(initialConfig.isUsdEnabled ?? true);

  const [dailyAccessTokens, setDailyAccessTokens] = useState<number>(initialConfig.dailyAccessCostTokens || 1);
  const [aiAssistTokens, setAiAssistTokens] = useState<number>(initialConfig.aiCourseAssistCostTokens || 10);

  const [simulatedCountry, setSimulatedCountry] = useState<'AU' | 'OTHER'>('AU');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const numBase = parseFloat(basePriceInput) || 1.0;
    const numRate = parseFloat(exchangeRate) || 1.54;
    const { tokenPriceUsd, tokenPriceAud } = computeDualPanelPrices(baseCurrency, numBase, numRate);
    setComputedUsd(tokenPriceUsd);
    setComputedAud(tokenPriceAud);
  }, [baseCurrency, basePriceInput, exchangeRate]);

  const handleBaseCurrencyToggle = (newBase: 'USD' | 'AUD') => {
    if (newBase === baseCurrency) return;
    setBaseCurrency(newBase);
    if (newBase === 'USD') {
      setBasePriceInput(computedUsd.toFixed(2));
    } else {
      setBasePriceInput(computedAud.toFixed(2));
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    const payload: TokenCurrencyConfig = {
      scope: selectedScope,
      institutionId: selectedScope === 'INSTITUTION' ? institutionId : undefined,
      configuredByRole: isSuperAdmin && selectedScope === 'GLOBAL' ? 'superadmin' : 'director',
      configuredByName: isSuperAdmin && selectedScope === 'GLOBAL' ? 'Super Admin' : `Director (${institutionName})`,
      baseCurrency,
      tokenPriceUsd: computedUsd,
      tokenPriceAud: computedAud,
      exchangeRateUsdToAud: parseFloat(exchangeRate) || 1.54,
      isTokenSystemEnabled,
      isAudEnabled,
      isUsdEnabled,
      dailyAccessCostTokens: toStrictIntegerTokens(dailyAccessTokens),
      aiCourseAssistCostTokens: toStrictIntegerTokens(aiAssistTokens),
      updatedAt: new Date().toISOString()
    };

    try {
      if (onSave) {
        await onSave(payload);
      }
      setStatusMessage('Token economy defaults and dual-currency rates saved successfully.');
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const previewConfig: TokenCurrencyConfig = {
    scope: selectedScope,
    configuredByRole: 'superadmin',
    baseCurrency,
    tokenPriceUsd: computedUsd,
    tokenPriceAud: computedAud,
    exchangeRateUsdToAud: parseFloat(exchangeRate) || 1.54,
    isTokenSystemEnabled,
    isAudEnabled,
    isUsdEnabled,
    dailyAccessCostTokens: dailyAccessTokens,
    aiCourseAssistCostTokens: aiAssistTokens,
    updatedAt: ''
  };

  return (
    <div
      data-agent-id="token-dual-panel"
      data-testid="token-dual-panel-container"
      className="bg-white border border-slate-200/90 rounded-2xl p-6 text-slate-900 shadow-sm space-y-6 max-w-5xl mx-auto"
    >
      {/* Header with Scope Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Dual-Panel Token & Multi-Currency Engine</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                STRICT INTEGERS ONLY
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure 1-token base valuation, bidirectional USD/AUD conversion, and role default hierarchy.
            </p>
          </div>
        </div>

        {/* Scope selector: Superadmin vs Director */}
        <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 text-xs">
          {isSuperAdmin && (
            <button
              type="button"
              data-testid="scope-global-btn"
              onClick={() => setSelectedScope('GLOBAL')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                selectedScope === 'GLOBAL'
                  ? 'bg-white text-purple-900 shadow-xs ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              Superadmin Global
            </button>
          )}

          {isDirector && (
            <button
              type="button"
              data-testid="scope-institution-btn"
              onClick={() => setSelectedScope('INSTITUTION')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                selectedScope === 'INSTITUTION'
                  ? 'bg-white text-rose-900 shadow-xs ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-rose-600" />
              Director ({institutionName.split(' ')[0]})
            </button>
          )}
        </div>
      </div>

      {/* Scope Status Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {selectedScope === 'GLOBAL' ? (
            <span className="text-purple-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Global Platform Authority:
            </span>
          ) : (
            <span className="text-rose-700 font-bold flex items-center gap-1">
              <Building2 className="w-4 h-4 text-rose-600" /> College / University Branch Override:
            </span>
          )}
          <span className="text-slate-600">
            {selectedScope === 'GLOBAL'
              ? 'Changes here update platform-wide base rates for all unassigned institutions.'
              : `Setting autonomous defaults for ${institutionName}.`}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
          <span>Exchange Rate: 1 USD = </span>
          <input
            type="number"
            step="0.01"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-center text-indigo-700 font-bold outline-none shadow-2xs"
            aria-label="Exchange Rate USD to AUD"
          />
          <span>AUD</span>
        </div>
      </div>

      {/* DUAL PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PANEL 1: PRIMARY BASE CURRENCY SELECTOR */}
        <div
          data-testid="panel-primary-base"
          className="bg-indigo-50/50 border-2 border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-wider text-indigo-900 uppercase flex items-center gap-1">
              <span>PRIMARY BASE PANEL</span>
              <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded text-[9px]">Active Anchor</span>
            </span>
            <div className="flex items-center bg-white p-0.5 rounded-xl border border-indigo-200 shadow-2xs">
              <button
                type="button"
                data-testid="toggle-base-usd"
                onClick={() => handleBaseCurrencyToggle('USD')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  baseCurrency === 'USD' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                USD Base
              </button>
              <button
                type="button"
                data-testid="toggle-base-aud"
                onClick={() => handleBaseCurrencyToggle('AUD')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  baseCurrency === 'AUD' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AUD Base
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Set Price for 1 Token ({baseCurrency})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                {baseCurrency === 'USD' ? '$' : 'A$'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={basePriceInput}
                onChange={(e) => setBasePriceInput(e.target.value)}
                data-testid="token-panel-base-input"
                aria-label={`Price for 1 token in ${baseCurrency}`}
                className="w-full bg-white border border-indigo-300 rounded-xl pl-9 pr-16 py-3 text-2xl font-bold font-mono text-indigo-950 outline-none focus:border-indigo-600 shadow-xs transition-colors"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                {baseCurrency}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            {baseCurrency === 'USD'
              ? 'Anchor price in USD. Automatic conversions feed into AUD Stripe checkout and Australian student disclosures.'
              : 'Anchor price in Australian Dollars (AUD). Automatic conversion feeds into international USD checkout.'}
          </p>
        </div>

        {/* PANEL 2: SECONDARY CONVERTED CURRENCY PANEL */}
        <div
          data-testid="panel-secondary-converted"
          className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono font-bold tracking-wider text-slate-700 uppercase flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                <span>SECONDARY CONVERTED PANEL</span>
              </span>
              <span className="text-[10px] font-mono bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                Auto-Synchronized
              </span>
            </div>

            <div className="text-xs font-bold text-slate-700 mb-1.5">
              Calculated Equivalent for 1 Token ({baseCurrency === 'USD' ? 'AUD' : 'USD'})
            </div>

            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-slate-400">
                  {baseCurrency === 'USD' ? 'A$' : '$'}
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-600">
                  {baseCurrency === 'USD' ? computedAud.toFixed(2) : computedUsd.toFixed(2)}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {baseCurrency === 'USD' ? 'AUD' : 'USD'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
            Conversion parity: <code className="text-indigo-700 font-mono font-semibold">
              {baseCurrency === 'USD'
                ? `1 Token = $${computedUsd} USD × ${exchangeRate} = A$${computedAud.toFixed(2)} AUD`
                : `1 Token = A$${computedAud} AUD ÷ ${exchangeRate} = $${computedUsd.toFixed(2)} USD`}
            </code>
          </div>
        </div>
      </div>

      {/* INDEPENDENT TOGGLES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
          <div>
            <span className="text-xs font-bold block text-slate-900">Token System Master</span>
            <span className="text-[10px] text-slate-500">Enable 🪙 token access economy</span>
          </div>
          <input
            type="checkbox"
            checked={isTokenSystemEnabled}
            onChange={(e) => setIsTokenSystemEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            aria-label="Toggle Token System"
          />
        </label>

        <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
          <div>
            <span className="text-xs font-bold block text-slate-900">AUD Pricing & Stripe</span>
            <span className="text-[10px] text-slate-500">Australian Dollar checkout active</span>
          </div>
          <input
            type="checkbox"
            checked={isAudEnabled}
            onChange={(e) => setIsAudEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            aria-label="Toggle AUD Pricing"
          />
        </label>

        <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
          <div>
            <span className="text-xs font-bold block text-slate-900">USD Pricing & Stripe</span>
            <span className="text-[10px] text-slate-500">US Dollar global checkout active</span>
          </div>
          <input
            type="checkbox"
            checked={isUsdEnabled}
            onChange={(e) => setIsUsdEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            aria-label="Toggle USD Pricing"
          />
        </label>
      </div>

      {/* ITEM PRESENTATION PREVIEW */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-900">Item Display & Hover Tooltip Preview</span>
            <span className="text-[10px] font-mono text-slate-500">(Global Directive: Strict integers + Hover Pricing)</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Visitor Location:
            </span>
            <button
              type="button"
              onClick={() => setSimulatedCountry('AU')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
                simulatedCountry === 'AU' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              🇦🇺 Australia
            </button>
            <button
              type="button"
              onClick={() => setSimulatedCountry('OTHER')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
                simulatedCountry === 'OTHER' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              🌐 International
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            { title: 'Standard Lot', tokens: 10 },
            { title: 'Community Lot', tokens: 50 },
            { title: 'Enterprise Lot', tokens: 100 }
          ].map((lot) => {
            const tooltip = getHoverPricingTooltip(lot.tokens, previewConfig, simulatedCountry === 'AU');
            return (
              <div
                key={lot.tokens}
                className="group relative bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between hover:border-amber-400 transition-all cursor-pointer shadow-2xs"
              >
                <div>
                  <span className="text-xs text-slate-700 font-medium block">{lot.title}</span>
                  <span className="text-lg font-bold font-mono text-amber-600 flex items-center gap-1">
                    <Coins className="w-4 h-4" /> {toStrictIntegerTokens(lot.tokens)}
                  </span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bg-slate-900 text-white border border-slate-800 px-3 py-1.5 rounded-xl text-right pointer-events-none shadow-xl z-20">
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">Hover Price</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {tooltip}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
        {statusMessage ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            {selectedScope === 'GLOBAL' ? 'Superadmin platform defaults' : `Custom rate defaults for ${institutionName}`}
          </div>
        )}

        <button
          type="button"
          data-testid="save-token-config-btn"
          disabled={isSaving}
          onClick={handleSaveConfig}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving Rate Configuration...' : 'Save Token & Multi-Currency Settings'}
        </button>
      </div>
    </div>
  );
};
