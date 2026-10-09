'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Wrench, ArrowLeft, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function NewComplaintPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Hostel B / Room 204');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Live Routing Keyword Preview
  const getRoutingPreview = (t: string, d: string) => {
    const text = `${t} ${d}`.toLowerCase();
    if (/tap|pipe|leak|water|drain|flush|sink|toilet|shower/.test(text)) {
      return { category: 'Plumbing', spec: 'PLUMBING', staff: 'Ramesh Kumar (Senior Plumber)' };
    }
    if (/fan|light|switch|socket|power|bulb|short|wire|ac|cooler/.test(text)) {
      return { category: 'Electrical', spec: 'ELECTRICAL', staff: 'Suresh Verma (Electrician)' };
    }
    if (/door|window|lock|handle|table|chair|bed|hinge|cupboard/.test(text)) {
      return { category: 'Carpentry', spec: 'CARPENTRY', staff: 'Maintenance Carpentry' };
    }
    if (/wifi|internet|lan|router|network|speed/.test(text)) {
      return { category: 'Network / IT', spec: 'IT', staff: 'Campus Network Team' };
    }
    return { category: 'General Maintenance', spec: 'GENERAL', staff: 'Campus Facilities Team' };
  };

  const preview = getRoutingPreview(title, description);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        location,
        priority,
      }),
    });

    if (res.success && res.data) {
      router.push(`/student/requests/${res.data.id}`);
    } else {
      setError(res.error?.message || 'Failed to submit complaint. Please check your network connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-tab-fade">
      <Link
        href="/student/requests"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to My Requests</span>
      </Link>

      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/25">
        <div className="flex items-center gap-3.5 border-b border-[#21273a] pb-5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#5B20A0]/20 border border-[#7A3DB8]/40 text-[#18C5D8] flex items-center justify-center shrink-0 shadow-md">
            <Wrench size={22} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1b2234] text-[#18C5D8] text-[10px] font-mono font-bold uppercase mb-1">
              <span>Campus Service Desk</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Log Campus Maintenance Ticket
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit your maintenance or repair request. It will be automatically routed to the right technician.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-200 font-semibold">
                Issue Summary <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">Brief headline</span>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Washbasin tap leaking continuously in Bathroom 2"
              className="w-full bg-[#161a29] border border-[#232b3f] focus:border-[#18C5D8] focus:ring-1 focus:ring-[#18C5D8] rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          {/* Real-time Deterministic Routing Indicator */}
          {title.trim().length > 2 && (
            <div className="p-3.5 rounded-xl bg-[#161f30] border border-[#18C5D8]/40 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-tab-fade">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-[#18C5D8] shrink-0" />
                <span className="text-slate-200">
                  Detected Category: <strong className="text-[#18C5D8] font-bold">{preview.category}</strong>
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">
                Target Specialist: <span className="text-slate-200 font-semibold">{preview.staff}</span>
              </span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-200 font-semibold">
                Detailed Description <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">Include room fixtures or specifics</span>
            </div>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context so the technician can bring appropriate tools (e.g., Water is pooling on the floor; tap handle appears loose)..."
              className="w-full bg-[#161a29] border border-[#232b3f] focus:border-[#18C5D8] focus:ring-1 focus:ring-[#18C5D8] rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-200 font-semibold">
                  Location / Room <span className="text-rose-400">*</span>
                </label>
              </div>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Hostel B / Room 204"
                className="w-full bg-[#161a29] border border-[#232b3f] focus:border-[#18C5D8] focus:ring-1 focus:ring-[#18C5D8] rounded-xl p-3 text-xs text-white outline-none transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-200 font-semibold">
                  Urgency / Priority <span className="text-rose-400">*</span>
                </label>
              </div>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full bg-[#161a29] border border-[#232b3f] focus:border-[#18C5D8] focus:ring-1 focus:ring-[#18C5D8] rounded-xl p-3 text-xs text-white outline-none transition"
              >
                <option value="LOW">LOW (Standard 48-Hour SLA)</option>
                <option value="NORMAL">NORMAL (Regular 24-Hour SLA)</option>
                <option value="HIGH">HIGH (Urgent 8-Hour SLA)</option>
                <option value="URGENT">URGENT (Critical 4-Hour SLA)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#21273a] flex items-center justify-end gap-3">
            <Link
              href="/student/requests"
              className="px-4 py-2.5 rounded-xl bg-[#161a29] hover:bg-[#1d2336] border border-[#232b3f] text-slate-300 hover:text-white font-medium transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5B20A0] hover:bg-[#6c28be] text-white font-bold text-xs shadow-lg shadow-[#5B20A0]/25 transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{loading ? 'Submitting Ticket...' : 'Submit Maintenance Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
