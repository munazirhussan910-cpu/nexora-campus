'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiRequest, clearApiCache } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Wrench,
  Key,
  FileCheck,
  Calendar,
  Bell,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  MapPin,
  ExternalLink,
  Send,
  Smartphone,
  WifiOff,
  QrCode,
  X,
  RotateCw,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function NexoraLitePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tab, setTab] = useState<'REQUESTS' | 'COMPLAINT' | 'GATE_PASS' | 'BONAFIDE' | 'LEAVE' | 'NOTICES' | 'LOGIN'>('REQUESTS');
  const [requests, setRequests] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [noticesError, setNoticesError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Network offline state
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Gate Pass Modal / High-contrast view
  const [selectedGatePass, setSelectedGatePass] = useState<any | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // Forms
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [gateDest, setGateDest] = useState('');
  const [gateReason, setGateReason] = useState('');
  const [bonafidePurpose, setBonafidePurpose] = useState('Scholarship');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Login form
  const [loginUser, setLoginUser] = useState('aryan');
  const [loginPass, setLoginPass] = useState('Password123!');

  // Pagination
  const [hasMoreRequests, setHasMoreRequests] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalRequestsCount, setTotalRequestsCount] = useState<number | null>(null);

  // Modal focus ref for accessibility
  const modalCloseRef = useRef<HTMLButtonElement>(null);

  // Track online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setMsg({ type: 'info', text: 'Network connection restored. Syncing active data.' });
      // Gracefully refresh active tab without flooding
      if (tab === 'REQUESTS') {
        fetchRequests(false, undefined, true);
      } else if (tab === 'NOTICES') {
        fetchNotices(undefined, true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setMsg({ type: 'error', text: "You are offline. Actions requiring server confirmation are temporarily paused." });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tab]);

  // Trap focus / escape key on Gate Pass modal
  useEffect(() => {
    if (!selectedGatePass) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedGatePass(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    modalCloseRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedGatePass]);

  const fetchRequests = async (append = false, signal?: AbortSignal, bypassCache = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoadingRequests(true);
      setRequestsError(null);
    }

    const currentOffset = append ? requests.length : 0;
    try {
      const res = await apiRequest(`/requests/my?lite=true&limit=15&offset=${currentOffset}`, {
        signal,
        useCache: !bypassCache,
      });

      if (res.error?.code === 'ABORTED') return;

      if (res.success && Array.isArray(res.data)) {
        if (append) {
          setRequests((prev) => [...prev, ...res.data]);
        } else {
          setRequests(res.data);
        }
        const pagination = res.pagination;
        if (pagination) {
          setHasMoreRequests(pagination.hasMore);
          setTotalRequestsCount(pagination.total);
        } else {
          setHasMoreRequests(false);
        }
      } else if (!append) {
        setRequestsError(res.error?.message || 'Unable to load campus requests. Check connection.');
      }
    } catch {
      if (!append) {
        setRequestsError('Network timeout while loading requests.');
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoadingRequests(false);
      }
    }
  };

  const fetchNotices = async (signal?: AbortSignal, bypassCache = false) => {
    setLoadingNotices(true);
    setNoticesError(null);
    try {
      const res = await apiRequest('/notices?lite=true&limit=10', {
        signal,
        useCache: !bypassCache,
      });

      if (res.error?.code === 'ABORTED') return;

      if (res.success && Array.isArray(res.data)) {
        setNotices(res.data);
      } else {
        setNoticesError(res.error?.message || 'Unable to load circulars.');
      }
    } catch {
      setNoticesError('Network timeout while loading circulars.');
    } finally {
      setLoadingNotices(false);
    }
  };

  // Parallelized initial data loading
  const loadInitialData = async (signal?: AbortSignal, bypassCache = false) => {
    await Promise.all([
      fetchRequests(false, signal, bypassCache),
      fetchNotices(signal, bypassCache),
    ]);
  };

  // Coordinated single-auth lifecycle
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      setCurrentUser(user);
      if (tab === 'LOGIN') {
        setTab('REQUESTS');
      }
      const controller = new AbortController();
      loadInitialData(controller.signal);

      return () => {
        controller.abort();
      };
    } else {
      setCurrentUser(null);
      setTab('LOGIN');
    }
  }, [user, authLoading]);

  // Pre-fill initial leave dates
  useEffect(() => {
    const today = new Date();
    const s = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const e = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setLeaveStart(s);
    setLeaveEnd(e);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Cannot authenticate while offline. Please connect to internet.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail: loginUser.trim(), password: loginPass }),
    });
    if (res.success && res.data) {
      localStorage.setItem('nexora_token', res.data.token);
      clearApiCache();
      setCurrentUser(res.data.user);
      setMsg({ type: 'success', text: `Welcome back, ${res.data.user.fullName || res.data.user.username}!` });
      setTab('REQUESTS');
      await refreshUser();
      loadInitialData(undefined, true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Login failed. Check your username and password.' });
    }
    setSubmitting(false);
  };

  const handleQuickPersona = async (persona: string) => {
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Cannot switch persona while offline.' });
      return;
    }
    setSubmitting(true);
    const res = await apiRequest('/auth/switch-persona', {
      method: 'POST',
      body: JSON.stringify({ persona }),
    });
    if (res.success && res.data) {
      localStorage.setItem('nexora_token', res.data.token);
      clearApiCache();
      setCurrentUser(res.data.user);
      setMsg({ type: 'success', text: `Switched persona to: ${res.data.user.fullName || res.data.user.username}` });
      setTab('REQUESTS');
      await refreshUser();
      loadInitialData(undefined, true);
    }
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    await apiRequest('/auth/logout', { method: 'POST' });
    localStorage.removeItem('nexora_token');
    clearApiCache();
    setCurrentUser(null);
    setRequests([]);
    setNotices([]);
    await refreshUser();
    setTab('LOGIN');
  };

  const handleComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Offline. Connect to internet to submit complaints.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify({ title: title.trim(), description: desc.trim() }),
    });
    if (res.success) {
      setMsg({
        type: 'success',
        text: `Ticket ${res.data.requestNumber} logged! Routed to ${res.data.routing?.category || 'Maintenance'} (${res.data.routing?.assignedTo || 'Assigned'}).`,
      });
      setTitle('');
      setDesc('');
      setTab('REQUESTS');
      clearApiCache('/requests');
      fetchRequests(false, undefined, true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to submit complaint. Please try again.' });
    }
    setSubmitting(false);
  };

  const handleGatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Offline. Connect to internet to request gate passes.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const dep = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const ret = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    const res = await apiRequest('/gate-passes', {
      method: 'POST',
      body: JSON.stringify({
        destination: gateDest.trim(),
        reason: gateReason.trim(),
        departureTime: dep,
        expectedReturnTime: ret,
      }),
    });

    if (res.success) {
      setMsg({
        type: 'success',
        text: `Gate Pass ${res.data.requestNumber} submitted! Offline PIN: ${res.data.gatePass.passPin}`,
      });
      setGateDest('');
      setGateReason('');
      setTab('REQUESTS');
      clearApiCache('/requests');
      fetchRequests(false, undefined, true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to apply for gate pass.' });
    }
    setSubmitting(false);
  };

  const handleBonafide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Offline. Connect to internet to request certificates.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest('/bonafide', {
      method: 'POST',
      body: JSON.stringify({ purpose: bonafidePurpose }),
    });

    if (res.success) {
      setMsg({
        type: 'success',
        text: `Bonafide Certificate request ${res.data.requestNumber} submitted for official review.`,
      });
      setTab('REQUESTS');
      clearApiCache('/requests');
      fetchRequests(false, undefined, true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to request certificate.' });
    }
    setSubmitting(false);
  };

  const handleLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Offline. Connect to internet to submit leave applications.' });
      return;
    }
    if (new Date(leaveEnd) < new Date(leaveStart)) {
      setMsg({ type: 'error', text: 'Return date cannot be earlier than commencement date.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest('/leaves', {
      method: 'POST',
      body: JSON.stringify({
        startDate: new Date(leaveStart).toISOString(),
        endDate: new Date(leaveEnd).toISOString(),
        reason: leaveReason.trim(),
        emergencyContact: '+91 9876500001 (Parent)',
        parentConsent: true,
      }),
    });

    if (res.success) {
      setMsg({ type: 'success', text: `Hostel Leave request ${res.data.requestNumber} submitted to Warden.` });
      setLeaveReason('');
      setTab('REQUESTS');
      clearApiCache('/requests');
      fetchRequests(false, undefined, true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to submit leave.' });
    }
    setSubmitting(false);
  };

  const handleCopyPin = (pin: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (['APPROVED', 'RESOLVED', 'CONFIRMED', 'VALID'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
          <span>{s}</span>
        </span>
      );
    }
    if (['IN_PROGRESS', 'ACCEPTED', 'ROUTED', 'DEPARTED'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-700/80">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" aria-hidden="true" />
          <span>{s}</span>
        </span>
      );
    }
    if (['PENDING_APPROVAL', 'SUBMITTED', 'ASSIGNED'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 motion-safe:animate-pulse" aria-hidden="true" />
          <span>{s}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/80">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" aria-hidden="true" />
        <span>{s}</span>
      </span>
    );
  };

  const navTabs = [
    { id: 'REQUESTS', label: 'My Requests', icon: Clock, count: requests.length },
    { id: 'COMPLAINT', label: '+ Complaint', icon: Wrench },
    { id: 'GATE_PASS', label: '+ Gate Pass', icon: Key },
    { id: 'BONAFIDE', label: '+ Bonafide', icon: FileCheck },
    { id: 'LEAVE', label: '+ Leave', icon: Calendar },
    { id: 'NOTICES', label: 'Notices', icon: Bell, count: notices.length },
  ];

  const activeCount = requests.filter((r) => !['RESOLVED', 'CONFIRMED', 'CLOSED', 'REJECTED'].includes(r.status)).length;
  const resolvedCount = requests.filter((r) => ['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-[#090b10] text-[#e1e4ea] selection:bg-[#d4af37] selection:text-black">
      {/* Top Gold Accent Border */}
      <div className="h-1 bg-gradient-to-r from-[#8c7322] via-[#d4af37] to-[#8c7322]" aria-hidden="true" />

      {/* Main Container - Optimized padding across 320px to desktop */}
      <main className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
        
        {/* Offline Alert Banner */}
        {!isOnline && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 rounded-xl bg-amber-950/80 border border-amber-600/80 text-amber-200 text-xs flex items-center gap-2.5 shadow-md"
          >
            <WifiOff size={16} className="text-amber-400 shrink-0" aria-hidden="true" />
            <div>
              <span className="font-bold block">You are currently offline</span>
              <span className="text-[11px] text-amber-300/80">
                Displaying cached campus records. Submissions will be re-enabled once connection is restored.
              </span>
            </div>
          </div>
        )}

        {/* Header Bar */}
        <header className="bg-[#121622] border border-[#232a3d] rounded-2xl p-3.5 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-md border border-[#d4af37]/40 bg-[#121622] p-0.5 shrink-0">
              <Image
                src="/Logo.png"
                alt="Nexora Campus Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-extrabold tracking-wide text-white truncate">NEXORA CAMPUS</h1>
                <span className="px-2 py-0.5 rounded-full bg-[#1b2233] text-gold border border-[#374463] text-[10px] font-bold font-mono">
                  LITE v4.0
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <Smartphone size={12} className="text-amber-400 shrink-0" aria-hidden="true" />
                <span>Optimized Mobile Mode (&lt;100kb) • 3G Ready</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-2 rounded-xl bg-[#181e2e] border border-[#2c374f] hover:border-gold/50 transition font-medium shadow-sm active:scale-[0.98] min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              <span>Standard Portal</span>
              <ExternalLink size={12} aria-hidden="true" />
            </Link>
          </div>
        </header>

        {/* User Identity Banner */}
        <section
          aria-label="User Account Summary"
          className="bg-[#121622] border border-[#232a3d] rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md"
        >
          {authLoading && !currentUser ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1c2336] border border-[#2d3a54] motion-safe:animate-pulse" />
              <div className="space-y-1">
                <div className="h-3 w-28 bg-[#1e2538] rounded motion-safe:animate-pulse" />
                <div className="h-2.5 w-20 bg-[#1e2538] rounded motion-safe:animate-pulse" />
              </div>
            </div>
          ) : currentUser ? (
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-lg bg-[#1c2336] border border-[#2d3a54] text-gold font-bold flex items-center justify-center text-xs shrink-0"
                aria-hidden="true"
              >
                {currentUser.fullName ? currentUser.fullName[0] : 'U'}
              </div>
              <div className="text-xs min-w-0">
                <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                  <span className="truncate">{currentUser.fullName || currentUser.username}</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#1e2538] text-cyan-300 border border-[#2e3b57] text-[10px] font-bold font-mono shrink-0">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono truncate">
                  {currentUser.rollNumber ? `Roll: ${currentUser.rollNumber} • ` : ''}
                  {currentUser.hostelBlock ? `${currentUser.hostelBlock} / ${currentUser.roomNumber || '204'}` : 'Campus'}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
              <span>Not signed in. Please sign in to view active tickets.</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs">
            {currentUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 transition font-medium text-[11px] active:scale-[0.98] min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <LogOut size={13} aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTab('LOGIN')}
                className="inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-lg bg-gold hover:bg-[#c49f2e] text-black font-bold transition text-xs shadow active:scale-[0.98] min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                <span>Sign In &rarr;</span>
              </button>
            )}
          </div>
        </section>

        {/* Quick Micro-Stats Bar */}
        {currentUser && (
          <div className="grid grid-cols-3 gap-2 text-xs" aria-label="Quick metrics">
            <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Active</span>
              <span className="font-mono text-base font-bold text-amber-400 block">{activeCount}</span>
            </div>
            <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Resolved</span>
              <span className="font-mono text-base font-bold text-emerald-400 block">{resolvedCount}</span>
            </div>
            <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Total</span>
              <span className="font-mono text-base font-bold text-cyan-400 block">
                {totalRequestsCount !== null ? totalRequestsCount : requests.length}
              </span>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {msg && (
          <div
            role="status"
            aria-live="polite"
            className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 shadow-lg ${
              msg.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                : msg.type === 'error'
                ? 'bg-rose-950/70 border-rose-700 text-rose-300'
                : 'bg-blue-950/70 border-blue-700 text-blue-300'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" aria-hidden="true" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" aria-hidden="true" />
            )}
            <div className="flex-1 break-words">{msg.text}</div>
            <button
              type="button"
              onClick={() => setMsg(null)}
              className="text-gray-400 hover:text-white p-1 rounded-md transition focus-visible:ring-1 focus-visible:ring-white"
              aria-label="Dismiss notification"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Segmented Navigation Menu with scrollable fade mask */}
        <div className="relative">
          <nav
            role="tablist"
            aria-label="Nexora services navigation"
            className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs scroll-smooth snap-x touch-pan-x"
          >
            {navTabs.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;

              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${item.id}`}
                  onClick={() => {
                    setTab(item.id as any);
                    setMsg(null);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition whitespace-nowrap font-medium text-xs snap-start min-h-[44px] touch-manipulation active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                    isActive
                      ? 'bg-gold text-black font-bold shadow-md'
                      : 'bg-[#121622] text-gray-300 hover:text-white border border-[#232a3d] hover:border-[#35405c]'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-black shrink-0' : 'text-gray-400 shrink-0'} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-black text-gold' : 'bg-[#1f283d] text-gray-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* TAB 1: REQUESTS */}
        {tab === 'REQUESTS' && (
          <section
            id="tabpanel-REQUESTS"
            role="tabpanel"
            aria-labelledby="tab-REQUESTS"
            className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#232a3d] pb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gold shrink-0" aria-hidden="true" />
                <h2 className="font-bold text-sm text-white">Active Campus Requests</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400">
                  {totalRequestsCount !== null ? `${totalRequestsCount} total` : `${requests.length} tracked`}
                </span>
                <button
                  type="button"
                  onClick={() => fetchRequests(false, undefined, true)}
                  disabled={loadingRequests}
                  className="p-1.5 rounded-lg bg-[#181f2f] hover:bg-[#20293d] border border-[#28354c] text-gray-300 hover:text-white transition disabled:opacity-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label="Refresh requests"
                  title="Refresh requests"
                >
                  <RotateCw size={13} className={loadingRequests ? 'animate-spin text-gold' : ''} aria-hidden="true" />
                </button>
              </div>
            </div>

            {requestsError ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-center space-y-3 text-xs">
                <div className="text-rose-300 flex items-center justify-center gap-1.5 font-medium">
                  <AlertCircle size={16} className="shrink-0 text-rose-400" aria-hidden="true" />
                  <span>{requestsError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchRequests(false, undefined, true)}
                  className="px-4 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-white font-semibold text-xs transition active:scale-[0.98] min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                >
                  Retry Loading Requests
                </button>
              </div>
            ) : loadingRequests && requests.length === 0 ? (
              <div className="space-y-2.5" aria-label="Loading tickets">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-24 bg-[#222b40] rounded motion-safe:animate-pulse" />
                      <div className="h-3 w-16 bg-[#222b40] rounded motion-safe:animate-pulse" />
                    </div>
                    <div className="h-4 w-3/4 bg-[#222b40] rounded motion-safe:animate-pulse" />
                    <div className="flex justify-between pt-1 border-t border-[#20293d]">
                      <div className="h-3 w-20 bg-[#222b40] rounded motion-safe:animate-pulse" />
                      <div className="h-3 w-28 bg-[#222b40] rounded motion-safe:animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#161a28] border border-[#262e42] flex items-center justify-center text-gray-500 mx-auto">
                  <Clock size={24} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-300 text-sm">No active campus requests</p>
                  <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                    You haven&apos;t submitted any maintenance complaints, gate passes, or leave applications yet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('COMPLAINT')}
                  className="px-4 py-2.5 rounded-xl bg-gold hover:bg-[#c49f2e] text-black font-bold text-xs transition shadow active:scale-[0.98] min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none inline-flex items-center gap-1.5"
                >
                  <Wrench size={13} aria-hidden="true" />
                  <span>Log your first complaint &rarr;</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {requests.map((r) => (
                  <article
                    key={r.id}
                    className="p-3.5 rounded-xl bg-[#161b2a] border border-[#242e44] hover:border-[#3d4d70] transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-extrabold text-gold text-xs">{r.requestNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e2538] text-gray-300 border border-[#2c3750] font-mono">
                          {r.requestType?.code || r.requestTypeId}
                        </span>
                        {getStatusBadge(r.status)}
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs text-gray-100 break-words">{r.title}</h3>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 pt-1.5 border-t border-[#20293d]">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin size={11} className="text-gray-500 shrink-0" aria-hidden="true" />
                        <span className="truncate">{r.location || 'Campus'}</span>
                      </span>

                      {r.assignedStaff?.staff && (
                        <span className="text-cyan-300 flex items-center gap-1 truncate">
                          <Wrench size={11} className="shrink-0" aria-hidden="true" />
                          <span>Staff: {r.assignedStaff.staff.fullName}</span>
                        </span>
                      )}

                      {r.gatePass?.passPin && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-cyan-300 font-bold bg-[#172233] px-2 py-0.5 rounded border border-cyan-800/80 text-[10px]">
                            PIN: {r.gatePass.passPin}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedGatePass(r)}
                            className="p-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-[10px] font-semibold flex items-center gap-1 transition"
                            title="Show Optical Turnstile Pass"
                            aria-label={`View Gate Pass for ticket ${r.requestNumber}`}
                          >
                            <QrCode size={12} aria-hidden="true" />
                            <span>View Pass</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}

                {hasMoreRequests && (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() => fetchRequests(true)}
                      className="w-full py-3 rounded-xl bg-[#161b2a] hover:bg-[#1e2538] border border-[#28344d] hover:border-gold/50 text-xs font-semibold text-gray-300 hover:text-white transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                    >
                      <Clock size={14} className={loadingMore ? 'animate-spin text-gold' : 'text-gold'} aria-hidden="true" />
                      <span>
                        {loadingMore
                          ? 'Loading older tickets...'
                          : `Load More Requests (${requests.length} of ${totalRequestsCount || '...'})`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: COMPLAINT */}
        {tab === 'COMPLAINT' && (
          <form
            id="tabpanel-COMPLAINT"
            role="tabpanel"
            aria-labelledby="tab-COMPLAINT"
            onSubmit={handleComplaint}
            className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3 text-amber-400 font-bold text-sm">
              <Wrench size={16} aria-hidden="true" />
              <h2>Log Maintenance Complaint</h2>
            </div>

            <div>
              <label htmlFor="complaint-title" className="block text-gray-300 text-xs font-semibold mb-1.5">
                Issue Summary <span className="text-amber-400">*</span>
              </label>
              <input
                id="complaint-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Washbasin tap leaking heavily in bathroom"
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-[16px] sm:text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold transition"
              />
            </div>

            <div>
              <label htmlFor="complaint-desc" className="block text-gray-300 text-xs font-semibold mb-1.5">
                Detailed Description (Keywords Auto-Route) <span className="text-amber-400">*</span>
              </label>
              <textarea
                id="complaint-desc"
                required
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Keywords like tap, leak, water route to Plumbing; fan, switch to Electrical..."
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-[16px] sm:text-xs text-white placeholder-gray-500 h-28 focus:outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold transition leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !isOnline}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              <Send size={14} aria-hidden="true" />
              <span>
                {submitting
                  ? 'Submitting & Routing...'
                  : !isOnline
                  ? 'Offline - Reconnect to Submit'
                  : 'Submit Complaint'}
              </span>
            </button>
          </form>
        )}

        {/* TAB 3: GATE PASS */}
        {tab === 'GATE_PASS' && (
          <form
            id="tabpanel-GATE_PASS"
            role="tabpanel"
            aria-labelledby="tab-GATE_PASS"
            onSubmit={handleGatePass}
            className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3 text-cyan-300 font-bold text-sm">
              <Key size={16} aria-hidden="true" />
              <h2>Apply for Campus Gate Pass</h2>
            </div>

            <div>
              <label htmlFor="gate-dest" className="block text-gray-300 text-xs font-semibold mb-1.5">
                Destination <span className="text-cyan-400">*</span>
              </label>
              <input
                id="gate-dest"
                required
                value={gateDest}
                onChange={(e) => setGateDest(e.target.value)}
                placeholder="e.g. Bhubaneswar City Center"
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-[16px] sm:text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 transition"
              />
            </div>

            <div>
              <label htmlFor="gate-reason" className="block text-gray-300 text-xs font-semibold mb-1.5">
                Purpose / Reason <span className="text-cyan-400">*</span>
              </label>
              <input
                id="gate-reason"
                required
                value={gateReason}
                onChange={(e) => setGateReason(e.target.value)}
                placeholder="e.g. Purchasing academic project hardware"
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-[16px] sm:text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !isOnline}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            >
              <Key size={14} aria-hidden="true" />
              <span>
                {submitting
                  ? 'Submitting to Warden...'
                  : !isOnline
                  ? 'Offline - Reconnect to Request'
                  : 'Request Gate Pass'}
              </span>
            </button>
          </form>
        )}

        {/* TAB 4: BONAFIDE */}
        {tab === 'BONAFIDE' && (
          <form
            id="tabpanel-BONAFIDE"
            role="tabpanel"
            aria-labelledby="tab-BONAFIDE"
            onSubmit={handleBonafide}
            className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3 text-emerald-300 font-bold text-sm">
              <FileCheck size={16} aria-hidden="true" />
              <h2>Request Official Bonafide Certificate</h2>
            </div>

            <div>
              <label htmlFor="bonafide-purpose" className="block text-gray-300 text-xs font-semibold mb-1.5">
                Purpose of Certificate <span className="text-emerald-400">*</span>
              </label>
              <select
                id="bonafide-purpose"
                value={bonafidePurpose}
                onChange={(e) => setBonafidePurpose(e.target.value)}
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-[16px] sm:text-xs text-white focus:outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition"
              >
                <option value="Scholarship">State / National Scholarship Verification</option>
                <option value="Bank">Bank Account Opening / Education Loan</option>
                <option value="Internship">Summer Internship Application</option>
                <option value="Passport">Passport / Visa Verification</option>
                <option value="Other">Other Official Academic Purpose</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || !isOnline}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              <FileCheck size={14} aria-hidden="true" />
              <span>
                {submitting
                  ? 'Submitting...'
                  : !isOnline
                  ? 'Offline - Reconnect to Submit'
                  : 'Request Certificate'}
              </span>
            </button>
          </form>
        )}

        {/* TAB 5: LEAVE */}
        {tab === 'LEAVE' && (
          <form
            id="tabpanel-LEAVE"
            role="tabpanel"
            aria-labelledby="tab-LEAVE"
            onSubmit={handleLeave}
            className="bg-[#121520] border border-[#232a3d] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3 text-purple-300 font-bold text-sm">
              <Calendar size={16} aria-hidden="true" />
              <h2>Apply for Hostel Leave</h2>
            </div>

            {/* Mobile-optimized responsive date grid: 1 column on small screens, 2 columns on tablet/desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="leave-start" className="block text-gray-300 text-xs font-semibold mb-1.5">
                  Commencement Date <span className="text-purple-400">*</span>
                </label>
                <input
                  id="leave-start"
                  type="date"
                  required
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-[16px] sm:text-xs text-white focus:outline-none focus:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-400 transition"
                />
              </div>
              <div>
                <label htmlFor="leave-end" className="block text-gray-300 text-xs font-semibold mb-1.5">
                  Return Date <span className="text-purple-400">*</span>
                </label>
                <input
                  id="leave-end"
                  type="date"
                  required
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                  className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-[16px] sm:text-xs text-white focus:outline-none focus:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-400 transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="leave-reason" className="block text-gray-300 text-xs font-semibold mb-1.5">
                Reason for Absence <span className="text-purple-400">*</span>
              </label>
              <input
                id="leave-reason"
                required
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="e.g. Traveling home for family function"
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-[16px] sm:text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-400 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !isOnline}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none"
            >
              <Calendar size={14} aria-hidden="true" />
              <span>
                {submitting
                  ? 'Submitting to Warden...'
                  : !isOnline
                  ? 'Offline - Reconnect to Submit'
                  : 'Submit Leave Application'}
              </span>
            </button>
          </form>
        )}

        {/* TAB 6: NOTICES */}
        {tab === 'NOTICES' && (
          <section
            id="tabpanel-NOTICES"
            role="tabpanel"
            aria-labelledby="tab-NOTICES"
            className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#232a3d] pb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-gold shrink-0" aria-hidden="true" />
                <h2 className="font-bold text-sm text-white">Campus Circulars &amp; Notices</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400">{notices.length} active</span>
                <button
                  type="button"
                  onClick={() => fetchNotices(undefined, true)}
                  disabled={loadingNotices}
                  className="p-1.5 rounded-lg bg-[#181f2f] hover:bg-[#20293d] border border-[#28354c] text-gray-300 hover:text-white transition disabled:opacity-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label="Refresh notices"
                  title="Refresh notices"
                >
                  <RotateCw size={13} className={loadingNotices ? 'animate-spin text-gold' : ''} aria-hidden="true" />
                </button>
              </div>
            </div>

            {noticesError ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-center space-y-3 text-xs">
                <div className="text-rose-300 flex items-center justify-center gap-1.5 font-medium">
                  <AlertCircle size={16} className="shrink-0 text-rose-400" aria-hidden="true" />
                  <span>{noticesError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchNotices(undefined, true)}
                  className="px-4 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-white font-semibold text-xs transition active:scale-[0.98] min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                >
                  Retry Loading Circulars
                </button>
              </div>
            ) : loadingNotices && notices.length === 0 ? (
              <div className="space-y-3" aria-label="Loading circulars">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-1/2 bg-[#222b40] rounded motion-safe:animate-pulse" />
                      <div className="h-3 w-16 bg-[#222b40] rounded motion-safe:animate-pulse" />
                    </div>
                    <div className="h-10 w-full bg-[#222b40] rounded motion-safe:animate-pulse" />
                  </div>
                ))}
              </div>
            ) : notices.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#161a28] border border-[#262e42] flex items-center justify-center text-gray-500 mx-auto">
                  <Bell size={24} aria-hidden="true" />
                </div>
                <p className="font-semibold text-gray-300 text-sm">No campus notices published</p>
                <p className="text-gray-500">Official university circulars and hostel announcements will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notices.map((n) => (
                  <article key={n.id} className="p-3.5 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="font-bold text-xs text-white break-words">{n.title}</h3>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(n.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed break-words">{n.content}</p>
                    <div className="text-[10px] text-gray-400 pt-1.5 border-t border-[#20293d] flex items-center justify-between flex-wrap gap-1">
                      <span>
                        Priority:{' '}
                        <strong className={n.priority === 'URGENT' ? 'text-rose-400' : 'text-gray-300'}>
                          {n.priority}
                        </strong>
                      </span>
                      <span>By: {n.authorName}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB: LOGIN */}
        {tab === 'LOGIN' && (
          <section
            id="tabpanel-LOGIN"
            role="tabpanel"
            aria-labelledby="tab-LOGIN"
            className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3 text-gold font-bold text-sm">
              <User size={16} aria-hidden="true" />
              <h2>Sign In to Nexora Lite</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label htmlFor="login-username" className="block text-gray-300 text-xs font-semibold mb-1.5">
                  Username or Email <span className="text-gold">*</span>
                </label>
                <input
                  id="login-username"
                  required
                  autoComplete="username"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-[16px] sm:text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold transition"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-gray-300 text-xs font-semibold mb-1.5">
                  Password <span className="text-gold">*</span>
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-[16px] sm:text-xs text-white focus:outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !isOnline}
                className="w-full py-3 bg-gold hover:bg-[#c49f2e] text-black font-bold text-xs rounded-xl shadow-md transition active:scale-[0.98] min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                {submitting ? 'Authenticating...' : !isOnline ? 'Offline - Reconnect to Sign In' : 'Sign In'}
              </button>
            </form>

            {/* Quick Demo Switcher within Lite with touch-accessible buttons */}
            <div className="pt-3.5 border-t border-[#20293d] space-y-2">
              <span className="text-[11px] text-gray-400 font-semibold block">Quick 1-Click Persona Login:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'aryan', label: 'Aryan (Student)' },
                  { key: 'ramesh', label: 'Ramesh (Plumber)' },
                  { key: 'warden', label: 'Warden' },
                  { key: 'admin', label: 'Admin' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    disabled={submitting || !isOnline}
                    onClick={() => handleQuickPersona(p.key)}
                    className="px-3 py-2.5 rounded-xl bg-[#181e2e] hover:bg-[#222c42] border border-[#2b3852] text-xs text-gray-200 transition text-center min-h-[44px] touch-manipulation active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gate Pass High-Contrast Optical Turnstile Modal (Section 16) */}
        {selectedGatePass && selectedGatePass.gatePass && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gate-pass-modal-title"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedGatePass(null)}
          >
            <div
              className="bg-[#101726] border-2 border-cyan-500/80 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-4 text-center my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#212f47] pb-2.5">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span id="gate-pass-modal-title">Turnstile Security Clearance</span>
                </div>
                <button
                  ref={modalCloseRef}
                  type="button"
                  onClick={() => setSelectedGatePass(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-[#19243a] border border-[#2c3d5d] transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label="Close pass dialog"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              {/* QR Code Presentation on Pure White for 100% Optical Scanner Readability */}
              <div className="bg-white p-3 rounded-xl inline-block shadow-inner border border-gray-300">
                <QRCodeSVG
                  value={selectedGatePass.gatePass.qrTokenHash || selectedGatePass.gatePass.passPin || selectedGatePass.requestNumber}
                  size={140}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
                <span className="text-[10px] text-gray-900 font-mono font-black mt-1 block tracking-wider">
                  SCAN AT GATE TURNSTILE
                </span>
              </div>

              {/* High-Contrast Offline PIN */}
              <div className="bg-[#152136] p-3 rounded-xl border border-cyan-700/80 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] text-gray-400 font-mono uppercase block font-bold">
                    Offline Security PIN
                  </span>
                  <span className="font-mono text-2xl font-black text-cyan-300 tracking-widest">
                    {selectedGatePass.gatePass.passPin}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyPin(selectedGatePass.gatePass.passPin)}
                  className="p-2 rounded-lg bg-[#1f304e] hover:bg-[#283f66] text-cyan-300 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Copy PIN"
                  aria-label="Copy offline PIN"
                >
                  {copiedPin ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
              </div>

              <div className="text-[11px] text-gray-400 text-left space-y-1 font-mono bg-[#141b2b] p-2.5 rounded-lg border border-[#222c42]">
                <div>
                  REF: <strong className="text-white">{selectedGatePass.requestNumber}</strong>
                </div>
                <div>
                  DEST: <strong className="text-cyan-300">{selectedGatePass.gatePass.destination || selectedGatePass.title}</strong>
                </div>
                <div>
                  STATUS: {getStatusBadge(selectedGatePass.status)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGatePass(null)}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition shadow min-h-[44px] touch-manipulation active:scale-[0.98]"
              >
                Close Pass
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-[11px] text-gray-500 py-3 border-t border-[#181e2a]">
          Nexora Campus Lite Engine • BPUT Hackathon 2026
        </footer>
      </main>
    </div>
  );
}
