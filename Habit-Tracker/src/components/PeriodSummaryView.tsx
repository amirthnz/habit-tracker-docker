import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Ticket,
  Calendar,
  Sparkles,
  Flame,
  CheckCircle2,
  TrendingUp,
  Award,
  Clock,
} from 'lucide-react';
import {
  Habit,
  calculatePeriodSummary,
  getDaysInMonth,
  calculateMonthlyProgress,
} from '../utils/habitLogic';
import { HabitIcon } from './HabitIcon';
import { triggerMilestoneCelebration } from '../utils/particleEffects';
import { apiFetch } from '../api';

interface PeriodSummaryViewProps {
  habits: Habit[];
  todayDateStr: string;
  onOpenNewHabit: () => void;
}

export const PeriodSummaryView: React.FC<PeriodSummaryViewProps> = ({
  habits,
  todayDateStr,
  onOpenNewHabit,
}) => {
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const [y, m] = todayDateStr.split('-').map(Number);
    return { year: y, month: m };
  });

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);

  const { year, month } = currentYearMonth;
  const summary = calculatePeriodSummary(habits, year, month, todayDateStr);

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
  });

  const handlePrevMonth = () => {
    setCurrentYearMonth((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
    setAiInsight(null);
    setSelectedCalendarDay(null);
  };

  const handleNextMonth = () => {
    setCurrentYearMonth((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
    setAiInsight(null);
    setSelectedCalendarDay(null);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;

  // Pre-calculate daily completion counts for calendar heatmap
  const dailyStats: Record<number, { count: number; habits: string[] }> = {};
  for (let day = 1; day <= daysInMonth; day++) {
    const dayKey = `${monthPrefix}${String(day).padStart(2, '0')}`;
    const completedHabits: string[] = [];
    habits.forEach((h) => {
      if (h.history[dayKey]) {
        completedHabits.push(h.title);
      }
    });
    dailyStats[day] = {
      count: completedHabits.length,
      habits: completedHabits,
    };
  }

  // Request AI period coaching insight
  const fetchCoachingInsight = async () => {
    setIsLoadingInsight(true);
    triggerMilestoneCelebration();
    try {
      const res = await apiFetch('/api/period-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      });
      const data = await res.json();
      setAiInsight(data.insight || 'Great progress this month! Keep focusing on your core habits.');
    } catch {
      setAiInsight('Outstanding consistency! You logged steady daily check-ins across multiple goals.');
    } finally {
      setIsLoadingInsight(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Period Analytics
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-0.5">
            {monthName} {year} Progress Summary
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual review of consistency, completion ratios, and monthly targets.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-bold text-white min-w-[120px] text-center tabular-nums">
            {monthName} {year}
          </div>
          <button
            onClick={handleNextMonth}
            aria-label="Next month"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall Rate */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Overall Success</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tabular-nums">
              {summary.overallRate}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Of planned monthly targets
            </div>
          </div>
        </div>

        {/* Card 2: Total Completions */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Repetitions Done</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tabular-nums">
              {summary.totalCompletions}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Out of {summary.totalTargetGoal} target days
            </div>
          </div>
        </div>

        {/* Card 3: Goals Met */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Goals Achieved</span>
            <Ticket className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tabular-nums">
              {summary.goalsAchievedCount}{' '}
              <span className="text-base text-slate-400 font-normal">
                / {summary.totalHabits}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {summary.goalsAchievedCount === summary.totalHabits && summary.totalHabits > 0
                ? 'All goals unlocked!'
                : `${summary.totalHabits - summary.goalsAchievedCount} in progress`}
            </div>
          </div>
        </div>

        {/* Card 4: Top Active Streak */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Peak Momentum</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tabular-nums flex items-baseline gap-1">
              {summary.bestStreakHabit?.streak ?? 0}
              <span className="text-sm font-semibold text-slate-400">days</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 truncate">
              {summary.bestStreakHabit?.title ?? 'Start today'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Monthly Heatmap Grid */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Monthly Activity Calendar
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily habit completion density across {monthName}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Less</span>
            <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700 inline-block" />
            <span className="w-3.5 h-3.5 rounded bg-indigo-900/60 inline-block" />
            <span className="w-3.5 h-3.5 rounded bg-indigo-600/80 inline-block" />
            <span className="w-3.5 h-3.5 rounded bg-indigo-500 inline-block" />
            <span>More</span>
          </div>
        </div>

        {/* 7-column or multi-column day grid */}
        <div className="grid grid-cols-7 sm:grid-cols-7 md:grid-cols-7 gap-2">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const stat = dailyStats[day];
            const maxHabits = habits.length || 1;
            const ratio = stat.count / maxHabits;

            let bgClass = 'bg-slate-800/60 text-slate-400 border border-slate-800';
            if (stat.count > 0) {
              if (ratio >= 0.75) {
                bgClass = 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 font-bold';
              } else if (ratio >= 0.4) {
                bgClass = 'bg-indigo-600/70 text-indigo-100 font-semibold';
              } else {
                bgClass = 'bg-indigo-950/80 text-indigo-300 border border-indigo-900/50';
              }
            }

            const isSelected = selectedCalendarDay === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedCalendarDay(isSelected ? null : day)}
                className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center p-1 transition-all ${bgClass} ${
                  isSelected ? 'ring-2 ring-white scale-105' : 'hover:scale-[1.03]'
                }`}
              >
                <span className="text-xs tabular-nums">{day}</span>
                {stat.count > 0 && (
                  <span className="text-[10px] opacity-80 tabular-nums">
                    {stat.count} ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day details popup */}
        {selectedCalendarDay !== null && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-300">
                {monthName} {selectedCalendarDay}, {year} Details
              </span>
              <span className="text-xs text-slate-400 tabular-nums">
                {dailyStats[selectedCalendarDay].count} habits completed
              </span>
            </div>
            {dailyStats[selectedCalendarDay].habits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dailyStats[selectedCalendarDay].habits.map((name, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded-lg bg-indigo-950 text-indigo-200 border border-indigo-800/60"
                  >
                    ✓ {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No habits checked for this day.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Individual Habit Goal Breakdowns */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          Habit Monthly Goal Targets & Progress
        </h3>

        {summary.habitBreakdowns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400 mb-3">No habits tracked yet.</p>
            <button
              onClick={onOpenNewHabit}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500"
            >
              Add Your First Habit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {summary.habitBreakdowns.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${item.color}20`,
                      color: item.color,
                    }}
                  >
                    <HabitIcon name={item.icon} className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {item.currentStreak} day streak
                    </span>
                  </div>
                </div>

                {/* Progress bar and metrics */}
                <div className="flex-1 max-w-md">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">
                      Goal: <strong className="text-slate-200">{item.goal} days</strong>
                    </span>
                    <span className="font-bold tabular-nums text-white">
                      {item.completions} / {item.goal} days ({item.percent}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-700/60 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, item.percent)}%`,
                        backgroundColor: item.goalAchieved ? '#10b981' : item.color,
                      }}
                    />
                  </div>
                </div>

                {/* Status indicator */}
                <div className="shrink-0 text-right">
                  {item.goalAchieved ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <Ticket className="w-3.5 h-3.5" />
                      Goal Met!
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 tabular-nums">
                      {Math.max(0, item.goal - item.completions)} days remaining
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Period Coach Review */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-800/40 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                AI Period Coaching & Motivation
              </h3>
              <p className="text-xs text-slate-400">
                Actionable feedback synthesized from your consistency patterns.
              </p>
            </div>
          </div>

          <button
            onClick={fetchCoachingInsight}
            disabled={isLoadingInsight}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoadingInsight ? 'Analyzing Period...' : 'Generate Period Insights'}</span>
          </button>
        </div>

        {aiInsight && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-800/50 text-sm text-indigo-100 leading-relaxed animate-fadeIn">
            "{aiInsight}"
          </div>
        )}
      </div>
    </div>
  );
};
