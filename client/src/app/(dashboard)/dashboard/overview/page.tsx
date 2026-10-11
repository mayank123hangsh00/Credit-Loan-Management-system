'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatCurrency } from '@/lib/loanCalc';

export default function AdminOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = () => {
    setIsLoading(true);
    api.get<{ stats: DashboardStats }>('/dashboard/stats')
      .then(({ data }) => setStats(data.stats))
      .catch(() => setError('Failed to load dashboard overview.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-400)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.2rem 0.6rem', borderRadius: 9999 }}>
              Admin Console
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Portfolio & Operations Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Executive metrics and lifecycle pipeline monitoring across all modules.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchStats}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          Refresh Data
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : stats ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="stat-card">
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Total Borrowers
              </p>
              <p style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                {stats.totalBorrowers}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Registered on platform
              </p>
            </div>

            <div className="stat-card">
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Total Loans Applied
              </p>
              <p style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-400)' }}>
                {stats.totalLoans}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Across all lifecycle states
              </p>
            </div>

            <div className="stat-card">
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Total Disbursed Capital
              </p>
              <p style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--success-400)' }}>
                {formatCurrency(stats.totalDisbursedAmount)}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Active & closed facilities
              </p>
            </div>

            <div className="stat-card">
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Active Repayments
              </p>
              <p style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f59e0b' }}>
                {stats.byStatus.disbursed}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Currently in collection
              </p>
            </div>
          </div>

          {/* Lifecycle Breakdown Section */}
          <div className="card-glass" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Loan Lifecycle Pipeline
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Distribution of all loans by their current state in the lending flow.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1.25rem', background: 'var(--bg-card-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-applied">APPLIED</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.byStatus.applied}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Awaiting Sanction review</p>
              </div>

              <div style={{ padding: '1.25rem', background: 'var(--bg-card-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-sanctioned">SANCTIONED</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-400)' }}>{stats.byStatus.sanctioned}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Approved, pending funds release</p>
              </div>

              <div style={{ padding: '1.25rem', background: 'var(--bg-card-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-disbursed">DISBURSED</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning-400)' }}>{stats.byStatus.disbursed}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Active loan with outstanding EMI</p>
              </div>

              <div style={{ padding: '1.25rem', background: 'var(--bg-card-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-closed">CLOSED</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success-400)' }}>{stats.byStatus.closed}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fully repaid & completed</p>
              </div>

              <div style={{ padding: '1.25rem', background: 'var(--bg-card-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-rejected">REJECTED</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger-400)' }}>{stats.byStatus.rejected}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Declined during sanction</p>
              </div>
            </div>
          </div>

          {/* Quick Access to Operational Modules */}
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
              Operational Modules
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <div
                className="card-glass hover-scale"
                style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => router.push('/dashboard/sales')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Sales Module</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lead conversion & borrower follow-up</p>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>View Leads →</button>
              </div>

              <div
                className="card-glass hover-scale"
                style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => router.push('/dashboard/sanction')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124, 58, 237, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-400)" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Sanction Module</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.byStatus.applied} pending review</p>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>Review Applications →</button>
              </div>

              <div
                className="card-glass hover-scale"
                style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => router.push('/dashboard/disbursement')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning-400)" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Disbursement Module</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.byStatus.sanctioned} loans ready</p>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>Disburse Funds →</button>
              </div>

              <div
                className="card-glass hover-scale"
                style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => router.push('/dashboard/collection')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Collection Module</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.byStatus.disbursed} active collections</p>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>Manage Repayments →</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
