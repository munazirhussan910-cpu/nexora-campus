'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
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
  ArrowRight,
  Shield,
  LogOut,
  Sparkles,
  MapPin,
  ExternalLink,
  ChevronRight,
  Send,
  Smartphone,
} from 'lucide-react';

export default function NexoraLitePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tab, setTab] = useState<'REQUESTS' | 'COMPLAINT' | 'GATE_PASS' | 'BONAFIDE' | 'LEAVE' | 'NOTICES' | 'LOGIN'>('REQUESTS');
  const [requests, setRequests] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [msg, setMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const checkUser = async () => {
    const res = await apiRequest('/auth/me');
    if (res.success && res.data?.user) {
      setCurrentUser(res.data.user);
      loadRequests();
      loadNotices();
    } else {
      setTab('LOGIN');
    }
  };

  const loadRequests = async () => {
    const res = await apiRequest('/requests/my');
    if (res.success) setRequests(res.data || []);
  };

  const loadNotices = async () => {
    const res = await apiRequest('/notices');
    if (res.success) setNotices(res.data || []);
  };

  useEffect(() => {
    checkUser();
    const today = new Date();
    const s = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const e = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setLeaveStart(s);
    setLeaveEnd(e);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail: loginUser, password: loginPass }),
    });
    if (res.success && res.data) {
      localStorage.setItem('nexora_token', res.data.token);
      setCurrentUser(res.data.user);
      setMsg({ type: 'success', text: `Welcome back, ${res.data.user.fullName || res.data.user.username}!` });
      setTab('REQUESTS');
      loadRequests();
      loadNotices();
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Login failed. Check credentials.' });
    }
    setSubmitting(false);
  };

  const handleQuickPersona = async (persona: string) => {
    setSubmitting(true);
    const res = await apiRequest('/auth/switch-persona', {
      method: 'POST',
      body: JSON.stringify({ persona }),
    });
    if (res.success && res.data) {
      localStorage.setItem('nexora_token', res.data.token);
      setCurrentUser(res.data.user);
      setMsg({ type: 'success', text: `Switched to persona: ${res.data.user.fullName || res.data.user.username}` });
      setTab('REQUESTS');
      loadRequests();
      loadNotices();
    }
    setSubmitting(false);
  };

  const handleComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify({ title, description: desc }),
    });
    if (res.success) {
      setMsg({ type: 'success', text: `Ticket ${res.data.requestNumber} logged! Routed to ${res.data.routing?.category} (${res.data.routing?.assignedTo || 'Assigned'}).` });
      setTitle('');
      setDesc('');
      setTab('REQUESTS');
      loadRequests();
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to submit complaint.' });
    }
    setSubmitting(false);
  };

  const handleGatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    const dep = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const ret = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    const res = await apiRequest('/gate-passes', {
      method: 'POST',
      body: JSON.stringify({
        destination: gateDest,
        reason: gateReason,
        departureTime: dep,
        expectedReturnTime: ret,
      }),
    });

    if (res.success) {
      setMsg({ type: 'success', text: `Gate Pass ${res.data.requestNumber} submitted! Offline PIN: ${res.data.gatePass.passPin}` });
      setGateDest('');
      setGateReason('');
      setTab('REQUESTS');
      loadRequests();
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to apply for gate pass.' });
    }
    setSubmitting(false);
  };

  const handleBonafide = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest('/bonafide', {
      method: 'POST',
      body: JSON.stringify({ purpose: bonafidePurpose }),
    });

    if (res.success) {
      setMsg({ type: 'success', text: `Bonafide Certificate request ${res.data.requestNumber} submitted for official review.` });
      setTab('REQUESTS');
      loadRequests();
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to request certificate.' });
    }
    setSubmitting(false);
  };

  const handleLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest('/leaves', {
      method: 'POST',
      body: JSON.stringify({
        startDate: new Date(leaveStart).toISOString(),
        endDate: new Date(leaveEnd).toISOString(),
        reason: leaveReason,
        emergencyContact: '+91 9876500001 (Parent)',
        parentConsent: true,
      }),
    });

    if (res.success) {
      setMsg({ type: 'success', text: `Hostel Leave request ${res.data.requestNumber} submitted to Warden.` });
      setLeaveReason('');
      setTab('REQUESTS');
      loadRequests();
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to submit leave.' });
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (['APPROVED', 'RESOLVED', 'CONFIRMED', 'VALID'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {s}
        </span>
      );
    }
    if (['IN_PROGRESS', 'ACCEPTED', 'ROUTED', 'DEPARTED'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-700/80">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          {s}
        </span>
      );
    }
    if (['PENDING_APPROVAL', 'SUBMITTED', 'ASSIGNED'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/80">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        {s}
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

  const activeCount = requests.filter(r => !['RESOLVED', 'CONFIRMED', 'CLOSED', 'REJECTED'].includes(r.status)).length;
  const resolvedCount = requests.filter(r => ['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-[#090b10] text-[#e1e4ea] selection:bg-[#d4af37] selection:text-black">
      {/* Top Gold Accent Border */}
      <div className="h-1 bg-gradient-to-r from-[#8c7322] via-[#d4af37] to-[#8c7322]" />

      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Header Bar */}
        <header className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8c7322] flex items-center justify-center font-black text-black text-base shadow-md">
              NX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-wide text-white">NEXORA CAMPUS</h1>
                <span className="px-2 py-0.5 rounded-full bg-[#1b2233] text-gold border border-[#374463] text-[10px] font-bold font-mono">
                  LITE v3.0
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                <Smartphone size={12} className="text-amber-400" />
                <span>Optimized Mobile Text Mode (&lt;100KB) • 2G/3G Ready</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-xl bg-[#181e2e] border border-[#2c374f] hover:border-gold/50 transition font-medium shadow-sm"
            >
              <span>Standard Portal</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </header>

        {/* User Identity Banner */}
        <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1c2336] border border-[#2d3a54] text-gold font-bold flex items-center justify-center text-xs">
                {currentUser.fullName ? currentUser.fullName[0] : 'U'}
              </div>
              <div className="text-xs">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{currentUser.fullName || currentUser.username}</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#1e2538] text-cyan-300 border border-[#2e3b57] text-[10px] font-bold font-mono">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  {currentUser.rollNumber ? `Roll: ${currentUser.rollNumber} • ` : ''}
                  {currentUser.hostelBlock ? `${currentUser.hostelBlock} / ${currentUser.roomNumber || '204'}` : 'Campus'}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle size={15} />
              <span>Not signed in. Please log in to view active tickets.</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs">
            {currentUser ? (
              <button
                onClick={async () => {
                  await apiRequest('/auth/logout', { method: 'POST' });
                  localStorage.removeItem('nexora_token');
                  setCurrentUser(null);
                  setTab('LOGIN');
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 transition font-medium text-[11px]"
              >
                <LogOut size={12} /> Sign Out
              </button>
            ) : (
              <button
                onClick={() => setTab('LOGIN')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold hover:bg-[#c49f2e] text-black font-bold transition text-[11px] shadow"
              >
                Sign In &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Quick Micro-Stats Bar */}
        {currentUser && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Active</span>
              <span className="font-mono text-base font-bold text-amber-400">{activeCount}</span>
            </div>
            <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Resolved</span>
              <span className="font-mono text-base font-bold text-emerald-400">{resolvedCount}</span>
            </div>
            <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total</span>
              <span className="font-mono text-base font-bold text-cyan-400">{requests.length}</span>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {msg && (
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 shadow-lg ${
              msg.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : msg.type === 'error'
                ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                : 'bg-blue-950/60 border-blue-700 text-blue-300'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            <div className="flex-1">{msg.text}</div>
          </div>
        )}

        {/* Segmented Navigation Menu */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {navTabs.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id as any); setMsg(null); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition whitespace-nowrap font-medium text-xs ${
                  isActive
                    ? 'bg-gold text-black font-bold shadow-md'
                    : 'bg-[#121622] text-gray-300 hover:text-white border border-[#232a3d] hover:border-[#35405c]'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-black' : 'text-gray-400'} />
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

        {/* TAB 1: REQUESTS */}
        {tab === 'REQUESTS' && (
          <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#232a3d] pb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gold" />
                <h2 className="font-bold text-sm text-white">Active Campus Requests</h2>
              </div>
              <span className="text-xs font-mono text-gray-400">{requests.length} tracked</span>
            </div>

            {requests.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 space-y-2">
                <Clock size={28} className="text-gray-600 mx-auto" />
                <p>No active requests found for your session.</p>
                <button
                  onClick={() => setTab('COMPLAINT')}
                  className="text-gold hover:underline font-bold text-xs inline-block"
                >
                  + Log your first complaint &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-[#161b2a] border border-[#242e44] hover:border-[#3d4d70] transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
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

                    <h3 className="font-bold text-xs text-gray-100">{r.title}</h3>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 pt-1 border-t border-[#20293d]">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-gray-500" />
                        <span>{r.location || 'Campus'}</span>
                      </span>

                      {r.assignedStaff?.staff && (
                        <span className="text-cyan-300 flex items-center gap-1">
                          <Wrench size={11} /> Staff: {r.assignedStaff.staff.fullName}
                        </span>
                      )}

                      {r.gatePass?.passPin && (
                        <span className="font-mono text-cyan-300 font-bold bg-[#172233] px-2 py-0.5 rounded border border-cyan-800/80">
                          PIN: {r.gatePass.passPin}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPLAINT */}
        {tab === 'COMPLAINT' && (
          <form onSubmit={handleComplaint} className="bg-[#121622] border border-[#232a3d] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3 text-amber-400 font-bold text-sm">
              <Wrench size={16} />
              <span>Log Maintenance Complaint</span>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">Issue Summary</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Washbasin tap leaking heavily in bathroom"
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">Detailed Description (Keywords Auto-Route)</label>
              <textarea
                required
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Keywords like tap, leak, water route to Plumbing; fan, switch to Electrical..."
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 h-24 focus:outline-none focus:border-gold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Send size={13} />
              <span>{submitting ? 'Submitting & Routing...' : 'Submit Complaint'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: GATE PASS */}
        {tab === 'GATE_PASS' && (
          <form onSubmit={handleGatePass} className="bg-[#121622] border border-[#232a3d] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3 text-cyan-300 font-bold text-sm">
              <Key size={16} />
              <span>Apply for Campus Gate Pass</span>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">Destination</label>
              <input
                required
                value={gateDest}
                onChange={(e) => setGateDest(e.target.value)}
                placeholder="e.g. Bhubaneswar City Center"
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">Purpose / Reason</label>
              <input
                required
                value={gateReason}
                onChange={(e) => setGateReason(e.target.value)}
                placeholder="e.g. Purchasing academic project hardware"
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Key size={13} />
              <span>{submitting ? 'Submitting to Warden...' : 'Request Gate Pass'}</span>
            </button>
          </form>
        )}

        {/* TAB 4: BONAFIDE */}
        {tab === 'BONAFIDE' && (
          <form onSubmit={handleBonafide} className="bg-[#121622] border border-[#232a3d] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3 text-emerald-300 font-bold text-sm">
              <FileCheck size={16} />
              <span>Request Official Bonafide Certificate</span>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">Purpose of Certificate</label>
              <select
                value={bonafidePurpose}
                onChange={(e) => setBonafidePurpose(e.target.value)}
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
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
              disabled={submitting}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <FileCheck size={13} />
              <span>{submitting ? 'Submitting...' : 'Request Certificate'}</span>
            </button>
          </form>
        )}

        {/* TAB 5: LEAVE */}
        {tab === 'LEAVE' && (
          <form onSubmit={handleLeave} className="bg-[#121520] border border-[#232a3d] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3 text-purple-300 font-bold text-sm">
              <Calendar size={16} />
              <span>Apply for Hostel Leave</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-xs font-semibold mb-1">Commencement Date</label>
                <input
                  type="date"
                  required
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-xs font-semibold mb-1">Return Date</label>
                <input
                  type="date"
                  required
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                  className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">Reason for Absence</label>
              <input
                required
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="e.g. Traveling home for family function"
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Calendar size={13} />
              <span>{submitting ? 'Submitting to Warden...' : 'Submit Leave Application'}</span>
            </button>
          </form>
        )}

        {/* TAB 6: NOTICES */}
        {tab === 'NOTICES' && (
          <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#232a3d] pb-3">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-gold" />
                <h2 className="font-bold text-sm text-white">Campus Circulars &amp; Notices</h2>
              </div>
              <span className="text-xs font-mono text-gray-400">{notices.length} active</span>
            </div>

            {notices.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">No active circulars.</div>
            ) : (
              <div className="space-y-3">
                {notices.map((n) => (
                  <div key={n.id} className="p-3.5 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="font-bold text-xs text-white">{n.title}</h3>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(n.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">{n.content}</p>
                    <div className="text-[10px] text-gray-400 pt-1 border-t border-[#20293d]">
                      Priority: <strong className={n.priority === 'URGENT' ? 'text-rose-400' : 'text-gray-300'}>{n.priority}</strong> • By: {n.authorName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: LOGIN */}
        {tab === 'LOGIN' && (
          <div className="bg-[#121622] border border-[#232a3d] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3 text-gold font-bold text-sm">
              <User size={16} />
              <span>Sign In to Nexora Lite</span>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-gray-300 text-xs font-semibold mb-1">Username or Email</label>
                <input
                  required
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-xs font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gold hover:bg-[#c49f2e] text-black font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            {/* Quick Demo Switcher within Lite */}
            <div className="pt-3 border-t border-[#20293d] space-y-2">
              <span className="text-[11px] text-gray-400 font-semibold block">Quick 1-Click Persona Login:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'aryan', label: 'Aryan (Student)' },
                  { key: 'ramesh', label: 'Ramesh (Plumber)' },
                  { key: 'warden', label: 'Warden' },
                  { key: 'admin', label: 'Admin' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleQuickPersona(p.key)}
                    className="px-2.5 py-1 rounded-lg bg-[#181e2e] hover:bg-[#222c42] border border-[#2b3852] text-xs text-gray-200 transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-[11px] text-gray-500 py-3 border-t border-[#181e2a]">
          Nexora Campus Lite Engine • BPUT Hackathon 2026
        </footer>
      </div>
    </div>
  );
}
