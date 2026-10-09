'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PriorityBadge } from '@/components/status/PriorityBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
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
  RefreshCw,
} from 'lucide-react';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchRequests = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    try {
      const [reqRes, staffRes] = await Promise.all([
        apiRequest('/requests'),
        apiRequest('/admin/staff'),
      ]);

      if (reqRes.success && reqRes.data) setRequests(reqRes.data);
      if (staffRes.success && staffRes.data) setStaffList(staffRes.data);
    } catch (e) {
      console.error('Failed to fetch requests', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21273a] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
              Operations Dispatch
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Campus Requests Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Global operational view across complaints, gate passes, bonafide certificates, and leave requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchRequests(true)}
          disabled={loading || refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border hover:border-primary/60 text-xs font-semibold text-foreground hover:bg-surface-secondary/80 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin text-primary' : ''} />
          <span>Sync Requests</span>
        </button>
      </div>

      {/* Multi-filter Bar */}
      <div className="bg-surface border border-border shadow-xs rounded-xl sm:rounded-2xl p-3.5 sm:p-4.5 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between text-xs shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2 text-foreground font-medium focus:outline-hidden cursor-pointer"
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
            className="w-full bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2 text-foreground font-medium focus:outline-hidden cursor-pointer"
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
            className="w-full bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2 text-foreground font-medium focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="NORMAL">NORMAL</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div className="relative w-full lg:w-80">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, student, room..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-surface border border-border shadow-xs rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-[#212739] flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">
            Showing <strong className="text-white">{filteredRequests.length}</strong> of{' '}
            {requests.length} requests
          </span>
          <span className="text-[11px] font-mono text-primary">Live Operational Queue</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={18} className="animate-spin text-primary" />
            <span>Loading requests stream...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-1">
            <Layers size={24} className="text-slate-600 mx-auto mb-2" />
            <div className="font-semibold text-slate-400">No requests match the selected filters.</div>
            <div className="text-[11px] text-slate-600">Try adjusting your search query or status criteria.</div>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2434]">
            {filteredRequests.map((r) => (
              <div
                key={r.id}
                className="p-3.5 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-secondary/50 transition-colors text-xs"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-extrabold text-primary text-xs sm:text-sm">
                      {r.requestNumber}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c2234] text-slate-300 border border-[#2a3449]">
                      {r.requestType?.name || r.requestType?.code}
                    </span>
                    <StatusBadge status={r.status} size="sm" />
                    <PriorityBadge priority={r.priority} />
                    <span className="text-slate-400 text-[11px] font-mono flex items-center gap-1">
                      <MapPin size={11} className="text-slate-500 shrink-0" />
                      <span>{r.location || 'Campus Wide'}</span>
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                    {r.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono flex-wrap">
                    <span>
                      Requester:{' '}
                      <strong className="text-slate-300 font-sans">
                        {r.requester?.student?.fullName || r.requester?.username}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Assigned:{' '}
                      <strong className={r.assignedStaff ? 'text-cyan-300 font-sans' : 'text-amber-400 font-sans'}>
                        {r.assignedStaff?.staff?.fullName || 'Pending Assignment'}
                      </strong>
                    </span>
                    {r.createdAt && (
                      <>
                        <span>•</span>
                        <span className="text-slate-500">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1c2234]">
                  <SLAIndicator sla={r.sla} compact />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReq(r);
                      setTargetStaffId('');
                      setReassignMsg('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-surface-secondary hover:bg-surface-secondary/80 text-primary border border-border hover:border-primary/60 transition font-bold text-xs active:scale-95 shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border shadow-2xl rounded-2xl max-w-xl w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#212739] pb-3">
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono font-extrabold text-primary">
                  {selectedReq.requestNumber}
                </span>
                <span className="font-bold text-white text-sm truncate">
                  {selectedReq.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1a2133] transition shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2 bg-[#171d2c] p-3.5 rounded-xl border border-[#263148]">
              <div>
                <strong className="text-slate-400">Requester:</strong>{' '}
                {selectedReq.requester?.student?.fullName} ({selectedReq.requester?.student?.rollNumber || 'Student'})
              </div>
              <div>
                <strong className="text-slate-400">Location:</strong> {selectedReq.location || 'Campus Wide'}
              </div>
              <div>
                <strong className="text-slate-400">Current Assigned Staff:</strong>{' '}
                <span className={selectedReq.assignedStaff ? 'text-cyan-300' : 'text-amber-400 font-bold'}>
                  {selectedReq.assignedStaff?.staff?.fullName || 'None'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <strong className="text-slate-400">Status:</strong>
                <StatusBadge status={selectedReq.status} size="sm" />
              </div>
            </div>

            {reassignMsg && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  reassignMsg.includes('Failed')
                    ? 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                }`}
              >
                {reassignMsg.includes('Failed') ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                <span>{reassignMsg}</span>
              </div>
            )}

            <form onSubmit={handleReassign} className="space-y-3.5 text-xs pt-1">
              <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                <UserCheck size={14} className="text-primary" />
                <span>Reassign to Maintenance Staff</span>
              </h4>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  Select Technician
                </label>
                <select
                  required
                  value={targetStaffId}
                  onChange={(e) => setTargetStaffId(e.target.value)}
                  className="w-full bg-surface-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-2.5 text-xs text-foreground focus:outline-hidden cursor-pointer"
                >
                  <option value="">-- Choose Staff Member --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.userId}>
                      {s.fullName} ({s.specialization} • {s.activeTasks || 0} active tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  Reassignment Reason / Operational Note
                </label>
                <textarea
                  value={reassignComment}
                  onChange={(e) => setReassignComment(e.target.value)}
                  placeholder="e.g. Workload re-balancing, delegated from primary maintenance technician..."
                  className="w-full bg-surface-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-2.5 text-xs text-foreground h-20 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#212739]">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 rounded-xl bg-[#181e2e] hover:bg-[#20273a] text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReassign || !targetStaffId}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-extrabold shadow-xs transition disabled:opacity-50"
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
