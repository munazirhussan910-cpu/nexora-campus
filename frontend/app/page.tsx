'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import HeroCampusBackground from '@/components/layout/HeroCampusBackground';
import {
  ShieldCheck,
  FileCheck,
  QrCode,
  Wrench,
  Key,
  Layers,
  ArrowRight,
  Sparkles,
  Smartphone,
  Monitor,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Users,
  Zap,
  Check,
  Lock,
  ChevronRight,
  Terminal,
  Menu,
  X,
  Radio,
  MapPin,
  RefreshCw,
  Bell,
  Cpu,
  Workflow,
  Compass,
} from 'lucide-react';

export default function HomePage() {
  const { user, switchPersona, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'gatepass' | 'section44'>('lifecycle');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live countdown timer for SLA simulation
  const [slaTime, setSlaTime] = useState({ hours: 1, minutes: 42, seconds: 18 });

  // Live simulated active workflow step (cycles every 3 seconds)
  const [activeStepIndex, setActiveStepIndex] = useState(3); // 0=Submitted, 1=Routed, 2=Assigned, 3=In Repair, 4=Resolved

  // Selected campus map node for the interactive digital campus topology
  const [selectedCampusNode, setSelectedCampusNode] = useState<'hostel_b' | 'main_gate' | 'academic' | 'hostel_a' | 'mess'>('hostel_b');

  // FSM Active state for Section 6
  const [activeFsmIndex, setActiveFsmIndex] = useState(4); // 0: CREATE, 1: ROUTE, 2: ASSIGN, 3: ACCEPT, 4: IN_PROGRESS, 5: RESOLVE, 6: CLOSE

  // Live audit log stream simulation
  const [auditIndex, setAuditIndex] = useState(0);

  // SLA countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSlaTime((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 1, minutes: 42, seconds: 18 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Workflow auto-advance cycle
  useEffect(() => {
    const cycle = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % 5);
      setActiveFsmIndex((prev) => (prev + 1) % 7);
      setAuditIndex((prev) => (prev + 1) % 5);
    }, 3200);
    return () => clearInterval(cycle);
  }, []);

  const [activeSection, setActiveSection] = useState<string>('problem');

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // IntersectionObserver for Reveal-on-Scroll and Active Section Spy
  useEffect(() => {
    // 1. Reveal-on-scroll observer
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    // 2. Active section spy observer for navigation
    const sectionIds = ['problem', 'cockpit', 'personas', 'features', 'public-modes'];
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '-70px 0px -40% 0px',
      }
    );

    sectionElements.forEach((el) => spyObserver.observe(el));

    return () => {
      revealObserver.disconnect();
      spyObserver.disconnect();
    };
  }, []);

  const personas = [
    {
      key: 'aryan',
      name: 'Aryan Khan',
      role: 'STUDENT',
      roleTitle: 'Resident Student',
      badge: 'B.Tech CSE • Room B-204',
      desc: 'Submit maintenance requests, monitor live ticket SLAs, generate cryptographic gate passes, and request verified Bonafide certificates.',
      href: '/student/dashboard',
      borderClass: 'border-blue-500/30 hover:border-blue-400 bg-gradient-to-b from-blue-950/20 via-[#141722] to-transparent hover:shadow-blue-950/30',
      tagClass: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
      icon: Users,
    },
    {
      key: 'ramesh',
      name: 'Ramesh Kumar',
      role: 'STAFF',
      roleTitle: 'Senior Maintenance Plumber',
      badge: 'Facilities • Work Order Desk',
      desc: 'Receive auto-routed work orders based on keyword detection, accept jobs, update live repair logs, and submit auditable resolution proof.',
      href: '/staff/dashboard',
      borderClass: 'border-amber-500/30 hover:border-amber-400 bg-gradient-to-b from-amber-950/20 via-[#141722] to-transparent hover:shadow-amber-950/30',
      tagClass: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
      icon: Wrench,
    },
    {
      key: 'warden',
      name: 'Dr. S. K. Mohapatra',
      role: 'WARDEN',
      roleTitle: 'Chief Warden (Block B)',
      badge: 'Hostel Administration',
      desc: 'Manage hostel curfew permissions, review leaves with parental consent affirmations, approve gate passes, and audit block facility complaints.',
      href: '/warden/dashboard',
      borderClass: 'border-emerald-500/30 hover:border-emerald-400 bg-gradient-to-b from-emerald-950/20 via-[#141722] to-transparent hover:shadow-emerald-950/30',
      tagClass: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
      icon: ShieldCheck,
    },
    {
      key: 'security',
      name: 'Vikram Singh',
      role: 'SECURITY',
      roleTitle: 'Gate Operations Officer',
      badge: 'Sentry Post • Main Gate 1',
      desc: 'Rapidly verify student egress and ingress via high-contrast optical QR scanner or instant 4-digit fallback PIN entry during network drops.',
      href: '/security/dashboard',
      borderClass: 'border-cyan-500/30 hover:border-cyan-400 bg-gradient-to-b from-cyan-950/20 via-[#141722] to-transparent hover:shadow-cyan-950/30',
      tagClass: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
      icon: Key,
    },
    {
      key: 'admin',
      name: 'Dr. Ananya Ray',
      role: 'ADMIN',
      roleTitle: 'Director of Campus Operations',
      badge: 'Institutional Command Center',
      desc: 'Comprehensive operations cockpit, Section 44 cluster alert monitoring, SLA ageing tracking, department efficiency metrics, and audit logs.',
      href: '/admin/dashboard',
      borderClass: 'border-purple-500/30 hover:border-purple-400 bg-gradient-to-b from-purple-950/20 via-[#141722] to-transparent hover:shadow-purple-950/30',
      tagClass: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
      icon: Layers,
    },
  ];

  const features = [
    {
      icon: Layers,
      tag: 'FINITE-STATE ENGINE',
      title: 'Centralized Request Lifecycle',
      desc: 'Unified state machine governing ticket transitions (CREATE → ROUTE → ASSIGN → IN_PROGRESS → RESOLVE → CLOSE) with immutable audit events.',
      code: 'Ticket NX-10291 • RFC-Compliant Audit Trail',
    },
    {
      icon: Zap,
      tag: 'ZERO-LATENCY MATCHING',
      title: 'Deterministic Keyword Routing',
      desc: 'Regex-based specialization dispatch matching terms like "tap/leak/flush" directly to Plumbing and "fan/socket/power" to Electrical. No AI hallucinations.',
      code: 'Regex Analysis → Auto-Assigned in <12ms',
    },
    {
      icon: QrCode,
      tag: 'DUAL-MODE GATE SECURITY',
      title: 'Cryptographic QR & Sentry PIN',
      desc: 'HMAC-SHA256 signed QR tokens bound to student curfew timestamps, with offline 4-digit fallback PINs for high-throughput gate sentry checkpoints.',
      code: 'HMAC-SHA256 Token • 4-Digit Offline PIN',
    },
    {
      icon: FileCheck,
      tag: 'SECURE CREDENTIALS',
      title: 'Dynamic Bonafide Certificates',
      desc: 'Automated server-side PDF generation with institutional seals, serial watermarks, and zero-login public verification via scanned QR.',
      code: 'Registry: /verify/NX-BON-2026-00199',
    },
    {
      icon: Activity,
      tag: 'OPERATIONAL INTELLIGENCE',
      title: 'Section 44 Clustering & SLAs',
      desc: 'Algorithmic failure clustering identifying systemic hostel issues (≥3 complaints per block in 14 days) and granular SLA ageing categorized up to 48h+.',
      code: 'Active Cluster: Block B Plumbing (7 cases)',
    },
    {
      icon: Smartphone,
      tag: 'CAMPUS ACCESSIBILITY',
      title: 'Nexora Lite & Touch Kiosks',
      desc: 'Sub-25KB text-first interface engineered for congested 2G/3G connections, paired with physical touch terminals for roll number self-service.',
      code: 'Footprint < 25KB • Zero JavaScript Option',
    },
  ];

  const legacyVsNexora = [
    {
      legacy: 'Physical complaint registers with lost pages and untracked repair status',
      nexora: 'Centralized FSM tickets (NX-XXXXX) with live SLA countdowns and technician assignment',
    },
    {
      legacy: 'Paper gate chits signed by hand with zero timestamp verification at the boundary',
      nexora: 'Cryptographic QR codes and 4-digit PINs validated by sentry guards in real time',
    },
    {
      legacy: 'Multiday counter visits to request printed Bonafide certificates for internships',
      nexora: 'Instant digital Bonafide PDF with verifiable public registry check at /verify/[id]',
    },
    {
      legacy: 'Notice dissemination scattered across unread WhatsApp groups and paper noticeboards',
      nexora: 'Targeted circulars segmented by Branch, Year, and Hostel Block with read receipts',
    },
    {
      legacy: 'Repeated recurring infrastructure failures overlooked due to isolated complaint logs',
      nexora: 'Section 44 Intelligence algorithm automatically flagging facility failure clusters',
    },
  ];

  const campusNodes = [
    {
      id: 'hostel_b',
      title: 'Hostel Block B',
      type: 'RESIDENTIAL',
      status: 'ALERT',
      statusText: 'Plumbing Alert (NX-10291)',
      tagColor: 'text-rose-400 bg-rose-950/60 border-rose-800/60',
      pulseColor: 'bg-rose-500',
      details: '7 recurring plumbing complaints in 14 days. Section 44 cluster flagged. Work order NX-10291 in progress by Ramesh Kumar.',
      metrics: 'Rooms: 120 • Active Tickets: 7 • Warden: Dr. S. K. Mohapatra',
    },
    {
      id: 'main_gate',
      title: 'Main Sentry Gate',
      type: 'SECURITY POST',
      status: 'ACTIVE',
      statusText: 'Dual-Mode Scan Active',
      tagColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60',
      pulseColor: 'bg-cyan-400',
      details: 'Real-time sentry station verifying HMAC-SHA256 optical QR codes and 4-digit PIN bypass for student curfews.',
      metrics: 'Today Passes: 84 • PIN Fallbacks: 11 • Sentry Officer: Vikram Singh',
    },
    {
      id: 'academic',
      title: 'Academic & Labs Block',
      type: 'INSTRUCTIONAL',
      status: 'ACTIVE',
      statusText: 'Electrical Triage (NX-10294)',
      tagColor: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
      pulseColor: 'bg-amber-400',
      details: 'Lab 302 power trip auto-routed via regex match "power, switch" to Electrical staff Suresh Verma. SLA compliance 98.4%.',
      metrics: 'Lecture Halls: 18 • Labs: 12 • Open Tickets: 2',
    },
    {
      id: 'hostel_a',
      title: 'Hostel Block A',
      type: 'RESIDENTIAL',
      status: 'NORMAL',
      statusText: 'All Systems Normal',
      tagColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
      pulseColor: 'bg-emerald-400',
      details: 'No pending urgent facility issues. Daily curfew check completed. Digital leaves synchronized with warden console.',
      metrics: 'Rooms: 110 • Active Tickets: 0 • Curfew Compliance: 100%',
    },
    {
      id: 'mess',
      title: 'Central Campus Dining',
      type: 'FOOD SERVICES',
      status: 'NORMAL',
      statusText: 'Mess Pass Scanning',
      tagColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
      pulseColor: 'bg-emerald-400',
      details: 'Meal authentication active via student roll number barcodes. Inventory and kitchen maintenance regularized.',
      metrics: 'Capacity: 600 • Breakfast/Dinner Active • Rating: 4.6/5',
    },
  ];

  const fsmSteps = [
    { name: 'CREATE', role: 'Student', desc: 'Ticket initialized with NX-XXXXX ID' },
    { name: 'ROUTE', role: 'Engine', desc: 'Deterministic regex keyword classification' },
    { name: 'ASSIGN', role: 'System', desc: 'Specialized technician allocated' },
    { name: 'ACCEPT', role: 'Staff', desc: 'Technician confirms job pickup' },
    { name: 'IN_PROGRESS', role: 'Staff', desc: 'On-site repair underway with SLA clock' },
    { name: 'RESOLVE', role: 'Staff', desc: 'Proof submitted with OTP validation' },
    { name: 'CLOSE', role: 'Audit', desc: 'Student confirmation & permanent log' },
  ];

  const liveAuditEvents = [
    { time: '10:14:02', user: 'Aryan Khan (Student)', action: 'Created complaint NX-10291 (Water Pipe Leak)', type: 'CREATE' },
    { time: '10:14:03', user: 'Nexora Router', action: 'Matched "pipe, leak" → Assigned Ramesh Kumar (Plumbing)', type: 'ROUTE' },
    { time: '10:18:22', user: 'Dr. S. K. Mohapatra (Warden)', action: 'Approved Gate Pass GP-2026-0842 (Library visit)', type: 'APPROVAL' },
    { time: '10:22:15', user: 'Vikram Singh (Security)', action: 'Verified 4-Digit PIN 4819 at Main Gate Sentry', type: 'SENTRY' },
    { time: '10:28:40', user: 'Section 44 Engine', action: 'Detected 7 plumbing complaints in Hostel B → Alert dispatched', type: 'CLUSTER' },
  ];

  const handleMobilePersonaLaunch = (key: string) => {
    setMobileMenuOpen(false);
    switchPersona(key);
  };

  return (
    <div className="min-h-screen bg-[#0f1118] text-white selection:bg-[#d4af37] selection:text-black font-sans pb-28 sm:pb-24">
      {/* Top Notification Announcement Strip */}
      <div className="bg-[#141722] border-b border-[#282f42] py-1.5 px-3 sm:px-6 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30 whitespace-nowrap shimmer-gold">
              <Sparkles size={11} className="shrink-0" /> PS 7
            </span>
            <span className="text-gray-500 hidden md:inline">•</span>
            <span className="text-gray-400 text-[11px] hidden md:inline truncate">
              Attendance, Mess, Hostel, Repeat: Campus Life, Debugged
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-gray-400 shrink-0">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-gray-300 hidden sm:inline"> HOSTED LIVE : </span>
            </span>
            <span className="text-gray-600 hidden sm:inline">•</span>
            <a href="#personas" className="text-[#d4af37] hover:underline font-semibold whitespace-nowrap flex items-center gap-0.5">
              <span>Demo Personas</span>
              <span className="text-xs">&darr;</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Institutional Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0f1118]/95 backdrop-blur-md border-b border-[#232838] transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden flex items-center justify-center shadow-md shadow-amber-950/20 group-hover:scale-105 transition-transform shrink-0 border border-[#d4af37]/40 bg-[#141722] p-0.5 animate-subtle-float">
                <Image
                  src="/Logo.png"
                  alt="Nexora Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black tracking-wider text-sm sm:text-lg text-white whitespace-nowrap">
                  NEXORA CAMPUS 
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-mono tracking-widest text-[#d4af37] uppercase bg-[#1c2130] px-1.5 py-0.5 rounded border border-[#2e3447] whitespace-nowrap">
                  TEAM CIPHER 
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-gray-300">
            {[
              { href: '#problem', label: 'The Problem', id: 'problem' },
              { href: '#cockpit', label: 'Engine Preview', id: 'cockpit' },
              { href: '#personas', label: 'Role Ecosystem', id: 'personas' },
              { href: '#features', label: 'Capabilities', id: 'features' },
              { href: '#public-modes', label: 'Public Modes', id: 'public-modes' },
            ].map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-[#d4af37] bg-[#1c2130] border border-[#3d4661]/60 font-semibold shadow-sm'
                      : 'text-gray-300 hover:text-[#d4af37] hover:bg-[#141722]'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Header Controls: Action Buttons & 3-Line Mobile Feature Drawer Button */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Desktop / Tablet Quick Actions */}
            <Link
              href="/register"
              className="hidden md:flex px-3 py-1.5 rounded-lg border border-[#d4af37]/40 bg-[#1c2233] hover:bg-[#222a3f] text-[#d4af37] text-xs font-semibold transition items-center gap-1.5 active:scale-95 whitespace-nowrap"
            >
              <span>Student Sign Up</span>
            </Link>
            <Link
              href="/login"
              className="hidden sm:flex px-3 py-1.5 rounded-lg border border-[#2e3447] bg-[#141722] hover:bg-[#1c2130] text-gray-200 hover:text-white text-xs font-medium transition items-center gap-1.5 active:scale-95 whitespace-nowrap"
            >
              <Lock size={12} className="text-[#d4af37] shrink-0" />
              <span>Portal Login</span>
            </Link>
            <a
              href="#personas"
              className="hidden sm:flex px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#c49f2e] text-black hover:brightness-110 text-xs font-bold transition shadow-sm items-center gap-1 active:scale-95 whitespace-nowrap"
            >
              <span>Launch Demo</span>
              <ArrowRight size={12} className="shrink-0" />
            </a>

            {/* Mobile View: Quick 1-Click Launch Button */}
            <a
              href="#personas"
              className="sm:hidden px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#c49f2e] text-black text-xs font-bold transition flex items-center gap-1 active:scale-95 whitespace-nowrap shadow-sm"
            >
              <span>Demo</span>
              <ArrowRight size={11} className="shrink-0" />
            </a>

            {/* 3-Line Hamburger Menu in the Upper Right Corner for Mobile & Tablet */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#141722] border border-[#2e3447] text-gray-200 hover:text-[#d4af37] hover:border-[#d4af37]/60 transition-all flex items-center justify-center active:scale-90"
              aria-label={mobileMenuOpen ? 'Close Feature Menu' : 'Open All Campus Features'}
              title="All Campus Features & Navigation"
            >
              {mobileMenuOpen ? (
                <X size={20} className="text-[#d4af37] transition-transform rotate-90 duration-200" />
              ) : (
                <Menu size={20} className="transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>

        {/* 3-Line Upper Right Corner Mobile Feature Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-[#232838] bg-[#0c0e14]/98 backdrop-blur-xl shadow-2xl animate-drawer max-h-[85vh] overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-5 space-y-6">
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1f2536]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
                  <span className="text-xs font-bold font-mono tracking-wider text-[#d4af37] uppercase">
                    ALL CAMPUS FEATURES & PORTALS
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">BPUT 2026</span>
              </div>

              {/* Feature Section 1: 5 Interactive Role Portals */}
              <div>
                <div className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Users size={13} className="text-[#d4af37]" />
                  <span>Interactive Role Personas (1-Click Demo)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {personas.map((p) => {
                    const IconComponent = p.icon;
                    return (
                      <button
                        key={p.key}
                        onClick={() => handleMobilePersonaLaunch(p.key)}
                        disabled={loading}
                        className="p-3 rounded-xl bg-[#141722] border border-[#282f42] hover:border-[#d4af37]/60 text-left transition flex items-center justify-between group active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#1c2130] border border-[#2e3447] flex items-center justify-center text-[#d4af37] shrink-0">
                            <IconComponent size={15} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-[#d4af37] transition">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-gray-400">{p.roleTitle}</div>
                          </div>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold ${p.tagClass}`}>
                          {p.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feature Section 2: Public Modes & Accessibility */}
              <div>
                <div className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Building2 size={13} className="text-amber-400" />
                  <span>Public & Alternative Channels</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Link
                    href="/lite"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-3 rounded-xl bg-[#141722] border border-[#282f42] hover:border-amber-500/60 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} className="text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-gray-200 group-hover:text-amber-300">Nexora Lite</div>
                        <div className="text-[10px] text-gray-400">&lt; minimal mode</div>
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/kiosk"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-3 rounded-xl bg-[#141722] border border-[#282f42] hover:border-cyan-500/60 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <Monitor size={16} className="text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-gray-200 group-hover:text-cyan-300">Campus Touch Kiosk</div>
                        <div className="text-[10px] text-gray-400">Roll number terminal</div>
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/verify/NX-BON-2026-00199"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-3 rounded-xl bg-[#141722] border border-[#282f42] hover:border-emerald-500/60 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck size={16} className="text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-gray-200 group-hover:text-emerald-300">Document Registry</div>
                        <div className="text-[10px] text-gray-400">Zero-login certificate check</div>
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Feature Section 3: In-Page Quick Navigation */}
              <div>
                <div className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers size={13} className="text-cyan-400" />
                  <span>Landing Page Sections</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <a
                    href="#campus-pulse"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#181c28] border border-[#282f42] text-gray-300 hover:text-[#d4af37] transition"
                  >
                    Live Campus Pulse
                  </a>
                  <a
                    href="#cockpit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#181c28] border border-[#282f42] text-gray-300 hover:text-[#d4af37] transition"
                  >
                    Request Engine (NX-10291)
                  </a>
                  <a
                    href="#campus-map"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#181c28] border border-[#282f42] text-gray-300 hover:text-[#d4af37] transition"
                  >
                    Digital Campus Topology
                  </a>
                  <a
                    href="#problem"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#181c28] border border-[#282f42] text-gray-300 hover:text-[#d4af37] transition"
                  >
                    Problem & Transformation
                  </a>
                  <a
                    href="#fsm-lifecycle"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#181c28] border border-[#282f42] text-gray-300 hover:text-[#d4af37] transition"
                  >
                    FSM Lifecycle
                  </a>
                  <a
                    href="#personas"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#181c28] border border-[#282f42] text-gray-300 hover:text-[#d4af37] transition"
                  >
                    Role Ecosystem
                  </a>
                  <a
                    href="#command-center"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#181c28] border border-[#282f42] text-gray-300 hover:text-[#d4af37] transition"
                  >
                    Command Center Preview
                  </a>
                  <a
                    href="#features"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#181c28] border border-[#282f42] text-gray-300 hover:text-[#d4af37] transition"
                  >
                    Six Capabilities
                  </a>
                </div>
              </div>

              {/* Feature Section 4: Auth & Action Buttons */}
              <div className="pt-3 border-t border-[#1f2434] flex flex-col sm:flex-row gap-2">
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-[#d4af37]/40 bg-[#1c2233] hover:bg-[#222a3f] text-[#d4af37] text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Users size={13} />
                  <span>Create Student Account</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-[#2e3447] bg-[#141722] hover:bg-[#1c2130] text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Lock size={13} className="text-[#d4af37]" />
                  <span>Standard Account Login</span>
                </Link>
                <a
                  href="#personas"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c49f2e] text-black text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-950/20"
                >
                  <span>Launch Interactive Demo</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative pt-8 pb-12 sm:pt-14 sm:pb-20 overflow-hidden">
        {/* Live Campus Operations Background Infrastructure (CSS/SVG) - Stage 1 */}
        <HeroCampusBackground />

        {/* Ambient Top Glow Layer */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-4xl h-56 sm:h-72 bg-gradient-to-b from-[#d4af37]/10 via-[#1c2338]/15 to-transparent blur-3xl pointer-events-none animate-ambient-glow" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#161a25] border border-[#2e3447] text-[11px] sm:text-xs font-medium text-[#d4af37] mb-5 shadow-sm shimmer-gold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-ping" />
              <span>TEAM CIPHER PRESENTs </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] mb-5 text-white">
              ONE CAMPUS {' '}
              <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f8e7ab] to-[#d4af37] bg-clip-text text-transparent">
               ONE PLATFORM
              </span>
            </h1>

            <p className="text-xs sm:text-base text-gray-300 leading-relaxed font-normal mb-8 max-w-2xl mx-auto px-2">
Handle complaints, maintenance, gate passes, hostel leaves, certificates, and operational workflows through Nexora Campus.            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 mb-8 w-full max-w-md sm:max-w-none mx-auto">
              <a
                href="#personas"
                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c49f2e] text-black font-bold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-amber-950/30 transition flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02]"
              >
                <span>Interactive Persona Launcher</span>
                <ArrowRight size={14} />
              </a>
              <Link
                href="/login"
                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl border border-[#2e3447] bg-[#141722] hover:bg-[#1c2130] text-gray-200 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2 active:scale-95 hover:border-gray-500"
              >
                <span>Direct Account Sign In</span>
              </Link>
            </div>

            {/* LIVE CAMPUS OPERATIONS FLOW VISUALIZATION (Subtle Real Workflow Animation) */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#141722]/90 border border-[#282f42] max-w-3xl mx-auto mb-8 shadow-xl text-left relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#232838] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-wider">
                    Live Campus Request Lifecycle Signal
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#d4af37]">
                  Active Step {activeStepIndex + 1}/5
                </span>
              </div>

              {/* Connected Stage Nodes */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
                {[
                  { label: 'STUDENT', sub: 'Aryan Created', color: 'border-blue-500 text-blue-300' },
                  { label: 'NEXORA ENGINE', sub: 'Regex Matched', color: 'border-purple-500 text-purple-300' },
                  { label: 'STAFF ASSIGNED', sub: 'Ramesh Plumber', color: 'border-amber-500 text-amber-300' },
                  { label: 'IN PROGRESS', sub: 'SLA Clock Active', color: 'border-emerald-500 text-emerald-300' },
                  { label: 'RESOLVED ✓', sub: 'Audited & Closed', color: 'border-gold text-gold' },
                ].map((st, idx) => {
                  const isActive = activeStepIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border transition-all duration-300 ${
                        isActive
                          ? 'bg-[#1f2536] border-[#d4af37] text-white shadow-md shadow-amber-950/40 ring-1 ring-[#d4af37]/60'
                          : 'bg-[#10131d] border-[#232838] text-gray-400 opacity-60'
                      }`}
                    >
                      <div className={`font-bold ${isActive ? 'text-[#d4af37]' : ''}`}>{st.label}</div>
                      <div className="text-[9px] text-gray-500 mt-0.5 truncate">{st.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-3xl mx-auto pt-3 border-t border-[#232838] text-left">
              <div className="p-3 rounded-xl bg-[#141722]/80 border border-[#232838] hover:border-[#3d4661] hover:-translate-y-1 transition-all duration-200">
                <div className="text-[11px] text-gray-400 font-medium">Campus Roles</div>
                <div className="text-sm sm:text-base font-bold font-mono text-white mt-0.5">5 Integrated</div>
                <div className="text-[10px] text-gray-500 font-mono">Student → Admin</div>
              </div>
              <div className="p-3 rounded-xl bg-[#141722]/80 border border-[#232838] hover:border-[#3d4661] hover:-translate-y-1 transition-all duration-200">
                <div className="text-[11px] text-gray-400 font-medium">Ticket Engine</div>
                <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 mt-0.5">Finite State</div>
                <div className="text-[10px] text-gray-500 font-mono">Immutable Audit Logs</div>
              </div>
              <div className="p-3 rounded-xl bg-[#141722]/80 border border-[#232838] hover:border-[#3d4661] hover:-translate-y-1 transition-all duration-200">
                <div className="text-[11px] text-gray-400 font-medium">Gate Pass Sentry</div>
                <div className="text-sm sm:text-base font-bold font-mono text-cyan-400 mt-0.5">Dual-Mode</div>
                <div className="text-[10px] text-gray-500 font-mono">HMAC QR + 4-Digit PIN</div>
              </div>
              <div className="p-3 rounded-xl bg-[#141722]/80 border border-[#232838] hover:border-[#3d4661] hover:-translate-y-1 transition-all duration-200">
                <div className="text-[11px] text-gray-400 font-medium">Bandwidth Profile</div>
                <div className="text-sm sm:text-base font-bold font-mono text-[#d4af37] mt-0.5">&lt; 25 KB</div>
                <div className="text-[10px] text-gray-500 font-mono">Lite & Kiosk Interfaces</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LIVE CAMPUS PULSE SECTION */}
      <section id="campus-pulse" className="scroll-mt-20 py-8 sm:py-12 bg-[#12151f]/70 border-y border-[#232838]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal-on-scroll">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm sm:text-base font-bold tracking-wider font-mono text-white uppercase flex items-center gap-2">
                <span>LIVE CAMPUS PULSE</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-[#1f2536] text-[#d4af37] border border-[#3d4661]">
                  DEMO TELEMETRY
                </span>
              </h2>
            </div>
            <div className="text-xs text-gray-400 font-mono flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin text-emerald-400" />
              <span>SLA Target: 98.4% Compliance • BPUT Central Server Sync</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-[#141722] border border-[#282f42] hover:border-blue-500/50 transition group">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-xs font-mono">OPEN REQUESTS</span>
                <span className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
              <div className="text-3xl font-black font-mono text-white group-hover:text-blue-400 transition">18</div>
              <div className="text-[11px] text-gray-500 mt-1">Across 4 Hostel Blocks</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141722] border border-[#282f42] hover:border-amber-500/50 transition group">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-xs font-mono">IN PROGRESS</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <div className="text-3xl font-black font-mono text-amber-300 group-hover:text-amber-200 transition">07</div>
              <div className="text-[11px] text-gray-500 mt-1">Work Orders Dispatched</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141722] border border-rose-950/60 hover:border-rose-700/60 transition group">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-xs font-mono text-rose-300">SLA AT RISK</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div className="text-3xl font-black font-mono text-rose-400 group-hover:text-rose-300 transition">03</div>
              <div className="text-[11px] text-gray-500 mt-1">&gt; 24h Threshold Flagged</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141722] border border-[#282f42] hover:border-emerald-500/50 transition group">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-xs font-mono text-emerald-400">RESOLVED TODAY</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-3xl font-black font-mono text-emerald-300 group-hover:text-emerald-200 transition">142</div>
              <div className="text-[11px] text-gray-500 mt-1">OTP Confirmed by Students</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE REQUEST ENGINE SIMULATION COCKPIT */}
      <section id="cockpit" className="scroll-mt-20 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-mono text-[#d4af37] tracking-wider uppercase font-semibold">
              OPERATIONAL HARDWARE & TELEMETRY
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
              The Nexora Request Engine in Action
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Real-time representation of live ticket lifecycle, cryptographic dual-mode security, and algorithmic recurrence clustering.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-[#2e3447] bg-[#141722] shadow-2xl overflow-hidden hover:border-[#3d4661] transition-colors reveal-on-scroll hover-card-elevate">
              {/* Window Header with Responsive Mobile/Laptop Layout */}
              <div className="p-3 sm:px-4 sm:py-3 bg-[#181c28] border-b border-[#282f42]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
                  {/* Top Bar on Mobile / Left on Desktop */}
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block hover:brightness-125 transition" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block hover:brightness-125 transition" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block hover:brightness-125 transition" />
                    </div>
                    <span className="text-[11px] font-mono text-gray-400 truncate">
                      <span className="hidden sm:inline">nexora://operations-engine/</span>live-telemetry
                    </span>
                    <span className="sm:hidden text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      LIVE
                    </span>
                  </div>

                  {/* Simulator Switcher Segmented Tabs - Full Width on Mobile, Compact on Laptop */}
                  <div className="grid grid-cols-3 gap-1 bg-[#10131d] p-1 rounded-xl border border-[#282f42] w-full sm:w-auto text-[11px]">
                    <button
                      onClick={() => setActiveTab('lifecycle')}
                      className={`px-2 py-1.5 sm:px-3 sm:py-1 rounded-lg font-semibold text-center whitespace-nowrap transition-all duration-200 ${
                        activeTab === 'lifecycle'
                          ? 'bg-[#1f2536] text-[#d4af37] shadow-sm border border-[#3d4661]/40'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <span className="sm:hidden">Request FSM</span>
                      <span className="hidden sm:inline">Request FSM</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('gatepass')}
                      className={`px-2 py-1.5 sm:px-3 sm:py-1 rounded-lg font-semibold text-center whitespace-nowrap transition-all duration-200 ${
                        activeTab === 'gatepass'
                          ? 'bg-[#1f2536] text-[#d4af37] shadow-sm border border-[#3d4661]/40'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <span className="sm:hidden">Gate Pass</span>
                      <span className="hidden sm:inline">Dual-Mode Gate Pass</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('section44')}
                      className={`px-2 py-1.5 sm:px-3 sm:py-1 rounded-lg font-semibold text-center whitespace-nowrap transition-all duration-200 ${
                        activeTab === 'section44'
                          ? 'bg-[#1f2536] text-[#d4af37] shadow-sm border border-[#3d4661]/40'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <span className="sm:hidden">Section 44</span>
                      <span className="hidden sm:inline">Section 44 Intelligence</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content Display */}
              <div className="p-4 sm:p-6 min-h-[320px]">
                {activeTab === 'lifecycle' && (
                  <div className="space-y-4 animate-tab-fade">
                    {/* Live Ticket Header with Real-Time SLA Countdown Clock */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-[#232838] pb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] sm:text-xs font-mono px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-300 font-bold whitespace-nowrap shrink-0">
                            TICKET #NX-10291
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-gray-200">
                            Hostel Block B, Room 204 — Severe Water Pipe Leak
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1 font-mono">
                          <span>Reported: Aryan Khan (Student)</span>
                          <span>•</span>
                          <span className="text-[#d4af37]">Assigned: Ramesh Kumar (Plumbing)</span>
                        </div>
                      </div>
                      <div className="self-start sm:self-auto">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-amber-950/50 text-amber-300 border border-amber-800/60 whitespace-nowrap font-mono shadow-sm">
                          <Clock size={12} className="shrink-0 animate-spin text-amber-400" />
                          <span>
                            SLA: {String(slaTime.hours).padStart(2, '0')}:
                            {String(slaTime.minutes).padStart(2, '0')}:
                            {String(slaTime.seconds).padStart(2, '0')}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Stepper Pipeline with Live State Animation Indicator */}
                    <div>
                      <div className="flex items-center justify-between sm:hidden mb-1.5 text-[10px] text-gray-500 font-mono">
                        <span>LIFECYCLE PROGRESSION</span>
                        <span>Swipe steps →</span>
                      </div>
                      <div className="flex sm:grid sm:grid-cols-5 gap-2 overflow-x-auto pb-2 no-scrollbar snap-x">
                        {[
                          { title: '1. SUBMITTED', sub: 'Created', time: '10:14 AM', icon: CheckCircle2, complete: true },
                          { title: '2. AUTO-ROUTED', sub: 'Plumbing Desk', time: '< 10ms Regex', icon: CheckCircle2, complete: true },
                          { title: '3. ASSIGNED', sub: 'Ramesh Kumar', time: 'Senior Plumber', icon: CheckCircle2, complete: true },
                          { title: '4. IN REPAIR', sub: 'Work Underway', time: 'Audit Logged', icon: Clock, complete: false, active: true },
                          { title: '5. RESOLVED', sub: 'Pending OTP', time: 'Student Signoff', icon: Check, complete: false },
                        ].map((step, idx) => (
                          <div
                            key={idx}
                            className={`min-w-[135px] sm:min-w-0 snap-start shrink-0 sm:shrink p-2.5 rounded-xl border text-left transition-all ${
                              step.active
                                ? 'bg-[#1f2536] border-amber-700/60 ring-1 ring-amber-600/40 shadow-md shadow-amber-950/30'
                                : step.complete
                                ? 'bg-[#181c28] border-emerald-900/40'
                                : 'bg-[#181c28] border-[#282f42] opacity-60'
                            }`}
                          >
                            <div
                              className={`text-[10px] font-mono flex items-center gap-1 ${
                                step.active ? 'text-amber-400' : step.complete ? 'text-emerald-400' : 'text-gray-500'
                              }`}
                            >
                              <step.icon size={11} className={step.active ? 'animate-spin' : ''} />
                              <span>{step.title}</span>
                            </div>
                            <div className="text-xs font-semibold text-gray-200 mt-0.5">{step.sub}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{step.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#10131d] border border-[#232838] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-400">
                      <div className="flex items-start sm:items-center gap-2">
                        <Terminal size={14} className="text-[#d4af37] shrink-0 mt-0.5 sm:mt-0" />
                        <span className="font-mono text-[10px] sm:text-[11px] text-gray-300">
                          Deterministic Keyword Rule: &quot;pipe, leak, water&quot; &rarr; Auto-Assigned to Spec: PLUMBING
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold shrink-0">
                        Zero AI Hallucinations
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 'gatepass' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-center animate-tab-fade">
                    <div className="space-y-2.5 text-left">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                        <ShieldCheck size={12} /> GATE SENTRY VERIFICATION
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-white">Dual-Mode Curfew Gate Pass</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Issued to Aryan Khan for City Library visit. Validated against warden digital permission with cryptographic HMAC-SHA256 signature and offline 4-digit fallback PIN.
                      </p>
                      <div className="space-y-1.5 text-xs font-mono pt-1">
                        <div className="flex items-center justify-between text-gray-400 border-b border-[#282f42] pb-1">
                          <span>Pass Identifier:</span>
                          <span className="text-white font-bold">GP-2026-0842</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-400 border-b border-[#282f42] pb-1">
                          <span>Warden Approval:</span>
                          <span className="text-emerald-400">Dr. S. K. Mohapatra (VERIFIED)</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-400">
                          <span>Return Curfew:</span>
                          <span className="text-amber-300 font-bold">Today, 21:00 hrs (Strict)</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#10131d] border border-[#282f42] rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-white p-2 rounded-xl shadow-md flex items-center justify-center">
                        <QrCode size={88} className="text-black" />
                        {/* Animated Laser Scanner Sweep */}
                        <div className="absolute left-1 right-1 h-0.5 bg-cyan-500 shadow-[0_0_8px_#06b6d4] animate-scan-beam pointer-events-none" />
                      </div>
                      <div className="mt-3 text-center">
                        <span className="text-[10px] text-gray-400 uppercase font-mono block">Offline Sentry PIN</span>
                        <span className="text-xl sm:text-2xl font-black font-mono text-[#d4af37] tracking-widest bg-[#181c28] px-3.5 py-0.5 rounded-lg border border-[#3d4661] inline-block mt-0.5 shadow-inner">
                          4 8 1 9
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-2 font-mono">
                        Instant optical camera scan or keypad entry at Gate 1
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 'section44' && (
                  <div className="space-y-3.5 text-left animate-tab-fade">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-[#232838] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        <span className="text-xs font-bold text-rose-300 font-mono uppercase tracking-wider">
                          Section 44 Cluster Detected: Systemic Failure Hotspot
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono text-gray-400">
                        Density Scan: 14-Day Window
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/60 text-xs">
                      <div className="font-semibold text-rose-200 mb-1 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                        <span>Hostel Block B • 7 Plumbing Incidents in 14 Days</span>
                      </div>
                      <p className="text-gray-300 text-[11px] sm:text-xs leading-relaxed">
                        Rather than treating isolated tap leaks as separate random jobs, Section 44 Intelligence clusters repeated failures. Analysis indicates main riser pipe pressure valve fatigue in Block B East Wing.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      <div className="p-3 rounded-xl bg-[#181c28] border border-[#282f42] hover:border-gray-600 transition">
                        <span className="text-[10px] text-gray-400 block font-mono">Cluster Threshold</span>
                        <span className="text-sm sm:text-base font-bold font-mono text-white mt-0.5 block">&ge; 3 Issues / 14 Days</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#181c28] border border-[#282f42] hover:border-rose-700 transition">
                        <span className="text-[10px] text-gray-400 block font-mono">Current Incidence</span>
                        <span className="text-sm sm:text-base font-bold font-mono text-rose-400 mt-0.5 block">7 Active Tickets</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#181c28] border border-[#282f42] hover:border-amber-700 transition">
                        <span className="text-[10px] text-gray-400 block font-mono">Recommended Action</span>
                        <span className="text-sm sm:text-base font-bold font-mono text-amber-300 mt-0.5 block">Preventive Overhaul</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DIGITAL CAMPUS MAP & TOPOLOGY VISUALIZATION */}
      <section id="campus-map" className="scroll-mt-20 py-14 sm:py-20 bg-[#12151f]/50 border-t border-[#232838]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-mono text-[#d4af37] tracking-wider uppercase font-semibold flex items-center justify-center gap-1.5">
              <Compass size={13} /> PHYSICAL CAMPUS INFRASTRUCTURE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
              Interactive Digital Campus Topology
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Every request maps to a physical location. Click any building node to inspect live operations, occupancy, and active work orders.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-start reveal-on-scroll">
            {/* SVG Schematic Campus Map */}
            <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-[#141722] border border-[#2e3447] shadow-xl relative overflow-hidden hover-card-elevate">
              <div className="flex items-center justify-between pb-3 border-b border-[#232838] mb-4 text-xs font-mono text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-[#d4af37]" />
                  <span>COEB  CAMPUS GRID • </span>
                </div>
                <span className="text-emerald-400">5 Active Monitored Zones</span>
              </div>

              {/* Schematic Map Layout */}
              <div className="relative min-h-[280px] sm:min-h-[320px] flex items-center justify-center">
                {/* SVG Connecting Path Grid */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  {/* Lines connecting buildings */}
                  <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="#2e3447" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-flow" />
                  <line x1="80%" y1="30%" x2="50%" y2="50%" stroke="#2e3447" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-flow" />
                  <line x1="50%" y1="50%" x2="20%" y2="80%" stroke="#2e3447" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-flow" />
                  <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="#2e3447" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-flow" />
                  <line x1="50%" y1="50%" x2="50%" y2="92%" stroke="#2e3447" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-flow" />
                </svg>

                {/* Node: Hostel Block A (Top Left) */}
                <button
                  onClick={() => setSelectedCampusNode('hostel_a')}
                  className={`absolute top-[15%] left-[8%] sm:left-[15%] p-3 rounded-2xl border text-left transition-all group ${
                    selectedCampusNode === 'hostel_a'
                      ? 'bg-[#1f2536] border-[#d4af37] ring-2 ring-[#d4af37]/40 shadow-lg'
                      : 'bg-[#161a25] border-[#2e3447] hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-white">Hostel A</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">Normal</div>
                </button>

                {/* Node: Hostel Block B (Top Right - Active Alert) */}
                <button
                  onClick={() => setSelectedCampusNode('hostel_b')}
                  className={`absolute top-[15%] right-[8%] sm:right-[15%] p-3 rounded-2xl border text-left transition-all group ${
                    selectedCampusNode === 'hostel_b'
                      ? 'bg-[#221720] border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/50'
                      : 'bg-[#161a25] border-rose-900/60 hover:border-rose-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold text-rose-300">Hostel B</span>
                  </div>
                  <div className="text-[10px] text-rose-400 font-mono mt-0.5">Plumbing Alert</div>
                </button>

                {/* Node: Academic Complex (Center) */}
                <button
                  onClick={() => setSelectedCampusNode('academic')}
                  className={`p-4 rounded-2xl border text-left transition-all z-10 ${
                    selectedCampusNode === 'academic'
                      ? 'bg-[#1f2536] border-[#d4af37] ring-2 ring-[#d4af37]/40 shadow-xl'
                      : 'bg-[#181c28] border-[#2e3447] hover:border-amber-500/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs sm:text-sm font-bold text-white">Academic & Labs</span>
                  </div>
                  <div className="text-[10px] text-amber-300 font-mono mt-0.5">Main Block • Electrical</div>
                </button>

                {/* Node: Central Mess (Bottom Left) */}
                <button
                  onClick={() => setSelectedCampusNode('mess')}
                  className={`absolute bottom-[10%] left-[8%] sm:left-[15%] p-3 rounded-2xl border text-left transition-all group ${
                    selectedCampusNode === 'mess'
                      ? 'bg-[#1f2536] border-[#d4af37] ring-2 ring-[#d4af37]/40 shadow-lg'
                      : 'bg-[#161a25] border-[#2e3447] hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-white">Central Mess</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">Dining Pass</div>
                </button>

                {/* Node: Main Gate Sentry (Bottom Right) */}
                <button
                  onClick={() => setSelectedCampusNode('main_gate')}
                  className={`absolute bottom-[10%] right-[8%] sm:right-[15%] p-3 rounded-2xl border text-left transition-all group ${
                    selectedCampusNode === 'main_gate'
                      ? 'bg-[#14222a] border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-950/40'
                      : 'bg-[#161a25] border-[#2e3447] hover:border-cyan-500/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold text-cyan-300">Main Gate</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">Sentry Scanner</div>
                </button>
              </div>

              <div className="text-[11px] text-gray-500 font-mono text-center pt-2 border-t border-[#232838]">
                Interactive Campus Topological Model • Coordinates bound to BPUT Campus Master Plan
              </div>
            </div>

            {/* Selected Building Details Card */}
            {(() => {
              const node = campusNodes.find((n) => n.id === selectedCampusNode) || campusNodes[0];
              return (
                <div className="p-6 rounded-3xl bg-[#141722] border border-[#2e3447] shadow-xl text-left h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181c28] text-gray-400 border border-[#282f42]">
                        {node.type}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${node.tagColor}`}>
                        {node.statusText}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${node.pulseColor} shrink-0`} />
                      <span>{node.title}</span>
                    </h3>

                    <p className="text-xs text-gray-300 leading-relaxed mb-4">
                      {node.details}
                    </p>

                    <div className="p-3 rounded-xl bg-[#181c28] border border-[#282f42] text-[11px] text-gray-400 font-mono space-y-1.5">
                      <div className="text-gray-300 font-semibold">{node.metrics}</div>
                      <div className="text-emerald-400">Integrated telemetry: Online</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#232838] mt-4">
                    <a
                      href="#personas"
                      className="w-full py-2.5 rounded-xl bg-[#1f2536] border border-[#3d4661] hover:border-[#d4af37] text-xs font-semibold text-gray-200 hover:text-white transition flex items-center justify-center gap-1.5"
                    >
                      <span>Simulate Persona in this Sector</span>
                      <ArrowRight size={13} />
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* 5. PROBLEM → SOLUTION SECTION */}
      <section id="problem" className="scroll-mt-20 py-14 sm:py-20 bg-[#141722]/50 border-t border-[#232838]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-mono text-[#d4af37] tracking-wider uppercase font-semibold">
              THE REALITY OF CAMPUS ADMINISTRATION
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
              From Broken Campus Registers to Operational Precision
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-3 leading-relaxed">
              Traditional campus administration relies on disjointed manual processes that waste student hours and leave staff without audit visibility. Nexora replaces the entire paper trail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto reveal-on-scroll">
            {/* Legacy Campus Friction */}
            <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-b from-rose-950/15 via-[#161a25] to-[#141722] border border-rose-950/60 shadow-lg hover:border-rose-900/80 transition-all duration-300 hover-card-elevate stagger-1">
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2 text-rose-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>Fragmented Campus Reality</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                  BEFORE
                </span>
              </div>
              <ul className="space-y-3.5 text-xs text-gray-300">
                {legacyVsNexora.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-rose-950/80 text-rose-400 flex items-center justify-center shrink-0 text-[11px] font-mono mt-0.5 font-bold">
                      &times;
                    </span>
                    <span className="leading-relaxed text-gray-400">{item.legacy}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The Nexora Standard */}
            <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-b from-amber-950/15 via-[#161b28] to-[#141722] border border-[#d4af37]/40 shadow-xl shadow-amber-950/10 hover:border-[#d4af37]/80 transition-all duration-300 hover-card-elevate stagger-2">
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2 text-[#d4af37] text-xs sm:text-sm font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                  <span>With Our  Nexora Campus </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22283a] text-gold border border-[#3d4661]">
                  NOW
                </span>
              </div>
              <ul className="space-y-3.5 text-xs text-gray-200">
                {legacyVsNexora.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-mono mt-0.5">
                      <Check size={11} />
                    </span>
                    <span className="leading-relaxed text-gray-200 font-medium">{item.nexora}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. REQUEST ENGINE FSM LIFECYCLE VISUALIZATION */}
      <section id="fsm-lifecycle" className="scroll-mt-20 py-14 sm:py-20 bg-[#0f1118] border-t border-[#232838]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-mono text-[#d4af37] tracking-wider uppercase font-semibold flex items-center justify-center gap-1.5">
              <Workflow size={13} /> FINITE-STATE MACHINE ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
              RFC-Compliant State Machine Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Every transition is strictly validated on the backend. Illegal transitions (e.g. CLOSED → APPROVED) trigger immediate HTTP 422 rejections.
            </p>
          </div>

          <div className="max-w-5xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#141722] border border-[#2e3447] shadow-2xl reveal-on-scroll hover-card-elevate">
            {/* Animated FSM State Pipeline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center mb-6">
              {fsmSteps.map((fsm, i) => {
                const isActive = activeFsmIndex === i;
                return (
                  <button
                    key={fsm.name}
                    onClick={() => setActiveFsmIndex(i)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-[#1f2536] border-[#d4af37] text-white ring-2 ring-[#d4af37]/40 shadow-lg'
                        : 'bg-[#10131d] border-[#232838] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-gray-500">{i + 1}. {fsm.role}</div>
                    <div className={`text-xs font-extrabold font-mono mt-0.5 ${isActive ? 'text-[#d4af37]' : 'text-gray-200'}`}>
                      {fsm.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Currently Selected FSM State Detail */}
            <div className="p-4 rounded-2xl bg-[#181c28] border border-[#282f42] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-mono">
              <div>
                <span className="text-gray-400">ACTIVE STAGE: </span>
                <span className="text-[#d4af37] font-bold">{fsmSteps[activeFsmIndex].name}</span>
                <span className="text-gray-500 ml-2">({fsmSteps[activeFsmIndex].desc})</span>
              </div>
              <div className="text-emerald-400 text-[11px] shrink-0">
                ✓ Validated with Immutable DB Transition Log
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CONNECTED ROLE ECOSYSTEM */}
      <section id="personas" className="scroll-mt-20 py-16 sm:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#141722] border border-[#2e3447] rounded-3xl p-5 sm:p-10 shadow-2xl relative overflow-hidden reveal-on-scroll">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#282f42] pb-6 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1f2536] border border-[#3d4661] text-xs font-mono text-[#d4af37] mb-2 shimmer-gold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>1-CLICK PRESENTATION LAUNCHER</span>
                </div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white">
                  Experience Nexora by Campus Persona
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
                  Click any role card to immediately authenticate as that persona with pre-seeded campus records and role-specific permissions.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <Link
                  href="/register"
                  className="px-3.5 py-2 rounded-xl bg-[#202738] border border-[#d4af37]/45 hover:border-[#d4af37] text-xs font-semibold text-[#d4af37] hover:text-[#e4c257] transition flex items-center gap-1.5 active:scale-95 shadow-xs"
                >
                  <Users size={13} />
                  <span>Student Sign Up</span>
                </Link>
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl bg-[#1c2130] border border-[#2e3447] hover:border-[#d4af37]/60 text-xs font-medium text-gray-200 hover:text-white transition flex items-center gap-1.5 active:scale-95"
                >
                  <Lock size={13} className="text-[#d4af37]" />
                  <span>Portal Login</span>
                </Link>
              </div>
            </div>

            {/* 5 Persona Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {personas.map((p) => {
                const IconComponent = p.icon;
                const isCurrentActive = user && (
                  p.key === 'aryan' ? user.username === 'aryan' :
                  p.key === 'ramesh' ? user.username === 'ramesh' :
                  p.key === 'warden' ? user.username === 'warden_b' :
                  p.key === 'security' ? user.username === 'security_gate1' :
                  p.key === 'admin' ? user.username === 'admin' : false
                );

                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => switchPersona(p.key)}
                    disabled={loading}
                    className={`p-5 rounded-2xl border text-left transition-all duration-300 group flex flex-col justify-between relative hover:-translate-y-1.5 hover:shadow-2xl active:scale-[0.98] ${p.borderClass} ${
                      isCurrentActive ? 'ring-2 ring-[#d4af37]' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#181c28] border border-[#2e3447] flex items-center justify-center text-gray-300 group-hover:text-[#d4af37] group-hover:scale-105 transition-all shrink-0">
                            <IconComponent size={16} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white group-hover:text-[#d4af37] transition-colors">
                              {p.name}
                            </h4>
                            <span className="text-[11px] text-gray-400 block">{p.roleTitle}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold shrink-0 ${p.tagClass}`}>
                          {p.role}
                        </span>
                      </div>

                      <p className="text-xs text-gray-300 mb-4 leading-relaxed font-normal">
                        {p.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                      <span className="truncate mr-2">{p.badge}</span>
                      <span className="flex items-center gap-1 text-[#d4af37] font-semibold group-hover:translate-x-1.5 transition-transform shrink-0">
                        Launch Demo <ArrowRight size={13} />
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Public Quick Access Hub */}
              <div className="p-5 rounded-2xl border border-[#2e3447] bg-[#181c28] flex flex-col justify-between hover:border-[#3d4661] transition-all duration-300">
                <div>
                  <div className="flex items-center gap-2 text-gray-200 font-bold text-sm mb-1">
                    <Building2 size={16} className="text-[#d4af37]" />
                    <span>Public Portals & Offline Access</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Zero-login operational entry points designed for non-authenticated campus users, kiosks, and low-connectivity environments:
                  </p>

                  <div className="space-y-2 text-xs">
                    <Link
                      href="/lite"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#141722] hover:bg-[#1f2536] border border-[#282f42] hover:border-amber-700/60 transition group active:scale-95"
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone size={14} className="text-amber-400" />
                        <div>
                          <div className="font-semibold text-gray-200 group-hover:text-amber-300 transition">
                            Nexora Lite (&lt;25KB)
                          </div>
                          <div className="text-[10px] text-gray-400">Minimal text mode for slow 2G/3G</div>
                        </div>
                      </div>
                      <ArrowRight size={13} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      href="/kiosk"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#141722] hover:bg-[#1f2536] border border-[#282f42] hover:border-cyan-700/60 transition group active:scale-95"
                    >
                      <div className="flex items-center gap-2">
                        <Monitor size={14} className="text-cyan-400" />
                        <div>
                          <div className="font-semibold text-gray-200 group-hover:text-cyan-300 transition">
                            Campus Touch Kiosk
                          </div>
                          <div className="text-[10px] text-gray-400">Roll number lookup terminal</div>
                        </div>
                      </div>
                      <ArrowRight size={13} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      href="/verify/NX-BON-2026-00199"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#141722] hover:bg-[#1f2536] border border-[#282f42] hover:border-emerald-700/60 transition group active:scale-95"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck size={14} className="text-emerald-400" />
                        <div>
                          <div className="font-semibold text-gray-200 group-hover:text-emerald-300 transition">
                            Certificate Verification
                          </div>
                          <div className="text-[10px] text-gray-400">Cryptographic public registry</div>
                        </div>
                      </div>
                      <ArrowRight size={13} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 font-mono pt-3 border-t border-white/5">
                  Universal accessibility • Zero account credentials required
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-400 border-t border-[#232838] pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <span>Demo Persona accounts pre-seeded with real operational records.</span>
              <span className="hidden sm:inline">&bull;</span>
              <span>
                Standard password for manual login:{' '}
                <code className="text-[#d4af37] font-mono bg-[#181c28] px-1.5 py-0.5 rounded border border-[#2e3447]">
                  Password123!
                </code>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. COMMAND CENTER PREVIEW & LIVE EVENT AUDIT */}
      <section id="command-center" className="scroll-mt-20 py-14 sm:py-20 bg-[#12151f]/60 border-t border-[#232838]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-mono text-[#d4af37] tracking-wider uppercase font-semibold flex items-center justify-center gap-1.5">
              <Activity size={13} /> EXECUTIVE FLIGHT COCKPIT
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
              Nexora Command Center Preview
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Campus directors and wardens monitor real-time SLA ageing, audit logs, and recurring cluster alerts from one unified cockpit.
            </p>
          </div>

          <div className="max-w-5xl mx-auto p-6 rounded-3xl bg-[#141722] border border-[#2e3447] shadow-2xl reveal-on-scroll hover-card-elevate">
            {/* Top Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232838] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold font-mono text-white">NEXORA COMMAND CENTER</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181c28] text-emerald-400 border border-emerald-900/60">
                  ONLINE
                </span>
              </div>
              <div className="text-xs font-mono text-gray-400">
                Audited by Dr. Ananya Ray (Chief Administrator)
              </div>
            </div>

            {/* Live Operational Metrics in Command Center */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-[#181c28] border border-[#282f42]">
                <div className="text-[10px] font-mono text-gray-400">ACTIVE TICKETS</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">18 Open</div>
              </div>
              <div className="p-3 rounded-xl bg-[#181c28] border border-[#282f42]">
                <div className="text-[10px] font-mono text-gray-400">IN REPAIR</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">07 Active</div>
              </div>
              <div className="p-3 rounded-xl bg-[#181c28] border border-rose-950/60">
                <div className="text-[10px] font-mono text-rose-400">SLA BREACH RISK</div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">03 Tickets</div>
              </div>
              <div className="p-3 rounded-xl bg-[#181c28] border border-[#282f42]">
                <div className="text-[10px] font-mono text-emerald-400">RESOLVED TODAY</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">142 Cases</div>
              </div>
            </div>

            {/* Section 44 Hotspot Notice */}
            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/60 text-xs mb-6 flex items-start gap-3">
              <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-rose-200">
                  SECTION 44 ALERT: Hostel Block B / Plumbing
                </span>
                <p className="text-gray-300 text-[11px] mt-0.5">
                  7 complaints clustered in 14 days. Algorithmic diagnosis indicates East Wing riser valve stress. Preventive overhaul flagged for maintenance head.
                </p>
              </div>
            </div>

            {/* Live Audit Log Stream */}
            <div>
              <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Real-Time Audit Trail (RFC 5424 Format)</span>
                <span className="text-[10px] text-emerald-400">Live Stream</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {liveAuditEvents.map((evt, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-1 transition-all ${
                      auditIndex === idx
                        ? 'bg-[#1f2536] border-[#d4af37] text-gray-100 ring-1 ring-[#d4af37]/30'
                        : 'bg-[#10131d] border-[#232838] text-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">{evt.time}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-gray-300 border border-white/10">
                        {evt.type}
                      </span>
                      <span className="text-gray-200 font-semibold">{evt.user}:</span>
                      <span className="truncate">{evt.action}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0">Status: Audited</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. CORE ARCHITECTURAL CAPABILITIES */}
      <section id="features" className="scroll-mt-20 py-14 sm:py-20 bg-[#0f1118] border-t border-[#232838]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-mono text-[#d4af37] tracking-wider uppercase font-semibold">
              ENGINEERED FOR PRODUCTION REALITIES
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
              Six Architectural Pillars of Nexora Campus
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-3 leading-relaxed">
              Designed to meet strict institutional standards with deterministic guarantees, cryptographic verifiability, and zero tolerance for hallucinated data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-6xl mx-auto text-left reveal-on-scroll">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-[#141722] border border-[#232838] rounded-2xl p-5 hover:border-[#3d4661] hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#1c2130] border border-[#2e3447] flex items-center justify-center text-[#d4af37] group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                        <Icon size={19} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181c28] text-gray-400 border border-[#282f42]">
                        {f.tag}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white mb-2 group-hover:text-[#d4af37] transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      {f.desc}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#232838] font-mono text-[10px] text-gray-500">
                    {f.code}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. PUBLIC ACCESSIBILITY & CHANNELS */}
      <section id="public-modes" className="scroll-mt-20 py-14 sm:py-20 bg-[#141722]/40 border-t border-[#232838]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <span className="text-xs font-mono text-[#d4af37] tracking-wider uppercase font-semibold">
              ALTERNATIVE PLATFORM CHANNELS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Inclusive Campus Access, On Any Device
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Campuses have dead zones, power outages, and diverse smartphone access. Nexora ensures no student is left stranded.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto reveal-on-scroll">
            <Link
              href="/lite"
              className="p-5 sm:p-6 rounded-2xl bg-[#141722] border border-[#282f42] hover:border-amber-500/60 hover:-translate-y-1.5 transition-all duration-300 group text-left active:scale-[0.99] hover:shadow-lg hover:shadow-amber-950/20"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                <Smartphone size={20} />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                Nexora Lite (&lt; 25KB)
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Hyper-optimized text interface designed for 2G campus signals. Operates smoothly even with JavaScript disabled.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-400">
                <span>Open Lite Portal</span>
                <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/kiosk"
              className="p-5 sm:p-6 rounded-2xl bg-[#141722] border border-[#282f42] hover:border-cyan-500/60 hover:-translate-y-1.5 transition-all duration-300 group text-left active:scale-[0.99] hover:shadow-lg hover:shadow-cyan-950/20"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                <Monitor size={20} />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                Touch Kiosk Mode
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Terminal interface installed in hostel lobbies. Allows instant roll-number ticket submission without personal phones.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyan-400">
                <span>Launch Touch Kiosk</span>
                <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/verify/NX-BON-2026-00199"
              className="p-5 sm:p-6 rounded-2xl bg-[#141722] border border-[#282f42] hover:border-emerald-500/60 hover:-translate-y-1.5 transition-all duration-300 group text-left active:scale-[0.99] hover:shadow-lg hover:shadow-emerald-950/20"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <FileCheck size={20} />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                Public Registry Verify
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Zero-login verification portal for companies, visa authorities, and parents to validate Bonafide certificate authenticity.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <span>View Sample Certificate</span>
                <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 11. INSTITUTIONAL FOOTER */}
      <footer className="border-t border-[#232838] bg-[#0c0e14] py-12 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 pb-10 border-b border-[#1f2434]">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-[#d4af37]/40 bg-[#141722] p-0.5 shrink-0">
                  <Image
                    src="/Logo.png"
                    alt="Nexora Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-bold text-white tracking-wider text-sm">NEXORA CAMPUS</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Centralized campus operations platform engineered for BPUT Hackathon 2026. Eliminating fragmented paper workflows with deterministic lifecycle governance.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs w-full md:w-auto">
              <div>
                <div className="font-bold text-white mb-2.5 font-mono text-[11px] uppercase tracking-wider">
                  Role Portals
                </div>
                <ul className="space-y-1.5 text-gray-400">
                  <li>
                    <button onClick={() => switchPersona('aryan')} className="hover:text-[#d4af37] transition text-left">
                      Student Dashboard
                    </button>
                  </li>
                  <li>
                    <button onClick={() => switchPersona('ramesh')} className="hover:text-[#d4af37] transition text-left">
                      Staff Work Orders
                    </button>
                  </li>
                  <li>
                    <button onClick={() => switchPersona('warden')} className="hover:text-[#d4af37] transition text-left">
                      Warden Cockpit
                    </button>
                  </li>
                  <li>
                    <button onClick={() => switchPersona('security')} className="hover:text-[#d4af37] transition text-left">
                      Security Gate Scanner
                    </button>
                  </li>
                  <li>
                    <button onClick={() => switchPersona('admin')} className="hover:text-[#d4af37] transition text-left">
                      Admin Command Center
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <div className="font-bold text-white mb-2.5 font-mono text-[11px] uppercase tracking-wider">
                  Public Modes
                </div>
                <ul className="space-y-1.5 text-gray-400">
                  <li>
                    <Link href="/lite" className="hover:text-[#d4af37] transition">
                      Nexora Lite (&lt; Low Speed Internet)
                    </Link>
                  </li>
                  <li>
                    <Link href="/kiosk" className="hover:text-[#d4af37] transition">
                      Lobby Touch Kiosk
                    </Link>
                  </li>
                  <li>
                    <Link href="/verify/NX-BON-2026-00199" className="hover:text-[#d4af37] transition">
                      Public Certificate Registry
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-[#d4af37] transition">
                      Standard Authentication
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <div className="font-bold text-white mb-2.5 font-mono text-[11px] uppercase tracking-wider">
                  Hackathon Meta
                </div>
                <div className="text-gray-400 space-y-1">
                  <div className="text-gray-300 font-medium">BPUT Hackathon 2026</div>
                  <div className="text-[11px]">Track: Campus Operations</div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-1">24 Integration Tests (100% Pass)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 text-[11px]">
            <div>
              &copy; 2026 Nexora Campus . All rights are Reserved to Team Cipher .
            </div>
            <div className="flex items-center gap-3">
              <span>Next.js 14 App Router</span>
              <span>&bull;</span>
              <span>TypeScript</span>
              <span>&bull;</span>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
