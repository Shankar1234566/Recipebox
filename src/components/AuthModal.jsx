import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Phone, Lock, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiSendOtp } from '../services/api';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: 'India (+91)' },
  { code: '+1', country: 'US', label: 'USA / Canada (+1)' },
  { code: '+44', country: 'GB', label: 'UK (+44)' },
  { code: '+971', country: 'AE', label: 'UAE (+971)' },
  { code: '+61', country: 'AU', label: 'Australia (+61)' },
  { code: '+65', country: 'SG', label: 'Singapore (+65)' },
];

export default function AuthModal() {
  const { authModalOpen, authModalReason, closeAuthModal, loginWithOtp } = useAuth();

  const [authType, setAuthType] = useState('email'); // 'email' | 'phone'
  const [step, setStep] = useState(1); // 1 = identifier, 2 = otp verification
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(300);

  const otpInputsRef = useRef([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (authModalOpen) {
      setStep(1);
      setError('');
      setSuccessMsg('');
      setOtp(['', '', '', '', '', '']);
      setDevOtp('');
    }
  }, [authModalOpen]);

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // OTP expiration countdown timer
  useEffect(() => {
    let timer;
    if (step === 2 && expiresIn > 0) {
      timer = setInterval(() => setExpiresIn(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, expiresIn]);

  if (!authModalOpen) return null;

  const currentIdentifier = authType === 'email'
    ? email.trim()
    : `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authType === 'email') {
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          throw new Error('Please enter a valid email address');
        }
      } else {
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length < 8 || digits.length > 12) {
          throw new Error('Please enter a valid phone number');
        }
      }

      const res = await apiSendOtp(currentIdentifier, authType);
      if (res.success) {
        setStep(2);
        setCooldown(60);
        setExpiresIn(res.expiresInSeconds || 300);
        setSuccessMsg(`A 6-digit OTP has been sent to ${currentIdentifier}`);
        if (res.dev_otp) {
          setDevOtp(res.dev_otp);
        }
        // Focus first OTP field
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 150);
      }
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle paste full OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Quick fill for testing
  const handleQuickFill = () => {
    if (devOtp && devOtp.length === 6) {
      setOtp(devOtp.split(''));
      otpInputsRef.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the OTP code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await loginWithOtp(currentIdentifier, fullOtp, authType);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 px-6 py-6 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-amber-300" />
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-200">
              RecipeBox Account
            </span>
          </div>
          <h2 className="text-2xl font-bold font-serif">
            {step === 1 ? 'Sign in to RecipeBox' : 'Verify One-Time Password'}
          </h2>
          <p className="text-sm text-emerald-100 mt-1">
            {authModalReason
              ? authModalReason
              : 'Save favorites, unlock premium ₹9 recipes, and enjoy voice-guided cooking.'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && !error && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 1 ? (
            /* Step 1: Identifier Input */
            <div>
              {/* Tabs: Email vs Phone */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
                <button
                  type="button"
                  onClick={() => { setAuthType('email'); setError(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    authType === 'email'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail size={16} />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthType('phone'); setError(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    authType === 'phone'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Phone size={16} />
                  <span>Mobile OTP</span>
                </button>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                {authType === 'email' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900 placeholder-slate-400 text-sm font-medium transition-all"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="py-3 px-3 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium text-slate-800"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <Phone size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="98765 43210"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900 placeholder-slate-400 text-sm font-medium transition-all"
                          required
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with {authType === 'email' ? 'Email' : 'Mobile'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  By continuing, you verify your account securely with a one-time code. No passwords required.
                </p>
              </div>
            </div>
          ) : (
            /* Step 2: OTP Verification */
            <div>
              <div className="mb-4 text-center">
                <p className="text-xs text-slate-500">Enter the 6-digit code sent to</p>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">{currentIdentifier}</p>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline mt-1"
                >
                  Edit {authType === 'email' ? 'email' : 'phone number'}
                </button>
              </div>

              {/* Dev OTP Quick Fill Pill */}
              {devOtp && (
                <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>Demo Mode Code: <strong className="font-mono text-sm tracking-widest">{devOtp}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickFill}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors"
                  >
                    Auto Fill
                  </button>
                </div>
              )}

              {/* 6-Digit OTP Boxes */}
              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-bold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900 transition-all shadow-sm"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Verify & Enter RecipeBox</span>
                  </>
                )}
              </button>

              {/* Resend & Expiry footer */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Code expires in:{' '}
                  <strong className="text-slate-700 font-mono">
                    {Math.floor(expiresIn / 60)}:{(expiresIn % 60).toString().padStart(2, '0')}
                  </strong>
                </span>

                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={handleSendOtp}
                  className="font-semibold text-emerald-800 hover:text-emerald-900 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
