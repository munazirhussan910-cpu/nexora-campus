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
      setActionSuccess('Student DEPARTURE successfully registered! Gate cleared.');
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Main Gate Pass Verification</h1>
        <p className="text-xs text-gray-400">
          Verify encrypted QR codes or numeric 4-digit PINs. Mark departures and return arrivals.
        </p>
      </div>

      {/* Large Touch Mode Toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setMethod('PIN'); setInputVal(''); }}
          className={`py-4 rounded-2xl border text-center font-bold text-sm transition flex flex-col items-center justify-center gap-1.5 ${
            method === 'PIN'
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-xl'
              : 'bg-[#141722] border-[#282f42] text-gray-400 hover:text-white'
          }`}
        >
          <Key size={22} className={method === 'PIN' ? 'text-cyan-400' : 'text-gray-500'} />
          <span>ENTER 4-DIGIT PIN</span>
        </button>

        <button
          onClick={() => { setMethod('QR'); setInputVal(''); }}
          className={`py-4 rounded-2xl border text-center font-bold text-sm transition flex flex-col items-center justify-center gap-1.5 ${
            method === 'QR'
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-xl'
              : 'bg-[#141722] border-[#282f42] text-gray-400 hover:text-white'
          }`}
        >
          <QrCode size={22} className={method === 'QR' ? 'text-cyan-400' : 'text-gray-500'} />
          <span>SCAN / PASTE QR TOKEN</span>
        </button>
      </div>

      {/* Large Input Form */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 sm:p-8 shadow-2xl">
        <form onSubmit={handleVerify} className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
            {method === 'PIN' ? 'Enter Student 4-Digit Pass PIN' : 'Enter or Scan Cryptographic QR Token'}
          </label>

          <div className="flex gap-3">
            <input
              type={method === 'PIN' ? 'tel' : 'text'}
              required
              maxLength={method === 'PIN' ? 6 : 256}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={method === 'PIN' ? 'e.g. 4821 or 7392' : 'Paste scanned token payload...'}
              className="flex-1 bg-[#1a2030] border-2 border-[#2e374d] rounded-xl px-4 py-3.5 text-center text-xl sm:text-2xl font-mono font-bold text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 tracking-widest"
              autoFocus
            />

            <button
              type="submit"
              disabled={verifying || !inputVal.trim()}
              className="px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm shadow-lg transition disabled:opacity-50"
            >
              {verifying ? 'Checking...' : 'VERIFY'}
            </button>
          </div>

          {/* Quick preset PIN buttons for judging demo */}
          <div className="flex items-center gap-2 pt-1 text-xs text-gray-400">
            <span className="text-gray-500">Quick Demo PINs:</span>
            <button
              type="button"
              onClick={() => { setMethod('PIN'); setInputVal('7392'); executeVerification('7392'); }}
              className="px-2.5 py-1 rounded bg-[#1c2233] hover:text-cyan-300 font-mono border border-[#28324a]"
            >
              PIN 7392 (Aryan - Ready)
            </button>
            <button
              type="button"
              onClick={() => { setMethod('PIN'); setInputVal('4821'); executeVerification('4821'); }}
              className="px-2.5 py-1 rounded bg-[#1c2233] hover:text-cyan-300 font-mono border border-[#28324a]"
            >
              PIN 4821 (Pending Approval)
            </button>
          </div>
        </form>

        {actionSuccess && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <span className="font-bold">{actionSuccess}</span>
          </div>
        )}

        {/* Verification Result Panel */}
        {verifyResult && (
          <div className="mt-6 pt-6 border-t border-[#282f42] space-y-4">
            {verifyResult.valid ? (
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-600/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                    <CheckCircle2 size={20} />
                    <span>GATE PASS IS VALID &amp; AUTHORIZED</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-900 text-emerald-200">
                    STATUS: {verifyResult.gatePass?.gateStatus}
                  </span>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-[#232c3f] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Student Name:</span>
                    <span className="font-bold text-gray-100">{verifyResult.student?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Roll Number:</span>
                    <span className="font-mono font-bold text-cyan-300">{verifyResult.student?.rollNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hostel Allocation:</span>
                    <span className="text-gray-200">
                      {verifyResult.student?.hostelRoom?.hostelBlock?.name || 'Block B'} / Room {verifyResult.student?.hostelRoom?.roomNumber || '204'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Destination:</span>
                    <span className="font-bold text-gray-100">{verifyResult.gatePass?.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reason:</span>
                    <span className="text-gray-300">{verifyResult.gatePass?.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Return By:</span>
                    <span className="font-mono text-gray-200 font-semibold">
                      {new Date(verifyResult.gatePass?.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Gate Action Buttons */}
                <div className="pt-2 flex gap-3">
                  {verifyResult.gatePass?.gateStatus === 'APPROVED' && (
                    <button
                      onClick={handleDepart}
                      disabled={actionLoading}
                      className="flex-1 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm shadow-xl transition flex items-center justify-center gap-2"
                    >
                      <ArrowRight size={18} />
                      <span>MARK STUDENT DEPARTED</span>
                    </button>
                  )}

                  {verifyResult.gatePass?.gateStatus === 'DEPARTED' && (
                    <button
                      onClick={handleReturn}
                      disabled={actionLoading}
                      className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-xl transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      <span>MARK STUDENT RETURNED (CLOSE PASS)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-700 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <XCircle size={20} />
                  <span>PASS VERIFICATION FAILED: {verifyResult.status}</span>
                </div>
                <p className="text-xs text-rose-200 leading-relaxed">
                  {verifyResult.message}
                </p>
                {verifyResult.student && (
                  <div className="text-[11px] text-gray-400">
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
    <Suspense fallback={<div className="text-center py-20 text-xs text-gray-500">Loading scanner...</div>}>
      <SecurityScanContent />
    </Suspense>
  );
}
