'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Wrench, ArrowLeft, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

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
    return { category: 'General Maintenance', spec: 'GENERAL', staff: 'Maintenance Team' };
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
      setError(res.error?.message || 'Failed to submit complaint');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/student/requests"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
      >
        <ArrowLeft size={14} /> Back to Requests
      </Link>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 border-b border-[#282f42] pb-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <Wrench size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Log Campus Maintenance Complaint</h1>
            <p className="text-xs text-gray-400">
              Powered by deterministic keyword routing into the Nexora Request Engine.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-medium mb-1">Issue Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tap Leakage in bathroom"
              className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold"
            />
          </div>

          {/* Real-time Deterministic Routing Indicator */}
          {title.trim().length > 2 && (
            <div className="p-3 rounded-xl bg-[#1a2130] border border-gold/30 text-[11px] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-gold shrink-0" />
                <span>
                  Auto-routing category: <strong className="text-gold">{preview.category}</strong>
                </span>
              </div>
              <span className="text-gray-400">Assigned: {preview.staff}</span>
            </div>
          )}

          <div>
            <label className="block text-gray-300 font-medium mb-1">Detailed Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail (e.g. Bathroom washbasin tap is continuously leaking and overflowing)..."
              className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold h-24"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Location / Room</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Hostel B / Room 204"
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
              >
                <option value="LOW">LOW (48h SLA)</option>
                <option value="NORMAL">NORMAL (24h SLA)</option>
                <option value="HIGH">HIGH (8h SLA)</option>
                <option value="URGENT">URGENT (4h SLA)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link
              href="/student/requests"
              className="px-4 py-2 rounded-lg bg-[#1f2434] text-gray-300 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-gold text-black font-bold hover:bg-[#c49f2e] transition shadow disabled:opacity-50"
            >
              {loading ? 'Submitting & Routing...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
