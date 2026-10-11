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
      .catch(() => setError('Failed to load portfolio overview.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.25rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: 9999, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: '0.65rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 6px #818cf8' }} />
            <span style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a5b4fc' }}>
              Executive Portfolio Cockpit
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Operations & Credit Analytics
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.925rem', marginTop: '0.25rem' }}>
            Real-time facility deployment, underwriting pipeline throughput, and repayment performance.
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchStats}
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}
        >
          <svg className={isLoading ? 'animate-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
          </svg>
          <span>Refresh Analytics</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
          <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Aggregating multi-module metrics...</span>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : stats ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
          
          {/* Top 4 KPI Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            
            {/* Total Disbursed Capital */}
            <div className="stat-card" style={{ background: 'linear-gradient(145deg, rgba(16,185,129,0.08) 0%, rgba(14,20,34,0.9) 100%)', border: '1px solid rgba(16,185,129,0.22)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Total Disbursed Capital
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                  ₹
                </div>
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em', fontFeatureSettings: '"tnum"' }}>
                {formatCurrency(stats.totalDisbursedAmount)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#6ee7b7' }}>
                <span style={{ background: 'rgba(16,185,129,0.2)', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 700 }}>● Active</span>
                <span>Fully reconciled with UTR logs</span>
              </div>
            </div>

            {/* Total Loans Handled */}
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Applications Processed
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6M12 9v6"/></svg>
                </div>
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#818cf8', letterSpacing: '-0.03em' }}>
                {stats.totalLoans}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                Across all lifecycle underwriting states
              </div>
            </div>

            {/* Closed & Settled Loans */}
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Closed Facilities
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em' }}>
                {stats.byStatus.closed}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                100% principal & interest recovered
              </div>
            </div>

            {/* Active Repayments */}
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Active Collections
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.03em' }}>
                {stats.byStatus.disbursed}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                Awaiting complete UTR repayment
              </div>
            </div>

          </div>

          {/* Interactive Loan Lifecycle Pipeline Flow */}
          <div className="card-glass" style={{ padding: '2rem', borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Loan Lifecycle Pipeline Flow
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                  End-to-end status transitions and pipeline distribution in real-time.
                </p>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Governed by Automated BRE & Multi-Tier RBAC
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>
              
              {/* APPLIED */}
              <div style={{ padding: '1.25rem', background: 'rgba(14,20,34,0.7)', borderRadius: 14, border: '1px solid rgba(14,165,233,0.25)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-applied">APPLIED</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>{stats.byStatus.applied}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pending Underwriting</div>
                <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: '0.25rem' }}>Reviewed by Sanction Desk</div>
              </div>

              {/* SANCTIONED */}
              <div style={{ padding: '1.25rem', background: 'rgba(14,20,34,0.7)', borderRadius: 14, border: '1px solid rgba(168,85,247,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-sanctioned">SANCTIONED</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c084fc' }}>{stats.byStatus.sanctioned}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Credit Approved</div>
                <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: '0.25rem' }}>Ready for Disbursement</div>
              </div>

              {/* DISBURSED */}
              <div style={{ padding: '1.25rem', background: 'rgba(14,20,34,0.7)', borderRadius: 14, border: '1px solid rgba(245,158,11,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-disbursed">DISBURSED</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>{stats.byStatus.disbursed}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Capital Released</div>
                <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: '0.25rem' }}>Monitored by Collection</div>
              </div>

              {/* CLOSED */}
              <div style={{ padding: '1.25rem', background: 'rgba(14,20,34,0.7)', borderRadius: 14, border: '1px solid rgba(16,185,129,0.28)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-closed">CLOSED</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>{stats.byStatus.closed}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Settled & Paid</div>
                <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: '0.25rem' }}>Full UTR reconciliation</div>
              </div>

              {/* REJECTED */}
              <div style={{ padding: '1.25rem', background: 'rgba(14,20,34,0.7)', borderRadius: 14, border: '1px solid rgba(244,63,94,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-rejected">REJECTED</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fb7185' }}>{stats.byStatus.rejected}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Underwriting Declined</div>
                <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: '0.25rem' }}>Audited justification logged</div>
              </div>

            </div>
          </div>

          {/* Operational Module Launchpads */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Operational Team Launchpads
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              
              {/* Sales */}
              <div
                className="card-glass"
                style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 16 }}
                onClick={() => router.push('/dashboard/sales')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Sales Origination Desk</h3>
                    <p style={{ fontSize: '0.775rem', color: '#64748b' }}>Pre-application lead tracking</p>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm btn-full">Access Sales Pipeline →</button>
              </div>

              {/* Sanction */}
              <div
                className="card-glass"
                style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 16 }}
                onClick={() => router.push('/dashboard/sanction')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Sanction & Underwriting</h3>
                    <p style={{ fontSize: '0.775rem', color: '#64748b' }}>{stats.byStatus.applied} loans awaiting credit review</p>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm btn-full">Review Queue →</button>
              </div>

              {/* Disbursement */}
              <div
                className="card-glass"
                style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 16 }}
                onClick={() => router.push('/dashboard/disbursement')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Disbursement Desk</h3>
                    <p style={{ fontSize: '0.775rem', color: '#64748b' }}>{stats.byStatus.sanctioned} sanctioned ready for payout</p>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm btn-full">Process Payouts →</button>
              </div>

              {/* Collection */}
              <div
                className="card-glass"
                style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 16 }}
                onClick={() => router.push('/dashboard/collection')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Collection & Recovery</h3>
                    <p style={{ fontSize: '0.775rem', color: '#64748b' }}>{stats.byStatus.disbursed} active loan facilities</p>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm btn-full">Record Repayments →</button>
              </div>

            </div>
          </div>

        </div>
      ) : null}

    </div>
  );
}
