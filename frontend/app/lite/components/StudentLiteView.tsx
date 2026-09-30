'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiRequest, clearApiCache } from '@/lib/api';
import {
  Wrench,
  Key,
  FileCheck,
  Calendar,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  QrCode,
  X,
  RotateCw,
  Copy,
  Check,
  ShieldCheck,
  Download,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface StudentLiteViewProps {
  currentUser: any;
  isOnline: boolean;
  setMsg: (msg: { type: 'info' | 'success' | 'error'; text: string } | null) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function StudentLiteView({
  currentUser,
  isOnline,
  setMsg,
  getStatusBadge,
}: StudentLiteViewProps) {
  const [tab, setTab] = useState<'REQUESTS' | 'COMPLAINT' | 'GATE_PASS' | 'BONAFIDE' | 'LEAVE' | 'NOTICES'>('REQUESTS');
  const [requests, setRequests] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [noticesError, setNoticesError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Gate Pass Turnstile Modal
  const [selectedGatePass, setSelectedGatePass] = useState<any | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const modalCloseRef = useRef<HTMLButtonElement>(null);

  // Forms
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [gateDest, setGateDest] = useState('');
  const [gateReason, setGateReason] = useState('');
  const [bonafidePurpose, setBonafidePurpose] = useState('Scholarship');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Pagination
  const [hasMoreRequests, setHasMoreRequests] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalRequestsCount, setTotalRequestsCount] = useState<number | null>(null);

  const fetchRequests = async (append = false, bypassCache = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoadingRequests(true);
      setRequestsError(null);
    }

    const currentOffset = append ? requests.length : 0;
    try {
      const res = await apiRequest(`/requests/my?lite=true&limit=15&offset=${currentOffset}`, {
        useCache: !bypassCache,
      });

      if (res.success && Array.isArray(res.data)) {
        if (append) {
          setRequests((prev) => [...prev, ...res.data]);
        } else {
          setRequests(res.data);
        }
        if (res.pagination) {
          setHasMoreRequests(res.pagination.hasMore);
          setTotalRequestsCount(res.pagination.total);
        } else {
          setHasMoreRequests(false);
        }
      } else if (!append) {
        setRequestsError(res.error?.message || 'Unable to load personal requests.');
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

  const fetchNotices = async (bypassCache = false) => {
    setLoadingNotices(true);
    setNoticesError(null);
    try {
      const res = await apiRequest('/notices?lite=true&limit=10', {
        useCache: !bypassCache,
      });
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

  useEffect(() => {
    fetchRequests(false);
    fetchNotices(false);
  }, []);

  // Pre-fill initial leave dates
  useEffect(() => {
    const today = new Date();
    const s = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const e = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setLeaveStart(s);
    setLeaveEnd(e);
  }, []);

  const handleCopyPin = (pin: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
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
      fetchRequests(false, true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to submit complaint.' });
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
      fetchRequests(false, true);
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
      fetchRequests(false, true);
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
      fetchRequests(false, true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to submit leave.' });
    }
    setSubmitting(false);
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
    <div className="space-y-4">
      {/* Student Personal Metrics */}
      <div className="grid grid-cols-3 gap-2 text-xs" aria-label="Personal ticket metrics">
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

      {/* Segmented Navigation Menu */}
      <div className="relative">
        <nav
          role="tablist"
          aria-label="Student actions"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs scroll-smooth snap-x touch-pan-x"
        >
          {navTabs.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.id;

            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setTab(item.id as any);
                  setMsg(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition whitespace-nowrap font-medium text-xs snap-start min-h-[44px] touch-manipulation active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
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
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#232a3d] pb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gold shrink-0" aria-hidden="true" />
              <h2 className="font-bold text-sm text-white">My Campus Requests</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400">
                {totalRequestsCount !== null ? `${totalRequestsCount} total` : `${requests.length} tracked`}
              </span>
              <button
                type="button"
                onClick={() => fetchRequests(false, true)}
                disabled={loadingRequests}
                className="p-1.5 rounded-lg bg-[#181f2f] hover:bg-[#20293d] border border-[#28354c] text-gray-300 hover:text-white transition disabled:opacity-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Refresh requests"
              >
                <RotateCw size={13} className={loadingRequests ? 'animate-spin text-gold' : ''} />
              </button>
            </div>
          </div>

          {requestsError ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-center space-y-3 text-xs">
              <div className="text-rose-300 flex items-center justify-center gap-1.5 font-medium">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{requestsError}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchRequests(false, true)}
                className="px-4 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-white font-semibold text-xs transition"
              >
                Retry
              </button>
            </div>
          ) : loadingRequests && requests.length === 0 ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-2 animate-pulse">
                  <div className="h-4 w-24 bg-[#222b40] rounded" />
                  <div className="h-4 w-3/4 bg-[#222b40] rounded" />
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400 space-y-3">
              <Clock size={24} className="mx-auto text-gray-500" />
              <p className="font-semibold text-gray-300 text-sm">No campus requests found</p>
              <p className="text-gray-500 max-w-sm mx-auto">
                Submit a maintenance complaint, gate pass, bonafide, or leave application above.
              </p>
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

                  {/* Rejection notice if rejected */}
                  {r.status === 'REJECTED' && r.rejectionReason && (
                    <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-[11px] font-mono">
                      <strong>Rejection Reason:</strong> {r.rejectionReason}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 pt-1.5 border-t border-[#20293d]">
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin size={11} className="text-gray-500 shrink-0" />
                      <span className="truncate">{r.location || 'Campus'}</span>
                    </span>

                    {/* Gate Pass Action: Open Turnstile QR */}
                    {r.gatePass && ['APPROVED', 'DEPARTED'].includes(r.gatePass.gateStatus) && (
                      <button
                        type="button"
                        onClick={() => setSelectedGatePass(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-[11px] font-bold transition"
                      >
                        <QrCode size={12} />
                        <span>Pass PIN: {r.gatePass.passPin}</span>
                      </button>
                    )}
                  </div>
                </article>
              ))}

              {hasMoreRequests && (
                <button
                  type="button"
                  onClick={() => fetchRequests(true)}
                  disabled={loadingMore}
                  className="w-full py-2.5 rounded-xl bg-[#161b2a] hover:bg-[#1f273d] border border-[#27334d] text-xs text-gray-300 font-semibold transition"
                >
                  {loadingMore ? 'Loading older requests...' : 'Load More Requests'}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: COMPLAINT */}
      {tab === 'COMPLAINT' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3">
            <Wrench size={16} className="text-gold" />
            <h2 className="font-bold text-sm text-white">Log Maintenance Complaint</h2>
          </div>
          <form onSubmit={handleComplaint} className="space-y-3 text-xs">
            <div>
              <label htmlFor="complaint-title" className="block text-gray-300 font-semibold mb-1 text-[11px]">
                Issue Title <span className="text-gold">*</span>
              </label>
              <input
                id="complaint-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Washroom tap leaking heavily"
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-gold transition"
              />
            </div>
            <div>
              <label htmlFor="complaint-desc" className="block text-gray-300 font-semibold mb-1 text-[11px]">
                Detailed Description <span className="text-gold">*</span>
              </label>
              <textarea
                id="complaint-desc"
                required
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Specify exact location, symptoms, and urgency..."
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-gold transition resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !isOnline}
              className="w-full py-3 bg-gold hover:bg-[#c49f2e] text-black font-bold text-xs rounded-xl transition shadow active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Submitting...' : 'Submit Maintenance Ticket'}
            </button>
          </form>
        </section>
      )}

      {/* TAB 3: GATE PASS */}
      {tab === 'GATE_PASS' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3">
            <Key size={16} className="text-cyan-400" />
            <h2 className="font-bold text-sm text-white">Apply for Gate Pass</h2>
          </div>
          <form onSubmit={handleGatePass} className="space-y-3 text-xs">
            <div>
              <label htmlFor="gate-dest" className="block text-gray-300 font-semibold mb-1 text-[11px]">
                Destination <span className="text-cyan-400">*</span>
              </label>
              <input
                id="gate-dest"
                type="text"
                required
                value={gateDest}
                onChange={(e) => setGateDest(e.target.value)}
                placeholder="e.g. City Central Library"
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
            <div>
              <label htmlFor="gate-reason" className="block text-gray-300 font-semibold mb-1 text-[11px]">
                Reason for Exit <span className="text-cyan-400">*</span>
              </label>
              <textarea
                id="gate-reason"
                required
                rows={2}
                value={gateReason}
                onChange={(e) => setGateReason(e.target.value)}
                placeholder="e.g. Academic project research and reference materials..."
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 transition resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !isOnline}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl transition shadow active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Submitting...' : 'Submit Gate Pass for Warden Review'}
            </button>
          </form>
        </section>
      )}

      {/* TAB 4: BONAFIDE */}
      {tab === 'BONAFIDE' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3">
            <FileCheck size={16} className="text-emerald-400" />
            <h2 className="font-bold text-sm text-white">Request Bonafide Certificate</h2>
          </div>
          <form onSubmit={handleBonafide} className="space-y-3 text-xs">
            <div>
              <label htmlFor="bonafide-purpose" className="block text-gray-300 font-semibold mb-1 text-[11px]">
                Certificate Purpose <span className="text-emerald-400">*</span>
              </label>
              <select
                id="bonafide-purpose"
                value={bonafidePurpose}
                onChange={(e) => setBonafidePurpose(e.target.value)}
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400 transition"
              >
                <option value="Scholarship">Scholarship Application</option>
                <option value="Education Loan">Education Loan / Banking</option>
                <option value="Passport Application">Passport Verification</option>
                <option value="Internship">Internship NOC</option>
                <option value="Higher Studies">Higher Studies Admission</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting || !isOnline}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition shadow active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Submitting...' : 'Submit to Academic Affairs'}
            </button>
          </form>
        </section>
      )}

      {/* TAB 5: LEAVE */}
      {tab === 'LEAVE' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-[#232a3d] pb-3">
            <Calendar size={16} className="text-purple-400" />
            <h2 className="font-bold text-sm text-white">Hostel Leave Application</h2>
          </div>
          <form onSubmit={handleLeave} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="leave-start" className="block text-gray-300 font-semibold mb-1 text-[11px]">
                  Start Date <span className="text-purple-400">*</span>
                </label>
                <input
                  id="leave-start"
                  type="date"
                  required
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-400 transition"
                />
              </div>
              <div>
                <label htmlFor="leave-end" className="block text-gray-300 font-semibold mb-1 text-[11px]">
                  End Date <span className="text-purple-400">*</span>
                </label>
                <input
                  id="leave-end"
                  type="date"
                  required
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                  className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-400 transition"
                />
              </div>
            </div>
            <div>
              <label htmlFor="leave-reason" className="block text-gray-300 font-semibold mb-1 text-[11px]">
                Reason for Leave <span className="text-purple-400">*</span>
              </label>
              <textarea
                id="leave-reason"
                required
                rows={2}
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="e.g. Family festival travel to home city..."
                className="w-full bg-[#161b2a] border border-[#28344d] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-400 transition resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !isOnline}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition shadow active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Submitting...' : 'Submit Leave to Warden'}
            </button>
          </form>
        </section>
      )}

      {/* TAB 6: NOTICES */}
      {tab === 'NOTICES' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#232a3d] pb-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gold" />
              <h2 className="font-bold text-sm text-white">Campus Circulars &amp; Notices</h2>
            </div>
            <span className="text-xs font-mono text-gray-400">{notices.length} active</span>
          </div>

          {noticesError ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-center text-xs text-rose-300">
              {noticesError}
            </div>
          ) : loadingNotices ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] h-16 animate-pulse" />
              ))}
            </div>
          ) : notices.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No active circulars.</div>
          ) : (
            <div className="space-y-2.5">
              {notices.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-xs">{n.title}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(n.publishedAt || n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Gate Pass Turnstile Modal */}
      {selectedGatePass && selectedGatePass.gatePass && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedGatePass(null)}
        >
          <div
            className="bg-[#101726] border-2 border-cyan-500/80 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-4 text-center my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#212f47] pb-2.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                <ShieldCheck size={16} />
                <span>Turnstile Clearance</span>
              </div>
              <button
                ref={modalCloseRef}
                type="button"
                onClick={() => setSelectedGatePass(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-[#19243a] border border-[#2c3d5d]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* QR Code Presentation */}
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

            {/* Offline PIN */}
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
                className="p-2 rounded-lg bg-[#1f304e] hover:bg-[#283f66] text-cyan-300"
                title="Copy PIN"
              >
                {copiedPin ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedGatePass(null)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
