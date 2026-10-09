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
  ChevronDown,
  ChevronUp,
  RefreshCw,
  RotateCcw,
  Zap,
  CornerDownLeft,
  User,
  ExternalLink,
} from 'lucide-react';

interface CopilotCard {
  cardType:
    | 'ACTION_MAINTENANCE'
    | 'ACTION_BONAFIDE'
    | 'ACTION_LEAVE'
    | 'ACTION_GATE_PASS'
    | 'GUIDE_PROCEDURE'
    | 'STUDY_PLAN'
    | 'RESOURCE_LIST'
    | 'REQUEST_LIST'
    | 'DEADLINE_LIST';
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
  isError?: boolean;
}

interface SuggestedPrompt {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  category: string;
  prompt: string;
  description: string;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: 'attendance',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    category: 'Attendance',
    prompt: 'Show my attendance status',
    description: 'Check overall percentage, subject breakdown, and 75% cutoff calculation',
  },
  {
    id: 'classes',
    icon: Clock,
    iconColor: 'text-cyan-500',
    category: 'Routine',
    prompt: 'What classes do I have today?',
    description: 'Inspect period schedule, lecture hall locations, and faculty roster',
  },
  {
    id: 'gatepass',
    icon: Key,
    iconColor: 'text-amber-500',
    category: 'Security',
    prompt: 'How do I apply for a gate pass?',
    description: 'Generate campus exit authorization with dynamic QR code & offline PIN',
  },
  {
    id: 'maintenance',
    icon: Wrench,
    iconColor: 'text-rose-500',
    category: 'Hostel',
    prompt: 'Help me report a maintenance issue',
    description: 'Route broken fixtures (fan, tap, light) to specialist staff',
  },
  {
    id: 'deadlines',
    icon: Calendar,
    iconColor: 'text-purple-500',
    category: 'Deadlines',
    prompt: 'What academic deadlines are coming up?',
    description: 'Review semester registrations, fee dates, and project submissions',
  },
  {
    id: 'studyplan',
    icon: BookOpen,
    iconColor: 'text-indigo-500',
    category: 'Exams',
    prompt: 'Generate a 10-day DBMS study plan',
    description: 'Create an interactive daily roadmap tailored to syllabus topics',
  },
];

/**
 * Enhanced Markdown text renderer for structured AI output
 */
