import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Save,
  Search,
  Filter,
  Eye,
  Grid,
  List,
  Sparkles,
  Info,
  Check,
  GraduationCap,
  FileText,
  DollarSign,
  MessageSquare,
  Settings,
  LayoutGrid,
  Layers,
  ArrowLeftRight,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import {
  SYSTEM_ROLES,
  ROLE_DEFINITIONS,
  normalizeRole,
  type SystemRole
} from '@/lib/auth/roles';
import {
  SYSTEM_PERMISSIONS,
  ALL_PERMISSION_IDS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  type SystemPermission
} from '@/lib/auth/permissions';
import { authenticatedFetch } from '@/lib/firebase/client';

export type RoleDomainTier = 'all' | 'executive' | 'operations' | 'academic' | 'compare';

export const ROLE_DOMAIN_TIERS: Record<Exclude<RoleDomainTier, 'all' | 'compare'>, { label: string; roles: SystemRole[]; desc: string }> = {
  executive: {
    label: 'Executive Leadership',
    roles: ['director', 'chancellor', 'president', 'vice_president', 'ceo', 'coo', 'cfo'],
    desc: 'Senior governance, strategic direction, institutional standards, and executive oversight.'
  },
  operations: {
    label: 'Technology & Operations',
    roles: ['cto', 'tech_admin', 'admin', 'accounting', 'administration', 'student_counsellor'],
    desc: 'LMS infrastructure, technical administration, registrar, accounts, and student wellbeing.'
  },
  academic: {
    label: 'Academic & Community',
    roles: ['teacher', 'student', 'supporter'],
    desc: 'Trainers, assessors, enrolled learners, and public community supporters.'
  }
};

export const ROLE_ABBREVIATIONS: Record<SystemRole, string> = {
  superadmin: 'SA',
  director: 'DIR',
  chancellor: 'CHN',
  president: 'PRE',
  vice_president: 'VP',
  ceo: 'CEO',
  coo: 'COO',
  cfo: 'CFO',
  cto: 'CTO',
  tech_admin: 'TECH',
  admin: 'ADM',
  accounting: 'ACC',
  administration: 'REG',
  student_counsellor: 'CNS',
  teacher: 'TCH',
  student: 'STU',
  supporter: 'SUP',
};

