'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { BookOpen, Check, ExternalLink, GraduationCap, Send, Users, Sparkles, X, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

type Mentor = {
  id: string;
  fullName: string;
  rollNumber: string;
  year: number;
  branch: string;
  profile: { headline?: string; bio?: string; linkedinUrl?: string; cgpa?: number; interests?: string };
};

export default function StudentMentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Mentor | null>(null);
  const [message, setMessage] = useState('Hi! I would appreciate guidance on academics, campus opportunities, and career prep.');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  const loadMentors = async () => {
    setLoading(true);
    const res = await apiRequest<Mentor[]>('/mentors');
    setMentors(res.success && res.data ? res.data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadMentors();
  }, []);

  const requestGuidance = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setSending(true);
    const res = await apiRequest('/mentors/requests', {
      method: 'POST',
      body: JSON.stringify({ mentorId: selected.id, message }),
    });
    setSending(false);
    if (res.success) {
      setNotice(`Your guidance request has been sent to ${selected.fullName}. They can accept it from their mentor desk.`);
      setSelected(null);
    } else {
      setNotice(res.error?.message || 'Could not send the request.');
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-tab-fade">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#5B20A0]/40 bg-gradient-to-br from-[#1b152d] via-[#151929] to-[#0f121d] p-5 sm:p-7 shadow-xl shadow-black/25">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-[#5B20A0]/25 border border-[#7A3DB8]/40 text-[#18C5D8] shrink-0 shadow-md">
            <Users size={24} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1e2538] border border-[#18C5D8]/40 text-[#18C5D8] text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5">
              <Sparkles size={11} />
              <span>PEER MENTORSHIP NETWORK</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Senior Guides &amp; Mentors
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Connect with senior students (Year 2+) for advice on core subjects, hackathons, interview prep, and navigating campus life.
            </p>
          </div>
        </div>
      </section>

      {notice && (
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-4 py-3 text-xs sm:text-sm text-cyan-200 flex items-center justify-between gap-3 shadow-md animate-tab-fade">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice('')}
            className="text-cyan-400 hover:text-white text-xs font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-xs text-slate-400 py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#18C5D8] border-t-transparent animate-spin mx-auto" />
          <p>Discovering available senior guides...</p>
        </div>
      ) : mentors.length === 0 ? (
        <EmptyState
          title="No senior mentors currently listed"
          description="Senior students have not yet published public mentorship profiles. Check back soon or visit your own Mentor Profile if you are eligible."
          icon={GraduationCap}
          actionText="My Mentor Profile"
          actionHref="/student/mentor-profile"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((mentor) => (
            <article
              key={mentor.id}
              className="rounded-2xl bg-[#121624] border border-[#232b3f] hover:border-[#7A3DB8]/60 p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-black/20 group"
            >
              <div className="space-y-3">
                {/* Header: Avatar, Name, CGPA */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#5B20A0]/30 to-[#18C5D8]/20 border border-[#7A3DB8]/50 text-[#18C5D8] font-bold font-mono text-sm flex items-center justify-center shrink-0 shadow-sm group-hover:border-[#18C5D8] transition">
                      {getInitials(mentor.fullName)}
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-sm group-hover:text-[#18C5D8] transition">
                        {mentor.fullName}
                      </h2>
                      <p className="text-[11px] font-mono text-purple-300 mt-0.5">
                        Year {mentor.year} • {mentor.branch}
                      </p>
                    </div>
                  </div>

                  {mentor.profile.cgpa != null && (
                    <span className="text-[10px] font-mono font-bold rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 shrink-0">
                      CGPA {mentor.profile.cgpa.toFixed(2)}
                    </span>
                  )}
                </div>

                {mentor.profile.headline && (
                  <p className="text-xs font-medium text-slate-200 line-clamp-2">
                    {mentor.profile.headline}
                  </p>
                )}

                {mentor.profile.bio && (
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                    {mentor.profile.bio}
                  </p>
                )}

                {mentor.profile.interests && (
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {mentor.profile.interests.split(',').map((item) => (
                      <span
                        key={item}
                        className="text-[10px] bg-[#1a2133] text-slate-300 border border-[#273248] px-2.5 py-0.5 rounded-full"
                      >
                        {item.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer: LinkedIn & Request CTA */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1f2638] mt-2">
                {mentor.profile.linkedinUrl ? (
                  <a
                    href={mentor.profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-semibold"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={() => setSelected(mentor)}
                  className="rounded-xl bg-[#5B20A0] hover:bg-[#6c28be] text-white text-xs font-semibold px-3.5 py-2 inline-flex items-center gap-1.5 shadow-md shadow-[#5B20A0]/25 transition active:scale-95"
                >
                  <Send size={12} className="text-[#18C5D8]" />
                  <span>Ask for guidance</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Guidance Request Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/75 backdrop-blur-xs animate-tab-fade">
          <form
            onSubmit={requestGuidance}
            className="w-full max-w-lg rounded-2xl bg-[#121624] border border-[#2e3952] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#21273a] pb-3">
              <div>
                <p className="text-[10px] text-[#18C5D8] font-mono font-bold tracking-wider uppercase">
                  PEER GUIDANCE REQUEST
                </p>
                <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                  Connect with {selected.fullName}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Year {selected.year} • {selected.branch}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg bg-[#181e30] text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">
                What would you like advice or guidance on?
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                minLength={10}
                maxLength={600}
                rows={4}
                className="w-full rounded-xl border border-[#2e3952] focus:border-[#18C5D8] bg-[#0d101a] p-3 text-xs text-white outline-none transition"
                placeholder="Briefly describe what you're working on or what you'd like to ask..."
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Your contact info is only shared once accepted.</span>
                <span>{message.length} / 600</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-[#21273a]">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-xl bg-[#161a29] border border-[#242b3e] text-xs text-slate-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || message.trim().length < 10}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5B20A0] hover:bg-[#6c28be] text-white text-xs font-bold shadow-md shadow-[#5B20A0]/25 transition active:scale-95 disabled:opacity-50"
              >
                {sending && <Loader2 size={13} className="animate-spin" />}
                <span>{sending ? 'Sending...' : 'Send Request'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
