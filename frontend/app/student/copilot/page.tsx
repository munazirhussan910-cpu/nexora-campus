'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import {
  Sparkles,
  Send,
  Wrench,
  Key,
  FileCheck,
  Calendar,
  BookOpen,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Shield,
  Download,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  HelpCircle,
  FileText,
  User,
  Check,
  RotateCcw,
  Zap,
  CornerDownLeft,
  GraduationCap,
  Info,
} from 'lucide-react';

interface CopilotCard {
  cardType:
    | 'ACTION_MAINTENANCE'
    | 'ACTION_BONAFIDE'
    | 'ACTION_LEAVE'
    | 'ACTION_GATE_PASS'
    | 'GUIDE_PROCEDURE'
    | 'STUDY_PLAN'
    | 'RESOURCE_LIST';
  title: string;
  data: any;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  cards?: CopilotCard[];
  quickReplies?: string[];
}

interface SuggestedPrompt {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  category: string;
  prompt: string;
  description: string;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: 'attendance',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/30',
    category: 'Academic Telemetry',
    prompt: 'Show my attendance status',
    description: 'Check overall percentage, subject breakdown, and 75% margin calculation',
  },
  {
    id: 'classes',
    icon: Clock,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/30',
    category: 'Timetable & Routine',
    prompt: 'What classes do I have today?',
    description: 'Inspect your period schedule, lecture hall locations, and faculty roster',
  },
  {
    id: 'gatepass',
    icon: Key,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    category: 'Perimeter Security',
    prompt: 'How do I apply for a gate pass?',
    description: 'Generate campus exit authorization with dynamic HMAC QR code & offline PIN',
  },
  {
    id: 'maintenance',
    icon: Wrench,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/30',
    category: 'Hostel Operations',
    prompt: 'Help me report a maintenance issue',
    description: 'Automatically route broken fixtures (fan, tap, light) to specialist staff',
  },
  {
    id: 'deadlines',
    icon: Calendar,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/30',
    category: 'Deadlines & Events',
    prompt: 'What academic deadlines are coming up?',
    description: 'Review semester registrations, exam fee dates, and project submissions',
  },
  {
    id: 'studyplan',
    icon: BookOpen,
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/10 border-violet-500/30',
    category: 'Exam Preparation',
    prompt: 'Generate a 10-day DBMS study plan',
    description: 'Create an interactive daily roadmap tailored to BPUT syllabus & PYQs',
  },
];

/**
 * Enhanced Markdown text renderer for structured AI output
 * Handles bolding, inline code, headings, lists, and quotes cleanly.
 */
