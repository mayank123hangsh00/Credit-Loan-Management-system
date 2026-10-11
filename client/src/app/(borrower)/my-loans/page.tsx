'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/loanCalc';

function LoanStatusBadge({ status }: { status: string }) {
  const cls = `badge badge-${status.toLowerCase()}`;
  const icons: Record<string, string> = {
    APPLIED: '📋', SANCTIONED: '✅', DISBURSED: '💸', CLOSED: '🎉', REJECTED: '❌',
  };
  return <span className={cls}>{icons[status]} {status}</span>;
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
      .catch(() => setError('Failed to fetch loans.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--primary-400)' }}>CreditSea</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Loans</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Hello, {user?.fullName || user?.email} 👋
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/apply')}>+ Apply for Loan</button>
            <button className="btn btn-secondary btn-sm" onClick={logout}>Logout</button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : loans.length === 0 ? (
          <div className="card empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No loans yet</h3>
            <p style={{ marginBottom: '1.5rem' }}>You haven&apos;t applied for any loans.</p>
            <button className="btn btn-primary" onClick={() => router.push('/apply')}>Apply for Your First Loan</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {loans.map((loan) => (
              <div key={loan._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                        {formatCurrency(loan.loanAmount)}
                      </h3>
                      <LoanStatusBadge status={loan.status} />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      Applied {formatDate(loan.createdAt)} · {loan.tenureDays} days tenure
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                  {[
                    ['Interest', formatCurrency(loan.simpleInterest), 'var(--warning-400)'],
                    ['Total Repayment', formatCurrency(loan.totalRepayment), 'var(--primary-400)'],
                    ['Outstanding', formatCurrency(loan.outstandingBalance), loan.outstandingBalance > 0 ? 'var(--danger-400)' : 'var(--success-400)'],
                  ].map(([label, value, color]) => (
                    <div key={label} style={{ background: 'var(--bg-card-2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', border: '1px solid var(--bg-border)' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</p>
                      <p style={{ fontWeight: 700, color }}>{value}</p>
                    </div>
                  ))}
                </div>

                {loan.rejectionReason && (
                  <div className="alert alert-error" style={{ fontSize: '0.8rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <strong>Rejection reason:</strong> {loan.rejectionReason}
                  </div>
                )}

                {loan.status === 'CLOSED' && (
                  <div className="alert alert-success" style={{ fontSize: '0.8rem' }}>
                    🎉 This loan has been fully repaid and closed on {loan.closedAt ? formatDate(loan.closedAt) : '—'}.
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
