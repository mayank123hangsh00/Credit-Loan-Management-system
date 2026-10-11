'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loan, User } from '@/types';
import { formatCurrency, formatDate } from '@/lib/loanCalc';
import { AxiosError } from 'axios';

function BorrowerInfo({ borrower }: { borrower: User | string }) {
  if (typeof borrower === 'string') return <span>{borrower}</span>;
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{borrower.fullName || '—'}</div>
      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>{borrower.email}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 6, fontSize: '0.725rem', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span>PAN:</span>
        <span style={{ fontWeight: 700, letterSpacing: '0.05em' }}>{borrower.pan || '—'}</span>
      </div>
    </div>
  );
}

export default function SanctionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ loanId: string; } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLoans = () => {
    setIsLoading(true);
    api.get<{ loans: Loan[] }>('/dashboard/sanction/loans')
      .then(({ data }) => setLoans(data.loans))
      .catch(() => setError('Failed to fetch sanction queue.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleApprove = async (loanId: string) => {
    setActionLoading(loanId);
    try {
      await api.put(`/dashboard/sanction/${loanId}/approve`);
      showToast('Facility sanctioned & approved successfully! ✅');
      fetchLoans();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      showToast(axiosErr.response?.data?.message || 'Underwriting approval failed.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) return;
    setActionLoading(rejectModal.loanId);
    try {
      await api.put(`/dashboard/sanction/${rejectModal.loanId}/reject`, { reason: rejectReason });
      showToast('Application rejected with audit trail.');
      setRejectModal(null);
      setRejectReason('');
      fetchLoans();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      showToast(axiosErr.response?.data?.message || 'Rejection action failed.', 'error');
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

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Reject Loan Application</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Please specify the audit reason for credit rejection. This justification is permanently logged and visible in the borrower portal.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="reject-reason">Audit Reason *</label>
              <textarea
                id="reject-reason"
                className="form-input"
                rows={4}
                placeholder="e.g., Inconsistent salary documentation, debt-to-income threshold exceeded..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
              <button id="confirm-reject" className="btn btn-danger" onClick={handleReject} disabled={!rejectReason.trim() || actionLoading !== null}>
                {actionLoading ? <><div className="spinner" /> Recording...</> : 'Confirm Underwriting Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.25rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: 9999, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', marginBottom: '0.65rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c084fc', boxShadow: '0 0 6px #c084fc' }} />
            <span style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c084fc' }}>
              Credit Underwriting Desk
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Sanction & Assessment
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.925rem', marginTop: '0.25rem' }}>
            Inspect incoming borrower dossiers, review uploaded proof of income, and authorize facilities.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchLoans} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}>
          <svg className={isLoading ? 'animate-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
          </svg>
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Queue Stat Card */}
      <div className="stat-card" style={{ marginBottom: '2rem', maxWidth: 300, background: 'linear-gradient(145deg, rgba(168,85,247,0.08) 0%, rgba(14,20,34,0.9) 100%)', border: '1px solid rgba(168,85,247,0.22)' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          Pending Underwriting Review
        </p>
        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#c084fc', letterSpacing: '-0.03em' }}>
          {loans.length}
        </p>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
          Applications requiring credit sanction
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
          <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Loading sanction queue...</span>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : loans.length === 0 ? (
        <div className="card-glass" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#34d399' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Queue is Clear</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
            All applied loans have been reviewed and sanctioned. New applications will appear here automatically.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loans.map((loan) => {
            const borrower = loan.borrower as User;
            return (
              <div key={loan._id} className="card-glass" style={{ padding: '1.75rem', borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#818cf8' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <BorrowerInfo borrower={loan.borrower} />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {borrower.salarySlipUrl && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${borrower.salarySlipUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span>Inspect Slip</span>
                      </a>
                    )}
                    <button
                      id={`approve-${loan._id}`}
                      className="btn btn-success btn-sm"
                      onClick={() => handleApprove(loan._id)}
                      disabled={actionLoading === loan._id}
                    >
                      {actionLoading === loan._id ? <><div className="spinner" /> Sanctioning...</> : '✓ Approve & Sanction'}
                    </button>
                    <button
                      id={`reject-${loan._id}`}
                      className="btn btn-danger btn-sm"
                      onClick={() => setRejectModal({ loanId: loan._id })}
                      disabled={actionLoading === loan._id}
                    >
                      ✕ Decline
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
                  {[
                    ['Facility Amount', formatCurrency(loan.loanAmount), '#34d399'],
                    ['Tenure', `${loan.tenureDays} days`, '#f8fafc'],
                    ['Total Repayment', formatCurrency(loan.totalRepayment), '#c084fc'],
                    ['Employment', borrower.employmentMode || '—', '#f8fafc'],
                    ['Monthly Salary', borrower.monthlySalary ? `₹${borrower.monthlySalary.toLocaleString('en-IN')}` : '—', '#34d399'],
                    ['Application Date', formatDate(loan.createdAt), '#94a3b8'],
                  ].map(([label, value, color]) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize: '0.675rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{label}</p>
                      <p style={{ fontWeight: 700, fontSize: '0.925rem', color: color as string, letterSpacing: '-0.01em', textTransform: 'capitalize' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
