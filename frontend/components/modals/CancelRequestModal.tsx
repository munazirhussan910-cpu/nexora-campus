'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface CancelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  requestNumber?: string;
  title?: string;
  requestType?: string;
}

export function CancelRequestModal({
  isOpen,
  onClose,
  onConfirm,
  requestNumber,
  title,
  requestType,
}: CancelRequestModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirm(reason.trim() || undefined);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition disabled:opacity-50"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Cancel Request</h3>
            <p className="text-xs text-gray-400">
              {requestNumber ? `Request: ${requestNumber}` : 'Student Request Self-Cancellation'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="text-xs text-gray-300 space-y-2 leading-relaxed bg-[#161a29] p-3.5 rounded-xl border border-[#242c3f]">
          <p className="font-semibold text-white">
            Are you sure you want to cancel this request?
          </p>
          {title && <p className="text-gray-400 italic">"{title}"</p>}
          <p className="text-gray-400">
            Once cancelled, this request will transition to{' '}
            <strong className="text-rose-400">CANCELLED</strong> status and will no longer be eligible for
            approval or processing.
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-mono">
            Reason for cancellation (optional):
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Changed my mind, issue resolved, or plans changed..."
            rows={2}
            className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-[#1b2234] hover:bg-[#252f47] border border-[#2e374d] text-gray-300 font-semibold text-xs transition disabled:opacity-50"
          >
            Keep Request
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md shadow-rose-950/30 flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <span>Cancel Request</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
