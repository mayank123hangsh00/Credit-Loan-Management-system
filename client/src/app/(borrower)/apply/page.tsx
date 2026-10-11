'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { runClientBRE } from '@/lib/bre';
import { calculateLoan, formatCurrency } from '@/lib/loanCalc';
import { EmploymentMode } from '@/types';
import { AxiosError } from 'axios';

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1, label: 'Personal Details' },
  { num: 2, label: 'Upload Salary Slip' },
  { num: 3, label: 'Loan Config & Apply' },
];

interface PersonalForm {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: string;
  employmentMode: EmploymentMode | '';
}

export default function ApplyPage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  // Determine starting step based on user progress
  const startStep: Step = !user?.breCleared ? 1 : !user?.salarySlipUrl ? 2 : 3;
  const [step, setStep] = useState<Step>(startStep);

  // ── Step 1: Personal Details ─────────────────────────────
  const [personalForm, setPersonalForm] = useState<PersonalForm>({
    fullName: user?.fullName || '',
    pan: user?.pan || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
    monthlySalary: user?.monthlySalary?.toString() || '',
    employmentMode: (user?.employmentMode as EmploymentMode) || '',
  });
  const [brePreview, setBrePreview] = useState<string[]>([]);
  const [step1Error, setStep1Error] = useState('');
  const [step1Loading, setStep1Loading] = useState(false);
  const [serverBreFailures, setServerBreFailures] = useState<string[]>([]);

  // ── Step 2: Salary Slip ──────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [step2Error, setStep2Error] = useState('');
  const [step2Loading, setStep2Loading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 3: Loan Config ──────────────────────────────────
  const [loanAmount, setLoanAmount] = useState(100000);
  const [tenureDays, setTenureDays] = useState(90);
  const [step3Error, setStep3Error] = useState('');
  const [step3Loading, setStep3Loading] = useState(false);
  const [loanSuccess, setLoanSuccess] = useState(false);

  const calc = calculateLoan(loanAmount, tenureDays);

  // Real-time BRE preview
  useEffect(() => {
    if (
      !personalForm.pan &&
      !personalForm.dateOfBirth &&
      !personalForm.monthlySalary &&
      !personalForm.employmentMode
    )
      return;

    if (personalForm.employmentMode) {
      const result = runClientBRE({
        pan: personalForm.pan,
        dateOfBirth: personalForm.dateOfBirth,
        monthlySalary: Number(personalForm.monthlySalary),
        employmentMode: personalForm.employmentMode as EmploymentMode,
      });
      setBrePreview(result.failures);
    }
  }, [personalForm]);

  // ── Handlers ─────────────────────────────────────────────

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error('');
    setServerBreFailures([]);

    if (!personalForm.employmentMode) {
      setStep1Error('Please select an employment mode.');
      return;
    }

    setStep1Loading(true);
    try {
      await api.put('/borrower/details', {
        fullName: personalForm.fullName,
        pan: personalForm.pan.toUpperCase(),
        dateOfBirth: personalForm.dateOfBirth,
        monthlySalary: Number(personalForm.monthlySalary),
        employmentMode: personalForm.employmentMode,
      });
      await refreshUser();
      setStep(2);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string; breFailures?: string[] }>;
      if (axiosErr.response?.data?.breFailures) {
        setServerBreFailures(axiosErr.response.data.breFailures);
        setStep1Error('Eligibility check failed. See details below.');
      } else {
        setStep1Error(axiosErr.response?.data?.message || 'Failed to save details.');
      }
    } finally {
      setStep1Loading(false);
    }
  };

  const handleFileSelect = (f: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(f.type)) {
      setStep2Error('Invalid file type. Only PDF, JPG, PNG allowed.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setStep2Error('File too large. Maximum size is 5 MB.');
      return;
    }
    setFile(f);
    setStep2Error('');
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setStep2Error('Please select a file to upload.'); return; }
    setStep2Loading(true);
    try {
      const formData = new FormData();
      formData.append('salarySlip', file);
      await api.post('/borrower/salary-slip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      setStep(3);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setStep2Error(axiosErr.response?.data?.message || 'Upload failed.');
    } finally {
      setStep2Loading(false);
    }
  };

  const handleApply = async () => {
    setStep3Error('');
    setStep3Loading(true);
    try {
      await api.post('/loans/apply', { loanAmount, tenureDays });
      setLoanSuccess(true);
      await refreshUser();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setStep3Error(axiosErr.response?.data?.message || 'Application failed.');
    } finally {
      setStep3Loading(false);
    }
  };

  if (loanSuccess) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
        <div className="animate-slide-up card-glass" style={{ maxWidth: 480, width: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '2px solid var(--success-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--success-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Application Submitted!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Your loan application of <strong style={{ color: 'var(--primary-400)' }}>{formatCurrency(loanAmount)}</strong> for <strong style={{ color: 'var(--primary-400)' }}>{tenureDays} days</strong> has been submitted.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Our team will review it shortly. You can track the status in your dashboard.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => router.push('/my-loans')}>
            View My Loans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ maxWidth: 680, margin: '0 auto', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-400)' }}>CreditSea</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Loan Application</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/my-loans')}>My Loans</button>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Step Indicator */}
      <div style={{ maxWidth: 680, margin: '0 auto 2rem' }}>
        <div className="step-indicator" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--bg-border)' }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                <div className={`step-dot ${step === s.num ? 'active' : step > s.num ? 'done' : 'inactive'}`}>
                  {step > s.num ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : s.num}
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: step >= s.num ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-line ${step > s.num ? 'done' : ''}`} style={{ margin: '0 0.5rem', marginBottom: '1.2rem' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="card-glass animate-fade-in" style={{ padding: '2rem' }}>

          {/* ── STEP 1: Personal Details ── */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Personal Details</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
                We'll run a quick eligibility check based on this information.
              </p>

              {step1Error && (
                <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <div>
                    <div>{step1Error}</div>
                    {serverBreFailures.length > 0 && (
                      <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                        {serverBreFailures.map((f, i) => <li key={i} style={{ fontSize: '0.8rem' }}>{f}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="fullName">Full Name</label>
                  <input id="fullName" type="text" className="form-input" placeholder="As on PAN card" value={personalForm.fullName} onChange={(e) => setPersonalForm(p => ({ ...p, fullName: e.target.value }))} required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="pan">PAN Number</label>
                  <input id="pan" type="text" className="form-input" placeholder="ABCDE1234F" value={personalForm.pan} onChange={(e) => setPersonalForm(p => ({ ...p, pan: e.target.value.toUpperCase() }))} maxLength={10} required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dob">Date of Birth</label>
                  <input id="dob" type="date" className="form-input" value={personalForm.dateOfBirth} onChange={(e) => setPersonalForm(p => ({ ...p, dateOfBirth: e.target.value }))} required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="salary">Monthly Salary (₹)</label>
                  <input id="salary" type="number" className="form-input" placeholder="e.g. 50000" value={personalForm.monthlySalary} onChange={(e) => setPersonalForm(p => ({ ...p, monthlySalary: e.target.value }))} min="0" required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="employment">Employment Mode</label>
                  <select id="employment" className="form-select" value={personalForm.employmentMode} onChange={(e) => setPersonalForm(p => ({ ...p, employmentMode: e.target.value as EmploymentMode }))} required>
                    <option value="">Select...</option>
                    <option value="salaried">Salaried</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                </div>
              </div>

              {/* BRE Preview */}
              {brePreview.length > 0 && (
                <div className="alert alert-warning" style={{ marginTop: '1.25rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Eligibility issues detected:</div>
                    <ul style={{ paddingLeft: '1rem', fontSize: '0.8rem' }}>
                      {brePreview.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                </div>
              )}
              {brePreview.length === 0 && personalForm.employmentMode && personalForm.pan && personalForm.dateOfBirth && personalForm.monthlySalary && (
                <div className="alert alert-success" style={{ marginTop: '1.25rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  All eligibility criteria met! ✅
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button id="step1-submit" type="submit" className="btn btn-primary btn-lg" disabled={step1Loading}>
                  {step1Loading ? <><div className="spinner" /> Checking eligibility...</> : 'Continue →'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: Upload Salary Slip ── */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Upload Salary Slip</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
                Upload your latest salary slip as proof of income. PDF, JPG, or PNG — max 5 MB.
              </p>

              {step2Error && (
                <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {step2Error}
                </div>
              )}

              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFileSelect(f);
                }}
              >
                {file ? (
                  <div>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', border: '2px solid var(--success-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success-400)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--success-400)', marginBottom: '0.25rem' }}>{file.name}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Drop file here or click to browse</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF, JPG, PNG · Max 5 MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button id="step2-submit" type="submit" className="btn btn-primary btn-lg" disabled={step2Loading || !file}>
                  {step2Loading ? <><div className="spinner" /> Uploading...</> : 'Upload & Continue →'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: Loan Config ── */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Loan Configuration</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
                Adjust the sliders to configure your loan. Interest rate is fixed at 12% p.a.
              </p>

              {step3Error && (
                <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {step3Error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Loan Amount Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Loan Amount</label>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-400)' }}>{formatCurrency(loanAmount)}</span>
                  </div>
                  <input id="loan-amount-slider" type="range" className="range-slider" min={50000} max={500000} step={5000} value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    <span>₹50,000</span><span>₹5,00,000</span>
                  </div>
                </div>

                {/* Tenure Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Tenure</label>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent-400)' }}>{tenureDays} days</span>
                  </div>
                  <input id="tenure-slider" type="range" className="range-slider" min={30} max={365} step={5} value={tenureDays} onChange={(e) => setTenureDays(Number(e.target.value))} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    <span>30 days</span><span>365 days</span>
                  </div>
                </div>

                {/* Live Calculation Panel */}
                <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Loan Summary</span>
                  </div>
                  {[
                    ['Principal', formatCurrency(calc.loanAmount), 'var(--text-primary)'],
                    ['Interest Rate', `${calc.interestRate}% p.a. (Simple Interest)`, 'var(--text-secondary)'],
                    ['Tenure', `${calc.tenureDays} days`, 'var(--text-secondary)'],
                    ['Interest (SI)', formatCurrency(calc.simpleInterest), 'var(--warning-400)'],
                  ].map(([label, value, color]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--bg-border)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>
                      <span style={{ color, fontWeight: 600, fontSize: '0.875rem' }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'rgba(59, 130, 246, 0.08)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Repayment</span>
                    <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary-400)' }}>{formatCurrency(calc.totalRepayment)}</span>
                  </div>
                </div>

                <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(124, 58, 237, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(124, 58, 237, 0.25)', fontSize: '0.8rem', color: 'var(--accent-400)' }}>
                  <strong>Formula:</strong> SI = (P × R × T) / (365 × 100) = ({formatCurrency(loanAmount)} × 12 × {tenureDays}) / 36,500 = {formatCurrency(calc.simpleInterest)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button id="apply-btn" type="button" className="btn btn-primary btn-lg" onClick={handleApply} disabled={step3Loading}>
                  {step3Loading ? <><div className="spinner" /> Submitting...</> : '🚀 Apply Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
