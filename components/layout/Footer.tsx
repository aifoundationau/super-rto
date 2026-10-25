'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HeartHandshake, FileText, Lock } from 'lucide-react';
import { GeoTimeWidget } from './GeoTimeWidget';

export const Footer: React.FC = () => {
  return (
    <footer
      data-agent-id="main-footer"
      data-testid="main-footer-container"
      className="bg-white border-t border-slate-200 text-slate-600 text-xs mt-auto"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: Platform Mission */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              RTO
            </div>
            <span className="font-extrabold text-slate-900 text-sm">Super-RTO Unified</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Consolidated enterprise Registered Training Organisation (RTO) management and comprehensive Learning Management System (LMS).
          </p>
          <div className="flex items-center gap-2 text-[10px] text-emerald-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ASQA & TEQSA Compliant Core</span>
          </div>
        </div>

        {/* Col 2: Compliance Frameworks */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Governing Standards</h4>
          <ul className="space-y-1.5 text-[11px]">
            <li><span className="text-emerald-700 font-semibold">🇦🇺 ASQA:</span> Standards for RTOs 2025</li>
            <li><span className="text-sky-700 font-semibold">🇦🇺 TEQSA:</span> Higher Education Threshold Standards</li>
            <li><span className="text-purple-700 font-semibold">🇳🇿 NZQA:</span> NZQF Framework Levels 1-10</li>
            <li><span className="text-amber-700 font-semibold">🇬🇧 UK QAA & Ofsted:</span> FHEQ & Apprenticeships</li>
            <li><span className="text-rose-700 font-semibold">🌐 AACSB & Global:</span> Higher Learning Commission</li>
          </ul>
        </div>

        {/* Col 3: Australian Privacy & Legal */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Privacy & Security</h4>
          <ul className="space-y-1.5 text-[11px]">
            <li className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-indigo-600" />
              <span>Australian Privacy Act 1988 (APP)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-indigo-600" />
              <span>AVETMISS 8.0 Compliance Engine</span>
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-indigo-600" />
              <span>Unique Student Identifier (USI) Gated</span>
            </li>
            <li className="flex items-center gap-1.5">
              <HeartHandshake className="w-3 h-3 text-rose-600" />
              <span>Community Emergency Token Fund</span>
            </li>
          </ul>
        </div>

        {/* Col 4: Role Hierarchy & Multi-Currency */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Governance Structure</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Superadmin coordinates global currency conversion rates, while institution <strong className="text-slate-800">Directors</strong> configure college-specific regulatory frameworks and token defaults.
          </p>
          <div className="pt-2 text-[10px] text-slate-400 font-mono">
            Zero Hardcoded Credentials • GitHub + Vercel
          </div>
        </div>

      </div>

      {/* Embed Thin Sticky Footer Bar (Geo, Weather & Time Widget) */}
      <GeoTimeWidget />
    </footer>
  );
};
