'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatGridSkeleton, TableSkeleton } from '@/components/ui/SkeletonLoader';
import {
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Calendar,
  Clock,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Award,
  Layers,
} from 'lucide-react';

interface AttendanceSubjectRecord {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  isAboveThreshold: boolean;
}

interface RecentHistoryRecord {
  id: string;
  sessionId: string;
  date: string;
  subjectCode: string;
  subjectName: string;
  period: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

interface AttendanceResponseData {
  student: {
    id: string;
    fullName: string;
    rollNumber: string;
    branch: string;
    year: number;
  };
  overall: {
    present: number;
    absent: number;
    total: number;
    percentage: number;
    threshold: number;
    isAboveThreshold: boolean;
    statusMessage: string;
    insight: string;
  };
  records: AttendanceSubjectRecord[];
  recentHistory?: RecentHistoryRecord[];
}

export default function StudentAttendancePage() {
  const [data, setData] = useState<AttendanceResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = async () => {
    try {
      const res = await apiRequest<AttendanceResponseData>('/student/attendance');
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error?.message || 'Unable to load attendance records');
      }
    } catch {
      setError('Network communication failure while retrieving attendance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAttendance();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Present
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-rose-950/70 border border-rose-500/40 text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Absent
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-amber-950/70 border border-amber-500/40 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Late
          </span>
        );
      case 'EXCUSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-blue-950/70 border border-blue-500/40 text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Excused
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-gray-800 text-gray-300">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-[#181d2a] rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-[#181d2a] rounded-lg animate-pulse" />
        </div>
        <StatGridSkeleton />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  const overall = data?.overall;
  const isAbove = overall?.isAboveThreshold ?? true;
  const percentage = overall?.percentage ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#21273a] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#18C5D8] font-semibold">
              Student Attendance Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            My Attendance Record
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {data?.student.fullName} • Roll: <span className="font-mono text-slate-200">{data?.student.rollNumber}</span> • B.Tech {data?.student.branch} (Year {data?.student.year})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141824] border border-[#273043] hover:border-[#18C5D8]/60 text-xs font-semibold text-slate-300 hover:text-white transition shadow-xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#18C5D8]' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Records'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Overall Attendance Hero Card */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#5B20A0]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Percentage Display */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-[#101420] border border-[#1e2536] rounded-xl">
            <div className="text-[11px] font-mono uppercase font-bold text-gray-400 mb-1">
              Overall Cumulative Attendance
            </div>
            <div className="flex items-baseline gap-1 my-2">
              <span
                className={`text-5xl font-black font-mono tracking-tight ${
                  isAbove ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {percentage}%
              </span>
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
                isAbove
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
              }`}
            >
              {isAbove ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              <span>{isAbove ? 'Above 75% Threshold' : 'Shortage Alert (< 75%)'}</span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-2">
              Mandatory Minimum Requirement: 75.0%
            </div>
          </div>

          {/* Breakdown & Analytics Insight */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#101420] border border-[#1e2536] rounded-xl p-3.5 text-center">
                <div className="text-[10px] font-mono uppercase text-gray-400">Total Classes</div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {overall?.total ?? 0}
                </div>
              </div>
              <div className="bg-[#101420] border border-[#1e2536] rounded-xl p-3.5 text-center">
                <div className="text-[10px] font-mono uppercase text-emerald-400">Attended</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {overall?.present ?? 0}
                </div>
              </div>
              <div className="bg-[#101420] border border-[#1e2536] rounded-xl p-3.5 text-center">
                <div className="text-[10px] font-mono uppercase text-rose-400">Missed</div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                  {overall?.absent ?? 0}
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400 mb-1.5">
                <span>Semester Attendance Progress</span>
                <span className="font-bold text-gray-200">{percentage}% / 100%</span>
              </div>
              <div className="w-full h-3 bg-[#181d2a] rounded-full overflow-hidden border border-[#232c3f] relative">
                {/* 75% benchmark marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
                  style={{ left: '75%' }}
                  title="75% Mandatory Requirement"
                />
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isAbove ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>0%</span>
                <span className="text-[#18C5D8]">▲ 75% Minimum Target</span>
                <span>100%</span>
              </div>
            </div>

            {/* Smart Advisory Banner */}
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                isAbove
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
              }`}
            >
              <TrendingUp size={16} className={`shrink-0 mt-0.5 ${isAbove ? 'text-emerald-400' : 'text-rose-400'}`} />
              <div className="leading-relaxed">
                <span className="font-bold">{overall?.statusMessage}</span>{' '}
                <span className="text-gray-300">{overall?.insight}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Subject-wise Attendance Table */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-[#21273a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a2133] border border-[#2b354d] flex items-center justify-center text-[#18C5D8]">
              <BookOpen size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Subject-wise Attendance Breakdown
              </h2>
              <p className="text-[11px] text-gray-400">
                Detailed class counts and individual course eligibility status
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-gray-400 bg-[#1c2233] px-2.5 py-1 rounded-lg border border-[#293246]">
            {data?.records.length ?? 0} Courses
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0f121d] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#21273a]">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4 text-center">Total Classes</th>
                <th className="py-3 px-4 text-center text-emerald-400">Present</th>
                <th className="py-3 px-4 text-center text-rose-400">Absent</th>
                <th className="py-3 px-4 text-right">Percentage</th>
                <th className="py-3 px-4 text-right">Eligibility Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2538] text-gray-300">
              {data?.records && data.records.length > 0 ? (
                data.records.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#181e2e] transition group">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white group-hover:text-[#18C5D8] transition">
                        {sub.subjectName}
                      </div>
                      <div className="text-[11px] font-mono text-gray-400">{sub.subjectCode}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium">{sub.total}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                      {sub.present}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-400">
                      {sub.absent}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-sm">
                      <span className={sub.isAboveThreshold ? 'text-emerald-400' : 'text-rose-400'}>
                        {sub.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {sub.isAboveThreshold ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={11} />
                          Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={11} />
                          Attendance Shortage
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 text-xs">
                    No subject attendance records found for this academic semester.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Recent Attendance Sessions */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-[#21273a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a2133] border border-[#2b354d] flex items-center justify-center text-cyan-400">
              <Calendar size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Recent Attendance Sessions
              </h2>
              <p className="text-[11px] text-gray-400">
                Log of individual lectures and lecture attendance marks
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-gray-400">
            Read-Only Audit Trail
          </span>
        </div>

        <div className="divide-y divide-[#1e2538]">
          {data?.recentHistory && data.recentHistory.length > 0 ? (
            data.recentHistory.map((h) => {
              const formattedDate = new Date(h.date).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={h.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181e2e] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#192030] border border-[#252f44] flex flex-col items-center justify-center shrink-0 text-center font-mono">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">P</span>
                      <span className="text-xs font-bold text-white leading-none">{h.period}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {h.subjectName}
                        </span>
                        <span className="text-[10px] font-mono bg-[#1b2234] text-gray-300 px-1.5 py-0.5 rounded border border-[#28324a]">
                          {h.subjectCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                        <span className="font-mono text-gray-300">{formattedDate}</span>
                        <span>•</span>
                        <span>Period {h.period}</span>
                        {h.remarks && (
                          <>
                            <span>•</span>
                            <span className="italic text-gray-500">{h.remarks}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {getStatusBadge(h.status)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-500 text-xs">
              No recent session logs available yet.
            </div>
          )}
        </div>
      </div>

      {/* Security & Authenticity Policy Note */}
      <div className="p-4 rounded-xl bg-[#101420] border border-[#21283a] text-gray-400 text-xs flex items-center gap-3">
        <ShieldCheck size={20} className="text-[#18C5D8] shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-gray-200">Institutional Attendance Verification:</strong> Attendance
          is authoritatively recorded by assigned faculty members in accordance with university academic regulations.
          Students cannot alter records. For any discrepancy, contact your subject professor or the Academic Cell.
        </div>
      </div>
    </div>
  );
}
