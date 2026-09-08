'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Lock, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, switchPersona, loading } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const success = await login(usernameOrEmail, password);
    if (!success) {
      setError('Invalid username or password. You can also use the 1-click persona buttons below.');
    }
    setSubmitting(false);
  };

  const demoAccounts = [
    { key: 'aryan', label: 'Aryan Khan', role: 'STUDENT', email: 'aryan@nexora.edu' },
    { key: 'ramesh', label: 'Ramesh Kumar', role: 'STAFF (Plumber)', email: 'ramesh@nexora.edu' },
    { key: 'warden', label: 'Dr. S. K. Mohapatra', role: 'WARDEN (Block B)', email: 'warden.b@nexora.edu' },
    { key: 'security', label: 'Vikram Singh', role: 'SECURITY (Main Gate)', email: 'security.gate1@nexora.edu' },
    { key: 'admin', label: 'Dr. Ananya Ray', role: 'CHIEF ADMIN', email: 'admin@nexora.edu' },
  ];

  return (
    <div className="min-h-screen bg-[#0f1118] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8c7322] flex items-center justify-center font-bold text-black text-lg shadow-lg group-hover:scale-105 transition-transform">
            NX
          </div>
          <div className="text-left">
            <div className="font-extrabold text-xl tracking-wider text-white">NEXORA CAMPUS</div>
            <div className="text-[10px] text-gray-400 font-mono tracking-widest">ONE PLATFORM. EVERY REQUEST.</div>
          </div>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-gray-200">
          Sign in to your Campus Account
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          Role is determined securely from authenticated backend profile.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#141722] border border-[#282f42] py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Username or Campus Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. aryan or aryan@nexora.edu"
                  className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Default password: Password123!"
                className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full mt-2 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-black bg-gold hover:bg-[#c49f2e] focus:outline-none transition disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-[#282f42]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gold mb-3">
              <Sparkles size={13} />
              <span>1-Click Judging & Demo Login</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              Instant login using pre-seeded accounts (password for all is <code className="text-gray-200 bg-[#22283a] px-1 py-0.5 rounded">Password123!</code>):
            </p>

            <div className="space-y-1.5">
              {demoAccounts.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => switchPersona(d.key)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-[#1a1e2b] border border-[#2a3144] hover:border-gold/60 text-left transition group text-xs"
                >
                  <div>
                    <span className="font-semibold text-gray-200 group-hover:text-gold transition">
                      {d.label}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-2">({d.role})</span>
                  </div>
                  <ArrowRight size={12} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
