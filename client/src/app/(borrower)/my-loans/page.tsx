'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/loanCalc';

function LoanStatusBadge({ status }: { status: string }) {
  const cls = `badge badge-${status.toLowerCase()}`;
  return <span className={cls}>{status}</span>;
}

export default function MyLoansPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ loans: Loan[] }>('/loans/my-loans')
      .then(({ data }) => setLoans(data.loans))
      .catch(() => setError('Failed to fetch your loan portfolio.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#070a10', color: '#f8fafc', padding: '2.5rem 1.5rem', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-10%', left: '10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      
      <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <span style={{ fontWeight: 800, color: '#a5b4fc', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>CreditSea</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Borrower Facility Portfolio</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Account Holder: <strong style={{ color: '#fff' }}>{user?.fullName || user?.email}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/apply')} style={{ padding: '0.55rem 1rem' }}>
              + New Loan Application
            </button>
            <button className="btn btn-secondary btn-sm" onClick={logout}>Sign Out</button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
            <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Retrieving personal facilities...</span>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : loans.length === 0 ? (
          <div className="card-glass" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#818cf8' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>No Active Loans</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.75rem' }}>You haven&apos;t applied for any loan facilities yet.</p>
            <button className="btn btn-primary" onClick={() => router.push('/apply')}>Apply for Your First Loan →</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {loans.map((loan) => (
              <div key={loan._id} className="card-glass" style={{ padding: '1.75rem', borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"' }}>
                        {formatCurrency(loan.loanAmount)}
                      </h3>
                      <LoanStatusBadge status={loan.status} />
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.825rem' }}>
                      Applied {formatDate(loan.createdAt)} · {loan.tenureDays} days tenure @ 12% p.a.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: '0.675rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Interest Accrued</p>
                    <p style={{ fontWeight: 700, color: '#fbbf24', fontFeatureSettings: '"tnum"' }}>{formatCurrency(loan.simpleInterest)}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: '0.675rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Total Repayment</p>
                    <p style={{ fontWeight: 700, color: '#a5b4fc', fontFeatureSettings: '"tnum"' }}>{formatCurrency(loan.totalRepayment)}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: '0.675rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Outstanding Balance</p>
                    <p style={{ fontWeight: 800, color: loan.outstandingBalance > 0 ? '#fb7185' : '#34d399', fontFeatureSettings: '"tnum"' }}>{formatCurrency(loan.outstandingBalance)}</p>
                  </div>
                </div>

                {loan.rejectionReason && (
                  <div className="alert alert-error" style={{ marginTop: '1rem', fontSize: '0.825rem' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <div><strong>Underwriting Audit Reason:</strong> {loan.rejectionReason}</div>
                  </div>
                )}

                {loan.status === 'CLOSED' && (
                  <div className="alert alert-success" style={{ marginTop: '1rem', fontSize: '0.825rem' }}>
                    <span>🎉 Facility fully settled and closed on {loan.closedAt ? formatDate(loan.closedAt) : '—'}. Complete UTR audit logged.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
