'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Coins,
  ShieldCheck,
  Building2,
  BookOpen,
  LayoutDashboard,
  Layers,
  ChevronDown,
  Sparkles,
  Bot
} from 'lucide-react';
import { SystemRole, ROLE_DEFINITIONS } from '@/lib/auth/roles';
import { DEFAULT_GLOBAL_TOKEN_CONFIG, getHoverPricingTooltip, toStrictIntegerTokens } from '@/lib/tokens/pricing';

interface NavbarProps {
  currentRole: SystemRole;
  onRoleChange: (role: SystemRole) => void;
  tokenBalance?: number;
  userEmail?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  tokenBalance = 50,
  userEmail = 'director@oxford-college.edu.au'
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleMeta = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.director;
  const hoverPrice = getHoverPricingTooltip(tokenBalance, DEFAULT_GLOBAL_TOKEN_CONFIG, true);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      data-agent-id="main-navbar"
      data-testid="main-navbar-container"
      className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs"
    >
      <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 xl:gap-8">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-primary-600 to-purple-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                Super-RTO
              </span>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">
                UNIFIED
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block -mt-0.5">
              RTO Operations • ASQA & TEQSA • LMS
            </span>
          </div>
        </Link>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 shadow-xs shrink-0">
          <Link
            href="/"
            className="px-3.5 xl:px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
          >
            Overview
          </Link>
          <Link
            href="/courses"
            className="px-3.5 xl:px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Course Catalog</span>
          </Link>
          <Link
            href="/builder"
            className="px-3.5 xl:px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Course Builder</span>
          </Link>
          <Link
            href="/lms"
            className="px-3.5 xl:px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4 text-amber-500" />
            <span>LMS Player</span>
          </Link>
          <Link
            href="/admin"
            className="px-3.5 xl:px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-4 h-4 text-purple-600" />
            <span>Governance & RBAC</span>
          </Link>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          
          {/* Strict Integer Token Pill with Strict Hover Price Reveal */}
          <div
            data-testid="navbar-token-pill"
            className="group relative flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-full cursor-pointer hover:border-amber-400 transition-all shadow-xs"
          >
            <Coins className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-mono font-bold text-xs text-amber-900">
              {toStrictIntegerTokens(tokenBalance)}
            </span>
            <span className="text-[10px] text-amber-700 hidden sm:inline">Tokens</span>

            {/* Hover Tooltip (Mandatory: Price strictly revealed on hover) */}
            <div
              data-testid="token-hover-tooltip"
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xl z-50 text-right"
            >
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                Statutory Parity
              </div>
              <div className="text-xs font-bold font-mono text-emerald-600 mt-0.5">
                {hoverPrice}
              </div>
              <div className="text-[9px] text-slate-400 mt-1 border-t border-slate-100 pt-1">
                Prices visible strictly on hover
              </div>
            </div>
          </div>

          {/* Role Persona Switcher (Mirroring rto-ai account dropdown menu) */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              data-testid="navbar-role-button"
              onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer border bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200/80"
            >
              <span className={`w-2 h-2 rounded-full ${roleMeta.badgeBg}`}></span>
              <span className="hidden sm:inline text-[11px] truncate max-w-[120px]">
                {roleMeta.label.split(' ')[0]}
              </span>
              <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider ${roleMeta.badgeBg} ${roleMeta.badgeText}`}>
                {roleMeta.role}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isRoleDropdownOpen && (
              <div
                data-testid="navbar-role-menu"
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2"
              >
                <div className="px-4 py-2.5 border-b border-slate-100 text-[11px] text-slate-500">
                  <span className="font-bold text-slate-900 block">Switch RBAC Persona:</span>
                  <span className="text-slate-400 font-mono text-[10px]">{userEmail}</span>
                </div>

                <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                  {(['superadmin', 'director', 'administration', 'teacher', 'student', 'supporter'] as SystemRole[]).map((roleKey) => {
                    const r = ROLE_DEFINITIONS[roleKey];
                    const isCurrent = currentRole === roleKey;
                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => {
                          onRoleChange(roleKey);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          isCurrent ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${r.badgeBg}`}></span>
                          <span>{r.label}</span>
                        </div>
                        {roleKey === 'director' && (
                          <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded font-mono">
                            NEW
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
