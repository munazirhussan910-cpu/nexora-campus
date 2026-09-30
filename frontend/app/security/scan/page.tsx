'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { QrCameraScanner } from '@/components/scanner/QrCameraScanner';
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
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

function SecurityScanContent() {
  const searchParams = useSearchParams();
  const prefillPin = searchParams.get('pin') || '';
  const { user } = useAuth();

  const [inputVal, setInputVal] = useState(prefillPin);
  const [method, setMethod] = useState<'PIN' | 'QR'>(prefillPin ? 'PIN' : 'QR');
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [lastVerificationMethod, setLastVerificationMethod] = useState<'QR_SCAN' | 'PIN'>('QR_SCAN');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (prefillPin) {
      setInputVal(prefillPin);
      setMethod('PIN');
      executeVerification(prefillPin, 'PIN');
    }
  }, [prefillPin]);

  const executeVerification = async (valToVerify: string, verificationMethod?: 'QR_SCAN' | 'PIN') => {
    if (!valToVerify.trim()) return;

    const usedMethod = verificationMethod || (method === 'QR' ? 'QR_SCAN' : 'PIN');
    setLastVerificationMethod(usedMethod);
    setVerifying(true);
    setVerifyResult(null);
    setErrorMsg('');
    setActionSuccess('');

    const res = await apiRequest('/gate-passes/verify', {
      method: 'POST',
      body: JSON.stringify({
        tokenOrPin: valToVerify.trim(),
        verificationMethod: usedMethod,
      }),
    });

    if (res.data) {
      setVerifyResult(res.data);
      if (!res.data.valid) {
        setErrorMsg(res.data.message);
      }
    } else {
      setErrorMsg(res.error?.message || 'Verification request failed. Server unreachable.');
    }
    setVerifying(false);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    executeVerification(inputVal, method === 'PIN' ? 'PIN' : 'QR_SCAN');
  };

  const handleCameraScan = (scannedToken: string) => {
    if (verifying || actionLoading) return;
    setInputVal(scannedToken);
    executeVerification(scannedToken, 'QR_SCAN');
  };

  const handleDepart = async () => {
    if (!verifyResult?.gatePass?.id) return;
    setActionLoading(true);
    setErrorMsg('');
    const res = await apiRequest(`/gate-passes/${verifyResult.gatePass.id}/depart`, {
      method: 'POST',
      body: JSON.stringify({
        verificationMethod: lastVerificationMethod,
        notes: `Main Gate Departure verified by ${user?.fullName || user?.username || 'Security'}`,
      }),
    });

    if (res.success) {
      setActionSuccess('Student DEPARTURE successfully registered! Turnstile cleared for exit.');
      // Refresh verification status to show updated DEPARTED state
      executeVerification(inputVal, lastVerificationMethod);
    } else {
      setErrorMsg(res.error?.message || 'Failed to register departure');
    }
    setActionLoading(false);
  };

  const handleReturn = async () => {
    if (!verifyResult?.gatePass?.id) return;
    setActionLoading(true);
    setErrorMsg('');
    const res = await apiRequest(`/gate-passes/${verifyResult.gatePass.id}/return`, {
      method: 'POST',
      body: JSON.stringify({
        verificationMethod: lastVerificationMethod,
        notes: `Main Gate Return verified by ${user?.fullName || user?.username || 'Security'}`,
      }),
    });

    if (res.success) {
      setActionSuccess('Student RETURN successfully registered! Gate pass marked as closed.');
      // Refresh verification status to reflect RETURNED state
      executeVerification(inputVal, lastVerificationMethod);
    } else {
      setErrorMsg(res.error?.message || 'Failed to register return');
    }
    setActionLoading(false);
  };

  const handleResetForNextScan = () => {
    setVerifyResult(null);
    setInputVal('');
    setErrorMsg('');
    setActionSuccess('');
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
          Scan dynamic HMAC QR tokens via camera or enter offline 4-digit student PINs to log departures and arrivals.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setMethod('QR');
            handleResetForNextScan();
          }}
          className={`py-3.5 sm:py-4 px-3 rounded-2xl border text-center font-bold text-xs sm:text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1.5 active:scale-95 ${
            method === 'QR'
              ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40'
              : 'bg-[#121624] border-[#232b3f] text-gray-400 hover:text-white hover:bg-[#161c2d]'
          }`}
        >
          <QrCode size={22} className={method === 'QR' ? 'text-cyan-400' : 'text-gray-500'} />
          <span className="tracking-wide uppercase font-mono">Scan QR Code</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMethod('PIN');
            handleResetForNextScan();
          }}
          className={`py-3.5 sm:py-4 px-3 rounded-2xl border text-center font-bold text-xs sm:text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1.5 active:scale-95 ${
            method === 'PIN'
              ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40'
              : 'bg-[#121624] border-[#232b3f] text-gray-400 hover:text-white hover:bg-[#161c2d]'
          }`}
        >
          <Key size={22} className={method === 'PIN' ? 'text-cyan-400' : 'text-gray-500'} />
          <span className="tracking-wide uppercase font-mono">Enter 4-Digit PIN</span>
        </button>
      </div>

      {/* Interactive Verification Section */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/20 space-y-5">
        {/* MODE 1: Camera QR Scanner */}
        {method === 'QR' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider font-mono text-cyan-300">
                Live Camera QR Scanner
              </label>
              {verifyResult && (
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-mono transition"
                >
                  <RotateCcw size={12} />
                  <span>Scan Next Pass</span>
                </button>
              )}
            </div>

            {/* Embedded Native Camera Scanner */}
            <QrCameraScanner
              onScan={handleCameraScan}
              isPaused={verifying || !!verifyResult}
              onSwitchToPin={() => {
                setMethod('PIN');
                handleResetForNextScan();
              }}
            />

            {/* Secondary Manual Token Fallback */}
            <div className="pt-2 border-t border-[#1f2738]">
              <button
                type="button"
                onClick={() => setShowManualPaste((prev) => !prev)}
                className="text-[11px] text-gray-400 hover:text-cyan-300 font-mono flex items-center gap-1.5 transition"
              >
                {showManualPaste ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                <span>Paste or type QR token manually</span>
              </button>

              {showManualPaste && (
                <form onSubmit={handleVerify} className="mt-3 space-y-2 animate-tab-fade">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      placeholder="Paste scanned token hash (NX-GP-...)..."
                      className="flex-1 bg-[#161a29] border border-[#2b354d] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      disabled={verifying || !inputVal.trim()}
                      className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      {verifying ? 'CHECKING...' : 'VERIFY'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: 4-Digit PIN Fallback */}
        {method === 'PIN' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider font-mono text-gray-300">
              Enter Student 4-Digit Pass PIN
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="tel"
                required
                maxLength={6}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. 7392"
                className="flex-1 bg-[#161a29] border-2 border-[#2b354d] rounded-xl px-4 py-3.5 text-center text-xl sm:text-2xl font-mono font-extrabold text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 tracking-widest transition"
                autoFocus
              />

              <button
                type="submit"
                disabled={verifying || !inputVal.trim()}
                className="py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm shadow-md shadow-cyan-950/30 transition active:scale-95 disabled:opacity-50 shrink-0"
              >
                {verifying ? 'CHECKING...' : 'VERIFY PIN'}
              </button>
            </div>

            {/* Quick Demo Buttons for PIN Testing */}
            <div className="flex items-center gap-2 pt-1 text-xs text-gray-400 flex-wrap">
              <span className="text-gray-500 text-[10px] font-mono uppercase">Quick Demo:</span>
              <button
                type="button"
                onClick={() => {
                  setInputVal('7392');
                  executeVerification('7392', 'PIN');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#182030] hover:text-cyan-300 font-mono text-[11px] border border-[#26334a] transition"
              >
                PIN 7392 (Aryan - Ready)
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputVal('4821');
                  executeVerification('4821', 'PIN');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#182030] hover:text-cyan-300 font-mono text-[11px] border border-[#26334a] transition"
              >
                PIN 4821 (Pending Approval)
              </button>
            </div>
          </form>
        )}

        {/* Action Status Messages */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm animate-tab-fade">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <span className="font-bold">{actionSuccess}</span>
          </div>
        )}

        {errorMsg && !verifyResult && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-700 text-rose-300 text-xs flex items-center gap-2.5 shadow-sm animate-tab-fade">
            <AlertTriangle size={18} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Verification Result Panel */}
        {verifyResult && (
          <div className="mt-4 pt-5 border-t border-[#21273a] space-y-4 animate-tab-fade">
            {verifyResult.valid ? (
              <div className="p-5 sm:p-6 rounded-2xl bg-emerald-950/40 border border-emerald-600/70 space-y-4 shadow-xl">
                {/* Header Badge & Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-700/40 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm sm:text-base tracking-tight">
                    <CheckCircle2 size={20} />
                    <span>✓ PASS VERIFIED</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-900/90 text-emerald-200 border border-emerald-600/60 w-fit">
                    STATUS: {verifyResult.gatePass?.gateStatus || 'APPROVED'}
                  </span>
                </div>

                {/* Structured Student & Pass Details */}
                <div className="bg-[#121622] p-4 sm:p-5 rounded-xl border border-[#232c3f] space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-[#1c2436] pb-2">
                    <span className="text-gray-400">Student:</span>
                    <span className="font-bold text-white text-sm">{verifyResult.student?.fullName || 'Aryan Khan'}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#1c2436] pb-2 font-mono">
                    <span className="text-gray-400">Roll Number:</span>
                    <span className="font-bold text-cyan-300 text-sm">{verifyResult.student?.rollNumber}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#1c2436] pb-2 font-mono">
                    <span className="text-gray-400">Pass ID:</span>
                    <span className="font-bold text-white">
                      {verifyResult.gatePass?.request?.requestNumber || verifyResult.gatePass?.id?.slice(0, 8)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#1c2436] pb-2">
                    <span className="text-gray-400">Hostel Allocation:</span>
                    <span className="text-gray-200">
                      {verifyResult.student?.hostelRoom?.hostelBlock?.name || 'Block B'} / Room{' '}
                      {verifyResult.student?.hostelRoom?.roomNumber || '204'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#1c2436] pb-2">
                    <span className="text-gray-400">Destination:</span>
                    <span className="font-bold text-white">{verifyResult.gatePass?.destination}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#1c2436] pb-2">
                    <span className="text-gray-400">Reason:</span>
                    <span className="text-gray-300">{verifyResult.gatePass?.reason}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#1c2436] pb-2 font-mono">
                    <span className="text-gray-400">Valid Until:</span>
                    <span className="text-[#d4af37] font-bold text-sm">
                      {new Date(
                        verifyResult.gatePass?.qrExpiresAt || verifyResult.gatePass?.expectedReturnTime
                      ).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#1c2436] pb-2">
                    <span className="text-gray-400">Verification Method:</span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-[#1a2336] text-cyan-300 border border-cyan-800/60">
                      {lastVerificationMethod === 'QR_SCAN' ? 'QR SCAN' : '4-DIGIT PIN'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Security Officer:</span>
                    <span className="text-gray-200 font-semibold">
                      {user?.fullName || user?.username || 'Security Guard (Main Gate)'}
                    </span>
                  </div>
                </div>

                {/* Turnstile Gate Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  {verifyResult.gatePass?.gateStatus === 'APPROVED' && (
                    <button
                      type="button"
                      onClick={handleDepart}
                      disabled={actionLoading}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs sm:text-sm shadow-xl transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <ArrowRight size={18} />
                      <span>{actionLoading ? 'PROCESSING...' : 'ALLOW EXIT (MARK DEPARTED)'}</span>
                    </button>
                  )}

                  {verifyResult.gatePass?.gateStatus === 'DEPARTED' && (
                    <button
                      type="button"
                      onClick={handleReturn}
                      disabled={actionLoading}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm shadow-xl transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle2 size={18} />
                      <span>{actionLoading ? 'PROCESSING...' : 'ALLOW ENTRY (MARK RETURNED)'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetForNextScan}
                    disabled={actionLoading}
                    className="py-3.5 px-5 rounded-xl bg-[#171f30] hover:bg-[#202b42] border border-[#2b374f] text-gray-300 font-bold text-xs sm:text-sm transition active:scale-95 disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={16} />
                    <span>Cancel / Scan Another</span>
                  </button>
                </div>
              </div>
            ) : (
              /* FAILED SCAN / INVALID QR ERROR SCREEN */
              <div className="p-5 sm:p-6 rounded-2xl bg-rose-950/40 border border-rose-700/80 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm sm:text-base border-b border-rose-800/40 pb-3">
                  <XCircle size={22} className="shrink-0 text-rose-500" />
                  <span>
                    {verifyResult.status === 'EXPIRED'
                      ? '✕ GATE PASS EXPIRED'
                      : verifyResult.status === 'ALREADY_USED'
                      ? '✕ GATE PASS ALREADY COMPLETED'
                      : '✕ INVALID QR CODE'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-rose-200 leading-relaxed">
                  {verifyResult.message || 'This QR token could not be verified against the active security ledger.'}
                </p>

                {verifyResult.student && (
                  <div className="text-xs text-gray-300 font-mono bg-[#141016] p-3 rounded-xl border border-rose-900/60">
                    <div>
                      Student on record: <strong className="text-white">{verifyResult.student.fullName}</strong> ({verifyResult.student.rollNumber})
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleResetForNextScan}
                    className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={15} />
                    <span>Scan Again</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMethod('PIN');
                      handleResetForNextScan();
                    }}
                    className="py-3 px-4 rounded-xl bg-[#1a2133] hover:bg-[#232c45] border border-[#2e3a59] text-gray-300 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Key size={15} className="text-cyan-400" />
                    <span>Switch to PIN Mode</span>
                  </button>
                </div>
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
