'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  User,
  Mail,
  Phone,
  Home,
  Building,
  BookOpen,
  Shield,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function StudentProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1b2234] border border-[#d4af37]/35 text-[#d4af37] text-[10px] font-mono font-bold uppercase tracking-wider mb-2 shadow-xs">
          <Shield size={12} />
          <span>Verified Student Credential</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          Student Digital Identity
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
          Official academic enrollment record, branch credentials, and residential hostel room allocation verified by Nexora Campus Registry.
        </p>
      </div>

      {/* Main Identity Card */}
      <div className="bg-[#121624] border border-[#232b3f] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/20 space-y-6">
        {/* Top Profile Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-[#212739]">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#d4af37] via-[#b89528] to-[#8a6e1a] text-black font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-[#d4af37]/20 border-2 border-[#f3d97d]/50 shrink-0">
            {user?.fullName ? user.fullName[0] : 'A'}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {user?.fullName || 'Aryan Khan'}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 font-mono">
              <span>
                Roll No: <strong className="text-[#d4af37] font-bold">{user?.rollNumber || '220101048'}</strong>
              </span>
              <span className="text-gray-600">•</span>
              <span>Role: <strong className="text-gray-300">{user?.role}</strong></span>
            </div>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 text-[10px] font-mono font-bold">
                <CheckCircle2 size={11} className="text-emerald-400" />
                <span>ACTIVE ENROLLMENT • AUTUMN 2026</span>
              </span>
            </div>
          </div>
        </div>

        {/* Credential Data Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Academic Info */}
          <div className="bg-[#161a29] p-5 rounded-2xl border border-[#232b3f] space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-[#d4af37] block">
              Academic Program &amp; Affiliation
            </span>

            <div className="flex items-start gap-3 text-gray-300">
              <div className="p-2 rounded-lg bg-[#1e2538] border border-[#2b354d] text-[#d4af37] shrink-0 mt-0.5">
                <BookOpen size={15} />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-mono">Program &amp; Branch</div>
                <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  B.Tech Computer Science &amp; Engineering
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-gray-300">
              <div className="p-2 rounded-lg bg-[#1e2538] border border-[#2b354d] text-[#d4af37] shrink-0 mt-0.5">
                <Award size={15} />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-mono">Academic Standing</div>
                <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  2nd Year (Semester 4)
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-gray-300">
              <div className="p-2 rounded-lg bg-[#1e2538] border border-[#2b354d] text-[#d4af37] shrink-0 mt-0.5">
                <Building size={15} />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-mono">University Institution</div>
                <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  BPUT Central Campus
                </div>
              </div>
            </div>
          </div>

          {/* Hostel & Contact Info */}
          <div className="bg-[#161a29] p-5 rounded-2xl border border-[#232b3f] space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-cyan-400 block">
              Hostel Allocation &amp; Contact Records
            </span>

            <div className="flex items-start gap-3 text-gray-300">
              <div className="p-2 rounded-lg bg-[#1e2538] border border-[#2b354d] text-cyan-400 shrink-0 mt-0.5">
                <Home size={15} />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-mono">Residential Allocation</div>
                <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  {user?.hostelBlock || 'Block B'} / Room {user?.roomNumber || '204'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-gray-300">
              <div className="p-2 rounded-lg bg-[#1e2538] border border-[#2b354d] text-cyan-400 shrink-0 mt-0.5">
                <Mail size={15} />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-mono">Official Campus Email</div>
                <div className="text-xs sm:text-sm font-bold text-white mt-0.5 font-mono">
                  {user?.email || 'aryan@nexora.edu'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-gray-300">
              <div className="p-2 rounded-lg bg-[#1e2538] border border-[#2b354d] text-cyan-400 shrink-0 mt-0.5">
                <Phone size={15} />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-mono">Registered Emergency Phone</div>
                <div className="text-xs sm:text-sm font-bold text-white mt-0.5 font-mono">
                  +91 9876543210
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust & Cryptographic Verification Note */}
        <div className="p-4 rounded-xl bg-[#151926] border border-[#252c40] text-[11px] text-gray-400 leading-relaxed flex items-start gap-3">
          <Shield size={16} className="text-[#d4af37] shrink-0 mt-0.5" />
          <div>
            This digital identity profile is cryptographically verified against the Nexora Campus Central Database. Academic enrollment, attendance logs, and hostel allocations are audited by the Chief Warden and Academic Office.
          </div>
        </div>
      </div>
    </div>
  );
}
