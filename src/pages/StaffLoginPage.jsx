import React, { useState } from 'react';
import auraLogo from '../assets/aurailhamlogo.png';

const StaffLoginPage = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [username, setUsername] = useState('mayang_staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Uthm2121');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Success / Error messages
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  // SQL Injection detection regex
  const hasSqlInjectionRisk = (val) => {
    if (!val) return false;
    // Detect single/double quotes, SQL comments (--), semicolons, or classic UNION/OR payloads
    const dangerousPatterns = /['";\-]+|UNION|SELECT|DROP|INSERT|DELETE|OR\s+\d+=\d+/i;
    return dangerousPatterns.test(val);
  };

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'No Password', colorClass: 'bg-slate-200', textClass: 'text-slate-400' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) {
      return { score, label: 'Weak', colorClass: 'bg-rose-500 w-1/4', textClass: 'text-rose-600' };
    }
    if (score <= 3) {
      return { score, label: 'Medium', colorClass: 'bg-rose-400 w-2/4', textClass: 'text-rose-500' };
    }
    return { score, label: 'Strong', colorClass: 'bg-emerald-500 w-full', textClass: 'text-emerald-600' };
  };

  const strength = getPasswordStrength(password);
  const isUsernameRisk = hasSqlInjectionRisk(username);
  const isEmailRisk = hasSqlInjectionRisk(email);
  const isPasswordRisk = hasSqlInjectionRisk(password);

  const handleToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Prevent submission if invalid characters exist
    if (isUsernameRisk || isEmailRisk || isPasswordRisk) {
      handleToast('Invalid characters detected. Please use only alphanumeric characters.', 'error');
      return;
    }

    if (activeTab === 'signup') {
      if (!username || !email || !password || !confirmPassword) {
        handleToast('Please fill out all fields.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        handleToast('Passwords do not match.', 'error');
        return;
      }
      if (strength.score < 2) {
        handleToast('Please choose a stronger password.', 'error');
        return;
      }
      try {
        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            staff_name: username,
            role: 'Waiter',
            phone_number: '',
            password
          })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Signup failed');
        }
        handleToast('Account successfully created! Please log in.', 'success');
        setActiveTab('login');
        setPassword('');
        setConfirmPassword('');
      } catch (err) {
        handleToast(err.message, 'error');
      }
    } else {
      if (!username || !password) {
        handleToast('Please fill out all fields.', 'error');
        return;
      }
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Invalid credentials');
        }
        handleToast('Login successful!', 'success');
        setTimeout(() => {
          onLoginSuccess(data.staff);
        }, 800);
      } catch (err) {
        handleToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-emerald-50 via-white to-rose-50/70 flex items-center justify-center px-4 py-16 relative overflow-hidden font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border animate-slide-in ${
          toastType === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toastType === 'success' ? (
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Container Card with Dashed Border */}
      <div className="w-full max-w-lg bg-white border-2 border-dashed border-slate-200 rounded-[36px] shadow-2xl p-8 md:p-10 transition-all duration-300 relative z-10 overflow-hidden">
        
        {/* Top Decorative Gradient Bar (Grab/Foodpanda Inspired) */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-rose-500 to-emerald-600"></div>

        {/* Logo and App Title */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex h-28 w-48 items-center justify-center rounded-3xl bg-white shadow-md border border-slate-100 mb-4 overflow-hidden transition-all duration-300 hover:scale-[1.02]">
            <img src={auraLogo} alt="Aura Ilham Logo" className="w-full h-full object-contain p-1.5" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-rose-600">AURA ILHAM RESTAURANT SUITE</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Staff Portal</h1>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8 border border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setToastMessage(null); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'login' 
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-200/50' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Staff Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setToastMessage(null); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'signup' 
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-200/50' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Create Staff Account
          </button>
        </div>

        {/* Input validation warning if special characters detected */}
        {(isUsernameRisk || isEmailRisk || isPasswordRisk) && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-xs font-semibold">
              Invalid characters detected. Please use only alphanumeric characters.
            </div>
          </div>
        )}

        {/* Access Form */}
        <form onSubmit={handleFormSubmit} className="space-y-5">
          
          {/* Username Field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Username / Staff ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. staff_aura123"
                className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition duration-150 ${
                  isUsernameRisk 
                    ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-500 bg-rose-50/30' 
                    : 'border-slate-200 focus:border-dashed focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:bg-emerald-50/10'
                }`}
                required
              />
            </div>
          </div>

          {/* Email Field - Signup Only */}
          {activeTab === 'signup' && (
            <div className="animate-fade-in">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Staff Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@aurailham.com"
                  className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition duration-150 ${
                    isEmailRisk 
                      ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-500 bg-rose-50/30' 
                      : 'border-slate-200 focus:border-dashed focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:bg-emerald-50/10'
                  }`}
                  required
                />
              </div>
            </div>
          )}

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Access Password</label>
              {activeTab === 'login' && (
                <a href="#reset" className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition">
                  Forgot Password?
                </a>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`block w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border rounded-2xl text-sm font-semibold tracking-wide text-slate-900 placeholder:text-slate-400 outline-none transition duration-150 ${
                  isPasswordRisk 
                    ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-500 bg-rose-50/30' 
                    : 'border-slate-200 focus:border-dashed focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:bg-emerald-50/10'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.025 10.025 0 014.132-5.4M9.69 9.69a3 3 0 004.243 4.243m1.8-8.8l-8.8 8.8" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Dynamic Password Strength Meter for Signup */}
            {activeTab === 'signup' && password && (
              <div className="mt-3 space-y-1.5 animate-fade-in">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-500">Password Strength:</span>
                  <span className={strength.textClass}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.colorClass}`} />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field - Signup Only */}
          {activeTab === 'signup' && (
            <div className="animate-fade-in">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold tracking-wide text-slate-900 placeholder:text-slate-400 outline-none focus:border-dashed focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:bg-emerald-50/10 transition duration-150"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.025 10.025 0 014.132-5.4M9.69 9.69a3 3 0 004.243 4.243m1.8-8.8l-8.8 8.8" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUsernameRisk || isEmailRisk || isPasswordRisk}
            className={`w-full py-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              isUsernameRisk || isEmailRisk || isPasswordRisk
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:opacity-95 text-white hover:shadow-lg hover:shadow-emerald-200/50'
            }`}
          >
            <span>{activeTab === 'login' ? 'Sign In' : 'Sign Up'}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>

        {/* Section Divider - Dashed */}
        <div className="relative my-8 text-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-dashed border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 font-semibold text-slate-400 uppercase tracking-wider">Aura Ilham</span>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="text-center text-xs text-slate-400 font-medium">
          © Aura Ilham. All rights reserved.
        </div>

      </div>

      {/* Decorative clean ambient background dots */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-100/35 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-rose-100/25 rounded-full blur-3xl -z-10" />
    </div>
  );
};

export default StaffLoginPage;
