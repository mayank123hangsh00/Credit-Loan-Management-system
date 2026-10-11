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
      .catch(() => setError('Failed to fetch loans.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleDisburse = async (loanId: string) => {
    setActionLoading(loanId);
    try {
      await api.put(`/dashboard/disbursement/${loanId}/disburse`);
      showToast('Loan disbursed! Funds released to borrower. 💸');
      fetchLoans();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      showToast(axiosErr.response?.data?.message || 'Failed to disburse.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, animation: 'slideIn 0.3s both' }}>
          <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ minWidth: 280, boxShadow: 'var(--shadow-lg)' }}>
            {toast.msg}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Disbursement — Release Funds</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Sanctioned loans ready for fund disbursement.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchLoans}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          Refresh
        </button>
      </div>

      <div className="stat-card" style={{ marginBottom: '1.5rem', maxWidth: 280 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Awaiting Disbursement</p>
        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--warning-400)' }}>{loans.length}</p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} /></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : loans.length === 0 ? (
        <div className="card empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          <h3>No loans awaiting disbursement</h3>
          <p>No sanctioned loans at this time.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Loan Amount</th>
                <th>Tenure</th>
                <th>Total Repayment</th>
                <th>Sanctioned By</th>
                <th>Sanctioned Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const borrower = loan.borrower as User;
                const sanctionedBy = loan.sanctionedBy as User | undefined;
                return (
                  <tr key={loan._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{borrower.fullName || '—'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{borrower.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PAN: {borrower.pan || '—'}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{formatCurrency(loan.loanAmount)}</td>
                    <td>{loan.tenureDays} days</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(loan.totalRepayment)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {sanctionedBy?.fullName || '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {loan.sanctionedAt ? formatDate(loan.sanctionedAt) : '—'}
                    </td>
                    <td>
                      <button
                        id={`disburse-${loan._id}`}
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDisburse(loan._id)}
                        disabled={actionLoading === loan._id}
                      >
                        {actionLoading === loan._id ? <div className="spinner" /> : '💸 Disburse'}
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
