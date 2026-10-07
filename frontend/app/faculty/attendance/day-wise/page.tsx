'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatGridSkeleton, TableSkeleton } from '@/components/ui/SkeletonLoader';
import {
  Calendar,
  CheckSquare,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Eye,
  Edit3,
  RefreshCw,
  AlertCircle,
  BookOpen,
  X,
} from 'lucide-react';

interface DaySessionItem {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  classLabel: string;
  section: string;
  period: number;
  topic?: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  totalStudents: number;
  percentage: number;
  teacherName: string;
}

interface DayWiseResponse {
  date: string;
  totalSessions: number;
  totalPresent: number;
  totalAbsent: number;
  sessions: DaySessionItem[];
}

function DayWiseAttendanceContent() {
  const searchParams = useSearchParams();
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [data, setData] = useState<DayWiseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Student list modal state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchDayWise = async (dateStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<DayWiseResponse>(`/faculty/attendance/day-wise?date=${encodeURIComponent(dateStr)}`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Failed to fetch day-wise attendance');
      }
    } catch {
      setError('Network communication error while loading day attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayWise(selectedDate);
  }, [selectedDate]);

  const openStudentListModal = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setLoadingDetail(true);
    try {
      const res = await apiRequest<any>(`/faculty/attendance/session/${sessionId}`);
      if (res.success && res.data) {
        setSessionDetail(res.data);
      }
    } catch {
      setError('Unable to fetch detailed student list');
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeStudentListModal = () => {
    setActiveSessionId(null);
    setSessionDetail(null);
  };

  const formattedDateTitle = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#21273a] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/faculty/dashboard"
              className="text-[11px] font-mono uppercase tracking-wider text-gray-400 hover:text-[#d4af37] transition flex items-center gap-1"
            >
              <ArrowLeft size={12} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Calendar size={22} className="text-[#d4af37]" />
            <span>Day-wise Attendance Logs</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Inspect all lectures, attendance counts, and complete student records for any selected date.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/faculty/attendance/take?date=${selectedDate}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-extrabold text-xs transition active:scale-95 shadow-md"
          >
            <CheckSquare size={14} />
            <span>Take Attendance</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Date Selector & Day Navigation Controls */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs uppercase font-mono font-bold text-gray-400 mb-1">
              Select Calendar Date:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#101420] border border-[#262f44] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37] transition font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 rounded-xl bg-[#1a2133] hover:bg-[#232d44] border border-[#2a364e] text-xs font-semibold text-gray-300 hover:text-white transition"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-gray-400 block text-[10px] uppercase">Viewing Schedule for:</span>
            <span className="text-sm font-bold text-[#d4af37]">{formattedDateTitle}</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#141824] border border-[#232a3d] text-center font-mono">
          <div className="text-[10px] uppercase text-gray-400">Total Lectures</div>
          <div className="text-2xl font-black text-white mt-1">{data?.totalSessions ?? 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#141824] border border-[#232a3d] text-center font-mono">
          <div className="text-[10px] uppercase text-emerald-400">Total Present</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {data?.totalPresent ?? 0}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#141824] border border-[#232a3d] text-center font-mono">
          <div className="text-[10px] uppercase text-rose-400">Total Absent</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{data?.totalAbsent ?? 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#141824] border border-[#232a3d] text-center font-mono">
          <div className="text-[10px] uppercase text-[#d4af37]">Attendance Rate</div>
          <div className="text-2xl font-black text-[#d4af37] mt-1">
            {data && data.totalPresent + data.totalAbsent > 0
              ? `${Math.round((data.totalPresent / (data.totalPresent + data.totalAbsent)) * 100)}%`
              : '0%'}
          </div>
        </div>
      </div>

      {/* Day Sessions Table */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-[#21273a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a2133] border border-[#2b354d] flex items-center justify-center text-[#d4af37]">
              <CheckSquare size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Lectures Conducted on {formattedDateTitle}
              </h2>
              <p className="text-[11px] text-gray-400">
                Period-wise attendance summary and student verification
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-gray-400 bg-[#1c2233] px-2.5 py-1 rounded-lg border border-[#293246]">
            {data?.sessions.length ?? 0} Sessions
          </span>
        </div>

        {loading ? (
          <div className="p-8">
            <TableSkeleton rows={4} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f121d] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#21273a]">
                <tr>
                  <th className="py-3 px-4 w-24">Period</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Class &amp; Section</th>
                  <th className="py-3 px-4 text-center text-emerald-400">Present</th>
                  <th className="py-3 px-4 text-center text-rose-400">Absent</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2538] text-gray-300">
                {data?.sessions && data.sessions.length > 0 ? (
                  data.sessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-[#181e2e] transition group">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <span className="px-2 py-1 rounded bg-[#1a2133] border border-[#2c374e] text-xs">
                          Period {sess.period}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white group-hover:text-[#d4af37] transition">
                          {sess.subjectName}
                        </div>
                        <div className="text-[11px] font-mono text-gray-400">{sess.subjectCode}</div>
                        {sess.topic && (
                          <div className="text-[10px] text-gray-500 italic mt-0.5">
                            Topic: {sess.topic}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-gray-200">{sess.classLabel}</div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          Section {sess.section} • {sess.teacherName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                        {sess.presentCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-400">
                        {sess.absentCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span className={sess.percentage >= 75 ? 'text-emerald-400' : 'text-rose-400'}>
                          {sess.percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openStudentListModal(sess.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a2133] hover:bg-[#252f48] border border-[#2d3850] text-[11px] font-semibold text-cyan-300 transition"
                          >
                            <Eye size={12} />
                            <span>View Students</span>
                          </button>
                          <Link
                            href={`/faculty/attendance/take?sessionId=${sess.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a2133] hover:bg-[#252f48] border border-[#2d3850] text-[11px] font-semibold text-gray-300 hover:text-white transition"
                          >
                            <Edit3 size={12} />
                            <span>Edit</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500 text-xs">
                      No attendance sessions recorded for {formattedDateTitle}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Student List Modal */}
      {activeSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#141824] border border-[#2b354d] w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#21273a] pb-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Student Attendance Roster</span>
                  {sessionDetail && (
                    <span className="text-xs font-mono text-[#d4af37] bg-[#1a2133] px-2 py-0.5 rounded border border-[#2c374e]">
                      {sessionDetail.session.subjectCode} • Period {sessionDetail.session.period}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {sessionDetail?.session.subjectName} ({sessionDetail?.session.branchCode}, Sec{' '}
                  {sessionDetail?.session.section})
                </p>
              </div>
              <button
                type="button"
                onClick={closeStudentListModal}
                className="p-1.5 rounded-lg bg-[#1a2133] border border-[#2d3852] text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-8">
                <TableSkeleton rows={4} />
              </div>
            ) : sessionDetail ? (
              <>
                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-2 text-center font-mono py-1">
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    Present: {sessionDetail.stats.present}
                  </div>
                  <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs font-bold">
                    Absent: {sessionDetail.stats.absent}
                  </div>
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs font-bold">
                    Late: {sessionDetail.stats.late}
                  </div>
                  <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-400 text-xs font-bold">
                    Rate: {sessionDetail.stats.percentage}%
                  </div>
                </div>

                {/* Student Table */}
                <div className="overflow-y-auto flex-1 border border-[#21273a] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0f121d] text-gray-400 uppercase font-mono text-[10px] tracking-wider sticky top-0 border-b border-[#21273a]">
                      <tr>
                        <th className="py-2.5 px-3">Roll No</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2538] text-gray-300">
                      {sessionDetail.records.map((r: any) => (
                        <tr key={r.id} className="hover:bg-[#181e2e]">
                          <td className="py-2.5 px-3 font-mono font-bold text-white">
                            {r.rollNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-gray-200">
                            {r.fullName}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {r.status === 'PRESENT' && (
                              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                Present
                              </span>
                            )}
                            {r.status === 'ABSENT' && (
                              <span className="text-[11px] font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full">
                                Absent
                              </span>
                            )}
                            {r.status === 'LATE' && (
                              <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                Late
                              </span>
                            )}
                            {r.status === 'EXCUSED' && (
                              <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-950/60 border border-blue-500/30 px-2 py-0.5 rounded-full">
                                Excused
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-500 italic text-[11px]">
                            {r.remarks || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#21273a]">
                  <span className="text-[11px] text-gray-400">
                    Recorded by <strong className="text-gray-200">{sessionDetail.session.teacherName}</strong>
                  </span>
                  <Link
                    href={`/faculty/attendance/take?sessionId=${sessionDetail.session.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#d4af37] text-black font-extrabold text-xs transition active:scale-95"
                  >
                    <Edit3 size={13} />
                    <span>Edit Session</span>
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DayWiseAttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400 text-xs font-mono">Loading day attendance...</div>}>
      <DayWiseAttendanceContent />
    </Suspense>
  );
}
