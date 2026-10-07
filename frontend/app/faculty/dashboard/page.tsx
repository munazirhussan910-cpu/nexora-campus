'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatGridSkeleton, TableSkeleton } from '@/components/ui/SkeletonLoader';
import {
  GraduationCap,
  CheckSquare,
  Clock,
  Calendar,
  Users,
  BookOpen,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  PlusCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface FacultyDashboardData {
  teacher: {
    id: string;
    name: string;
    email: string;
    department: string;
    employeeId?: string;
    role: string;
  };
  today: {
    formattedDate: string;
    rawDate: string;
    dayName: string;
  };
  stats: {
    totalAssignedSubjects: number;
    totalClassesConducted: number;
    todaySessionsCount: number;
    averageAttendanceRate: number;
    totalStudentsTaught: number;
  };
  assignedSubjects: Array<{
    id: string;
    code: string;
    name: string;
    branch: string;
    year: number;
    semester: number;
    section: string;
    faculty?: string;
    sessionsCount: number;
  }>;
  assignedClasses: Array<{
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    branchId: string;
    branchCode: string;
    year: number;
    semester: number;
    section: string;
    label: string;
  }>;
  todaySchedule: Array<{
    id: string;
    period: number;
    startTime: string;
    endTime: string;
    room: string;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    branch: string;
    year: number;
    section: string;
    isAttendanceTaken: boolean;
    sessionId: string | null;
  }>;
  recentSessions: Array<{
    id: string;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    classLabel: string;
    branch: string;
    year: number;
    section: string;
    date: string;
    period: number;
    topic?: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    percentage: number;
    teacherName: string;
  }>;
}

export default function FacultyDashboardPage() {
  const [data, setData] = useState<FacultyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await apiRequest<FacultyDashboardData>('/faculty/dashboard');
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error?.message || 'Failed to load faculty dashboard data');
      }
    } catch {
      setError('Network communication error while connecting to faculty service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-[#181d2a] rounded-lg animate-pulse" />
          <div className="h-8 w-32 bg-[#181d2a] rounded-lg animate-pulse" />
        </div>
        <StatGridSkeleton />
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#21273a] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4af37] font-semibold">
              Academic Faculty Operations
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Teacher Dashboard
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
            <span className="font-semibold text-gray-200">{data?.teacher.name}</span>
            <span>•</span>
            <span>{data?.teacher.department}</span>
            <span>•</span>
            <span className="font-mono text-[#d4af37] bg-[#1a2133] px-2 py-0.5 rounded border border-[#2b354d]">
              {data?.today.formattedDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-[#141824] border border-[#262f44] hover:border-[#d4af37]/60 text-gray-400 hover:text-white transition shadow-xs"
            title="Refresh Dashboard"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-[#d4af37]' : ''} />
          </button>

          <Link
            href="/faculty/attendance/take"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl shadow-lg bg-[#d4af37] hover:bg-[#e4c257] text-black font-extrabold text-xs transition active:scale-95 cursor-pointer"
          >
            <CheckSquare size={16} />
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

      {/* 2. Statistical KPI Cockpit */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Assigned Subjects"
          value={data?.stats.totalAssignedSubjects ?? 0}
          icon={BookOpen}
          color="amber"
          trend="Active Courses"
        />
        <StatCard
          title="Classes Conducted"
          value={data?.stats.totalClassesConducted ?? 0}
          icon={CheckSquare}
          color="blue"
          trend="Total Recorded"
        />
        <StatCard
          title="Today's Sessions"
          value={data?.stats.todaySessionsCount ?? 0}
          icon={Calendar}
          color="emerald"
          trend={`${data?.todaySchedule.length ?? 0} Scheduled`}
        />
        <StatCard
          title="Average Attendance"
          value={`${data?.stats.averageAttendanceRate ?? 85.5}%`}
          icon={TrendingUp}
          color="purple"
          trend="Cohort Rate"
        />
        <StatCard
          title="Students Taught"
          value={data?.stats.totalStudentsTaught ?? 0}
          icon={Users}
          color="cyan"
          trend="Enrolled Cohort"
        />
      </div>

      {/* 3. Today's Lectures & Attendance Status */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-[#21273a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a2133] border border-[#2b354d] flex items-center justify-center text-[#d4af37]">
              <Clock size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Today&apos;s Lecture Schedule &amp; Attendance Status
              </h2>
              <p className="text-[11px] text-gray-400">
                Scheduled periods for {data?.today.dayName}, {data?.today.formattedDate}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-gray-400 bg-[#1c2233] px-2.5 py-1 rounded-lg border border-[#293246]">
            {data?.todaySchedule.length ?? 0} Lectures Today
          </span>
        </div>

        <div className="divide-y divide-[#1e2538]">
          {data?.todaySchedule && data.todaySchedule.length > 0 ? (
            data.todaySchedule.map((slot) => (
              <div
                key={slot.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181e2e] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#192030] border border-[#262f44] flex flex-col items-center justify-center shrink-0 text-center font-mono">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Period</span>
                    <span className="text-sm font-extrabold text-white leading-none">{slot.period}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-sm">
                        {slot.subjectName}
                      </span>
                      <span className="text-[10px] font-mono bg-[#1b2234] text-gray-300 px-1.5 py-0.5 rounded border border-[#28324a]">
                        {slot.subjectCode}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                      <span className="font-mono text-gray-300">
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <span>•</span>
                      <span>Room {slot.room}</span>
                      <span>•</span>
                      <span>B.Tech {slot.branch} (Yr {slot.year}, Sec {slot.section})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center">
                  {slot.isAttendanceTaken ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                        <CheckCircle2 size={13} />
                        <span>Submitted</span>
                      </span>
                      {slot.sessionId && (
                        <Link
                          href={`/faculty/attendance/take?sessionId=${slot.sessionId}`}
                          className="px-2.5 py-1 rounded-lg bg-[#1a2133] hover:bg-[#222b40] border border-[#2d3750] text-[11px] font-semibold text-gray-300 hover:text-white transition"
                        >
                          Review / Edit
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-amber-950/80 border border-amber-500/40 text-amber-300">
                        <Clock size={12} />
                        <span>Pending</span>
                      </span>
                      <Link
                        href={`/faculty/attendance/take?subjectId=${slot.subjectId}&period=${slot.period}&date=${data.today.rawDate}&section=${slot.section}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#d4af37] hover:bg-[#e4c257] text-black font-bold text-xs transition active:scale-95 shadow-xs"
                      >
                        <CheckSquare size={13} />
                        <span>Take Attendance</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 text-xs">
              No classes scheduled for today in the academic timetable.
            </div>
          )}
        </div>
      </div>

      {/* 4. Assigned Subjects & Classes Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Subjects */}
        <div className="bg-[#141824] border border-[#232a3d] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-[#21273a] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[#d4af37]" />
                <h3 className="text-sm font-bold text-white tracking-tight">Assigned Subjects</h3>
              </div>
              <Link
                href="/faculty/attendance/subjects"
                className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View Reports</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="space-y-2">
              {data?.assignedSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-xl bg-[#101420] border border-[#1e2536] flex items-center justify-between gap-3 hover:border-[#d4af37]/40 transition"
                >
                  <div>
                    <div className="font-bold text-white text-xs">{sub.name}</div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                      {sub.code} • B.Tech {sub.branch} • Sem {sub.semester} (Sec {sub.section})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-[#182030] text-gray-300 px-2 py-0.5 rounded border border-[#29344c]">
                      {sub.sessionsCount} sessions
                    </span>
                    <Link
                      href={`/faculty/attendance/take?subjectId=${sub.id}`}
                      className="p-1.5 rounded-lg bg-[#182030] hover:bg-[#232c40] text-[#d4af37] border border-[#2b3750] transition"
                      title="Take Attendance for this subject"
                    >
                      <CheckSquare size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e2536] text-[11px] text-gray-400 flex items-center justify-between">
            <span>Primary Faculty: <strong className="text-gray-200">{data?.teacher.name}</strong></span>
            <span className="font-mono text-[#d4af37]">Nexora Attendance Engine</span>
          </div>
        </div>

        {/* Assigned Classes / Cohorts */}
        <div className="bg-[#141824] border border-[#232a3d] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-[#21273a] pb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Assigned Classes &amp; Sections</h3>
              </div>
              <Link
                href="/faculty/attendance/day-wise"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Day-wise Log</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="space-y-2">
              {data?.assignedClasses.map((cls, idx) => (
                <div
                  key={`${cls.branchId}-${cls.year}-${cls.section}-${idx}`}
                  className="p-3 rounded-xl bg-[#101420] border border-[#1e2536] flex items-center justify-between gap-3 hover:border-cyan-500/40 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#182030] border border-[#29344c] flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
                      {cls.section}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">{cls.label}</div>
                      <div className="text-[11px] text-gray-400">{cls.subjectName} ({cls.subjectCode})</div>
                    </div>
                  </div>
                  <Link
                    href={`/faculty/attendance/take?subjectId=${cls.subjectId}&section=${cls.section}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#162030] hover:bg-[#1d2a40] text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition"
                  >
                    <span>Attend</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e2536] text-[11px] text-gray-400 flex items-center justify-between">
            <span>Minimum Class Attendance Threshold: <strong className="text-yellow-400">75%</strong></span>
            <Link href="/faculty/attendance/subjects" className="text-xs text-[#d4af37] hover:underline">
              Check Student Margins
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Recent Attendance Sessions Table */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-[#21273a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a2133] border border-[#2b354d] flex items-center justify-center text-emerald-400">
              <CheckSquare size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Recent Attendance Sessions
              </h2>
              <p className="text-[11px] text-gray-400">
                Log of newly recorded attendance lectures
              </p>
            </div>
          </div>
          <Link
            href="/faculty/attendance/history"
            className="text-xs text-[#d4af37] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Full History</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0f121d] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#21273a]">
              <tr>
                <th className="py-3 px-4">Date &amp; Period</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Class &amp; Section</th>
                <th className="py-3 px-4 text-center text-emerald-400">Present</th>
                <th className="py-3 px-4 text-center text-rose-400">Absent</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2538] text-gray-300">
              {data?.recentSessions && data.recentSessions.length > 0 ? (
                data.recentSessions.map((s) => {
                  const formattedDate = new Date(s.date).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={s.id} className="hover:bg-[#181e2e] transition group">
                      <td className="py-3 px-4">
                        <div className="font-mono text-white font-bold">{formattedDate}</div>
                        <div className="text-[11px] text-gray-400 font-mono">Period {s.period}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-[#d4af37] transition">
                          {s.subjectName}
                        </div>
                        <div className="text-[11px] font-mono text-gray-400">{s.subjectCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-200">{s.classLabel}</div>
                        <div className="text-[10px] text-gray-400 font-mono">Section {s.section}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                        {s.presentCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-400">
                        {s.absentCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={s.percentage >= 75 ? 'text-emerald-400' : 'text-rose-400'}>
                          {s.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/faculty/attendance/take?sessionId=${s.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a2133] hover:bg-[#252f48] border border-[#2d3850] text-[11px] font-semibold text-gray-200 transition"
                        >
                          <span>Review</span>
                          <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 text-xs">
                    No recent attendance sessions found. Click &quot;Take Attendance&quot; above to record your first lecture.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
