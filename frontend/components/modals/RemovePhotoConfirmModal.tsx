'use client';

import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface RemovePhotoConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export function RemovePhotoConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: RemovePhotoConfirmModalProps) {
  if (!isOpen) return null;

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

        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Remove Profile Photo</h3>
            <span className="text-[11px] font-mono text-muted-foreground">Nexora Digital Identity</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Are you sure you want to remove your profile photo? Your profile will revert to your default campus initials badge.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-secondary text-foreground border border-border text-xs font-semibold transition disabled:opacity-50"
          >
            Keep Photo
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Trash2 size={13} />
            <span>{loading ? 'Removing...' : 'Remove Photo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
