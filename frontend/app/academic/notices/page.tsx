'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  Bell,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  Clock,
  Calendar,
} from 'lucide-react';

export default function AcademicNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'URGENT',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT',
    expiresAt: '',
    targetType: 'ALL' as 'ALL' | 'BRANCH' | 'YEAR' | 'SEMESTER' | 'SECTION',
    targetValue: 'ALL',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadNotices = async () => {
    setLoading(true);
    setActionError('');
    const res = await apiRequest('/academic/notices');
    if (res.success && res.data) {
      setNotices(res.data);
    } else {
      setActionError(res.error?.message || 'Failed to fetch academic notices');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const openCreateModal = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      content: '',
      priority: 'NORMAL',
      status: 'PUBLISHED',
      expiresAt: '',
      targetType: 'ALL',
      targetValue: 'ALL',
    });
    setModalOpen(true);
  };

  const openEditModal = (notice: any) => {
    setEditingNotice(notice);
    const firstTarget = notice.targets?.[0] || { targetType: 'ALL', targetValue: 'ALL' };
    setFormData({
      title: notice.title || '',
      content: notice.content || '',
      priority: notice.priority || 'NORMAL',
      status: notice.status || 'PUBLISHED',
      expiresAt: notice.expiresAt ? new Date(notice.expiresAt).toISOString().split('T')[0] : '',
      targetType: firstTarget.targetType,
      targetValue: firstTarget.targetValue,
    });
    setModalOpen(true);
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    const res = await apiRequest(`/academic/notices/${id}/publish`, { method: 'PATCH' });
    if (res.success) {
      setActionMsg(`Notice status changed.`);
      loadNotices();
    } else {
      setActionError(res.error?.message || 'Failed to update publish state');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete notice "${title}"?`)) return;

    const res = await apiRequest(`/academic/notices/${id}`, { method: 'DELETE' });
    if (res.success) {
      setActionMsg(`Notice "${title}" deleted.`);
      loadNotices();
    } else {
      setActionError(res.error?.message || 'Failed to delete notice');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError('');

    const payload = {
      title: formData.title,
      content: formData.content,
      priority: formData.priority,
      status: formData.status,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      targets: [
        {
          targetType: formData.targetType,
          targetValue: formData.targetType === 'ALL' ? 'ALL' : formData.targetValue,
        },
      ],
    };

    const res = editingNotice
      ? await apiRequest(`/academic/notices/${editingNotice.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      : await apiRequest('/academic/notices', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

    if (res.success) {
      setActionMsg(
        editingNotice ? 'Notice updated successfully!' : 'Official notice broadcasted successfully!'
      );
      setModalOpen(false);
      loadNotices();
    } else {
      setActionError(res.error?.message || 'Failed to save notice.');
    }
    setSubmitting(false);
  };

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
            Academic Notices &amp; Department Circulars
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Publish assessment notices, exam schedules, and targeted administrative updates directly to student cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus size={14} />
            <span>+ Publish Notice</span>
          </button>
          <button
            onClick={loadNotices}
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

      {/* Notice List */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              All Academic Notices ({notices.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No notices published. Click &ldquo;+ Publish Notice&rdquo; above.
          </div>
        ) : (
          <div className="divide-y divide-[#20273a]">
            {notices.map((n) => (
              <div
                key={n.id}
                className="py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs group"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm text-white">{n.title}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        n.priority === 'URGENT'
                          ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                          : 'bg-blue-950 text-blue-300 border border-blue-700/60'
                      }`}
                    >
                      {n.priority}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        n.status === 'PUBLISHED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}
                    >
                      {n.status}
                    </span>
                  </div>

                  <p className="text-gray-300 leading-relaxed text-xs">{n.content}</p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 font-mono pt-1">
                    <span>
                      Target:{' '}
                      <strong className="text-gray-200">
                        {n.targets?.map((t: any) => `${t.targetType}:${t.targetValue}`).join(', ') || 'ALL'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Published: {new Date(n.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {n.expiresAt && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400">
                          Expires: {new Date(n.expiresAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    onClick={() => handleTogglePublish(n.id, n.status)}
                    className="p-2 rounded-xl bg-[#171c2b] hover:bg-[#202738] border border-[#2b354d] text-gray-300 hover:text-white transition"
                    title={n.status === 'PUBLISHED' ? 'Unpublish (set to Draft)' : 'Publish immediately'}
                  >
                    {n.status === 'PUBLISHED' ? <EyeOff size={13} className="text-amber-400" /> : <Eye size={13} className="text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => openEditModal(n)}
                    className="p-2 rounded-xl bg-[#171c2b] hover:bg-[#202738] border border-[#2b354d] text-gray-300 hover:text-white transition"
                    title="Edit Notice"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(n.id, n.title)}
                    className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 transition"
                    title="Delete Notice"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Notice Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-tab-fade">
          <div className="bg-[#121624] border border-[#2a344c] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212739] pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Bell size={18} />
                <h3 className="text-base font-bold text-white">
                  {editingNotice ? 'Edit Academic Notice' : 'Publish Academic Notice'}
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
                <label className="block text-gray-300 font-semibold mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Semester Examination Schedule"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Notice Body / Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter official circular details, instructions, and dates..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e: any) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="URGENT">URGENT (High Alert)</option>
                    <option value="LOW">LOW (Informational)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live)</option>
                    <option value="DRAFT">DRAFT (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Target Audience</label>
                  <select
                    value={formData.targetType}
                    onChange={(e: any) => {
                      const t = e.target.value;
                      setFormData({
                        ...formData,
                        targetType: t,
                        targetValue: t === 'ALL' ? 'ALL' : t === 'YEAR' ? '2' : t === 'BRANCH' ? 'CSE' : 'A',
                      });
                    }}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="ALL">All Students</option>
                    <option value="BRANCH">Specific Branch</option>
                    <option value="YEAR">Specific Year</option>
                    <option value="SECTION">Specific Section</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Target Value</label>
                  {formData.targetType === 'ALL' ? (
                    <input
                      disabled
                      value="ALL (Campus Wide)"
                      className="w-full bg-[#131724] border border-[#202738] rounded-xl p-2.5 text-xs text-gray-500"
                    />
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder={formData.targetType === 'BRANCH' ? 'CSE' : formData.targetType === 'YEAR' ? '2' : 'A'}
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                      className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Expiry Date (Optional — leaves notice permanent if unset)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                />
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
                  {submitting ? 'Broadcasting...' : editingNotice ? 'Update Notice' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
