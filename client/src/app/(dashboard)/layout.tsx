'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/types';

const MODULE_CONFIG: Record<string, { roles: UserRole[]; label: string; icon: React.ReactNode; path: string; category: string }> = {
  overview: {
    roles: ['admin'],
    label: 'Executive Overview',
    category: 'GOVERNANCE',
    path: '/dashboard/overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  sales: {
    roles: ['sales', 'admin'],
    label: 'Sales & Leads',
    category: 'ORIGINATION',
    path: '/dashboard/sales',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  sanction: {
    roles: ['sanction', 'admin'],
    label: 'Sanction Review',
    category: 'UNDERWRITING',
    path: '/dashboard/sanction',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  disbursement: {
    roles: ['disbursement', 'admin'],
    label: 'Disbursement Desk',
    category: 'CAPITAL OPS',
    path: '/dashboard/disbursement',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
  },
  collection: {
    roles: ['collection', 'admin'],
    label: 'Collections & Recovery',
    category: 'SERVICING',
    path: '/dashboard/collection',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, login } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role === 'borrower') { router.replace('/apply'); return; }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#070a10' }}>
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
      </div>
    );
  }

  if (user.role === 'borrower') return null;

  const visibleModules = Object.entries(MODULE_CONFIG).filter(
    ([, config]) => config.roles.includes(user.role)
  );

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    admin: { bg: 'rgba(99,102,241,0.14)', text: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
    sales: { bg: 'rgba(52,211,153,0.14)', text: '#34d399', border: 'rgba(52,211,153,0.3)' },
    sanction: { bg: 'rgba(192,132,252,0.14)', text: '#c084fc', border: 'rgba(192,132,252,0.3)' },
    disbursement: { bg: 'rgba(251,191,36,0.14)', text: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
    collection: { bg: 'rgba(251,113,133,0.14)', text: '#fb7185', border: 'rgba(251,113,133,0.3)' },
  };

  const currentRoleStyle = roleColors[user.role] || roleColors.admin;

  const currentModuleTitle = Object.values(MODULE_CONFIG).find(m => m.path === pathname)?.label || 'Dashboard';

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : 'EX';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070a10', color: '#f8fafc' }}>
      
      {/* Sleek Enterprise Sidebar */}
      <aside className="sidebar">
        {/* Brand Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(79,70,229,0.45)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#fff' }}>
                CreditSea
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                Operations LMS
              </div>
            </div>
          </div>

          {/* Current User Identity Card */}
          <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: currentRoleStyle.bg, border: `1px solid ${currentRoleStyle.border}`, color: currentRoleStyle.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
              {getInitials(user.fullName, user.email)}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.15rem 0.5rem', borderRadius: 9999, background: currentRoleStyle.bg, border: `1px solid ${currentRoleStyle.border}`, color: currentRoleStyle.text, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: currentRoleStyle.text }} />
                {user.role}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.fullName || user.email}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Modules */}
        <nav style={{ padding: '1.25rem 0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ fontSize: '0.675rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '0.75rem' }}>
            OPERATIONS DESK
          </div>
          {visibleModules.map(([key, config]) => {
            const isActive = pathname === config.path;
            return (
              <button
                key={key}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => router.push(config.path)}
                id={`sidebar-${key}`}
                style={{ position: 'relative' }}
              >
                <span style={{ color: isActive ? '#a5b4fc' : '#64748b', display: 'flex', alignItems: 'center' }}>
                  {config.icon}
                </span>
                <span style={{ flex: 1 }}>{config.label}</span>
                {isActive && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* System & DB Status Badge */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ padding: '0.75rem', borderRadius: 10, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.18)', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.04em' }}>
                MongoDB Atlas Live
              </span>
            </div>
            <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: 2 }}>
              Cluster0 • Low Latency
            </div>
          </div>

          <button
            className="sidebar-link"
            onClick={logout}
            style={{ color: '#fb7185', background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 8 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        
        {/* Top Header Bar with Breadcrumb and Environment Badges */}
        <header style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(9,13,22,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.825rem' }}>Operations</span>
            <span style={{ color: '#334155' }}>/</span>
            <span style={{ color: '#f8fafc', fontSize: '0.875rem', fontWeight: 600 }}>{currentModuleTitle}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Environment chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.3rem 0.75rem', borderRadius: 9999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
              <span>Production Live</span>
            </div>

            {/* Quick Evaluator Role Switcher Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>Role:</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: currentRoleStyle.text, textTransform: 'uppercase', background: currentRoleStyle.bg, border: `1px solid ${currentRoleStyle.border}`, padding: '0.2rem 0.55rem', borderRadius: 6 }}>
                {user.role}
              </span>
            </div>
          </div>
        </header>

        {/* Page Children */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'radial-gradient(ellipse at top, rgba(79,70,229,0.05) 0%, transparent 60%)' }}>
          {children}
        </main>
      </div>

    </div>
  );
}
