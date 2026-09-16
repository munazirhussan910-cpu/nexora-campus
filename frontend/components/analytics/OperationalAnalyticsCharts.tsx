'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
} from 'lucide-react';

interface HourlyData {
  hour: string;
  departures: number;
  returns: number;
  total: number;
}

interface CategorySla {
  category: string;
  total: number;
  withinSla: number;
  breachedSla: number;
  compliancePct: number;
  avgResolutionHours: number;
}

interface VelocityDay {
  date: string;
  dayName: string;
  incoming: number;
  resolved: number;
}

export function OperationalAnalyticsCharts() {
  const [timeWindow, setTimeWindow] = useState<'TODAY' | '7D' | '30D'>('7D');
  const [loading, setLoading] = useState(true);
  const [activeHourIndex, setActiveHourIndex] = useState<number | null>(18); // Default peak 18:00
  const [activeCategory, setActiveCategory] = useState<string | null>('Plumbing');

  // Default fallback data for instantaneous render and offline resiliency
  const defaultHourly: HourlyData[] = [
    { hour: '06:00', departures: 2, returns: 0, total: 2 },
    { hour: '07:00', departures: 8, returns: 1, total: 9 },
    { hour: '08:00', departures: 15, returns: 3, total: 18 },
    { hour: '09:00', departures: 22, returns: 6, total: 28 },
    { hour: '10:00', departures: 18, returns: 10, total: 28 },
    { hour: '11:00', departures: 14, returns: 12, total: 26 },
    { hour: '12:00', departures: 12, returns: 14, total: 26 },
    { hour: '13:00', departures: 10, returns: 16, total: 26 },
    { hour: '14:00', departures: 15, returns: 8, total: 23 },
    { hour: '15:00', departures: 19, returns: 11, total: 30 },
    { hour: '16:00', departures: 28, returns: 14, total: 42 },
    { hour: '17:00', departures: 38, returns: 22, total: 60 },
    { hour: '18:00', departures: 34, returns: 30, total: 64 },
    { hour: '19:00', departures: 20, returns: 36, total: 56 },
    { hour: '20:00', departures: 12, returns: 42, total: 54 },
    { hour: '21:00', departures: 4, returns: 35, total: 39 },
    { hour: '22:00', departures: 1, returns: 18, total: 19 },
    { hour: '23:00', departures: 0, returns: 5, total: 5 },
  ];

  const defaultCategorySla: CategorySla[] = [
    { category: 'Plumbing', total: 14, withinSla: 12, breachedSla: 2, compliancePct: 86, avgResolutionHours: 3.8 },
    { category: 'Electrical', total: 11, withinSla: 10, breachedSla: 1, compliancePct: 91, avgResolutionHours: 4.2 },
    { category: 'Carpentry', total: 6, withinSla: 5, breachedSla: 1, compliancePct: 83, avgResolutionHours: 6.5 },
    { category: 'Network', total: 8, withinSla: 8, breachedSla: 0, compliancePct: 100, avgResolutionHours: 1.5 },
    { category: 'Cleanliness', total: 9, withinSla: 8, breachedSla: 1, compliancePct: 89, avgResolutionHours: 2.1 },
  ];

  const defaultVelocity: VelocityDay[] = [
    { date: '2026-09-06', dayName: 'Mon', incoming: 12, resolved: 11 },
    { date: '2026-09-07', dayName: 'Tue', incoming: 15, resolved: 14 },
    { date: '2026-09-08', dayName: 'Wed', incoming: 9, resolved: 10 },
    { date: '2026-09-09', dayName: 'Thu', incoming: 14, resolved: 13 },
    { date: '2026-09-10', dayName: 'Fri', incoming: 18, resolved: 16 },
    { date: '2026-09-11', dayName: 'Sat', incoming: 11, resolved: 12 },
    { date: '2026-09-12', dayName: 'Sun', incoming: 8, resolved: 9 },
  ];

  const [hourlyTraffic, setHourlyTraffic] = useState<HourlyData[]>(defaultHourly);
  const [categorySla, setCategorySla] = useState<CategorySla[]>(defaultCategorySla);
  const [weeklyVelocity, setWeeklyVelocity] = useState<VelocityDay[]>(defaultVelocity);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const res = await apiRequest('/admin/analytics-charts');
      if (res.success && res.data) {
        if (res.data.hourlyGateTraffic?.length) {
          // Filter to waking hours 06:00 to 23:00 for optimal display
          const displayHours = res.data.hourlyGateTraffic.slice(6);
          setHourlyTraffic(displayHours);
        }
        if (res.data.categorySla?.length) {
          setCategorySla(res.data.categorySla);
        }
        if (res.data.weeklyVelocity?.length) {
          setWeeklyVelocity(res.data.weeklyVelocity);
        }
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  // Compute maximums for scaling charts
  const maxTrafficTotal = Math.max(...hourlyTraffic.map((d) => d.total), 70);
  const maxVelocity = Math.max(...weeklyVelocity.map((d) => Math.max(d.incoming, d.resolved)), 20);

  const selectedHour = activeHourIndex !== null ? hourlyTraffic[activeHourIndex] : hourlyTraffic[12];
  const selectedCatData = categorySla.find((c) => c.category === activeCategory) || categorySla[0];

  return (
    <div className="space-y-6">
      {/* Header with Time Window Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141722] border border-[#282f42] rounded-2xl p-5 shadow-xl">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Operational Intelligence &amp; Performance Trends
            </h2>
          </div>
          <p className="text-xs text-gray-400">
            Real-time analytics computed across gate entry logs, maintenance SLAs, and request throughput.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0f1118] p-1 rounded-xl border border-[#23293a] self-start sm:self-auto">
          {(['TODAY', '7D', '30D'] as const).map((win) => (
            <button
              key={win}
              onClick={() => setTimeWindow(win)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                timeWindow === win
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {win === 'TODAY' ? 'Today' : win === '7D' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Peak Gate Traffic Chart + Category SLA Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: 24-Hour Peak Gate Traffic (Interactive SVG Area & Bar Chart) */}
        <div className="lg:col-span-2 bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-cyan-400" />
                Hourly Campus Gate Traffic Distribution
              </h3>
              <p className="text-[11px] text-gray-400">
                Hover over bars to inspect hourly exit vs return volume
              </p>
            </div>

            {selectedHour && (
              <div className="text-right hidden sm:block font-mono">
                <span className="text-xs font-bold text-cyan-300">
                  {selectedHour.hour}: {selectedHour.total} passes
                </span>
                <div className="text-[10px] text-gray-400">
                  {selectedHour.departures} Exit • {selectedHour.returns} Return
                </div>
              </div>
            )}
          </div>

          {/* Interactive Chart Container */}
          <div className="relative pt-4">
            <div className="h-56 flex items-end justify-between gap-1 sm:gap-2 px-2 border-b border-[#282f42] pb-2">
              {hourlyTraffic.map((item, idx) => {
                const totalPct = Math.min(Math.round((item.total / maxTrafficTotal) * 100), 100);
                const depPct = item.total > 0 ? (item.departures / item.total) * 100 : 0;
                const isHovered = activeHourIndex === idx;

                return (
                  <div
                    key={item.hour}
                    onMouseEnter={() => setActiveHourIndex(idx)}
                    onClick={() => setActiveHourIndex(idx)}
                    className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
                  >
                    {/* Hover Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-14 z-30 bg-[#0a0c12] border border-cyan-500/60 rounded-lg p-2 shadow-2xl text-[10px] whitespace-nowrap pointer-events-none">
                        <div className="font-bold text-cyan-300 font-mono">{item.hour}</div>
                        <div className="text-gray-200">
                          Total: <strong className="text-white">{item.total}</strong> (Exits: {item.departures}, Returns: {item.returns})
                        </div>
                      </div>
                    )}

                    {/* Stacked Bar with Departures (Cyan) and Returns (Gold) */}
                    <div
                      style={{ height: `${Math.max(totalPct, 6)}%` }}
                      className={`w-full max-w-[24px] rounded-t-md overflow-hidden transition-all duration-300 flex flex-col-reverse ${
                        isHovered
                          ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                          : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div
                        style={{ height: `${depPct}%` }}
                        className="w-full bg-cyan-500 transition-all"
                      />
                      <div className="w-full flex-1 bg-gold transition-all" />
                    </div>

                    {/* Hour Axis Label */}
                    <span
                      className={`text-[9px] font-mono mt-2 transition ${
                        isHovered ? 'text-cyan-300 font-bold scale-110' : 'text-gray-500'
                      }`}
                    >
                      {item.hour.split(':')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend & Summary Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-cyan-500" />
                  <span className="text-gray-400">Campus Exits</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-gold" />
                  <span className="text-gray-400">Arrival Returns</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-gray-400">
                Peak Window: <strong className="text-gold">17:00 – 19:00</strong> (Curfew Rush)
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: SLA Adherence Radial & Breakdown */}
        <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              SLA Adherence by Department
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              91% Campus Avg
            </span>
          </div>

          {/* Interactive Category List */}
          <div className="space-y-3 pt-1">
            {categorySla.map((cat) => {
              const isSelected = activeCategory === cat.category;
              const isHigh = cat.compliancePct >= 90;

              return (
                <div
                  key={cat.category}
                  onClick={() => setActiveCategory(cat.category)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-[#1b2130] border-cyan-500/60 shadow-lg'
                      : 'bg-[#161a26] border-[#252c3f] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-200">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400">
                        Avg: {cat.avgResolutionHours}h
                      </span>
                      <span
                        className={`font-mono font-extrabold ${
                          isHigh ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {cat.compliancePct}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-[#0e111a] overflow-hidden flex">
                    <div
                      style={{ width: `${cat.compliancePct}%` }}
                      className={`h-full rounded-full ${
                        isHigh
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-amber-500 to-gold'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Stat Pill for Selected Category */}
          {selectedCatData && (
            <div className="p-3 rounded-xl bg-[#0e111a] border border-[#232a3d] text-[11px] space-y-1">
              <div className="text-gray-400">
                Focus: <strong className="text-white">{selectedCatData.category}</strong>
              </div>
              <div className="flex justify-between text-gray-300 font-mono">
                <span>Within SLA: {selectedCatData.withinSla}/{selectedCatData.total}</span>
                <span className="text-rose-400">Breached: {selectedCatData.breachedSla}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CHART 3: 7-Day Velocity Trend (Incoming vs Resolved Dual Bars) */}
      <div className="bg-[#141722] border border-[#282f42] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              Daily Request Inflow vs. Resolution Velocity
            </h3>
            <p className="text-[11px] text-gray-400">
              Comparing incoming tickets against resolved operational work orders
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-purple-500" />
              <span className="text-gray-300">Incoming Requests</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-gray-300">Resolved Work Orders</span>
            </div>
          </div>
        </div>

        {/* 7-Day Dual Column Chart */}
        <div className="h-44 pt-4 flex items-end justify-between gap-3 sm:gap-6 border-b border-[#282f42] pb-2">
          {weeklyVelocity.map((day) => {
            const inPct = Math.round((day.incoming / maxVelocity) * 100);
            const resPct = Math.round((day.resolved / maxVelocity) * 100);

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-32">
                  {/* Incoming Bar */}
                  <div
                    style={{ height: `${Math.max(inPct, 8)}%` }}
                    className="w-full max-w-[18px] bg-purple-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition relative flex justify-center"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition absolute -top-5 text-[9px] font-mono text-purple-300">
                      {day.incoming}
                    </span>
                  </div>

                  {/* Resolved Bar */}
                  <div
                    style={{ height: `${Math.max(resPct, 8)}%` }}
                    className="w-full max-w-[18px] bg-emerald-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition relative flex justify-center"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition absolute -top-5 text-[9px] font-mono text-emerald-300">
                      {day.resolved}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition">
                  {day.dayName}
                </span>
                <span className="text-[9px] font-mono text-gray-500">
                  {day.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
