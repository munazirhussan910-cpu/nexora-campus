'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MapPin,
  User,
  Play,
  Check,
  RotateCw,
  Bell,
  Send,
  X,
} from 'lucide-react';

interface StaffLiteViewProps {
  currentUser: any;
  isOnline: boolean;
  setMsg: (msg: { type: 'info' | 'success' | 'error'; text: string } | null) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function StaffLiteView({
  currentUser,
  isOnline,
  setMsg,
  getStatusBadge,
}: StaffLiteViewProps) {
  const [tab, setTab] = useState<'TASKS' | 'NOTICES'>('TASKS');
  const [tasks, setTasks] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'URGENT' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [loading, setLoading] = useState(true);

  // Resolution modal / state
  const [resolvingTask, setResolvingTask] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchStaffData = async (bypassCache = false) => {
    setLoading(true);
    try {
      const [taskRes, notRes] = await Promise.all([
        apiRequest('/complaints/assigned', { useCache: !bypassCache }),
        apiRequest('/notices?lite=true&limit=10', { useCache: !bypassCache }),
      ]);

      if (taskRes.success && Array.isArray(taskRes.data)) {
        setTasks(taskRes.data);
      }
      if (notRes.success && Array.isArray(notRes.data)) {
        setNotices(notRes.data);
      }
    } catch {
      setMsg({ type: 'error', text: 'Failed to load technician task queue.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData(false);
  }, []);

  const handleAccept = async (id: string, reqNum: string) => {
    setSubmittingAction(true);
    const res = await apiRequest(`/complaints/${id}/accept`, { method: 'POST' });
    if (res.success) {
      setMsg({ type: 'success', text: `Task ${reqNum} accepted! Status: ACCEPTED.` });
      fetchStaffData(true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to accept task.' });
    }
    setSubmittingAction(false);
  };

  const handleStart = async (id: string, reqNum: string) => {
    setSubmittingAction(true);
    const res = await apiRequest(`/complaints/${id}/start`, { method: 'POST' });
    if (res.success) {
      setMsg({ type: 'success', text: `Task ${reqNum} marked as IN PROGRESS.` });
      fetchStaffData(true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to start work.' });
    }
    setSubmittingAction(false);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTask || !resolutionNotes.trim()) return;

    setSubmittingAction(true);
    const res = await apiRequest(`/complaints/${resolvingTask.id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionNotes: resolutionNotes.trim() }),
    });

    if (res.success) {
      setMsg({
        type: 'success',
        text: `Task ${resolvingTask.requestNumber} marked as RESOLVED! Requester notified.`,
      });
      setResolvingTask(null);
      setResolutionNotes('');
      fetchStaffData(true);
    } else {
      setMsg({ type: 'error', text: res.error?.message || 'Failed to mark task resolved.' });
    }
    setSubmittingAction(false);
  };

  // KPI Calculations
  const assignedCount = tasks.filter((t) => t.status === 'ASSIGNED').length;
  const inProgressCount = tasks.filter((t) => ['ACCEPTED', 'IN_PROGRESS'].includes(t.status)).length;
  const overdueCount = tasks.filter((t) => t.sla?.isOverdue && !['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(t.status)).length;
  const resolvedCount = tasks.filter((t) => ['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(t.status)).length;

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'URGENT') return ['HIGH', 'URGENT'].includes(t.priority);
    if (filter === 'ASSIGNED') return t.status === 'ASSIGNED';
    if (filter === 'IN_PROGRESS') return ['ACCEPTED', 'IN_PROGRESS'].includes(t.status);
    if (filter === 'RESOLVED') return ['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(t.status);
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 4 Staff KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Assigned</span>
          <span className="font-mono text-lg font-bold text-amber-400 block">{assignedCount}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">In Progress</span>
          <span className="font-mono text-lg font-bold text-cyan-400 block">{inProgressCount}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Overdue</span>
          <span className="font-mono text-lg font-bold text-rose-400 block">{overdueCount}</span>
        </div>
        <div className="bg-[#121622] border border-[#232a3d] rounded-xl p-2.5 text-center min-w-0">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">Resolved</span>
          <span className="font-mono text-lg font-bold text-emerald-400 block">{resolvedCount}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setTab('TASKS')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
            tab === 'TASKS'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-[#121622] text-gray-300 border border-[#232a3d]'
          }`}
        >
          <Wrench size={14} />
          <span>My Work Orders ({tasks.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('NOTICES')}
          className={`py-2.5 px-4 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
            tab === 'NOTICES'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-[#121622] text-gray-300 border border-[#232a3d]'
          }`}
        >
          <Bell size={14} />
          <span>Notices ({notices.length})</span>
        </button>
      </div>

      {tab === 'TASKS' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#232a3d] pb-2.5 gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
              {(['ALL', 'URGENT', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition whitespace-nowrap min-h-[36px] ${
                    filter === f
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-[#181e2e] text-gray-400 hover:text-white border border-[#27334a]'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => fetchStaffData(true)}
              disabled={loading}
              className="p-1.5 rounded-lg bg-[#181f2f] hover:bg-[#20293d] border border-[#28354c] text-gray-300 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Refresh"
            >
              <RotateCw size={13} className={loading ? 'animate-spin text-amber-400' : ''} />
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 space-y-2">
              <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
              <p className="font-semibold text-gray-300">No tasks in this category</p>
              <p className="text-gray-500 text-[11px]">All clear for your specialization ({currentUser.specialization || 'Maintenance'}).</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((t) => {
                const isOverdue = t.sla?.isOverdue && !['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(t.status);
                const studentPhone = t.requester?.student?.phone;

                return (
                  <article
                    key={t.id}
                    className={`p-3.5 rounded-xl border transition space-y-2.5 text-xs ${
                      isOverdue
                        ? 'bg-rose-950/20 border-rose-700/80'
                        : 'bg-[#161b2a] border-[#242e44] hover:border-[#354363]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-amber-300 text-xs">{t.requestNumber}</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#1e2538] text-gray-300 border border-[#2c3750]">
                          {t.complaint?.category || 'General'}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          t.priority === 'URGENT' || t.priority === 'HIGH'
                            ? 'bg-rose-950 text-rose-300 border border-rose-700'
                            : 'bg-[#182030] text-gray-300 border border-[#28354c]'
                        }`}>
                          {t.priority}
                        </span>
                        {getStatusBadge(t.status)}
                      </div>

                      {isOverdue && (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                          SLA BREACHED
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-white text-xs leading-snug">{t.title}</h3>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{t.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 pt-1.5 border-t border-[#20293d]">
                      <span className="flex items-center gap-1 text-gray-300">
                        <MapPin size={11} className="text-amber-400 shrink-0" />
                        <strong>{t.location || 'Campus'}</strong>
                      </span>

                      {studentPhone ? (
                        <a
                          href={`tel:${studentPhone}`}
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono font-semibold"
                        >
                          <Phone size={11} />
                          <span>{studentPhone}</span>
                        </a>
                      ) : (
                        <span className="text-gray-500 font-mono">
                          {t.requester?.student?.fullName || t.requester?.username}
                        </span>
                      )}
                    </div>

                    {/* Resolution Notes Display if resolved */}
                    {t.complaint?.resolutionNotes && ['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(t.status) && (
                      <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-[11px]">
                        <strong>Procedure:</strong> {t.complaint.resolutionNotes}
                      </div>
                    )}

                    {/* Operational Action Buttons */}
                    <div className="pt-1 flex items-center gap-2">
                      {t.status === 'ASSIGNED' && (
                        <button
                          type="button"
                          disabled={submittingAction}
                          onClick={() => handleAccept(t.id, t.requestNumber)}
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition flex items-center justify-center gap-1.5 min-h-[44px] active:scale-[0.98]"
                        >
                          <Check size={14} className="stroke-[3]" />
                          <span>Accept Work Order</span>
                        </button>
                      )}

                      {t.status === 'ACCEPTED' && (
                        <button
                          type="button"
                          disabled={submittingAction}
                          onClick={() => handleStart(t.id, t.requestNumber)}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 min-h-[44px] active:scale-[0.98]"
                        >
                          <Play size={14} />
                          <span>Start On-Site Work</span>
                        </button>
                      )}

                      {t.status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          disabled={submittingAction}
                          onClick={() => {
                            setResolvingTask(t);
                            setResolutionNotes('');
                          }}
                          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition flex items-center justify-center gap-1.5 min-h-[44px] active:scale-[0.98]"
                        >
                          <CheckCircle2 size={15} />
                          <span>Mark Task Resolved</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'NOTICES' && (
        <section className="bg-[#121622] border border-[#232a3d] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <h2 className="font-bold text-sm text-white border-b border-[#232a3d] pb-2.5 flex items-center gap-2">
            <Bell size={16} className="text-amber-400" />
            <span>Campus Operational Notices</span>
          </h2>
          <div className="space-y-2.5">
            {notices.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-[#161b2a] border border-[#242e44] space-y-1 text-xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-white text-xs">{n.title}</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(n.publishedAt || n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">{n.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Resolution Notes Modal */}
      {resolvingTask && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setResolvingTask(null)}
        >
          <div
            className="bg-[#121624] border border-[#2b354d] rounded-2xl p-4 sm:p-5 max-w-sm w-full shadow-2xl space-y-3.5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#212739] pb-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                <CheckCircle2 size={17} />
                <h3 className="text-white font-bold truncate">Record Resolution Procedure</h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingTask(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-[#19243a] border border-[#2c3d5d]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="bg-[#0e111a] border border-[#212739] rounded-xl p-3 space-y-1 text-[11px] font-mono">
              <div>Ref: <strong className="text-amber-300">{resolvingTask.requestNumber}</strong></div>
              <div>Issue: <span className="text-white">{resolvingTask.title}</span></div>
              <div>Room: <span className="text-gray-300">{resolvingTask.location}</span></div>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1 text-[11px]">
                  Procedure &amp; Parts Replaced <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Replaced leaking valve spindle with brand new brass unit. Tested under pressure..."
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 resize-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-[#212739]">
                <button
                  type="button"
                  onClick={() => setResolvingTask(null)}
                  disabled={submittingAction}
                  className="flex-1 py-2.5 rounded-xl bg-[#171c2a] hover:bg-[#20273a] text-gray-300 border border-[#273248] font-semibold text-xs min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !resolutionNotes.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs min-h-[44px] transition shadow disabled:opacity-50"
                >
                  {submittingAction ? 'Recording...' : 'Mark Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
