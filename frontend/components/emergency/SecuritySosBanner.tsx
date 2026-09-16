'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api';
import {
  AlertOctagon,
  ShieldAlert,
  PhoneCall,
  CheckCircle2,
  Volume2,
  VolumeX,
  ArrowRight,
  Clock,
  User,
  MapPin,
  X,
  Loader2,
} from 'lucide-react';

export function SecuritySosBanner() {
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [resolvingAlert, setResolvingAlert] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const audioCtxRef = useRef<any>(null);

  // Poll for active emergencies safely with visibility guard
  const fetchActive = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await apiRequest('/emergency/active');
      if (res.success && Array.isArray(res.data)) {
        setActiveAlerts(res.data);
      }
    } catch {
      // Ignore polling errors
    }
  };

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 15000);
    return () => clearInterval(interval);
  }, []);

  // Web Audio emergency siren chirp
  useEffect(() => {
    if (activeAlerts.length > 0 && soundEnabled) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(960, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } catch {
        // Audio error
      }
    }
  }, [activeAlerts.length, soundEnabled]);

  const handleAcknowledge = async (id: string) => {
    setActionLoading(true);
    const res = await apiRequest(`/emergency/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ responderName: 'Main Gate Sentry S-1' }),
    });
    if (res.success) {
      fetchActive();
    }
    setActionLoading(false);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlert || !resolutionNotes.trim()) return;

    setActionLoading(true);
    const res = await apiRequest(`/emergency/${resolvingAlert.id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        resolutionNotes: resolutionNotes.trim(),
        resolverName: 'Vikram Singh (Security Head)',
      }),
    });

    if (res.success) {
      setResolvingAlert(null);
      setResolutionNotes('');
      fetchActive();
    }
    setActionLoading(false);
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6 animate-pulse">
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-gradient-to-r from-red-950 via-[#2a131b] to-red-950 border-2 border-red-600 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-red-950/80 text-white space-y-3"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <div className="flex items-center gap-2 font-black text-red-300 text-sm tracking-wider uppercase">
                <AlertOctagon size={18} className="text-red-400" />
                <span>ACTIVE CAMPUS EMERGENCY: {alert.distressType} DISTRESS</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-900 border border-red-700 text-red-100">
                {alert.id}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="px-2.5 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700 text-xs text-red-200 flex items-center gap-1 transition"
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span>{soundEnabled ? 'Mute' : 'Unmute'} Siren</span>
              </button>
            </div>
          </div>

          {/* Student & Location Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#130d12]/90 border border-red-900/60 p-3.5 rounded-xl text-xs">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Student Name:</span>
              <span className="font-bold text-white text-sm">{alert.studentName}</span>
              <span className="block text-[11px] font-mono text-cyan-300">({alert.rollNumber})</span>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Location:</span>
              <span className="font-bold text-yellow-300 text-sm">
                {alert.hostelBlock} — Room {alert.roomNumber}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Student Contact:</span>
              <a href={`tel:${alert.phone}`} className="font-mono font-bold text-emerald-300 hover:underline flex items-center gap-1">
                <PhoneCall size={12} />
                <span>{alert.phone}</span>
              </a>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Current Status:</span>
              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-red-950 text-red-300 border border-red-800">
                {alert.status === 'ACKNOWLEDGED' ? 'SQUAD DISPATCHED' : 'AWAITING RESPONSE'}
              </span>
            </div>
          </div>

          {alert.description && (
            <div className="text-xs text-red-200/90 italic bg-red-950/40 p-2.5 rounded-lg border border-red-900/40">
              Note from student: &quot;{alert.description}&quot;
            </div>
          )}

          {/* Action Buttons for Security */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            {alert.status === 'ACTIVE' && (
              <button
                type="button"
                onClick={() => handleAcknowledge(alert.id)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-lg transition flex items-center gap-1.5"
              >
                <ShieldAlert size={15} />
                <span>ACKNOWLEDGE &amp; DISPATCH SQUAD</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setResolvingAlert(alert)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>MARK EMERGENCY RESOLVED</span>
            </button>
          </div>
        </div>
      ))}

      {/* Resolution Modal */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                Close Emergency: {resolvingAlert.id}
              </h4>
              <button
                onClick={() => setResolvingAlert(null)}
                className="p-1 rounded text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">
                  Resolution Notes &amp; Actions Taken:
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Sentry arrived on site at 21:58. Patient safely escorted to campus health dispensary."
                  className="w-full bg-[#181d2a] border border-[#28324a] rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingAlert(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1a2030] text-gray-300 font-bold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-lg"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
