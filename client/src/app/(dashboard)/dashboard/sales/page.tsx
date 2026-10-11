'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { User } from '@/types';
import { formatDate } from '@/lib/loanCalc';

export default function SalesPage() {
  const [leads, setLeads] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeads = () => {
    setIsLoading(true);
    api.get<{ leads: User[]; total: number }>('/dashboard/sales/leads')
      .then(({ data }) => setLeads(data.leads))
      .catch(() => setError('Failed to fetch leads.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchLeads(); }, []);

  const stepLabel = (step: number) => {
    switch (step) {
      case 1: return { label: 'Registered', color: 'var(--text-muted)' };
      case 2: return { label: 'Details Filled', color: 'var(--warning-400)' };
      case 3: return { label: 'Slip Uploaded', color: 'var(--success-400)' };
      default: return { label: 'Unknown', color: 'var(--text-muted)' };
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Sales — Lead Tracking</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Registered borrowers who haven&apos;t submitted a loan application yet.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchLeads}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          Refresh
        </button>
      </div>

      {/* Stat */}
      <div className="stat-card" style={{ marginBottom: '1.5rem', maxWidth: 280 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Total Leads</p>
        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#22c55e' }}>{leads.length}</p>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : leads.length === 0 ? (
        <div className="card empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          <h3>No leads found</h3>
          <p>All registered borrowers have already applied for loans.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Employment</th>
                <th>Monthly Salary</th>
                <th>Application Step</th>
                <th>BRE Cleared</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const s = stepLabel(lead.applicationStep);
                return (
                  <tr key={lead.id || lead._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lead.fullName || '—'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lead.email}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{lead.employmentMode || '—'}</td>
                    <td>{lead.monthlySalary ? `₹${lead.monthlySalary.toLocaleString('en-IN')}` : '—'}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: s.color }}>{s.label}</span>
                    </td>
                    <td>
                      {lead.breCleared ? (
                        <span style={{ color: 'var(--success-400)', fontWeight: 600, fontSize: '0.85rem' }}>✅ Passed</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {lead.createdAt ? formatDate(lead.createdAt) : '—'}
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
