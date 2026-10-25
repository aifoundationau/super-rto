'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DualCurrencyTokenPanel } from '@/components/tokens/DualCurrencyTokenPanel';
import { ComplianceFrameworkSelector } from '@/components/compliance/ComplianceFrameworkSelector';
import { SystemRole, ROLE_DEFINITIONS } from '@/lib/auth/roles';
import { ShieldCheck, Building2, Users, Coins } from 'lucide-react';

export default function AdminPage() {
  const [currentRole, setCurrentRole] = useState<SystemRole>('director');
  const [activeTab, setActiveTab] = useState<'tokens' | 'compliance' | 'roles'>('tokens');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        tokenBalance={100}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Admin Header */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                GOVERNANCE & SENIOR MANAGEMENT
              </span>
              <span className="text-xs text-slate-500 font-medium">Multi-Institution RBAC</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              {currentRole === 'superadmin' ? 'Superadmin Platform Administration' : 'College Director Executive Portal'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentRole === 'superadmin'
                ? 'Managing global multi-tenant defaults, platform-wide token exchange parity, and regulatory frameworks.'
                : 'Managing Oxford International College autonomous defaults, token conversion rates, and academic compliance.'}
            </p>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('tokens')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'tokens' ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-slate-200/60' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>Token Pricing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compliance')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'compliance' ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-slate-200/60' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Compliance Standards</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'roles' ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-slate-200/60' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>Unified Roles</span>
            </button>
          </div>
        </div>

        {/* Tab View */}
        {activeTab === 'tokens' && (
          <DualCurrencyTokenPanel
            currentUserRole={currentRole}
            institutionName="Oxford International College"
          />
        )}

        {activeTab === 'compliance' && (
          <ComplianceFrameworkSelector
            currentUserRole={currentRole}
            institutionName="Oxford International College"
          />
        )}

        {activeTab === 'roles' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-slate-900 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Unified RBAC Directory & Hierarchy</h3>
            <p className="text-xs text-slate-500">
              Super-RTO unifies operations from rto-ai and course delivery from pro-lms under 12 standardized system roles:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {Object.values(ROLE_DEFINITIONS).map((r) => (
                <div key={r.role} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{r.label}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.badgeBg} ${r.badgeText}`}>
                      Level {r.hierarchyLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
