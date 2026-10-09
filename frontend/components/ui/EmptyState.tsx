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
  secondaryActionText?: string;
  secondaryActionHref?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  actionHref,
  onAction,
  secondaryActionText,
  secondaryActionHref,
}: EmptyStateProps) {
  return (
    <div className="py-12 sm:py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3.5 p-6 bg-[#121624]/60 border border-dashed border-[#232b3f] rounded-2xl transition-all">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#181e30] border border-[#2d3852] flex items-center justify-center text-slate-300 shadow-md shadow-black/20">
        <Icon size={24} className="text-[#18C5D8]" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">{title}</h3>
        {description && <p className="text-slate-400 text-xs leading-relaxed">{description}</p>}
      </div>

      <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
        {actionText && actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B20A0] hover:bg-[#6c28be] text-white font-bold text-xs shadow-md shadow-[#5B20A0]/25 transition-all duration-150 active:scale-95"
          >
            {actionText}
          </Link>
        )}

        {actionText && onAction && !actionHref && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B20A0] hover:bg-[#6c28be] text-white font-bold text-xs shadow-md shadow-[#5B20A0]/25 transition-all duration-150 active:scale-95"
          >
            {actionText}
          </button>
        )}

        {secondaryActionText && secondaryActionHref && (
          <Link
            href={secondaryActionHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#171d2b] hover:bg-[#202738] border border-[#2b364d] text-slate-300 hover:text-white font-semibold text-xs transition-all duration-150 active:scale-95"
          >
            {secondaryActionText}
          </Link>
        )}
      </div>
    </div>
  );
}
