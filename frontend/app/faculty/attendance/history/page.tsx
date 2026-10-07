'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';
import {
  History,
  CheckSquare,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  Calendar,
  BookOpen,
  Edit3,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react';

interface HistorySessionItem {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  classLabel: string;
  section: string;
  date: string;
  period: number;
  topic?: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  percentage: number;
  teacherName: string;
}

interface HistoryResponse {
  sessions: HistorySessionItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

function HistoryContent() {
  const [sessions, setSessions] = useState<HistorySessionItem[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalCount: 0, totalPages: 1 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick View Modal
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch subjects for filter dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await apiRequest<any[]>('/faculty/subjects');
        if (res.success && res.data) {
          setSubjects(res.data);
        }
      } catch {
        // Non-blocking
      }
    };
    fetchSubjects();
  }, []);

  // Fetch sessions
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/faculty/attendance/history?page=${page}&limit=20`;
      if (selectedSubjectId) {
        url += `&subjectId=${encodeURIComponent(selectedSubjectId)}`;
      }
      const res = await apiRequest<HistoryResponse>(url);
      if (res.success && res.data) {
        setSessions(res.data.sessions);
        setPagination(res.data.pagination);
      } else {
        setError(res.error?.message || 'Failed to fetch attendance history');
      }
    } catch {
      setError('Network communication error while loading history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, selectedSubjectId]);

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

  const filteredSessions = sessions.filter((s) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase().trim();
    return (
      s.subjectName.toLowerCase().includes(q) ||
      s.subjectCode.toLowerCase().includes(q) ||
      (s.topic && s.topic.toLowerCase().includes(q)) ||
      s.section.toLowerCase().includes(q)
    );
  });

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
            <History size={22} className="text-[#d4af37]" />
            <span>Attendance History Log</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Audit trail of all recorded attendance sessions across your courses and cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/faculty/attendance/take"
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

      {/* Filters Bar */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Filter */}
          <div className="min-w-[200px]">
            <label className="block text-[10px] uppercase font-mono font-bold text-gray-400 mb-1">
              Filter by Course:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#101420] border border-[#262f44] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37] transition font-medium"
            >
              <option value="">All Assigned Courses</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} — {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div className="min-w-[220px]">
            <label className="block text-[10px] uppercase font-mono font-bold text-gray-400 mb-1">
              Search Topics or Sections:
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2 text-gray-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search topic or keyword..."
                className="w-full bg-[#101420] border border-[#262f44] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
              />
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-gray-400 self-end md:self-center">
          Showing <span className="font-bold text-white">{filteredSessions.length}</span> of{' '}
          <span className="font-bold text-[#d4af37]">{pagination.totalCount}</span> total sessions
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-[#21273a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a2133] border border-[#2b354d] flex items-center justify-center text-[#d4af37]">
              <History size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Recorded Attendance Sessions
              </h2>
              <p className="text-[11px] text-gray-400">
                Complete chronological log of attendance records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchHistory}
            className="p-1.5 rounded-lg bg-[#1a2133] border border-[#2a364e] text-gray-400 hover:text-white transition"
            title="Refresh history"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#d4af37]' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="p-8">
            <TableSkeleton rows={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f121d] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#21273a]">
                <tr>
                  <th className="py-3 px-4">Date &amp; Period</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Cohort &amp; Section</th>
                  <th className="py-3 px-4 text-center text-emerald-400">Present</th>
                  <th className="py-3 px-4 text-center text-rose-400">Absent</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2538] text-gray-300">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((s) => {
                    const formattedDate = new Date(s.date).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr key={s.id} className="hover:bg-[#181e2e] transition group">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-white">{formattedDate}</div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            Period {s.period}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white group-hover:text-[#d4af37] transition">
                            {s.subjectName}
                          </div>
                          <div className="text-[11px] font-mono text-gray-400">{s.subjectCode}</div>
                          {s.topic && (
                            <div className="text-[10px] text-gray-500 italic mt-0.5 max-w-xs truncate">
                              Topic: {s.topic}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-gray-200">{s.classLabel}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            Section {s.section}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                          {s.presentCount}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-400">
                          {s.absentCount}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          <span className={s.percentage >= 75 ? 'text-emerald-400' : 'text-rose-400'}>
                            {s.percentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openStudentListModal(s.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a2133] hover:bg-[#252f48] border border-[#2d3850] text-[11px] font-semibold text-cyan-300 transition"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            <Link
                              href={`/faculty/attendance/take?sessionId=${s.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a2133] hover:bg-[#252f48] border border-[#2d3850] text-[11px] font-semibold text-gray-300 hover:text-white transition"
                            >
                              <Edit3 size={12} />
                              <span>Edit</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500 text-xs">
                      No attendance sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#0f121d] border-t border-[#21273a] flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-[#141824] border border-[#273043] text-gray-300 hover:text-white disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg bg-[#141824] border border-[#273043] text-gray-300 hover:text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student List Modal */}
      {activeSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#141824] border border-[#2b354d] w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#21273a] pb-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Attendance Record Details</span>
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
                onClick={() => {
                  setActiveSessionId(null);
                  setSessionDetail(null);
                }}
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
                    <span>Edit Marks</span>
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

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400 text-xs font-mono">Loading history...</div>}>
      <HistoryContent />
    </Suspense>
  );
}
