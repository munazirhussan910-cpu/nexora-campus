'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { FileSpreadsheet, Shield, Search, Clock, User, Filter, RefreshCw } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchAuditLogs = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiRequest('/admin/audit-logs');
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filtered = logs.filter((l) => {
    if (actionFilter !== 'ALL' && !l.action?.includes(actionFilter)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const action = l.action?.toLowerCase().includes(q);
      const actor = l.actor?.username?.toLowerCase().includes(q);
      const entity = l.entityType?.toLowerCase().includes(q);
      if (!action && !actor && !entity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21273a] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-[#d4af37]" />
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-[#d4af37]">
              IMMUTABLE AUDIT TRAIL (SECTION 45)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Security &amp; Operations Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-only tamper-proof log recording administrative actions, approvals, gate events, and state mutations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, actor, or entity..."
              className="w-full bg-[#121624] border border-[#232b3f] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#d4af37] transition"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchAuditLogs(true)}
            disabled={loading || refreshing}
            className="p-2 rounded-xl bg-[#141824] border border-[#273043] hover:border-[#d4af37]/60 text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50 shrink-0"
            title="Refresh audit ledger"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#d4af37]' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-[#121624] border border-[#232b3f] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-[#212739] flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Immutable Entries: <strong className="text-white">{filtered.length}</strong>
          </span>
          <span className="text-[11px] text-[#d4af37]">Append-Only Ledger</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={18} className="animate-spin text-[#d4af37]" />
            <span>Loading audit ledger...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-1">
            <FileSpreadsheet size={24} className="text-slate-600 mx-auto mb-2" />
            <div className="font-semibold text-slate-400">No audit records found matching query.</div>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2434]">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="p-3.5 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#161a29] transition text-xs font-mono"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded bg-[#1c2234] text-[#d4af37] font-bold text-[11px] border border-[#2c364e]">
                      {log.action}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Entity: <strong className="text-slate-200">{log.entityType}</strong> (
                      {log.entityId?.slice(0, 8)}...)
                    </span>
                  </div>

                  {log.newValues && (
                    <div className="text-[11px] text-slate-400 truncate max-w-xl font-sans">
                      Payload:{' '}
                      <code className="text-emerald-300 font-mono text-[10px] break-all">
                        {log.newValues}
                      </code>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-sans flex-wrap">
                    <span>
                      Actor:{' '}
                      <strong className="text-slate-300 font-mono">
                        {log.actor?.username || 'SYSTEM'}
                      </strong>{' '}
                      ({log.actor?.role?.name || 'CORE'})
                    </span>
                    <span>•</span>
                    <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[11px] text-slate-400 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1c2234]">
                  <div className="font-semibold text-slate-300">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
