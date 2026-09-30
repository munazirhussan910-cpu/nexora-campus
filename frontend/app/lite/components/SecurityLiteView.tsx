'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
  Shield,
  Key,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  User,
  MapPin,
  Clock,
  RotateCw,
  Activity,
  Users,
} from 'lucide-react';

interface SecurityLiteViewProps {
  currentUser: any;
  isOnline: boolean;
  setMsg: (msg: { type: 'info' | 'success' | 'error'; text: string } | null) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function SecurityLiteView({
  currentUser,
  isOnline,
  setMsg,
  getStatusBadge,
}: SecurityLiteViewProps) {
  const [method, setMethod] = useState<'PIN' | 'QR'>('PIN');
  const [inputVal, setInputVal] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Departed students roster
  const [activeDepartures, setActiveDepartures] = useState<any[]>([]);
  const [loadingDepartures, setLoadingDepartures] = useState(false);

  const fetchDepartures = async (bypassCache = false) => {
    setLoadingDepartures(true);
    try {
      const res = await apiRequest('/requests?type=GATE_PASS&status=DEPARTED', {
        useCache: !bypassCache,
      });
      if (res.success && Array.isArray(res.data)) {
        setActiveDepartures(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingDepartures(false);
    }
  };

  useEffect(() => {
    fetchDepartures(false);
  }, []);

  const executeVerification = async (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;

    setVerifying(true);
    setVerifyResult(null);
    setErrorMsg('');
    setActionSuccess('');

    const res = await apiRequest('/gate-passes/verify', {
      method: 'POST',
      body: JSON.stringify({ tokenOrPin: trimmed }),
    });

    if (res.data) {
      setVerifyResult(res.data);
      if (!res.data.valid) {
        setErrorMsg(res.data.message || 'Verification rejected by gate system.');
      }
    } else {
      setErrorMsg(res.error?.message || 'Verification failed. Server unreachable.');
    }
    setVerifying(false);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeVerification(inputVal);
  };

  const handleDepart = async () => {
    if (!verifyResult?.gatePass?.id) return;
    setActionLoading(true);
    const res = await apiRequest(`/gate-passes/${verifyResult.gatePass.id}/depart`, {
      method: 'POST',
      body: JSON.stringify({ verificationMethod: method, notes: 'Main Gate Departure' }),
    });

    if (res.success) {
      setActionSuccess('Student DEPARTURE registered! Turnstile cleared.');
      executeVerification(inputVal);
      fetchDepartures(true);
    } else {
      setErrorMsg(res.error?.message || 'Failed to register departure.');
    }
    setActionLoading(false);
  };

  const handleReturn = async () => {
    if (!verifyResult?.gatePass?.id) return;
    setActionLoading(true);
    const res = await apiRequest(`/gate-passes/${verifyResult.gatePass.id}/return`, {
      method: 'POST',
      body: JSON.stringify({ verificationMethod: method, notes: 'Main Gate Return' }),
    });

    if (res.success) {
      setActionSuccess('Student RETURN registered! Gate pass closed.');
      executeVerification(inputVal);
      fetchDepartures(true);
    } else {
      setErrorMsg(res.error?.message || 'Failed to register return.');
    }
    setActionLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* 4 Security KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Students Outside</span>
          <span className="font-mono text-lg font-bold text-cyan-400 block">{activeDepartures.length}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Turnstile Status</span>
          <span className="font-mono text-sm font-bold text-emerald-400 block mt-1">HMAC ONLINE</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Standard Curfew</span>
          <span className="font-mono text-sm font-bold text-purple-400 block mt-1">10:00 PM</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Duty Post</span>
          <span className="font-mono text-sm font-bold text-gold block mt-1">GATE 1</span>
        </div>
      </div>

      {/* Mode Selector Buttons */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">
        <button
          type="button"
          onClick={() => { setMethod('PIN'); setInputVal(''); setVerifyResult(null); }}
          className={`py-3 px-2 rounded-xl border flex items-center justify-center gap-2 transition min-h-[48px] active:scale-[0.98] ${
            method === 'PIN'
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/40'
              : 'bg-[#121622] border-[#232a3d] text-gray-400 hover:text-white'
          }`}
        >
          <Key size={16} className={method === 'PIN' ? 'text-cyan-400' : 'text-gray-500'} />
          <span>ENTER 4-DIGIT PIN</span>
        </button>
        <button
          type="button"
          onClick={() => { setMethod('QR'); setInputVal(''); setVerifyResult(null); }}
          className={`py-3 px-2 rounded-xl border flex items-center justify-center gap-2 transition min-h-[48px] active:scale-[0.98] ${
            method === 'QR'
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/40'
              : 'bg-[#121622] border-[#232a3d] text-gray-400 hover:text-white'
          }`}
        >
          <QrCode size={16} className={method === 'QR' ? 'text-cyan-400' : 'text-gray-500'} />
          <span>SCAN / PASTE QR</span>
        </button>
      </div>

      {/* Verification Scanner Form Card */}
      <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
        <form onSubmit={handleVerifySubmit} className="space-y-3">
          <label className="block text-[11px] font-mono font-bold text-gray-300 uppercase">
            {method === 'PIN' ? 'Student Offline 4-Digit PIN' : 'Optical / Dynamic QR Token Hash'}
          </label>

          <div className="flex gap-2">
            <input
              type={method === 'PIN' ? 'tel' : 'text'}
              required
              maxLength={method === 'PIN' ? 6 : 256}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={method === 'PIN' ? 'e.g. 7392' : 'Paste token string...'}
              className="flex-1 bg-[#161a29] border-2 border-[#2b354d] rounded-xl px-4 py-2.5 text-center text-xl font-mono font-black text-white focus:outline-none focus:border-cyan-400 tracking-widest transition"
              autoFocus
            />

            <button
              type="submit"
              disabled={verifying || !inputVal.trim()}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition shadow active:scale-95 disabled:opacity-50 shrink-0 min-h-[44px]"
            >
              {verifying ? 'CHECKING...' : 'VERIFY'}
            </button>
          </div>

          {/* Quick Demo Presets */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-400 flex-wrap">
            <span className="text-gray-500 font-mono text-[10px]">PRESETS:</span>
            <button
              type="button"
              onClick={() => { setMethod('PIN'); setInputVal('7392'); executeVerification('7392'); }}
              className="px-2 py-1 rounded-lg bg-[#182030] text-cyan-300 hover:bg-[#202c42] font-mono text-[10px] border border-[#26334a]"
            >
              PIN 7392 (Aryan - Approved)
            </button>
            <button
              type="button"
              onClick={() => { setMethod('PIN'); setInputVal('4821'); executeVerification('4821'); }}
              className="px-2 py-1 rounded-lg bg-[#182030] text-amber-300 hover:bg-[#202c42] font-mono text-[10px] border border-[#26334a]"
            >
              PIN 4821 (Pending)
            </button>
          </div>
        </form>

        {actionSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span className="font-bold">{actionSuccess}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-700 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Verification Result Display */}
        {verifyResult && (
          <div className="pt-2 border-t border-[#20293d] space-y-3">
            {verifyResult.valid ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-600 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 size={16} />
                    <span>✓ PASS IS VALID &amp; AUTHORIZED</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-200">
                    {verifyResult.gatePass?.gateStatus}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Student:</span>
                    <strong className="text-white">{verifyResult.student?.fullName} ({verifyResult.student?.rollNumber})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Destination:</span>
                    <span className="text-cyan-300 font-medium">{verifyResult.gatePass?.destination}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-gray-400">Return By:</span>
                    <strong className="text-[#d4af37]">
                      {new Date(verifyResult.gatePass?.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                </div>

                {/* Direct Gate Action Buttons */}
                <div className="pt-1">
                  {verifyResult.gatePass?.gateStatus === 'APPROVED' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleDepart}
                      className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition shadow active:scale-[0.98] min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ArrowRight size={16} />
                      <span>MARK STUDENT DEPARTED (CLEAR GATE)</span>
                    </button>
                  )}

                  {verifyResult.gatePass?.gateStatus === 'DEPARTED' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleReturn}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition shadow active:scale-[0.98] min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      <span>MARK STUDENT RETURNED (CLOSE PASS)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-700/80 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <XCircle size={16} />
                  <span>✕ VERIFICATION FAILED: {verifyResult.status || 'INVALID'}</span>
                </div>
                <p className="text-xs text-rose-200">
                  {verifyResult.message || 'Pass credentials could not be verified against the active register.'}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Departed Students List */}
      <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#232a3d] pb-2.5">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-cyan-400" />
            <h2 className="font-bold text-sm text-white">Students Currently Off-Campus ({activeDepartures.length})</h2>
          </div>
          <button
            type="button"
            onClick={() => fetchDepartures(true)}
            disabled={loadingDepartures}
            className="p-1 rounded-lg bg-[#181f2f] text-gray-300"
          >
            <RotateCw size={12} className={loadingDepartures ? 'animate-spin text-cyan-400' : ''} />
          </button>
        </div>

        {activeDepartures.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">No students currently outside campus perimeter.</div>
        ) : (
          <div className="space-y-2">
            {activeDepartures.map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-white text-xs">{d.requester?.student?.fullName || d.requester?.username}</div>
                  <div className="text-[11px] text-gray-400">
                    To: {d.gatePass?.destination || 'City'} • PIN: <strong className="text-cyan-300 font-mono">{d.gatePass?.passPin}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMethod('PIN');
                    setInputVal(d.gatePass?.passPin || '');
                    executeVerification(d.gatePass?.passPin || '');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-[11px] shrink-0 active:scale-95"
                >
                  Log Return
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
