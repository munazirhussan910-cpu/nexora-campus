'use client';

import React, { useState } from 'react';
import { X, Bell, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface LiteNoticeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoticeCreated: () => void;
}

export function LiteNoticeCreateModal({
  isOpen,
  onClose,
  onNoticeCreated,
}: LiteNoticeCreateModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [targetType, setTargetType] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and notice content are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = await apiRequest('/notices', {
      method: 'POST',
      body: JSON.stringify({
        title: title.trim(),
        content: content.trim(),
        priority,
        targets: [{ type: targetType, value: targetType }],
      }),
    });

    if (res.success) {
      setTitle('');
      setContent('');
      onNoticeCreated();
      onClose();
    } else {
      setError(res.error?.message || 'Failed to publish notice.');
    }
    setSubmitting(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#121624] border border-[#2b354d] rounded-2xl p-4 sm:p-5 max-w-sm w-full shadow-2xl space-y-3.5 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#212739] pb-2.5">
          <div className="flex items-center gap-2 text-gold font-bold text-xs sm:text-sm">
            <Bell size={16} />
            <h3 className="text-white font-bold">Publish Campus Notice</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-[#19243a] border border-[#2c3d5d]"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-300 font-semibold mb-1 text-[11px]">Notice Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Power maintenance shutdown"
              className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1 text-[11px]">Notice Body *</label>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter official circular message for students..."
              className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-300 font-semibold mb-1 text-[11px]">Priority</label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2 text-xs text-white focus:outline-none focus:border-gold"
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent (Flash)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1 text-[11px]">Audience</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2 text-xs text-white focus:outline-none focus:border-gold"
              >
                <option value="ALL">All Campus</option>
                <option value="HOSTEL">Hostel Residents</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-[11px] flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 border-t border-[#212739]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2 rounded-xl bg-[#171c2a] hover:bg-[#20273a] text-gray-300 border border-[#273248] font-semibold text-xs min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex-1 py-2 rounded-xl bg-gold hover:bg-[#c49f2e] text-black font-bold text-xs min-h-[44px] transition shadow disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
