'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api';
import {
  AlertOctagon,
  ShieldAlert,
  PhoneCall,
  X,
  CheckCircle2,
  AlertTriangle,
  Flame,
  HeartPulse,
  Shield,
  Loader2,
} from 'lucide-react';

interface StudentSosModalProps {
  buttonStyle?: 'navbar' | 'dashboard';
}

export function StudentSosModal({ buttonStyle = 'navbar' }: StudentSosModalProps) {
  const [open, setOpen] = useState(false);
  const [distressType, setDistressType] = useState<
    'MEDICAL' | 'SECURITY' | 'FIRE' | 'HARASSMENT' | 'GENERAL'
  >('GENERAL');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const handleTrigger = async () => {
    setSubmitting(true);
    const res = await apiRequest('/emergency/trigger', {
      method: 'POST',
      body: JSON.stringify({
        distressType,
        description: description.trim() || undefined,
      }),
    });

    if (res.success && res.data) {
      setActiveAlert(res.data);
    }
    setSubmitting(false);
  };

  const handleResolve = async () => {
    if (!activeAlert?.id) return;
    setCancelLoading(true);
    const res = await apiRequest(`/emergency/${activeAlert.id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        resolutionNotes: 'Resolved / Cancelled by student',
      }),
    });

    if (res.success) {
      setActiveAlert(null);
      setOpen(false);
    }
    setCancelLoading(false);
  };

  return (
    <>
      {/* Trigger Button */}
      {buttonStyle === 'navbar' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative group px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-extrabold text-xs shadow-lg shadow-rose-900/40 flex items-center gap-1.5 transition-all transform active:scale-95 animate-pulse"
          title="Emergency SOS Broadcast"
        >
          <AlertOctagon size={15} className="text-white shrink-0" />
          <span className="hidden sm:inline tracking-wider">SOS EMERGENCY</span>
          <span className="sm:hidden">SOS</span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
        </button>
      ) : (
        <div className="bg-gradient-to-br from-rose-950/70 via-[#1e141a] to-[#141722] border-2 border-rose-800/80 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-rose-400 font-extrabold text-sm tracking-wide">
              <ShieldAlert size={20} className="animate-bounce" />
              <span>CAMPUS RAPID RESPONSE &amp; SOS SYSTEM</span>
            </div>
            <p className="text-xs text-rose-200/80 max-w-lg leading-relaxed">
              In immediate danger, medical distress, or security hazard? Trigger the emergency broadcast
              to dispatch campus sentry guards and notify the resident warden.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm tracking-wider shadow-xl shadow-rose-950/70 transition-all transform active:scale-95 flex items-center justify-center gap-2 shrink-0 animate-pulse"
          >
            <AlertOctagon size={18} />
            <span>TRIGGER EMERGENCY SOS</span>
          </button>
        </div>
      )}

      {/* Emergency SOS Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#141622] border-2 border-rose-600 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden">
            {/* Top Red Glow Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 shadow-[0_0_15px_#f43f5e]" />

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-700 flex items-center justify-center text-rose-400 shadow-inner">
                  <AlertOctagon size={28} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {activeAlert ? 'EMERGENCY SOS ACTIVE' : 'CAMPUS EMERGENCY SOS'}
                  </h3>
                  <p className="text-xs text-rose-300/80 font-medium">
                    Direct communication channel to Main Gate Security &amp; Warden
                  </p>
                </div>
              </div>

              {!activeAlert && (
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-xl bg-[#1f2436] text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* VIEW 1: ACTIVE EMERGENCY BROADCASTING */}
            {activeAlert ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-700 text-rose-200 text-xs space-y-2 text-center">
                  <div className="font-mono font-black text-sm text-yellow-300 flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span>BROADCASTING ALARM: {activeAlert.id}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-200">
                    Your distress signal has been sent to Main Gate Security and the hostel warden desk.
                    Sentry response squad is being mobilized to your room.
                  </p>
                  <div className="text-[11px] font-mono text-gray-400 pt-1">
                    Registered Location: <strong>{activeAlert.hostelBlock} - Room {activeAlert.roomNumber}</strong>
                  </div>
                </div>

                {/* Direct Emergency Telephone Hotlines */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    Direct Campus Emergency Hotlines:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <a
                      href="tel:+916742300100"
                      className="p-3 rounded-xl bg-[#1b2130] border border-[#2c364e] hover:border-cyan-400 text-gray-200 flex items-center justify-between transition"
                    >
                      <span className="font-semibold">Security Control Desk</span>
                      <PhoneCall size={14} className="text-cyan-400" />
                    </a>
                    <a
                      href="tel:108"
                      className="p-3 rounded-xl bg-[#1b2130] border border-[#2c364e] hover:border-emerald-400 text-gray-200 flex items-center justify-between transition"
                    >
                      <span className="font-semibold">Campus Ambulance (108)</span>
                      <PhoneCall size={14} className="text-emerald-400" />
                    </a>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={cancelLoading}
                    className="w-full py-3.5 rounded-xl bg-[#1e2436] hover:bg-[#28324a] text-gray-300 hover:text-white font-bold text-xs transition border border-[#2d3852]"
                  >
                    {cancelLoading ? 'Cancelling...' : 'Cancel SOS (False Alarm / Resolved)'}
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW 2: SOS TRIGGER FORM */
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                    Select Emergency Nature:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { type: 'MEDICAL', label: 'Medical Emergency', icon: HeartPulse, color: 'text-emerald-400' },
                      { type: 'SECURITY', label: 'Security Threat', icon: Shield, color: 'text-cyan-400' },
                      { type: 'FIRE', label: 'Fire / Hazard', icon: Flame, color: 'text-amber-400' },
                      { type: 'HARASSMENT', label: 'Harassment / Distress', icon: AlertTriangle, color: 'text-rose-400' },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = distressType === opt.type;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => setDistressType(opt.type as any)}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                            isSelected
                              ? 'bg-rose-950/60 border-rose-500 text-white shadow-lg ring-1 ring-rose-500'
                              : 'bg-[#181d2a] border-[#28324a] text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <Icon size={18} className={opt.color} />
                          <span className="text-xs font-bold leading-tight">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                    Additional Context / Specific Location (Optional):
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Unconscious roommate in Room 204, immediate stretcher needed"
                    className="w-full bg-[#181d2a] border border-[#28324a] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTrigger}
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm tracking-wider shadow-2xl shadow-rose-900/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>BROADCASTING ALARM...</span>
                      </>
                    ) : (
                      <>
                        <AlertOctagon size={20} />
                        <span>BROADCAST EMERGENCY SOS NOW</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
