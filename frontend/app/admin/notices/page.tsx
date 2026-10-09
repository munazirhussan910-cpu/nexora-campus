'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Bell, CheckCircle2, AlertCircle, Send, Radio, Shield } from 'lucide-react';

export default function AdminNoticesPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'URGENT'>('NORMAL');
  const [targetType, setTargetType] = useState<'ALL' | 'BRANCH' | 'YEAR' | 'HOSTEL'>('ALL');
  const [targetValue, setTargetValue] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiRequest('/notices', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          priority,
          targets: [{ targetType, targetValue }],
        }),
      });

      if (res.success) {
        setSuccess(`Official targeted notice broadcasted to [${targetType}: ${targetValue}]!`);
        setTitle('');
        setContent('');
      } else {
        setError(res.error?.message || 'Failed to broadcast notice');
      }
    } catch {
      setError('Network communication failure broadcasting notice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
      <div className="border-b border-[#21273a] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#d4af37] font-semibold">
            Institutional Broadcast
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Broadcast Targeted Campus Notice
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Publish high-priority administrative circulars with targeting by branch, academic year, or residential hostel block.
        </p>
      </div>

      <div className="bg-[#121624] border border-[#232b3f] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 shadow-xl space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 font-mono text-[11px]">
              Notice Title <span className="text-[#d4af37]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mid-Semester Examination Schedule Autumn 2026"
              className="w-full bg-[#181e2e] border border-[#2a3449] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#d4af37] transition font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 font-mono text-[11px]">
                Target Audience
              </label>
              <select
                value={targetType}
                onChange={(e: any) => {
                  setTargetType(e.target.value);
                  if (e.target.value === 'ALL') setTargetValue('ALL');
                  else if (e.target.value === 'BRANCH') setTargetValue('CSE');
                  else if (e.target.value === 'YEAR') setTargetValue('2');
                  else if (e.target.value === 'HOSTEL') setTargetValue('Block B');
                }}
                className="w-full bg-[#181e2e] border border-[#2a3449] rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-[#d4af37] cursor-pointer"
              >
                <option value="ALL">Entire Campus (ALL)</option>
                <option value="BRANCH">Specific Department / Branch</option>
                <option value="YEAR">Specific Academic Year</option>
                <option value="HOSTEL">Specific Hostel Block</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 font-mono text-[11px]">
                Target Cohort / Value
              </label>
              {targetType === 'ALL' && (
                <input
                  type="text"
                  disabled
                  value="All Students &amp; Staff"
                  className="w-full bg-[#141824] border border-[#222a3d] rounded-xl p-2.5 text-xs text-slate-400 font-mono"
                />
              )}
              {targetType === 'BRANCH' && (
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-[#181e2e] border border-[#2a3449] rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-[#d4af37] cursor-pointer"
                >
                  <option value="CSE">CSE (Computer Science)</option>
                  <option value="ECE">ECE (Electronics)</option>
                  <option value="MECH">MECH (Mechanical)</option>
                  <option value="CIVIL">CIVIL (Civil)</option>
                  <option value="EE">EE (Electrical)</option>
                </select>
              )}
              {targetType === 'YEAR' && (
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-[#181e2e] border border-[#2a3449] rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-[#d4af37] cursor-pointer"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              )}
              {targetType === 'HOSTEL' && (
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-[#181e2e] border border-[#2a3449] rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-[#d4af37] cursor-pointer"
                >
                  <option value="Block A">Hostel Block A</option>
                  <option value="Block B">Hostel Block B</option>
                  <option value="Block C">Hostel Block C</option>
                  <option value="Block D">Hostel Block D</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 font-mono text-[11px]">
                Broadcast Priority
              </label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full bg-[#181e2e] border border-[#2a3449] rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-[#d4af37] cursor-pointer"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="URGENT">URGENT</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 font-mono text-[11px]">
              Notice Body Content <span className="text-[#d4af37]">*</span>
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter official text for notice..."
              rows={5}
              className="w-full bg-[#181e2e] border border-[#2a3449] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#d4af37] transition resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#c4a02d] text-black font-extrabold text-xs transition shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Send size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Broadcasting...' : 'Publish Official Notice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
