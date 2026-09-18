'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  FileCheck,
  Download,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Award,
  FileText,
  Building,
} from 'lucide-react';

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
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-emerald-500/35 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 shadow-xs">
          <Shield size={12} />
          <span>Academic Registry &amp; Certification</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          Official Documents &amp; Bonafide Certificates
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
          Request, instantly download, and cryptographically verify digitally signed Bonafide Certificates for scholarships, banking, and official university credentials.
        </p>
      </div>

      {/* Request Bonafide Card */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
        <div className="flex items-center gap-3.5 border-b border-[#21273a] pb-5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <FileCheck size={22} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Apply for Certified Bonafide Certificate
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Approved certificates are issued as tamper-evident PDFs embedded with a verifiable QR signature.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRequestBonafide} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-semibold mb-1.5 text-xs">
              Purpose of Certificate <span className="text-[#d4af37]">*</span>
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-[#161a29] border border-[#283248] rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition"
            >
              <option value="Scholarship">State / National Scholarship Verification</option>
              <option value="Bank">Bank Account Opening / Education Loan</option>
              <option value="Internship">Summer Internship Application</option>
              <option value="Education">External Academic Competition / Hackathon</option>
              <option value="Passport">Passport / Visa Application</option>
              <option value="Other">Other Official Requirement</option>
            </select>
            <p className="text-[11px] text-gray-500 mt-1.5 font-mono">
              The purpose will be stated verbatim on your official certified PDF.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md shadow-emerald-950/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Submitting Application...' : 'Request Certificate'}
            </button>
          </div>
        </form>
      </div>

      {/* Issued Certificates & Records List */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/15">
        <div className="flex items-center justify-between border-b border-[#21273a] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#182030] border border-[#28354f] text-[#d4af37] flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Certificate Records &amp; Issued Documents
              </h2>
              <p className="text-[11px] text-gray-400">
                Download PDF credentials or access instant public verification
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-[#161a28] border border-[#232a3d] animate-pulse"
              />
            ))}
          </div>
        ) : bonafideRequests.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#161a28] border border-[#262e42] flex items-center justify-center text-gray-500">
              <FileText size={22} />
            </div>
            <div>
              <div className="font-semibold text-gray-300">No certificate requests found</div>
              <div className="text-gray-500 mt-0.5">Apply above to generate your certified document.</div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#202638]">
            {bonafideRequests.map((b) => {
              const isIssued = !!b.certificateId && !!b.documentUrl;

              return (
                <div
                  key={b.id}
                  className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-gray-100">
                        {b.certificateId || b.request?.requestNumber}
                      </span>
                      {isIssued ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> ISSUED • VALID
                        </span>
                      ) : b.request?.status === 'REJECTED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-700/80 inline-flex items-center gap-1">
                          <AlertCircle size={11} /> REJECTED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80 inline-flex items-center gap-1">
                          <Clock size={11} /> PENDING APPROVAL
                        </span>
                      )}
                    </div>

                    <div className="font-semibold text-sm text-gray-200">{b.purpose}</div>

                    <div className="text-[11px] text-gray-400 font-mono">
                      Requested: {new Date(b.createdAt).toLocaleDateString()}
                      {b.generatedAt && ` • Issued: ${new Date(b.generatedAt).toLocaleDateString()}`}
                    </div>
                  </div>

                  {/* Actions */}
                  {isIssued ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/api/bonafide/${b.id}/download`}
                        download
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171d2b] hover:bg-[#20283b] text-[#d4af37] border border-[#d4af37]/30 transition-all font-semibold active:scale-95 shadow-xs"
                      >
                        <Download size={14} />
                        <span>Download PDF</span>
                      </a>
                      <Link
                        href={`/verify/${b.certificateId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 transition-all font-semibold active:scale-95 shadow-xs"
                      >
                        <ExternalLink size={13} />
                        <span>Verify Online</span>
                      </Link>
                    </div>
                  ) : b.request?.status === 'REJECTED' ? (
                    <div className="text-rose-300 font-mono text-[11px] bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-800/40 max-w-sm">
                      Declined: {b.request?.rejectionReason || 'Application rejected by Academic Officer'}
                    </div>
                  ) : (
                    <div className="text-amber-400/90 font-mono text-[11px] bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-800/40 w-fit">
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
