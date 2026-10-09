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
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-tab-fade">
      <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 text-foreground space-y-4 shadow-2xl relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition disabled:opacity-50 p-1 rounded-lg hover:bg-surface-secondary"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight">Cancel Request</h3>
            <p className="text-xs text-muted-foreground">
              {requestNumber ? `Request: ${requestNumber}` : 'Student Request Self-Cancellation'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-2 leading-relaxed bg-surface-secondary p-3.5 rounded-xl border border-border">
          <p className="font-semibold text-foreground">
            Are you sure you want to cancel this request?
          </p>
          {title && <p className="text-muted-foreground italic">&ldquo;{title}&rdquo;</p>}
          <p>
            Once cancelled, this request will transition to{' '}
            <strong className="text-rose-600 dark:text-rose-400 font-bold">CANCELLED</strong> status and will no longer be eligible for
            approval or processing.
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 font-mono">
            Reason for cancellation (optional):
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Changed my mind, issue resolved, or plans changed..."
            rows={2}
            className="w-full bg-surface-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-rose-500 transition resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-foreground font-semibold text-xs transition disabled:opacity-50"
          >
            Keep Request
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
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
