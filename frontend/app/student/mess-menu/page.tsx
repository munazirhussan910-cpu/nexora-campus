'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  UtensilsCrossed,
  Coffee,
  SunMedium,
  Moon,
  Clock,
  Building,
  RefreshCw,
  Sparkles,
  CalendarDays,
  ShieldCheck,
  AlertCircle,
  Home,
  CheckCircle2,
  Info,
  LucideIcon,
} from 'lucide-react';

type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

interface MealDetail {
  id?: string;
  day: DayOfWeek;
  meal: MealType;
  items: string;
  timings?: string | null;
  specialNotes?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

interface MessMenuResponse {
  student?: {
    fullName: string;
    rollNumber: string;
    hostelBlock: string;
    roomNumber: string;
  };
  hostelBlock: {
    id: string;
    name: string;
    gender: string;
    wardenName?: string | null;
  };
  today: DayOfWeek;
  todayMenu: Record<MealType, MealDetail | null>;
  weekly: Record<DayOfWeek, Record<MealType, MealDetail | null>>;
  canEdit: boolean;
  lastUpdated: string | null;
  lastUpdatedBy: string | null;
}

const DAYS_OF_WEEK: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'MONDAY', label: 'Monday', short: 'Mon' },
  { key: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { key: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { key: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { key: 'FRIDAY', label: 'Friday', short: 'Fri' },
  { key: 'SATURDAY', label: 'Saturday', short: 'Sat' },
  { key: 'SUNDAY', label: 'Sunday', short: 'Sun' },
];

const MEALS_CONFIG: {
  key: MealType;
  label: string;
  icon: LucideIcon;
  defaultTiming: string;
  badgeColor: string;
  borderColor: string;
  bgLight: string;
  textColor: string;
}[] = [
  {
    key: 'BREAKFAST',
    label: 'Breakfast',
    icon: Coffee,
    defaultTiming: '07:30 AM – 09:30 AM',
    badgeColor: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
    borderColor: 'border-amber-500/30',
    bgLight: 'bg-amber-950/20',
    textColor: 'text-amber-400',
  },
  {
    key: 'LUNCH',
    label: 'Lunch',
    icon: SunMedium,
    defaultTiming: '12:30 PM – 02:30 PM',
    badgeColor: 'bg-orange-950/70 border-orange-500/40 text-orange-300',
    borderColor: 'border-orange-500/30',
    bgLight: 'bg-orange-950/20',
    textColor: 'text-orange-400',
  },
  {
    key: 'DINNER',
    label: 'Dinner',
    icon: Moon,
    defaultTiming: '07:30 PM – 09:30 PM',
    badgeColor: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300',
    borderColor: 'border-indigo-500/30',
    bgLight: 'bg-indigo-950/20',
    textColor: 'text-indigo-400',
  },
];

export default function StudentMessMenuPage() {
  const { user } = useAuth();
  const [data, setData] = useState<MessMenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotHostelResident, setIsNotHostelResident] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState<DayOfWeek>('MONDAY');
  const [viewMode, setViewMode] = useState<'today' | 'weekly' | 'all'>('today');

  const fetchMenu = async () => {
    try {
      const res = await apiRequest<MessMenuResponse>('/student/mess-menu');
      if (res.success && res.data) {
        const menuData = res.data;
        setData(menuData);
        setError(null);
        setIsNotHostelResident(false);
        if (menuData.today && DAYS_OF_WEEK.some((d) => d.key === menuData.today)) {
          setSelectedDayTab(menuData.today);
        }
      } else {
        if (
          res.error?.code === 'HOSTEL_RESIDENT_REQUIRED' ||
          res.error?.message?.toLowerCase().includes('hostel')
        ) {
          setIsNotHostelResident(true);
        } else {
          setError(res.error?.message || 'Unable to load hostel mess menu.');
        }
      }
    } catch {
      setError('Network communication failure while loading mess menu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMenu();
  };

  // Determine current active meal period based on current hour
  const getCurrentActiveMeal = (): MealType => {
    const hour = new Date().getHours();
    if (hour < 11) return 'BREAKFAST';
    if (hour < 16) return 'LUNCH';
    return 'DINNER';
  };

  const activeMealNow = getCurrentActiveMeal();

  // If student is definitely not a hostel resident according to user profile or API
  const isDayScholar =
    isNotHostelResident ||
    (!loading &&
      user?.role === 'STUDENT' &&
      !user?.hostelBlock &&
      !user?.roomNumber &&
      !data);

  if (isDayScholar) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-8">
        <div className="bg-[#141824] border border-[#273043] rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <Building size={32} />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300 inline-block mb-3">
            HOSTEL RESIDENTS ONLY
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Hostel Mess Menu Access Restricted
          </h1>
          <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed mb-6">
            The Hostel Mess Menu is exclusively accessible to enrolled resident students
            occupying campus hostel rooms. Your account is currently categorized as a Day Scholar.
          </p>
          <div className="p-4 rounded-xl bg-[#0f121d] border border-[#1e2538] text-xs text-gray-400 max-w-md mx-auto text-left flex items-start gap-3 mb-6">
            <Info size={18} className="text-[#d4af37] shrink-0 mt-0.5" />
            <span>
              If you have recently moved into a campus hostel, please ensure your hostel block and
              room number are officially registered by your Hostel Warden.
            </span>
          </div>
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#c29f2f] text-black font-extrabold text-xs shadow-lg transition active:scale-95"
          >
            <Home size={14} />
            <span>Return to Student Cockpit</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-[#181d2a] rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-[#181d2a] rounded-lg animate-pulse" />
        </div>
        <div className="h-44 bg-[#141824] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-64 bg-[#141824] rounded-2xl animate-pulse" />
          <div className="h-64 bg-[#141824] rounded-2xl animate-pulse" />
          <div className="h-64 bg-[#141824] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const today = data?.today || 'MONDAY';
  const hostelBlock = data?.hostelBlock;
  const todayMenu = data?.todayMenu;
  const weekly = data?.weekly;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#21273a] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4af37] font-semibold">
              Hostel Dining Services
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <UtensilsCrossed size={24} className="text-[#d4af37]" />
            Hostel Mess Menu
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {hostelBlock?.name || user?.hostelBlock || 'Hostel'} Resident Dining Schedule •
            Room {data?.student?.roomNumber || user?.roomNumber || 'Resident Room'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141824] border border-[#273043] hover:border-[#d4af37]/60 text-xs font-semibold text-gray-300 hover:text-white transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#d4af37]' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync Menu'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Hostel Block & Supervising Authority Hero Banner */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#192133] border border-[#27324d] flex items-center justify-center text-[#d4af37] shrink-0">
            <Building size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-white">
                {hostelBlock?.name || user?.hostelBlock || 'Hostel Dining Hall'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1b2234] text-[#d4af37] border border-[#d4af37]/30">
                ACTIVE CYCLE
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Supervising Warden:{' '}
              <strong className="text-gray-200">
                {hostelBlock?.wardenName || 'Chief Warden Desk'}
              </strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
          {data?.lastUpdated && (
            <div className="md:text-right">
              <div className="text-[10px] text-gray-500 uppercase">Verified Schedule</div>
              <div className="text-gray-300">
                Updated {new Date(data.lastUpdated).toLocaleDateString()}
              </div>
              {data.lastUpdatedBy && (
                <div className="text-[10px] text-[#d4af37]">By {data.lastUpdatedBy}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs (Today's Menu vs Full Weekly Schedule vs Day-by-Day) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101422] border border-[#202738] p-2 rounded-2xl">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('today')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
              viewMode === 'today'
                ? 'bg-[#d4af37] text-black shadow-md'
                : 'bg-[#141824] text-gray-300 hover:text-white border border-[#20283a]'
            }`}
          >
            <Sparkles size={14} className={viewMode === 'today' ? 'text-black' : 'text-[#d4af37]'} />
            <span>Today&apos;s Menu</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-extrabold ${
                viewMode === 'today' ? 'bg-black text-[#d4af37]' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {today}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
              viewMode === 'weekly'
                ? 'bg-[#d4af37] text-black shadow-md'
                : 'bg-[#141824] text-gray-300 hover:text-white border border-[#20283a]'
            }`}
          >
            <CalendarDays size={14} className={viewMode === 'weekly' ? 'text-black' : 'text-[#d4af37]'} />
            <span>Weekly Schedule</span>
          </button>
        </div>

        {/* Quick Day Selector for Detailed Day Inspection */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {DAYS_OF_WEEK.map((d) => {
            const isSelected = selectedDayTab === d.key;
            const isToday = today === d.key;

            return (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  setSelectedDayTab(d.key);
                  setViewMode('weekly');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                  isSelected && viewMode === 'weekly'
                    ? 'bg-[#1e2638] text-white border border-[#3e4f73]'
                    : 'bg-[#141824] text-gray-400 hover:text-white border border-[#20283a]'
                }`}
              >
                <span>{d.short}</span>
                {isToday && <span className="ml-1 text-[#d4af37] font-black">•</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: TODAY'S MENU (PROMINENT HIGHLIGHT) */}
      {viewMode === 'today' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#121624] border border-[#222a3d] px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-white text-sm">
                Today&apos;s Meals ({DAYS_OF_WEEK.find((d) => d.key === today)?.label})
              </span>
              <span className="text-[11px] font-mono text-gray-400">
                • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 bg-[#171d2b] px-2.5 py-1 rounded-md border border-[#242e44]">
              Active Now:{' '}
              <strong className="text-[#d4af37]">{activeMealNow}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MEALS_CONFIG.map((m) => {
              const Icon = m.icon;
              const mealData = todayMenu ? todayMenu[m.key] : null;
              const isCurrentMeal = activeMealNow === m.key;

              return (
                <div
                  key={m.key}
                  className={`bg-[#141824] border rounded-2xl p-5 shadow-xl flex flex-col justify-between transition relative overflow-hidden ${
                    isCurrentMeal
                      ? 'border-[#d4af37] ring-1 ring-[#d4af37]/40 shadow-[0_0_20px_rgba(212,175,55,0.12)]'
                      : m.borderColor
                  }`}
                >
                  {isCurrentMeal && (
                    <div className="absolute top-0 right-0 bg-[#d4af37] text-black font-extrabold font-mono text-[9px] px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                      CURRENT MEAL
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3 border-b border-[#212739] pb-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${m.bgLight} ${m.textColor}`}
                      >
                        <Icon size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base">{m.label}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mt-0.5">
                          <Clock size={12} className="text-[#d4af37]" />
                          <span>{mealData?.timings || m.defaultTiming}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meal Items List */}
                    <div>
                      <div className="text-[10px] font-mono uppercase text-gray-500 font-bold tracking-wider mb-2">
                        Menu Preparations
                      </div>
                      <div className="space-y-1.5">
                        {mealData?.items ? (
                          mealData.items.split(',').map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-xs text-gray-200 leading-snug"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-1.5 shrink-0" />
                              <span className="font-medium">{item.trim()}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-500 italic py-2">
                            Menu details being updated by the hostel warden.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dietary / Special Notes */}
                    {mealData?.specialNotes && (
                      <div className="p-3 rounded-xl bg-[#0e121c] border border-[#20283a] text-xs text-gray-300 flex items-start gap-2">
                        <Sparkles size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#d4af37] font-bold block mb-0.5">
                            Dietary Note / Add-on
                          </span>
                          <span className="text-gray-300 text-[11px] leading-tight">
                            {mealData.specialNotes}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#1c2233] flex items-center justify-between text-[11px] text-gray-400">
                    <span className="font-mono text-[10px] text-gray-500">
                      Hostel Kitchen Confirmed
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                      <CheckCircle2 size={11} /> Prepared Daily
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: COMPLETE WEEKLY SCHEDULE */}
      {viewMode === 'weekly' && (
        <div className="space-y-6">
          {/* Day Header */}
          <div className="flex items-center justify-between bg-[#121624] border border-[#222a3d] px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase text-[#d4af37]">
                Viewing Day:
              </span>
              <span className="font-extrabold text-white text-sm">
                {DAYS_OF_WEEK.find((d) => d.key === selectedDayTab)?.label}
              </span>
              {today === selectedDayTab && (
                <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                  Today
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className="text-xs text-[#d4af37] hover:underline font-mono"
            >
              Expand All 7 Days →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MEALS_CONFIG.map((m) => {
              const Icon = m.icon;
              const dayMeals = weekly ? weekly[selectedDayTab] : null;
              const mealData = dayMeals ? dayMeals[m.key] : null;

              return (
                <div
                  key={m.key}
                  className={`bg-[#141824] border ${m.borderColor} rounded-2xl p-5 shadow-xl flex flex-col justify-between`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-[#212739] pb-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.bgLight} ${m.textColor}`}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{m.label}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mt-0.5">
                          <Clock size={11} className="text-[#d4af37]" />
                          <span>{mealData?.timings || m.defaultTiming}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono uppercase text-gray-500 font-bold tracking-wider mb-2">
                        Menu Items
                      </div>
                      <div className="space-y-1.5">
                        {mealData?.items ? (
                          mealData.items.split(',').map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-xs text-gray-200 leading-snug"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-1.5 shrink-0" />
                              <span className="font-medium">{item.trim()}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-500 italic py-2">
                            Standard dining preparations.
                          </div>
                        )}
                      </div>
                    </div>

                    {mealData?.specialNotes && (
                      <div className="p-3 rounded-xl bg-[#0e121c] border border-[#20283a] text-xs text-gray-300 flex items-start gap-2">
                        <Sparkles size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                        <div className="text-[11px] leading-tight">
                          <span className="text-[10px] font-mono uppercase text-[#d4af37] font-bold block mb-0.5">
                            Special Note
                          </span>
                          {mealData.specialNotes}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#1c2233] text-[10px] font-mono text-gray-500">
                    Day Schedule • {selectedDayTab}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: ALL 7 DAYS FULL WEEK VIEW */}
      {viewMode === 'all' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-[#121624] border border-[#222a3d] px-4 py-3 rounded-xl">
            <span className="font-extrabold text-white text-sm">
              Complete Weekly Mess Schedule (Monday – Sunday)
            </span>
            <button
              type="button"
              onClick={() => setViewMode('today')}
              className="text-xs text-[#d4af37] hover:underline font-mono"
            >
              Back to Today&apos;s Menu
            </button>
          </div>

          <div className="space-y-4">
            {DAYS_OF_WEEK.map((d) => {
              const isToday = today === d.key;
              const dayMeals = weekly ? weekly[d.key] : null;

              return (
                <div
                  key={d.key}
                  className={`bg-[#141824] border rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 ${
                    isToday ? 'border-[#d4af37] ring-1 ring-[#d4af37]/30' : 'border-[#232a3d]'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#212739] pb-2.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-base">{d.label}</h3>
                      {isToday && (
                        <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-gray-400">
                      3 Meals (Breakfast, Lunch, Dinner)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {MEALS_CONFIG.map((m) => {
                      const mealData = dayMeals ? dayMeals[m.key] : null;

                      return (
                        <div
                          key={m.key}
                          className="bg-[#0f121d] border border-[#1e2538] rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between border-b border-[#1b2233] pb-1.5 mb-2">
                              <span className={`text-xs font-bold ${m.textColor}`}>{m.label}</span>
                              <span className="text-[10px] font-mono text-gray-400">
                                {mealData?.timings || m.defaultTiming}
                              </span>
                            </div>
                            <div className="text-xs text-gray-200 leading-relaxed font-medium">
                              {mealData?.items || 'Standard preparation'}
                            </div>
                          </div>

                          {mealData?.specialNotes && (
                            <div className="text-[10px] text-[#d4af37] font-mono bg-[#141824] px-2 py-1 rounded border border-[#20273a] mt-2">
                              ✦ {mealData.specialNotes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Institutional Food Quality & Grievance Notice */}
      <div className="p-4 rounded-xl bg-[#101420] border border-[#21283a] text-gray-400 text-xs flex items-center gap-3">
        <ShieldCheck size={20} className="text-[#d4af37] shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-gray-200">Hostel Dining Standards:</strong> The mess menu is
          supervised and updated by your hostel warden in coordination with the student mess committee.
          Meals are prepared adhering to university hygiene and nutritional requirements. For special
          dietary requests or mess feedback, please contact the hostel warden office.
        </div>
      </div>
    </div>
  );
}