function FormattedMessageText({ text }: { text: string }) {
  if (!text) return null;

  // Split into paragraphs by double newlines or single newlines
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-2.5 text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');

        // Check if paragraph is a list
        const isBulletList = lines.every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
        const isNumberedList = lines.every((l) => /^\d+\.\s/.test(l.trim()));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-1.5 my-2 pl-1">
              {lines.map((line, lIdx) => {
                const content = line.replace(/^[-*]\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0 shadow-xs shadow-violet-400/50" />
                    <span className="flex-1">{renderInlineMarkdown(content)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={pIdx} className="space-y-2 my-2 pl-1">
              {lines.map((line, lIdx) => {
                const match = line.match(/^(\d+)\.\s+(.*)$/);
                const num = match ? match[1] : `${lIdx + 1}`;
                const content = match ? match[2] : line;
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {num}
                    </span>
                    <span className="flex-1">{renderInlineMarkdown(content)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Regular paragraph or line-by-line block
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              // Heading 3
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="text-sm sm:text-base font-bold text-white pt-2 pb-1 flex items-center gap-1.5">
                    <span className="w-1 h-3.5 bg-violet-500 rounded-full" />
                    {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
                  </h4>
                );
              }

              // Heading 2
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={lIdx} className="text-base font-extrabold text-white pt-2.5 pb-1 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-violet-500 rounded-full" />
                    {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
                  </h3>
                );
              }

              // Blockquote
              if (trimmed.startsWith('> ')) {
                return (
                  <blockquote
                    key={lIdx}
                    className="border-l-2 border-violet-500/60 pl-3 py-1 my-1 text-xs text-gray-300 italic bg-violet-500/5 rounded-r-lg"
                  >
                    {renderInlineMarkdown(trimmed.replace(/^>\s+/, ''))}
                  </blockquote>
                );
              }

              return (
                <p key={lIdx} className="min-h-[1.25em]">
                  {renderInlineMarkdown(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Handles inline markdown: **bold**, `code`, *italic*
 */
function renderInlineMarkdown(str: string): React.ReactNode {
  // Tokenize by inline code and bold
  const tokens = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return tokens.map((tok, i) => {
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded-md bg-[#1a2136] border border-[#2b3859] font-mono text-[11px] sm:text-xs text-violet-300 font-semibold mx-0.5"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-semibold">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    return tok;
  });
}

export default function StudentCopilotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedPlanDays, setExpandedPlanDays] = useState<Record<string, boolean>>({});

  // Action execution state tracking by card identifier
  const [actionStatus, setActionStatus] = useState<
    Record<string, { loading: boolean; success: boolean; result?: any; error?: string }>
  >({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const studentFirstName = user?.fullName?.split(' ')[0] || user?.username || 'Student';

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history (last 6 exchanges)
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      const res = await apiRequest('/copilot/message', {
        method: 'POST',
        body: JSON.stringify({ message: query, history }),
      });

      if (res.success && res.data) {
        const copilotMsg: ChatMessage = {
          id: `copilot-${Date.now()}`,
          sender: 'copilot',
          text: res.data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cards: res.data.cards || [],
          quickReplies: res.data.quickReplies || [],
        };
        setMessages((prev) => [...prev, copilotMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'copilot',
            text: res.error?.message || 'Sorry, I encountered an issue connecting to the campus operations engine. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'copilot',
          text: 'Network error communicating with the Nexora backend. Please verify your connection or try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setActionStatus({});
    setInput('');
  };

  // --------------------------------------------------------------------------
  // WORKFLOW ACTION EXECUTORS (Triggering existing backend APIs)
  // --------------------------------------------------------------------------

  const handleExecuteMaintenance = async (cardKey: string, payload: any) => {
    setActionStatus((prev) => ({ ...prev, [cardKey]: { loading: true, success: false } }));

    const res = await apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        location: payload.location,
        priority: payload.priority || 'NORMAL',
        category: payload.category,
      }),
    });

    if (res.success && res.data) {
      setActionStatus((prev) => ({
        ...prev,
        [cardKey]: { loading: false, success: true, result: res.data },
      }));
    } else {
      setActionStatus((prev) => ({
        ...prev,
        [cardKey]: {
          loading: false,
          success: false,
          error: res.error?.message || 'Failed to submit maintenance request',
        },
      }));
    }
  };

  const handleExecuteBonafide = async (cardKey: string, payload: any) => {
    setActionStatus((prev) => ({ ...prev, [cardKey]: { loading: true, success: false } }));

    const res = await apiRequest('/bonafide', {
      method: 'POST',
      body: JSON.stringify({
        purpose: payload.purpose || 'Scholarship',
      }),
    });

    if (res.success && res.data) {
      setActionStatus((prev) => ({
        ...prev,
        [cardKey]: { loading: false, success: true, result: res.data },
      }));
    } else {
      setActionStatus((prev) => ({
        ...prev,
        [cardKey]: {
          loading: false,
          success: false,
          error: res.error?.message || 'Failed to submit bonafide request',
        },
      }));
    }
  };

  const handleExecuteLeave = async (cardKey: string, payload: any) => {
    setActionStatus((prev) => ({ ...prev, [cardKey]: { loading: true, success: false } }));

    const res = await apiRequest('/leaves', {
      method: 'POST',
      body: JSON.stringify({
        startDate: new Date(payload.startDate).toISOString(),
        endDate: new Date(payload.endDate).toISOString(),
        reason: payload.reason,
        emergencyContact: payload.emergencyContact,
        parentConsent: payload.parentConsent ?? true,
      }),
    });

    if (res.success && res.data) {
      setActionStatus((prev) => ({
        ...prev,
        [cardKey]: { loading: false, success: true, result: res.data },
      }));
    } else {
      setActionStatus((prev) => ({
        ...prev,
        [cardKey]: {
          loading: false,
          success: false,
          error: res.error?.message || 'Failed to submit leave request',
        },
      }));
    }
  };

  const handleExecuteGatePass = async (cardKey: string, payload: any) => {
    setActionStatus((prev) => ({ ...prev, [cardKey]: { loading: true, success: false } }));

    const res = await apiRequest('/gate-passes', {
      method: 'POST',
      body: JSON.stringify({
        destination: payload.destination,
        reason: payload.reason,
        departureTime: new Date(payload.departureTime).toISOString(),
        expectedReturnTime: new Date(payload.expectedReturnTime).toISOString(),
      }),
    });

    if (res.success && res.data) {
      setActionStatus((prev) => ({
        ...prev,
        [cardKey]: { loading: false, success: true, result: res.data },
      }));
    } else {
      setActionStatus((prev) => ({
        ...prev,
        [cardKey]: {
          loading: false,
          success: false,
          error: res.error?.message || 'Failed to submit gate pass request',
        },
      }));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto space-y-3.5">
      {/* --------------------------------------------------------------------- */}
      {/* 1. COPILOT AI IDENTITY & HEADER                                       */}
      {/* --------------------------------------------------------------------- */}
      <header className="bg-gradient-to-r from-[#121626] via-[#151a2e] to-[#121626] border border-[#232c44] rounded-2xl p-3.5 sm:p-4 shadow-xl shrink-0 flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-900 border border-violet-400/40 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
              <Sparkles size={20} className="text-violet-200 animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#121626]" title="AI Engine Online" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Nexora Copilot
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-950/80 border border-violet-500/40 text-violet-300">
                AI Campus Agent
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Engine Active
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1.5">
              <span>Campus Problem-Solving Layer</span>
              <span className="text-gray-600">•</span>
              <span className="hidden sm:inline">Directly connected to verified workflows &amp; institutional records</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetChat}
            className="text-xs font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-xl bg-[#181f33] hover:bg-[#1f2842] border border-[#2b3754] transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            title="Start new conversation"
          >
            <RotateCcw size={13} className="text-violet-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. MAIN CHAT / WELCOME VIEWPORT                                       */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scroll-smooth min-h-0">
        {/* WELCOME HERO SECTION (Displayed when no conversation exists) */}
        {messages.length === 0 && (
          <div className="space-y-4 py-2 sm:py-4 animate-message-in">
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16172e] via-[#121626] to-[#0c0f1a] border border-violet-500/25 p-5 sm:p-8 shadow-2xl">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300 text-xs font-mono font-semibold mb-3.5 shadow-sm">
                  <Sparkles size={13} className="text-amber-400" />
                  <span>Interactive Campus Operations AI</span>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                  How can I help you today,{' '}
                  <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                    {studentFirstName}
                  </span>
                  ?
                </h2>

                <p className="text-xs sm:text-sm text-gray-300 mt-2.5 leading-relaxed">
                  I am your centralized campus operations co-pilot. Instead of navigating multiple offices, physical paper chits, and fragmented notices, simply describe what you need. I will answer verified procedures, track your academic margins, or draft and submit actionable tickets directly to campus authorities.
                </p>

                {/* Capability Badges */}
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-gray-300">
                  <span className="px-2.5 py-1 rounded-lg bg-[#181f33] border border-[#2b3754] flex items-center gap-1.5">
                    <Wrench size={12} className="text-amber-400" />
                    <span>Maintenance Auto-Routing</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#181f33] border border-[#2b3754] flex items-center gap-1.5">
                    <Key size={12} className="text-cyan-400" />
                    <span>Cryptographic Gate Passes</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#181f33] border border-[#2b3754] flex items-center gap-1.5">
                    <FileCheck size={12} className="text-emerald-400" />
                    <span>Bonafide Certificates</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#181f33] border border-[#2b3754] flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-blue-400" />
                    <span>75% Attendance Margins</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Suggested Quick Prompts Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                  <Zap size={13} className="text-amber-400" />
                  <span>Recommended Questions &amp; Workflows</span>
                </div>
                <span className="text-[11px] font-mono text-gray-500">Tap to run</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SUGGESTED_PROMPTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="group p-3.5 rounded-2xl bg-[#121626]/80 hover:bg-[#181f33] border border-[#232c44] hover:border-violet-500/50 text-left transition-all duration-200 active:scale-98 flex flex-col justify-between shadow-md hover:shadow-lg hover:shadow-violet-950/30"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center ${item.iconColor} shrink-0 transition-transform group-hover:scale-105`}>
                            <Icon size={16} />
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tight">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                          &ldquo;{item.prompt}&rdquo;
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-end mt-3 pt-2 border-t border-white/5 text-[11px] font-mono font-bold text-violet-400 group-hover:text-violet-300">
                        <span className="flex items-center gap-1">
                          Ask Copilot <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE CONVERSATION STREAM */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            } space-y-2 animate-message-in`}
          >
            {/* Message Bubble Card */}
            <div
              className={`max-w-3xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed transition-all ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-br from-[#1c233c] to-[#161c32] border border-violet-500/30 text-white rounded-tr-xs shadow-lg ml-8 sm:ml-12'
                  : 'bg-[#121626] border border-[#232c44] text-gray-200 rounded-tl-xs mr-8 sm:mr-12 shadow-xl'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-center justify-between gap-4 mb-2.5 pb-2 border-b border-white/5 text-[11px] font-mono text-gray-400">
                <span className="font-bold flex items-center gap-1.5">
                  {msg.sender === 'user' ? (
                    <>
                      <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <User size={12} />
                      </div>
                      <span className="text-white">{user?.fullName || user?.username || 'You'}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-md bg-violet-600/30 text-violet-300 flex items-center justify-center">
                        <Sparkles size={12} />
                      </div>
                      <span className="text-violet-300 font-extrabold tracking-tight">Nexora Copilot</span>
                      <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[9px] bg-violet-950 text-violet-400 border border-violet-500/30">
                        AI Verified
                      </span>
                    </>
                  )}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Formatted Markdown Message Text */}
              <FormattedMessageText text={msg.text} />

              {/* Render Structured Cards if attached */}
              {msg.cards && msg.cards.length > 0 && (
                <div className="mt-4 space-y-3 pt-3 border-t border-[#1e253b]">
                  {msg.cards.map((card, cIdx) => {
                    const cardKey = `${msg.id}-card-${cIdx}`;
                    const currentStatus = actionStatus[cardKey];

                    // 1. ACTION: MAINTENANCE
                    if (card.cardType === 'ACTION_MAINTENANCE') {
                      return (
                        <div
                          key={cardKey}
                          className="p-4 rounded-xl bg-gradient-to-br from-[#161a29] to-[#121624] border border-amber-500/40 space-y-3 shadow-lg"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-600/50">
                              <Wrench size={12} />
                              <span>{card.data.category} Maintenance Workflow</span>
                            </div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                card.data.priority === 'URGENT'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-700'
                                  : 'bg-[#1e2538] text-gray-300 border border-[#2d3851]'
                              }`}
                            >
                              {card.data.priority} Priority
                            </span>
                          </div>

                          <div>
                            <div className="text-sm font-bold text-white">
                              {card.data.title}
                            </div>
                            <div className="text-xs text-gray-300 mt-1">
                              &ldquo;{card.data.description}&rdquo;
                            </div>
                            <div className="text-[11px] font-mono text-gray-400 mt-2 flex items-center gap-1.5">
                              <MapPin size={12} className="text-amber-400" />
                              <span>
                                Target Location: <strong className="text-gray-200">{card.data.location}</strong>
                              </span>
                            </div>
                          </div>

                          {currentStatus?.success ? (
                            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                                <div>
                                  <div className="font-bold">
                                    Ticket Logged: {currentStatus.result.requestNumber}
                                  </div>
                                  <div className="text-[11px] text-emerald-400/80">
                                    Assigned: {currentStatus.result.routing?.assignedTo || 'Technician Queue'}
                                  </div>
                                </div>
                              </div>
                              <Link
                                href={`/student/requests/${currentStatus.result.id}`}
                                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 transition"
                              >
                                View Ticket <ArrowRight size={12} />
                              </Link>
                            </div>
                          ) : (
                            <div>
                              {currentStatus?.error && (
                                <div className="mb-2 p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                                  <AlertCircle size={14} className="shrink-0" />
                                  <span>{currentStatus.error}</span>
                                </div>
                              )}
                              <button
                                onClick={() => handleExecuteMaintenance(cardKey, card.data)}
                                disabled={currentStatus?.loading}
                                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {currentStatus?.loading ? (
                                  <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    <span>Routing &amp; Creating Ticket...</span>
                                  </>
                                ) : (
                                  <>
                                    <Wrench size={14} />
                                    <span>Confirm &amp; Create Maintenance Request</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 2. ACTION: BONAFIDE
                    if (card.cardType === 'ACTION_BONAFIDE') {
                      return (
                        <div
                          key={cardKey}
                          className="p-4 rounded-xl bg-gradient-to-br from-[#141b29] to-[#111724] border border-emerald-500/40 space-y-3 shadow-lg"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
                              <FileCheck size={12} />
                              <span>Academic Certification Workflow</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">
                              Turnaround: 24–48h
                            </span>
                          </div>

                          <div>
                            <div className="text-sm font-bold text-white">
                              Official Bonafide Certificate
                            </div>
                            <div className="text-xs text-gray-300 mt-1">
                              Purpose: <strong className="text-emerald-400">{card.data.purpose}</strong>
                            </div>
                            <div className="text-[11px] font-mono text-gray-400 mt-1">
                              Student: {card.data.studentName} ({card.data.rollNumber}) • {card.data.branch}
                            </div>
                          </div>

                          {currentStatus?.success ? (
                            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                                <div>
                                  <div className="font-bold">
                                    Request Submitted: {currentStatus.result.requestNumber}
                                  </div>
                                  <div className="text-[11px] text-emerald-400/80">
                                    Forwarded to Academic Office for digital signature
                                  </div>
                                </div>
                              </div>
                              <Link
                                href="/student/documents"
                                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 transition"
                              >
                                View Documents <ArrowRight size={12} />
                              </Link>
                            </div>
                          ) : (
                            <div>
                              {currentStatus?.error && (
                                <div className="mb-2 p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                                  <AlertCircle size={14} className="shrink-0" />
                                  <span>{currentStatus.error}</span>
                                </div>
                              )}
                              <button
                                onClick={() => handleExecuteBonafide(cardKey, card.data)}
                                disabled={currentStatus?.loading}
                                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {currentStatus?.loading ? (
                                  <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    <span>Submitting Application...</span>
                                  </>
                                ) : (
                                  <>
                                    <FileCheck size={14} />
                                    <span>Confirm &amp; Submit Bonafide Request</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 3. ACTION: HOSTEL LEAVE
                    if (card.cardType === 'ACTION_LEAVE') {
                      return (
                        <div
                          key={cardKey}
                          className="p-4 rounded-xl bg-gradient-to-br from-[#18162b] to-[#121424] border border-purple-500/40 space-y-3 shadow-lg"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-600/50">
                              <Calendar size={12} />
                              <span>Hostel Leave Workflow</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">
                              Warden Approval Required
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="text-sm font-bold text-white">
                              {card.data.startDate} to {card.data.endDate}
                            </div>
                            <div className="text-xs text-gray-300">
                              Reason: &ldquo;{card.data.reason}&rdquo;
                            </div>
                            <div className="text-[11px] font-mono text-gray-400">
                              Emergency Contact: {card.data.emergencyContact} • Parent Consent: Verified
                            </div>
                          </div>

                          {currentStatus?.success ? (
                            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                                <div>
                                  <div className="font-bold">
                                    Leave Submitted: {currentStatus.result.requestNumber}
                                  </div>
                                  <div className="text-[11px] text-emerald-400/80">
                                    Hostel Warden notified for review
                                  </div>
                                </div>
                              </div>
                              <Link
                                href="/student/leave"
                                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 transition"
                              >
                                View Leaves <ArrowRight size={12} />
                              </Link>
                            </div>
                          ) : (
                            <div>
                              {currentStatus?.error && (
                                <div className="mb-2 p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                                  <AlertCircle size={14} className="shrink-0" />
                                  <span>{currentStatus.error}</span>
                                </div>
                              )}
                              <button
                                onClick={() => handleExecuteLeave(cardKey, card.data)}
                                disabled={currentStatus?.loading}
                                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {currentStatus?.loading ? (
                                  <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    <span>Submitting to Warden...</span>
                                  </>
                                ) : (
                                  <>
                                    <Calendar size={14} />
                                    <span>Confirm &amp; Submit Leave Request</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 4. ACTION: GATE PASS
                    if (card.cardType === 'ACTION_GATE_PASS') {
                      return (
                        <div
                          key={cardKey}
                          className="p-4 rounded-xl bg-gradient-to-br from-[#131b29] to-[#0f1524] border border-cyan-500/40 space-y-3 shadow-lg"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-600/50">
                              <Key size={12} />
                              <span>Campus Exit Authorization</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">
                              Auto PIN Generation
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="text-sm font-bold text-white">
                              Destination: {card.data.destination}
                            </div>
                            <div className="text-xs text-gray-300">
                              Reason: &ldquo;{card.data.reason}&rdquo;
                            </div>
                            <div className="text-[11px] font-mono text-gray-400">
                              Window: {new Date(card.data.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(card.data.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          {currentStatus?.success ? (
                            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                                <div>
                                  <div className="font-bold">
                                    Gate Pass #{currentStatus.result.requestNumber}
                                  </div>
                                  <div className="text-[11px] font-mono text-cyan-300">
                                    Offline PIN: <strong>{currentStatus.result.gatePass?.passPin}</strong>
                                  </div>
                                </div>
                              </div>
                              <Link
                                href="/student/gate-pass"
                                className="px-3 py-1.5 rounded-lg bg-cyan-800 hover:bg-cyan-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 transition"
                              >
                                View QR Pass <ArrowRight size={12} />
                              </Link>
                            </div>
                          ) : (
                            <div>
                              {currentStatus?.error && (
                                <div className="mb-2 p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                                  <AlertCircle size={14} className="shrink-0" />
                                  <span>{currentStatus.error}</span>
                                </div>
                              )}
                              <button
                                onClick={() => handleExecuteGatePass(cardKey, card.data)}
                                disabled={currentStatus?.loading}
                                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {currentStatus?.loading ? (
                                  <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    <span>Generating Pass...</span>
                                  </>
                                ) : (
                                  <>
                                    <Key size={14} />
                                    <span>Confirm &amp; Apply for Gate Pass</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 5. GUIDE: PROCEDURE (ASK)
                    if (card.cardType === 'GUIDE_PROCEDURE') {
                      const proc = card.data;
                      return (
                        <div
                          key={cardKey}
                          className="p-4 rounded-xl bg-[#141928] border border-[#2b354d] space-y-3 shadow-lg"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1e263a] text-[#d4af37] border border-[#d4af37]/30">
                              <HelpCircle size={12} />
                              <span>Verified Procedure • {proc.category}</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400">
                              SLA: {proc.turnaroundTime}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-white">
                              {proc.title}
                            </h3>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>Department: <strong className="text-gray-200">{proc.department}</strong></span>
                              <span>•</span>
                              <span>Location: {proc.location}</span>
                            </div>
                          </div>

                          {/* Required Documents */}
                          {proc.requiredDocuments && proc.requiredDocuments.length > 0 && (
                            <div className="bg-[#0f121e] p-3 rounded-lg border border-[#1f2638] text-xs">
                              <div className="font-semibold text-gray-200 text-[11px] mb-1.5 flex items-center gap-1.5">
                                <FileText size={12} className="text-violet-400" />
                                <span>Requirements &amp; Documents Needed:</span>
                              </div>
                              <ul className="space-y-1 text-gray-300 text-[11px]">
                                {proc.requiredDocuments.map((doc: string, dIdx: number) => (
                                  <li key={dIdx} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                                    <span>{doc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Steps */}
                          <div className="space-y-1.5 pt-1">
                            <div className="font-semibold text-gray-200 text-xs">
                              Official Procedure Steps:
                            </div>
                            <ol className="space-y-1.5 text-xs text-gray-300">
                              {proc.steps.map((st: string, sIdx: number) => (
                                <li key={sIdx} className="flex items-start gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-[#1e2538] text-[#d4af37] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {sIdx + 1}
                                  </span>
                                  <span className="flex-1">{st}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          {proc.notes && (
                            <div className="text-[11px] text-gray-400 italic pt-1.5 border-t border-[#202738] flex items-center gap-1.5">
                              <Info size={12} className="text-gray-500 shrink-0" />
                              <span>Note: {proc.notes}</span>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 6. STUDY PLAN (PLAN)
                    if (card.cardType === 'STUDY_PLAN') {
                      const planData = card.data;
                      return (
                        <div
                          key={cardKey}
                          className="p-4 rounded-xl bg-gradient-to-br from-[#141928] to-[#101422] border border-[#d4af37]/40 space-y-4 shadow-xl"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#212b40] pb-3">
                            <div>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1b2234] text-[#d4af37] border border-[#d4af37]/40 mb-1">
                                <BookOpen size={12} />
                                <span>BPUT Academic Roadmap</span>
                              </div>
                              <h3 className="text-sm sm:text-base font-extrabold text-white">
                                {planData.subject} ({planData.subjectCode})
                              </h3>
                            </div>

                            <div className="flex items-center gap-2.5 text-xs font-mono">
                              <span className="px-2.5 py-1 rounded-lg bg-[#1a2133] border border-[#29354e] text-white">
                                <strong className="text-[#d4af37]">{planData.days}</strong> Days
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-[#1a2133] border border-[#29354e] text-white">
                                <strong className="text-cyan-300">{planData.hoursPerDay}h</strong> / Day
                              </span>
                            </div>
                          </div>

                          {/* Day-by-Day Timeline */}
                          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                            {planData.plan.map((item: any) => {
                              const dayKey = `${cardKey}-day-${item.dayNumber}`;
                              const isExpanded =
                                expandedPlanDays[dayKey] ??
                                (item.dayNumber <= 2 || item.dayNumber >= planData.days - 1);

                              return (
                                <div
                                  key={item.dayNumber}
                                  className="rounded-xl bg-[#181f33] border border-[#26324d] overflow-hidden transition-all"
                                >
                                  <div
                                    onClick={() =>
                                      setExpandedPlanDays((prev) => ({
                                        ...prev,
                                        [dayKey]: !isExpanded,
                                      }))
                                    }
                                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#1d263d] transition select-none"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="w-7 h-7 rounded-lg bg-[#222c42] border border-[#303e5c] text-[#d4af37] text-xs font-mono font-bold flex items-center justify-center shrink-0">
                                        D{item.dayNumber}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-gray-100 truncate">
                                          {item.focusTitle}
                                        </div>
                                        <div className="text-[10px] font-mono text-gray-400 truncate">
                                          {item.phase}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span
                                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                                          item.taskType === 'PYQ_PRACTICE'
                                            ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                                            : item.taskType === 'REVISION'
                                            ? 'bg-purple-950 text-purple-300 border border-purple-700/60'
                                            : 'bg-blue-950 text-blue-300 border border-blue-700/60'
                                        }`}
                                      >
                                        {item.taskType}
                                      </span>
                                      {isExpanded ? (
                                        <ChevronUp size={14} className="text-gray-400" />
                                      ) : (
                                        <ChevronDown size={14} className="text-gray-400" />
                                      )}
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="px-3.5 pb-3 pt-1 border-t border-[#222c42] bg-[#141928] text-xs space-y-1.5 animate-message-in">
                                      <div className="text-[11px] font-semibold text-gray-300">
                                        Core Focus Topics:
                                      </div>
                                      <ul className="space-y-1">
                                        {item.topics.map((top: string, tIdx: number) => (
                                          <li key={tIdx} className="flex items-start gap-2 text-gray-300 text-xs">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-1.5 shrink-0" />
                                            <span>{top}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    // 7. RESOURCE LIST
                    if (card.cardType === 'RESOURCE_LIST') {
                      return (
                        <div
                          key={cardKey}
                          className="p-4 rounded-xl bg-gradient-to-br from-[#161b2b] to-[#121624] border border-cyan-500/40 space-y-3 shadow-lg"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-600/50">
                              <BookOpen size={12} />
                              <span>Verified Academic Materials</span>
                            </div>
                            <span className="text-[10px] font-mono text-cyan-400">
                              {card.data.length} Resources Found
                            </span>
                          </div>

                          <div className="divide-y divide-[#222c40]">
                            {card.data.map((resItem: any) => (
                              <div
                                key={resItem.id}
                                className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-white">
                                      {resItem.title}
                                    </span>
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#20293d] text-cyan-300 border border-[#2e3b57]">
                                      {resItem.type}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-gray-400">
                                    {resItem.description}
                                  </div>
                                  {resItem.keyTopics && (
                                    <div className="text-[10px] text-gray-500 font-mono">
                                      Key Topics: {resItem.keyTopics.slice(0, 3).join(' • ')}
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `Downloading certified resource: ${resItem.title}\\nSaved to downloads/ directory.`
                                    )
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-[#1f283d] hover:bg-[#283552] border border-[#2e3b57] text-[#d4af37] font-mono font-bold text-[10px] flex items-center gap-1 shrink-0 transition"
                                >
                                  <Download size={11} />
                                  <span>Download</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </div>

            {/* Quick Reply Suggestions Chips */}
            {msg.quickReplies && msg.quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 pl-2">
                {msg.quickReplies.map((qr, qrIdx) => (
                  <button
                    key={qrIdx}
                    onClick={() => handleSendMessage(qr)}
                    className="px-3 py-1 rounded-full bg-[#151a2a] hover:bg-[#1f263d] border border-[#252f48] hover:border-violet-500/50 text-gray-300 hover:text-white text-[11px] transition-all duration-150 active:scale-95 shadow-xs flex items-center gap-1"
                  >
                    <span>{qr}</span>
                    <ArrowRight size={10} className="text-violet-400 opacity-60" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Thinking / Processing State */}
        {loading && (
          <div className="flex items-start space-x-2 text-xs text-gray-400 animate-message-in">
            <div className="bg-[#121626] border border-[#232c44] rounded-2xl rounded-tl-xs p-4 flex items-center gap-3 shadow-xl">
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-violet-500 animate-ping absolute" />
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 relative" />
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles size={13} className="text-violet-400 animate-spin" />
                  <span>Nexora Copilot is thinking...</span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Analyzing campus workflows &amp; compiling verified answer
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. MODERN FLOATING INPUT AREA                                         */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-[#121626] via-[#151a2e] to-[#121626] border border-[#232c44] focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/20 rounded-2xl p-2 sm:p-2.5 shadow-2xl shrink-0 transition-all duration-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (e.g., 'Report room fan broken', 'Need bonafide for loan', 'DBMS exam in 10 days')..."
              disabled={loading}
              className="w-full bg-[#161b2e] border border-[#26314c] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/60 transition disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-violet-600/25 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          >
            <span>Ask</span>
            {loading ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Send size={13} className="transition-transform group-hover:translate-x-0.5" />
            )}
          </button>
        </form>

        {/* Small "Powered by Nexora Campus AI" Footer */}
        <div className="flex items-center justify-between px-2 pt-2 text-[10px] sm:text-[11px] font-mono text-gray-500 border-t border-white/5 mt-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} className="text-violet-400" />
            <span>Powered by Nexora Campus AI</span>
          </div>
          <span className="hidden sm:inline text-gray-600">
            Grounded in BPUT institutional rules &amp; live workflows
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <CornerDownLeft size={10} />
            <span>Enter to send</span>
          </span>
        </div>
      </div>
    </div>
  );
}
