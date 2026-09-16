'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import {
  Key,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  QrCode,
  Calendar,
  MapPin,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentGatePassPage() {
  const [passes, setPasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPin, setCopiedPin] = useState(false);

  // Form states
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [expectedReturnTime, setExpectedReturnTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPasses = async () => {
    setLoading(true);
    const res = await apiRequest('/gate-passes/my');
    if (res.success && res.data) {
      setPasses(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPasses();
    const now = new Date();
    const dep = new Date(now.getTime() + 30 * 60 * 1000);
    const ret = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const toLocalISO = (d: Date) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    setDepartureTime(toLocalISO(dep));
    setExpectedReturnTime(toLocalISO(ret));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const res = await apiRequest('/gate-passes', {
      method: 'POST',
      body: JSON.stringify({
        destination,
        reason,
        departureTime: new Date(departureTime).toISOString(),
        expectedReturnTime: new Date(expectedReturnTime).toISOString(),
      }),
    });

    if (res.success) {
      setSuccess('Gate pass submitted! Your Hostel Warden has been notified for digital review.');
      setDestination('');
      setReason('');
      fetchPasses();
    } else {
      setError(res.error?.message || 'Failed to submit gate pass application');
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

  const activePass = passes.find(
    (p) => p.gateStatus === 'APPROVED' || p.gateStatus === 'DEPARTED'
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-cyan-500/35 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 shadow-xs">
          <Shield size={12} />
          <span>Automated Main Gate Security Clearance</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          Campus Gate Pass Center
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
          Digital exit authorizations with HMAC-secured QR codes for optical turnstile scanning and offline 4-digit PIN verification.
        </p>
      </div>

      {/* Active Pass Digital Card (High Priority) */}
      {activePass && (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#101928] via-[#121c2d] to-[#151a26] border border-cyan-500/50 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl shadow-cyan-950/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3.5 text-center md:text-left w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-600/70 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>ACTIVE PASS AUTHORIZED FOR MAIN GATE SCAN</span>
              </div>

              <div>
                <div className="text-xs text-gray-400 font-mono font-semibold">
                  REQUEST REF: <span className="text-gray-200">{activePass.request?.requestNumber}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                  Destination: {activePass.destination}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
                  Reason: {activePass.reason}
                </p>
              </div>

              {/* PIN and Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 max-w-md">
                <div className="bg-[#152134] p-3.5 rounded-xl border border-cyan-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-mono font-bold tracking-wider">
                      Offline Verification PIN
                    </span>
                    <span className="font-mono text-2xl font-black text-cyan-300 tracking-widest">
                      {activePass.passPin}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPin(activePass.passPin)}
                    className="p-2 rounded-lg bg-[#1f2e47] hover:bg-[#283b5c] text-cyan-300 transition"
                    title="Copy PIN"
                    aria-label="Copy offline PIN"
                  >
                    {copiedPin ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="bg-[#152134] p-3.5 rounded-xl border border-cyan-800/60 text-left">
                  <span className="text-[10px] text-gray-400 block uppercase font-mono font-bold tracking-wider">
                    Expected Return By
                  </span>
                  <span className="font-mono text-base font-bold text-gray-200 block pt-1">
                    {new Date(activePass.expectedReturnTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(activePass.expectedReturnTime).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Turnstile QR Code Presentation */}
            <div className="bg-white p-4 rounded-2xl shadow-2xl flex flex-col items-center shrink-0 border-2 border-cyan-400/50">
              <QRCodeSVG
                value={activePass.qrTokenHash || activePass.passPin}
                size={135}
                level="M"
              />
              <span className="text-[10px] text-gray-900 font-mono font-black mt-2 tracking-wider">
                SCAN AT MAIN GATE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gate Pass Application Form */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
        <div className="flex items-center gap-3.5 border-b border-[#21273a] pb-5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
            <Key size={22} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Apply for Digital Gate Pass
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Pass requests are instantaneously forwarded to your Hostel Warden for review.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5 text-xs">
                Destination <span className="text-[#d4af37]">*</span>
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Bhubaneswar City Center / Market"
                className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1.5 text-xs">
                Reason for Exit <span className="text-[#d4af37]">*</span>
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Purchasing academic project hardware"
                className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1.5 text-xs">
                Expected Departure Time <span className="text-[#d4af37]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1.5 text-xs">
                Expected Return Time <span className="text-[#d4af37]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={expectedReturnTime}
                onChange={(e) => setExpectedReturnTime(e.target.value)}
                className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md shadow-cyan-950/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Submitting to Warden...' : 'Submit Gate Pass Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Gate Pass History */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#182030] border border-[#28354f] text-[#d4af37] flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Gate Pass Audit Trail
              </h2>
              <p className="text-[11px] text-gray-400">
                Log of past gate requests, departures, and returns
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-[#161a28] border border-[#232a3d] animate-pulse"
              />
            ))}
          </div>
        ) : passes.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#161a28] border border-[#262e42] flex items-center justify-center text-gray-500">
              <Key size={22} />
            </div>
            <div>
              <div className="font-semibold text-gray-300">No gate pass records found</div>
              <div className="text-gray-500 mt-0.5">Submit a request above when you need to exit campus.</div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#202638]">
            {passes.map((p) => (
              <div
                key={p.id}
                className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-gray-100">
                      {p.request?.requestNumber}
                    </span>
                    <StatusBadge status={p.gateStatus} size="sm" />
                    <span className="font-mono font-bold text-cyan-400 bg-cyan-950/70 px-2.5 py-0.5 rounded-full border border-cyan-800 text-[10px]">
                      PIN: {p.passPin}
                    </span>
                  </div>

                  <div className="font-semibold text-sm text-gray-200">{p.destination}</div>
                  <div className="text-[11px] text-gray-400">{p.reason}</div>

                  <div className="text-[10px] text-gray-500 font-mono mt-1 flex items-center gap-2 flex-wrap">
                    <span>Dep: {new Date(p.departureTime).toLocaleDateString()} {new Date(p.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>Return: {new Date(p.expectedReturnTime).toLocaleDateString()} {new Date(p.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[11px] text-gray-400 font-mono space-y-1 shrink-0">
                  {p.approvedBy && (
                    <div className="text-emerald-400 font-medium">
                      Approved by {p.approver?.staff?.fullName || 'Warden'}
                    </div>
                  )}
                  {p.departedAt && (
                    <div className="text-blue-400">
                      Departed: {new Date(p.departedAt).toLocaleTimeString()}
                    </div>
                  )}
                  {p.returnedAt && (
                    <div className="text-gray-400">
                      Returned: {new Date(p.returnedAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
