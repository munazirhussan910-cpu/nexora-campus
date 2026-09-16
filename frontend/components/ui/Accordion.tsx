'use client';

import React, { useState } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

export interface AccordionItemData {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant?: 'gold' | 'emerald' | 'cyan' | 'amber' | 'purple' | 'rose' | 'slate';
  };
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItemData[];
  allowMultiple?: boolean;
  className?: string;
  variant?: 'separated' | 'connected' | 'minimal';
}

export function Accordion({
  items,
  allowMultiple = false,
  className = '',
  variant = 'separated',
}: AccordionProps) {
  // Store set of open item IDs
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    items.forEach((item, index) => {
      if (item.defaultOpen || (index === 0 && item.defaultOpen !== false && items.length <= 3)) {
        initial.add(item.id);
      }
    });
    return initial;
  });

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  };

  const getBadgeClass = (variant?: string) => {
    switch (variant) {
      case 'gold':
        return 'bg-amber-500/10 text-amber-600 dark:text-gold border-amber-500/30 dark:border-gold/30';
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
      case 'amber':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'purple':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'rose':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-100 dark:bg-[#202638] text-slate-700 dark:text-gray-300 border-slate-300 dark:border-[#2e374f]';
    }
  };

  if (variant === 'connected') {
    return (
      <div
        className={`rounded-2xl border border-slate-200 dark:border-[#282f42] bg-white dark:bg-[#141722]/80 backdrop-blur-sm overflow-hidden shadow-sm divide-y divide-slate-200 dark:divide-[#282f42] ${className}`}
      >
        {items.map((item) => {
          const isOpen = openIds.has(item.id);
          const Icon = item.icon;

          return (
            <div key={item.id} className="transition-colors duration-200">
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${item.id}`}
                id={`accordion-header-${item.id}`}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4 text-left hover:bg-slate-50 dark:hover:bg-[#1a1e2c] active:bg-slate-100 dark:active:bg-[#1f2436] transition-all group select-none min-h-[52px]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {Icon && (
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${
                        isOpen
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-gold'
                          : 'bg-slate-100 dark:bg-[#1c2233] border-slate-200 dark:border-[#2e3549] text-slate-600 dark:text-gray-400'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm sm:text-base font-bold transition-colors leading-snug ${
                          isOpen
                            ? 'text-amber-600 dark:text-gold'
                            : 'text-slate-900 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-gold'
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border shrink-0 ${getBadgeClass(
                            item.badge.variant
                          )}`}
                        >
                          {item.badge.text}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 text-slate-400 dark:text-gray-500 group-hover:text-slate-700 dark:group-hover:text-gray-300 ${
                    isOpen ? 'rotate-180 text-amber-600 dark:text-gold' : ''
                  }`}
                >
                  <ChevronDown size={18} />
                </div>
              </button>

              <div
                id={`accordion-content-${item.id}`}
                role="region"
                aria-labelledby={`accordion-header-${item.id}`}
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                    {item.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default 'separated' cards variant — ultra tactile for mobile screens
  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const Icon = item.icon;

        return (
          <div
            key={item.id}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm backdrop-blur-sm ${
              isOpen
                ? 'bg-white dark:bg-[#141722] border-amber-400/50 dark:border-gold/40 shadow-md ring-1 ring-amber-400/20 dark:ring-gold/20'
                : 'bg-white/90 dark:bg-[#141722]/80 border-slate-200 dark:border-[#282f42] hover:border-slate-300 dark:hover:border-[#38425d]'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
              id={`accordion-header-${item.id}`}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4 text-left active:bg-slate-50 dark:active:bg-[#181d2c] transition-colors select-none min-h-[54px] group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {Icon && (
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${
                      isOpen
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-gold'
                        : 'bg-slate-100 dark:bg-[#1c2233] border-slate-200 dark:border-[#2e3549] text-slate-600 dark:text-gray-400'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm sm:text-base font-bold transition-colors leading-snug ${
                        isOpen
                          ? 'text-amber-600 dark:text-gold'
                          : 'text-slate-900 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-gold'
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border shrink-0 ${getBadgeClass(
                          item.badge.variant
                        )}`}
                      >
                        {item.badge.text}
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 border ${
                  isOpen
                    ? 'rotate-180 bg-amber-500/10 dark:bg-gold/10 text-amber-600 dark:text-gold border-amber-500/30 dark:border-gold/30'
                    : 'bg-slate-100 dark:bg-[#1b2132] text-slate-500 dark:text-gray-400 border-slate-200 dark:border-[#2b334a]'
                }`}
              >
                <ChevronDown size={17} />
              </div>
            </button>

            {/* Smooth height animation via CSS Grid rows */}
            <div
              id={`accordion-content-${item.id}`}
              role="region"
              aria-labelledby={`accordion-header-${item.id}`}
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 dark:text-gray-300 leading-relaxed border-t border-slate-100 dark:border-[#23293a] mt-1 pt-3">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