export const RolePermissionsManager: React.FC = () => {
  const [rolePermissions, setRolePermissions] = useState<Record<SystemRole, string[]>>(
    DEFAULT_ROLE_PERMISSIONS
  );
  const [selectedRole, setSelectedRole] = useState<SystemRole>('teacher');
  const [viewMode, setViewMode] = useState<'single' | 'matrix'>('matrix');
  const [matrixTier, setMatrixTier] = useState<RoleDomainTier>('all');
  const [matrixLayout, setMatrixLayout] = useState<'table' | 'cards'>('table');
  const [comparedRoles, setComparedRoles] = useState<SystemRole[]>([
    'director',
    'admin',
    'teacher',
    'student'
  ]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [confirmRevokeRole, setConfirmRevokeRole] = useState<SystemRole | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: ''
  });

  // Fetch persisted role permissions on mount
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch('/api/permissions');
      if (res.ok) {
        const data = await res.json();
        if (data.rolePermissions) {
          setRolePermissions(data.rolePermissions);
        }
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRolePerms = rolePermissions[selectedRole] || [];
  const selectedMeta = ROLE_DEFINITIONS[selectedRole];

  const handleTogglePermission = (role: SystemRole, permId: string) => {
    if (role === 'superadmin') {
      setStatusMessage({
        type: 'error',
        text: 'Superadmin has irrevocable root access across all system permissions.'
      });
      setTimeout(() => setStatusMessage({ type: null, text: '' }), 3500);
      return;
    }

    setRolePermissions((prev) => {
      const perms = prev[role] || [];
      const isGranted = perms.includes(permId);
      const updated = isGranted ? perms.filter((p) => p !== permId) : [...perms, permId];

      return {
        ...prev,
        [role]: updated
      };
    });
  };

  const handleGrantAll = (role: SystemRole) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: [...ALL_PERMISSION_IDS]
    }));
    setStatusMessage({
      type: 'success',
      text: `Granted all ${ALL_PERMISSION_IDS.length} permissions to ${ROLE_DEFINITIONS[role].label}.`
    });
    setTimeout(() => setStatusMessage({ type: null, text: '' }), 3000);
  };

  const handleInitiateRevoke = (role: SystemRole) => {
    if (role === 'superadmin') {
      setStatusMessage({
        type: 'error',
        text: 'Cannot revoke permissions from Superadmin account.'
      });
      setTimeout(() => setStatusMessage({ type: null, text: '' }), 3500);
      return;
    }
    setConfirmRevokeRole(role);
  };

  const handleConfirmRevoke = (role: SystemRole) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: []
    }));
    setConfirmRevokeRole(null);
    setStatusMessage({
      type: 'success',
      text: `Revoked all permissions for ${ROLE_DEFINITIONS[role].label}.`
    });
    setTimeout(() => setStatusMessage({ type: null, text: '' }), 3000);
  };

  const handleCancelRevoke = () => {
    setConfirmRevokeRole(null);
  };

  const handleResetDefaults = (role: SystemRole) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: [...(DEFAULT_ROLE_PERMISSIONS[role] || [])]
    }));
    setStatusMessage({
      type: 'success',
      text: `Reset ${ROLE_DEFINITIONS[role].label} permissions to institutional default.`
    });
    setTimeout(() => setStatusMessage({ type: null, text: '' }), 3000);
  };

  const handleSaveRole = async (role: SystemRole) => {
    setIsSaving(true);
    setStatusMessage({ type: null, text: '' });
    try {
      const res = await authenticatedFetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          permissions: rolePermissions[role] || []
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `Permissions for ${ROLE_DEFINITIONS[role].label} saved successfully!`
        });
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error saving role permissions.'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage({ type: null, text: '' }), 4000);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setStatusMessage({ type: null, text: '' });
    try {
      const res = await authenticatedFetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rolePermissions
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: 'All role permissions saved and synchronized to Firestore successfully!'
        });
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error saving role permissions.'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage({ type: null, text: '' }), 4000);
    }
  };

  const filteredPermissions = SYSTEM_PERMISSIONS.filter((p) => {
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const term = searchQuery.toLowerCase().trim();
    if (!term) return matchesCategory;

    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Academic & LMS':
        return <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
      case 'Admissions & Students':
        return <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'Finance & Operations':
        return <DollarSign className="w-3.5 h-3.5 text-teal-500 shrink-0" />;
      case 'Communications & AI':
        return <MessageSquare className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
      case 'Administration & Governance':
        return <Settings className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  // Determine active roles for matrix view
  const activeMatrixRoles: SystemRole[] = (() => {
    if (matrixTier === 'all') return [...SYSTEM_ROLES];
    if (matrixTier === 'compare') return comparedRoles;
    return ROLE_DOMAIN_TIERS[matrixTier]?.roles || [...SYSTEM_ROLES];
  })();

  const toggleComparedRole = (role: SystemRole) => {
    if (comparedRoles.includes(role)) {
      if (comparedRoles.length <= 2) {
        setStatusMessage({
          type: 'error',
          text: 'At least 2 roles must be selected for side-by-side comparison.'
        });
        setTimeout(() => setStatusMessage({ type: null, text: '' }), 3000);
        return;
      }
      setComparedRoles((prev) => prev.filter((r) => r !== role));
    } else {
      if (comparedRoles.length >= 6) {
        setStatusMessage({
          type: 'error',
          text: 'Maximum 6 roles can be compared side-by-side without horizontal scrolling.'
        });
        setTimeout(() => setStatusMessage({ type: null, text: '' }), 3000);
        return;
      }
      setComparedRoles((prev) => [...prev, role]);
    }
  };

  return (
    <div
      className="w-full space-y-4 sm:space-y-6"
      data-testid="role-permissions-manager"
      data-agent-id="role-permissions-manager"
    >
      {/* Top Banner & Control Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-purple-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/30 text-purple-200 border border-purple-400/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              Superadmin RBAC Engine
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-slate-300 font-medium">
              {SYSTEM_ROLES.length} System Roles
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-slate-300 font-medium">
              {SYSTEM_PERMISSIONS.length} Permissions
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setViewMode('matrix')}
              data-testid="view-mode-matrix-btn"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Permission Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('single')}
              data-testid="view-mode-single-btn"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Single Role Focus</span>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            System Role Permission Matrix
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/90 mt-1 max-w-3xl leading-relaxed">
            Configure institutional authority, grant granular access, and synchronize permissions to Firebase Firestore in real time.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-purple-900/40">
          <div className="flex items-center gap-2 text-xs text-purple-200">
            <Info className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              All newly registered users receive the <strong className="text-white">supporter</strong> role by default.
            </span>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            data-testid="save-all-permissions-btn"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving to Database...' : 'Save All Role Permissions'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {statusMessage.text && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 text-xs font-medium border shadow-xs animate-in fade-in slide-in-from-top-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage({ type: null, text: '' })}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Universal Search & Category Filter Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search permissions by name, key, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Count Badge */}
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span>Showing</span>
            <strong className="text-purple-700 font-mono">{filteredPermissions.length}</strong>
            <span>of</span>
            <strong className="text-slate-700 font-mono">{SYSTEM_PERMISSIONS.length}</strong>
            <span>permissions</span>
          </div>
        </div>

        {/* Category Pills (Fluid Wrap) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({SYSTEM_PERMISSIONS.length})
          </button>
          {PERMISSION_CATEGORIES.map((cat) => {
            const count = SYSTEM_PERMISSIONS.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {getCategoryIcon(cat)}
                <span className="truncate max-w-[130px] sm:max-w-none">{cat}</span>
                <span className="text-[10px] opacity-80 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: MATRIX COMPARISON (ZERO-SCROLLBAR RESPONSIVE VIEW)
         ========================================================================= */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          {/* Matrix Tier Filter & Layout Mode Bar */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Domain Tier Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
                Scope:
              </span>
              <button
                onClick={() => setMatrixTier('all')}
                data-testid="matrix-tier-all-btn"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  matrixTier === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All 17 Roles (Micro-Matrix)
              </button>
              <button
                onClick={() => setMatrixTier('executive')}
                data-testid="matrix-tier-executive-btn"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  matrixTier === 'executive'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Executive (7)
              </button>
              <button
                onClick={() => setMatrixTier('operations')}
                data-testid="matrix-tier-operations-btn"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  matrixTier === 'operations'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tech & Ops (6)
              </button>
              <button
                onClick={() => setMatrixTier('academic')}
                data-testid="matrix-tier-academic-btn"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  matrixTier === 'academic'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Academic & Community (3)
              </button>
              <button
                onClick={() => setMatrixTier('compare')}
                data-testid="matrix-tier-compare-btn"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  matrixTier === 'compare'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Side-by-Side ({comparedRoles.length})</span>
              </button>
            </div>

            {/* Layout Presentation Toggle & Save Button */}
            <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setMatrixLayout('table')}
                  data-testid="matrix-layout-table-btn"
                  title="Table Matrix View"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    matrixLayout === 'table'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  onClick={() => setMatrixLayout('cards')}
                  data-testid="matrix-layout-cards-btn"
                  title="Card Deck Grid View"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    matrixLayout === 'cards'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
              </div>

              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                data-testid="save-matrix-btn"
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Matrix'}</span>
              </button>
            </div>
          </div>

          {/* Side-by-Side Multi-Role Comparator Picker (When Tier === 'compare') */}
          {matrixTier === 'compare' && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
                  Select Roles to Compare Side-by-Side (2 to 6 roles):
                </span>
                <span className="text-[11px] text-purple-700 font-mono">
                  {comparedRoles.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SYSTEM_ROLES.map((r) => {
                  const meta = ROLE_DEFINITIONS[r];
                  const isSelected = comparedRoles.includes(r);
                  return (
                    <button
                      key={r}
                      onClick={() => toggleComparedRole(r)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-purple-700 text-white shadow-xs ring-1 ring-purple-900'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-purple-100/50'
                      }`}
                    >
                      <span>{meta.label}</span>
                      {isSelected ? (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      ) : (
                        <span className="text-[9px] text-slate-400 font-mono">
                          +{ROLE_ABBREVIATIONS[r]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MATRIX PRESENTATION 1: ZERO-SCROLLBAR FLUID TABLE */}
          {matrixLayout === 'table' && (
            <div
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs overflow-hidden"
              data-testid="role-matrix-table"
            >
              <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-900">Interactive Permission Matrix: </span>
                  Click any cell to toggle. Superadmin is root-locked. Changes apply instantly and save on command.
                </div>
                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" /> Granted
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-slate-200 inline-block" /> Restricted
                  </span>
                </div>
              </div>

              {/* Zero-Scrollbar Table: Fluid table-fixed geometry with 100% width and no overflow scrollbar */}
              <table className="w-full table-fixed text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    {/* Permission Scope Column */}
                    <th
                      className={`p-2.5 sm:p-3.5 bg-slate-900 border-r border-slate-800 ${
                        activeMatrixRoles.length <= 4
                          ? 'w-[40%] sm:w-[45%]'
                          : activeMatrixRoles.length <= 7
                          ? 'w-[32%] sm:w-[35%]'
                          : 'w-[28%] sm:w-[30%]'
                      }`}
                    >
                      <span className="truncate block">Permission Scope</span>
                    </th>

                    {/* Dynamic Role Columns */}
                    {activeMatrixRoles.map((r) => {
                      const meta = ROLE_DEFINITIONS[r];
                      const isCompact = activeMatrixRoles.length > 7;

                      return (
                        <th
                          key={r}
                          className="p-1 sm:p-2 text-center border-r border-slate-800 last:border-none select-none"
                          title={`${meta.label} (Hierarchy Level ${meta.hierarchyLevel}) - ${meta.category} Domain`}
                        >
                          {isCompact ? (
                            <div className="flex flex-col items-center justify-center">
                              <span className="font-mono text-[9px] sm:text-[10px] font-black tracking-tight text-white uppercase">
                                {ROLE_ABBREVIATIONS[r]}
                              </span>
                              <span className="text-[8px] text-purple-300/80 font-mono leading-none">
                                L{meta.hierarchyLevel}
                              </span>
                            </div>
                          ) : (
                            <div className="truncate px-0.5">
                              <div className="font-bold truncate text-[11px] text-white">
                                {meta.label.split(' ')[0]}
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                Lvl {meta.hierarchyLevel}
                              </div>
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPermissions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeMatrixRoles.length + 1}
                        className="p-8 text-center text-slate-500 text-xs"
                      >
                        No permissions match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPermissions.map((perm, idx) => (
                      <tr
                        key={perm.id}
                        className={`hover:bg-purple-50/40 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        {/* Scope Cell */}
                        <td className="p-2 sm:p-3 font-medium border-r border-slate-200">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {getCategoryIcon(perm.category)}
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-900 truncate text-xs">
                                {perm.name}
                              </div>
                              <div className="font-mono text-[9px] text-slate-400 truncate">
                                {perm.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Interactive Role Toggle Cells */}
                        {activeMatrixRoles.map((r) => {
                          const isGranted =
                            r === 'superadmin' ||
                            (rolePermissions[r] || []).includes(perm.id);

                          return (
                            <td
                              key={r}
                              onClick={() => handleTogglePermission(r, perm.id)}
                              className={`p-1 sm:p-1.5 text-center border-r border-slate-100 last:border-none cursor-pointer transition-colors ${
                                isGranted
                                  ? 'bg-purple-50/40 hover:bg-purple-100/60'
                                  : 'hover:bg-slate-200/50'
                              }`}
                              title={`${isGranted ? 'Granted' : 'Restricted'}: ${perm.name} for ${ROLE_DEFINITIONS[r].label}`}
                            >
                              <div className="flex items-center justify-center">
                                {isGranted ? (
                                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                                  </span>
                                ) : (
                                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* MATRIX PRESENTATION 2: ZERO-SCROLLBAR CARD DECK GRID */}
          {matrixLayout === 'cards' && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4"
              data-testid="role-cards-grid"
            >
              {activeMatrixRoles.map((r) => {
                const meta = ROLE_DEFINITIONS[r];
                const perms = rolePermissions[r] || [];
                const activeCount = r === 'superadmin' ? SYSTEM_PERMISSIONS.length : perms.length;

                return (
                  <div
                    key={r}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-3 hover:border-purple-300 transition-all"
                  >
                    {/* Card Header */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${meta.badgeBg} ${meta.badgeText}`}>
                            {meta.label}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">
                            Lvl {meta.hierarchyLevel} • {meta.category}
                          </div>
                        </div>

                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-mono font-bold text-[11px] rounded-full border border-purple-200 shrink-0">
                          {activeCount} / {SYSTEM_PERMISSIONS.length}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {meta.description}
                      </p>
                    </div>

                    {/* Permissions Pill Cloud */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Permissions ({filteredPermissions.length} shown):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {filteredPermissions.map((perm) => {
                          const isGranted = r === 'superadmin' || perms.includes(perm.id);
                          return (
                            <button
                              key={perm.id}
                              onClick={() => handleTogglePermission(r, perm.id)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                                isGranted
                                  ? 'bg-purple-100 text-purple-900 font-semibold border border-purple-300 hover:bg-purple-200'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 hover:text-slate-700'
                              }`}
                              title={`${isGranted ? 'Revoke' : 'Grant'}: ${perm.name}`}
                            >
                              {isGranted && <Check className="w-2.5 h-2.5 text-purple-700 stroke-[3]" />}
                              <span className="truncate max-w-[120px]">{perm.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Footer Quick Actions */}
                    {r !== 'superadmin' && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                        <button
                          onClick={() => handleGrantAll(r)}
                          className="px-2 py-1 text-emerald-700 hover:bg-emerald-50 rounded-lg font-semibold transition-colors cursor-pointer"
                        >
                          Grant All
                        </button>

                        {confirmRevokeRole === r ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleConfirmRevoke(r)}
                              className="px-2 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={handleCancelRevoke}
                              className="px-1.5 py-1 text-slate-500 hover:text-slate-800 text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleInitiateRevoke(r)}
                            className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}

                        <button
                          onClick={() => handleResetDefaults(r)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer"
                        >
                          Defaults
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: SINGLE ROLE EDITOR (DETAILED ROLE PERMISSION BUILDER)
         ========================================================================= */}
      {viewMode === 'single' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Role Pill Navigation Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Select Role to Configure Permissions
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {SYSTEM_ROLES.map((r) => {
                const meta = ROLE_DEFINITIONS[r];
                const isSelected = selectedRole === r;
                const count = (rolePermissions[r] || []).length;

                return (
                  <button
                    key={r}
                    onClick={() => setSelectedRole(r)}
                    data-testid={`select-role-pill-${r}`}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-600/30'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{meta.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {r === 'superadmin' ? 'ALL' : `${count}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Selected Role Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-start sm:items-center gap-3">
                <div className={`px-4 py-2 rounded-xl text-sm font-extrabold ${selectedMeta.badgeBg} ${selectedMeta.badgeText} shadow-xs shrink-0`}>
                  {selectedMeta.label}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {selectedMeta.category} Domain
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-mono font-semibold text-slate-600">
                      Hierarchy: Level {selectedMeta.hierarchyLevel}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-purple-700">
                      {selectedRole === 'superadmin'
                        ? 'Full System Access (Irrevocable)'
                        : `${currentRolePerms.length} / ${SYSTEM_PERMISSIONS.length} Active Permissions`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl">
                    {selectedMeta.description}
                  </p>
                </div>
              </div>

              {/* Action Controls for this Role */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {selectedRole !== 'superadmin' && (
                  <>
                    <button
                      onClick={() => handleGrantAll(selectedRole)}
                      data-testid="grant-all-btn"
                      className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Grant All</span>
                    </button>

                    {confirmRevokeRole === selectedRole ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-xl border border-rose-300">
                        <button
                          onClick={() => handleConfirmRevoke(selectedRole)}
                          data-testid="confirm-revoke-btn"
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Confirm Revoke</span>
                        </button>
                        <button
                          onClick={handleCancelRevoke}
                          data-testid="cancel-revoke-btn"
                          className="px-2 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInitiateRevoke(selectedRole)}
                        data-testid="revoke-all-btn"
                        className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Revoke All</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleResetDefaults(selectedRole)}
                      data-testid="reset-defaults-btn"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Reset this role to default institutional baseline"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Defaults</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleSaveRole(selectedRole)}
                  disabled={isSaving || selectedRole === 'superadmin'}
                  data-testid="save-role-btn"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Role</span>
                </button>
              </div>
            </div>

            {/* Permissions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {filteredPermissions.map((perm) => {
                const isGranted =
                  selectedRole === 'superadmin' || currentRolePerms.includes(perm.id);

                return (
                  <div
                    key={perm.id}
                    onClick={() => handleTogglePermission(selectedRole, perm.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                      isGranted
                        ? 'bg-purple-50/60 border-purple-300 ring-1 ring-purple-400/20 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isGranted
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border-2 border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {perm.name}
                        </span>
                        <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-500 rounded font-mono text-[10px] shrink-0">
                          {perm.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {perm.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {getCategoryIcon(perm.category)}
                        <span className="text-[10px] font-semibold text-slate-500">
                          {perm.category}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
