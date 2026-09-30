'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, XCircle } from 'lucide-react';

interface LiteRejectModalProps {
  isOpen: boolean;
  title?: string;
  requestNumber?: string;
  studentName?: string;
  summaryLabel?: string;
  summaryValue?: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  submitting?: boolean;
}

export function LiteRejectModal({
  isOpen,
  title = 'Reject Request',
  requestNumber,
  studentName,
  summaryLabel,
  summaryValue,
  onClose,
  onConfirm,
  submitting = false,
}: LiteRejectModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Please provide an official reason for rejection.');
      return;
    }
    if (trimmed.length > 500) {
      setError('Reason cannot exceed 500 characters.');
      return;
    }

    setError('');
    await onConfirm(trimmed);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#121624] border border-[#2b354d] rounded-2xl p-4 sm:p-5 max-w-sm w-full shadow-2xl space-y-3.5 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#212739] pb-2.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs sm:text-sm">
            <XCircle size={17} className="shrink-0" />
            <h3 id="reject-modal-title" className="text-white font-bold truncate">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-[#19243a] border border-[#2c3d5d] transition min-h-[36px] min-w-[36px] flex items-center justify-center disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X size={15} />
          </button>
        </div>

        {/* Metadata summary */}
        {(requestNumber || studentName) && (
          <div className="bg-[#0e111a] border border-[#212739] rounded-xl p-3 space-y-1.5 text-[11px] font-mono">
            {requestNumber && (
              <div className="flex justify-between">
                <span className="text-gray-400">Request ID:</span>
                <span className="font-bold text-[#d4af37]">{requestNumber}</span>
              </div>
            )}
            {studentName && (
              <div className="flex justify-between">
                <span className="text-gray-400">Student:</span>
                <span className="font-bold text-white truncate max-w-[180px]">{studentName}</span>
              </div>
            )}
            {summaryLabel && summaryValue && (
              <div className="flex justify-between">
                <span className="text-gray-400">{summaryLabel}:</span>
                <span className="text-gray-200 truncate max-w-[180px]">{summaryValue}</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label htmlFor="lite-reject-reason" className="block text-gray-300 font-semibold mb-1 text-[11px]">
              Rejection Reason <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="lite-reject-reason"
              ref={textareaRef}
              rows={3}
              maxLength={500}
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter specific reason. Requester will be notified..."
              className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition resize-none"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
              <span>Transmitted to student record</span>
              <span>{reason.length}/500</span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-[11px] flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 border-t border-[#212739]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2 rounded-xl bg-[#171c2a] hover:bg-[#20273a] text-gray-300 border border-[#273248] font-semibold text-xs min-h-[44px] transition active:scale-[0.98] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs min-h-[44px] transition shadow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
