'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { FileSpreadsheet, Shield, Search, Clock, User, Filter } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      const res = await apiRequest('/admin/audit-logs');
      if (res.success && res.data) {
        setLogs(res.data);
      }
      setLoading(false);
    };

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-gold" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-gold">
              IMMUTABLE AUDIT TRAIL (SECTION 45)
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security &amp; Operations Audit Logs</h1>
          <p className="text-xs text-gray-400">
            Append-only tamper-proof log recording administrative actions, approvals, gate events, and state mutations.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor, or entity..."
            className="w-full bg-[#141722] border border-[#282f42] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      <div className="bg-[#141722] border border-[#282f42] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading audit ledger...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No audit records found.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181b26] transition text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-[#1e2538] text-gold font-bold text-[11px] border border-[#323d57]">
                      {log.action}
                    </span>
                    <span className="text-gray-400 text-[11px]">
                      Entity: <strong className="text-gray-200">{log.entityType}</strong> ({log.entityId?.slice(0, 12)}...)
                    </span>
                  </div>

                  {log.newValues && (
                    <div className="text-[11px] text-gray-400 truncate max-w-xl font-sans">
                      Payload: <code className="text-emerald-300 font-mono text-[10px]">{log.newValues}</code>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-gray-500 font-sans">
                    <span>Actor: <strong>{log.actor?.username || 'SYSTEM'}</strong> ({log.actor?.role?.name || 'CORE'})</span>
                    <span>•</span>
                    <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-gray-400 shrink-0">
                  <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
                  <div className="text-gray-500 text-[10px]">{new Date(log.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
