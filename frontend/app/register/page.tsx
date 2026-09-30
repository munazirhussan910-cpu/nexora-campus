'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import {
  User,
  Mail,
  Hash,
  Building2,
  Calendar,
  Home,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

interface HostelOption {
  id: string;
  name: string;
  gender: string;
}

export default function RegisterPage() {
  const { register, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    rollNumber: '',
    department: 'CSE',
    year: '1',
    hostel: 'Block B',
    roomNumber: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [departments, setDepartments] = useState<DepartmentOption[]>([
    { id: '1', code: 'CSE', name: 'Computer Science & Engineering' },
    { id: '2', code: 'ECE', name: 'Electronics & Communication Engineering' },
    { id: '3', code: 'MECH', name: 'Mechanical Engineering' },
    { id: '4', code: 'CIVIL', name: 'Civil Engineering' },
    { id: '5', code: 'EE', name: 'Electrical Engineering' },
  ]);

  const [hostels, setHostels] = useState<HostelOption[]>([
    { id: '1', name: 'Block A (Boys)', gender: 'MALE' },
    { id: '2', name: 'Block B (Boys)', gender: 'MALE' },
    { id: '3', name: 'Block C (Girls)', gender: 'FEMALE' },
    { id: '4', name: 'Block D (Girls)', gender: 'FEMALE' },
    { id: 'day-scholar', name: 'Day Scholar (Non-Resident)', gender: 'COED' },
  ]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await apiRequest<{
          departments: DepartmentOption[];
          hostels: HostelOption[];
        }>('/auth/register-options');

        if (res.success && res.data) {
          if (res.data.departments?.length) setDepartments(res.data.departments);
          if (res.data.hostels?.length) setHostels(res.data.hostels);
        }
      } catch {
        // Fallbacks already in state
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.rollNumber.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);

    const result = await register({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      rollNumber: formData.rollNumber.trim(),
      department: formData.department,
      year: parseInt(formData.year, 10) || 1,
      hostel: formData.hostel,
      roomNumber: formData.roomNumber.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    if (!result.success) {
      setError(result.error || 'Registration failed. Please check your information.');
      setSubmitting(false);
    } else {
      setSuccessMsg('Account created successfully! Redirecting to student dashboard...');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1118] text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
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
          Create Student Account
        </h2>
        <p className="mt-1.5 text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
          Official registration for resident and day scholar students. Account role is locked strictly to <strong className="text-gray-200">STUDENT</strong>.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-[#141722] border border-[#282f42] py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {/* Security Banner */}
          <div className="mb-6 p-3 rounded-xl bg-[#1a2133] border border-[#d4af37]/30 flex items-center gap-3 text-xs">
            <ShieldCheck size={18} className="text-[#d4af37] shrink-0" />
            <div className="text-gray-300 text-[11px] leading-tight">
              <span className="font-semibold text-white">Campus Verified Enrollment:</span> Privileged staff, warden, and security credentials are administrative and cannot be self-registered.
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name & Student ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Full Name <span className="text-[#d4af37]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <User size={14} />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Aryan Khan"
                    className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Student ID / Roll Number <span className="text-[#d4af37]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Hash size={14} />
                  </div>
                  <input
                    type="text"
                    name="rollNumber"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    placeholder="e.g. 220101048"
                    className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Campus Email */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Campus Email Address <span className="text-[#d4af37]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail size={14} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. aryan@nexora.edu"
                  className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
                />
              </div>
            </div>

            {/* Department & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Department / Branch <span className="text-[#d4af37]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Building2 size={14} />
                  </div>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] transition cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.code} value={d.code} className="bg-[#141722] text-white">
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Year / Semester <span className="text-[#d4af37]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Calendar size={14} />
                  </div>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] transition cursor-pointer"
                  >
                    <option value="1" className="bg-[#141722] text-white">1st Year (Semester 1 & 2)</option>
                    <option value="2" className="bg-[#141722] text-white">2nd Year (Semester 3 & 4)</option>
                    <option value="3" className="bg-[#141722] text-white">3rd Year (Semester 5 & 6)</option>
                    <option value="4" className="bg-[#141722] text-white">4th Year (Semester 7 & 8)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hostel Residence & Room */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Hostel Residence
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Home size={14} />
                  </div>
                  <select
                    name="hostel"
                    value={formData.hostel}
                    onChange={handleChange}
                    className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] transition cursor-pointer"
                  >
                    {hostels.map((h) => (
                      <option key={h.id} value={h.name} className="bg-[#141722] text-white">
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Room Number <span className="text-[10px] text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g. 204"
                  className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition font-mono"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Password <span className="text-[#d4af37]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock size={14} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
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

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Confirm Password <span className="text-[#d4af37]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock size={14} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="w-full bg-[#1c2130] border border-[#2e3447] rounded-lg pl-9 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition"
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || authLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-black bg-[#d4af37] hover:bg-[#e4c257] active:scale-[0.99] focus:outline-none transition disabled:opacity-50 cursor-pointer"
            >
              <span>{submitting ? 'Creating Student Account...' : 'Complete Student Registration'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Return to Login */}
          <div className="mt-6 pt-5 border-t border-[#282f42] text-center">
            <p className="text-xs text-gray-400">
              Already have a campus account?{' '}
              <Link
                href="/login"
                className="font-semibold text-[#d4af37] hover:underline transition"
              >
                Sign In to Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
