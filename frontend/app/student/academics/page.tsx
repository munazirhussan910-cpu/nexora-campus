'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertTriangle,
  Bell,
  BookOpen,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  present: number;
  total: number;
  percentage: number;
  isAboveThreshold: boolean;
}

interface AttendanceData {
  student: {
    fullName: string;
    rollNumber: string;
    branch: string;
    year: number;
  };
  overall: {
    present: number;
    total: number;
    percentage: number;
    threshold: number;
    isAboveThreshold: boolean;
    statusMessage: string;
    insight: string;
  };
  records: AttendanceRecord[];
}

interface TimetableItem {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  timeDisplay: string;
  subjectCode: string;
  subjectName: string;
  room: string;
  faculty: string;
}

interface TimetableData {
  studentCohort: {
    branchCode: string;
    branchName: string;
    year: number;
  };
  today: string;
  todayClasses: TimetableItem[];
  weekly: Record<string, TimetableItem[]>;
}

interface ClassUpdate {
  id: string;
  rawTitle: string;
  subject: string;
  headline: string;
  content: string;
  priority: string;
  publishedAt: string;
  author: string;
  authorRole: string;
}

export default function StudentAcademicHubPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'timetable' | 'updates'>('attendance');
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [updates, setUpdates] = useState<ClassUpdate[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('TODAY');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [attRes, ttRes, updRes] = await Promise.all([
        apiRequest<AttendanceData>('/student/attendance', { useCache: !isManualRefresh }),
        apiRequest<TimetableData>('/student/timetable', { useCache: !isManualRefresh }),
        apiRequest<ClassUpdate[]>('/student/class-updates', { useCache: !isManualRefresh }),
      ]);

      if (attRes.success && attRes.data) {
        setAttendance(attRes.data);
      }
      if (ttRes.success && ttRes.data) {
        setTimetable(ttRes.data);
      }
      if (updRes.success && updRes.data) {
        setUpdates(updRes.data);
      }
    } catch (e) {
      console.error('Failed to load academic data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const daysList = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  const displayedTimetable =
    timetable &&
    (selectedDay === 'TODAY'
      ? timetable.todayClasses.length > 0
        ? timetable.todayClasses
        : timetable.weekly['MONDAY'] || []
      : timetable.weekly[selectedDay] || []);

  const currentDayLabel =
    selectedDay === 'TODAY'
      ? `TODAY — ${timetable?.today || 'MONDAY'}`
      : selectedDay;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Academic Hub Overview */}
      <div className="relative overflow-hidden bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-[#d4af37]/40 text-[#d4af37] text-[10px] font-mono font-bold uppercase tracking-wider mb-2.5 shadow-xs">
              <GraduationCap size={13} className="text-[#d4af37]" />
              <span>BPUT PS07 • Academic Hub</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Student Academic Overview
            </h1>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-400 mt-2 font-mono">
              <span className="text-gray-300">
                Cohort: <strong className="text-white font-bold">{attendance?.student.branch || 'CSE'} — Year {attendance?.student.year || 2}</strong>
              </span>
              <span className="text-gray-600">•</span>
              <span>
                Roll: <strong className="text-gray-300">{attendance?.student.rollNumber || '220101048'}</strong>
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-emerald-400 font-semibold">Active Semester</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171d2b] hover:bg-[#202738] border border-[#2b364d] text-gray-300 hover:text-white text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
              title="Refresh academic data"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#d4af37]' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-5 border-t border-[#1f2638] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'attendance'
                ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20'
                : 'bg-[#161b29] text-gray-300 hover:text-white hover:bg-[#1c2233] border border-[#232b3d]'
            }`}
          >
            <TrendingUp size={14} />
            <span>Attendance</span>
            {attendance && (
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === 'attendance'
                    ? 'bg-black/20 text-black'
                    : 'bg-[#222b3f] text-[#d4af37]'
                }`}
              >
                {attendance.overall.percentage}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('timetable')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'timetable'
                ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20'
                : 'bg-[#161b29] text-gray-300 hover:text-white hover:bg-[#1c2233] border border-[#232b3d]'
            }`}
          >
            <Calendar size={14} />
            <span>Timetable</span>
            {timetable && (
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === 'timetable'
                    ? 'bg-black/20 text-black'
                    : 'bg-[#222b3f] text-cyan-300'
                }`}
              >
                {timetable.todayClasses.length} Today
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('updates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'updates'
                ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20'
                : 'bg-[#161b29] text-gray-300 hover:text-white hover:bg-[#1c2233] border border-[#232b3d]'
            }`}
          >
            <Bell size={14} />
            <span>Class Updates</span>
            {updates.length > 0 && (
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === 'updates'
                    ? 'bg-black/20 text-black'
                    : 'bg-[#222b3f] text-amber-300'
                }`}
              >
                {updates.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-40 rounded-2xl bg-[#121624] border border-[#232b3f] animate-pulse" />
          <div className="h-64 rounded-2xl bg-[#121624] border border-[#232b3f] animate-pulse" />
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* TAB 1: ATTENDANCE VISIBILITY                             */}
          {/* ======================================================== */}
          {activeTab === 'attendance' && attendance && (
            <div className="space-y-6">
              {/* Overall Attendance Summary Banner */}
              <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="text-[11px] uppercase tracking-wider font-mono font-bold text-gray-400">
                      Overall Academic Attendance
                    </div>

                    <div className="flex items-baseline gap-4">
                      <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                        {attendance.overall.percentage}%
                      </div>
                      <div className="text-sm font-mono text-gray-400">
                        <strong className="text-white font-bold">{attendance.overall.present}</strong> /{' '}
                        {attendance.overall.total} classes attended
                      </div>
                    </div>

                    {/* Threshold insight badge */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          attendance.overall.isAboveThreshold
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-600/60'
                        }`}
                      >
                        {attendance.overall.isAboveThreshold ? (
                          <CheckCircle2 size={13} className="text-emerald-400" />
                        ) : (
                          <AlertTriangle size={13} className="text-rose-400" />
                        )}
                        <span>{attendance.overall.statusMessage}</span>
                      </div>

                      <div className="text-xs text-gray-400 font-mono">
                        (Mandatory threshold: <strong>75%</strong>)
                      </div>
                    </div>

                    {/* Attendance Margin Insight */}
                    <div className="text-xs text-gray-300 bg-[#161a29] border border-[#242b3e] rounded-xl p-3 flex items-start gap-2.5 max-w-2xl">
                      <Sparkles size={15} className="text-[#d4af37] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Attendance Insight: </span>
                        <span>{attendance.overall.insight}</span>
                      </div>
                    </div>
                  </div>

                  {/* Circular/Linear Progress Visual */}
                  <div className="flex flex-col items-center justify-center p-4 bg-[#161b2a] border border-[#252e42] rounded-2xl shrink-0 w-full md:w-56 text-center">
                    <div className="text-xs text-gray-400 uppercase font-mono font-bold mb-2">
                      Semester Goal: 75%+
                    </div>
                    <div className="w-full bg-[#202738] rounded-full h-3 overflow-hidden border border-[#2b354b]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          attendance.overall.isAboveThreshold
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-rose-500 to-amber-400'
                        }`}
                        style={{ width: `${Math.min(100, attendance.overall.percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between w-full text-[10px] text-gray-500 font-mono mt-1.5">
                      <span>0%</span>
                      <span className="text-[#d4af37] font-bold">75% Req</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15">
                <div className="flex items-center justify-between border-b border-[#21273a] pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#182030] border border-[#28354f] text-[#d4af37] flex items-center justify-center">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Subject-Wise Attendance Breakdown
                      </h2>
                      <p className="text-[11px] text-gray-400">
                        Continuous attendance logs synchronized with university academic records
                      </p>
                    </div>
                  </div>
                </div>

                {attendance.records.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    No attendance records logged for current term yet.
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#21273a] text-gray-400 uppercase font-mono text-[11px]">
                            <th className="py-3 px-3">Subject</th>
                            <th className="py-3 px-3 text-center">Code</th>
                            <th className="py-3 px-3 text-right">Present</th>
                            <th className="py-3 px-3 text-right">Total</th>
                            <th className="py-3 px-4 text-right">Percentage</th>
                            <th className="py-3 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e2436]">
                          {attendance.records.map((r) => (
                            <tr key={r.id} className="hover:bg-[#161a29] transition">
                              <td className="py-3.5 px-3 font-semibold text-gray-100">
                                {r.subjectName}
                              </td>
                              <td className="py-3.5 px-3 text-center font-mono text-gray-400">
                                {r.subjectCode}
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono text-white font-bold">
                                {r.present}
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono text-gray-400">
                                {r.total}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold">
                                <div className="inline-flex items-center gap-2 justify-end">
                                  <span
                                    className={
                                      r.isAboveThreshold ? 'text-emerald-400' : 'text-amber-400'
                                    }
                                  >
                                    {r.percentage}%
                                  </span>
                                  <div className="w-16 bg-[#202738] rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        r.isAboveThreshold ? 'bg-emerald-400' : 'bg-amber-400'
                                      }`}
                                      style={{ width: `${Math.min(100, r.percentage)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                    r.isAboveThreshold
                                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                                      : 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                                  }`}
                                >
                                  {r.isAboveThreshold ? 'Eligible' : 'At Risk'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card List View */}
                    <div className="sm:hidden space-y-3">
                      {attendance.records.map((r) => (
                        <div
                          key={r.id}
                          className="p-3.5 rounded-xl bg-[#161a29] border border-[#242b3e] space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-gray-100 text-xs">
                                {r.subjectName}
                              </div>
                              <div className="text-[10px] font-mono text-gray-400">
                                {r.subjectCode}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                r.isAboveThreshold
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                                  : 'bg-amber-950 text-amber-300 border border-amber-600/50'
                              }`}
                            >
                              {r.isAboveThreshold ? 'Eligible' : 'At Risk'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1f2638]">
                            <span className="text-gray-400 text-[11px] font-mono">
                              Attended: <strong className="text-white">{r.present}</strong> / {r.total}
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                r.isAboveThreshold ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {r.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: TIMETABLE                                         */}
          {/* ======================================================== */}
          {activeTab === 'timetable' && timetable && (
            <div className="space-y-6">
              {/* Day Filter Pills */}
              <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-black/15">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase font-mono font-bold text-gray-400">
                      Class Schedule
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Weekly Academic Timetable
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setSelectedDay('TODAY')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        selectedDay === 'TODAY'
                          ? 'bg-[#d4af37] text-black shadow-sm'
                          : 'bg-[#181e2d] text-gray-300 hover:text-white border border-[#263045]'
                      }`}
                    >
                      Today ({timetable.today})
                    </button>
                    {daysList.map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDay(d)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          selectedDay === d
                            ? 'bg-[#d4af37] text-black shadow-sm'
                            : 'bg-[#181e2d] text-gray-300 hover:text-white border border-[#263045]'
                        }`}
                      >
                        {d.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Day's Schedule List */}
              <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15 space-y-4">
                <div className="flex items-center justify-between border-b border-[#21273a] pb-3">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#d4af37] uppercase font-mono tracking-wider">
                    <Calendar size={14} />
                    <span>{currentDayLabel}</span>
                  </div>
                  <div className="text-xs font-mono text-gray-400">
                    {displayedTimetable ? displayedTimetable.length : 0} scheduled classes
                  </div>
                </div>

                {!displayedTimetable || displayedTimetable.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#161a28] border border-[#242c3f] flex items-center justify-center text-gray-500">
                      <Clock size={18} />
                    </div>
                    <div>No lectures scheduled for {currentDayLabel}.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedTimetable.map((cls, idx) => (
                      <div
                        key={cls.id || idx}
                        className="bg-[#161a29] border border-[#232b3f] hover:border-[#333d59] rounded-xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          {/* Time Badge */}
                          <div className="px-3 py-2 rounded-xl bg-[#1b2234] border border-[#2b374f] font-mono text-xs font-bold text-[#d4af37] shrink-0 text-center min-w-[110px]">
                            <div className="flex items-center justify-center gap-1">
                              <Clock size={12} className="text-[#d4af37]" />
                              <span>{cls.timeDisplay}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white group-hover:text-[#d4af37] transition">
                                {cls.subjectName}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e2538] text-gray-300 border border-[#2e374f]">
                                {cls.subjectCode}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 font-mono">
                              <span className="flex items-center gap-1 text-cyan-300">
                                <MapPin size={11} className="text-cyan-400" />
                                {cls.room}
                              </span>
                              <span className="text-gray-600">•</span>
                              <span className="flex items-center gap-1 text-gray-300">
                                <User size={11} className="text-gray-500" />
                                {cls.faculty}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 text-xs font-mono text-gray-500">
                          <span className="px-2 py-0.5 rounded bg-[#1f2638] text-gray-300 text-[11px]">
                            CSE Year 2
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CLASS UPDATES (NOTICE SYSTEM REUSE)                */}
          {/* ======================================================== */}
          {activeTab === 'updates' && (
            <div className="space-y-6">
              <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/15">
                <div className="flex items-center justify-between border-b border-[#21273a] pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#182030] border border-[#28354f] text-[#d4af37] flex items-center justify-center">
                      <Bell size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Academic &amp; Class Updates
                      </h2>
                      <p className="text-[11px] text-gray-400">
                        Real-time lecture adjustments, classroom changes, and faculty announcements
                      </p>
                    </div>
                  </div>
                </div>

                {updates.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400">
                    No active class updates for your cohort at this time.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {updates.map((upd) => (
                      <div
                        key={upd.id}
                        className="p-4 sm:p-5 rounded-2xl bg-[#161a29] border border-[#232b3f] hover:border-[#38435f] transition space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#1d263b] text-[#d4af37] border border-[#d4af37]/30">
                              {upd.subject}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                                upd.priority === 'URGENT'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-600'
                                  : 'bg-blue-950 text-blue-300 border border-blue-700/50'
                              }`}
                            >
                              {upd.priority}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono text-gray-400">
                            {new Date(upd.publishedAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            •{' '}
                            {new Date(upd.publishedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {upd.headline}
                        </h3>

                        <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
                          {upd.content}
                        </p>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#1f2638] text-[11px] font-mono text-gray-400">
                          <span>Posted by:</span>
                          <strong className="text-gray-200">{upd.author}</strong>
                          <span className="text-gray-600">•</span>
                          <span>{upd.authorRole}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
