'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export default function AcademicDeadlinesPage() {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    targetYear: '' as string | number,
    targetBranchId: '',
    relatedForm: 'GENERAL',
    actionUrl: '/student/academics',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadDeadlines = async () => {
    setLoading(true);
    setActionError('');
    const [deadRes, brRes] = await Promise.all([
      apiRequest('/academic/deadlines'),
      apiRequest('/academic/branches'),
    ]);

    if (deadRes.success && deadRes.data) setDeadlines(deadRes.data);
    else setActionError(deadRes.error?.message || 'Failed to load deadlines');

    if (brRes.success && brRes.data) setBranches(brRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadDeadlines();
  }, []);

  const openCreateModal = () => {
    setEditingDeadline(null);
    setFormData({
      title: '',
      description: '',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetYear: '',
      targetBranchId: '',
      relatedForm: 'GENERAL',
      actionUrl: '/student/academics',
    });
    setModalOpen(true);
  };

  const openEditModal = (d: any) => {
    setEditingDeadline(d);
    setFormData({
      title: d.title || '',
      description: d.description || '',
      deadline: d.deadline ? new Date(d.deadline).toISOString().split('T')[0] : '',
      targetYear: d.targetYear || '',
      targetBranchId: d.targetBranchId || '',
      relatedForm: d.relatedForm || 'GENERAL',
      actionUrl: d.actionUrl || '/student/academics',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove deadline "${title}"?`)) return;

    const res = await apiRequest(`/academic/deadlines/${id}`, { method: 'DELETE' });
    if (res.success) {
      setActionMsg(`Deadline "${title}" removed.`);
      loadDeadlines();
    } else {
      setActionError(res.error?.message || 'Failed to delete deadline');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError('');

    const payload = {
      ...formData,
      deadline: new Date(formData.deadline).toISOString(),
      targetYear: formData.targetYear ? Number(formData.targetYear) : null,
      targetBranchId: formData.targetBranchId ? formData.targetBranchId : null,
    };

    const res = editingDeadline
      ? await apiRequest(`/academic/deadlines/${editingDeadline.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      : await apiRequest('/academic/deadlines', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

    if (res.success) {
      setActionMsg(
        editingDeadline ? 'Deadline updated successfully!' : 'New deadline recorded successfully!'
      );
      setModalOpen(false);
      loadDeadlines();
    } else {
      setActionError(res.error?.message || 'Failed to save deadline.');
    }
    setSubmitting(false);
  };

  const now = new Date();

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/academic/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition mb-2"
          >
            <ArrowLeft size={13} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Academic Operations Deadlines &amp; Milestones
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Set and monitor critical cutoffs for exam forms, scholarship verifications, registration, and internship NOCs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus size={14} />
            <span>+ Add Deadline</span>
          </button>
          <button
            onClick={loadDeadlines}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#171c2b] border border-[#263047] text-gray-300 hover:text-white transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#d4af37]' : ''} />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg('')} className="p-1 hover:bg-emerald-900/50 rounded-lg">
            <X size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-400" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="p-1 hover:bg-rose-900/50 rounded-lg">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Deadlines List */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-3">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-purple-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Scheduled Deadlines ({deadlines.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading academic deadlines...</div>
        ) : deadlines.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No academic deadlines recorded. Click &ldquo;+ Add Deadline&rdquo; above.
          </div>
        ) : (
          <div className="divide-y divide-[#20273a]">
            {deadlines.map((d) => {
              const dueDate = new Date(d.deadline);
              const diffMs = dueDate.getTime() - now.getTime();
              const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              const isPast = daysLeft < 0;

              return (
                <div
                  key={d.id}
                  className="py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs group"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm text-white group-hover:text-[#d4af37] transition">
                        {d.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          isPast
                            ? 'bg-gray-800 text-gray-400 border border-gray-700'
                            : daysLeft <= 3
                            ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                            : 'bg-purple-950 text-purple-300 border border-purple-700/60'
                        }`}
                      >
                        {isPast ? 'EXPIRED' : daysLeft === 0 ? 'DUE TODAY' : `${daysLeft} DAYS LEFT`}
                      </span>
                    </div>

                    <p className="text-gray-300 leading-relaxed text-xs">{d.description}</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 font-mono pt-1">
                      <span className="text-[#d4af37] font-semibold flex items-center gap-1">
                        <Calendar size={12} />
                        Due: {dueDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>•</span>
                      <span>Target: {d.targetYear ? `Year ${d.targetYear}` : 'All Years'} ({d.branch?.code || 'ALL'})</span>
                      {d.relatedForm && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-300">Form: {d.relatedForm}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    {d.actionUrl && (
                      <Link
                        href={d.actionUrl}
                        className="p-2 rounded-xl bg-[#171c2b] hover:bg-[#202738] border border-[#2b354d] text-cyan-300 hover:text-white transition"
                        title="Preview Student Action Link"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    )}
                    <button
                      onClick={() => openEditModal(d)}
                      className="p-2 rounded-xl bg-[#171c2b] hover:bg-[#202738] border border-[#2b354d] text-gray-300 hover:text-white transition"
                      title="Edit Deadline"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id, d.title)}
                      className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 transition"
                      title="Delete Deadline"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-tab-fade">
          <div className="bg-[#121624] border border-[#2a344c] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212739] pb-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Clock size={18} />
                <h3 className="text-base font-bold text-white">
                  {editingDeadline ? 'Edit Academic Deadline' : 'Add Academic Deadline'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1b2234] text-gray-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BPUT Mid-Semester Examination Form Submission"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Details, instructions, and late fee consequences..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Cutoff Deadline Date</label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Target Year</label>
                  <select
                    value={formData.targetYear}
                    onChange={(e) => setFormData({ ...formData, targetYear: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Target Branch</label>
                  <select
                    value={formData.targetBranchId}
                    onChange={(e) => setFormData({ ...formData, targetBranchId: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Related Form / Workflow</label>
                  <select
                    value={formData.relatedForm}
                    onChange={(e) => setFormData({ ...formData, relatedForm: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="EXAM_FORM">Examination Form</option>
                    <option value="BONAFIDE">Bonafide Certificate</option>
                    <option value="INTERNSHIP">Internship NOC</option>
                    <option value="SCHOLARSHIP">Scholarship Portal</option>
                    <option value="REGISTRATION">Registration</option>
                    <option value="GENERAL">General Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Action URL</label>
                  <input
                    type="text"
                    required
                    placeholder="/student/documents"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#212739]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#171c2a] text-gray-300 border border-[#273248]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#d4af37] text-black font-bold hover:bg-[#e4c257] shadow transition"
                >
                  {submitting ? 'Saving...' : editingDeadline ? 'Update Deadline' : 'Add Deadline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
