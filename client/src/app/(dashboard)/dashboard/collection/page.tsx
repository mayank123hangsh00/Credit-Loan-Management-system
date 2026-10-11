'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loan, Payment, User } from '@/types';
import { formatCurrency, formatDate } from '@/lib/loanCalc';
import { AxiosError } from 'axios';

interface CollectionLoan extends Loan {
  payments?: Payment[];
}

export default function CollectionPage() {
  const [loans, setLoans] = useState<CollectionLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentModal, setPaymentModal] = useState<{ loan: CollectionLoan } | null>(null);
  const [paymentForm, setPaymentForm] = useState({ utrNumber: '', amount: '', date: new Date().toISOString().slice(0, 10) });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [loanPayments, setLoanPayments] = useState<Record<string, Payment[]>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchLoans = () => {
    setIsLoading(true);
    api.get<{ loans: CollectionLoan[] }>('/dashboard/collection/loans')
      .then(({ data }) => setLoans(data.loans))
      .catch(() => setError('Failed to fetch loans.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchLoans(); }, []);

  const fetchPayments = async (loanId: string) => {
    if (loanPayments[loanId]) return;
    try {
      const { data } = await api.get<{ payments: Payment[] }>(`/dashboard/collection/${loanId}/payments`);
      setLoanPayments(prev => ({ ...prev, [loanId]: data.payments }));
    } catch {
      // silent
    }
  };

  const toggleExpand = (loanId: string) => {
    if (expandedLoan === loanId) {
      setExpandedLoan(null);
    } else {
      setExpandedLoan(loanId);
      fetchPayments(loanId);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentModal) return;
    setPaymentError('');

    const amount = Number(paymentForm.amount);
    if (!paymentForm.utrNumber.trim()) { setPaymentError('UTR number is required.'); return; }
    if (!amount || amount <= 0) { setPaymentError('Enter a valid amount.'); return; }
    if (amount > paymentModal.loan.outstandingBalance) {
      setPaymentError(`Amount cannot exceed outstanding balance of ${formatCurrency(paymentModal.loan.outstandingBalance)}`);
      return;
    }

    setPaymentLoading(true);
    try {
      const { data } = await api.post(`/dashboard/collection/${paymentModal.loan._id}/payment`, {
        utrNumber: paymentForm.utrNumber.trim().toUpperCase(),
        amount,
        date: paymentForm.date,
      });

      if (data.loanClosed) {
        showToast('🎉 Payment recorded! Loan fully repaid and CLOSED!');
      } else {
        showToast(`Payment of ${formatCurrency(amount)} recorded. Outstanding: ${formatCurrency(data.loan.outstandingBalance)}`);
      }

      setPaymentModal(null);
      setPaymentForm({ utrNumber: '', amount: '', date: new Date().toISOString().slice(0, 10) });
      // Clear payment cache for this loan
      setLoanPayments(prev => { const n = { ...prev }; delete n[paymentModal.loan._id]; return n; });
      fetchLoans();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setPaymentError(axiosErr.response?.data?.message || 'Failed to record payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const progressPct = (loan: CollectionLoan) => {
    const paid = loan.totalRepayment - loan.outstandingBalance;
    return Math.min(100, Math.round((paid / loan.totalRepayment) * 100));
  };

  return (
    <div style={{ padding: '2rem' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, animation: 'slideIn 0.3s both' }}>
          <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ minWidth: 300, boxShadow: 'var(--shadow-lg)' }}>
            {toast.msg}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Record Payment</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              Loan: {formatCurrency(paymentModal.loan.loanAmount)} · Outstanding: <strong style={{ color: 'var(--danger-400)' }}>{formatCurrency(paymentModal.loan.outstandingBalance)}</strong>
            </p>

            {paymentError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                {paymentError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="utr">UTR Number *</label>
                <input id="utr" type="text" className="form-input" placeholder="e.g. UTR123456789" value={paymentForm.utrNumber} onChange={(e) => setPaymentForm(p => ({ ...p, utrNumber: e.target.value.toUpperCase() }))} />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Must be unique across all payments</p>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pay-amount">Amount (₹) *</label>
                <input id="pay-amount" type="number" className="form-input" placeholder={`Max: ₹${paymentModal.loan.outstandingBalance.toLocaleString('en-IN')}`} value={paymentForm.amount} onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))} min="1" max={paymentModal.loan.outstandingBalance} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pay-date">Payment Date *</label>
                <input id="pay-date" type="date" className="form-input" value={paymentForm.date} onChange={(e) => setPaymentForm(p => ({ ...p, date: e.target.value }))} max={new Date().toISOString().slice(0, 10)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setPaymentModal(null); setPaymentError(''); }}>Cancel</button>
              <button id="record-payment-btn" className="btn btn-success" onClick={handleRecordPayment} disabled={paymentLoading}>
                {paymentLoading ? <><div className="spinner" /> Recording...</> : '✅ Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Collection — Repayments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Track and record repayments for active and closed loans.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchLoans}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          ['Active Loans', loans.filter(l => l.status === 'DISBURSED').length, '#f87171'],
          ['Closed Loans', loans.filter(l => l.status === 'CLOSED').length, 'var(--success-400)'],
          ['Total Loans', loans.length, 'var(--primary-400)'],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="stat-card">
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: String(color) }}>{value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} /></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : loans.length === 0 ? (
        <div className="card empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          <h3>No active loans</h3>
          <p>No disbursed loans found for collection.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loans.map((loan) => {
            const borrower = loan.borrower as User;
            const pct = progressPct(loan);
            const isExpanded = expandedLoan === loan._id;
            const isClosed = loan.status === 'CLOSED';

            return (
              <div key={loan._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
                        {borrower.fullName || borrower.email}
                      </h3>
                      <span className={`badge badge-${loan.status.toLowerCase()}`}>{loan.status}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Loan: {formatCurrency(loan.loanAmount)} · Total Repayment: {formatCurrency(loan.totalRepayment)}
                    </p>

                    {/* Progress bar */}
                    <div style={{ marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Repayment progress</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isClosed ? 'var(--success-400)' : 'var(--primary-400)' }}>{pct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: isClosed ? 'var(--grad-success)' : 'var(--grad-primary)' }} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: isClosed ? 'var(--success-400)' : 'var(--danger-400)', fontWeight: 600 }}>
                      {isClosed ? '✅ Fully repaid' : `Outstanding: ${formatCurrency(loan.outstandingBalance)}`}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, alignItems: 'flex-start' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleExpand(loan._id)}>
                      {isExpanded ? '▲ Hide History' : '▼ View History'}
                    </button>
                    {!isClosed && (
                      <button
                        id={`payment-${loan._id}`}
                        className="btn btn-success btn-sm"
                        onClick={() => { setPaymentModal({ loan }); setPaymentError(''); }}
                      >
                        + Record Payment
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment History */}
                {isExpanded && (
                  <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--bg-border)', paddingTop: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--text-secondary)' }}>
                      Payment History
                    </h4>
                    {!loanPayments[loan._id] ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}><div className="spinner" /></div>
                    ) : loanPayments[loan._id].length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No payments recorded yet.</p>
                    ) : (
                      <div className="table-wrapper">
                        <table className="data-table" style={{ fontSize: '0.8rem' }}>
                          <thead>
                            <tr><th>UTR Number</th><th>Amount</th><th>Date</th><th>Recorded By</th></tr>
                          </thead>
                          <tbody>
                            {loanPayments[loan._id].map((p) => (
                              <tr key={p._id}>
                                <td style={{ fontFamily: 'monospace', color: 'var(--primary-300)' }}>{p.utrNumber}</td>
                                <td style={{ fontWeight: 600, color: 'var(--success-400)' }}>{formatCurrency(p.amount)}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{formatDate(p.date)}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{(p.recordedBy as User)?.fullName || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
