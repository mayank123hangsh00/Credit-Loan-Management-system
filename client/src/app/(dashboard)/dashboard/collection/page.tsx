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
      .catch(() => setError('Failed to fetch collections desk.'))
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
    if (!paymentForm.utrNumber.trim()) { setPaymentError('Unique UTR number is required.'); return; }
    if (!amount || amount <= 0) { setPaymentError('Enter a valid payment amount.'); return; }
    if (amount > paymentModal.loan.outstandingBalance) {
      setPaymentError(`Payment cannot exceed outstanding balance of ${formatCurrency(paymentModal.loan.outstandingBalance)}`);
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
        showToast('🎉 Payment logged! Outstanding balance reached ₹0 — Facility AUTO-CLOSED!');
      } else {
        showToast(`Payment of ${formatCurrency(amount)} recorded. Outstanding: ${formatCurrency(data.loan.outstandingBalance)}`);
      }

      setPaymentModal(null);
      setPaymentForm({ utrNumber: '', amount: '', date: new Date().toISOString().slice(0, 10) });
      setLoanPayments(prev => { const n = { ...prev }; delete n[paymentModal.loan._id]; return n; });
      fetchLoans();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setPaymentError(axiosErr.response?.data?.message || 'Failed to record payment transaction.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const progressPct = (loan: CollectionLoan) => {
    const paid = loan.totalRepayment - loan.outstandingBalance;
    return Math.min(100, Math.round((paid / loan.totalRepayment) * 100));
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

      {/* Payment Recording Modal */}
      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Record EMI / Settlement</h3>
            </div>
            
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Facility: {formatCurrency(paymentModal.loan.loanAmount)} · Outstanding: <strong style={{ color: '#fb7185' }}>{formatCurrency(paymentModal.loan.outstandingBalance)}</strong>
            </p>

            {paymentError && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                {paymentError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="utr">Unique UTR / Ref Number *</label>
                <input
                  id="utr"
                  type="text"
                  className="form-input"
                  placeholder="e.g., UTR9876543210"
                  value={paymentForm.utrNumber}
                  onChange={(e) => setPaymentForm(p => ({ ...p, utrNumber: e.target.value.toUpperCase() }))}
                />
                <p style={{ fontSize: '0.725rem', color: '#64748b' }}>Must be unique across all database payments</p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pay-amount">Repayment Amount (₹) *</label>
                <input
                  id="pay-amount"
                  type="number"
                  className="form-input"
                  placeholder={`Max: ₹${paymentModal.loan.outstandingBalance.toLocaleString('en-IN')}`}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                  min="1"
                  max={paymentModal.loan.outstandingBalance}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pay-date">Transaction Date *</label>
                <input
                  id="pay-date"
                  type="date"
                  className="form-input"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm(p => ({ ...p, date: e.target.value }))}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setPaymentModal(null); setPaymentError(''); }}>Cancel</button>
              <button
                id="record-payment-btn"
                className="btn btn-success"
                onClick={handleRecordPayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? <><div className="spinner" /> Logging Transaction...</> : '✓ Reconcile & Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.25rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: 9999, background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.25)', marginBottom: '0.65rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb7185', boxShadow: '0 0 6px #fb7185' }} />
            <span style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fb7185' }}>
              Collections & Servicing
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Loan Servicing & Repayments
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.925rem', marginTop: '0.25rem' }}>
            Monitor active repayments, log incoming UTR bank transfers, and audit auto-closed facilities.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchLoans} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}>
          <svg className={isLoading ? 'animate-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
          </svg>
          <span>Refresh Desk</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(145deg, rgba(244,63,94,0.08) 0%, rgba(14,20,34,0.9) 100%)', border: '1px solid rgba(244,63,94,0.22)' }}>
          <p style={{ fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Active Disbursed Facilities</p>
          <p style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fb7185' }}>{loans.filter(l => l.status === 'DISBURSED').length}</p>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(145deg, rgba(16,185,129,0.08) 0%, rgba(14,20,34,0.9) 100%)', border: '1px solid rgba(16,185,129,0.22)' }}>
          <p style={{ fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Auto-Closed Facilities</p>
          <p style={{ fontSize: '2.25rem', fontWeight: 800, color: '#34d399' }}>{loans.filter(l => l.status === 'CLOSED').length}</p>
        </div>
        <div className="stat-card">
          <p style={{ fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Total Serviced Portfolio</p>
          <p style={{ fontSize: '2.25rem', fontWeight: 800, color: '#818cf8' }}>{loans.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
          <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Loading collections ledger...</span>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : loans.length === 0 ? (
        <div className="card-glass" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#818cf8' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>No Active Loans in Collection</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
            Disbursed facilities will automatically flow into this servicing queue.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loans.map((loan) => {
            const borrower = loan.borrower as User;
            const pct = progressPct(loan);
            const isExpanded = expandedLoan === loan._id;
            const isClosed = loan.status === 'CLOSED';

            return (
              <div key={loan._id} className="card-glass" style={{ padding: '1.75rem', borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>
                        {borrower.fullName || borrower.email}
                      </h3>
                      <span className={`badge badge-${loan.status.toLowerCase()}`}>{loan.status}</span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                      Principal: <strong style={{ color: '#fff' }}>{formatCurrency(loan.loanAmount)}</strong> · Total Due: <strong style={{ color: '#c084fc' }}>{formatCurrency(loan.totalRepayment)}</strong>
                    </p>

                    {/* Shimmer Repayment Progress Bar */}
                    <div style={{ marginBottom: '0.75rem', maxWidth: 540 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.75rem' }}>
                        <span style={{ color: '#64748b' }}>Repayment Progress</span>
                        <span style={{ fontWeight: 700, color: isClosed ? '#34d399' : '#818cf8' }}>{pct}% Completed</span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 9999, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: isClosed ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #4f46e5, #06b6d4)',
                            borderRadius: 9999,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {isClosed ? (
                        <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>✓ Fully Reconciled & Closed</span>
                        </span>
                      ) : (
                        <span>
                          <span style={{ color: '#64748b' }}>Outstanding Balance: </span>
                          <strong style={{ color: '#fb7185', fontFeatureSettings: '"tnum"' }}>{formatCurrency(loan.outstandingBalance)}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, alignItems: 'flex-start' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleExpand(loan._id)}>
                      {isExpanded ? '▲ Hide Ledger' : '▼ Audit Ledger'}
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

                {/* Ledger & Payment History Drawer */}
                {isExpanded && (
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Reconciled Transactions Audit Ledger
                    </h4>
                    {!loanPayments[loan._id] ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}><div className="spinner" /></div>
                    ) : loanPayments[loan._id].length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No payment entries logged yet for this facility.</p>
                    ) : (
                      <div style={{ background: 'rgba(14,20,34,0.7)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <th style={{ padding: '0.75rem 1rem', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>UTR Number</th>
                              <th style={{ padding: '0.75rem 1rem', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>Amount</th>
                              <th style={{ padding: '0.75rem 1rem', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>Payment Date</th>
                              <th style={{ padding: '0.75rem 1rem', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>Reconciled By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loanPayments[loan._id].map((p) => (
                              <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#a5b4fc', fontWeight: 600 }}>{p.utrNumber}</td>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#34d399', fontFeatureSettings: '"tnum"' }}>{formatCurrency(p.amount)}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{formatDate(p.date)}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{(p.recordedBy as User)?.fullName || 'Collection Desk'}</td>
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
