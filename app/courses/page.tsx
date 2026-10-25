'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Coins,
  Clock,
  Award,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SystemRole } from '@/lib/auth/roles';
import { DEFAULT_GLOBAL_TOKEN_CONFIG, getHoverPricingTooltip, toStrictIntegerTokens } from '@/lib/tokens/pricing';

const SAMPLE_COURSES = [
  {
    id: 'bsb41419',
    title: 'Certificate IV in Work Health and Safety',
    code: 'BSB41419',
    framework: 'ASQA (VET)',
    aqfLevel: 4,
    nominalHours: 240,
    tokenCost: 10,
    category: 'Workplace Safety & Compliance',
    description: 'National qualification for coordinators and safety advisors in Australian high-risk industries.'
  },
  {
    id: 'bcs-he',
    title: 'Bachelor of Computer Science & AI Systems',
    code: 'BCS-2026',
    framework: 'TEQSA (Higher Ed)',
    aqfLevel: 7,
    nominalHours: 1200,
    tokenCost: 40,
    category: 'Information Technology',
    description: 'TEQSA-accredited 3-year degree focusing on machine learning, cloud architectures, and cybersecurity.'
  },
  {
    id: 'fheq-cyber',
    title: 'Diploma of Higher Education in Cyber Defense',
    code: 'DIP-CYB-UK',
    framework: 'UK QAA (FHEQ)',
    aqfLevel: 5,
    nominalHours: 480,
    tokenCost: 25,
    category: 'Cybersecurity',
    description: 'Aligned with UK QAA Benchmark standards, covering security operations centers and incident response.'
  },
  {
    id: 'mba-mgmt',
    title: 'Executive Master of Business Administration',
    code: 'EMBA-AACSB',
    framework: 'AACSB (Global)',
    aqfLevel: 9,
    nominalHours: 800,
    tokenCost: 60,
    category: 'Business & Leadership',
    description: 'Global business strategy, financial modeling, and AI-driven organizational transformation.'
  }
];

export default function CoursesPage() {
  const [currentRole, setCurrentRole] = useState<SystemRole>('student');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('ALL');

  const filtered = SAMPLE_COURSES.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFramework = selectedFramework === 'ALL' || c.framework.includes(selectedFramework);
    return matchesSearch && matchesFramework;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        tokenBalance={50}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                COURSE & QUALIFICATION CATALOG
              </span>
              <span className="text-xs text-slate-500 font-mono">ASQA • TEQSA • Global Frameworks</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Accredited Programs & Micro-Credentials
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict integer token enrollment pricing with hover-only statutory AUD and USD pricing parity.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white w-48 sm:w-64 shadow-2xs"
              />
            </div>

            <select
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 font-mono font-semibold shadow-2xs"
            >
              <option value="ALL">All Frameworks</option>
              <option value="ASQA">ASQA (VET)</option>
              <option value="TEQSA">TEQSA (Higher Ed)</option>
              <option value="UK">UK QAA</option>
              <option value="AACSB">AACSB</option>
            </select>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((c) => {
            const hoverTooltip = getHoverPricingTooltip(c.tokenCost, DEFAULT_GLOBAL_TOKEN_CONFIG, true);
            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 text-slate-900 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-indigo-700 border border-slate-200">
                      {c.framework}
                    </span>

                    {/* Strict Token Pill with Hover Reveal */}
                    <div className="group relative cursor-pointer">
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1 shadow-2xs">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        <span>{toStrictIntegerTokens(c.tokenCost)} Tokens</span>
                      </span>

                      {/* Tooltip on Hover Only */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 p-2.5 rounded-xl text-right z-30 shadow-2xl pointer-events-none">
                        <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">Hover Value</span>
                        <span className="text-xs font-bold text-emerald-600 font-mono">{hoverTooltip}</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{c.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-1 mb-2">
                    <span>Code: {c.code}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {c.nominalHours} Hours
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">{c.category}</span>
                  <Link
                    href="/lms"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                  >
                    <span>Enroll & Open LMS</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
