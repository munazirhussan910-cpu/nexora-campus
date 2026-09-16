'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import {
  QrCode,
  Key,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  User,
  MapPin,
  Shield,
  Sparkles,
} from 'lucide-react';

function SecurityScanContent() {
  const searchParams = useSearchParams();
  const prefillPin = searchParams.get('pin') || '';

  const [inputVal, setInputVal] = useState(prefillPin);
  const [method, setMethod] = useState<'PIN' | 'QR'>('PIN');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (prefillPin) {
      setInputVal(prefillPin);
      executeVerification(prefillPin);
    }
  }, [prefillPin]);

  const executeVerification = async (valToVerify: string) => {
    if (!valToVerify.trim()) return;

    setVerifying(true);
    setVerifyResult(null);
    setErrorMsg('');
    setActionSuccess('');

    const res = await apiRequest('/gate-passes/verify', {
      method: 'POST',
      body: JSON.stringify({ tokenOrPin: valToVerify.trim() }),
    });

    if (res.data) {
      setVerifyResult(res.data);
      if (!res.data.valid) {
        setErrorMsg(res.data.message);
      }
    } else {
      setErrorMsg(res.error?.message || 'Verification request failed');
    }
    setVerifying(false);
  };

  const handleVerify = (e: React.FormEvent) => {
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
      setActionSuccess('Student DEPARTURE successfully registered! Turnstile cleared.');
      executeVerification(inputVal);
    } else {
      setErrorMsg(res.error?.message || 'Failed to register departure');
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
      setActionSuccess('Student RETURN successfully registered! Pass marked as closed.');
      executeVerification(inputVal);
    } else {
      setErrorMsg(res.error?.message || 'Failed to register return');
    }
    setActionLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-cyan-500/35 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 shadow-xs">
          <Shield size={12} />
          <span>Optical Turnstile &amp; Manual Verification</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          Main Gate Clearance Scanner
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Scan dynamic HMAC QR tokens or enter offline 4-digit student PINs to log departures and arrivals.
        </p>
      </div>

      {/* Touch Mode Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => { setMethod('PIN'); setInputVal(''); }}
          className={`py-4 sm:py-5 px-3 rounded-2xl border text-center font-bold text-xs sm:text-sm transition-all duration-150 flex flex-col items-center justify-center gap-2 active:scale-95 ${
            method === 'PIN'
              ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40'
              : 'bg-[#121624] border-[#232b3f] text-gray-400 hover:text-white hover:bg-[#161c2d]'
          }`}
        >
          <Key size={22} className={method === 'PIN' ? 'text-cyan-400' : 'text-gray-500'} />
          <span className="tracking-wide uppercase font-mono">Enter 4-Digit PIN</span>
        </button>

        <button
          type="button"
          onClick={() => { setMethod('QR'); setInputVal(''); }}
          className={`py-4 sm:py-5 px-3 rounded-2xl border text-center font-bold text-xs sm:text-sm transition-all duration-150 flex flex-col items-center justify-center gap-2 active:scale-95 ${
            method === 'QR'
              ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40'
              : 'bg-[#121624] border-[#232b3f] text-gray-400 hover:text-white hover:bg-[#161c2d]'
          }`}
        >
          <QrCode size={22} className={method === 'QR' ? 'text-cyan-400' : 'text-gray-500'} />
          <span className="tracking-wide uppercase font-mono">Scan / Paste QR Token</span>
        </button>
      </div>

      {/* Verification Form Card */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/20 space-y-4">
        <form onSubmit={handleVerify} className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider font-mono text-gray-300">
            {method === 'PIN' ? 'Enter Student 4-Digit Pass PIN' : 'Enter or Scan Cryptographic QR Token'}
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type={method === 'PIN' ? 'tel' : 'text'}
              required
              maxLength={method === 'PIN' ? 6 : 256}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={method === 'PIN' ? 'e.g. 7392' : 'Paste scanned token hash...'}
              className="flex-1 bg-[#161a29] border-2 border-[#2b354d] rounded-xl px-4 py-3.5 text-center text-xl sm:text-2xl font-mono font-extrabold text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 tracking-widest transition"
              autoFocus
            />

            <button
              type="submit"
              disabled={verifying || !inputVal.trim()}
              className="py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm shadow-md shadow-cyan-950/30 transition active:scale-95 disabled:opacity-50 shrink-0"
            >
              {verifying ? 'CHECKING...' : 'VERIFY PASS'}
            </button>
          </div>

          {/* Quick Preset Buttons for Demo */}
          <div className="flex items-center gap-2 pt-1 text-xs text-gray-400 flex-wrap">
            <span className="text-gray-500 text-[10px] font-mono uppercase">Quick Demo:</span>
            <button
              type="button"
              onClick={() => { setMethod('PIN'); setInputVal('7392'); executeVerification('7392'); }}
              className="px-2.5 py-1 rounded-lg bg-[#182030] hover:text-cyan-300 font-mono text-[11px] border border-[#26334a] transition"
            >
              PIN 7392 (Aryan - Ready)
            </button>
            <button
              type="button"
              onClick={() => { setMethod('PIN'); setInputVal('4821'); executeVerification('4821'); }}
              className="px-2.5 py-1 rounded-lg bg-[#182030] hover:text-cyan-300 font-mono text-[11px] border border-[#26334a] transition"
            >
              PIN 4821 (Pending Approval)
            </button>
          </div>
        </form>

        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm animate-tab-fade">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <span className="font-bold">{actionSuccess}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-700 text-rose-300 text-xs flex items-center gap-2.5 shadow-sm animate-tab-fade">
            <AlertTriangle size={18} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Verification Result Panel */}
        {verifyResult && (
          <div className="mt-6 pt-6 border-t border-[#21273a] space-y-4 animate-tab-fade">
            {verifyResult.valid ? (
              <div className="p-5 sm:p-6 rounded-2xl bg-emerald-950/40 border border-emerald-600/70 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-700/40 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm tracking-tight">
                    <CheckCircle2 size={20} />
                    <span>GATE PASS IS VALID &amp; AUTHORIZED</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-900 text-emerald-200 w-fit">
                    GATE STATUS: {verifyResult.gatePass?.gateStatus}
                  </span>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-[#232c3f] space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Student Name:</span>
                    <span className="font-bold text-white text-sm">{verifyResult.student?.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-gray-400">Roll Number:</span>
                    <span className="font-bold text-cyan-300">{verifyResult.student?.rollNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Hostel Allocation:</span>
                    <span className="text-gray-200">
                      {verifyResult.student?.hostelRoom?.hostelBlock?.name || 'Block B'} / Room {verifyResult.student?.hostelRoom?.roomNumber || '204'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Destination:</span>
                    <span className="font-bold text-white">{verifyResult.gatePass?.destination}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Reason:</span>
                    <span className="text-gray-300">{verifyResult.gatePass?.reason}</span>
                  </div>
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-gray-400">Return By:</span>
                    <span className="text-[#d4af37] font-bold text-sm">
                      {new Date(verifyResult.gatePass?.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Gate Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  {verifyResult.gatePass?.gateStatus === 'APPROVED' && (
                    <button
                      type="button"
                      onClick={handleDepart}
                      disabled={actionLoading}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm shadow-xl transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <ArrowRight size={18} />
                      <span>MARK STUDENT DEPARTED (CLEAR GATE)</span>
                    </button>
                  )}

                  {verifyResult.gatePass?.gateStatus === 'DEPARTED' && (
                    <button
                      type="button"
                      onClick={handleReturn}
                      disabled={actionLoading}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle2 size={18} />
                      <span>MARK STUDENT RETURNED (CLOSE PASS)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-700/80 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <XCircle size={20} />
                  <span>PASS VERIFICATION FAILED: {verifyResult.status || 'INVALID'}</span>
                </div>
                <p className="text-xs text-rose-200 leading-relaxed">
                  {verifyResult.message || 'Pass credentials could not be verified against the active ledger.'}
                </p>
                {verifyResult.student && (
                  <div className="text-[11px] text-gray-400 font-mono pt-1 border-t border-rose-800/40">
                    Student on record: {verifyResult.student.fullName} ({verifyResult.student.rollNumber})
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SecurityScanPage() {
  return (
    <Suspense fallback={<div className="text-center py-24 text-xs text-gray-500">Loading gate scanner...</div>}>
      <SecurityScanContent />
    </Suspense>
  );
}
