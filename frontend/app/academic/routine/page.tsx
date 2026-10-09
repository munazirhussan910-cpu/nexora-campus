'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  Filter,
} from 'lucide-react';

export default function AcademicRoutinePage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [branches, setBranchesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Filters
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterDay, setFilterDay] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [formData, setFormData] = useState({
    subjectId: '',
    branchId: '',
    year: 2,
    semester: 3,
    section: 'A',
    day: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00',
    room: 'CSE-204',
    faculty: 'Prof. Sanjeev Mohanty',
    type: 'LECTURE' as 'LECTURE' | 'LAB' | 'TUTORIAL',
    date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setActionError('');
    const [routRes, subRes, brRes] = await Promise.all([
      apiRequest('/academic/routine'),
      apiRequest('/academic/subjects'),
      apiRequest('/academic/branches'),
    ]);

    if (routRes.success && routRes.data) setEntries(routRes.data);
    else setActionError(routRes.error?.message || 'Failed to load routine');

    if (subRes.success && subRes.data) setSubjects(subRes.data);
    if (brRes.success && brRes.data) setBranchesList(brRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingEntry(null);
    setFormData({
      subjectId: subjects.length > 0 ? subjects[0].id : '',
      branchId: branches.length > 0 ? branches[0].id : '',
      year: 2,
      semester: 3,
      section: 'A',
      day: 'MONDAY',
      startTime: '09:00',
      endTime: '10:00',
      room: 'CSE-204',
      faculty: 'Prof. Sanjeev Mohanty',
      type: 'LECTURE',
      date: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      subjectId: entry.subjectId || entry.subject?.id || '',
      branchId: entry.branchId || entry.branch?.id || '',
      year: entry.year || 2,
      semester: entry.semester || 3,
      section: entry.section || 'A',
      day: entry.day || 'MONDAY',
      startTime: entry.startTime || '09:00',
      endTime: entry.endTime || '10:00',
      room: entry.room || 'CSE-204',
      faculty: entry.faculty || '',
      type: entry.type || 'LECTURE',
      date: entry.date || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove routine session for ${name}?`)) return;

    const res = await apiRequest(`/academic/routine/${id}`, { method: 'DELETE' });
    if (res.success) {
      setActionMsg(`Routine session for ${name} removed.`);
      loadData();
    } else {
      setActionError(res.error?.message || 'Failed to delete routine entry');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError('');

    const payload = {
      ...formData,
      year: Number(formData.year),
      semester: formData.semester ? Number(formData.semester) : null,
      date: formData.date ? formData.date : null,
    };

    const res = editingEntry
      ? await apiRequest(`/academic/routine/${editingEntry.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      : await apiRequest('/academic/routine', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

    if (res.success) {
      setActionMsg(
        editingEntry
          ? 'Routine entry updated successfully!'
          : 'New routine entry scheduled successfully!'
      );
      setModalOpen(false);
      loadData();
    } else {
      setActionError(res.error?.message || 'Operation failed. Please verify fields.');
    }
    setSubmitting(false);
  };

  const filteredEntries = entries.filter((e) => {
    if (filterBranch !== 'ALL' && e.branch?.code !== filterBranch) return false;
    if (filterYear !== 'ALL' && String(e.year) !== filterYear) return false;
    if (filterDay !== 'ALL' && e.day !== filterDay) return false;
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
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
            Daily Academic Routine &amp; Timetable Manager
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Configure lecture hours, laboratory sessions, room allocations, and faculty duties for all academic cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e4c257] text-black font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus size={14} />
            <span>+ Add Routine Session</span>
          </button>
          <button
            onClick={loadData}
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

      {/* Filter Toolbar */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
          <Filter size={14} className="text-[#d4af37]" />
          <span>Filter Routine:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="bg-[#181e2e] border border-[#28354c] rounded-xl px-3 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.code}>
                {b.code} ({b.name})
              </option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="bg-[#181e2e] border border-[#28354c] rounded-xl px-3 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>

          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="bg-[#181e2e] border border-[#28354c] rounded-xl px-3 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Days</option>
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
            <option value="SATURDAY">Saturday</option>
          </select>

          {(filterBranch !== 'ALL' || filterYear !== 'ALL' || filterDay !== 'ALL') && (
            <button
              onClick={() => {
                setFilterBranch('ALL');
                setFilterYear('ALL');
                setFilterDay('ALL');
              }}
              className="text-xs text-[#d4af37] hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Routine Entries Table / Cards */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#d4af37]" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Scheduled Sessions ({filteredEntries.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading academic routine...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No routine sessions match the current filter selection.
          </div>
        ) : (
          <div className="divide-y divide-[#20273a]">
            {filteredEntries.map((e) => (
              <div
                key={e.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs group"
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Time Badge */}
                  <div className="px-3 py-2 rounded-xl bg-[#1b2234] border border-[#2b374f] font-mono text-xs font-bold text-[#d4af37] shrink-0 text-center min-w-[110px]">
                    <div className="flex items-center justify-center gap-1">
                      <Clock size={12} className="text-[#d4af37]" />
                      <span>{e.startTime} – {e.endTime}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{e.day}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white group-hover:text-[#d4af37] transition">
                        {e.subject?.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e2538] text-gray-300 border border-[#2e374f]">
                        {e.subject?.code}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          e.type === 'LAB'
                            ? 'bg-purple-950 text-purple-300 border border-purple-700/60'
                            : e.type === 'TUTORIAL'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                            : 'bg-blue-950 text-blue-300 border border-blue-700/60'
                        }`}
                      >
                        {e.type || 'LECTURE'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 font-mono">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <MapPin size={11} className="text-cyan-400" />
                        {e.room}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-gray-300">
                        <User size={11} className="text-gray-500" />
                        {e.faculty || e.subject?.faculty || 'Department Faculty'}
                      </span>
                      <span>•</span>
                      <span className="text-gray-400">
                        {e.branch?.code || 'CSE'} Year {e.year} (Sec {e.section || 'A'})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    onClick={() => openEditModal(e)}
                    className="p-2 rounded-xl bg-[#171c2b] hover:bg-[#202738] border border-[#2b354d] text-gray-300 hover:text-white transition"
                    title="Edit Routine Session"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(e.id, e.subject?.name)}
                    className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 transition"
                    title="Delete Routine Session"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routine Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-tab-fade">
          <div className="bg-[#121624] border border-[#2a344c] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#212739] pb-3">
              <div className="flex items-center gap-2 text-[#d4af37]">
                <Calendar size={18} />
                <h3 className="text-base font-bold text-white">
                  {editingEntry ? 'Edit Routine Session' : 'Schedule New Routine Session'}
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
                <label className="block text-gray-300 font-semibold mb-1">Subject</label>
                <select
                  required
                  value={formData.subjectId}
                  onChange={(e) => {
                    const sel = subjects.find((s) => s.id === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      subjectId: e.target.value,
                      branchId: sel ? sel.branchId : prev.branchId,
                      faculty: sel?.faculty || prev.faculty,
                    }));
                  }}
                  className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name} ({s.branch?.code || 'CSE'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Branch</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} ({b.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Academic Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Session Type</label>
                  <select
                    value={formData.type}
                    onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="LECTURE">Lecture</option>
                    <option value="LAB">Lab Session</option>
                    <option value="TUTORIAL">Tutorial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Day of Week</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                    <option value="SATURDAY">Saturday</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Start Time (HH:MM)</label>
                  <input
                    type="text"
                    required
                    pattern="^([01]\d|2[0-3]):[0-5]\d$"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">End Time (HH:MM)</label>
                  <input
                    type="text"
                    required
                    pattern="^([01]\d|2[0-3]):[0-5]\d$"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Room / Lab Hall</label>
                  <input
                    type="text"
                    required
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Faculty Name</label>
                  <input
                    type="text"
                    required
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Specific Date (Optional — leaves blank for recurring weekly routine)
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                  {submitting ? 'Saving...' : editingEntry ? 'Update Routine' : 'Create Routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
