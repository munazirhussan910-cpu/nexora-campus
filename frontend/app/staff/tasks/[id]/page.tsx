'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PriorityBadge } from '@/components/status/PriorityBadge';
import { SLAIndicator } from '@/components/status/SLAIndicator';
import { Timeline } from '@/components/tables/Timeline';
import {
  ArrowLeft,
  Wrench,
  Clock,
  CheckCircle2,
  Play,
  Check,
  AlertCircle,
  MapPin,
  User,
  Phone,
  MessageSquare,
} from 'lucide-react';

export default function StaffTaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Resolution Notes Modal / Form
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchTask = async () => {
    setLoading(true);
    const res = await apiRequest(`/requests/${taskId}`);
    if (res.success && res.data) {
      setTask(res.data);
      if (res.data.complaint?.resolutionNotes) {
        setResolutionNotes(res.data.complaint.resolutionNotes);
      }
    } else {
      setError(res.error?.message || 'Failed to load task details');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (taskId) fetchTask();
  }, [taskId]);

  const handleAccept = async () => {
    setSubmittingAction(true);
    setActionSuccess('');
    const res = await apiRequest(`/complaints/${taskId}/accept`, { method: 'POST' });
    if (res.success) {
      setActionSuccess('Task accepted successfully! Student has been notified.');
      fetchTask();
    } else {
      setError(res.error?.message || 'Failed to accept task');
    }
    setSubmittingAction(false);
  };

  const handleStart = async () => {
    setSubmittingAction(true);
    setActionSuccess('');
    const res = await apiRequest(`/complaints/${taskId}/start`, { method: 'POST' });
    if (res.success) {
      setActionSuccess('Work marked as IN PROGRESS. Student notified.');
      fetchTask();
    } else {
      setError(res.error?.message || 'Failed to start work');
    }
    setSubmittingAction(false);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;

    setSubmittingAction(true);
    setActionSuccess('');
    const res = await apiRequest(`/complaints/${taskId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionNotes }),
    });

    if (res.success) {
      setActionSuccess('Complaint marked as RESOLVED! Notification dispatched to student for confirmation.');
      fetchTask();
    } else {
      setError(res.error?.message || 'Failed to resolve task');
    }
    setSubmittingAction(false);
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-gray-500">Loading work order details...</div>;
  }

  if (error && !task) {
    return (
      <div className="py-16 text-center text-xs text-rose-400">
        {error}
        <div className="mt-4">
          <Link href="/staff/tasks" className="text-amber-400 hover:underline">
            &larr; Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/staff/tasks"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
      >
        <ArrowLeft size={14} /> Back to Work Orders
      </Link>

      {/* Main Task Header Card */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#282f42] pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="font-mono text-base font-extrabold text-amber-300">
                {task.requestNumber}
              </span>
              <StatusBadge status={task.status} size="md" />
              <PriorityBadge priority={task.priority} />
              <span className="text-xs px-2.5 py-0.5 rounded bg-[#202535] text-gray-200 border border-[#2e374d]">
                Category: {task.complaint?.category || 'General'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-white leading-snug">{task.title}</h1>
          </div>

          {/* Quick Action Buttons for Technician */}
          <div className="flex flex-wrap gap-2">
            {task.status === 'ASSIGNED' && (
              <button
                onClick={handleAccept}
                disabled={submittingAction}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow transition"
              >
                <Check size={15} /> Accept Task
              </button>
            )}

            {task.status === 'ACCEPTED' && (
              <button
                onClick={handleStart}
                disabled={submittingAction}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition"
              >
                <Play size={14} /> Start On-Site Work
              </button>
            )}
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} /> <span>{actionSuccess}</span>
          </div>
        )}

        {/* SLA Indicator */}
        <SLAIndicator sla={task.sla} />

        {/* Details Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Requester Information
            </span>
            <div className="flex items-center gap-2 text-gray-200">
              <User size={14} className="text-gray-400" />
              <span>Student: <strong>{task.requester?.student?.fullName || task.requester?.username}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 font-mono">
              <span>Roll Number: <strong>{task.requester?.student?.rollNumber || 'N/A'}</strong></span>
            </div>
            {task.requester?.student?.phone && (
              <div className="flex items-center gap-2 text-gray-300">
                <Phone size={14} className="text-emerald-400" />
                <span>Phone: <strong>{task.requester.student.phone}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={14} className="text-amber-400" />
              <span>Location: <strong>{task.location}</strong></span>
            </div>
          </div>

          <div className="bg-[#181b26] p-4 rounded-xl border border-[#282f42] space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Problem Description
            </span>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        </div>

        {/* Resolution Notes Action Box */}
        {['ACCEPTED', 'IN_PROGRESS'].includes(task.status) && (
          <div className="bg-[#1a2030] border border-amber-600/40 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-amber-400" />
              <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider">
                Technician Resolution Entry
              </h3>
            </div>
            <p className="text-xs text-gray-400">
              Provide exact details of parts replaced or repair procedure executed. This will be shared with the student and recorded in the audit log.
            </p>

            <form onSubmit={handleResolve} className="space-y-3">
              <textarea
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Replaced leaking valve gasket with brand new brass spindle. Checked water flow under high pressure."
                className="w-full bg-[#12151f] border border-[#2e3447] rounded-lg p-3 text-xs text-white placeholder-gray-500 h-24 focus:outline-none focus:border-amber-400"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingAction || !resolutionNotes.trim()}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow transition disabled:opacity-50"
                >
                  {submittingAction ? 'Recording...' : 'Mark Resolved & Notify Student'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Display Resolution Notes if resolved */}
        {task.complaint?.resolutionNotes && ['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(task.status) && (
          <div className="bg-emerald-950/30 border border-emerald-800 p-4 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              Resolution Notes Recorded by Technician
            </span>
            <p className="text-xs text-emerald-200 leading-relaxed">
              {task.complaint.resolutionNotes}
            </p>
          </div>
        )}
      </div>

      {/* Live Timeline Section */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-[#282f42] pb-3 mb-5">
          <Clock size={16} className="text-gold" />
          <h2 className="text-sm font-bold text-white">Full Task History &amp; Audit Trail</h2>
        </div>

        <Timeline history={task.timeline || []} />
      </div>
    </div>
  );
}
