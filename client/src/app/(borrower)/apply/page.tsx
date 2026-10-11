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
  { num: 1, label: 'Personal & BRE Check' },
  { num: 2, label: 'Income Verification' },
  { num: 3, label: 'Facility Configuration' },
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
        pan: personalForm.pan,
        dateOfBirth: personalForm.dateOfBirth,
        monthlySalary: Number(personalForm.monthlySalary),
        employmentMode: personalForm.employmentMode,
      });

      await refreshUser();
      setStep(2);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string; failures?: string[] }>;
      const data = axiosErr.response?.data;
      setStep1Error(data?.message || 'Eligibility check failed.');
      if (data?.failures) {
        setServerBreFailures(data.failures);
      }
    } finally {
      setStep1Loading(false);
    }
  };

  const handleFileSelect = (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      setStep2Error('File size exceeds 5 MB limit.');
      return;
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(f.type)) {
      setStep2Error('Only PDF, JPG, and PNG files are accepted.');
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070a10', color: '#f8fafc', padding: '1.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '20%', left: '30%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div className="card-glass" style={{ maxWidth: 520, width: '100%', padding: '3.5rem 2.5rem', textAlign: 'center', borderRadius: 24, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#34d399' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>
            Facility Request Submitted!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
            Your personal loan application for <strong style={{ color: '#34d399', fontFeatureSettings: '"tnum"' }}>{formatCurrency(loanAmount)}</strong> across <strong style={{ color: '#a5b4fc' }}>{tenureDays} days</strong> has been submitted.
          </p>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '2.25rem' }}>
            Our Underwriting desk will review your dossier and verify your proof of income shortly.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => router.push('/my-loans')} style={{ width: '100%', padding: '0.9rem' }}>
            View Portfolio Status →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070a10', color: '#f8fafc', padding: '2.5rem 1.5rem', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-10%', left: '20%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ maxWidth: 740, margin: '0 auto 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <span style={{ fontWeight: 800, color: '#a5b4fc', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>CreditSea</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Loan Application Portal</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/my-loans')}>My Loans</button>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Sign Out</button>
        </div>
      </div>

      {/* Stepper Header */}
      <div style={{ maxWidth: 740, margin: '0 auto 2rem', position: 'relative', zIndex: 1 }}>
        <div className="card-glass" style={{ padding: '1.25rem 2rem', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className={`step-dot ${step === s.num ? 'active' : step > s.num ? 'done' : 'inactive'}`}>
                    {step > s.num ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : s.num}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: step >= s.num ? '#fff' : '#64748b', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`step-line ${step > s.num ? 'done' : ''}`} style={{ margin: '0 1.25rem' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: 740, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="card-glass" style={{ padding: '2.5rem', borderRadius: 20 }}>
          
          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit}>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  Personal Information & Eligibility
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  Our automated Business Rule Engine (BRE) validates age, monthly salary, employment, and PAN format.
                </p>
              </div>

              {step1Error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <div>
                    <div style={{ fontWeight: 700 }}>Eligibility check failed. See details below.</div>
                    {serverBreFailures.length > 0 && (
                      <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem', fontSize: '0.825rem' }}>
                        {serverBreFailures.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="fullName">Full Legal Name</label>
                  <input id="fullName" type="text" className="form-input" placeholder="As printed on PAN card" value={personalForm.fullName} onChange={(e) => setPersonalForm(p => ({ ...p, fullName: e.target.value }))} required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="pan">PAN Card Number</label>
                  <input id="pan" type="text" className="form-input" placeholder="ABCDE1234F" value={personalForm.pan} onChange={(e) => setPersonalForm(p => ({ ...p, pan: e.target.value.toUpperCase() }))} maxLength={10} required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dob">Date of Birth</label>
                  <input id="dob" type="date" className="form-input" value={personalForm.dateOfBirth} onChange={(e) => setPersonalForm(p => ({ ...p, dateOfBirth: e.target.value }))} required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="salary">Monthly Net Salary (₹)</label>
                  <input id="salary" type="number" className="form-input" placeholder="e.g., 50000 (Min ₹25,000)" value={personalForm.monthlySalary} onChange={(e) => setPersonalForm(p => ({ ...p, monthlySalary: e.target.value }))} min="0" required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="employment">Employment Mode</label>
                  <select id="employment" className="form-input" value={personalForm.employmentMode} onChange={(e) => setPersonalForm(p => ({ ...p, employmentMode: e.target.value as EmploymentMode }))} required style={{ cursor: 'pointer' }}>
                    <option value="">Select Mode...</option>
                    <option value="salaried">Salaried Professional</option>
                    <option value="self-employed">Self-Employed / Business</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                </div>
              </div>

              {/* Client BRE Real-Time Preview */}
              {brePreview.length > 0 && (
                <div className="alert alert-warning" style={{ marginTop: '1.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Eligibility issues detected:</div>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem' }}>
                      {brePreview.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {brePreview.length === 0 && personalForm.employmentMode && personalForm.pan && personalForm.dateOfBirth && personalForm.monthlySalary && (
                <div className="alert alert-success" style={{ marginTop: '1.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>All eligibility criteria met! Pre-approved for facility. ✅</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.25rem' }}>
                <button id="step1-submit" type="submit" className="btn btn-primary btn-lg" disabled={step1Loading}>
                  {step1Loading ? <><div className="spinner" /> Evaluating Rules...</> : 'Continue to Document Upload →'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Upload Salary Slip */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit}>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  Proof of Income Verification
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  Upload your latest official salary slip or bank account statement (PDF, JPG, PNG up to 5 MB).
                </p>
              </div>

              {step2Error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{step2Error}</span>
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
                    <div style={{ width: 60, height: 60, borderRadius: 14, background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#34d399' }}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p style={{ fontWeight: 700, color: '#34d399', fontSize: '1rem', marginBottom: '0.25rem' }}>{file.name}</p>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Click to choose different file</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: 60, height: 60, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#818cf8' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <p style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: '0.25rem' }}>Drag & drop salary slip here</p>
                    <p style={{ fontSize: '0.825rem', color: '#64748b' }}>or browse files (PDF, JPG, PNG up to 5 MB)</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.25rem', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button id="step2-submit" type="submit" className="btn btn-primary btn-lg" disabled={step2Loading || !file}>
                  {step2Loading ? <><div className="spinner" /> Encrypting & Uploading...</> : 'Upload & Configure Loan →'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Loan Config */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  Loan Facility Configuration
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  Adjust the sliders to customize your facility. Interest is fixed at 12% p.a. (Simple Interest).
                </p>
              </div>

              {step3Error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{step3Error}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Loan Amount Slider */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Desired Loan Facility</span>
                    <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#34d399', letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"' }}>{formatCurrency(loanAmount)}</span>
                  </div>
                  <input
                    id="loan-amount-slider"
                    type="range"
                    min={50000}
                    max={500000}
                    step={5000}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    style={{ width: '100%', height: 8, borderRadius: 4, cursor: 'pointer', accentColor: '#4f46e5' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontFeatureSettings: '"tnum"' }}>
                    <span>Min: ₹50,000</span>
                    <span>Max: ₹5,00,000</span>
                  </div>
                </div>

                {/* Tenure Slider */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Repayment Tenure</span>
                    <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#c084fc', letterSpacing: '-0.02em' }}>{tenureDays} Days</span>
                  </div>
                  <input
                    id="tenure-slider"
                    type="range"
                    min={30}
                    max={365}
                    step={5}
                    value={tenureDays}
                    onChange={(e) => setTenureDays(Number(e.target.value))}
                    style={{ width: '100%', height: 8, borderRadius: 4, cursor: 'pointer', accentColor: '#a855f7' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                    <span>Min: 30 days</span>
                    <span>Max: 365 days</span>
                  </div>
                </div>

                {/* Live Loan Summary Table */}
                <div style={{ background: 'rgba(14,20,34,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>Live Financial Calculation</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>(Simple Interest)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', padding: '1.25rem', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Principal Amount</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 2, fontFeatureSettings: '"tnum"' }}>{formatCurrency(calc.loanAmount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Interest Rate</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>12.0% p.a.</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Accrued Interest (SI)</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24', marginTop: 2, fontFeatureSettings: '"tnum"' }}>{formatCurrency(calc.simpleInterest)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Repayment</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a5b4fc', marginTop: 2, fontFeatureSettings: '"tnum"' }}>{formatCurrency(calc.totalRepayment)}</div>
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(99,102,241,0.06)', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <strong>Mathematical Model:</strong> SI = (P × R × T) / (365 × 100) = ({formatCurrency(loanAmount)} × 12 × {tenureDays}) / 36,500 = {formatCurrency(calc.simpleInterest)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.25rem', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button id="apply-btn" type="button" className="btn btn-primary btn-lg" onClick={handleApply} disabled={step3Loading}>
                  {step3Loading ? <><div className="spinner" /> Transmitting Application...</> : '🚀 Submit Loan Application'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
