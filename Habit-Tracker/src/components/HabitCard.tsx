/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  Check,
  Flame,
  MoreVertical,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  Habit,
  QualityLevel,
  getHabitDayQuality,
  calculateStreak,
  calculateMonthlyProgress,
  offsetDateKey,
} from '../utils/habitLogic';
import { HabitIcon } from './HabitIcon';
import {
  triggerCompletionBurst,
  triggerGoalAchievedFanfare,
} from '../utils/particleEffects';
import { soundManager } from '../utils/soundEffects';

interface HabitCardProps {
  habit: Habit;
  selectedDate: string; // 'YYYY-MM-DD'
  todayDateStr: string;
  onSetQuality: (habitId: string, dateStr: string, quality: QualityLevel) => void;
  onToggleDate: (habitId: string, dateStr: string) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habit: Habit) => void;
  onOpenVisionBadge: (habit: Habit) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  selectedDate,
  todayDateStr,
  onSetQuality,
  onToggleDate,
  onEditHabit,
  onDeleteHabit,
  onOpenVisionBadge,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const [year, month] = selectedDate.split('-').map(Number);

  // Memoized calculations to force immediate re-render when habit.history changes
  const streak = React.useMemo(
    () => calculateStreak(habit.history, todayDateStr),
    [habit.history, todayDateStr]
  );
  
  const monthlyProgress = React.useMemo(
    () => calculateMonthlyProgress(habit.history, year, month, habit.monthlyGoal),
    [habit.history, year, month, habit.monthlyGoal]
  );

  const currentQuality = React.useMemo(
    () => getHabitDayQuality(habit.history, selectedDate),
    [habit.history, selectedDate]
  );
  
  const isCompleted = Boolean(currentQuality);

  // Handle tier click
  const handleQualityClick = (e: React.MouseEvent<HTMLButtonElement>, quality: QualityLevel) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top + rect.height / 2;

    const willBeSet = currentQuality !== quality;
    onSetQuality(habit.id, selectedDate, quality);

    if (willBeSet) {
      soundManager.playCompletionPop();
      const burstColor = quality === 'gold' ? '#fbbf24' : quality === 'silver' ? '#cbd5e1' : '#d97706';
      triggerCompletionBurst(clickX, clickY, burstColor);

      if (quality === 'gold') {
        soundManager.playCelebrationChime();
      }

      if (monthlyProgress.completedCount + 1 === habit.monthlyGoal) {
        setTimeout(() => {
          triggerGoalAchievedFanfare();
        }, 150);
      }
    }
  };

  // Handle main checkmark toggle (quick toggle gold/none)
  const handleMainToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top + rect.height / 2;

    const willBeCompleted = !isCompleted;
    onToggleDate(habit.id, selectedDate);

    if (willBeCompleted) {
      soundManager.playCompletionPop();
      triggerCompletionBurst(clickX, clickY, '#fbbf24');
    }
  };

  // Generate 7-day mini timeline ending at today
  const last7Days: { dateStr: string; label: string; quality: QualityLevel | null }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dStr = offsetDateKey(todayDateStr, -i);
    const dayInitial = new Date(dStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });
    last7Days.push({
      dateStr: dStr,
      label: dayInitial,
      quality: getHabitDayQuality(habit.history, dStr),
    });
  }

  // Tier visual helpers
  const getTierBadgeStyle = (tier: QualityLevel) => {
    const active = currentQuality === tier;
    if (tier === 'gold') {
      return active
        ? 'bg-amber-500 text-slate-950 font-extrabold ring-2 ring-amber-300 shadow-md shadow-amber-500/30'
        : 'bg-slate-800/90 text-amber-300/80 hover:bg-amber-500/20 hover:text-amber-200 border border-amber-500/30';
    }
    if (tier === 'silver') {
      return active
        ? 'bg-slate-200 text-slate-950 font-extrabold ring-2 ring-slate-100 shadow-md'
        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/60 hover:text-white border border-slate-600/40';
    }
    // bronze
    return active
      ? 'bg-amber-700 text-amber-50 font-extrabold ring-2 ring-amber-600 shadow-md'
      : 'bg-slate-800/90 text-amber-600 hover:bg-amber-700/20 hover:text-amber-500 border border-amber-800/40';
  };

  return (
    <div
      className={`relative w-full rounded-2xl border transition-all duration-200 ${
        menuOpen ? 'z-50' : 'z-10'
      } ${
        currentQuality === 'gold'
          ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border-amber-500/40 shadow-md'
          : isCompleted
          ? 'bg-slate-900/90 border-slate-700/80 shadow-sm'
          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/60'
      }`}
    >
      {/* Subtle left accent indicator with rounded edge */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
        style={{
          backgroundColor:
            currentQuality === 'gold'
              ? '#f59e0b'
              : currentQuality === 'silver'
              ? '#94a3b8'
              : currentQuality === 'bronze'
              ? '#b45309'
              : habit.color,
          opacity: isCompleted ? 1 : 0.4,
        }}
      />

      <div className="pl-4 pr-3.5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        {/* Left: Icon, Habit Name, Category & Goal */}
        <div className="flex items-center gap-3 min-w-0 md:flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
            style={{
              backgroundColor: `${habit.color}20`,
              color: habit.color,
            }}
          >
            <HabitIcon name={habit.icon} className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {habit.title}
              </h3>
              {habit.visionBadge && (
                <button
                  onClick={() => onOpenVisionBadge(habit)}
                  title={`Vision Badge: ${habit.visionBadge.title} - "${habit.visionBadge.slogan}"`}
                  className="shrink-0 p-1 rounded-md bg-indigo-500/15 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 truncate mt-0.5">
              <span>{habit.category}</span>
              <span className="text-slate-600">·</span>
              <span>
                Goal: <strong className="text-slate-300">{habit.monthlyGoal}d/mo</strong>
              </span>
              {habit.description && (
                <>
                  <span className="text-slate-600 hidden xl:inline">·</span>
                  <span className="text-slate-400 truncate hidden xl:inline max-w-xs">
                    {habit.description}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3 Quality Level Tiers (Bronze, Silver, Gold) */}
        <div className="flex items-center gap-1.5 shrink-0 self-start md:self-center bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {/* Bronze Tier */}
          <button
            onClick={(e) => handleQualityClick(e, 'bronze')}
            title={`Bronze tier: ${habit.qualityConfig.bronze.label} (${habit.qualityConfig.bronze.value} ${habit.qualityConfig.unit})`}
            aria-label={`Log Bronze for ${habit.title}: ${habit.qualityConfig.bronze.label}`}
            className={`min-h-[32px] px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1 ${getTierBadgeStyle(
              'bronze'
            )}`}
          >
            <span>🥉</span>
            <span className="tabular-nums font-semibold">
              {habit.qualityConfig.bronze.label}
            </span>
          </button>

          {/* Silver Tier */}
          <button
            onClick={(e) => handleQualityClick(e, 'silver')}
            title={`Silver tier: ${habit.qualityConfig.silver.label} (${habit.qualityConfig.silver.value} ${habit.qualityConfig.unit})`}
            aria-label={`Log Silver for ${habit.title}: ${habit.qualityConfig.silver.label}`}
            className={`min-h-[32px] px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1 ${getTierBadgeStyle(
              'silver'
            )}`}
          >
            <span>🥈</span>
            <span className="tabular-nums font-semibold">
              {habit.qualityConfig.silver.label}
            </span>
          </button>

          {/* Gold Tier */}
          <button
            onClick={(e) => handleQualityClick(e, 'gold')}
            title={`Gold tier: ${habit.qualityConfig.gold.label} (${habit.qualityConfig.gold.value} ${habit.qualityConfig.unit}) - Qualifies for Daily Ticket!`}
            aria-label={`Log Gold for ${habit.title}: ${habit.qualityConfig.gold.label}`}
            className={`min-h-[32px] px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1 ${getTierBadgeStyle(
              'gold'
            )}`}
          >
            <span>🥇</span>
            <span className="tabular-nums font-bold">
              {habit.qualityConfig.gold.label}
            </span>
          </button>
        </div>

        {/* Middle/Right: Streak, Monthly Gauge, 7-Day Mini Strip, and Checkmark */}
        <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0 border-t md:border-t-0 border-slate-800/60 pt-2 md:pt-0">
          {/* Streak Counter */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            title={`Current streak: ${streak.currentStreak} days (Best: ${streak.longestStreak} days) · Gold streak: ${streak.goldStreak} days`}
          >
            <Flame
              className={`w-4 h-4 ${
                streak.currentStreak > 0
                  ? 'text-amber-400 fill-amber-400/40 animate-pulse'
                  : 'text-slate-600'
              }`}
            />
            <span className="text-xs font-bold text-white tabular-nums">
              {streak.currentStreak}
              <span className="text-[11px] font-normal text-slate-400 ml-0.5">d</span>
            </span>
          </div>

          {/* Monthly Progress Bar */}
          <div
            className="flex items-center gap-2 shrink-0"
            title={`Monthly target: ${monthlyProgress.completedCount} of ${habit.monthlyGoal} days completed (${monthlyProgress.percentage}%) · ${monthlyProgress.goldCount} Gold days`}
          >
            <div className="w-14 sm:w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, monthlyProgress.percentage)}%`,
                  backgroundColor: monthlyProgress.isGoalMet ? '#10b981' : habit.color,
                }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums text-slate-300 whitespace-nowrap">
              {monthlyProgress.completedCount}/{habit.monthlyGoal}d
            </span>
          </div>

          {/* 7-Day Mini Strip */}
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            {last7Days.map((d) => {
              let dayBadgeBg = 'bg-slate-800 text-slate-500 hover:text-slate-300';
              if (d.quality === 'gold') {
                dayBadgeBg = 'bg-amber-500 text-slate-950 font-bold shadow-xs';
              } else if (d.quality === 'silver') {
                dayBadgeBg = 'bg-slate-300 text-slate-950 font-bold';
              } else if (d.quality === 'bronze') {
                dayBadgeBg = 'bg-amber-700 text-white font-bold';
              }

              return (
                <div
                  key={d.dateStr}
                  title={`${d.dateStr}: ${d.quality ? `${d.quality.toUpperCase()} quality` : 'Missed'}`}
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-semibold transition-all ${dayBadgeBg}`}
                >
                  {d.quality === 'gold' ? '🥇' : d.quality === 'silver' ? '🥈' : d.quality === 'bronze' ? '🥉' : d.label}
                </div>
              );
            })}
          </div>

          {/* Checkmark Button and Menu */}
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <button
              ref={toggleButtonRef}
              onClick={handleMainToggle}
              aria-label={
                isCompleted
                  ? `Clear ${habit.title} for ${selectedDate}`
                  : `Mark Gold for ${habit.title} for ${selectedDate}`
              }
              title={
                currentQuality === 'gold'
                  ? 'Gold Quality! Click to clear.'
                  : currentQuality
                  ? `${currentQuality.toUpperCase()} Quality. Click to clear.`
                  : 'Quick mark Gold quality'
              }
              className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all duration-150 ${
                currentQuality === 'gold'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95'
                  : currentQuality === 'silver'
                  ? 'bg-slate-200 text-slate-950 shadow-md active:scale-95'
                  : currentQuality === 'bronze'
                  ? 'bg-amber-700 text-white shadow-md active:scale-95'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 active:scale-95'
              }`}
            >
              <Check
                className={`w-5 h-5 stroke-[2.8] transition-transform duration-150 ${
                  isCompleted ? 'scale-110' : 'scale-90 opacity-70'
                }`}
              />
            </button>

            {/* Direct Quick Edit Button */}
            <button
              onClick={() => onEditHabit(habit)}
              aria-label={`Edit ${habit.title}`}
              title={`Edit settings & quality targets for ${habit.title}`}
              className="hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Overflow Options Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={`Settings and options for ${habit.title}`}
                title={`Settings for ${habit.title}`}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${
                  menuOpen
                    ? 'bg-slate-700 text-white'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="hidden sm:block fixed inset-0 z-[65] cursor-default bg-black/20"
                    onClick={() => setMenuOpen(false)}
                  />

                  <div className="hidden sm:block absolute right-0 top-12 z-[70] w-60 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black p-1.5 text-sm ring-1 ring-white/10 animate-fadeIn">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenVisionBadge(habit);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-slate-200 hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>AI Vision Badge</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEditHabit(habit);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-slate-200 hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-indigo-400" />
                      <span>Edit Habit & 3-Tier Goals</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteHabit(habit);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Habit</span>
                    </button>
                  </div>

                  <div
                    className="sm:hidden fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-xs p-0 animate-fadeIn"
                    onClick={() => setMenuOpen(false)}
                  >
                    <div
                      className="w-full max-w-lg bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 pb-8 shadow-2xl animate-slideUp text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4" />
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                        >
                          <HabitIcon name={habit.icon} className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-bold text-white truncate">{habit.title}</h4>
                          <p className="text-xs text-slate-400">
                            {habit.category} · Target: {habit.monthlyGoal}d/mo
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onEditHabit(habit);
                          }}
                          className="w-full min-h-[48px] px-4 py-3 text-left text-sm font-semibold text-white bg-slate-800/80 hover:bg-slate-800 rounded-2xl flex items-center gap-3 transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-indigo-400" />
                          <span>Edit Habit & 3-Tier Quality Targets</span>
                        </button>

                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onOpenVisionBadge(habit);
                          }}
                          className="w-full min-h-[48px] px-4 py-3 text-left text-sm font-semibold text-white bg-slate-800/80 hover:bg-slate-800 rounded-2xl flex items-center gap-3 transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>AI Vision Badge Studio</span>
                        </button>

                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onDeleteHabit(habit);
                          }}
                          className="w-full min-h-[48px] px-4 py-3 text-left text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl flex items-center gap-3 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove Habit</span>
                        </button>

                        <button
                          onClick={() => setMenuOpen(false)}
                          className="w-full min-h-[44px] px-4 py-2 text-center text-xs font-semibold text-slate-400 hover:text-white transition-colors pt-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};