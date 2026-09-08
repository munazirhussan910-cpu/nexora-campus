'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Bell, CheckCircle2, AlertCircle, Send } from 'lucide-react';

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
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Broadcast Targeted Campus Notice</h1>
        <p className="text-xs text-gray-400">
          Publish high-priority administrative circulars with targeting by branch, academic year, or residential hostel block.
        </p>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} /> <span>{success}</span>
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-medium mb-1">Notice Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mid-Semester Examination Schedule Autumn 2026"
              className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Target Type</label>
              <select
                value={targetType}
                onChange={(e: any) => {
                  setTargetType(e.target.value);
                  if (e.target.value === 'ALL') setTargetValue('ALL');
                  else if (e.target.value === 'BRANCH') setTargetValue('CSE');
                  else if (e.target.value === 'YEAR') setTargetValue('2');
                  else if (e.target.value === 'HOSTEL') setTargetValue('Block B');
                }}
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
              >
                <option value="ALL">Entire Campus (ALL)</option>
                <option value="BRANCH">Specific Department / Branch</option>
                <option value="YEAR">Specific Academic Year</option>
                <option value="HOSTEL">Specific Hostel Block</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Target Value</label>
              {targetType === 'ALL' && (
                <input
                  type="text"
                  disabled
                  value="All Students &amp; Staff"
                  className="w-full bg-[#161a26] border border-[#2e3447] rounded-lg p-2.5 text-xs text-gray-400"
                />
              )}
              {targetType === 'BRANCH' && (
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
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
                  className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
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
                  className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="Block A">Hostel Block A</option>
                  <option value="Block B">Hostel Block B</option>
                  <option value="Block C">Hostel Block C</option>
                  <option value="Block D">Hostel Block D</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="URGENT">URGENT</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">Notice Body Content</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter official text for notice..."
              className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white placeholder-gray-500 h-32 focus:outline-none focus:border-gold"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-gold text-black font-bold hover:bg-[#c49f2e] transition shadow flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send size={14} />
              <span>{loading ? 'Broadcasting...' : 'Publish Official Notice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
