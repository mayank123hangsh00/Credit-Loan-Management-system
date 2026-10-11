'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AxiosError } from 'axios';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@creditsea.com', pass: 'Admin@123', color: '#818cf8', desc: 'Full Portfolio Overview & Cross-Module Access' },
  { role: 'Sales', email: 'sales@creditsea.com', pass: 'Sales@123', color: '#34d399', desc: 'Pre-application Leads Pipeline' },
  { role: 'Sanction', email: 'sanction@creditsea.com', pass: 'Sanction@123', color: '#c084fc', desc: 'Underwriting & Document Assessment' },
  { role: 'Disbursement', email: 'disbursement@creditsea.com', pass: 'Disbursement@123', color: '#fbbf24', desc: 'Capital Release Desk' },
  { role: 'Collection', email: 'collection@creditsea.com', pass: 'Collection@123', color: '#fb7185', desc: 'Repayments & UTR Settlement' },
  { role: 'Borrower', email: 'borrower@creditsea.com', pass: 'Borrower@123', color: '#38bdf8', desc: 'Loan Application Journey' },
];

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<string | null>(null);

  const ROLE_HOME_PATH: Record<string, string> = {
    borrower: '/apply',
    admin: '/dashboard/overview',
    sales: '/dashboard/sales',
    sanction: '/dashboard/sanction',
    disbursement: '/dashboard/disbursement',
    collection: '/dashboard/collection',
  };

  useEffect(() => {
    if (user) {
      router.replace(ROLE_HOME_PATH[user.role] || '/dashboard/overview');
    }
  }, [user, router]);

  if (user) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
      </div>
    );
  }

  const handleSelectDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setSelectedDemoRole(acc.role);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#070a10', color: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient background mesh lighting */}
      <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', width: '100%', maxWidth: 1280, margin: 'auto', padding: '2.5rem 1.5rem', gap: '3rem', alignItems: 'center', zIndex: 1 }}>
        
        {/* Left Side: Institutional Product Showcase */}
        <div>
          {/* Brand Tag */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0.85rem', borderRadius: 9999, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: '1.5rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px #6366f1' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#a5b4fc', textTransform: 'uppercase' }}>
              Institutional Lending Core v2.4
            </span>
          </div>

          <h1 style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            CreditSea <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Operations</span>
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.25rem', maxWidth: 480 }}>
            Automated lending infrastructure with sub-second Business Rule Engine (BRE), multi-tiered credit underwriting, and strict segregation of duties.
          </p>

          {/* Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem', maxWidth: 500 }}>
            <div style={{ background: 'rgba(16,22,36,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.1rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"' }}>
                ₹2.5Cr+
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Disbursed Facility Volume
              </div>
            </div>

            <div style={{ background: 'rgba(16,22,36,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.1rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8', letterSpacing: '-0.02em' }}>
                100% Automated
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Server & Client BRE Checks
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: '#64748b', fontSize: '0.8rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>256-Bit TLS Encryption</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span>MongoDB Atlas Clustered</span>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Box & 1-Click Role Switcher */}
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div className="card-glass" style={{ padding: '2.25rem', borderRadius: 20 }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
                Sign In to Platform
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                Choose an evaluation role below or sign in manually.
              </p>
            </div>

            {/* 1-Click Role Selector Chips */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.65rem' }}>
                ⚡ 1-Click Role Switcher (For Evaluators)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = selectedDemoRole === acc.role;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleSelectDemo(acc)}
                      style={{
                        padding: '0.6rem 0.5rem',
                        borderRadius: 10,
                        background: isSelected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? `1.5px solid ${acc.color}` : '1px solid rgba(255,255,255,0.07)',
                        color: isSelected ? '#fff' : '#94a3b8',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: acc.color }}>
                        {acc.role}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Click to Fill
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="executive@creditsea.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4,
                    }}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="login-submit"
                className="btn btn-primary btn-full"
                disabled={isLoading}
                style={{ padding: '0.85rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="spinner" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Sign In to Dashboard →'
                )}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
              Are you a new borrower?{' '}
              <Link href="/register" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
                Create Borrower Account
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
