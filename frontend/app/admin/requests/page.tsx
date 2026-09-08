'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PriorityBadge } from '@/components/status/PriorityBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import { Timeline } from '@/components/tables/Timeline';
import {
  Search,
  Filter,
  Layers,
  Wrench,
  User,
  MapPin,
  ArrowRight,
  Clock,
  X,
  UserCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Reassignment Modal State
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [targetStaffId, setTargetStaffId] = useState('');
  const [reassignComment, setReassignComment] = useState('');
  const [reassignMsg, setReassignMsg] = useState('');
  const [submittingReassign, setSubmittingReassign] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const [reqRes, staffRes] = await Promise.all([
      apiRequest('/requests'),
      apiRequest('/admin/staff'),
    ]);

    if (reqRes.success && reqRes.data) setRequests(reqRes.data);
    if (staffRes.success && staffRes.data) setStaffList(staffRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !targetStaffId) return;

    setSubmittingReassign(true);
    setReassignMsg('');

    const res = await apiRequest(`/requests/${selectedReq.id}/reassign`, {
      method: 'POST',
      body: JSON.stringify({
        staffUserId: targetStaffId,
        comment: reassignComment || 'Reassigned by Operations Director',
      }),
    });

    if (res.success) {
      setReassignMsg('Task successfully reassigned! Notification dispatched to technician.');
      fetchRequests();
      setTimeout(() => setSelectedReq(null), 1500);
    } else {
      setReassignMsg(res.error?.message || 'Failed to reassign request');
    }
    setSubmittingReassign(false);
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && r.requestType?.code !== typeFilter) return false;
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const num = r.requestNumber?.toLowerCase().includes(q);
      const title = r.title?.toLowerCase().includes(q);
      const loc = r.location?.toLowerCase().includes(q);
      const student = r.requester?.student?.fullName?.toLowerCase().includes(q);
      if (!num && !title && !loc && !student) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Campus Requests Management</h1>
          <p className="text-xs text-gray-400">
            Global operational view across complaints, gate passes, bonafide certificates, and leave requests.
          </p>
        </div>
      </div>

      {/* Multi-filter Bar */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1c2130] border border-[#2e3447] rounded-lg px-3 py-1.5 text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
            <option value="APPROVED">APPROVED</option>
            <option value="DEPARTED">DEPARTED</option>
            <option value="RETURNED">RETURNED</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#1c2130] border border-[#2e3447] rounded-lg px-3 py-1.5 text-white"
          >
            <option value="ALL">All Request Types</option>
            <option value="COMPLAINT">COMPLAINT</option>
            <option value="GATE_PASS">GATE_PASS</option>
            <option value="BONAFIDE">BONAFIDE</option>
            <option value="LEAVE">LEAVE</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#1c2130] border border-[#2e3447] rounded-lg px-3 py-1.5 text-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="NORMAL">NORMAL</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, student, room..."
            className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No requests match the selected filters.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {filteredRequests.map((r) => (
              <div
                key={r.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#181b26] transition text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-gold">{r.requestNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#202535] text-gray-300 border border-[#2d364d]">
                      {r.requestType?.name}
                    </span>
                    <StatusBadge status={r.status} size="sm" />
                    <PriorityBadge priority={r.priority} />
                  </div>

                  <h3 className="text-xs font-semibold text-gray-100">{r.title}</h3>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>Requester: <strong>{r.requester?.student?.fullName || r.requester?.username}</strong></span>
                    <span>•</span>
                    <span>Location: <strong>{r.location || 'Campus'}</strong></span>
                    <span>•</span>
                    <span>Staff: <strong>{r.assignedStaff?.staff?.fullName || 'Unassigned'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <SLAIndicator sla={r.sla} compact />
                  <button
                    onClick={() => { setSelectedReq(r); setTargetStaffId(''); setReassignMsg(''); }}
                    className="px-3 py-1.5 rounded-lg bg-[#1f2638] hover:bg-[#28324a] text-gold border border-[#3d4661] transition font-bold"
                  >
                    Manage / Reassign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manage & Reassignment Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141722] border border-[#3d4661] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gold">{selectedReq.requestNumber}</span>
                <span className="font-semibold text-white text-sm">{selectedReq.title}</span>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-gray-300 space-y-2 bg-[#181b26] p-3 rounded-xl border border-[#282f42]">
              <div><strong>Requester:</strong> {selectedReq.requester?.student?.fullName} ({selectedReq.requester?.student?.rollNumber})</div>
              <div><strong>Location:</strong> {selectedReq.location}</div>
              <div><strong>Current Assigned Staff:</strong> {selectedReq.assignedStaff?.staff?.fullName || 'None'}</div>
              <div><strong>Status:</strong> {selectedReq.status}</div>
            </div>

            {reassignMsg && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
                {reassignMsg}
              </div>
            )}

            <form onSubmit={handleReassign} className="space-y-3 text-xs pt-1">
              <h4 className="font-bold text-gray-200">Reassign to Maintenance Staff</h4>

              <div>
                <label className="block text-gray-400 mb-1">Select Technician</label>
                <select
                  required
                  value={targetStaffId}
                  onChange={(e) => setTargetStaffId(e.target.value)}
                  className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="">-- Choose Staff Member --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.userId}>
                      {s.fullName} ({s.specialization} • {s.activeTasks} active tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Reassignment Reason / Note</label>
                <textarea
                  value={reassignComment}
                  onChange={(e) => setReassignComment(e.target.value)}
                  placeholder="e.g. Workload balancing, reallocated from primary technician..."
                  className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 rounded-lg bg-[#1f2434] text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReassign || !targetStaffId}
                  className="px-5 py-2 rounded-lg bg-gold text-black font-bold hover:bg-[#c49f2e] disabled:opacity-50"
                >
                  {submittingReassign ? 'Reassigning...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
