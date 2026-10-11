'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loan, User } from '@/types';
import { formatCurrency, formatDate } from '@/lib/loanCalc';
import { AxiosError } from 'axios';

export default function DisbursementPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLoans = () => {
    setIsLoading(true);
    api.get<{ loans: Loan[] }>('/dashboard/disbursement/loans')
      .then(({ data }) => setLoans(data.loans))
      .catch(() => setError('Failed to fetch disbursement desk.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleDisburse = async (loanId: string) => {
    setActionLoading(loanId);
    try {
      await api.put(`/dashboard/disbursement/${loanId}/disburse`);
      showToast('Facility disbursed! Capital released to borrower account. 💸');
      fetchLoans();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      showToast(axiosErr.response?.data?.message || 'Disbursement execution failed.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Toast Notification (Fixed bottom-right so it NEVER overlaps buttons) */}
      {toast && (
        <div className="toast-fixed">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: toast.type === 'success' ? '#34d399' : '#fb7185', boxShadow: `0 0 10px ${toast.type === 'success' ? '#34d399' : '#fb7185'}` }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc', flex: 1 }}>
            {toast.msg}
          </span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2, fontSize: '1rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.25rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: 9999, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: '0.65rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' }} />
            <span style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24' }}>
              Treasury Operations
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Disbursement Desk
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.925rem', marginTop: '0.25rem' }}>
            Execute fund release for sanctioned loan facilities and activate repayment schedule.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchLoans} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}>
          <svg className={isLoading ? 'animate-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
          </svg>
          <span>Refresh Desk</span>
        </button>
      </div>

      {/* Queue Stat Card */}
      <div className="stat-card" style={{ marginBottom: '2rem', maxWidth: 300, background: 'linear-gradient(145deg, rgba(245,158,11,0.08) 0%, rgba(14,20,34,0.9) 100%)', border: '1px solid rgba(245,158,11,0.22)' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          Awaiting Payout Execution
        </p>
        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.03em' }}>
          {loans.length}
        </p>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
          Sanctioned facilities pending release
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
          <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Querying sanctioned facilities...</span>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : loans.length === 0 ? (
        <div className="card-glass" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#fbbf24' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>No Loans Awaiting Disbursement</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
            All approved loans have been disbursed. New sanctioned applications will appear here for payout execution.
          </p>
        </div>
      ) : (
        <div className="card-glass" style={{ padding: '0', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Borrower Dossier</th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sanctioned Amount</th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tenure</th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Repayment</th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Approved By</th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sanction Date</th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const borrower = loan.borrower as User;
                const sanctionedBy = loan.sanctionedBy as User | undefined;
                return (
                  <tr key={loan._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{borrower.fullName || '—'}</div>
                      <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>{borrower.email}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: 2 }}>PAN: {borrower.pan || '—'}</div>
                    </td>
                    <td style={{ padding: '1.25rem', fontWeight: 800, color: '#34d399', fontSize: '1rem', fontFeatureSettings: '"tnum"' }}>
                      {formatCurrency(loan.loanAmount)}
                    </td>
                    <td style={{ padding: '1.25rem', color: '#cbd5e1' }}>
                      {loan.tenureDays} days
                    </td>
                    <td style={{ padding: '1.25rem', fontWeight: 700, color: '#c084fc', fontFeatureSettings: '"tnum"' }}>
                      {formatCurrency(loan.totalRepayment)}
                    </td>
                    <td style={{ padding: '1.25rem', color: '#94a3b8', fontSize: '0.825rem' }}>
                      {sanctionedBy?.fullName || 'Sanction Desk'}
                    </td>
                    <td style={{ padding: '1.25rem', color: '#64748b', fontSize: '0.825rem' }}>
                      {loan.sanctionedAt ? formatDate(loan.sanctionedAt) : '—'}
                    </td>
                    <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                      <button
                        id={`disburse-${loan._id}`}
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDisburse(loan._id)}
                        disabled={actionLoading === loan._id}
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}
                      >
                        {actionLoading === loan._id ? <><div className="spinner" /> Releasing...</> : '⚡ Disburse Funds'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
