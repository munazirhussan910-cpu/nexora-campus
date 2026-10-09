'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import {
  UtensilsCrossed,
  Coffee,
  SunMedium,
  Moon,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building,
  Clock,
  Sparkles,
  Info,
  CalendarDays,
  FileText,
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

interface MealEntry {
  id?: string;
  day: DayOfWeek;
  meal: MealType;
  items: string;
  timings?: string | null;
  specialNotes?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

interface HostelBlockOption {
  id: string;
  name: string;
  gender: string;
  wardenName?: string | null;
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
  color: string;
  bgLight: string;
  borderClass: string;
}[] = [
  {
    key: 'BREAKFAST',
    label: 'Breakfast',
    icon: Coffee,
    defaultTiming: '07:30 AM – 09:30 AM',
    color: 'text-amber-400',
    bgLight: 'bg-amber-950/20',
    borderClass: 'border-amber-500/30',
  },
  {
    key: 'LUNCH',
    label: 'Lunch',
    icon: SunMedium,
    defaultTiming: '12:30 PM – 02:30 PM',
    color: 'text-orange-400',
    bgLight: 'bg-orange-950/20',
    borderClass: 'border-orange-500/30',
  },
  {
    key: 'DINNER',
    label: 'Dinner',
    icon: Moon,
    defaultTiming: '07:30 PM – 09:30 PM',
    color: 'text-indigo-400',
    bgLight: 'bg-indigo-950/20',
    borderClass: 'border-indigo-500/30',
  },
];

export default function WardenMessMenuPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [currentBlock, setCurrentBlock] = useState<HostelBlockOption | null>(null);
  const [availableBlocks, setAvailableBlocks] = useState<HostelBlockOption[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');
  const [todayDay, setTodayDay] = useState<string>('');
  const [weeklySchedule, setWeeklySchedule] = useState<
    Record<DayOfWeek, Record<MealType, MealEntry>>
  >({} as any);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'all'>('day');

  const fetchMenu = async (blockId?: string) => {
    try {
      setLoading(true);
      const url = blockId ? `/mess-menu?hostelBlockId=${blockId}` : '/mess-menu';
      const res = await apiRequest<{
        hostelBlock: HostelBlockOption;
        availableBlocks: HostelBlockOption[];
        today: string;
        todayMenu: Record<MealType, MealEntry>;
        weekly: Record<DayOfWeek, Record<MealType, MealEntry>>;
        canEdit: boolean;
        lastUpdated: string | null;
        lastUpdatedBy: string | null;
      }>(url);

      if (res.success && res.data) {
        const menuData = res.data;
        setCurrentBlock(menuData.hostelBlock);
        setSelectedBlockId(menuData.hostelBlock?.id || '');
        setAvailableBlocks(menuData.availableBlocks || []);
        setTodayDay(menuData.today);
        if (!blockId && menuData.today && DAYS_OF_WEEK.some((d) => d.key === menuData.today)) {
          setSelectedDay(menuData.today as DayOfWeek);
        }
        setWeeklySchedule(menuData.weekly);
        setLastUpdated(menuData.lastUpdated);
        setLastUpdatedBy(menuData.lastUpdatedBy);
        setHasUnsavedChanges(false);
        setFeedback(null);
      } else {
        setFeedback({
          type: 'error',
          message: res.error?.message || 'Failed to load hostel mess menu.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Network communication failure loading mess menu.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleBlockChange = (newBlockId: string) => {
    setSelectedBlockId(newBlockId);
    fetchMenu(newBlockId);
  };

  const handleMealChange = (
    day: DayOfWeek,
    meal: MealType,
    field: 'items' | 'timings' | 'specialNotes',
    value: string
  ) => {
    setWeeklySchedule((prev) => {
      const dayData = prev[day] || ({} as Record<MealType, MealEntry>);
      const currentEntry = dayData[meal] || {
        day,
        meal,
        items: '',
        timings: MEALS_CONFIG.find((m) => m.key === meal)?.defaultTiming || '',
        specialNotes: '',
      };

      return {
        ...prev,
        [day]: {
          ...dayData,
          [meal]: {
            ...currentEntry,
            [field]: value,
          },
        },
      };
    });
    setHasUnsavedChanges(true);
    setFeedback(null);
  };

  // Save the currently active day (all 3 meals)
  const handleSaveActiveDay = async () => {
    if (!currentBlock) return;
    setSaving(true);
    setFeedback(null);

    const dayMeals = weeklySchedule[selectedDay];
    const updates = MEALS_CONFIG.map((m) => {
      const entry = dayMeals?.[m.key];
      return {
        day: selectedDay,
        meal: m.key,
        items: entry?.items?.trim() || 'Menu items not specified',
        timings: entry?.timings || m.defaultTiming,
        specialNotes: entry?.specialNotes || '',
      };
    });

    try {
      const res = await apiRequest('/mess-menu', {
        method: 'PUT',
        body: JSON.stringify({
          hostelBlockId: currentBlock.id,
          updates,
        }),
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Saved menu for ${selectedDay} (${currentBlock.name}). Updates are immediately live in the Student Portal.`,
        });
        setHasUnsavedChanges(false);
        fetchMenu(currentBlock.id);
      } else {
        setFeedback({
          type: 'error',
          message: res.error?.message || 'Failed to update menu.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Network error while updating hostel mess menu.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Save full week schedule across all 7 days
  const handleSaveAll = async () => {
    if (!currentBlock) return;
    setSaving(true);
    setFeedback(null);

    const allUpdates: any[] = [];
    for (const d of DAYS_OF_WEEK) {
      for (const m of MEALS_CONFIG) {
        const entry = weeklySchedule[d.key]?.[m.key];
        allUpdates.push({
          day: d.key,
          meal: m.key,
          items: entry?.items?.trim() || 'Standard mess menu items',
          timings: entry?.timings || m.defaultTiming,
          specialNotes: entry?.specialNotes || '',
        });
      }
    }

    try {
      const res = await apiRequest('/mess-menu', {
        method: 'PUT',
        body: JSON.stringify({
          hostelBlockId: currentBlock.id,
          updates: allUpdates,
        }),
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Full weekly menu for ${currentBlock.name} saved successfully! Live in Student Portal.`,
        });
        setHasUnsavedChanges(false);
        fetchMenu(currentBlock.id);
      } else {
        setFeedback({
          type: 'error',
          message: res.error?.message || 'Failed to save weekly menu.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Network error while saving weekly hostel menu.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#21273a] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4af37] font-semibold">
              Hostel Warden Operations
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <UtensilsCrossed size={24} className="text-[#d4af37]" />
            Hostel Mess Menu Management
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Create, update, and publish the weekly dining schedule (Breakfast, Lunch, Dinner)
            for hostel students.
          </p>
        </div>

        {/* Hostel Block Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {availableBlocks.length > 1 && (
            <div className="flex items-center gap-2 bg-[#121624] border border-[#263147] rounded-xl px-3 py-1.5">
              <Building size={14} className="text-[#d4af37] shrink-0" />
              <span className="text-xs text-gray-400 font-medium">Block:</span>
              <select
                value={selectedBlockId}
                onChange={(e) => handleBlockChange(e.target.value)}
                className="bg-transparent text-xs text-white font-bold focus:outline-hidden cursor-pointer"
              >
                {availableBlocks.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#101422] text-white">
                    {b.name} ({b.gender})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchMenu(selectedBlockId)}
            disabled={loading || saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141824] border border-[#273043] hover:border-[#d4af37]/60 text-xs font-semibold text-gray-300 hover:text-white transition active:scale-95 disabled:opacity-50"
            title="Reload from database"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#d4af37]' : ''} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#c29f2f] text-black font-extrabold text-xs shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            <Save size={14} className={saving ? 'animate-spin' : ''} />
            <span>{saving ? 'Publishing...' : 'Publish Weekly Menu'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] font-mono underline hover:text-white transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Block Information & Status Card */}
      <div className="bg-[#141824] border border-[#232a3d] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1b2235] border border-[#2b3650] flex items-center justify-center text-[#d4af37] shrink-0">
            <Building size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base">
                {currentBlock?.name || 'Hostel Mess'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1e273a] text-gray-300 border border-[#2d3a54]">
                {currentBlock?.gender} RESIDENTS
              </span>
              {hasUnsavedChanges && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300 animate-pulse">
                  Unsaved Edits
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Supervising Warden: <span className="text-gray-200">{currentBlock?.wardenName || 'Warden Desk'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
          {lastUpdated && (
            <div className="text-right">
              <div className="text-[10px] text-gray-500 uppercase">Last Published</div>
              <div className="text-gray-300">
                {new Date(lastUpdated).toLocaleDateString()} at{' '}
                {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {lastUpdatedBy && <div className="text-[10px] text-[#d4af37]">By {lastUpdatedBy}</div>}
            </div>
          )}
        </div>
      </div>

      {/* View Mode & Day Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101422] border border-[#202738] p-2 rounded-2xl">
        {/* Day Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {DAYS_OF_WEEK.map((d) => {
            const isSelected = selectedDay === d.key;
            const isToday = todayDay === d.key;

            return (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  setSelectedDay(d.key);
                  setViewMode('day');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                  isSelected && viewMode === 'day'
                    ? 'bg-[#d4af37] text-black shadow-md'
                    : 'bg-[#141824] text-gray-300 hover:text-white hover:bg-[#1a2133] border border-[#20283a]'
                }`}
              >
                <span>{d.label}</span>
                {isToday && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-full font-mono font-black ${
                      isSelected && viewMode === 'day'
                        ? 'bg-black text-[#d4af37]'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    TODAY
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Full Week Toggle */}
        <div className="flex items-center gap-1 shrink-0 pl-1 border-t sm:border-t-0 sm:border-l border-[#202738] pt-2 sm:pt-0">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'day' ? 'all' : 'day')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95 ${
              viewMode === 'all'
                ? 'bg-[#1e273a] text-white border border-[#374563]'
                : 'bg-[#141824] text-gray-400 hover:text-white border border-[#20283a]'
            }`}
          >
            <CalendarDays size={14} className="text-[#d4af37]" />
            <span>{viewMode === 'all' ? 'Focus Day View' : 'Show All 7 Days'}</span>
          </button>
        </div>
      </div>

      {/* Main Form Content */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-500">
          <RefreshCw size={20} className="animate-spin text-[#d4af37] mx-auto mb-2" />
          Loading hostel mess menu data...
        </div>
      ) : viewMode === 'day' ? (
        /* SINGLE DAY FOCUS VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#121624] border border-[#222a3d] px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase text-[#d4af37]">
                Editing Menu For:
              </span>
              <span className="font-extrabold text-white text-sm">
                {DAYS_OF_WEEK.find((d) => d.key === selectedDay)?.label}
              </span>
              {todayDay === selectedDay && (
                <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                  Active Today
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSaveActiveDay}
              disabled={saving}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-xs shadow transition active:scale-95 disabled:opacity-50"
            >
              <Save size={13} />
              <span>Save {DAYS_OF_WEEK.find((d) => d.key === selectedDay)?.short}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MEALS_CONFIG.map((m) => {
              const Icon = m.icon;
              const entry = weeklySchedule[selectedDay]?.[m.key] || {
                day: selectedDay,
                meal: m.key,
                items: '',
                timings: m.defaultTiming,
                specialNotes: '',
              };

              return (
                <div
                  key={m.key}
                  className={`bg-[#141824] border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition hover:border-[#384563] ${m.borderClass}`}
                >
                  <div className="space-y-3">
                    {/* Meal Header */}
                    <div className="flex items-center justify-between border-b border-[#212739] pb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.bgLight} ${m.color}`}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">{m.label}</h3>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                            <Clock size={10} />
                            <span>{entry.timings || m.defaultTiming}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#182030] text-gray-400 border border-[#252f44] font-semibold">
                        Meal {m.key === 'BREAKFAST' ? '1' : m.key === 'LUNCH' ? '2' : '3'}
                      </span>
                    </div>

                    {/* Meal Items Textarea */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-gray-400 font-semibold mb-1">
                        Menu Items (Comma Separated)
                      </label>
                      <textarea
                        rows={4}
                        value={entry.items}
                        onChange={(e) =>
                          handleMealChange(selectedDay, m.key, 'items', e.target.value)
                        }
                        placeholder={`e.g. ${
                          m.key === 'BREAKFAST'
                            ? 'Masala Dosa, Sambar, Coconut Chutney, Tea / Coffee'
                            : m.key === 'LUNCH'
                            ? 'Basmati Rice, Dal Tadka, Seasonal Sabzi, Papad, Salad, Curd'
                            : 'Chapati, Paneer Butter Masala, Jeera Rice, Dal Fry, Gulab Jamun'
                        }`}
                        className="w-full bg-[#0d101a] border border-[#232b3d] focus:border-[#d4af37] rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-hidden transition resize-none leading-relaxed"
                      />
                    </div>

                    {/* Service Timing */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-gray-400 font-semibold mb-1">
                        Service Hours
                      </label>
                      <input
                        type="text"
                        value={entry.timings || m.defaultTiming}
                        onChange={(e) =>
                          handleMealChange(selectedDay, m.key, 'timings', e.target.value)
                        }
                        placeholder={m.defaultTiming}
                        className="w-full bg-[#0d101a] border border-[#232b3d] focus:border-[#d4af37] rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-gray-600 focus:outline-hidden transition"
                      />
                    </div>

                    {/* Special Diet / Notes */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-gray-400 font-semibold mb-1">
                        Special Diet / Dietary Notes
                      </label>
                      <input
                        type="text"
                        value={entry.specialNotes || ''}
                        onChange={(e) =>
                          handleMealChange(selectedDay, m.key, 'specialNotes', e.target.value)
                        }
                        placeholder="e.g. Boiled eggs / Banana / Special sweet"
                        className="w-full bg-[#0d101a] border border-[#232b3d] focus:border-[#d4af37] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-hidden transition"
                      />
                    </div>
                  </div>

                  {entry.updatedAt && (
                    <div className="pt-3 mt-3 border-t border-[#1c2233] text-[10px] text-gray-500 font-mono flex items-center justify-between">
                      <span>Saved</span>
                      <span>
                        {new Date(entry.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ALL 7 DAYS COMPREHENSIVE SPREAD */
        <div className="space-y-6">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d.key}
              className="bg-[#141824] border border-[#232a3d] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#212739] pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base">{d.label}</h3>
                  {todayDay === d.key && (
                    <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                      Today
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-gray-400">
                  Monday to Sunday Cycle
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {MEALS_CONFIG.map((m) => {
                  const entry = weeklySchedule[d.key]?.[m.key] || {
                    day: d.key,
                    meal: m.key,
                    items: '',
                    timings: m.defaultTiming,
                    specialNotes: '',
                  };

                  return (
                    <div
                      key={m.key}
                      className="bg-[#0f121d] border border-[#1e2538] rounded-xl p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${m.color}`}>{m.label}</span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {entry.timings || m.defaultTiming}
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={entry.items}
                        onChange={(e) =>
                          handleMealChange(d.key, m.key, 'items', e.target.value)
                        }
                        placeholder="Enter meal items..."
                        className="w-full bg-[#0a0d16] border border-[#20273a] focus:border-[#d4af37] rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-hidden transition resize-none"
                      />
                      <input
                        type="text"
                        value={entry.specialNotes || ''}
                        onChange={(e) =>
                          handleMealChange(d.key, m.key, 'specialNotes', e.target.value)
                        }
                        placeholder="Optional dietary notes / sweet"
                        className="w-full bg-[#0a0d16] border border-[#20273a] focus:border-[#d4af37] rounded-lg px-2 py-1 text-[11px] text-gray-300 placeholder-gray-600 focus:outline-hidden"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Bottom Save Bar */}
          <div className="p-4 rounded-2xl bg-[#121624] border border-[#252f44] flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Finished reviewing the weekly schedule?
            </span>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#c29f2f] text-black font-extrabold text-xs shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <Save size={14} className={saving ? 'animate-spin' : ''} />
              <span>{saving ? 'Publishing Schedule...' : 'Publish Entire Week'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Guidelines & Institutional Notice */}
      <div className="p-4 rounded-xl bg-[#101420] border border-[#21283a] text-gray-400 text-xs flex items-center gap-3">
        <Info size={20} className="text-[#d4af37] shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-gray-200">Hostel Mess Menu Governance:</strong> Wardens are
          authorized to manage meal preparations and dietary allocations. Changes published here
          are instantly broadcast to the Student Cockpit for all resident boarders. Food safety,
          cleanliness standards, and timely meal service must be inspected daily by hostel management.
        </div>
      </div>
    </div>
  );
}
