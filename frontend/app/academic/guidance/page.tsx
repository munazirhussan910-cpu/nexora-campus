'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  Compass,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  ExternalLink,
  Check,
  ListOrdered,
  FileText,
  Shield,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export default function AcademicGuidanceManagerPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'CERTIFICATE',
    subcategory: 'BONAFIDE',
    description: '',
    targetYear: '' as string | number,
    requiredDocs: '',
    processSteps: '',
    responsibleRole: 'ACADEMIC_OFFICER',
    relatedForm: 'BONAFIDE',
    actionUrl: '/student/documents?purpose=Scholarship',
    actionLabel: 'Start Application',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadGuidance = async () => {
    setLoading(true);
    setActionError('');
    const res = await apiRequest('/academic/guidance');
    if (res.success && res.data) setItems(res.data);
    else setActionError(res.error?.message || 'Failed to load guidance content');
    setLoading(false);
  };

  useEffect(() => {
    loadGuidance();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'CERTIFICATE',
      subcategory: 'BONAFIDE',
      description: '',
      targetYear: '',
      requiredDocs: 'Student Roll Number\nPurpose of certificate\nClearance proof',
      processSteps: '1. Fill application\n2. Submit request\n3. Academic Office reviews\n4. Download verified PDF',
      responsibleRole: 'ACADEMIC_OFFICER',
      relatedForm: 'BONAFIDE',
      actionUrl: '/student/documents',
      actionLabel: 'Start Application',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);

    let docsStr = item.requiredDocs || '';
    let stepsStr = item.processSteps || '';

    try {
      if (typeof item.requiredDocs === 'string' && item.requiredDocs.startsWith('[')) {
        docsStr = JSON.parse(item.requiredDocs).join('\n');
      }
    } catch {}

    try {
      if (typeof item.processSteps === 'string' && item.processSteps.startsWith('[')) {
        stepsStr = JSON.parse(item.processSteps).join('\n');
      }
    } catch {}

    setFormData({
      title: item.title || '',
      category: item.category || 'CERTIFICATE',
      subcategory: item.subcategory || '',
      description: item.description || '',
      targetYear: item.targetYear || '',
      requiredDocs: docsStr,
      processSteps: stepsStr,
      responsibleRole: item.responsibleRole || 'ACADEMIC_OFFICER',
      relatedForm: item.relatedForm || '',
      actionUrl: item.actionUrl || '',
      actionLabel: item.actionLabel || '',
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (item: any) => {
    const res = await apiRequest(`/academic/guidance/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: !item.isActive }),
    });

    if (res.success) {
      setActionMsg(`Guidance article "${item.title}" updated.`);
      loadGuidance();
    } else {
      setActionError(res.error?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete guidance item "${title}"?`)) return;

    const res = await apiRequest(`/academic/guidance/${id}`, { method: 'DELETE' });
    if (res.success) {
      setActionMsg(`Guidance item "${title}" deleted.`);
      loadGuidance();
    } else {
      setActionError(res.error?.message || 'Failed to delete guidance item');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError('');

    const docsArray = formData.requiredDocs
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const stepsArray = formData.processSteps
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      targetYear: formData.targetYear ? Number(formData.targetYear) : null,
      requiredDocs: JSON.stringify(docsArray),
      processSteps: JSON.stringify(stepsArray),
    };

    const res = editingItem
      ? await apiRequest(`/academic/guidance/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      : await apiRequest('/academic/guidance', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

    if (res.success) {
      setActionMsg(
        editingItem ? 'Guidance item updated successfully!' : 'New guidance article created!'
      );
      setModalOpen(false);
      loadGuidance();
    } else {
      setActionError(res.error?.message || 'Failed to save guidance item.');
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
            Academic Guidance Content Manager
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Maintain the structured decision-tree knowledge graph powering Student Guidance Mode.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus size={14} />
            <span>+ Create Guidance Article</span>
          </button>
          <button
            onClick={loadGuidance}
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

      {/* Guidance Items List */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-3">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-[#d4af37]" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Guidance Workflows ({items.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading guidance items...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No guidance articles created yet.
          </div>
        ) : (
          <div className="divide-y divide-[#20273a]">
            {items.map((item) => {
              let docs: string[] = [];
              let steps: string[] = [];

              try {
                docs =
                  typeof item.requiredDocs === 'string' && item.requiredDocs.startsWith('[')
                    ? JSON.parse(item.requiredDocs)
                    : item.requiredDocs?.split('\n') || [];
              } catch {}

              try {
                steps =
                  typeof item.processSteps === 'string' && item.processSteps.startsWith('[')
                    ? JSON.parse(item.processSteps)
                    : item.processSteps?.split('\n') || [];
              } catch {}

              return (
                <div
                  key={item.id}
                  className="py-5 flex flex-col lg:flex-row lg:items-start justify-between gap-5 text-xs group"
                >
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm text-white group-hover:text-[#d4af37] transition">
                        {item.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1b2336] text-[#d4af37] border border-[#d4af37]/35">
                        {item.category}
                      </span>
                      {item.subcategory && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#182030] text-gray-300 border border-[#2b354d]">
                          {item.subcategory}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <p className="text-gray-300 leading-relaxed text-xs">{item.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {docs.length > 0 && (
                        <div className="bg-[#151a28] p-3 rounded-xl border border-[#232b3f] space-y-1">
                          <div className="font-mono text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1.5">
                            <FileText size={11} className="text-[#d4af37]" />
                            <span>Required Information ({docs.length})</span>
                          </div>
                          <ul className="list-disc list-inside text-[11px] text-gray-300 space-y-0.5">
                            {docs.slice(0, 3).map((d, i) => (
                              <li key={i} className="truncate">{d}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {steps.length > 0 && (
                        <div className="bg-[#151a28] p-3 rounded-xl border border-[#232b3f] space-y-1">
                          <div className="font-mono text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1.5">
                            <ListOrdered size={11} className="text-cyan-400" />
                            <span>Process Workflow ({steps.length} Steps)</span>
                          </div>
                          <div className="text-[11px] text-gray-300 line-clamp-2">
                            {steps.join(' → ')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Shield size={11} className="text-teal-400" />
                        Role: <strong className="text-gray-200">{item.responsibleRole}</strong>
                      </span>
                      <span>•</span>
                      <span>Link: <strong className="text-cyan-300">{item.actionUrl}</strong> ({item.actionLabel})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-start">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className="p-2 rounded-xl bg-[#171c2b] hover:bg-[#202738] border border-[#2b354d] text-gray-300 hover:text-white transition"
                      title={item.isActive ? 'Deactivate article' : 'Activate article'}
                    >
                      {item.isActive ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} className="text-gray-500" />}
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl bg-[#171c2b] hover:bg-[#202738] border border-[#2b354d] text-gray-300 hover:text-white transition"
                      title="Edit Guidance Article"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 transition"
                      title="Delete Guidance Article"
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

      {/* Add / Edit Guidance Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-tab-fade">
          <div className="bg-[#121624] border border-[#2a344c] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#212739] pb-3">
              <div className="flex items-center gap-2 text-[#d4af37]">
                <Compass size={18} />
                <h3 className="text-base font-bold text-white">
                  {editingItem ? 'Edit Guidance Workflow' : 'Create Guidance Workflow'}
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

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Process Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Official Bonafide Certificate"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="CERTIFICATE">Certificate</option>
                    <option value="ACADEMIC_REQUEST">Academic Request</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="SCHOLARSHIP">Scholarship</option>
                    <option value="EXAMINATION">Examination</option>
                    <option value="HOSTEL">Hostel</option>
                    <option value="ROUTINE">Academic Routine</option>
                    <option value="NOTICE">Academic Notice</option>
                    <option value="GENERAL">General Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Subcategory Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. BONAFIDE, NOC, LEAVE"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Clear purpose of this campus process..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Required Information &amp; Documents (one per line)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Student Roll Number&#10;Fee clearance confirmation&#10;Internship offer letter"
                  value={formData.requiredDocs}
                  onChange={(e) => setFormData({ ...formData, requiredDocs: e.target.value })}
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] resize-none font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Step-by-Step Process (one per line)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="1. Fill application in Documents&#10;2. Submit request to Academic Office&#10;3. Officer reviews credentials&#10;4. Download verified PDF"
                  value={formData.processSteps}
                  onChange={(e) => setFormData({ ...formData, processSteps: e.target.value })}
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] resize-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Responsible Role</label>
                  <select
                    value={formData.responsibleRole}
                    onChange={(e) => setFormData({ ...formData, responsibleRole: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="ACADEMIC_OFFICER">Academic Officer</option>
                    <option value="WARDEN">Hostel Warden</option>
                    <option value="STAFF">Maintenance Staff</option>
                    <option value="SECURITY">Gate Security</option>
                    <option value="ADMIN">Command Center Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Target Year</label>
                  <select
                    value={formData.targetYear}
                    onChange={(e) => setFormData({ ...formData, targetYear: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="">All Cohorts</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Connected Action URL</label>
                  <input
                    type="text"
                    required
                    placeholder="/student/documents"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Button Label</label>
                  <input
                    type="text"
                    required
                    placeholder="Start Bonafide Application"
                    value={formData.actionLabel}
                    onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
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
                  {submitting ? 'Saving...' : editingItem ? 'Update Workflow' : 'Create Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
