'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatCard } from '@/components/cards/StatCard';
import { StatGridSkeleton, TableSkeleton } from '@/components/ui/SkeletonLoader';
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Users,
  TrendingUp,
  CheckSquare,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Calendar,
} from 'lucide-react';

interface SubjectInfo {
  id: string;
  code: string;
  name: string;
  branchCode: string;
  year: number;
  semester: number;
  section: string;
  faculty?: string;
}

interface StudentSubjectStat {
  studentId: string;
  rollNumber: string;
  fullName: string;
  phone?: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  percentage: number;
  isAboveThreshold: boolean;
}

interface SubjectReportResponse {
  subject: SubjectInfo;
  summary: {
    totalClasses: number;
    totalStudents: number;
    present: number;
    absent: number;
    percentage: number;
    aboveThresholdCount: number;
    belowThresholdCount: number;
  };
  students: StudentSubjectStat[];
}

function SubjectAttendanceContent() {
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get('subjectId') || '';

  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const [reportData, setReportData] = useState<SubjectReportResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch available subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await apiRequest<any[]>('/faculty/subjects');
        if (res.success && res.data) {
          setSubjectsList(res.data);
          if (!selectedSubjectId && res.data.length > 0) {
            setSelectedSubjectId(res.data[0].id);
          }
        }
      } catch {
        setError('Failed to fetch assigned subjects list');
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

  // 2. Fetch report data for selected subject
  useEffect(() => {
    if (!selectedSubjectId) return;

    const fetchReport = async () => {
      setLoadingReport(true);
      setError(null);
      try {
        const url = `/faculty/attendance/subject/${selectedSubjectId}?search=${encodeURIComponent(
          searchQuery
        )}`;
        const res = await apiRequest<SubjectReportResponse>(url);
        if (res.success && res.data) {
          setReportData(res.data);
        } else {
          setError(res.error?.message || 'Unable to retrieve subject attendance data');
        }
      } catch {
        setError('Network error while retrieving subject report');
      } finally {
        setLoadingReport(false);
      }
    };

    const debounce = setTimeout(fetchReport, 200);
    return () => clearTimeout(debounce);
  }, [selectedSubjectId, searchQuery]);

  const summary = reportData?.summary;
  const subject = reportData?.subject;

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <BookOpen size={22} className="text-[#d4af37]" />
            <span>Subject-wise Attendance Statistics</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Analyze class-wide attendance rates, per-student attendance counts, and eligibility thresholds.
          </p>
        </div>

        {selectedSubjectId && (
          <div className="flex items-center gap-2">
            <Link
              href={`/faculty/attendance/take?subjectId=${selectedSubjectId}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-extrabold text-xs transition active:scale-95 shadow-md"
            >
              <CheckSquare size={14} />
              <span>Take Attendance</span>
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Subject Selector Tabs */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl p-4 shadow-xl">
        <label className="block text-xs uppercase font-mono font-bold text-gray-400 mb-2">
          Select Subject / Course:
        </label>
        <div className="flex flex-wrap gap-2">
          {subjectsList.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition active:scale-95 ${
                  isSelected
                    ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-bold'
                    : 'bg-[#101420] text-gray-300 hover:text-white hover:bg-[#182030] border border-[#232c40]'
                }`}
              >
                <span>{sub.code}</span>
                <span className="opacity-80 font-normal">({sub.name})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Summary KPI Cards */}
      {loadingReport ? (
        <StatGridSkeleton />
      ) : summary && subject ? (
        <>
          <div className="bg-[#141824] border border-[#232a3d] rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#21273a] pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-white">{subject.name}</span>
                  <span className="text-xs font-mono bg-[#1c2233] text-[#d4af37] px-2 py-0.5 rounded border border-[#2c374e]">
                    {subject.code}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1 font-mono">
                  B.Tech {subject.branchCode} • Year {subject.year} • Semester {subject.semester} (Section {subject.section})
                  {subject.faculty ? ` • Faculty: ${subject.faculty}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <div className="text-gray-400 text-[10px] uppercase">Attendance Rate</div>
                  <div
                    className={`text-xl font-black ${
                      summary.percentage >= 75 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {summary.percentage}%
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-xl bg-[#101420] border border-[#1e2536] text-center font-mono">
                <div className="text-[10px] uppercase text-gray-400">Total Classes</div>
                <div className="text-xl font-bold text-white mt-1">{summary.totalClasses}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#101420] border border-[#1e2536] text-center font-mono">
                <div className="text-[10px] uppercase text-gray-400">Enrolled Students</div>
                <div className="text-xl font-bold text-white mt-1">{summary.totalStudents}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center font-mono">
                <div className="text-[10px] uppercase text-emerald-400">Eligible (≥ 75%)</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {summary.aboveThresholdCount}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-center font-mono">
                <div className="text-[10px] uppercase text-rose-400">Shortage (&lt; 75%)</div>
                <div className="text-xl font-bold text-rose-400 mt-1">
                  {summary.belowThresholdCount}
                </div>
              </div>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="bg-[#141824] border border-[#232a3d] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-[#21273a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Student Attendance Breakdown
                </h2>
                <p className="text-[11px] text-gray-400">
                  Individual student attendance counts for {subject.name}
                </p>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[200px] sm:min-w-[260px]">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or roll number..."
                  className="w-full bg-[#101420] border border-[#262f44] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0f121d] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#21273a]">
                  <tr>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4 text-center text-emerald-400">Present</th>
                    <th className="py-3 px-4 text-center text-rose-400">Absent</th>
                    <th className="py-3 px-4 text-center">Total Classes</th>
                    <th className="py-3 px-4 text-right">Percentage</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2538] text-gray-300">
                  {reportData.students && reportData.students.length > 0 ? (
                    reportData.students.map((st) => (
                      <tr key={st.studentId} className="hover:bg-[#181e2e] transition group">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          {st.rollNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white group-hover:text-[#d4af37] transition">
                            {st.fullName}
                          </div>
                          {st.phone && (
                            <div className="text-[10px] font-mono text-gray-500">{st.phone}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                          {st.present}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-400">
                          {st.absent}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-gray-400">
                          {st.total}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm">
                          <span className={st.isAboveThreshold ? 'text-emerald-400' : 'text-rose-400'}>
                            {st.percentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {st.isAboveThreshold ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={11} />
                              Eligible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full">
                              <AlertTriangle size={11} />
                              Shortage
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-500 text-xs">
                        No students found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function SubjectAttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400 text-xs font-mono">Loading subject reports...</div>}>
      <SubjectAttendanceContent />
    </Suspense>
  );
}
