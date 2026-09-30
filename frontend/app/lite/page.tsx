'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiRequest, clearApiCache } from '@/lib/api';
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
  Shield,
  Wrench,
  Key,
  GraduationCap,
  Sparkles,
  Menu,
  Home,
  Monitor,
  FileCheck,
  RefreshCw,
  ChevronRight,
  Wifi,
} from 'lucide-react';

import { StudentLiteView } from './components/StudentLiteView';
import { AdminLiteView } from './components/AdminLiteView';
import { StaffLiteView } from './components/StaffLiteView';
import { WardenLiteView } from './components/WardenLiteView';
import { SecurityLiteView } from './components/SecurityLiteView';
import { AcademicLiteView } from './components/AcademicLiteView';

export default function NexoraLitePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [msg, setMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 3-Line Menu Drawer State (Upper Right)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Login form state
  const [loginUser, setLoginUser] = useState('aryan');
  const [loginPass, setLoginPass] = useState('Password123!');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Offline detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setMsg({ type: 'info', text: 'Network connection restored. Real-time sync active.' });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setMsg({ type: 'error', text: 'You are offline. Displaying cached records.' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Escape key & scroll lock for 3-line drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };

    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen]);

  // Coordinated auth state
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setCurrentUser(user);
      setIsSigningIn(false);
    } else {
      setCurrentUser(null);
    }
  }, [user, authLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Cannot authenticate while offline.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail: loginUser.trim(), password: loginPass }),
    });
    if (res.success && res.data) {
      localStorage.setItem('nexora_token', res.data.token);
      clearApiCache();
      setCurrentUser(res.data.user);
      setMsg({ type: 'success', text: `Welcome back, ${res.data.user.fullName || res.data.user.username}!` });
      await refreshUser();
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Login failed. Check credentials.' });
    }
    setSubmitting(false);
  };

  const handleQuickPersona = async (persona: string) => {
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Cannot switch persona while offline.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest<{ token: string; user: any }>('/auth/switch-persona', {
      method: 'POST',
      body: JSON.stringify({ persona }),
    });
    if (res.success && res.data) {
      localStorage.setItem('nexora_token', res.data.token);
      clearApiCache();
      setCurrentUser(res.data.user);
      setMsg({ type: 'success', text: `Persona switched to ${res.data.user.fullName} (${res.data.user.role})` });
      setIsDrawerOpen(false);
      await refreshUser();
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to switch persona.' });
    }
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    await apiRequest('/auth/logout', { method: 'POST' });
    localStorage.removeItem('nexora_token');
    clearApiCache();
    setCurrentUser(null);
    setIsDrawerOpen(false);
    await refreshUser();
    setIsSigningIn(true);
  };

  // Standardized status badge
  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (['APPROVED', 'RESOLVED', 'CONFIRMED', 'VALID'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span>{s}</span>
        </span>
      );
    }
    if (['IN_PROGRESS', 'ACCEPTED', 'ROUTED', 'DEPARTED'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/80 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
          <span>{s}</span>
        </span>
      );
    }
    if (['PENDING_APPROVAL', 'SUBMITTED', 'ASSIGNED'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
          <span>{s.replace('_', ' ')}</span>
        </span>
      );
    }
    if (['RETURNED', 'CLOSED'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1a2030] text-gray-300 border border-[#2b354d]">
          <span>{s}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-700/80 shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
        <span>{s}</span>
      </span>
    );
  };

  // Determine Role Presentation Details
  const getRolePresentation = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          title: 'CAMPUS OPERATIONS',
          roleBadge: 'ADMIN LITE',
          roleColor: 'border-purple-500/50 text-purple-400 bg-purple-950/40',
          portalUrl: '/admin/dashboard',
        };
      case 'STAFF':
        return {
          title: 'MY WORK QUEUE',
          roleBadge: 'STAFF LITE',
          roleColor: 'border-amber-500/50 text-amber-400 bg-amber-950/40',
          portalUrl: '/staff/dashboard',
        };
      case 'WARDEN':
        return {
          title: 'HOSTEL CONTROL',
          roleBadge: 'WARDEN LITE',
          roleColor: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/40',
          portalUrl: '/warden/dashboard',
        };
      case 'SECURITY':
        return {
          title: 'MAIN GATE',
          roleBadge: 'SECURITY LITE',
          roleColor: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/40',
          portalUrl: '/security/dashboard',
        };
      case 'ACADEMIC_OFFICER':
        return {
          title: 'ACADEMIC SERVICES',
          roleBadge: 'ACADEMIC LITE',
          roleColor: 'border-teal-500/50 text-teal-400 bg-teal-950/40',
          portalUrl: '/academic/dashboard',
        };
      case 'STUDENT':
      default:
        return {
          title: 'MY CAMPUS',
          roleBadge: 'STUDENT LITE',
          roleColor: 'border-blue-500/50 text-blue-400 bg-blue-950/40',
          portalUrl: '/student/dashboard',
        };
    }
  };

  const rolePres = getRolePresentation(currentUser?.role);

  return (
    <div className="min-h-screen bg-[#080a10] text-[#edeef2] selection:bg-[#d4af37] selection:text-black">
      {/* Top Gold Horizon Accent Line */}
      <div className="h-1 bg-gradient-to-r from-[#705814] via-[#d4af37] to-[#705814] shadow-xs" aria-hidden="true" />

      {/* Main App Container */}
      <main className="max-w-2xl mx-auto px-3 sm:px-5 py-3.5 sm:py-5 space-y-3.5 sm:space-y-4">
        {/* Offline Alert Banner */}
        {!isOnline && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 rounded-2xl bg-amber-950/80 border border-amber-600/80 text-amber-200 text-xs flex items-center gap-2.5 shadow-lg"
          >
            <WifiOff size={16} className="text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block">Offline Mode</span>
              <span className="text-[11px] text-amber-300/80">Displaying local cached records. Server write operations will pause until network is restored.</span>
            </div>
          </div>
        )}

        {/* Top App Header with 3-Line Menu on Upper Right */}
        <header className="bg-[#111522]/95 backdrop-blur-md border border-[#232b3f] rounded-2xl p-3 sm:p-4 shadow-xl shadow-black/30 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-md border border-[#d4af37]/45 bg-[#141926] p-0.5 shrink-0 group hover:border-[#d4af37] transition-all"
              title="Nexora Campus Home"
            >
              <Image
                src="/Logo.png"
                alt="Nexora Logo"
                width={38}
                height={38}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                priority
              />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white truncate">
                  {rolePres.title}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border tracking-wider uppercase ${rolePres.roleColor}`}>
                  {rolePres.roleBadge}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5 font-mono">
                <Smartphone size={11} className="text-amber-400 shrink-0" />
                <span>Nexora Lite v4.0 • Ultra-Lightweight</span>
              </p>
            </div>
          </div>

          {/* Upper Right Action Area: Standard Portal Link + 3-Line Hamburger Menu Button */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={rolePres.portalUrl}
              className="hidden xs:inline-flex items-center justify-center gap-1 text-xs text-gray-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-[#171d2c] hover:bg-[#20283d] border border-[#28334b] hover:border-gold/40 transition font-medium min-h-[42px] touch-manipulation shadow-xs"
              title="Open Full Desktop Portal"
            >
              <span>Standard</span>
              <ExternalLink size={12} />
            </Link>

            {/* 3-LINE (HAMBURGER) MENU BUTTON ON UPPER RIGHT */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-2.5 rounded-xl bg-[#171d2c] hover:bg-[#21293f] border border-[#d4af37]/40 hover:border-[#d4af37] text-[#d4af37] hover:text-white transition-all shadow-md shadow-black/20 flex items-center justify-center min-h-[42px] min-w-[42px] active:scale-95 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
              aria-label="Open 3-line quick navigation menu"
              aria-expanded={isDrawerOpen}
              title="Quick Navigation &amp; Tools (3 Lines)"
            >
              {/* 3-Line Horizontal Graphic */}
              <div className="flex flex-col justify-between w-4 h-3.5" aria-hidden="true">
                <span className="w-full h-0.5 bg-[#d4af37] rounded-full transition-transform" />
                <span className="w-full h-0.5 bg-[#d4af37] rounded-full transition-transform" />
                <span className="w-full h-0.5 bg-[#d4af37] rounded-full transition-transform" />
              </div>
            </button>
          </div>
        </header>

        {/* User Account Bar */}
        {currentUser && (
          <section
            aria-label="Current User"
            className="bg-gradient-to-r from-[#121624] via-[#141a2a] to-[#101420] border border-[#232b3f] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-md"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#1b2234] border border-[#2e3b56] text-[#d4af37] font-extrabold flex items-center justify-center text-xs shrink-0 shadow-inner">
                {currentUser.fullName ? currentUser.fullName[0] : 'U'}
              </div>
              <div className="text-xs min-w-0">
                <div className="font-bold text-white truncate flex items-center gap-2">
                  <span>{currentUser.fullName || currentUser.username}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Active on duty" />
                </div>
                <div className="text-[11px] text-gray-400 font-mono truncate">
                  {currentUser.role === 'STUDENT' && currentUser.rollNumber ? `Roll: ${currentUser.rollNumber} • ` : ''}
                  {currentUser.role === 'STAFF' && currentUser.specialization ? `${currentUser.specialization} Unit • ` : ''}
                  {currentUser.role === 'WARDEN' ? 'Block B Warden • ' : ''}
                  {currentUser.role === 'SECURITY' ? 'Main Gate 1 • ' : ''}
                  {currentUser.role === 'ACADEMIC_OFFICER' ? 'Academic Cell • ' : ''}
                  {currentUser.role === 'ADMIN' ? 'Command Director • ' : ''}
                  {currentUser.hostelBlock ? `${currentUser.hostelBlock}` : 'Main Campus'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/80 text-rose-300 font-medium text-[11px] min-h-[38px] transition active:scale-95 touch-manipulation"
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            </div>
          </section>
        )}

        {/* Notification Toast */}
        {msg && (
          <div
            role="status"
            aria-live="polite"
            className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 shadow-lg ${
              msg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : msg.type === 'error'
                ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                : 'bg-blue-950/80 border-blue-700 text-blue-300'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            )}
            <div className="flex-1 break-words">{msg.text}</div>
            <button
              type="button"
              onClick={() => setMsg(null)}
              className="text-gray-400 hover:text-white p-1 rounded transition"
              aria-label="Dismiss message"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ROLE-SPECIFIC INTERFACE VIEWS */}
        {currentUser ? (
          <>
            {currentUser.role === 'STUDENT' && (
              <StudentLiteView
                currentUser={currentUser}
                isOnline={isOnline}
                setMsg={setMsg}
                getStatusBadge={getStatusBadge}
              />
            )}

            {currentUser.role === 'ADMIN' && (
              <AdminLiteView
                currentUser={currentUser}
                isOnline={isOnline}
                setMsg={setMsg}
                getStatusBadge={getStatusBadge}
              />
            )}

            {currentUser.role === 'STAFF' && (
              <StaffLiteView
                currentUser={currentUser}
                isOnline={isOnline}
                setMsg={setMsg}
                getStatusBadge={getStatusBadge}
              />
            )}

            {currentUser.role === 'WARDEN' && (
              <WardenLiteView
                currentUser={currentUser}
                isOnline={isOnline}
                setMsg={setMsg}
                getStatusBadge={getStatusBadge}
              />
            )}

            {currentUser.role === 'SECURITY' && (
              <SecurityLiteView
                currentUser={currentUser}
                isOnline={isOnline}
                setMsg={setMsg}
                getStatusBadge={getStatusBadge}
              />
            )}

            {currentUser.role === 'ACADEMIC_OFFICER' && (
              <AcademicLiteView
                currentUser={currentUser}
                isOnline={isOnline}
                setMsg={setMsg}
                getStatusBadge={getStatusBadge}
              />
            )}
          </>
        ) : (
          /* SIGN IN / AUTH SECTION */
          <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-5 space-y-4 shadow-xl">
            <div>
              <h2 className="text-base font-bold text-white">Sign In to Nexora Lite</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Ultra-lightweight low-bandwidth portal for campus requests, task queues, and gate clearances.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1 text-[11px]">Username or Email</label>
                <input
                  type="text"
                  required
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1 text-[11px]">Password</label>
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-gold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !isOnline}
                className="w-full py-3 bg-gold hover:bg-[#c49f2e] text-black font-bold text-xs rounded-xl shadow-md transition active:scale-[0.98] min-h-[44px] disabled:opacity-50"
              >
                {submitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </section>
        )}

        {/* DEMO MODE PERSONA SWITCHER DOCK */}
        <section
          aria-label="Demo Persona Switcher"
          className="bg-[#101420] border border-[#232b3f] rounded-2xl p-3.5 space-y-2.5 shadow-lg"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-[11px] text-gray-200 tracking-wide uppercase font-mono">
                Demo Switcher (1-Click Roles)
              </span>
            </div>
            <span className="text-[10px] text-[#d4af37] font-mono font-bold">Fast Switching</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { key: 'aryan', name: 'Aryan Khan', roleLabel: 'Student', icon: User, color: 'text-blue-400' },
              { key: 'ramesh', name: 'Ramesh Kumar', roleLabel: 'Staff (Plumber)', icon: Wrench, color: 'text-amber-400' },
              { key: 'warden', name: 'Dr. Mohapatra', roleLabel: 'Hostel Warden', icon: Shield, color: 'text-emerald-400' },
              { key: 'security', name: 'Vikram Singh', roleLabel: 'Gate Security', icon: Key, color: 'text-cyan-400' },
              { key: 'academic', name: 'Prof. Mohanty', roleLabel: 'Academic Officer', icon: GraduationCap, color: 'text-teal-400' },
              { key: 'admin', name: 'Dr. Ananya Ray', roleLabel: 'Chief Admin', icon: Sparkles, color: 'text-purple-400' },
            ].map((p) => {
              const Icon = p.icon;
              const isSelected =
                p.key === 'aryan'
                  ? currentUser?.username === 'aryan'
                  : p.key === 'ramesh'
                  ? currentUser?.username === 'ramesh'
                  : p.key === 'warden'
                  ? currentUser?.username === 'warden_b'
                  : p.key === 'security'
                  ? currentUser?.username === 'security_gate1'
                  : p.key === 'academic'
                  ? currentUser?.username === 'academic'
                  : p.key === 'admin'
                  ? currentUser?.username === 'admin'
                  : false;

              return (
                <button
                  key={p.key}
                  type="button"
                  disabled={submitting || !isOnline}
                  onClick={() => handleQuickPersona(p.key)}
                  className={`p-2 rounded-xl border text-left transition flex items-center gap-2 min-h-[44px] active:scale-95 disabled:opacity-50 touch-manipulation ${
                    isSelected
                      ? 'bg-[#1b2234] border-[#d4af37] text-white font-bold shadow-xs'
                      : 'bg-[#141824] border-[#22293b] text-gray-300 hover:text-white hover:bg-[#192030]'
                  }`}
                >
                  <Icon size={14} className={`shrink-0 ${isSelected ? 'text-[#d4af37]' : p.color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[11px] truncate leading-tight">{p.name}</div>
                    <div className="text-[9px] text-gray-400 font-mono truncate">{p.roleLabel}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Low-Bandwidth Footer */}
        <footer className="text-center text-[11px] text-gray-500 py-3 border-t border-[#181e2a] font-mono">
          NEXORA CAMPUS LITE • PRODUCTION ULTRA-LIGHTWEIGHT ENGINE
        </footer>
      </main>

      {/* 3-LINE (HAMBURGER) FLYOUT DRAWER — SLIDE OVER FROM UPPER RIGHT */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-end"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            ref={drawerRef}
            className="w-full max-w-xs h-full bg-[#101422] border-l border-[#263148] shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              {/* Drawer Header with Close Button */}
              <div className="flex items-center justify-between border-b border-[#212a3f] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#d4af37]/50 bg-[#151a28] p-0.5 flex items-center justify-center">
                    <Image src="/Logo.png" alt="Logo" width={28} height={28} className="object-contain" />
                  </div>
                  <div>
                    <h3 id="drawer-title" className="text-sm font-extrabold text-white tracking-wide">
                      NEXORA LITE
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono">Quick Navigation</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl bg-[#171d2b] border border-[#273248] text-gray-400 hover:text-white transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Active User Card inside Drawer */}
              {currentUser ? (
                <div className="bg-[#151b2a] border border-[#25324c] rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{currentUser.fullName}</span>
                    <span className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-bold border ${rolePres.roleColor}`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    {currentUser.email}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 pt-0.5">
                    <Wifi size={10} />
                    <span>{isOnline ? 'Online (Real-Time Sync)' : 'Offline (Cached Data)'}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#151b2a] border border-[#25324c] text-xs text-gray-300">
                  Not signed in. Select a demo persona below to explore role views.
                </div>
              )}

              {/* Main Navigation Links */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[10px] font-mono uppercase font-bold text-gray-400 tracking-wider px-1">
                  Portals &amp; Views
                </div>

                <Link
                  href={rolePres.portalUrl}
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#141926] hover:bg-[#1b2234] border border-[#232d42] text-gray-200 hover:text-white transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <ExternalLink size={15} className="text-[#d4af37]" />
                    <span className="font-medium">Standard Desktop Portal</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/kiosk"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#141926] hover:bg-[#1b2234] border border-[#232d42] text-gray-200 hover:text-white transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <Monitor size={15} className="text-cyan-400" />
                    <span className="font-medium">Campus Kiosk View</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/verify/NX-BON-2026-00199"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#141926] hover:bg-[#1b2234] border border-[#232d42] text-gray-200 hover:text-white transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileCheck size={15} className="text-emerald-400" />
                    <span className="font-medium">Public Certificate Verification</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#141926] hover:bg-[#1b2234] border border-[#232d42] text-gray-200 hover:text-white transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <Home size={15} className="text-gray-400" />
                    <span className="font-medium">Landing Page</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Quick Persona Switching inside Drawer */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-[#1f283d]">
                <div className="text-[10px] font-mono uppercase font-bold text-gray-400 tracking-wider px-1">
                  Quick Role Switcher
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'aryan', label: 'Aryan (Student)' },
                    { key: 'ramesh', label: 'Ramesh (Plumber)' },
                    { key: 'warden', label: 'Dr. Mohapatra (Warden)' },
                    { key: 'security', label: 'Vikram (Security)' },
                    { key: 'academic', label: 'Prof. Mohanty (Academic)' },
                    { key: 'admin', label: 'Dr. Ray (Chief Admin)' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      disabled={submitting || !isOnline}
                      onClick={() => handleQuickPersona(p.key)}
                      className="p-2 rounded-xl bg-[#141926] hover:bg-[#1b2234] border border-[#232d42] text-gray-300 hover:text-white text-[10px] font-medium text-left truncate transition disabled:opacity-50 min-h-[38px]"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-4 border-t border-[#1f283d] space-y-2">
              {currentUser ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition min-h-[44px]"
                >
                  <LogOut size={14} />
                  <span>Sign Out Session</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-gold hover:bg-[#c49f2e] text-black font-bold text-xs flex items-center justify-center gap-2 transition min-h-[44px]"
                >
                  <span>Sign In</span>
                </button>
              )}
              <p className="text-center text-[10px] text-gray-500 font-mono">
                Nexora Lite Engine • Mobile-First
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
