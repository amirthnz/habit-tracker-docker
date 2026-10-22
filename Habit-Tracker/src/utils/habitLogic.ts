/**
 * Core Habit Types, Quality Tiers, Tickets, and Pure Calculations
 */

export type QualityLevel = 'bronze' | 'silver' | 'gold';

export interface QualityTierConfig {
  unit: string; // e.g. 'steps', 'minutes', 'pages', 'liters'
  bronze: { value: number; label: string };
  silver: { value: number; label: string };
  gold: { value: number; label: string };
}

export interface HabitVisionBadge {
  title: string;
  slogan: string;
  badgeSvg?: string;
  themeColor?: string;
  unlockedAt?: string;
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  monthlyGoal: number; // target days per month
  qualityConfig: QualityTierConfig;
  history: Record<string, QualityLevel | boolean>; // 'YYYY-MM-DD': 'bronze' | 'silver' | 'gold'
  createdAt: string;
  visionBadge?: HabitVisionBadge;
}

export interface Prize {
  id: string;
  title: string;
  description: string;
  ticketCost: number;
  icon: string;
  category: string;
  createdAt: string;
  redeemedCount: number;
}

export interface PrizeRedemption {
  id: string;
  prizeId: string;
  prizeTitle: string;
  ticketCost: number;
  redeemedAt: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  goldStreak: number;
}

export interface MonthlyProgress {
  completedCount: number;
  goldCount: number;
  targetCount: number;
  percentage: number;
  isGoalMet: boolean;
  daysInMonth: number;
}

export interface PeriodSummary {
  year: number;
  month: number;
  totalHabits: number;
  totalCompletions: number;
  totalGoldCompletions: number;
  totalTargetGoal: number;
  overallRate: number; // percentage 0-100
  goalsAchievedCount: number;
  bestStreakHabit: { title: string; streak: number } | null;
  habitBreakdowns: {
    id: string;
    title: string;
    color: string;
    icon: string;
    completions: number;
    goldCount: number;
    goal: number;
    percent: number;
    goalAchieved: boolean;
    currentStreak: number;
  }[];
}

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD to Date in local time
 */
export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get the number of days in a given month (month is 1-indexed: 1 = Jan, 12 = Dec)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Add or subtract days from a date string
 */
export function offsetDateKey(dateStr: string, offsetDays: number): string {
  const date = parseDateKey(dateStr);
  date.setDate(date.getDate() + offsetDays);
  return formatDateKey(date);
}

/**
 * Get normalized quality tier for a date
 */
export function getHabitDayQuality(
  history: Record<string, QualityLevel | boolean>,
  dateStr: string
): QualityLevel | null {
  const val = history[dateStr];
  if (!val) return null;
  if (val === 'gold' || val === 'silver' || val === 'bronze') {
    return val;
  }
  // legacy boolean true treated as bronze
  return 'bronze';
}

/**
 * Check if a date has any completion
 */
export function isHabitCompleted(
  history: Record<string, QualityLevel | boolean>,
  dateStr: string
): boolean {
  return Boolean(getHabitDayQuality(history, dateStr));
}

/**
 * Calculate current and longest streak for a habit
 */
export function calculateStreak(
  history: Record<string, QualityLevel | boolean>,
  todayDateStr: string
): StreakInfo {
  const completedToday = isHabitCompleted(history, todayDateStr);
  const yesterdayDateStr = offsetDateKey(todayDateStr, -1);
  const completedYesterday = isHabitCompleted(history, yesterdayDateStr);

  let currentStreak = 0;
  let checkDateStr = completedToday ? todayDateStr : (completedYesterday ? yesterdayDateStr : null);

  if (checkDateStr) {
    while (isHabitCompleted(history, checkDateStr)) {
      currentStreak++;
      checkDateStr = offsetDateKey(checkDateStr, -1);
    }
  }

  // Calculate gold streak
  let goldStreak = 0;
  const isGoldToday = getHabitDayQuality(history, todayDateStr) === 'gold';
  const isGoldYesterday = getHabitDayQuality(history, yesterdayDateStr) === 'gold';
  let checkGoldDateStr = isGoldToday ? todayDateStr : (isGoldYesterday ? yesterdayDateStr : null);

  if (checkGoldDateStr) {
    while (getHabitDayQuality(history, checkGoldDateStr) === 'gold') {
      goldStreak++;
      checkGoldDateStr = offsetDateKey(checkGoldDateStr, -1);
    }
  }

  // Calculate longest streak across history
  const allCompletedDates = Object.keys(history)
    .filter(k => isHabitCompleted(history, k))
    .sort();

  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of allCompletedDates) {
    const currentDate = parseDateKey(dateStr);
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        runningStreak++;
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDate = currentDate;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    completedToday,
    goldStreak,
  };
}

/**
 * Calculate monthly progress for a habit
 */
