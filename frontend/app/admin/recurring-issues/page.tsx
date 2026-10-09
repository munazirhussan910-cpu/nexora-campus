'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  AlertOctagon,
  Wrench,
  Building,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

export default function AdminRecurringIssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIssues = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiRequest('/admin/recurring-issues');
      if (res.success && res.data) {
        setIssues(res.data);
      }
    } catch (e) {
      console.error('Failed to load recurring issues', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21273a] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-rose-400">
              CAMPUS INTELLIGENCE ENGINE (SECTION 44)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Recurring Campus Infrastructure Issues
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Autonomous pattern detection: Identifies any hostel block with &ge; 3 complaints in the same category within 14 days.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchIssues(true)}
          disabled={loading || refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141824] border border-[#273043] hover:border-[#d4af37]/60 text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#d4af37]' : ''} />
          <span>Scan Clusters</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <RefreshCw size={20} className="animate-spin text-rose-400" />
          <span>Running clustering algorithm on last 14 days of campus transactional records...</span>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-[#121624] border border-[#232b3f] rounded-2xl p-8 sm:p-12 text-center text-xs text-slate-400 space-y-2.5 shadow-xl">
          <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
          <h3 className="font-extrabold text-base text-slate-100">No Recurring Issues Detected</h3>
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed text-xs">
            All hostel blocks currently have distributed, isolated maintenance tickets below the clustering threshold.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-[#1b1522] to-[#121624] border border-rose-700/80 rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-900/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-400 flex items-center justify-center shrink-0">
                    <AlertOctagon size={24} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
                      CRITICAL CLUSTER DETECTED
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-white truncate">
                      {issue.hostelBlock} — {issue.category} Failures
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg font-mono font-extrabold text-xs bg-rose-950 text-rose-300 border border-rose-800 shrink-0">
                    {issue.complaintCount} COMPLAINTS / {issue.periodDays || 14} DAYS
                  </span>
                  <span className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800 shrink-0">
                    SEVERITY: {issue.severity || 'HIGH'}
                  </span>
                </div>
              </div>

              {/* Cluster Intelligence Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#14131c] p-3.5 rounded-xl border border-rose-900/40 space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">
                    Hostel Location
                  </span>
                  <div className="font-semibold text-slate-200">{issue.hostelBlock}</div>
                  <div className="text-[11px] text-slate-400 truncate">Sample: {issue.sampleLocation}</div>
                </div>

                <div className="bg-[#14131c] p-3.5 rounded-xl border border-rose-900/40 space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">
                    Infrastructure Category
                  </span>
                  <div className="font-semibold text-slate-200">{issue.category}</div>
                  <div className="text-[11px] text-slate-400">Specialization: PLUMBING / PIPELINE</div>
                </div>

                <div className="bg-[#14131c] p-3.5 rounded-xl border border-rose-900/40 space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">
                    Root Cause Hypothesis
                  </span>
                  <div className="font-semibold text-slate-200">Main Riser Pressure Failure</div>
                  <div className="text-[11px] text-rose-300">Repeat joints leakage cluster</div>
                </div>
              </div>

              {/* Actionable Engineering Recommendation */}
              <div className="bg-[#121118] p-3.5 sm:p-4 rounded-xl border border-rose-900/60 text-xs space-y-1">
                <span className="text-[#d4af37] font-bold block text-[11px] uppercase tracking-wider font-mono">
                  Automated Operational Recommendation:
                </span>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {issue.recommendation}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs text-slate-400">
                <span className="font-mono text-[10px] sm:text-[11px] text-slate-500 break-all">
                  Rule Trigger: hostelBlock == &apos;{issue.hostelBlock}&apos; &amp;&amp; category == &apos;{issue.category}&apos; &amp;&amp; count &ge; 3
                </span>
                <Link
                  href={`/admin/requests?category=${issue.category}&hostel=${issue.hostelBlock}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#241f2e] hover:bg-[#30283e] text-rose-300 font-bold border border-rose-800 transition active:scale-95 shrink-0 self-start sm:self-auto"
                >
                  <span>Filter Related Tickets</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
