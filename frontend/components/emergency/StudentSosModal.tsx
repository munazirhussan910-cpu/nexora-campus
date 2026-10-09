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
          className="relative group px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-extrabold text-xs shadow-md shadow-rose-900/30 flex items-center gap-1.5 transition-all transform active:scale-95 animate-pulse"
          title="Emergency SOS Broadcast"
        >
          <AlertOctagon size={15} className="text-white shrink-0" />
          <span className="hidden sm:inline tracking-wider">SOS EMERGENCY</span>
          <span className="sm:hidden">SOS</span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
        </button>
      ) : (
        <div className="bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-surface border border-rose-500/30 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-sm tracking-wide">
              <ShieldAlert size={20} className="animate-bounce" />
              <span>CAMPUS RAPID RESPONSE &amp; SOS SYSTEM</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              In immediate danger, medical distress, or security hazard? Trigger the emergency broadcast
              to dispatch campus sentry guards and notify the resident warden.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm tracking-wider shadow-lg shadow-rose-600/30 transition-all transform active:scale-95 flex items-center justify-center gap-2 shrink-0 animate-pulse"
          >
            <AlertOctagon size={18} />
            <span>TRIGGER EMERGENCY SOS</span>
          </button>
        </div>
      )}

      {/* Emergency SOS Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border-2 border-rose-500/70 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden">
            {/* Top Red Glow Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 shadow-[0_0_15px_#f43f5e]" />

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
                  <AlertOctagon size={28} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground tracking-tight">
                    {activeAlert ? 'EMERGENCY SOS ACTIVE' : 'CAMPUS EMERGENCY SOS'}
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-300 font-medium">
                    Direct communication channel to Main Gate Security &amp; Warden
                  </p>
                </div>
              </div>

              {!activeAlert && (
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-xl bg-surface-secondary text-muted-foreground hover:text-foreground transition"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* VIEW 1: ACTIVE EMERGENCY BROADCASTING */}
            {activeAlert ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-foreground text-xs space-y-2 text-center">
                  <div className="font-mono font-black text-sm text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span>BROADCASTING ALARM: {activeAlert.id}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Your distress signal has been sent to Main Gate Security and the hostel warden desk.
                    Sentry response squad is being mobilized to your room.
                  </p>
                  <div className="text-[11px] font-mono text-muted-foreground pt-1">
                    Registered Location: <strong className="text-foreground">{activeAlert.hostelBlock} - Room {activeAlert.roomNumber}</strong>
                  </div>
                </div>

                {/* Direct Emergency Telephone Hotlines */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Direct Campus Emergency Hotlines:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <a
                      href="tel:+916742300100"
                      className="p-3 rounded-xl bg-surface border border-border hover:border-sky-500 text-foreground flex items-center justify-between transition shadow-xs"
                    >
                      <span className="font-semibold">Security Control Desk</span>
                      <PhoneCall size={14} className="text-sky-500" />
                    </a>
                    <a
                      href="tel:108"
                      className="p-3 rounded-xl bg-surface border border-border hover:border-emerald-500 text-foreground flex items-center justify-between transition shadow-xs"
                    >
                      <span className="font-semibold">Campus Ambulance (108)</span>
                      <PhoneCall size={14} className="text-emerald-500" />
                    </a>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={cancelLoading}
                    className="w-full py-3.5 rounded-xl bg-surface-secondary hover:bg-surface-secondary/80 text-foreground font-bold text-xs transition border border-border"
                  >
                    {cancelLoading ? 'Cancelling...' : 'Cancel SOS (False Alarm / Resolved)'}
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW 2: SOS TRIGGER FORM */
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Emergency Nature:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { type: 'MEDICAL', label: 'Medical Emergency', icon: HeartPulse, color: 'text-emerald-500' },
                      { type: 'SECURITY', label: 'Security Threat', icon: Shield, color: 'text-sky-500' },
                      { type: 'FIRE', label: 'Fire / Hazard', icon: Flame, color: 'text-amber-500' },
                      { type: 'HARASSMENT', label: 'Harassment / Distress', icon: AlertTriangle, color: 'text-rose-500' },
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
                              ? 'bg-rose-500/15 border-rose-500 text-foreground shadow-xs ring-1 ring-rose-500'
                              : 'bg-surface border-border text-foreground hover:border-border-hover'
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Additional Context / Specific Location (Optional):
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Unconscious roommate in Room 204, immediate stretcher needed"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTrigger}
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm tracking-wider shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
