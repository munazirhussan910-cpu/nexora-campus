'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { CheckCircle2, XCircle, ShieldCheck, Download, ArrowLeft, Building2 } from 'lucide-react';

export default function VerifyDocumentPage({ params }: { params: { certificateId: string } }) {
  const { certificateId } = params;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      const res = await apiRequest(`/verify/document/${certificateId}`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Certificate record could not be verified on the campus registry.');
      }
      setLoading(false);
    };

    fetchDoc();
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-[#0f1118] text-white flex flex-col justify-between py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gold text-black font-bold flex items-center justify-center text-sm shadow">
              NX
            </div>
            <span className="font-extrabold text-base tracking-wider text-gray-100">
              NEXORA CAMPUS REGISTRY
            </span>
          </Link>
          <div className="text-xs text-gray-400">
            Public Cryptographic Document Verification Service
          </div>
        </div>

        {/* Verification Card */}
        <div className="bg-[#141722] border border-[#282f42] rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          {/* Decorative Gold Header Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#d4af37] via-[#f5e5a3] to-[#d4af37]" />

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
              <span>Querying official BPUT campus blockchain registry...</span>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} />
              </div>
              <h2 className="text-lg font-bold text-rose-300 mb-2">VERIFICATION FAILED</h2>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed max-w-sm mx-auto">
                {error}
              </p>
              <div className="text-[11px] font-mono text-gray-500 bg-[#1c2130] p-2.5 rounded-lg border border-[#2a3144] mb-6">
                Queried ID: {certificateId}
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-gold hover:underline"
              >
                <ArrowLeft size={14} /> Back to Nexora Portal
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[#282f42]">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> DOCUMENT VERIFIED
                  </div>
                  <h1 className="text-base font-bold text-gray-100">
                    Official Bonafide Certificate
                  </h1>
                  <div className="text-[11px] text-gray-400 font-mono">
                    ID: {data.certificateId}
                  </div>
                </div>
              </div>

              {/* Verified Metadata Fields */}
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between py-2 border-b border-[#22283a]">
                  <span className="text-gray-400 font-medium">Student Name:</span>
                  <span className="font-bold text-gray-100">{data.studentName}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-[#22283a]">
                  <span className="text-gray-400 font-medium">Roll / Registration Number:</span>
                  <span className="font-mono font-bold text-gray-100">{data.rollNumber}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-[#22283a]">
                  <span className="text-gray-400 font-medium">Course & Branch:</span>
                  <span className="font-semibold text-gray-200">{data.course}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-[#22283a]">
                  <span className="text-gray-400 font-medium">Academic Year:</span>
                  <span className="text-gray-200">Year {data.year}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-[#22283a]">
                  <span className="text-gray-400 font-medium">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {data.status}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-[#22283a]">
                  <span className="text-gray-400 font-medium">Issued Date:</span>
                  <span className="text-gray-300">
                    {new Date(data.issuedAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-[#22283a]">
                  <span className="text-gray-400 font-medium">Issued By:</span>
                  <span className="text-gray-300 font-semibold">{data.issuedBy}</span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-400 font-medium">Institution:</span>
                  <span className="text-gray-400 text-right">{data.institution}</span>
                </div>
              </div>

              {/* Digital Seal Footer */}
              <div className="mt-8 pt-5 border-t border-[#282f42] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
                  <Building2 size={14} className="text-gold" />
                  <span>Central Registry Authenticated</span>
                </div>
                <Link
                  href="/"
                  className="text-xs text-gold hover:underline font-medium flex items-center gap-1"
                >
                  <ArrowLeft size={12} /> Campus Portal
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center text-[11px] text-gray-500 py-4">
        Nexora Campus Document Registry • BPUT 2026
      </footer>
    </div>
  );
}
