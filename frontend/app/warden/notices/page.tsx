'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Bell, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WardenNoticesPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'URGENT'>('NORMAL');
  const [targetValue, setTargetValue] = useState('Block B');
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
        targets: [{ targetType: 'HOSTEL', targetValue }],
      }),
    });

    if (res.success) {
      setSuccess(`Targeted notice published to ${targetValue} residents!`);
      setTitle('');
      setContent('');
    } else {
      setError(res.error?.message || 'Failed to publish notice');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Publish Hostel Block Notice</h1>
        <p className="text-xs text-gray-400">
          Target announcements directly to residents of your hostel wing.
        </p>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
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

        <form onSubmit={handlePublish} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-medium mb-1">Notice Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Block B — Bathroom Maintenance Shutdown Notice"
              className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Target Hostel Block</label>
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
              >
                <option value="Block B">Hostel Block B (Your Block)</option>
                <option value="Block A">Hostel Block A</option>
                <option value="Block C">Hostel Block C</option>
                <option value="Block D">Hostel Block D</option>
              </select>
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
            <label className="block text-gray-300 font-medium mb-1">Notice Body</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the notice details here. Will be delivered to all student dashboards matching the target..."
              className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white h-28"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow transition disabled:opacity-50"
            >
              {loading ? 'Broadcasting...' : 'Broadcast Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
