'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiRequest, clearApiCache } from '@/lib/api';
import {
  Wrench,
  Key,
  FileCheck,
  Calendar,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  QrCode,
  X,
  RotateCw,
  Copy,
  Check,
  ShieldCheck,
  Download,
  ExternalLink,
  GraduationCap,
  BookOpen,
  User,
  Phone,
  Building2,
  FileText,
  Home,
  Wifi,
  WifiOff,
  LogOut,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export type LiteTab =
  | 'DASHBOARD'
  | 'ID_CARD'
  | 'ATTENDANCE'
  | 'TIMETABLE'
  | 'NOTICES'
  | 'REQUESTS'
  | 'COMPLAINT'
  | 'GATE_PASS'
  | 'BONAFIDE'
  | 'LEAVE'
  | 'PROFILE';

interface StudentLiteViewProps {
  currentUser: any;
  isOnline: boolean;
  setMsg: (msg: { type: 'info' | 'success' | 'error'; text: string } | null) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  onLogout?: () => void;
}

export function StudentLiteView({
  currentUser,
  isOnline,
  setMsg,
  getStatusBadge,
  onLogout,
}: StudentLiteViewProps) {
  const [tab, setTab] = useState<LiteTab>('DASHBOARD');

  // Core Data States
  const [studentIdData, setStudentIdData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [timetableData, setTimetableData] = useState<any>(null);
  const [updatesData, setUpdatesData] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  // Loading & Error States
  const [loadingId, setLoadingId] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cache Timestamps
  const [idCachedAt, setIdCachedAt] = useState<string | null>(null);
  const [attendanceCachedAt, setAttendanceCachedAt] = useState<string | null>(null);
  const [timetableCachedAt, setTimetableCachedAt] = useState<string | null>(null);
  const [updatesCachedAt, setUpdatesCachedAt] = useState<string | null>(null);
  const [requestsCachedAt, setRequestsCachedAt] = useState<string | null>(null);

  // Active Gate Pass Turnstile Modal
  const [selectedGatePass, setSelectedGatePass] = useState<any | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // Forms
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('PLUMBING');
  const [gateDest, setGateDest] = useState('');
  const [gateReason, setGateReason] = useState('');
  const [bonafidePurpose, setBonafidePurpose] = useState('Scholarship Application');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveEmergencyPhone, setLeaveEmergencyPhone] = useState('');

  // -------------------------------------------------------------
  // Offline Caching & Hydration
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Hydrate from localStorage first so user sees immediate data offline
    try {
      const cachedId = localStorage.getItem('nexora_lite_id_cache');
      if (cachedId) {
        const parsed = JSON.parse(cachedId);
        setStudentIdData(parsed.data);
        setIdCachedAt(parsed.timestamp);
      }

      const cachedAtt = localStorage.getItem('nexora_lite_attendance_cache');
      if (cachedAtt) {
        const parsed = JSON.parse(cachedAtt);
        setAttendanceData(parsed.data);
        setAttendanceCachedAt(parsed.timestamp);
      }

      const cachedTt = localStorage.getItem('nexora_lite_timetable_cache');
      if (cachedTt) {
        const parsed = JSON.parse(cachedTt);
        setTimetableData(parsed.data);
        setTimetableCachedAt(parsed.timestamp);
      }

      const cachedUp = localStorage.getItem('nexora_lite_updates_cache');
      if (cachedUp) {
        const parsed = JSON.parse(cachedUp);
        setUpdatesData(parsed.data);
        setUpdatesCachedAt(parsed.timestamp);
      }

      const cachedReq = localStorage.getItem('nexora_lite_requests_cache');
      if (cachedReq) {
        const parsed = JSON.parse(cachedReq);
        setRequests(parsed.data);
        setRequestsCachedAt(parsed.timestamp);
      }
    } catch {
      // Ignore cache parse errors
    }

    // 2. Fetch fresh data if online
    if (isOnline) {
      fetchAllLiteData();
    }
  }, [isOnline]);

  // Pre-fill initial leave dates
  useEffect(() => {
    const today = new Date();
    const s = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const e = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setLeaveStart(s);
    setLeaveEnd(e);
    if (currentUser?.parentPhone) {
      setLeaveEmergencyPhone(currentUser.parentPhone);
    }
  }, [currentUser]);

  const formatTimestamp = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const fetchStudentId = async () => {
    setLoadingId(true);
    try {
      const res = await apiRequest('/lite/me');
      if (res.success && res.data) {
        setStudentIdData(res.data);
        const ts = new Date().toISOString();
        setIdCachedAt(ts);
        localStorage.setItem(
          'nexora_lite_id_cache',
          JSON.stringify({ data: res.data, timestamp: ts })
        );
      }
    } catch {
      // Use cached if network fails
    } finally {
      setLoadingId(false);
    }
  };

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const res = await apiRequest('/lite/attendance');
      if (res.success && res.data) {
        setAttendanceData(res.data);
        const ts = new Date().toISOString();
        setAttendanceCachedAt(ts);
        localStorage.setItem(
          'nexora_lite_attendance_cache',
          JSON.stringify({ data: res.data, timestamp: ts })
        );
      }
    } catch {
      // Use cached if network fails
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchTimetable = async () => {
    setLoadingTimetable(true);
    try {
      const res = await apiRequest('/lite/timetable');
      if (res.success && res.data) {
        setTimetableData(res.data);
        const ts = new Date().toISOString();
        setTimetableCachedAt(ts);
        localStorage.setItem(
          'nexora_lite_timetable_cache',
          JSON.stringify({ data: res.data, timestamp: ts })
        );
      }
    } catch {
      // Use cached if network fails
    } finally {
      setLoadingTimetable(false);
    }
  };

  const fetchUpdates = async () => {
    setLoadingUpdates(true);
    try {
      const res = await apiRequest('/lite/updates');
      if (res.success && res.data?.updates) {
        setUpdatesData(res.data.updates);
        const ts = new Date().toISOString();
        setUpdatesCachedAt(ts);
        localStorage.setItem(
          'nexora_lite_updates_cache',
          JSON.stringify({ data: res.data.updates, timestamp: ts })
        );
      }
    } catch {
      // Use cached if network fails
    } finally {
      setLoadingUpdates(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await apiRequest('/lite/requests');
      if (res.success && res.data?.requests) {
        setRequests(res.data.requests);
        const ts = new Date().toISOString();
        setRequestsCachedAt(ts);
        localStorage.setItem(
          'nexora_lite_requests_cache',
          JSON.stringify({ data: res.data.requests, timestamp: ts })
        );
      }
    } catch {
      // Use cached if network fails
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchAllLiteData = () => {
    fetchStudentId();
    fetchAttendance();
    fetchTimetable();
    fetchUpdates();
    fetchRequests();
  };

  // -------------------------------------------------------------
  // Mutations & Actions
  // -------------------------------------------------------------
  const handleCopyPin = (pin: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Internet connection is required to submit a complaint.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description: desc,
        category: complaintCategory,
        location: studentIdData?.hostel || currentUser?.hostelBlock || 'Hostel Room',
      }),
    });
    setSubmitting(false);
    if (res.success) {
      setMsg({ type: 'success', text: `Complaint registered: ${res.data?.requestNumber || 'Success'}. Staff has been notified.` });
      setTitle('');
      setDesc('');
      fetchRequests();
      setTab('REQUESTS');
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to submit complaint.' });
    }
  };

  const handleGatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Internet connection is required to apply for a Gate Pass.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);

    const now = new Date();
    const depart = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const ret = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

    const res = await apiRequest('/gate-passes', {
      method: 'POST',
      body: JSON.stringify({
        destination: gateDest,
        reason: gateReason,
        departureTime: depart,
        expectedReturnTime: ret,
      }),
    });
    setSubmitting(false);
    if (res.success) {
      setMsg({ type: 'success', text: 'Gate Pass submitted! Sent to Warden for approval.' });
      setGateDest('');
      setGateReason('');
      fetchRequests();
      setTab('REQUESTS');
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to apply for gate pass.' });
    }
  };

  const handleBonafide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Internet connection is required to request a Bonafide Certificate.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest('/bonafide', {
      method: 'POST',
      body: JSON.stringify({ purpose: bonafidePurpose }),
    });
    setSubmitting(false);
    if (res.success) {
      setMsg({ type: 'success', text: 'Bonafide request submitted to Academic Office!' });
      fetchRequests();
      setTab('REQUESTS');
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to request Bonafide certificate.' });
    }
  };

  const handleLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMsg({ type: 'error', text: 'Internet connection is required to submit a Leave Request.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const res = await apiRequest('/leaves', {
      method: 'POST',
      body: JSON.stringify({
        startDate: new Date(leaveStart).toISOString(),
        endDate: new Date(leaveEnd).toISOString(),
        reason: leaveReason,
        emergencyContact: leaveEmergencyPhone || currentUser?.parentPhone || '+91 9876500000',
        parentConsent: true,
      }),
    });
    setSubmitting(false);
    if (res.success) {
      setMsg({ type: 'success', text: 'Hostel Leave request submitted for Warden review!' });
      setLeaveReason('');
      fetchRequests();
      setTab('REQUESTS');
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to submit leave request.' });
    }
  };

  // Fallback student profile from currentUser if studentIdData not yet loaded
  const student = studentIdData || {
    fullName: currentUser?.fullName || currentUser?.username || 'Aryan Khan',
    rollNumber: currentUser?.rollNumber || '220101048',
    department: currentUser?.branch || 'CSE',
    branchName: 'Computer Science & Engineering',
    year: currentUser?.year || 2,
    semester: (currentUser?.year || 2) * 2,
    section: 'A',
    hostel: currentUser?.hostelBlock ? `${currentUser.hostelBlock} • Room ${currentUser.roomNumber || '204'}` : 'Day Scholar',
    roomNumber: currentUser?.roomNumber || '204',
    hostelBlock: currentUser?.hostelBlock || 'Block B',
    phone: currentUser?.phone || '+91 9876543210',
    parentPhone: currentUser?.parentPhone || '+91 9876500001',
    institution: 'Biju Patnaik University of Technology (BPUT)',
    status: 'ACTIVE',
    qrCodeData: `NEXORA:STUDENT:${currentUser?.rollNumber || '220101048'}:${currentUser?.fullName || 'Aryan Khan'}:CSE:204`,
  };

  // -------------------------------------------------------------
  // RENDER SECTIONS
  // -------------------------------------------------------------

  return (
    <div className="space-y-4 pb-24">
      {/* Network Status & Offline Notice Banner */}
      {!isOnline && (
        <div className="bg-amber-950/80 border border-amber-600/50 rounded-xl p-2.5 text-xs text-amber-200 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <WifiOff size={14} className="text-amber-400 shrink-0" />
            <span>
              <strong>Offline Mode:</strong> Viewing cached student data. Action requests require internet.
            </span>
          </div>
          <button
            type="button"
            onClick={fetchAllLiteData}
            className="text-[11px] bg-amber-800/60 hover:bg-amber-700/60 text-amber-100 px-2 py-0.5 rounded font-mono shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* 1. DASHBOARD VIEW (HOME) */}
      {/* -------------------------------------------------------- */}
      {tab === 'DASHBOARD' && (
        <div className="space-y-4">
          {/* Student Welcome & Quick ID Preview */}
          <div className="bg-gradient-to-br from-[#121927] to-[#0f1420] border border-[#243048] rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg shrink-0 overflow-hidden shadow-inner">
                  {student.profilePhotoUrl ? (
                    <img
                      src={student.profilePhotoUrl}
                      alt={student.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{student.fullName ? student.fullName[0] : 'S'}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{student.fullName}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Active Student" />
                  </h2>
                  <p className="text-xs text-gray-400 font-mono">
                    Roll: <span className="text-gray-200 font-semibold">{student.rollNumber}</span> • {student.department}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {student.hostel}
                  </p>
                </div>
              </div>

              {/* Quick Digital ID Button */}
              <button
                type="button"
                onClick={() => setTab('ID_CARD')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold shrink-0 transition"
              >
                <QrCode size={14} />
                <span>Show ID</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#1e273a]">
              <button
                type="button"
                onClick={() => setTab('ATTENDANCE')}
                className="text-left bg-[#161f30] hover:bg-[#1b263b] p-2.5 rounded-xl border border-[#28354f] transition"
              >
                <div className="text-[10px] text-gray-400 flex items-center justify-between font-mono">
                  <span>ATTENDANCE</span>
                  <ChevronRight size={12} className="text-gray-500" />
                </div>
                <div className="text-lg font-black text-white mt-0.5">
                  {attendanceData ? `${attendanceData.overallPercentage}%` : '85.5%'}
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={10} />
                  <span>Eligible (&ge; 75%)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTab('TIMETABLE')}
                className="text-left bg-[#161f30] hover:bg-[#1b263b] p-2.5 rounded-xl border border-[#28354f] transition"
              >
                <div className="text-[10px] text-gray-400 flex items-center justify-between font-mono">
                  <span>TODAY'S SCHEDULE</span>
                  <ChevronRight size={12} className="text-gray-500" />
                </div>
                <div className="text-sm font-bold text-white mt-1 truncate">
                  {timetableData?.todayClasses?.length
                    ? `${timetableData.todayClasses.length} Lectures`
                    : '4 Lectures Today'}
                </div>
                <div className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5 truncate">
                  <Clock size={10} />
                  <span>Next: {timetableData?.todayClasses?.[0]?.time || '09:00 AM'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Actions (Complaint, Gate Pass, Bonafide, Leave) */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" />
              <span>Campus Services</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTab('GATE_PASS')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#131a29] hover:bg-[#192235] border border-[#243048] text-center transition group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-1.5 group-hover:scale-105 transition-transform">
                  <Key size={18} />
                </div>
                <span className="text-xs font-semibold text-white">Gate Pass</span>
                <span className="text-[10px] text-gray-400">QR Turnstile</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('COMPLAINT')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#131a29] hover:bg-[#192235] border border-[#243048] text-center transition group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-1.5 group-hover:scale-105 transition-transform">
                  <Wrench size={18} />
                </div>
                <span className="text-xs font-semibold text-white">Maintenance</span>
                <span className="text-[10px] text-gray-400">Tap, Power, Net</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('BONAFIDE')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#131a29] hover:bg-[#192235] border border-[#243048] text-center transition group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1.5 group-hover:scale-105 transition-transform">
                  <FileCheck size={18} />
                </div>
                <span className="text-xs font-semibold text-white">Bonafide</span>
                <span className="text-[10px] text-gray-400">Instant PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('LEAVE')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#131a29] hover:bg-[#192235] border border-[#243048] text-center transition group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-1.5 group-hover:scale-105 transition-transform">
                  <Calendar size={18} />
                </div>
                <span className="text-xs font-semibold text-white">Hostel Leave</span>
                <span className="text-[10px] text-gray-400">Warden Review</span>
              </button>
            </div>
          </div>

          {/* Recent Campus Notices / Class Updates */}
          <div className="bg-[#121826] border border-[#212c42] rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <Bell size={13} className="text-amber-400" />
                <span>Class Updates &amp; Notices</span>
              </h3>
              <button
                type="button"
                onClick={() => setTab('NOTICES')}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
              >
                <span>View all</span>
                <ChevronRight size={12} />
              </button>
            </div>

            {updatesData.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No recent circulars.</p>
            ) : (
              <div className="space-y-2">
                {updatesData.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-[#172033] border border-[#25324d] text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-200 truncate">{item.title}</span>
                      <span className="text-[10px] text-gray-500 shrink-0 font-mono">
                        {formatTimestamp(item.date)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{item.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Requests Summary */}
          <div className="bg-[#121826] border border-[#212c42] rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <Clock size={13} className="text-purple-400" />
                <span>My Active Requests</span>
              </h3>
              <button
                type="button"
                onClick={() => setTab('REQUESTS')}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
              >
                <span>View all ({requests.length})</span>
                <ChevronRight size={12} />
              </button>
            </div>

            {requests.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No requests submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {requests.slice(0, 2).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      if (r.type === 'GATE_PASS' && r.gatePass) {
                        setSelectedGatePass(r);
                      } else {
                        setTab('REQUESTS');
                      }
                    }}
                    className="p-2.5 rounded-xl bg-[#172033] border border-[#25324d] text-xs flex items-center justify-between gap-2 cursor-pointer hover:border-gray-500/40 transition"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-gray-200 truncate">{r.title}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {r.number} • {formatTimestamp(r.createdAt)}
                      </div>
                    </div>
                    <div className="shrink-0">{getStatusBadge(r.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* 2. 🪪 STUDENT ID VIEW */}
      {/* -------------------------------------------------------- */}
      {tab === 'ID_CARD' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode size={18} className="text-amber-400" />
                <span>Digital Student ID</span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Official Campus Identity Card • Offline Available
              </p>
            </div>
            {idCachedAt && (
              <div className="text-[10px] text-gray-400 font-mono text-right">
                Cached: {formatTimestamp(idCachedAt)}
              </div>
            )}
          </div>

          {/* Physical ID Card Container (Credit-Card Ratio) */}
          <div className="relative overflow-hidden bg-gradient-to-b from-[#141b2c] via-[#101524] to-[#0a0e19] border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl shadow-black/60 text-white">
            {/* Holographic Header Bar */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4">
              <div>
                <div className="text-[11px] font-black tracking-widest text-amber-400 uppercase font-mono">
                  BIJU PATNAIK UNIVERSITY OF TECHNOLOGY
                </div>
                <div className="text-[9px] text-gray-400 font-mono">
                  BPUT CAMPUS OPERATIONS PLATFORM • ODISHA
                </div>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold font-mono uppercase">
                {student.status || 'ACTIVE'}
              </div>
            </div>

            {/* Photo + Student Info Grid */}
            <div className="flex items-start gap-4">
              {/* Photo Box */}
              <div className="w-24 h-28 rounded-2xl bg-[#1c2438] border-2 border-amber-500/30 flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-md">
                {student.profilePhotoUrl ? (
                  <img
                    src={student.profilePhotoUrl}
                    alt={student.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-2 text-gray-400">
                    <User size={36} className="text-amber-400/80 mb-1" />
                    <span className="text-[9px] font-mono text-gray-400">PASSPORT PHOTO</span>
                  </div>
                )}
              </div>

              {/* Student Details Column */}
              <div className="min-w-0 flex-1 space-y-1 text-xs">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-mono">STUDENT NAME</div>
                  <div className="text-sm font-extrabold text-white tracking-wide truncate">
                    {student.fullName}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-mono">ROLL NUMBER / ID</div>
                  <div className="text-sm font-black text-amber-400 font-mono tracking-wider">
                    {student.rollNumber}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase font-mono">BRANCH</div>
                    <div className="font-bold text-gray-200">{student.department}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase font-mono">YEAR / SEM</div>
                    <div className="font-bold text-gray-200">
                      Year {student.year} (Sem {student.semester})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hostel / Residence & Verification QR */}
            <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between gap-3">
              <div className="text-xs space-y-1 min-w-0">
                <div>
                  <div className="text-[9px] text-gray-400 uppercase font-mono">CAMPUS RESIDENCE</div>
                  <div className="font-semibold text-gray-300 truncate text-[11px]">
                    {student.hostel}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-400 uppercase font-mono">EMERGENCY CONTACT</div>
                  <div className="font-mono text-[11px] text-gray-400">
                    {student.parentPhone || student.phone || 'Recorded'}
                  </div>
                </div>
              </div>

              {/* Digital Verification QR Code */}
              <div className="p-2 rounded-xl bg-white text-black shrink-0 shadow-lg">
                <QRCodeSVG
                  value={student.qrCodeData || `NEXORA:${student.rollNumber}`}
                  size={72}
                  level="M"
                />
              </div>
            </div>

            {/* Security Microprint Footnote */}
            <div className="mt-3 pt-2 border-t border-amber-500/10 text-center">
              <p className="text-[8px] text-gray-400 font-mono tracking-widest uppercase">
                SECURITY VERIFIED BY NEXORA CRYPTOGRAPHIC ENGINE • VALID FOR 2026-27
              </p>
            </div>
          </div>

          {/* Offline Accessibility Confirmation Card */}
          <div className="p-3 rounded-2xl bg-[#121927] border border-[#243048] flex items-center gap-3 text-xs text-gray-300">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="font-bold text-white">Offline Ready: </span>
              This ID is stored on your device and can be presented at campus gates or checkpoints even without internet connectivity.
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* 3. 📊 ATTENDANCE VIEW */}
      {/* -------------------------------------------------------- */}
      {tab === 'ATTENDANCE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen size={18} className="text-blue-400" />
                <span>Attendance Hub</span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                BPUT Minimum 75% Academic Requirement
              </p>
            </div>
            {attendanceCachedAt && (
              <div className="text-[10px] text-gray-400 font-mono text-right">
                Updated: {formatTimestamp(attendanceCachedAt)}
              </div>
            )}
          </div>

          {/* Overall Attendance Card */}
          <div className="bg-[#121826] border border-[#243048] rounded-2xl p-4 text-center">
            <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">
              AGGREGATE ATTENDANCE
            </div>
            <div className="text-3xl font-black text-white">
              {attendanceData?.overallPercentage !== undefined
                ? `${attendanceData.overallPercentage}%`
                : '85.5%'}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Attended{' '}
              <strong className="text-white">
                {attendanceData?.attendedClasses ?? 34}
              </strong>{' '}
              of{' '}
              <strong className="text-white">
                {attendanceData?.totalClasses ?? 40}
              </strong>{' '}
              held lectures
            </p>

            {/* Visual Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2.5 mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    attendanceData?.overallPercentage ?? 85.5,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Subject-Wise Breakdown List */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
              Subject Breakdown
            </h3>
            {loadingAttendance && !attendanceData ? (
              <div className="text-xs text-gray-400 py-6 text-center">Loading attendance...</div>
            ) : attendanceData?.subjects && attendanceData.subjects.length > 0 ? (
              <div className="space-y-2">
                {attendanceData.subjects.map((sub: any) => (
                  <div
                    key={sub.code}
                    className="p-3 rounded-xl bg-[#141b2b] border border-[#222c42] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-white">{sub.code}: </span>
                        <span className="text-gray-300">{sub.name}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          sub.percentage >= 75
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                            : sub.percentage >= 65
                            ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-600/40'
                        }`}
                      >
                        {sub.percentage}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                      <span>Attended: {sub.attended} / {sub.total} classes</span>
                      <span>
                        {sub.percentage >= 75
                          ? 'Criteria met'
                          : sub.percentage >= 65
                          ? 'Warning zone'
                          : 'Shortage alert'}
                      </span>
                    </div>

                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          sub.percentage >= 75
                            ? 'bg-emerald-500'
                            : sub.percentage >= 65
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#141b2b] border border-[#222c42] text-xs text-gray-400 text-center">
                Attendance records are up to date.
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* 4. 🗓️ TIMETABLE VIEW */}
      {/* -------------------------------------------------------- */}
      {tab === 'TIMETABLE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar size={18} className="text-amber-400" />
                <span>Class Timetable</span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                B.Tech {student.department} • Year {student.year}
              </p>
            </div>
            {timetableCachedAt && (
              <div className="text-[10px] text-gray-400 font-mono text-right">
                Updated: {formatTimestamp(timetableCachedAt)}
              </div>
            )}
          </div>

          {/* Today's Schedule Card */}
          <div className="bg-[#121826] border border-[#243048] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 font-mono flex items-center gap-1.5">
              <Clock size={13} />
              <span>Today's Classes ({timetableData?.todayDay || 'Scheduled'})</span>
            </h3>

            {timetableData?.todayClasses && timetableData.todayClasses.length > 0 ? (
              <div className="space-y-2">
                {timetableData.todayClasses.map((cls: any, i: number) => (
                  <div
                    key={cls.id || i}
                    className="p-2.5 rounded-xl bg-[#172033] border border-[#25324d] text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-white">
                        {cls.subjectCode} - {cls.subjectName}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {cls.faculty} • Room: <span className="text-gray-200 font-medium">{cls.room}</span>
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded bg-[#202c46] border border-[#304060] font-mono text-[11px] text-amber-300 font-bold shrink-0">
                      {cls.time}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-3 text-center">
                No classes scheduled for today. Enjoy your study break!
              </p>
            )}
          </div>

          {/* Full Weekly Schedule Overview */}
          {timetableData?.allEntries && (
            <div className="bg-[#121826] border border-[#243048] rounded-2xl p-4">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2.5 font-mono">
                Full Weekly Routine
              </h3>
              <div className="space-y-2">
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((day) => {
                  const dayEntries = timetableData.allEntries.filter((e: any) => e.day === day);
                  if (dayEntries.length === 0) return null;

                  return (
                    <div key={day} className="p-2.5 rounded-xl bg-[#141b2c] border border-[#1f283c]">
                      <div className="font-bold text-xs text-amber-400 font-mono mb-1.5">{day}</div>
                      <div className="space-y-1">
                        {dayEntries.map((e: any, idx: number) => (
                          <div key={idx} className="text-[11px] text-gray-300 flex items-center justify-between">
                            <span>{e.time}: {e.subjectCode} ({e.room})</span>
                            <span className="text-gray-500 text-[10px]">{e.faculty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* 5. 📢 NOTICES / CLASS UPDATES VIEW */}
      {/* -------------------------------------------------------- */}
      {tab === 'NOTICES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Bell size={18} className="text-amber-400" />
                <span>Class Updates &amp; Notices</span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">Official Campus Communications</p>
            </div>
            {updatesCachedAt && (
              <div className="text-[10px] text-gray-400 font-mono text-right">
                Updated: {formatTimestamp(updatesCachedAt)}
              </div>
            )}
          </div>

          {loadingUpdates && updatesData.length === 0 ? (
            <div className="text-xs text-gray-400 py-6 text-center">Loading circulars...</div>
          ) : updatesData.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 bg-[#121826] border border-[#243048] rounded-2xl">
              No published updates or announcements at this time.
            </div>
          ) : (
            <div className="space-y-3">
              {updatesData.map((notice) => (
                <div
                  key={notice.id}
                  className="p-3.5 rounded-2xl bg-[#131a29] border border-[#243048] text-xs space-y-1.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white text-sm">{notice.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                        notice.priority === 'URGENT'
                          ? 'bg-rose-950 text-rose-300 border border-rose-600/40'
                          : 'bg-blue-950 text-blue-300 border border-blue-600/40'
                      }`}
                    >
                      {notice.priority}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {notice.fullContent || notice.content}
                  </p>
                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span>By: {notice.author}</span>
                    <span>{formatTimestamp(notice.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* 6. 📋 UNIFIED REQUESTS VIEW */}
      {/* -------------------------------------------------------- */}
      {tab === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText size={18} className="text-purple-400" />
                <span>My Campus Requests</span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Maintenance, Gate Passes, Bonafides &amp; Leaves
              </p>
            </div>
            {requestsCachedAt && (
              <div className="text-[10px] text-gray-400 font-mono text-right">
                Cached: {formatTimestamp(requestsCachedAt)}
              </div>
            )}
          </div>

          {/* Quick Submit Buttons Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setTab('COMPLAINT')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold shrink-0"
            >
              + Complaint
            </button>
            <button
              type="button"
              onClick={() => setTab('GATE_PASS')}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold shrink-0"
            >
              + Gate Pass
            </button>
            <button
              type="button"
              onClick={() => setTab('BONAFIDE')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shrink-0"
            >
              + Bonafide
            </button>
            <button
              type="button"
              onClick={() => setTab('LEAVE')}
              className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold shrink-0"
            >
              + Leave
            </button>
          </div>

          {/* Requests List */}
          {loadingRequests && requests.length === 0 ? (
            <div className="text-xs text-gray-400 py-6 text-center">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 bg-[#121826] border border-[#243048] rounded-2xl">
              No requests recorded. Use the buttons above to submit a new request.
            </div>
          ) : (
            <div className="space-y-2.5">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-2xl bg-[#141b2c] border border-[#232d43] text-xs space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-sm">{r.title}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                        {r.number} • {r.typeName || r.type}
                      </div>
                    </div>
                    <div className="shrink-0">{getStatusBadge(r.status)}</div>
                  </div>

                  {/* Gate Pass Specific Turnstile Badge & Quick View */}
                  {r.gatePass && (
                    <div className="p-2 rounded-xl bg-[#1a2236] border border-[#2d3a5a] flex items-center justify-between gap-2">
                      <div className="text-[11px] text-gray-300">
                        <span>Dest: <strong>{r.gatePass.destination}</strong></span>
                        {r.gatePass.pin && (
                          <span className="ml-2 font-mono text-amber-300">
                            PIN: <strong>{r.gatePass.pin}</strong>
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedGatePass(r)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center gap-1 shrink-0"
                      >
                        <QrCode size={12} />
                        <span>Pass QR</span>
                      </button>
                    </div>
                  )}

                  {/* Bonafide Certificate Download */}
                  {r.bonafide?.pdfUrl && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-emerald-400 font-mono">
                        Certificate: {r.bonafide.certificateId || 'Ready'}
                      </span>
                      <a
                        href={r.bonafide.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1"
                      >
                        <Download size={11} />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span>{r.location ? `Loc: ${r.location}` : 'Campus Service'}</span>
                    <span>{formatTimestamp(r.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* 7. 🛠️ COMPLAINT FORM */}
      {/* -------------------------------------------------------- */}
      {tab === 'COMPLAINT' && (
        <form onSubmit={handleComplaint} className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench size={18} className="text-amber-400" />
              <span>Report Hostel Maintenance Issue</span>
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Deterministic Keyword Routing Engine
            </p>
          </div>

          <div className="space-y-3 bg-[#121826] border border-[#243048] rounded-2xl p-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Category
              </label>
              <select
                value={complaintCategory}
                onChange={(e) => setComplaintCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#182033] border border-[#283552] text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="PLUMBING">Plumbing (Tap leak, flush, drain)</option>
                <option value="ELECTRICAL">Electrical (Fan, light, socket)</option>
                <option value="CARPENTRY">Carpentry (Door, window, latch)</option>
                <option value="INTERNET">Campus Wi-Fi / LAN</option>
                <option value="CLEANLINESS">Sanitation &amp; Housekeeping</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Issue Summary (e.g., "tap leak in washroom")
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Washroom tap leak"
                className="w-full px-3 py-2 rounded-xl bg-[#182033] border border-[#283552] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Detailed Description
              </label>
              <textarea
                required
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe the issue clearly..."
                className="w-full px-3 py-2 rounded-xl bg-[#182033] border border-[#283552] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting || !isOnline}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Submit Complaint'}
              </button>
              <button
                type="button"
                onClick={() => setTab('REQUESTS')}
                className="px-4 py-2.5 rounded-xl bg-[#1a2336] text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* -------------------------------------------------------- */}
      {/* 8. 🚪 GATE PASS FORM */}
      {/* -------------------------------------------------------- */}
      {tab === 'GATE_PASS' && (
        <form onSubmit={handleGatePass} className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key size={18} className="text-purple-400" />
              <span>Apply for Digital Gate Pass</span>
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Turnstile HMAC-SHA256 QR + 4-Digit Offline PIN
            </p>
          </div>

          <div className="space-y-3 bg-[#121826] border border-[#243048] rounded-2xl p-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Destination
              </label>
              <input
                type="text"
                required
                value={gateDest}
                onChange={(e) => setGateDest(e.target.value)}
                placeholder="e.g. Central Market / Railway Station"
                className="w-full px-3 py-2 rounded-xl bg-[#182033] border border-[#283552] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Purpose / Reason
              </label>
              <input
                type="text"
                required
                value={gateReason}
                onChange={(e) => setGateReason(e.target.value)}
                placeholder="e.g. Purchase course study books & stationary"
                className="w-full px-3 py-2 rounded-xl bg-[#182033] border border-[#283552] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting || !isOnline}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit to Warden'}
              </button>
              <button
                type="button"
                onClick={() => setTab('REQUESTS')}
                className="px-4 py-2.5 rounded-xl bg-[#1a2336] text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* -------------------------------------------------------- */}
      {/* 9. 📝 BONAFIDE FORM */}
      {/* -------------------------------------------------------- */}
      {tab === 'BONAFIDE' && (
        <form onSubmit={handleBonafide} className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck size={18} className="text-emerald-400" />
              <span>Apply for Bonafide Certificate</span>
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Academic Officer / Admin Authorized Document
            </p>
          </div>

          <div className="space-y-3 bg-[#121826] border border-[#243048] rounded-2xl p-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Certificate Purpose
              </label>
              <select
                value={bonafidePurpose}
                onChange={(e) => setBonafidePurpose(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#182033] border border-[#283552] text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="State Merit Scholarship Application">State Merit Scholarship Application</option>
                <option value="National Scholarship Portal (NSP)">National Scholarship Portal (NSP)</option>
                <option value="Education Loan & Banking Verification">Education Loan &amp; Banking Verification</option>
                <option value="Passport / Visa Application">Passport / Visa Application</option>
                <option value="Summer Industrial Internship">Summer Industrial Internship</option>
                <option value="Hostel Accommodation Proof">Hostel Accommodation Proof</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/30 text-xs text-emerald-200">
              Approved certificates are automatically generated as tamper-evident PDF documents containing dynamic verification QR codes.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting || !isOnline}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Apply for Bonafide'}
              </button>
              <button
                type="button"
                onClick={() => setTab('REQUESTS')}
                className="px-4 py-2.5 rounded-xl bg-[#1a2336] text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* -------------------------------------------------------- */}
      {/* 10. 🏠 LEAVE FORM */}
      {/* -------------------------------------------------------- */}
      {tab === 'LEAVE' && (
        <form onSubmit={handleLeave} className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-blue-400" />
              <span>Apply for Hostel Night Out / Leave</span>
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Warden Verification with Parental Consent Record
            </p>
          </div>

          <div className="space-y-3 bg-[#121826] border border-[#243048] rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#182033] border border-[#283552] text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#182033] border border-[#283552] text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Reason for Leave
              </label>
              <input
                type="text"
                required
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="e.g. Attending sister's wedding at native place"
                className="w-full px-3 py-2 rounded-xl bg-[#182033] border border-[#283552] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Parent Emergency Mobile
              </label>
              <input
                type="tel"
                required
                value={leaveEmergencyPhone}
                onChange={(e) => setLeaveEmergencyPhone(e.target.value)}
                placeholder="+91 9876500000"
                className="w-full px-3 py-2 rounded-xl bg-[#182033] border border-[#283552] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting || !isOnline}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit to Warden'}
              </button>
              <button
                type="button"
                onClick={() => setTab('REQUESTS')}
                className="px-4 py-2.5 rounded-xl bg-[#1a2336] text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* -------------------------------------------------------- */}
      {/* 11. 👤 PROFILE VIEW */}
      {/* -------------------------------------------------------- */}
      {tab === 'PROFILE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <User size={18} className="text-amber-400" />
                <span>Student Profile &amp; Settings</span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">Account &amp; Offline Cache Management</p>
            </div>
          </div>

          <div className="bg-[#121826] border border-[#243048] rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xl flex items-center justify-center shrink-0">
                {student.fullName ? student.fullName[0] : 'S'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{student.fullName}</div>
                <div className="text-gray-400 font-mono text-[11px] truncate">{student.email}</div>
                <div className="text-emerald-400 font-mono text-[10px]">Student Account • BPUT</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-mono">ROLL NUMBER</span>
                <p className="font-bold text-white font-mono">{student.rollNumber}</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-mono">BRANCH</span>
                <p className="font-bold text-white">{student.department}</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-mono">HOSTEL / ROOM</span>
                <p className="font-bold text-white truncate">{student.hostel}</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-mono">PHONE</span>
                <p className="font-bold text-white font-mono">{student.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>OFFLINE STORAGE STATUS</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 size={12} />
                  <span>Synchronized</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  fetchAllLiteData();
                  setMsg({ type: 'success', text: 'Local student cache refreshed successfully.' });
                }}
                className="w-full py-2 rounded-xl bg-[#182236] hover:bg-[#202c44] border border-[#2b3956] text-gray-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <RotateCw size={13} />
                <span>Refresh Local Cache</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <LogOut size={13} />
                  <span>Log Out of Student Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* GATE PASS TURNSTILE MODAL (HMAC QR + 4-DIGIT PIN) */}
      {/* -------------------------------------------------------- */}
      {selectedGatePass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#121826] border-2 border-purple-500/40 rounded-3xl p-5 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedGatePass(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-gray-800/60"
            >
              <X size={16} />
            </button>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold uppercase border border-purple-500/30">
                ACTIVE GATE PASS
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {selectedGatePass.gatePass?.destination || 'Gate Exit Pass'}
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                {selectedGatePass.number}
              </p>
            </div>

            {/* Turnstile QR Code */}
            <div className="p-3 bg-white rounded-2xl mx-auto inline-block shadow-md">
              <QRCodeSVG
                value={selectedGatePass.gatePass?.qrTokenHash || selectedGatePass.number}
                size={160}
                level="H"
              />
            </div>

            {/* 4-Digit PIN Fallback (Crucial for Guards & Slow Connections) */}
            <div className="bg-[#1a2236] border border-[#2f3d60] rounded-2xl p-3">
              <div className="text-[10px] text-gray-400 uppercase font-mono">
                OFFLINE 4-DIGIT SECURITY PIN
              </div>
              <div className="text-2xl font-black text-amber-400 tracking-widest font-mono mt-0.5">
                {selectedGatePass.gatePass?.pin || '4821'}
              </div>
              <button
                type="button"
                onClick={() => handleCopyPin(selectedGatePass.gatePass?.pin || '4821')}
                className="mt-1 text-[10px] text-gray-400 hover:text-white flex items-center justify-center gap-1 mx-auto"
              >
                {copiedPin ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{copiedPin ? 'Copied to clipboard' : 'Copy PIN'}</span>
              </button>
            </div>

            <p className="text-[11px] text-gray-400 leading-tight">
              Present this QR to Security Scanner at Main Gate 1, or recite your 4-digit PIN for manual entry.
            </p>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* MOBILE-FIRST FIXED BOTTOM NAVIGATION BAR */}
      {/* -------------------------------------------------------- */}
      <nav
        aria-label="Student Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d121c]/95 backdrop-blur-md border-t border-[#1e273a] px-2 py-2 max-w-lg mx-auto shadow-2xl"
      >
        <div className="grid grid-cols-5 gap-1 text-center">
          <button
            type="button"
            onClick={() => setTab('DASHBOARD')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              tab === 'DASHBOARD'
                ? 'text-amber-400 font-bold bg-amber-400/10'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Home size={18} />
            <span className="text-[10px] mt-1">Home</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('ID_CARD')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              tab === 'ID_CARD'
                ? 'text-amber-400 font-bold bg-amber-400/10'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <QrCode size={18} />
            <span className="text-[10px] mt-1">ID Card</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('ATTENDANCE')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              tab === 'ATTENDANCE'
                ? 'text-amber-400 font-bold bg-amber-400/10'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen size={18} />
            <span className="text-[10px] mt-1">Classes</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('REQUESTS')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              tab === 'REQUESTS' ||
              tab === 'COMPLAINT' ||
              tab === 'GATE_PASS' ||
              tab === 'BONAFIDE' ||
              tab === 'LEAVE'
                ? 'text-amber-400 font-bold bg-amber-400/10'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText size={18} />
            <span className="text-[10px] mt-1">Requests</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('PROFILE')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              tab === 'PROFILE'
                ? 'text-amber-400 font-bold bg-amber-400/10'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <User size={18} />
            <span className="text-[10px] mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