function FormattedMessageText({ text }: { text: string }) {
  if (!text) return null;

  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-2.5 text-xs sm:text-sm text-foreground leading-relaxed font-sans">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');

        const isBulletList = lines.every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
        const isNumberedList = lines.every((l) => /^\d+\.\s/.test(l.trim()));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-1.5 my-2 pl-1">
              {lines.map((line, lIdx) => {
                const content = line.replace(/^[-*]\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
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
                    <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/25 text-primary text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {num}
                    </span>
                    <span className="flex-1">{renderInlineMarkdown(content)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="text-sm sm:text-base font-bold text-foreground pt-2 pb-1 flex items-center gap-1.5">
                    <span className="w-1 h-3.5 bg-primary rounded-full" />
                    {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
                  </h4>
                );
              }

              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={lIdx} className="text-base font-extrabold text-foreground pt-2.5 pb-1 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-primary rounded-full" />
                    {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
                  </h3>
                );
              }

              if (trimmed.startsWith('> ')) {
                return (
                  <blockquote
                    key={lIdx}
                    className="border-l-2 border-primary/60 pl-3 py-1 my-1 text-xs text-muted-foreground italic bg-primary/5 rounded-r-lg"
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

function renderInlineMarkdown(str: string): React.ReactNode {
  const tokens = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return tokens.map((tok, i) => {
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded-md bg-surface-secondary border border-border font-mono text-[11px] sm:text-xs text-primary font-semibold mx-0.5"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return (
        <strong key={i} className="text-foreground font-semibold">
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
            isError: true,
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
          isError: true,
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

  // Workflow Action Handlers
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
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto space-y-3">
      {/* 1. MINIMAL CONVERSATION HEADER */}
      <header className="bg-surface border border-border rounded-2xl p-3 sm:p-3.5 shadow-xs shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                Nexora Copilot
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Online</span>
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Connected to campus records &amp; operational workflows
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="text-xs font-medium text-foreground hover:text-primary px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-surface-hover border border-border transition-all flex items-center gap-1.5 active:scale-95 shadow-xs shrink-0"
          title="Start new conversation"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </header>

      {/* 2. MAIN CHAT / VIEWPORT */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scroll-smooth min-h-0">
        {/* Empty State / Suggested Prompts */}
        {messages.length === 0 && (
          <div className="space-y-4 py-2 sm:py-6 animate-message-in">
            <div className="rounded-3xl bg-surface border border-border p-6 sm:p-8 shadow-xs text-center max-w-2xl mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center shadow-xs">
                <Sparkles size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                How can I help you today, {studentFirstName}?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Ask any campus question, check attendance margins, look up class routines, or draft tickets for maintenance and gate passes.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Zap size={12} className="text-primary" />
                  <span>Suggested Prompts</span>
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">Click to ask</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTED_PROMPTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="p-3.5 rounded-2xl bg-surface hover:bg-surface-secondary border border-border hover:border-primary/50 text-left transition-all duration-150 active:scale-[0.99] flex flex-col justify-between shadow-xs group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="w-7 h-7 rounded-lg bg-surface-secondary flex items-center justify-center text-primary shrink-0">
                            <Icon size={14} className={item.iconColor} />
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          &ldquo;{item.prompt}&rdquo;
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            } space-y-1.5 animate-message-in`}
          >
            <div
              className={`max-w-3xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed transition-all shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-xs ml-8 sm:ml-12 font-medium'
                  : msg.isError
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 rounded-tl-xs mr-8 sm:mr-12'
                  : 'bg-surface border border-border text-foreground rounded-tl-xs mr-8 sm:mr-12'
              }`}
            >
              {/* Header Info */}
              <div className={`flex items-center justify-between gap-4 mb-2 pb-1.5 border-b text-[11px] font-mono ${
                msg.sender === 'user' ? 'border-primary-foreground/20 text-primary-foreground/80' : 'border-border text-muted-foreground'
              }`}>
                <span className="font-bold flex items-center gap-1.5">
                  {msg.sender === 'user' ? (
                    <>
                      <User size={12} />
                      <span>{user?.fullName || user?.username || 'You'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="text-primary" />
                      <span className="text-primary font-bold">Nexora Copilot</span>
                    </>
                  )}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Formatted Markdown */}
              {msg.sender === 'user' ? (
                <div className="text-primary-foreground text-xs sm:text-sm">{msg.text}</div>
              ) : (
                <FormattedMessageText text={msg.text} />
              )}

              {/* Retry button for errors */}
              {msg.isError && (
                <div className="mt-3 pt-2 border-t border-rose-500/20 flex justify-end">
                  <button
                    onClick={() => {
                      const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
                      if (lastUserMsg) handleSendMessage(lastUserMsg.text);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
                  >
                    <RotateCcw size={12} />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {/* Structured Action Cards */}
              {msg.cards && msg.cards.length > 0 && (
                <div className="mt-4 space-y-3 pt-3 border-t border-border">
                  {msg.cards.map((card, cIdx) => {
                    const cardKey = `${msg.id}-card-${cIdx}`;
                    const currentStatus = actionStatus[cardKey];

                    // 1. ACTION: MAINTENANCE
                    if (card.cardType === 'ACTION_MAINTENANCE') {
                      return (
                        <div
                          key={cardKey}
                          className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2.5 text-xs text-foreground"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <Wrench size={11} />
                              <span>{card.data.category} Maintenance Ticket</span>
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface border border-border text-foreground font-semibold">
                              {card.data.priority}
                            </span>
                          </div>

                          <div className="font-bold text-sm text-foreground">{card.data.title}</div>
                          <div className="text-xs text-muted-foreground">{card.data.description}</div>
                          <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                            <MapPin size={11} className="text-primary" />
                            <span>Location: <strong className="text-foreground">{card.data.location}</strong></span>
                          </div>

                          {currentStatus?.success ? (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <div>
                                  <div className="font-bold">Ticket Logged: {currentStatus.result.requestNumber}</div>
                                  <div className="text-[10px] opacity-80">Assigned: {currentStatus.result.routing?.assignedTo || 'Technician Queue'}</div>
                                </div>
                              </div>
                              <Link
                                href={`/student/requests/${currentStatus.result.id}`}
                                className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 shrink-0"
                              >
                                View &rarr;
                              </Link>
                            </div>
                          ) : (
                            <div>
                              {currentStatus?.error && (
                                <div className="mb-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                                  <AlertCircle size={13} />
                                  <span>{currentStatus.error}</span>
                                </div>
                              )}
                              <button
                                onClick={() => handleExecuteMaintenance(cardKey, card.data)}
                                disabled={currentStatus?.loading}
                                className="w-full py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                {currentStatus?.loading ? <RefreshCw size={13} className="animate-spin" /> : <Wrench size={13} />}
                                <span>Confirm &amp; Dispatch Ticket</span>
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
                          className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2.5 text-xs text-foreground"
                        >
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <FileCheck size={11} />
                            <span>Bonafide Certificate Request</span>
                          </div>
                          <div className="font-bold text-sm text-foreground">
                            Purpose: {card.data.purpose || 'Scholarship'}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            Digital PDF with institutional seal &amp; public QR registry
                          </div>

                          {currentStatus?.success ? (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <div>
                                  <div className="font-bold">Request Logged: {currentStatus.result.requestNumber}</div>
                                  <div className="text-[10px] opacity-80">Desk: Academic Records Office</div>
                                </div>
                              </div>
                              <Link
                                href={`/student/requests/${currentStatus.result.id}`}
                                className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                              >
                                View &rarr;
                              </Link>
                            </div>
                          ) : (
                            <div>
                              {currentStatus?.error && (
                                <div className="mb-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                                  <AlertCircle size={13} />
                                  <span>{currentStatus.error}</span>
                                </div>
                              )}
                              <button
                                onClick={() => handleExecuteBonafide(cardKey, card.data)}
                                disabled={currentStatus?.loading}
                                className="w-full py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                {currentStatus?.loading ? <RefreshCw size={13} className="animate-spin" /> : <FileCheck size={13} />}
                                <span>Submit Bonafide Request</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 3. ACTION: LEAVE
                    if (card.cardType === 'ACTION_LEAVE') {
                      return (
                        <div
                          key={cardKey}
                          className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2.5 text-xs text-foreground"
                        >
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            <Calendar size={11} />
                            <span>Hostel Outstation Leave</span>
                          </div>
                          <div className="font-bold text-sm text-foreground">
                            {new Date(card.data.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} –{' '}
                            {new Date(card.data.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-muted-foreground">Reason: {card.data.reason}</div>

                          {currentStatus?.success ? (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-3">
                              <span className="font-bold">Leave Submitted to Warden</span>
                              <Link href="/student/leave" className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]">
                                Track &rarr;
                              </Link>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleExecuteLeave(cardKey, card.data)}
                              disabled={currentStatus?.loading}
                              className="w-full py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              {currentStatus?.loading ? <RefreshCw size={13} className="animate-spin" /> : <Calendar size={13} />}
                              <span>Submit Leave Application</span>
                            </button>
                          )}
                        </div>
                      );
                    }

                    // 4. ACTION: GATE PASS
                    if (card.cardType === 'ACTION_GATE_PASS') {
                      return (
                        <div
                          key={cardKey}
                          className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2.5 text-xs text-foreground"
                        >
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                            <Key size={11} />
                            <span>Campus Exit Gate Pass</span>
                          </div>
                          <div className="font-bold text-sm text-foreground">Destination: {card.data.destination}</div>
                          <div className="text-xs text-muted-foreground">Reason: {card.data.reason}</div>

                          {currentStatus?.success ? (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-3">
                              <span className="font-bold">Pass Generated &bull; PIN: {currentStatus.result.passPin}</span>
                              <Link href="/student/gate-pass" className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]">
                                View Pass &rarr;
                              </Link>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleExecuteGatePass(cardKey, card.data)}
                              disabled={currentStatus?.loading}
                              className="w-full py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              {currentStatus?.loading ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />}
                              <span>Generate Gate Pass</span>
                            </button>
                          )}
                        </div>
                      );
                    }

                    // 5. STUDY PLAN
                    if (card.cardType === 'STUDY_PLAN') {
                      const days = card.data.days || [];
                      return (
                        <div key={cardKey} className="p-4 rounded-xl bg-surface-secondary border border-border space-y-3 text-xs">
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            <BookOpen size={15} className="text-primary" />
                            <span>{card.title || 'Personalized Study Plan'}</span>
                          </div>
                          <div className="space-y-2">
                            {days.map((dayItem: any, dIdx: number) => {
                              const dayKey = `${cardKey}-day-${dIdx}`;
                              const isExpanded = expandedPlanDays[dayKey] ?? (dIdx === 0);
                              return (
                                <div key={dayKey} className="rounded-lg bg-surface border border-border overflow-hidden">
                                  <button
                                    onClick={() => setExpandedPlanDays((prev) => ({ ...prev, [dayKey]: !isExpanded }))}
                                    className="w-full p-2.5 text-left flex items-center justify-between hover:bg-surface-secondary/50 transition"
                                  >
                                    <span className="font-bold text-foreground">Day {dayItem.day}: {dayItem.topic}</span>
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>
                                  {isExpanded && (
                                    <div className="p-2.5 pt-0 text-muted-foreground text-[11px] border-t border-border mt-1">
                                      {dayItem.tasks}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    // Default Fallback Card
                    return (
                      <div key={cardKey} className="p-3.5 rounded-xl bg-surface-secondary border border-border text-xs">
                        <div className="font-bold text-foreground">{card.title}</div>
                        <div className="text-muted-foreground mt-1">{JSON.stringify(card.data)}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Replies */}
              {msg.quickReplies && msg.quickReplies.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-border flex flex-wrap gap-1.5">
                  {msg.quickReplies.map((reply, rIdx) => (
                    <button
                      key={rIdx}
                      onClick={() => handleSendMessage(reply)}
                      className="px-2.5 py-1 rounded-full bg-surface-secondary hover:bg-surface-hover border border-border text-foreground text-[11px] font-medium transition active:scale-95"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-surface border border-border text-xs text-muted-foreground max-w-sm mr-auto animate-message-in">
            <RefreshCw size={14} className="animate-spin text-primary" />
            <span>Nexora Copilot is compiling verified response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. PROFESSIONAL COMPOSER INPUT */}
      <div className="bg-surface border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 rounded-2xl p-2 sm:p-2.5 shadow-xs shrink-0 transition-all duration-150">
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
              placeholder="Ask Copilot anything (e.g. 'Show my attendance', 'How to apply for gate pass')..."
              disabled={loading}
              className="w-full bg-surface-secondary/60 hover:bg-surface-secondary border border-border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
            aria-label="Send message"
          >
            <span>Ask</span>
            {loading ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
          </button>
        </form>

        <div className="flex items-center justify-between px-2 pt-2 text-[10px] sm:text-[11px] font-mono text-muted-foreground border-t border-border mt-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} className="text-primary" />
            <span>Nexora Campus AI</span>
          </div>
          <span className="hidden sm:inline">
            Grounded in BPUT institutional rules &amp; live workflows
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft size={10} />
            <span>Enter to send</span>
          </span>
        </div>
      </div>
    </div>
  );
}
