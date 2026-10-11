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
      <div style={{ fontWeight: 600 }}>{borrower.fullName || '—'}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{borrower.email}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PAN: {borrower.pan || '—'}</div>
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
      .catch(() => setError('Failed to fetch loans.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleApprove = async (loanId: string) => {
    setActionLoading(loanId);
    try {
      await api.put(`/dashboard/sanction/${loanId}/approve`);
      showToast('Loan sanctioned successfully! ✅');
      fetchLoans();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      showToast(axiosErr.response?.data?.message || 'Failed to approve.', 'error');
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
      showToast('Loan rejected.');
      setRejectModal(null);
      setRejectReason('');
      fetchLoans();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      showToast(axiosErr.response?.data?.message || 'Failed to reject.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, animation: 'slideIn 0.3s both' }}>
          <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ minWidth: 280, boxShadow: 'var(--shadow-lg)' }}>
            {toast.msg}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Reject Loan</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Please provide a clear reason for rejection. This will be shown to the borrower.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="reject-reason">Rejection Reason *</label>
              <textarea
                id="reject-reason"
                className="form-input"
                rows={4}
                placeholder="e.g., Income does not meet minimum requirements..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
              <button id="confirm-reject" className="btn btn-danger" onClick={handleReject} disabled={!rejectReason.trim() || actionLoading !== null}>
                {actionLoading ? <><div className="spinner" /> Rejecting...</> : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Sanction — Loan Review</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Review loan applications and approve or reject them.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchLoans}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          Refresh
        </button>
      </div>

      <div className="stat-card" style={{ marginBottom: '1.5rem', maxWidth: 280 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Pending Review</p>
        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-400)' }}>{loans.length}</p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} /></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : loans.length === 0 ? (
        <div className="card empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          <h3>No pending applications</h3>
          <p>All loan applications have been reviewed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loans.map((loan) => {
            const borrower = loan.borrower as User;
            return (
              <div key={loan._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <BorrowerInfo borrower={loan.borrower} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {borrower.salarySlipUrl && (
                      <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${borrower.salarySlipUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                        📄 View Slip
                      </a>
                    )}
                    <button
                      id={`approve-${loan._id}`}
                      className="btn btn-success btn-sm"
                      onClick={() => handleApprove(loan._id)}
                      disabled={actionLoading === loan._id}
                    >
                      {actionLoading === loan._id ? <div className="spinner" /> : '✅ Approve'}
                    </button>
                    <button
                      id={`reject-${loan._id}`}
                      className="btn btn-danger btn-sm"
                      onClick={() => setRejectModal({ loanId: loan._id })}
                      disabled={actionLoading === loan._id}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {[
                    ['Loan Amount', formatCurrency(loan.loanAmount)],
                    ['Tenure', `${loan.tenureDays} days`],
                    ['Total Repayment', formatCurrency(loan.totalRepayment)],
                    ['Employment', (borrower.employmentMode || '—')],
                    ['Monthly Salary', borrower.monthlySalary ? `₹${borrower.monthlySalary.toLocaleString('en-IN')}` : '—'],
                    ['Applied', formatDate(loan.createdAt)],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: 'var(--bg-card-2)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.875rem', border: '1px solid var(--bg-border)' }}>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label}</p>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize' }}>{value}</p>
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
