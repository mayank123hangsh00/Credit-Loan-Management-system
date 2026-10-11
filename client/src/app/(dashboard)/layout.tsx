'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/types';

const MODULE_CONFIG: Record<string, { roles: UserRole[]; label: string; icon: React.ReactNode; path: string }> = {
  overview: {
    roles: ['admin'],
    label: 'Overview',
    path: '/dashboard/overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  sales: {
    roles: ['sales', 'admin'],
    label: 'Sales',
    path: '/dashboard/sales',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  sanction: {
    roles: ['sanction', 'admin'],
    label: 'Sanction',
    path: '/dashboard/sanction',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  disbursement: {
    roles: ['disbursement', 'admin'],
    label: 'Disbursement',
    path: '/dashboard/disbursement',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
  },
  collection: {
    roles: ['collection', 'admin'],
    label: 'Collection',
    path: '/dashboard/collection',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role === 'borrower') { router.replace('/apply'); return; }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
      </div>
    );
  }

  if (user.role === 'borrower') return null;

  const visibleModules = Object.entries(MODULE_CONFIG).filter(
    ([, config]) => config.roles.includes(user.role)
  );

  const roleColors: Record<string, string> = {
    admin: 'var(--primary-400)',
    sales: '#22c55e',
    sanction: 'var(--accent-400)',
    disbursement: 'var(--warning-400)',
    collection: '#f87171',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--bg-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>CreditSea</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Operations Dashboard</div>
            </div>
          </div>

          {/* User badge */}
          <div style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-border)', marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: roleColors[user.role] || 'var(--primary-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {user.role}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.fullName || user.email}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '1rem', flex: 1 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', padding: '0 0.25rem' }}>
            Modules
          </p>
          {visibleModules.map(([key, config]) => (
            <button
              key={key}
              className={`sidebar-link ${pathname === config.path ? 'active' : ''}`}
              onClick={() => router.push(config.path)}
              id={`sidebar-${key}`}
            >
              {config.icon}
              {config.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--bg-border)' }}>
          <button className="sidebar-link" onClick={logout} style={{ color: 'var(--danger-400)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
