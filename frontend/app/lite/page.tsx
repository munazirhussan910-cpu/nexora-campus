'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Smartphone,
  WifiOff,
  LogOut,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Wifi,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { StudentLiteView } from './components/StudentLiteView';

export default function NexoraLitePage() {
  const { user, loading: authLoading, refreshUser, logout } = useAuth();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [msg, setMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Student login form state
  const [loginIdentifier, setLoginIdentifier] = useState('220101048');
  const [loginPass, setLoginPass] = useState('Password123!');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Network offline detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setMsg({ type: 'success', text: 'Network connection restored. Online.' });
      setTimeout(() => setMsg(null), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setMsg({ type: 'info', text: 'Working offline. Cached student information remains accessible.' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync user from auth context or fetch /api/auth/me
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else {
      checkAuth();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const res = await apiRequest('/auth/me', { useCache: false });
      if (res.success && res.data?.user) {
        setCurrentUser(res.data.user);
      }
    } catch {
      // Offline fallback: check if we have cached student ID data
      try {
        const cached = localStorage.getItem('nexora_lite_id_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.data) {
            setCurrentUser(parsed.data);
          }
        }
      } catch {
        // Ignore
      }
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Internet connection is required to authenticate.' });
      return;
    }

    setIsSigningIn(true);
    setMsg(null);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          usernameOrEmail: loginIdentifier.trim(),
          password: loginPass,
        }),
      });

      if (res.success && res.data) {
        if (res.data.token && typeof window !== 'undefined') {
          localStorage.setItem('nexora_token', res.data.token);
        }
        await refreshUser();
        setCurrentUser(res.data.user);
        setMsg({ type: 'success', text: `Welcome back, ${res.data.user.fullName || res.data.user.username}!` });
        setTimeout(() => setMsg(null), 3500);
      } else {
        setMsg({
          type: 'error',
          text: res.error?.message || 'Invalid roll number / email or password.',
        });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network timeout. Check backend connectivity.' });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDemoStudentLogin = async () => {
    setLoginIdentifier('aryan@nexora.edu');
    setLoginPass('Password123!');
    setIsSigningIn(true);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          usernameOrEmail: 'aryan@nexora.edu',
          password: 'Password123!',
        }),
      });
      if (res.success && res.data) {
        if (res.data.token && typeof window !== 'undefined') {
          localStorage.setItem('nexora_token', res.data.token);
        }
        await refreshUser();
        setCurrentUser(res.data.user);
        setMsg({ type: 'success', text: 'Signed in as Aryan Khan (Student).' });
        setTimeout(() => setMsg(null), 3000);
      }
    } catch {
      setMsg({ type: 'error', text: 'Could not connect to authentication service.' });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setMsg({ type: 'info', text: 'Signed out of Nexora Lite.' });
      setTimeout(() => setMsg(null), 2500);
    } catch {
      setCurrentUser(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (['APPROVED', 'RESOLVED', 'CLOSED', 'RETURNED'].includes(s)) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          {s}
        </span>
      );
    }
    if (['IN_PROGRESS', 'ROUTED', 'ASSIGNED', 'DEPARTED'].includes(s)) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
          {s}
        </span>
      );
    }
    if (['PENDING_APPROVAL', 'SUBMITTED'].includes(s)) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
          {s}
        </span>
      );
    }
    if (['REJECTED', 'CANCELLED'].includes(s)) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">
          {s}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-gray-500/10 text-gray-400 border border-gray-500/30">
        {s}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-gray-100 flex flex-col font-sans selection:bg-[#d4af37]/30 selection:text-white">
      {/* Lite Mobile Shell (Max Width: 520px) */}
      <div className="w-full max-w-lg mx-auto min-h-screen flex flex-col px-3.5 pt-3 pb-8">
        {/* Top Header */}
        <header className="flex items-center justify-between pb-3 mb-3 border-b border-[#1c2436]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-blue-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
              <GraduationCap size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-white tracking-tight">Nexora Lite</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Student Only
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                <Smartphone size={10} className="text-amber-400" />
                <span>BPUT Campus • Low Bandwidth PWA</span>
              </p>
            </div>
          </div>

          {/* Network Indicator & Full Portal Link */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                  : 'bg-amber-950/60 text-amber-300 border-amber-600/40'
              }`}
            >
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>

            <Link
              href={currentUser?.role === 'STUDENT' ? '/student/dashboard' : '/'}
              className="px-2.5 py-1 rounded-lg bg-[#141b2a] hover:bg-[#1a2336] border border-[#243048] text-gray-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition"
              title="Switch to Desktop Portal"
            >
              <span>Full Portal</span>
              <ExternalLink size={10} />
            </Link>
          </div>
        </header>

        {/* Floating Notification / Feedback Messages */}
        {msg && (
          <div
            className={`p-3 rounded-xl mb-3 text-xs flex items-center justify-between gap-2 shadow-sm transition animate-in fade-in duration-200 ${
              msg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                : msg.type === 'error'
                ? 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
                : 'bg-blue-950/80 border border-blue-500/40 text-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {msg.type === 'success' ? (
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={14} className="text-rose-400 shrink-0" />
              )}
              <span className="leading-snug">{msg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMsg(null)}
              className="text-gray-400 hover:text-white shrink-0 p-1"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* ------------------------------------------------------ */}
        {/* CONDITIONAL CONTENT BASED ON AUTHENTICATION & ROLE */}
        {/* ------------------------------------------------------ */}
        {authLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400 text-xs gap-2">
            <RefreshCw size={20} className="animate-spin text-amber-400" />
            <span>Connecting to Nexora...</span>
          </div>
        ) : !currentUser ? (
          /* NOT LOGGED IN: STUDENT LOGIN FORM */
          <div className="flex-1 flex flex-col justify-center py-6 space-y-4">
            <div className="bg-[#121826] border border-[#243048] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-2">
                  <Smartphone size={22} />
                </div>
                <h2 className="text-base font-bold text-white">Student Sign In</h2>
                <p className="text-xs text-gray-400">
                  Enter your University Roll Number or Campus Email to open Nexora Lite.
                </p>
              </div>

              <form onSubmit={handleStudentLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase font-mono mb-1">
                    Roll Number or Campus Email
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 220101048 or aryan@nexora.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#172033] border border-[#283552] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase font-mono mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#172033] border border-[#283552] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition disabled:opacity-50 mt-2"
                >
                  {isSigningIn ? 'Signing In...' : 'Sign In to Nexora Lite'}
                </button>
              </form>

              {/* 1-Click Demo Student Access */}
              <div className="pt-3 border-t border-gray-800 text-center">
                <span className="text-[10px] text-gray-400 uppercase font-mono block mb-2">
                  EVALUATOR &amp; DEMO FAST LOGIN
                </span>
                <button
                  type="button"
                  onClick={handleDemoStudentLogin}
                  disabled={isSigningIn}
                  className="w-full py-2 rounded-xl bg-[#182338] hover:bg-[#202e48] border border-[#2d3e60] text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <User size={13} />
                  <span>1-Click Student (Aryan Khan • 220101048)</span>
                </button>
              </div>

              {/* Full Portal Link for Admin / Staff */}
              <div className="text-center pt-1">
                <Link
                  href="/login"
                  className="text-[11px] text-gray-400 hover:text-white underline"
                >
                  Faculty, Staff, Warden or Admin? Use Full Portal Login &rarr;
                </Link>
              </div>
            </div>
          </div>
        ) : currentUser.role !== 'STUDENT' ? (
          /* LOGGED IN BUT NOT A STUDENT: STRICT STUDENT-ONLY ACCESS NOTICE */
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-2 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
              <Shield size={32} />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h2 className="text-base font-bold text-white">Nexora Lite is Student-Only</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                You are currently signed in as <strong className="text-white">{currentUser.fullName || currentUser.username}</strong> ({currentUser.role}).
                Nexora Lite is specifically engineered for students on mobile and low-bandwidth connections.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#121826] border border-[#243048] max-w-sm w-full text-xs text-gray-300 space-y-2">
              <div className="text-[11px] font-mono text-gray-400">
                Staff, Warden, Security, Academic Officer, and Administrator workflows are housed exclusively in the full portal.
              </div>
              <Link
                href="/"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md"
              >
                <span>Open Full Operations Portal</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-white font-mono flex items-center gap-1"
            >
              <LogOut size={12} />
              <span>Log out and switch to Student account</span>
            </button>
          </div>
        ) : (
          /* LOGGED IN STUDENT: COMPLETE NEXORA LITE STUDENT EXPERIENCE */
          <main className="flex-1">
            <StudentLiteView
              currentUser={currentUser}
              isOnline={isOnline}
              setMsg={setMsg}
              getStatusBadge={getStatusBadge}
              onLogout={handleLogout}
            />
          </main>
        )}
      </div>
    </div>
  );
}
