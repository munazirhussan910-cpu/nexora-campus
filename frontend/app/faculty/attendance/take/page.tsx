'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';
import {
  CheckSquare,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  BookOpen,
  Send,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  FileText,
  ShieldCheck,
  Edit3,
} from 'lucide-react';

interface SubjectOption {
  id: string;
  code: string;
  name: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  year: number;
  semester: number;
  section: string;
  faculty?: string;
  sessionsCount: number;
}

interface StudentRosterItem {
  studentId: string;
  rollNumber: string;
  fullName: string;
  branch: string;
  year: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
  overallPresent: number;
  overallTotal: number;
  overallPercentage: number;
  isAboveThreshold: boolean;
}

function TakeAttendanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramSessionId = searchParams.get('sessionId') || '';
  const paramSubjectId = searchParams.get('subjectId') || '';
  const paramPeriod = Number(searchParams.get('period')) || 1;
  const paramDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const paramSection = searchParams.get('section') || 'A';

  // Selection states
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(paramSubjectId);
  const [selectedDate, setSelectedDate] = useState<string>(paramDate);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(paramPeriod);
  const [selectedSection, setSelectedSection] = useState<string>(paramSection);
  const [topic, setTopic] = useState<string>('');

  // Roster & session state
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [existingSessionId, setExistingSessionId] = useState<string | null>(paramSessionId || null);
  const [sessionMeta, setSessionMeta] = useState<any>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');

  // UI flow states
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 1. Fetch available assigned subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await apiRequest<SubjectOption[]>('/faculty/subjects');
        if (res.success && res.data) {
          setSubjects(res.data);
          if (!selectedSubjectId && res.data.length > 0) {
            setSelectedSubjectId(res.data[0].id);
            setSelectedSection(res.data[0].section || 'A');
          }
        }
      } catch {
        setError('Failed to load assigned subjects');
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

  // 2. If sessionId is provided in URL, load that session directly
  useEffect(() => {
    if (paramSessionId) {
      const loadSession = async () => {
        setLoadingRoster(true);
        try {
          const res = await apiRequest<any>(`/faculty/attendance/session/${paramSessionId}`);
          if (res.success && res.data) {
            const s = res.data.session;
            setSelectedSubjectId(s.subjectId);
            setSelectedDate(new Date(s.date).toISOString().split('T')[0]);
            setSelectedPeriod(s.period);
            setSelectedSection(s.section || 'A');
            setTopic(s.topic || '');
            setIsEditMode(true);
            setExistingSessionId(s.id);
            setSessionMeta(s);

            const rosterMapped: StudentRosterItem[] = res.data.records.map((r: any) => ({
              studentId: r.studentId,
              rollNumber: r.rollNumber,
              fullName: r.fullName,
              branch: s.branchCode,
              year: s.year,
              status: r.status,
              remarks: r.remarks || '',
              overallPresent: 0,
              overallTotal: 0,
              overallPercentage: 0,
              isAboveThreshold: true,
            }));
            setStudents(rosterMapped);
          }
        } catch {
          setError('Failed to load session details');
        } finally {
          setLoadingRoster(false);
        }
      };

      loadSession();
    }
  }, [paramSessionId]);

  // 3. Load roster whenever subject, date, period, or section changes (when not loading by paramSessionId)
  useEffect(() => {
    if (!selectedSubjectId || paramSessionId) return;

    const fetchRoster = async () => {
      setLoadingRoster(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const url = `/faculty/attendance/roster?subjectId=${encodeURIComponent(
          selectedSubjectId
        )}&date=${encodeURIComponent(selectedDate)}&period=${selectedPeriod}&section=${encodeURIComponent(
          selectedSection
        )}`;
        const res = await apiRequest<any>(url);

        if (res.success && res.data) {
          setStudents(res.data.students || []);
          if (res.data.sessionExists && res.data.existingSession) {
            setIsEditMode(true);
            setExistingSessionId(res.data.existingSession.id);
            setSessionMeta(res.data.existingSession);
            setTopic(res.data.existingSession.topic || '');
          } else {
            setIsEditMode(false);
            setExistingSessionId(null);
            setSessionMeta(null);
            setTopic('');
          }
        } else {
          setError(res.error?.message || 'Failed to fetch student roster');
        }
      } catch {
        setError('Network error while retrieving student roster');
      } finally {
        setLoadingRoster(false);
      }
    };

    fetchRoster();
  }, [selectedSubjectId, selectedDate, selectedPeriod, selectedSection, paramSessionId]);

  const selectedSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId);
  }, [subjects, selectedSubjectId]);

  // Quick batch status actions
  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status,
      }))
    );
  };

  const setStudentStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const setStudentRemarks = (studentId: string, remarks: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  // Filtered student list
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Attendance metrics
  const counts = useMemo(() => {
    const present = students.filter((s) => s.status === 'PRESENT').length;
    const absent = students.filter((s) => s.status === 'ABSENT').length;
    const late = students.filter((s) => s.status === 'LATE').length;
    const excused = students.filter((s) => s.status === 'EXCUSED').length;
    const total = students.length;
    const effectivePresent = present + late;
    const rate = total > 0 ? Number(((effectivePresent / total) * 100).toFixed(1)) : 0;
    return { present, absent, late, excused, total, rate };
  }, [students]);

  // Formatted date string for user-facing confirmation
  const formattedDateString = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Submit Handler
  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isEditMode && existingSessionId) {
        // PUT update existing session
        const payload = {
          topic,
          records: students.map((s) => ({
            studentId: s.studentId,
            status: s.status,
            remarks: s.remarks,
          })),
        };
        const res = await apiRequest(`/faculty/attendance/session/${existingSessionId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        if (res.success) {
          setSuccessMessage(
            `Attendance record for ${selectedSubject?.code} on ${formattedDateString} has been updated successfully.`
          );
        } else {
          setError(res.error?.message || 'Failed to update attendance session');
        }
      } else {
        // POST new session
        const payload = {
          subjectId: selectedSubjectId,
          date: selectedDate,
          period: selectedPeriod,
          section: selectedSection,
          topic,
          records: students.map((s) => ({
            studentId: s.studentId,
            status: s.status,
            remarks: s.remarks,
          })),
        };

        const res = await apiRequest<any>('/faculty/attendance/session', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (res.success && res.data) {
          setSuccessMessage(
            res.message ||
              `Attendance for ${counts.total} students submitted successfully for ${selectedSubject?.code} on ${formattedDateString}.`
          );
          setIsEditMode(true);
          setExistingSessionId(res.data.id);
        } else if (res.error?.code === 'DUPLICATE_SESSION') {
          setError(
            res.error.message ||
              'A session already exists for this subject, date, and period. Switching to review mode.'
          );
          const errorObj = res.error as any;
          if (errorObj?.existingSessionId) {
            setIsEditMode(true);
            setExistingSessionId(errorObj.existingSessionId);
          }
        } else {
          setError(res.error?.message || 'Failed to record attendance session');
        }
      }
    } catch {
      setError('An unexpected network error occurred while submitting attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Page Title */}
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
            <CheckSquare size={22} className="text-[#d4af37]" />
            <span>{isEditMode ? 'Review & Edit Attendance' : 'Take Classroom Attendance'}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Select subject, class cohort, lecture period, and mark attendance status for each student.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditMode && existingSessionId && (
            <Link
              href={`/faculty/attendance/day-wise?date=${selectedDate}`}
              className="px-3 py-2 rounded-xl bg-[#141824] border border-[#273043] text-xs font-semibold text-gray-300 hover:text-white transition"
            >
              View Day Log
            </Link>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <Link
            href={`/faculty/attendance/subjects`}
            className="text-xs font-bold underline hover:text-white text-emerald-200 shrink-0"
          >
            View Subject Statistics
          </Link>
        </div>
      )}

      {/* Duplicate / Existing Session Notice */}
      {isEditMode && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-200 text-xs flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Edit3 size={18} className="shrink-0 text-amber-400" />
            <div>
              <span className="font-bold">Existing Attendance Session Detected:</span> Attendance
              for this lecture has already been saved
              {sessionMeta?.recordedBy ? ` by ${sessionMeta.recordedBy}` : ''}. Modifications will
              update the official record and recalculate student attendance percentages.
            </div>
          </div>
          <span className="text-[10px] font-mono bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 shrink-0">
            Edit Mode
          </span>
        </div>
      )}

      {/* Selection Control Panel */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl p-5 shadow-xl">
        <div className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#d4af37]" />
          <span>Lecture Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Subject Dropdown */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Subject / Course
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                const match = subjects.find((s) => s.id === e.target.value);
                if (match?.section) {
                  setSelectedSection(match.section);
                }
              }}
              disabled={loadingSubjects || submitting}
              className="w-full bg-[#101420] border border-[#262f44] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] transition font-medium"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} — {sub.name} (B.Tech {sub.branchCode}, Yr {sub.year})
                </option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Class Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={submitting}
              className="w-full bg-[#101420] border border-[#262f44] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] transition font-mono font-medium"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={submitting}
              className="w-full bg-[#101420] border border-[#262f44] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37] transition font-mono"
            />
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Period / Lecture
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              disabled={submitting}
              className="w-full bg-[#101420] border border-[#262f44] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] transition font-mono font-medium"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                <option key={p} value={p}>
                  Period {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Lecture Topic */}
        <div className="mt-4 pt-3.5 border-t border-[#1e2536]">
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Lecture Topic / Coverage Notes (Optional)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={submitting}
            placeholder="e.g. Binary Search Trees & AVL Rotations"
            className="w-full bg-[#101420] border border-[#262f44] rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
          />
        </div>
      </div>

      {/* Roster Controls & Metric Bar */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Metric Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
          <div className="px-3 py-1.5 rounded-xl bg-[#101420] border border-[#1e2536] text-gray-300 flex items-center gap-1.5">
            <span className="text-gray-500">Total:</span>
            <span className="text-white">{counts.total}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 flex items-center gap-1.5">
            <span>Present:</span>
            <span>{counts.present}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-400 flex items-center gap-1.5">
            <span>Absent:</span>
            <span>{counts.absent}</span>
          </div>
          {counts.late > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-400 flex items-center gap-1.5">
              <span>Late:</span>
              <span>{counts.late}</span>
            </div>
          )}
          {counts.excused > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-blue-950/50 border border-blue-500/40 text-blue-400 flex items-center gap-1.5">
              <span>Excused:</span>
              <span>{counts.excused}</span>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-[#1a2133] border border-[#2d3852] text-[#d4af37] flex items-center gap-1.5">
            <span>Rate:</span>
            <span>{counts.rate}%</span>
          </div>
        </div>

        {/* Quick Batch Actions & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or roll..."
              className="w-full bg-[#101420] border border-[#262f44] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
            />
          </div>

          <button
            type="button"
            onClick={() => markAll('PRESENT')}
            disabled={submitting || students.length === 0}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs transition active:scale-95 disabled:opacity-50"
          >
            Mark All Present
          </button>

          <button
            type="button"
            onClick={() => markAll('ABSENT')}
            disabled={submitting || students.length === 0}
            className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-bold text-xs transition active:scale-95 disabled:opacity-50"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-[#21273a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a2133] border border-[#2b354d] flex items-center justify-center text-[#d4af37]">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Class Roster — {selectedSubject?.code} ({selectedSubject?.name})
              </h2>
              <p className="text-[11px] text-gray-400">
                B.Tech {selectedSubject?.branchCode} • Year {selectedSubject?.year} • Section{' '}
                {selectedSection}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-gray-400 bg-[#1c2233] px-2.5 py-1 rounded-lg border border-[#293246]">
            {filteredStudents.length} Students
          </span>
        </div>

        {loadingRoster ? (
          <div className="p-8">
            <TableSkeleton rows={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f121d] text-gray-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#21273a]">
                <tr>
                  <th className="py-3.5 px-4 w-28">Roll No</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4 text-center">Subject Overall</th>
                  <th className="py-3.5 px-4 text-center min-w-[320px]">Lecture Status</th>
                  <th className="py-3.5 px-4 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2538] text-gray-300">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st) => (
                    <tr
                      key={st.studentId}
                      className={`hover:bg-[#181e2e] transition group ${
                        st.status === 'ABSENT' ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Roll Number */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-white text-xs">
                        {st.rollNumber}
                      </td>

                      {/* Student Full Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white group-hover:text-[#d4af37] transition">
                          {st.fullName}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          B.Tech {st.branch} • Year {st.year}
                        </div>
                      </td>

                      {/* Historical Attendance Indicator */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        {st.overallTotal > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              st.isAboveThreshold
                                ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-950/50 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {st.overallPercentage}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500">New Cohort</span>
                        )}
                      </td>

                      {/* 1-Click Status Toggles */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.studentId, 'PRESENT')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all active:scale-95 ${
                              st.status === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 ring-1 ring-emerald-400'
                                : 'bg-[#101420] text-gray-400 hover:text-emerald-400 hover:bg-[#182030] border border-[#22293b]'
                            }`}
                          >
                            Present
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.studentId, 'ABSENT')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all active:scale-95 ${
                              st.status === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 ring-1 ring-rose-400'
                                : 'bg-[#101420] text-gray-400 hover:text-rose-400 hover:bg-[#182030] border border-[#22293b]'
                            }`}
                          >
                            Absent
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.studentId, 'LATE')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all active:scale-95 ${
                              st.status === 'LATE'
                                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40 ring-1 ring-amber-400'
                                : 'bg-[#101420] text-gray-400 hover:text-amber-400 hover:bg-[#182030] border border-[#22293b]'
                            }`}
                          >
                            Late
                          </button>

                          {/* Excused */}
                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.studentId, 'EXCUSED')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all active:scale-95 ${
                              st.status === 'EXCUSED'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 ring-1 ring-blue-400'
                                : 'bg-[#101420] text-gray-400 hover:text-blue-400 hover:bg-[#182030] border border-[#22293b]'
                            }`}
                          >
                            Excused
                          </button>
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="py-3.5 px-4 text-right">
                        <input
                          type="text"
                          value={st.remarks || ''}
                          onChange={(e) => setStudentRemarks(st.studentId, e.target.value)}
                          placeholder="Note..."
                          className="w-32 bg-[#101420] border border-[#252e42] rounded-lg px-2 py-1 text-[11px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#d4af37]"
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500 text-xs">
                      {students.length === 0
                        ? 'No students found enrolled in this subject cohort.'
                        : 'No students matching the search filter.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Submission Action Bar */}
        <div className="p-4 sm:p-5 bg-[#0f121d] border-t border-[#21273a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-gray-400">
            <span>Marking: </span>
            <strong className="text-white">
              {counts.present} Present, {counts.absent} Absent
            </strong>{' '}
            out of {counts.total} students ({counts.rate}% attendance)
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/faculty/dashboard"
              className="px-4 py-2.5 rounded-xl bg-[#141824] border border-[#262f44] text-xs font-semibold text-gray-400 hover:text-white transition"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting || students.length === 0}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl shadow-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-extrabold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Send size={14} />
              <span>{isEditMode ? 'Update Attendance' : 'Submit Attendance'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#141824] border border-[#2b354d] w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1a2133] border border-[#2d3852] flex items-center justify-center text-[#d4af37] shrink-0">
                <CheckSquare size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Confirm Attendance Submission
                </h3>
                <p className="text-xs text-gray-400">
                  Authoritative academic record validation
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#101420] border border-[#202738] text-xs text-gray-200 leading-relaxed">
              Attendance for <strong className="text-[#d4af37]">{counts.total} students</strong>{' '}
              will be submitted for{' '}
              <strong className="text-white">{selectedSubject?.name}</strong> ({selectedSubject?.code}) on{' '}
              <strong className="text-white font-mono">{formattedDateString}</strong> (Period{' '}
              {selectedPeriod}, Section {selectedSection}).
            </div>

            {/* Attendance Summary Grid */}
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <div>Present</div>
                <div className="text-base mt-0.5">{counts.present}</div>
              </div>
              <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs font-bold">
                <div>Absent</div>
                <div className="text-base mt-0.5">{counts.absent}</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <div>Late</div>
                <div className="text-base mt-0.5">{counts.late}</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-400 text-xs font-bold">
                <div>Excused</div>
                <div className="text-base mt-0.5">{counts.excused}</div>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#d4af37]" />
              <span>Student aggregates will update automatically upon confirmation.</span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-[#1a2133] hover:bg-[#222b40] text-xs font-semibold text-gray-300 transition"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-extrabold text-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting && <RefreshCw size={13} className="animate-spin" />}
                <span>{submitting ? 'Saving...' : 'Confirm & Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TakeAttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-400 text-xs font-mono">
          Loading classroom attendance module...
        </div>
      }
    >
      <TakeAttendanceContent />
    </Suspense>
  );
}
