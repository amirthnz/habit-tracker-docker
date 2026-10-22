import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStreak,
  calculateMonthlyProgress,
  calculatePeriodSummary,
  setHabitQuality,
  toggleHabitCompletion,
  formatDateKey,
  checkDayIsPerfectGold,
  calculateTickets,
} from './habitLogic.ts';
import type { Habit, PrizeRedemption } from './habitLogic.ts';

const dummyQualityConfig = {
  unit: 'steps',
  bronze: { value: 1000, label: '1,000 steps' },
  silver: { value: 4000, label: '4,000 steps' },
  gold: { value: 8000, label: '8,000 steps' },
};

test('formatDateKey formats Date object accurately', () => {
  const d = new Date(2026, 9, 18);
  assert.equal(formatDateKey(d), '2026-10-18');
});

test('calculateStreak counts active streaks when completed today', () => {
  const history = {
    '2026-10-18': 'gold' as const,
    '2026-10-17': 'silver' as const,
    '2026-10-16': 'bronze' as const,
  };
  const streak = calculateStreak(history, '2026-10-18');
  assert.equal(streak.currentStreak, 3);
  assert.equal(streak.completedToday, true);
  assert.equal(streak.longestStreak, 3);
});

test('setHabitQuality sets bronze, silver, gold and toggles off on re-click', () => {
  const habit: Habit = {
    id: 'h1',
    title: 'Daily Walk',
    description: 'Walking outside',
    category: 'Health',
    icon: 'Sun',
    color: '#10b981',
    monthlyGoal: 20,
    qualityConfig: dummyQualityConfig,
    history: {},
    createdAt: '2026-10-01',
  };

  const bronzeSet = setHabitQuality(habit, '2026-10-18', 'bronze');
  assert.equal(bronzeSet.history['2026-10-18'], 'bronze');

  const goldSet = setHabitQuality(bronzeSet, '2026-10-18', 'gold');
  assert.equal(goldSet.history['2026-10-18'], 'gold');

  const toggledOff = setHabitQuality(goldSet, '2026-10-18', 'gold');
  assert.equal(toggledOff.history['2026-10-18'], undefined);
});

test('checkDayIsPerfectGold returns true only when ALL habits are gold on that day', () => {
  const habits: Habit[] = [
    {
      id: 'h1',
      title: 'Walking',
      description: '',
      category: 'Health',
      icon: 'Sun',
      color: '#10b981',
      monthlyGoal: 20,
      qualityConfig: dummyQualityConfig,
      history: { '2026-10-18': 'gold', '2026-10-17': 'silver' },
      createdAt: '2026-10-01',
    },
    {
      id: 'h2',
      title: 'Deep Work',
      description: '',
      category: 'Focus',
      icon: 'Zap',
      color: '#6366f1',
      monthlyGoal: 20,
      qualityConfig: {
        unit: 'minutes',
        bronze: { value: 10, label: '10 min' },
        silver: { value: 60, label: '60 min' },
        gold: { value: 180, label: '180 min' },
      },
      history: { '2026-10-18': 'gold', '2026-10-17': 'gold' },
      createdAt: '2026-10-01',
    },
  ];

  // Oct 18 has all habits Gold -> TRUE
  assert.equal(checkDayIsPerfectGold(habits, '2026-10-18'), true);

  // Oct 17 has one silver and one gold -> FALSE
  assert.equal(checkDayIsPerfectGold(habits, '2026-10-17'), false);
});

test('a habit added after a day does not invalidate Golden Tickets earned earlier', () => {
  // h1 existed from Oct 1 and was gold on Oct 10. h2 was only added on Oct 15.
  // The Oct 10 ticket must still count even though h2 has no log that day.
  const habits: Habit[] = [
    {
      id: 'h1',
      title: 'Walking',
      description: '',
      category: 'Health',
      icon: 'Sun',
      color: '#10b981',
      monthlyGoal: 20,
      qualityConfig: dummyQualityConfig,
      history: { '2026-10-10': 'gold' },
      createdAt: '2026-10-01',
    },
    {
      id: 'h2',
      title: 'Meditation',
      description: '',
      category: 'Focus',
      icon: 'Moon',
      color: '#6366f1',
      monthlyGoal: 20,
      qualityConfig: dummyQualityConfig,
      history: { '2026-10-15': 'gold' },
      createdAt: '2026-10-15',
    },
  ];

  // Oct 10: h2 did not exist yet, so only h1's gold counts -> still a perfect day
  assert.equal(checkDayIsPerfectGold(habits, '2026-10-10'), true);

  // Oct 15: both habits exist; h1 has no gold log that day -> not perfect
  assert.equal(checkDayIsPerfectGold(habits, '2026-10-15'), false);

  // And calculateTickets keeps the earlier ticket
  const tickets = calculateTickets(habits, []);
  assert.equal(tickets.totalEarned, 1);
  assert.deepEqual(tickets.earnedDates, ['2026-10-10']);
});

test('calculateTickets tallies earned dates and computes spent vs balance', () => {
  const habits: Habit[] = [
    {
      id: 'h1',
      title: 'Habit 1',
      description: '',
      category: 'Health',
      icon: 'Sun',
      color: '#10b981',
      monthlyGoal: 20,
      qualityConfig: dummyQualityConfig,
      history: { '2026-10-10': 'gold', '2026-10-11': 'gold', '2026-10-12': 'silver' },
      createdAt: '2026-10-01',
    },
    {
      id: 'h2',
      title: 'Habit 2',
      description: '',
      category: 'Focus',
      icon: 'Zap',
      color: '#6366f1',
      monthlyGoal: 20,
      qualityConfig: dummyQualityConfig,
      history: { '2026-10-10': 'gold', '2026-10-11': 'gold', '2026-10-12': 'gold' },
      createdAt: '2026-10-01',
    },
  ];

  // Both are gold on Oct 10 and Oct 11 -> 2 tickets earned
  const redemptions: PrizeRedemption[] = [
    {
      id: 'r1',
      prizeId: 'p-burger',
      prizeTitle: 'Gourmet Burger',
      ticketCost: 2,
      redeemedAt: '2026-10-12',
    },
  ];

  const tickets = calculateTickets(habits, redemptions);
  assert.equal(tickets.totalEarned, 2);
  assert.deepEqual(tickets.earnedDates, ['2026-10-10', '2026-10-11']);
  assert.equal(tickets.totalSpent, 2);
  assert.equal(tickets.balance, 0);
});

test('calculateMonthlyProgress tracks both total completed and gold counts', () => {
  const history: Record<string, any> = {
    '2026-10-01': 'bronze',
    '2026-10-02': 'silver',
    '2026-10-03': 'gold',
    '2026-10-04': 'gold',
  };
  const progress = calculateMonthlyProgress(history, 2026, 10, 20);
  assert.equal(progress.completedCount, 4);
  assert.equal(progress.goldCount, 2);
  assert.equal(progress.percentage, 20);
});
