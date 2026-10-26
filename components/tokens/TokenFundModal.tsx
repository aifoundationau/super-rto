import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  Globe,
  Users,
  CreditCard
} from 'lucide-react';
import {
  TOKEN_PURCHASE_PRESETS,
  TokenPreset,
  isUserInAustralia,
  getLocalizedTokenPricing,
  computeTokenPackageTotal,
  TokenFundContribution
} from '@/lib/tokens/fund';
import {
  DEFAULT_GLOBAL_TOKEN_CONFIG,
  toStrictIntegerTokens
} from '@/lib/tokens/pricing';

interface TokenFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

export const TokenFundModal: React.FC<TokenFundModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  // Geolocation & Currency State
  const [isAus, setIsAus] = useState<boolean>(true);
  const [selectedCurrency, setSelectedCurrency] = useState<'AUD' | 'USD'>('AUD');
  
  // Package Selection State
  const [selectedPreset, setSelectedPreset] = useState<TokenPreset | 'custom'>(100);
  const [customTokens, setCustomTokens] = useState<number>(250);

  // Unregistered Contributor State
  const [isCommunityFund, setIsCommunityFund] = useState<boolean>(true);
  const [contributorName, setContributorName] = useState<string>('');
  const [contributorEmail, setContributorEmail] = useState<string>('');
  const [dedicationNote, setDedicationNote] = useState<string>('');

  // Fund Pool Data & Activity
  const [fundTotal, setFundTotal] = useState<number>(18450);
  const [totalContributors, setTotalContributors] = useState<number>(142);
  const [recentContributions, setRecentContributions] = useState<TokenFundContribution[]>([]);

  // Checkout Execution State
  const [isProcessingStripe, setIsProcessingStripe] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Auto-detect geolocation on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const inAustralia = isUserInAustralia();
      setIsAus(inAustralia);
      setSelectedCurrency(inAustralia ? 'AUD' : 'USD');
    }
  }, []);

  // Fetch live accumulated fund stats
  useEffect(() => {
    if (isOpen) {
      fetch('/api/tokens/fund')
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.data) {
            setFundTotal(data.data.totalTokensInFund);
            setTotalContributors(data.data.totalContributionsCount);
            if (data.data.recentContributions) {
              setRecentContributions(data.data.recentContributions);
            }
          }
        })
        .catch((err) => {
          console.warn('[TokenFundModal] Using local fund state:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Compute active tokens count (Strict whole integer)
  const activeTokens = selectedPreset === 'custom'
    ? toStrictIntegerTokens(customTokens || 1)
    : selectedPreset;

  // Compute price
  const calculation = computeTokenPackageTotal(
    activeTokens,
    selectedCurrency,
    DEFAULT_GLOBAL_TOKEN_CONFIG
  );

  // Handle Stripe Checkout submission
  const handleProceedToStripe = async () => {
    setIsProcessingStripe(true);
    setCheckoutError(null);

    try {
      const payload = {
        tokens: activeTokens,
        currency: selectedCurrency.toLowerCase(),
        isCommunityFund,
        contributorName: contributorName.trim() || (currentUser?.name ?? 'Anonymous Supporter'),
        contributorEmail: contributorEmail.trim() || (currentUser?.email ?? ''),
        userId: isCommunityFund ? undefined : (currentUser?.uid || currentUser?.id || undefined),
        note: dedicationNote.trim()
      };

      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate Stripe payment session');
      }

      // If real Stripe URL is returned, redirect to Stripe
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Simulated Sandbox Success
      setPaymentSuccess(true);
      setSuccessReceipt({
        tokens: activeTokens,
        currency: selectedCurrency,
        totalFiat: calculation.totalFiat,
        sessionId: data.sessionId,
        isDemo: data.isDemoMode,
        contributorName: payload.contributorName,
        note: payload.note
      });

      // Update local fund state immediately
      setFundTotal((prev) => prev + activeTokens);
      setTotalContributors((prev) => prev + 1);

      // Trigger Confetti
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Confetti optional
      }
    } catch (err: any) {
      console.error('[TokenFundModal] Stripe checkout error:', err);
      setCheckoutError(err.message || 'Error communicating with Stripe payment gateway.');
    } finally {
      setIsProcessingStripe(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tokens-modal-title"
      data-agent-id="token-fund-modal"
      data-testid="token-fund-modal"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto">
        {/* Modal Header: Streamlined & Compact */}
        <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 px-4 py-3 sm:px-5 sm:py-3.5 text-white shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 id="tokens-modal-title" className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                    EduPulse AI Tokens
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider shrink-0">
                    Strict Integers
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-indigo-200 truncate mt-0.5 max-w-lg">
                  Decentralized learning credits. Add tokens to your account or subsidize the public Community Fund.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              data-testid="close-tokens-modal-btn"
              aria-label="Close Tokens Modal"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Geolocation & Dual Currency Banner (Adaptive Fluid Row) */}
          <div className="mt-2.5 pt-2 border-t border-indigo-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-indigo-200 text-xs">
              <div className="flex items-center gap-1.5 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-700/50">
                <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-[11px]">
                  Geolocation: <strong className="text-white font-semibold">{isAus ? 'Australia (AUD)' : 'International (USD)'}</strong>
                </span>
              </div>
              <span className="text-indigo-300/50 hidden sm:inline">•</span>
              <div className="flex items-center gap-1 bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold px-2 py-0.5 rounded-md text-[11px]">
                <span>1 Token = {isAus ? '$1.54 AUD' : '$1.00 USD'}</span>
              </div>
            </div>

            {/* Currency Switcher Toggle */}
            <div className="flex items-center bg-indigo-950/70 rounded-lg p-0.5 border border-indigo-700/50 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCurrency('AUD')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  selectedCurrency === 'AUD'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-indigo-200 hover:text-white'
                }`}
                title="Australian Dollar ($1.54 AUD / Token)"
              >
                🇦🇺 AUD ($1.54)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCurrency('USD')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  selectedCurrency === 'USD'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-indigo-200 hover:text-white'
                }`}
                title="United States Dollar ($1.00 USD / Token)"
              >
                🌐 USD ($1.00)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body: Compact & Screen-Fitted */}
        <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3 flex-1 overflow-y-auto">
          {paymentSuccess && successReceipt ? (
            /* Payment Success View */
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-emerald-950">
                  Payment Successful! Thank You for Your Contribution
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {successReceipt.tokens} 🪙 Tokens credited to the {isCommunityFund || !currentUser ? 'Accumulated Community Token Fund' : 'Personal Learning Account'}.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="max-w-md mx-auto bg-white rounded-xl border border-emerald-200 p-3 text-left text-xs space-y-1.5 shadow-xs">
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">Tokens Purchased:</span>
                  <span className="font-extrabold text-slate-900">{successReceipt.tokens} 🪙</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-extrabold text-slate-900">
                    ${successReceipt.totalFiat.toFixed(2)} {successReceipt.currency}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">Allocation:</span>
                  <span className="font-semibold text-indigo-700">
                    {isCommunityFund || !currentUser
                      ? 'Accumulated Community Fund (Superadmin Master Account)'
                      : `Personal Account (${currentUser?.email || currentUser?.uid})`}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">Contributor:</span>
                  <span className="font-semibold text-slate-800">{successReceipt.contributorName}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">Payment Gateway:</span>
                  <span className="font-semibold text-indigo-600 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Stripe Secure Checkout
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentSuccess(false);
                    setSuccessReceipt(null);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Make Another Contribution &rarr;
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Compact Community Accumulated Token Fund Callout */}
              <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-amber-50/60 rounded-xl border border-indigo-100/90 p-2.5 sm:p-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-indigo-600 text-white uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" /> Public Community Fund
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      No Registration Required
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate max-w-md">
                    Subsidizes AI learning credits and course synthesis for regional and disadvantaged learners.
                  </p>
                </div>

                {/* Fund Counter Pill */}
                <div className="bg-white rounded-lg border border-indigo-200/80 px-3 py-1 shadow-2xs text-center shrink-0">
                  <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                    Fund Balance
                  </div>
                  <div className="text-sm sm:text-base font-black text-indigo-950 flex items-center justify-center gap-1">
                    <span className="text-amber-500">🪙</span>
                    <span>{fundTotal.toLocaleString()}</span>
                  </div>
                  <div className="text-[9px] font-medium text-emerald-700">
                    {totalContributors} contributors
                  </div>
                </div>
              </div>

              {/* Package Selector (50, 100, 500, 1000, Custom) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>Select Token Package</span>
                  </label>
                  <span
                    className="text-[10px] font-medium text-slate-500 cursor-help"
                    title={`AUD price strictly shown in Australia or via toggle. International standard: $1.00 USD. Rate: 1 USD = 1.54 AUD.`}
                  >
                    Hover price: {calculation.dualTooltip}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {TOKEN_PURCHASE_PRESETS.map((tokens) => {
                    const isSelected = selectedPreset === tokens;
                    const pkgTotal = computeTokenPackageTotal(tokens, selectedCurrency, DEFAULT_GLOBAL_TOKEN_CONFIG);

                    return (
                      <button
                        key={tokens}
                        type="button"
                        onClick={() => setSelectedPreset(tokens)}
                        data-testid={`token-preset-${tokens}`}
                        className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all relative cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-300'
                        }`}
                        title={pkgTotal.dualTooltip}
                      >
                        <div className={`text-xs sm:text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {tokens} 🪙
                        </div>
                        <div
                          className={`text-[10px] sm:text-[11px] font-bold mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-600'}`}
                          title={pkgTotal.dualTooltip}
                        >
                          ${pkgTotal.totalFiat.toFixed(2)}
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom Tokens Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPreset('custom')}
                    data-testid="token-preset-custom"
                    className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedPreset === 'custom'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-black flex items-center justify-center gap-1">
                      <span>Custom</span>
                      <Sparkles className="w-3 h-3 opacity-75" />
                    </div>
                    <div className={`text-[10px] sm:text-[11px] font-bold mt-0.5 ${selectedPreset === 'custom' ? 'text-indigo-100' : 'text-slate-600'}`}>
                      Any Amount
                    </div>
                  </button>
                </div>

                {/* Custom Token Integer Input */}
                {selectedPreset === 'custom' && (
                  <div className="p-2 sm:p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-2 animate-in fade-in text-xs">
                    <div className="flex items-center gap-2">
                      <label htmlFor="custom-token-input" className="text-[11px] font-bold text-indigo-950 whitespace-nowrap">
                        Tokens:
                      </label>
                      <div className="relative">
                        <input
                          id="custom-token-input"
                          type="number"
                          min="1"
                          max="50000"
                          step="1"
                          value={customTokens}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setCustomTokens(isNaN(val) ? 0 : Math.max(1, Math.round(val)));
                          }}
                          data-testid="custom-token-input"
                          className="w-24 px-2 py-0.5 bg-white border border-indigo-300 rounded-md text-xs font-black text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="absolute right-1.5 top-0.5 text-slate-400 text-xs">🪙</span>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-indigo-900">
                      Total: <span className="font-black text-indigo-600">${calculation.totalFiat.toFixed(2)} {selectedCurrency}</span>
                      <span className="text-[10px] font-normal text-slate-500 ml-1">({calculation.dualTooltip})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contributor & Allocation Details */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 sm:p-3 space-y-2">
                {/* Fund Destination Checkbox */}
                <div className="flex flex-col gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="community-fund-checkbox"
                      checked={isCommunityFund || !currentUser}
                      onChange={(e) => {
                        if (currentUser) {
                          setIsCommunityFund(e.target.checked);
                        }
                      }}
                      disabled={!currentUser}
                      data-testid="community-fund-checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-75"
                    />
                    <label htmlFor="community-fund-checkbox" className="text-xs text-slate-700 cursor-pointer flex-1 flex items-center justify-between">
                      <span className="font-bold text-slate-900">Add to Accumulated Community Token Fund</span>
                      <span className="text-[10px] text-slate-500 hidden sm:inline">
                        {currentUser ? 'Subsidizes regional & open access learners' : 'Superadmin pool for community access'}
                      </span>
                    </label>
                  </div>
                  {!currentUser ? (
                    <p className="text-[10px] text-slate-500 pl-5.5">
                      💡 Tokens not purchased for a specific account automatically route to the Accumulated Community Fund (Superadmin account). Sign in to allocate to a personal account.
                    </p>
                  ) : (
                    <p className="text-[10px] text-indigo-600 font-medium pl-5.5">
                      {isCommunityFund
                        ? 'Contributing to the public Accumulated Community Fund.'
                        : `Allocating tokens directly to your account (${currentUser.email || currentUser.name || 'Personal Account'}).`}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
                      Contributor Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Smith or Anonymous"
                      value={contributorName}
                      onChange={(e) => setContributorName(e.target.value)}
                      data-testid="contributor-name-input"
                      className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
                      Email (Optional, for receipt)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. supporter@example.com"
                      value={contributorEmail}
                      onChange={(e) => setContributorEmail(e.target.value)}
                      data-testid="contributor-email-input"
                      className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-0.5 text-[10px]">
                    Dedication Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. In support of regional nursing students"
                    value={dedicationNote}
                    onChange={(e) => setDedicationNote(e.target.value)}
                    data-testid="contributor-note-input"
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Checkout Error Message */}
              {checkoutError && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {checkoutError}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer with Stripe CTA */}
        {!paymentSuccess && (
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="text-left space-y-0.5">
              <div className="text-[11px] text-slate-500">
                Total for <strong className="text-slate-900">{activeTokens} 🪙</strong>:
              </div>
              <div className="text-lg sm:text-xl font-black text-indigo-950 flex items-baseline gap-1.5">
                <span>${calculation.totalFiat.toFixed(2)}</span>
                <span className="text-xs font-bold text-slate-500">{selectedCurrency}</span>
                <span
                  className="text-[10px] font-normal text-slate-400 cursor-help hidden sm:inline"
                  title="Hover pricing: AUD only displays in Australia by default"
                >
                  ({calculation.dualTooltip})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedToStripe}
                disabled={isProcessingStripe || activeTokens <= 0}
                data-testid="pay-with-stripe-btn"
                className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isProcessingStripe ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay with Stripe &rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
