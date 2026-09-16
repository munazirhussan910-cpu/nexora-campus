import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="py-12 sm:py-16 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-3 p-6 bg-[#101420]/50 border border-dashed border-[#232a3d] rounded-2xl">
      <div className="w-12 h-12 rounded-2xl bg-[#141824] border border-[#262e42] flex items-center justify-center text-gray-500 shadow-sm">
        <Icon size={22} className="text-[#d4af37]" />
      </div>
      <div className="max-w-sm">
        <h3 className="font-bold text-sm text-gray-200">{title}</h3>
        {description && <p className="text-gray-400 mt-1 text-xs leading-relaxed">{description}</p>}
      </div>

      {(actionText && actionHref) && (
        <Link
          href={actionHref}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-bold text-xs shadow transition active:scale-95"
        >
          {actionText}
        </Link>
      )}

      {(actionText && onAction && !actionHref) && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-bold text-xs shadow transition active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
