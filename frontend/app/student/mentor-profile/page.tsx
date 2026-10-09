'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  Check,
  HeartHandshake,
  Save,
  GraduationCap,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

type Profile = {
  headline?: string;
  bio?: string;
  linkedinUrl?: string;
  cgpa?: number | string;
  interests?: string;
  isAvailable: boolean;
};

export default function MentorProfilePage() {
  const [student, setStudent] = useState<any>(null);
  const [profile, setProfile] = useState<Profile>({ isAvailable: false });
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [me, incoming] = await Promise.all([
      apiRequest<any>('/mentors/me'),
      apiRequest<any[]>('/mentors/requests/incoming'),
    ]);

    if (me.success && me.data) {
      const s = me.data.student;
      setStudent(s);
      setProfile(me.data.profile || { isAvailable: false });
      setHasProfile(!!me.data.profile);

      // Robust year and semester extraction
      const rawYear = s?.year;
      let yr = 1;
      if (typeof rawYear === 'number') {
        yr = rawYear >= 5 && rawYear <= 8 ? Math.ceil(rawYear / 2) : rawYear;
      } else if (rawYear) {
        const digits = String(rawYear).replace(/\D/g, '');
        const parsed = parseInt(digits, 10);
        if (!isNaN(parsed)) {
          yr = parsed >= 5 && parsed <= 8 ? Math.ceil(parsed / 2) : parsed;
        }
      }

      // Check semester if available
      const sem = s?.semester ? Number(s.semester) : yr * 2;
      const semYear = Math.ceil(sem / 2);
      const effectiveYear = Math.max(yr, semYear);

      // Check backend isEligible flag and resolved year >= 2
      const eligible = me.data.isEligible !== undefined ? me.data.isEligible : effectiveYear >= 2;
      setIsEligible(eligible);
    }
    if (incoming.success && incoming.data) {
      setRequests(incoming.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    const res = await apiRequest('/mentors/me', {
      method: 'PUT',
      body: JSON.stringify({
        ...profile,
        cgpa:
          profile.cgpa === undefined || profile.cgpa === null || profile.cgpa === ''
            ? null
            : Number(profile.cgpa),
      }),
    });

    if (res.success) {
      setMessageType('success');
      setMessage(hasProfile ? 'Your mentor profile is updated.' : 'Your mentor profile has been created successfully!');
      setHasProfile(true);
      load();
    } else {
      setMessageType('error');
      setMessage(res.error?.message || 'Could not save your profile.');
    }
    setSubmitting(false);
  };

  const decide = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    const res = await apiRequest(`/mentors/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res.success) {
      setMessageType('success');
      setMessage(`Request ${status.toLowerCase()}.`);
      load();
    } else {
      setMessageType('error');
      setMessage(res.error?.message || 'Could not update request.');
    }
  };

  const update = (key: keyof Profile, value: any) => setProfile((old) => ({ ...old, [key]: value }));

  const currentYearNum = student?.year ? Number(student.year) : 1;
  const yearDisplay =
    currentYearNum === 1
      ? '1st Year'
      : currentYearNum === 2
      ? '2nd Year'
      : currentYearNum === 3
      ? '3rd Year'
      : currentYearNum === 4
      ? '4th Year'
      : `${currentYearNum}th Year`;

  const semesterDisplay = student?.semester
    ? `${student.semester}th Semester`
    : currentYearNum
    ? `${currentYearNum * 2}th Semester`
    : '4th Semester';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <header>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-700/60 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
          <Sparkles size={11} />
          <span>Student Community Mentorship</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">My Mentor Profile</h1>
        <p className="text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
          Create a clear profile so juniors can choose a senior guide thoughtfully. Your phone and personal email are never shared in the public directory.
        </p>
      </header>

      {message && (
        <div
          className={`rounded-xl p-3.5 text-xs flex items-center gap-2.5 animate-tab-fade ${
            messageType === 'success'
              ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950/40 border border-rose-800 text-rose-200'
          }`}
        >
          {messageType === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-[#293148] bg-[#121724] p-12 text-center text-sm text-gray-400 animate-pulse">
          Loading mentor profile eligibility...
        </div>
      ) : !isEligible ? (
        /* INELIGIBLE: 1st Year Students */
        <div className="rounded-2xl border border-[#293148] bg-[#121724] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <GraduationCap size={24} />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Mentor profiles are available from 2nd year onwards.
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
            As a 1st-year student, you are not yet eligible to become a campus mentor. However, you can browse verified seniors from 2nd, 3rd, and 4th years to request one-on-one guidance for academics, labs, and campus life.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/student/mentors"
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow transition active:scale-95 inline-flex items-center gap-1.5"
            >
              <Users size={14} />
              <span>Browse Seniors</span>
            </Link>
            <Link
              href="/student/mentors"
              className="px-4 py-2.5 rounded-xl bg-[#171c2b] hover:bg-[#202738] border border-[#2b354d] text-gray-300 hover:text-white font-semibold text-xs transition inline-flex items-center gap-1.5"
            >
              <span>Request Guidance</span>
            </Link>
          </div>
        </div>
      ) : (
        /* ELIGIBLE: 2nd Year, 3rd Year, 4th Year Students */
        <form onSubmit={save} className="rounded-2xl border border-[#293148] bg-[#121724] p-5 sm:p-7 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212739] pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-700/60 text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5">
                <span>{hasProfile ? 'ACTIVE MENTOR' : 'CREATE YOUR MENTOR PROFILE'}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {hasProfile ? 'Your Mentor Profile' : 'Create Your Mentor Profile'}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1 font-mono">
                <span>
                  Program: <strong className="text-white">B.Tech {student?.branch?.code || 'CSE'}</strong>
                </span>
                <span>•</span>
                <span>
                  Year: <strong className="text-[#d4af37] font-bold">{yearDisplay}</strong>
                </span>
                <span>•</span>
                <span>
                  Semester: <strong className="text-white">{semesterDisplay}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              <span className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                <HeartHandshake className="text-violet-300" size={17} />
                Available to guide
              </span>
              <button
                type="button"
                onClick={() => update('isAvailable', !profile.isAvailable)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  profile.isAvailable
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                {profile.isAvailable ? 'Available' : 'Unavailable'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1 text-xs">
              Headline / Skills <span className="text-violet-400">*</span>
            </label>
            <input
              value={profile.headline || ''}
              onChange={(e) => update('headline', e.target.value)}
              placeholder="Example: CSE 2nd-year student · placement prep, DSA & competitive programming"
              maxLength={120}
              className="w-full rounded-xl border border-[#34405c] bg-[#0c101b] p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1 text-xs">
              Bio (Introduction &amp; how you can help junior students)
            </label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => update('bio', e.target.value)}
              placeholder="A short introduction and specific ways you can help juniors navigate subjects, labs, or campus life..."
              maxLength={600}
              className="w-full min-h-24 rounded-xl border border-[#34405c] bg-[#0c101b] p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-gray-300 font-semibold mb-1 text-xs">
                LinkedIn Profile URL (Optional)
              </label>
              <input
                value={profile.linkedinUrl || ''}
                onChange={(e) => update('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full rounded-xl border border-[#34405c] bg-[#0c101b] p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1 text-xs">
                Current CGPA (0–10)
              </label>
              <input
                value={profile.cgpa ?? ''}
                onChange={(e) => update('cgpa', e.target.value)}
                placeholder="e.g. 8.45"
                inputMode="decimal"
                className="w-full rounded-xl border border-[#34405c] bg-[#0c101b] p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1 text-xs">
              Subjects you can help with / Interests / Preferred guidance topics
            </label>
            <input
              value={profile.interests || ''}
              onChange={(e) => update('interests', e.target.value)}
              placeholder="Topics, comma separated: DSA, Operating Systems, Web Tech, Hackathons, Hostel Life"
              maxLength={300}
              className="w-full rounded-xl border border-[#34405c] bg-[#0c101b] p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-bold text-white inline-flex gap-2 items-center shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <Save size={15} />
              <span>{submitting ? 'Saving...' : hasProfile ? 'Save Changes' : 'Create Mentor Profile'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Incoming Guidance Requests for Eligible Students */}
      {isEligible && (
        <section className="rounded-2xl border border-[#293148] bg-[#121724] p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#212739] pb-3">
            <h2 className="font-bold text-white text-base">Incoming Guidance Requests ({requests.length})</h2>
          </div>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                No mentorship requests from juniors yet. Make sure your availability toggle is set to Available!
              </p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="rounded-xl border border-[#2b354d] bg-[#161a29] p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white text-sm">
                      {request.requester.fullName}{' '}
                      <span className="text-xs font-mono text-gray-400">
                        · Year {request.requester.year} {request.requester.branch.code}
                      </span>
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        request.status === 'ACCEPTED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                          : request.status === 'DECLINED'
                          ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <p className="text-gray-300 leading-relaxed">{request.message}</p>

                  {request.status === 'PENDING' ? (
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => decide(request.id, 'ACCEPTED')}
                        className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-lg font-semibold transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => decide(request.id, 'DECLINED')}
                        className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3.5 py-1.5 rounded-lg font-semibold transition"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <p className="pt-1 text-gray-400 inline-flex items-center gap-1 font-mono text-[11px]">
                      <Check size={12} className="text-emerald-400" />
                      Status: {request.status}
                      {request.response && ` — "${request.response}"`}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
