'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { StatusBadge } from '@/components/status/StatusBadge';
import { FileCheck, Key, Calendar, Check, X, ExternalLink, Download, Clock } from 'lucide-react';

export default function AdminApprovalsPage() {
  const [bonafides, setBonafides] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [bonRes, gpRes, leaveRes] = await Promise.all([
      apiRequest('/bonafide/pending'),
      apiRequest('/gate-passes/pending'),
      apiRequest('/leaves/pending'),
    ]);

    if (bonRes.success && bonRes.data) setBonafides(bonRes.data);
    if (gpRes.success && gpRes.data) setGatePasses(gpRes.data);
    if (leaveRes.success && leaveRes.data) setLeaves(leaveRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveBonafide = async (id: string) => {
    const res = await apiRequest(`/bonafide/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setActionMsg(`Bonafide Certificate (${res.data.certificateId}) officially generated & certified!`);
      loadData();
    }
  };

  const handleApproveGatePass = async (id: string) => {
    const res = await apiRequest(`/gate-passes/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setActionMsg('Gate pass approved! QR token and PIN dispatched to student.');
      loadData();
    }
  };

  const handleApproveLeave = async (id: string) => {
    const res = await apiRequest(`/leaves/${id}/approve`, { method: 'POST' });
    if (res.success) {
      setActionMsg('Hostel leave approved.');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Central Campus Approvals Hub</h1>
        <p className="text-xs text-gray-400">
          Authorize student Bonafide certificates, review gate passes, and approve hostel leaves.
        </p>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
          {actionMsg}
        </div>
      )}

      {/* Flagship: Bonafide Certificate Approvals */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
          <div className="flex items-center gap-2">
            <FileCheck size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Pending Bonafide Certificate Requests</h2>
          </div>
          <span className="text-xs font-mono text-gold bg-[#1e2538] px-2 py-0.5 rounded border border-[#323d57]">
            {bonafides.length} pending
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500">Loading certificate requests...</div>
        ) : bonafides.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">No pending certificate requests to review.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {bonafides.map((b) => (
              <div
                key={b.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-gold">{b.request?.requestNumber}</span>
                    <span className="font-bold text-gray-100">{b.request?.requester?.student?.fullName}</span>
                    <span className="font-mono text-gray-400">({b.request?.requester?.student?.rollNumber})</span>
                  </div>
                  <div className="text-gray-200">
                    Purpose: <strong>{b.purpose}</strong> • Course: B.Tech {b.request?.requester?.student?.branch?.name}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Requested on: {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveBonafide(b.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow transition"
                  >
                    <Check size={14} /> Approve &amp; Generate PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gate Passes Queue */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Pending Gate Pass Applications</h2>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
            {gatePasses.length} pending
          </span>
        </div>

        {gatePasses.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">No pending gate passes.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {gatePasses.map((gp) => (
              <div key={gp.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300">{gp.request?.requestNumber}</span>
                    <span className="font-bold text-gray-100">{gp.request?.requester?.student?.fullName}</span>
                  </div>
                  <div className="text-gray-300 mt-0.5">Destination: {gp.destination} • {gp.reason}</div>
                </div>
                <button
                  onClick={() => handleApproveGatePass(gp.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs shadow transition"
                >
                  Approve Pass
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaves Queue */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282f42] pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-purple-400" />
            <h2 className="text-sm font-bold text-white">Pending Leave Requests</h2>
          </div>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
            {leaves.length} pending
          </span>
        </div>

        {leaves.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">No pending leave applications.</div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {leaves.map((l) => (
              <div key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-300">{l.request?.requestNumber}</span>
                    <span className="font-bold text-gray-100">{l.request?.requester?.student?.fullName}</span>
                  </div>
                  <div className="text-gray-300 mt-0.5">
                    {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} • {l.reason}
                  </div>
                </div>
                <button
                  onClick={() => handleApproveLeave(l.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition"
                >
                  Approve Leave
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
