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
} from 'lucide-react';

export default function AdminRecurringIssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      const res = await apiRequest('/admin/recurring-issues');
      if (res.success && res.data) {
        setIssues(res.data);
      }
      setLoading(false);
    };

    fetchIssues();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400">
              CAMPUS INTELLIGENCE ENGINE (SECTION 44)
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Recurring Campus Infrastructure Issues
          </h1>
          <p className="text-xs text-gray-400">
            Autonomous pattern detection: Identifies any hostel block with &ge; 3 complaints in the same category within 14 days.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500">
          Running clustering algorithm on last 14 days of campus transactional records...
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-12 text-center text-xs text-gray-400 space-y-2">
          <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
          <h3 className="font-bold text-sm text-gray-200">No Recurring Issues Detected</h3>
          <p className="text-gray-500">
            All hostel blocks currently have distributed, isolated maintenance tickets below the clustering threshold.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-[#1b1522] to-[#141722] border-2 border-rose-800 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-900/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-400 flex items-center justify-center shrink-0">
                    <AlertOctagon size={26} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
                      CRITICAL CLUSTER DETECTED
                    </span>
                    <h2 className="text-lg font-bold text-white">
                      {issue.hostelBlock} — {issue.category} Failures
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg font-mono font-extrabold text-xs bg-rose-950 text-rose-300 border border-rose-800">
                    {issue.complaintCount} COMPLAINTS / {issue.periodDays} DAYS
                  </span>
                  <span className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    SEVERITY: {issue.severity}
                  </span>
                </div>
              </div>

              {/* Cluster Intelligence Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#14131c] p-3.5 rounded-xl border border-rose-900/40 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">
                    Hostel Location
                  </span>
                  <div className="font-semibold text-gray-200">{issue.hostelBlock}</div>
                  <div className="text-[11px] text-gray-400">Sample: {issue.sampleLocation}</div>
                </div>

                <div className="bg-[#14131c] p-3.5 rounded-xl border border-rose-900/40 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">
                    Infrastructure Category
                  </span>
                  <div className="font-semibold text-gray-200">{issue.category}</div>
                  <div className="text-[11px] text-gray-400">Specialization: PLUMBING / PIPELINE</div>
                </div>

                <div className="bg-[#14131c] p-3.5 rounded-xl border border-rose-900/40 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">
                    Root Cause Hypothesis
                  </span>
                  <div className="font-semibold text-gray-200">Main Riser Pressure Failure</div>
                  <div className="text-[11px] text-rose-300">Repeat joints leakage cluster</div>
                </div>
              </div>

              {/* Actionable Engineering Recommendation */}
              <div className="bg-[#121118] p-4 rounded-xl border border-rose-900/60 text-xs space-y-1">
                <span className="text-gold font-bold block text-[11px] uppercase tracking-wider">
                  Automated Operational Recommendation:
                </span>
                <p className="text-gray-300 leading-relaxed">
                  {issue.recommendation}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-gray-400">
                <span className="font-mono text-[11px]">
                  Rule Trigger: hostelBlock == &apos;{issue.hostelBlock}&apos; &amp;&amp; category == &apos;{issue.category}&apos; &amp;&amp; count &ge; 3
                </span>
                <Link
                  href={`/admin/requests?category=${issue.category}&hostel=${issue.hostelBlock}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#241f2e] hover:bg-[#30283e] text-rose-300 font-bold border border-rose-800 transition"
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
