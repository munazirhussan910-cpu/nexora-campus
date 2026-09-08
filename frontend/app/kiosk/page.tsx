'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import {
  Monitor,
  User,
  Wrench,
  Key,
  FileCheck,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
} from 'lucide-react';

export default function KioskPage() {
  const [rollNumber, setRollNumber] = useState('220101048'); // Aryan prefilled for fast judging
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active form modal/tab in kiosk
  const [activeTab, setActiveTab] = useState<'HOME' | 'COMPLAINT' | 'GATE_PASS' | 'BONAFIDE' | 'LEAVE'>('HOME');

  // Form states
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [gatePassDest, setGatePassDest] = useState('');
  const [gatePassReason, setGatePassReason] = useState('');
  const [bonafidePurpose, setBonafidePurpose] = useState('Scholarship');
  const [leaveReason, setLeaveReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rollNumber.trim()) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');
    const res = await apiRequest(`/kiosk/student/${rollNumber.trim()}`);
    if (res.success && res.data) {
      setStudentData(res.data);
      setActiveTab('HOME');
    } else {
      setError(res.error?.message || 'Student roll number not found.');
      setStudentData(null);
    }
    setLoading(false);
  };

  const handleCreateRequest = async (type: string, payload: any) => {
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    const res = await apiRequest('/kiosk/requests', {
      method: 'POST',
      body: JSON.stringify({
        rollNumber: studentData.student.rollNumber,
        type,
        ...payload,
      }),
    });

    if (res.success) {
      setSuccessMsg(res.message || 'Request successfully recorded at Kiosk!');
      setActiveTab('HOME');
      // Refresh student requests
      handleLookup();
    } else {
      setError(res.error?.message || 'Failed to submit request.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0d14] text-white p-4 sm:p-8 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full">
        {/* Kiosk Header */}
        <header className="flex items-center justify-between border-b border-[#282f42] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
              <Monitor size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-100 flex items-center gap-2">
                NEXORA CAMPUS TOUCH KIOSK
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                  KIOSK MODE
                </span>
              </h1>
              <p className="text-xs text-gray-400">
                Self-Service Request & Gate Pass Station • Academic Block Ground Floor
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-[#2e3447] bg-[#141722]"
          >
            <ArrowLeft size={14} /> Exit Kiosk
          </Link>
        </header>

        {/* Roll Number Input Bar */}
        <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-5 mb-6 shadow-xl">
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Enter Student Roll Number (e.g. 220101048)"
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono tracking-wider font-semibold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-6 py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <User size={16} />
              <span>{loading ? 'Searching...' : 'Identify Student'}</span>
            </button>
          </form>

          {/* Quick preset buttons for demo */}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <span className="text-gray-500">Quick Test Personas:</span>
            <button
              onClick={() => { setRollNumber('220101048'); }}
              className="px-2 py-0.5 rounded bg-[#1e2333] border border-[#2e354c] hover:text-cyan-300 font-mono text-[11px]"
            >
              Aryan (220101048)
            </button>
            <button
              onClick={() => { setRollNumber('220101012'); }}
              className="px-2 py-0.5 rounded bg-[#1e2333] border border-[#2e354c] hover:text-cyan-300 font-mono text-[11px]"
            >
              Rohit (220101012)
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Student Session Details */}
        {studentData && (
          <div>
            {/* Student Profile Card */}
            <div className="bg-[#181b26] border border-cyan-900/50 rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow">
                  {studentData.student.fullName[0]}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-100">{studentData.student.fullName}</h2>
                  <div className="text-xs text-gray-400 font-mono">
                    Roll: <span className="text-cyan-300 font-bold">{studentData.student.rollNumber}</span> • {studentData.student.branch} • Year {studentData.student.year}
                  </div>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="text-gray-400">Assigned Residential Unit</div>
                <div className="font-bold text-gray-200">
                  {studentData.student.hostelBlock} / Room {studentData.student.roomNumber}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <button
                onClick={() => setActiveTab('COMPLAINT')}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                  activeTab === 'COMPLAINT'
                    ? 'bg-amber-950/40 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-[#141722] border-[#282f42] text-gray-300 hover:border-amber-700'
                }`}
              >
                <Wrench size={22} className="text-amber-400 mb-2" />
                <span className="font-bold text-xs">Log Complaint</span>
                <span className="text-[10px] text-gray-400">Maintenance & fixes</span>
              </button>

              <button
                onClick={() => setActiveTab('GATE_PASS')}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                  activeTab === 'GATE_PASS'
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-md'
                    : 'bg-[#141722] border-[#282f42] text-gray-300 hover:border-cyan-700'
                }`}
              >
                <Key size={22} className="text-cyan-400 mb-2" />
                <span className="font-bold text-xs">Campus Gate Pass</span>
                <span className="text-[10px] text-gray-400">Exit authorization</span>
              </button>

              <button
                onClick={() => setActiveTab('BONAFIDE')}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                  activeTab === 'BONAFIDE'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-[#141722] border-[#282f42] text-gray-300 hover:border-emerald-700'
                }`}
              >
                <FileCheck size={22} className="text-emerald-400 mb-2" />
                <span className="font-bold text-xs">Request Bonafide</span>
                <span className="text-[10px] text-gray-400">Official certificate</span>
              </button>

              <button
                onClick={() => setActiveTab('LEAVE')}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                  activeTab === 'LEAVE'
                    ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-md'
                    : 'bg-[#141722] border-[#282f42] text-gray-300 hover:border-purple-700'
                }`}
              >
                <Calendar size={22} className="text-purple-400 mb-2" />
                <span className="font-bold text-xs">Hostel Leave</span>
                <span className="text-[10px] text-gray-400">Multi-day absence</span>
              </button>
            </div>

            {/* Active Action Form View */}
            {activeTab === 'COMPLAINT' && (
              <div className="bg-[#141722] border border-amber-800/60 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-sm text-amber-300 mb-3 flex items-center gap-2">
                  <Wrench size={16} /> New Campus Complaint Form
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Issue Title</label>
                    <input
                      type="text"
                      value={complaintTitle}
                      onChange={(e) => setComplaintTitle(e.target.value)}
                      placeholder="e.g. Washbasin tap leaking heavily"
                      className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Detailed Description</label>
                    <textarea
                      value={complaintDesc}
                      onChange={(e) => setComplaintDesc(e.target.value)}
                      placeholder="Describe the issue. Tap/leak keywords route to Plumbing, fan/spark to Electrical."
                      className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white h-20"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('HOME')}
                      className="px-4 py-2 rounded-lg text-xs bg-[#1f2434] text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={submitting || !complaintTitle}
                      onClick={() =>
                        handleCreateRequest('COMPLAINT', {
                          title: complaintTitle,
                          description: complaintDesc || complaintTitle,
                        })
                      }
                      className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-500 text-black hover:bg-amber-400"
                    >
                      {submitting ? 'Submitting...' : 'Register Complaint'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'GATE_PASS' && (
              <div className="bg-[#141722] border border-cyan-800/60 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-sm text-cyan-300 mb-3 flex items-center gap-2">
                  <Key size={16} /> Instant Gate Pass Request
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Destination</label>
                    <input
                      type="text"
                      value={gatePassDest}
                      onChange={(e) => setGatePassDest(e.target.value)}
                      placeholder="e.g. City Market / Station"
                      className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Reason for Departure</label>
                    <input
                      type="text"
                      value={gatePassReason}
                      onChange={(e) => setGatePassReason(e.target.value)}
                      placeholder="e.g. Purchasing urgent academic supplies"
                      className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('HOME')}
                      className="px-4 py-2 rounded-lg text-xs bg-[#1f2434] text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={submitting || !gatePassDest}
                      onClick={() =>
                        handleCreateRequest('GATE_PASS', {
                          title: `Gate Pass to ${gatePassDest}`,
                          description: gatePassReason || 'Routine city visit',
                          extraData: { destination: gatePassDest },
                        })
                      }
                      className="px-5 py-2 rounded-lg text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400"
                    >
                      {submitting ? 'Submitting...' : 'Submit Gate Pass'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'BONAFIDE' && (
              <div className="bg-[#141722] border border-emerald-800/60 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-sm text-emerald-300 mb-3 flex items-center gap-2">
                  <FileCheck size={16} /> Request Official Bonafide Certificate
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Purpose of Certificate</label>
                    <select
                      value={bonafidePurpose}
                      onChange={(e) => setBonafidePurpose(e.target.value)}
                      className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
                    >
                      <option value="Scholarship">Scholarship Verification</option>
                      <option value="Bank">Bank Account Opening / Education Loan</option>
                      <option value="Internship">Summer Internship Application</option>
                      <option value="Passport">Passport / Visa Verification</option>
                      <option value="Other">Other Academic Reason</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('HOME')}
                      className="px-4 py-2 rounded-lg text-xs bg-[#1f2434] text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={submitting}
                      onClick={() =>
                        handleCreateRequest('BONAFIDE', {
                          title: `Bonafide Certificate (${bonafidePurpose})`,
                          description: `Kiosk request for ${bonafidePurpose}`,
                        })
                      }
                      className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400"
                    >
                      {submitting ? 'Submitting...' : 'Request Certificate'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Student's Recent Requests View */}
            <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                <Clock size={14} /> Recent Requests for {studentData.student.fullName}
              </h3>
              <div className="divide-y divide-[#22283a]">
                {studentData.recentRequests.length === 0 ? (
                  <div className="text-gray-500 text-xs py-4 text-center">No recent campus requests found.</div>
                ) : (
                  studentData.recentRequests.map((r: any) => (
                    <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-200">
                            {r.requestNumber}
                          </span>
                          <StatusBadge status={r.status} size="sm" />
                        </div>
                        <div className="text-xs text-gray-300 mt-0.5">{r.title}</div>
                      </div>
                      <div className="text-right text-[11px] text-gray-400 font-mono">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-gray-500 pt-6">
        Nexora Campus Self-Service Terminal • Touch Screen Kiosk Engine
      </footer>
    </div>
  );
}
