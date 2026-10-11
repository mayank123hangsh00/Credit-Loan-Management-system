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
      .catch(() => setError('Failed to fetch leads queue.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchLeads(); }, []);

  const stepLabel = (step: number) => {
    switch (step) {
      case 1: return { label: 'Step 1: Auth Registered', color: '#94a3b8' };
      case 2: return { label: 'Step 2: Details Submitted', color: '#fbbf24' };
      case 3: return { label: 'Step 3: Document Uploaded', color: '#34d399' };
      default: return { label: 'Registered', color: '#94a3b8' };
    }
  };

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.25rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: 9999, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', marginBottom: '0.65rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
            <span style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399' }}>
              Origination & Conversion
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Sales & Leads Pipeline
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.925rem', marginTop: '0.25rem' }}>
            Registered borrowers who have not yet finalized their loan request.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchLeads} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}>
          <svg className={isLoading ? 'animate-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
          </svg>
          <span>Refresh Pipeline</span>
        </button>
      </div>

      {/* Stat Card */}
      <div className="stat-card" style={{ marginBottom: '2rem', maxWidth: 300, background: 'linear-gradient(145deg, rgba(52,211,153,0.08) 0%, rgba(14,20,34,0.9) 100%)', border: '1px solid rgba(52,211,153,0.22)' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          Active Pre-Application Leads
        </p>
        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em' }}>
          {leads.length}
        </p>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
          Borrowers eligible for origination outreach
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
          <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Querying leads database...</span>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : leads.length === 0 ? (
        <div className="card-glass" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#34d399' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>No Pending Leads</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
            All registered users have submitted applications or there are no unapplied leads at this moment.
          </p>
        </div>
      ) : (
        <div className="card-glass" style={{ padding: '0', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Borrower Lead</th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Application Stage</th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>BRE Status</th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Income Level</th>
                <th style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const step = stepLabel(lead.applicationStep);
                return (
                  <tr key={lead._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{lead.fullName || 'New Applicant'}</div>
                      <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>{lead.email}</div>
                      {lead.pan && <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: 2 }}>PAN: {lead.pan}</div>}
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: step.color, background: 'rgba(255,255,255,0.04)', padding: '0.25rem 0.65rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                        {step.label}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      {lead.breCleared ? (
                        <span style={{ color: '#34d399', fontSize: '0.775rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} /> Pre-Approved
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.775rem' }}>Pending Criteria</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem', color: '#cbd5e1', fontWeight: 600 }}>
                      {lead.monthlySalary ? `₹${lead.monthlySalary.toLocaleString('en-IN')}/mo` : '—'}
                    </td>
                    <td style={{ padding: '1.25rem', color: '#64748b', fontSize: '0.825rem' }}>
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
