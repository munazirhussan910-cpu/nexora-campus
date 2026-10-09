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
    <div className="py-12 sm:py-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3.5 p-6 bg-surface-secondary/40 border border-dashed border-border rounded-2xl transition-all">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-surface border border-border flex items-center justify-center text-primary shadow-xs">
        <Icon size={24} className="text-primary" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight">{title}</h3>
        {description && <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>}
      </div>

      <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
        {actionText && actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-xs transition-all duration-150 active:scale-95"
          >
            {actionText}
          </Link>
        )}

        {actionText && onAction && !actionHref && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-xs transition-all duration-150 active:scale-95"
          >
            {actionText}
          </button>
        )}

        {secondaryActionText && secondaryActionHref && (
          <Link
            href={secondaryActionHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-foreground font-semibold text-xs transition-all duration-150 active:scale-95"
          >
            {secondaryActionText}
          </Link>
        )}
      </div>
    </div>
  );
}
