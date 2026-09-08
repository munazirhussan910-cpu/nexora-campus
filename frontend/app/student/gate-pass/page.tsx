'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Key, Clock, Shield, AlertCircle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentGatePassPage() {
  const [passes, setPasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    // Default departure time to now + 30 mins, return time to now + 4 hours
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
      setSuccess('Gate pass submitted! Warden Dr. S. K. Mohapatra has been notified for approval.');
      setDestination('');
      setReason('');
      fetchPasses();
    } else {
      setError(res.error?.message || 'Failed to submit gate pass application');
    }
    setSubmitting(false);
  };

  const activePass = passes.find(
    (p) => p.gateStatus === 'APPROVED' || p.gateStatus === 'DEPARTED'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Campus Gate Pass Center</h1>
        <p className="text-xs text-gray-400">
          Digital, cryptographic exit authorization with dynamic QR codes and offline 4-digit PIN fallback.
        </p>
      </div>

      {/* Active Pass Banner if available */}
      {activePass && (
        <div className="bg-gradient-to-br from-[#121c2b] to-[#171c28] border border-cyan-700/80 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                ACTIVE PASS AUTHORIZED FOR GATE SCAN
              </div>

              <div>
                <div className="text-xs text-gray-400 font-mono">REQUEST: {activePass.request?.requestNumber}</div>
                <h2 className="text-xl font-extrabold text-white">
                  Destination: {activePass.destination}
                </h2>
                <p className="text-xs text-gray-300 mt-1">Reason: {activePass.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 max-w-sm">
                <div className="bg-[#182030] p-3 rounded-xl border border-[#2a3750] text-center">
                  <span className="text-[10px] text-gray-400 block uppercase tracking-wider font-semibold">
                    OFFLINE PIN
                  </span>
                  <span className="font-mono text-2xl font-black text-cyan-300 tracking-widest">
                    {activePass.passPin}
                  </span>
                </div>
                <div className="bg-[#182030] p-3 rounded-xl border border-[#2a3750] text-center">
                  <span className="text-[10px] text-gray-400 block uppercase tracking-wider font-semibold">
                    RETURN BY
                  </span>
                  <span className="font-mono text-sm font-bold text-gray-200 block pt-1">
                    {new Date(activePass.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-2xl shadow-xl flex flex-col items-center shrink-0">
              <QRCodeSVG
                value={activePass.qrTokenHash || activePass.passPin}
                size={140}
                level="M"
              />
              <span className="text-[11px] text-gray-900 font-mono font-bold mt-2 tracking-wider">
                SCAN AT MAIN GATE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gate Pass Form */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-gray-100 mb-1 flex items-center gap-2">
          <Key size={16} className="text-cyan-400" /> Apply for New Gate Pass
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Pass requests are instantly forwarded to your Hostel Warden for digital review.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} /> <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Destination</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Bhubaneswar City Center"
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Reason for Exit</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Purchasing hardware components for academic project"
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Expected Departure Time</label>
              <input
                type="datetime-local"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Expected Return Time</label>
              <input
                type="datetime-local"
                required
                value={expectedReturnTime}
                onChange={(e) => setExpectedReturnTime(e.target.value)}
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow transition disabled:opacity-50"
            >
              {submitting ? 'Submitting to Warden...' : 'Submit Gate Pass Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Pass History */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-gray-100 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-gray-400" /> Gate Pass History
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500">Loading history...</div>
        ) : passes.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">No gate pass records found.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {passes.map((p) => (
              <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-gray-200">
                      {p.request?.requestNumber}
                    </span>
                    <StatusBadge status={p.gateStatus} size="sm" />
                    <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800 text-[10px]">
                      PIN: {p.passPin}
                    </span>
                  </div>
                  <div className="font-semibold text-gray-200">{p.destination}</div>
                  <div className="text-[11px] text-gray-400">{p.reason}</div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Departure: {new Date(p.departureTime).toLocaleString()} • Expected Return: {new Date(p.expectedReturnTime).toLocaleString()}
                  </div>
                </div>

                <div className="text-right text-[11px] text-gray-400">
                  {p.approvedBy && (
                    <div className="text-emerald-400 font-medium">
                      Approved by {p.approver?.staff?.fullName || 'Warden'}
                    </div>
                  )}
                  {p.departedAt && (
                    <div className="text-blue-400 font-mono">
                      Departed: {new Date(p.departedAt).toLocaleTimeString()}
                    </div>
                  )}
                  {p.returnedAt && (
                    <div className="text-gray-400 font-mono">
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
