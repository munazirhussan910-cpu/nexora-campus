'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Sparkles,
  UserPlus,
  Eye,
  EyeOff,
  ShieldCheck,
  Wrench,
  Key,
  Layers,
  GraduationCap,
} from 'lucide-react';

export default function LoginPage() {
  const { loginWithFeedback, switchPersona, loading } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await loginWithFeedback(usernameOrEmail, password);
    if (!result.success) {
      setError(
        result.error ||
          'Invalid username/email or password. For demonstration, you may also use the 1-click demo accounts below.'
      );
    }
    setSubmitting(false);
  };

  const demoAccounts = [
    {
      key: 'aryan',
      label: 'Aryan Khan',
      role: 'STUDENT',
      desc: 'B.Tech CSE • Room B-204',
      email: 'aryan@nexora.edu',
      icon: User,
      color: 'text-blue-400 border-blue-500/30 hover:border-blue-400',
    },
    {
      key: 'ramesh',
      label: 'Ramesh Kumar',
      role: 'STAFF',
      desc: 'Senior Maintenance Plumber',
      email: 'ramesh@nexora.edu',
      icon: Wrench,
      color: 'text-amber-400 border-amber-500/30 hover:border-amber-400',
    },
    {
      key: 'suresh',
      label: 'Suresh Verma',
      role: 'STAFF',
      desc: 'Senior Electrician',
      email: 'suresh@nexora.edu',
      icon: Wrench,
      color: 'text-amber-400 border-amber-500/30 hover:border-amber-400',
    },
    {
      key: 'warden',
      label: 'Dr. S. K. Mohapatra',
      role: 'WARDEN',
      desc: 'Chief Warden (Block B)',
      email: 'warden.b@nexora.edu',
      icon: ShieldCheck,
      color: 'text-emerald-400 border-emerald-500/30 hover:border-emerald-400',
    },
    {
      key: 'security',
      label: 'Vikram Singh',
      role: 'SECURITY',
      desc: 'Gate Operations Officer (Main Gate)',
      email: 'security.gate1@nexora.edu',
      icon: Key,
      color: 'text-cyan-400 border-cyan-500/30 hover:border-cyan-400',
    },
    {
      key: 'academic',
      label: 'Prof. Sanjeev Mohanty',
      role: 'ACADEMIC_OFFICER',
      desc: 'Academic Affairs & Certificates',
      email: 'academic@nexora.edu',
      icon: GraduationCap,
      color: 'text-teal-400 border-teal-500/30 hover:border-teal-400',
    },
    {
      key: 'admin',
      label: 'Dr. Ananya Ray',
      role: 'ADMIN',
      desc: 'Campus Operations Director',
      email: 'admin@nexora.edu',
      icon: Layers,
      color: 'text-purple-400 border-purple-500/30 hover:border-purple-400',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f1118] text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-[#d4af37]/40 bg-[#141722] shrink-0 p-0.5">
            <Image
              src="/Logo.png"
              alt="Nexora Logo"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="text-left">
            <div className="font-extrabold text-xl tracking-wider text-white">NEXORA CAMPUS</div>
            <div className="text-[10px] text-gray-400 font-mono tracking-widest">ONE PLATFORM. EVERY REQUEST.</div>
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Sign in to your Campus Account
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          Role is securely resolved from your authenticated campus database record.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#141722] border border-[#282f42] py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: NORMAL CAMPUS LOGIN */}
          <div className="mb-2">
            <div className="text-[11px] font-mono uppercase font-bold text-gray-400 tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d4af37]" />
              <span>Normal Campus Login</span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Username, Campus Email, or Student ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <User size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="e.g. aryan, aryan@nexora.edu, or 220101048"
                    className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock size={14} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg pl-9 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-black bg-[#d4af37] hover:bg-[#e4c257] focus:outline-none transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>

          {/* SECTION 2: NEW STUDENT REGISTRATION LINK */}
          <div className="mt-6 pt-5 border-t border-[#282f42] text-center">
            <div className="bg-[#181d2a] border border-[#2e364a] rounded-xl p-3.5">
              <div className="text-xs font-semibold text-gray-200">
                Don&apos;t have a campus account?
              </div>
              <p className="text-[11px] text-gray-400 mt-1 mb-2.5">
                New students can self-register with their roll number and campus department.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-[#202738] hover:bg-[#283248] border border-[#d4af37]/40 hover:border-[#d4af37] text-xs font-semibold text-[#d4af37] transition shadow-xs"
              >
                <UserPlus size={14} />
                <span>Create Student Account</span>
              </Link>
            </div>
          </div>

          {/* SECTION 3: DEMO & JUDGING ACCOUNTS */}
          <div className="mt-6 pt-5 border-t border-[#282f42]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#d4af37]">
                <Sparkles size={14} />
                <span>Demo / Judging Accounts</span>
              </div>
              <span className="text-[10px] font-mono bg-[#1c2233] text-gray-300 px-2 py-0.5 rounded border border-[#2c354d]">
                1-Click Access
              </span>
            </div>

            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              Instant authentication for judges &amp; reviewers (shared password: <code className="text-gray-200 bg-[#22283a] px-1.5 py-0.5 rounded font-mono text-[10px]">Password123!</code>):
            </p>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {demoAccounts.map((d) => {
                const IconComponent = d.icon;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => switchPersona(d.key)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#181d2a] border border-[#283042] hover:border-[#d4af37]/70 text-left transition group text-xs active:scale-[0.99] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#202738] border border-[#2e374f] flex items-center justify-center shrink-0">
                        <IconComponent size={14} className="text-[#d4af37]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-200 group-hover:text-[#d4af37] transition truncate">
                            {d.label}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#131722] text-gray-400 border border-[#252c3d]">
                            {d.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">{d.desc}</div>
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-gray-500 group-hover:text-[#d4af37] group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
