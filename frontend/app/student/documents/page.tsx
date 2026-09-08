'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { FileCheck, Download, ExternalLink, Plus, Clock, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export default function StudentDocumentsPage() {
  const [bonafideRequests, setBonafideRequests] = useState<any[]>([]);
  const [purpose, setPurpose] = useState('Scholarship');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBonafides = async () => {
    setLoading(true);
    const res = await apiRequest('/bonafide/my');
    if (res.success && res.data) {
      setBonafideRequests(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBonafides();
  }, []);

  const handleRequestBonafide = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const res = await apiRequest('/bonafide', {
      method: 'POST',
      body: JSON.stringify({ purpose }),
    });

    if (res.success) {
      setSuccess('Bonafide certificate request submitted successfully to the Academic Office.');
      fetchBonafides();
    } else {
      setError(res.error?.message || 'Failed to submit bonafide request');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Official Campus Documents &amp; Certificates</h1>
        <p className="text-xs text-gray-400">
          Request, download, and verify digitally signed Bonafide Certificates and academic records.
        </p>
      </div>

      {/* Request Bonafide Card */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-[#282f42] pb-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <FileCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Apply for Bonafide Certificate</h2>
            <p className="text-xs text-gray-400">
              Upon approval, the system dynamically generates a certified PDF with a cryptographic verification QR code.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} /> <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRequestBonafide} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-medium mb-1">Purpose of Certificate</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-gold"
            >
              <option value="Scholarship">State / National Scholarship Verification</option>
              <option value="Bank">Bank Account Opening / Education Loan</option>
              <option value="Internship">Summer Internship Application</option>
              <option value="Education">External Academic Competition / Hackathon</option>
              <option value="Passport">Passport / Visa Application</option>
              <option value="Other">Other Official Requirement</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow transition disabled:opacity-50"
            >
              {submitting ? 'Submitting Application...' : 'Request Certificate'}
            </button>
          </div>
        </form>
      </div>

      {/* Issued Certificates & Requests Table */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-gray-100 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-gold" /> Certificate Records &amp; Issued Documents
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500">Loading documents...</div>
        ) : bonafideRequests.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No certificate requests found. Apply above to obtain your official certificate.
          </div>
        ) : (
          <div className="divide-y divide-[#282f42]">
            {bonafideRequests.map((b) => {
              const isIssued = !!b.certificateId && !!b.documentUrl;

              return (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-gray-200">
                        {b.certificateId || b.request?.requestNumber}
                      </span>
                      {isIssued ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          ISSUED • VALID
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          PENDING APPROVAL
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-gray-200">{b.purpose}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Requested on: {new Date(b.createdAt).toLocaleDateString()}
                      {b.generatedAt && ` • Issued on: ${new Date(b.generatedAt).toLocaleDateString()}`}
                    </div>
                  </div>

                  {/* Actions: Download PDF and Public Verify link */}
                  {isIssued ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/bonafide/${b.id}/download`}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f2638] hover:bg-[#28324a] text-gold border border-[#3d4661] transition font-medium"
                      >
                        <Download size={13} />
                        <span>Download PDF</span>
                      </a>
                      <Link
                        href={`/verify/${b.certificateId}`}
                        target="_blank"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition font-medium"
                      >
                        <ExternalLink size={13} />
                        <span>Verify Online</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-amber-400/80 italic text-[11px]">
                      Awaiting Academic Office signature
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
