import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStyle = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'APPROVED':
      case 'CONFIRMED':
      case 'RESOLVED':
      case 'VALID':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'IN_PROGRESS':
      case 'ACCEPTED':
      case 'ROUTED':
      case 'DEPARTED':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'PENDING_APPROVAL':
      case 'SUBMITTED':
      case 'ASSIGNED':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'REJECTED':
      case 'EXPIRED':
      case 'REVOKED':
      case 'CANCELLED':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'RETURNED':
      case 'CLOSED':
        return 'bg-gray-900 text-gray-300 border-gray-700';
      default:
        return 'bg-gray-900 text-gray-300 border-gray-700';
    }
  };

  const formatText = (s: string) => {
    if (!s) return 'UNKNOWN';
    return s.replace(/_/g, ' ');
  };

  const sizeClass = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClass} ${getStyle(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {formatText(status)}
    </span>
  );
}