export function calculateMonthlyProgress(
  history: Record<string, QualityLevel | boolean>,
  year: number,
  month: number, // 1-indexed
  monthlyGoal: number
): MonthlyProgress {
  const daysInMonth = getDaysInMonth(year, month);
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;

  let completedCount = 0;
  let goldCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${monthPrefix}${String(d).padStart(2, '0')}`;
    const quality = getHabitDayQuality(history, dayStr);
    if (quality) {
      completedCount++;
      if (quality === 'gold') {
        goldCount++;
      }
    }
  }

  const targetCount = Math.max(1, monthlyGoal);
  const percentage = Math.round((completedCount / targetCount) * 100);
  const isGoalMet = completedCount >= targetCount;

  return {
    completedCount,
    goldCount,
    targetCount,
    percentage,
    isGoalMet,
    daysInMonth,
  };
}

/**
 * Check if EVERY habit in the list achieved Gold quality on a given date.
 * Requirement: "getting gold for every habit in a single day should generate a ticket"
 */
export function checkDayIsPerfectGold(habits: Habit[], dateStr: string): boolean {
  if (habits.length === 0) return false;
  // Only habits that already existed on `dateStr` participate in the perfect-day
  // check. Otherwise adding a new habit later would retroactively invalidate
  // (and erase) Golden Tickets the user had already earned on earlier days.
  return habits.every(
    h => h.createdAt > dateStr || getHabitDayQuality(h.history, dateStr) === 'gold'
  );
}

/**
 * Calculate all dates that unlocked a ticket, and overall ticket balance
 */
export function calculateTickets(
  habits: Habit[],
  redemptions: PrizeRedemption[]
): {
  earnedDates: string[];
  totalEarned: number;
  totalSpent: number;
  balance: number;
} {
  if (habits.length === 0) {
    return { earnedDates: [], totalEarned: 0, totalSpent: 0, balance: 0 };
  }

  // Gather all unique dates recorded across habits
  const allDatesSet = new Set<string>();
  habits.forEach(h => {
    Object.keys(h.history).forEach(d => {
      if (h.history[d]) allDatesSet.add(d);
    });
  });

  const earnedDates = Array.from(allDatesSet)
    .filter(dateStr => checkDayIsPerfectGold(habits, dateStr))
    .sort();

  const totalEarned = earnedDates.length;
  const totalSpent = redemptions.reduce((sum, r) => sum + r.ticketCost, 0);
  const balance = Math.max(0, totalEarned - totalSpent);

  return {
    earnedDates,
    totalEarned,
    totalSpent,
    balance,
  };
}

/**
 * Generate period summary across all habits
 */
export function calculatePeriodSummary(
  habits: Habit[],
  year: number,
  month: number,
  todayDateStr: string
): PeriodSummary {
  let totalCompletions = 0;
  let totalGoldCompletions = 0;
  let totalTargetGoal = 0;
  let goalsAchievedCount = 0;
  let bestStreakHabit: { title: string; streak: number } | null = null;

  const habitBreakdowns = habits.map(habit => {
    const progress = calculateMonthlyProgress(habit.history, year, month, habit.monthlyGoal);
    const streak = calculateStreak(habit.history, todayDateStr);

    totalCompletions += progress.completedCount;
    totalGoldCompletions += progress.goldCount;
    totalTargetGoal += progress.targetCount;
    if (progress.isGoalMet) {
      goalsAchievedCount++;
    }

    if (!bestStreakHabit || streak.currentStreak > bestStreakHabit.streak) {
      bestStreakHabit = {
        title: habit.title,
        streak: streak.currentStreak,
      };
    }

    return {
      id: habit.id,
      title: habit.title,
      color: habit.color,
      icon: habit.icon,
      completions: progress.completedCount,
      goldCount: progress.goldCount,
      goal: progress.targetCount,
      percent: progress.percentage,
      goalAchieved: progress.isGoalMet,
      currentStreak: streak.currentStreak,
    };
  });

  const overallRate = totalTargetGoal > 0 
    ? Math.min(100, Math.round((totalCompletions / totalTargetGoal) * 100))
    : 0;

  return {
    year,
    month,
    totalHabits: habits.length,
    totalCompletions,
    totalGoldCompletions,
    totalTargetGoal,
    overallRate,
    goalsAchievedCount,
    bestStreakHabit,
    habitBreakdowns,
  };
}

/**
 * Set a specific quality level (bronze, silver, gold) or toggle it off if already selected
 */
export function setHabitQuality(
  habit: Habit,
  dateStr: string,
  quality: QualityLevel
): Habit {
  const currentQuality = getHabitDayQuality(habit.history, dateStr);
  const newHistory = { ...habit.history };

  if (currentQuality === quality) {
    // Toggling the same quality turns it off
    delete newHistory[dateStr];
  } else {
    newHistory[dateStr] = quality;
  }

  return {
    ...habit,
    history: newHistory,
  };
}

/**
 * Quick toggle: cycles none -> gold -> none (or toggles on with gold default)
 */
export function toggleHabitCompletion(habit: Habit, dateStr: string): Habit {
  const currentQuality = getHabitDayQuality(habit.history, dateStr);
  const newHistory = { ...habit.history };

  if (currentQuality) {
    delete newHistory[dateStr];
  } else {
    newHistory[dateStr] = 'gold';
  }

  return {
    ...habit,
    history: newHistory,
  };
}
