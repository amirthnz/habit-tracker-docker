/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Flame,
  Ticket,
  Filter,
  Gift,
  Trash2,
} from 'lucide-react';
import {
  Habit,
  QualityLevel,
  QualityTierConfig,
  Prize,
  PrizeRedemption,
  formatDateKey,
  toggleHabitCompletion,
  setHabitQuality,
  calculateStreak,
  calculateTickets,
  checkDayIsPerfectGold,
  HabitVisionBadge,
} from './utils/habitLogic';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DateSelectorStrip } from './components/DateSelectorStrip';
import { HabitCard } from './components/HabitCard';
import { NewHabitModal } from './components/NewHabitModal';
import { NewPrizeModal } from './components/NewPrizeModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { PeriodSummaryView } from './components/PeriodSummaryView';
import { PrizeShopView } from './components/PrizeShopView';
import { VisionBadgeModal } from './components/VisionBadgeModal';
import { ResetDataModal } from './components/ResetDataModal';
import { AuthScreen } from './components/AuthScreen';
import { soundManager } from './utils/soundEffects';
import { triggerGoalAchievedFanfare } from './utils/particleEffects';
import { apiFetch, fetchMe, logout, hasSession, AuthUser } from './api';

const SOUND_STORAGE_KEY = 'habitpulse_sound_v1';

export default function App() {
  const [todayDateStr] = useState<string>(() => formatDateKey(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [currentTab, setCurrentTab] = useState<'today' | 'habits' | 'summary' | 'shop'>('today');

  // Backend-synced state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [redemptions, setRedemptions] = useState<PrizeRedemption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // JWT auth gate: null until a valid session is established.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthCheckDone, setIsAuthCheckDone] = useState<boolean>(false);

  // Sound preference (kept locally per device)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Filter
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modals state
  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState(false);
  const [isNewPrizeModalOpen, setIsNewPrizeModalOpen] = useState(false);
  const [isResetDataModalOpen, setIsResetDataModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const [visionBadgeHabit, setVisionBadgeHabit] = useState<Habit | null>(null);

  // Perfect Gold Day celebration modal
  const [goldDayCelebrationDate, setGoldDayCelebrationDate] = useState<string | null>(null);

  // Sync sound manager
  useEffect(() => {
    soundManager.enabled = soundEnabled;
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  // Check for an existing JWT session on mount; show the auth screen otherwise.
  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      if (!hasSession()) {
        setIsAuthCheckDone(true);
        return;
      }
      const me = await fetchMe();
      if (cancelled) return;
      if (me) {
        setUser(me);
      } else {
        logout();
      }
      setIsAuthCheckDone(true);
    }
    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Any 401 that survives a refresh attempt clears the session -> back to login.
  useEffect(() => {
    const onSessionExpired = () => {
      setUser(null);
    };
    window.addEventListener('habitpulse_session_expired', onSessionExpired);
    return () => window.removeEventListener('habitpulse_session_expired', onSessionExpired);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setHabits([]);
    setPrizes([]);
    setRedemptions([]);
  };

  // Initial load from Django backend
  useEffect(() => {
    if (!user) return; // only load data once authenticated
    async function loadFromDjango() {
      setIsLoading(true);
      try {
        const res = await apiFetch('/api/bootstrap');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setHabits(data.habits || []);
        setPrizes(data.prizes || []);
        setRedemptions(data.redemptions || []);
      } catch (err) {
        console.error('Failed loading from Django backend:', err);
        setHabits([]);
        setPrizes([]);
        setRedemptions([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadFromDjango();
  }, [user]);

  // Calculate live tickets
  const ticketStats = calculateTickets(habits, redemptions);

  // Perfect Gold Day celebration - fires AT MOST ONCE per date, ever.
  // celebratedGoldDays remembers every date that has already popped the ticket
  // modal. It is seeded with all currently-earned gold days on load, so
  // navigating away from a day and back (or reloading the page) can never
  // re-trigger the celebration for the same date.
  const isInitialGoldCheck = useRef<boolean>(true);
  const celebratedGoldDaysRef = useRef<Set<string>>(new Set());
  const markExistingGoldDaysAsCelebrated = (currentHabits: Habit[]) => {
    const allLoggedDates = new Set<string>();
    currentHabits.forEach((h) =>
      Object.keys(h.history ?? {}).forEach((d) => allLoggedDates.add(d))
    );
    allLoggedDates.forEach((d) => {
      if (checkDayIsPerfectGold(currentHabits, d)) {
        celebratedGoldDaysRef.current.add(d);
      }
    });
  };
  useEffect(() => {
    if (isLoading) return;

    if (isInitialGoldCheck.current) {
      // First run after data load: treat every already-earned gold day as
      // celebrated so pre-existing achievements never re-pop.
      isInitialGoldCheck.current = false;
      markExistingGoldDaysAsCelebrated(habits);
      return;
    }

    const isNowGold = checkDayIsPerfectGold(habits, selectedDate);
    if (isNowGold && !celebratedGoldDaysRef.current.has(selectedDate)) {
      celebratedGoldDaysRef.current.add(selectedDate);
      soundManager.playCelebrationChime();
      triggerGoalAchievedFanfare();
      setGoldDayCelebrationDate(selectedDate);
    }
  }, [habits, selectedDate, isLoading]);

  // Handle wiping all user data to clean slate
  const handleWipeAllData = async () => {
    setHabits([]);
    setPrizes([]);
    setRedemptions([]);
    // Fresh start: allow the Perfect Gold Day celebration to fire again.
    celebratedGoldDaysRef.current = new Set();
    setIsResetDataModalOpen(false);
    soundManager.playCompletionPop();

    try {
      await apiFetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'wipe' }),
      });
    } catch (err) {
      console.error('Failed wiping data on backend:', err);
    }
  };

  // Handle setting 3-level quality with forced React reference updates
  const handleSetHabitQuality = async (habitId: string, dateStr: string, quality: QualityLevel) => {
    // 1. Force immediate optimistic UI update with brand new references
    setHabits((prevHabits) =>
      prevHabits.map((h) => {
        if (h.id !== habitId) return h;
        const updated = setHabitQuality(h, dateStr, quality);
        return {
          ...updated,
          history: { ...updated.history },
        };
      })
    );

    // 2. Sync with Django backend in the background
    try {
      const res = await apiFetch(`/api/habits/${habitId}/set-quality/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, quality }),
      });
      
      if (!res.ok) {
        console.error('Django API error:', await res.text());
        return;
      }

      const serverHabit = await res.json();
      // Only apply the server copy if it is a valid habit for this id, so a
      // malformed or stale response can never silently revert the optimistic
      // UI update.
      if (serverHabit && serverHabit.id === habitId && serverHabit.history) {
        setHabits((prevHabits) =>
          prevHabits.map((h) =>
            h.id === habitId
              ? { ...serverHabit, history: { ...serverHabit.history } }
              : h
          )
        );
      }
    } catch (err) {
      console.error('Network error syncing habit quality to Django:', err);
    }
  };

  // Handle habit quick toggle with forced React reference updates
  const handleToggleHabitDate = async (habitId: string, dateStr: string) => {
    // 1. Force immediate optimistic UI update with brand new references
    setHabits((prevHabits) =>
      prevHabits.map((h) => {
        if (h.id !== habitId) return h;
        const updated = toggleHabitCompletion(h, dateStr);
        return {
          ...updated,
          history: { ...updated.history },
        };
      })
    );

    // 2. Sync with Django backend in the background
    try {
      const res = await apiFetch(`/api/habits/${habitId}/toggle-date/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr }),
      });

      if (!res.ok) {
        console.error('Django API error:', await res.text());
        return;
      }

      const serverHabit = await res.json();
      // Only apply the server copy if it is a valid habit for this id, so a
      // malformed or stale response can never silently revert the optimistic
      // UI update.
      if (serverHabit && serverHabit.id === habitId && serverHabit.history) {
        setHabits((prevHabits) =>
          prevHabits.map((h) =>
            h.id === habitId
              ? { ...serverHabit, history: { ...serverHabit.history } }
              : h
          )
        );
      }
    } catch (err) {
      console.error('Network error toggling habit date on Django:', err);
    }
  };

  // Handle adding or editing a habit
  const handleSaveHabit = async (habitData: {
    id?: string;
    title: string;
    description: string;
    category: string;
    icon: string;
    color: string;
    monthlyGoal: number;
    qualityConfig: QualityTierConfig;
  }) => {
    if (habitData.id) {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitData.id
            ? {
                ...h,
                title: habitData.title,
                description: habitData.description,
                category: habitData.category,
                icon: habitData.icon,
                color: habitData.color,
                monthlyGoal: habitData.monthlyGoal,
                qualityConfig: habitData.qualityConfig,
              }
            : h
        )
      );

      try {
        const res = await apiFetch(`/api/habits/${habitData.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(habitData),
        });
        if (res.ok) {
          const updated = await res.json();
          setHabits((prev) =>
            prev.map((h) =>
              h.id === habitData.id
                ? { ...updated, history: { ...updated.history } }
                : h
            )
          );
        }
      } catch (err) {
        console.error('Failed updating habit on backend:', err);
      }
    } else {
      const payload = {
        id: `habit-${Date.now()}`,
        title: habitData.title,
        description: habitData.description,
        category: habitData.category,
        icon: habitData.icon,
        color: habitData.color,
        monthlyGoal: habitData.monthlyGoal,
        qualityConfig: habitData.qualityConfig,
        history: {},
        createdAt: todayDateStr,
      };

      setHabits((prev) => [payload, ...prev]);

      try {
        const res = await apiFetch('/api/habits/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const savedHabit = await res.json();
          setHabits((prev) =>
            prev.map((h) =>
              h.id === payload.id
                ? { ...savedHabit, history: { ...savedHabit.history } }
                : h
            )
          );
        }
      } catch (err) {
        console.error('Failed creating habit on backend:', err);
      }
    }
    setEditingHabit(null);
  };

  // Handle delete habit
  const handleConfirmDelete = async (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setDeletingHabit(null);

    try {
      await apiFetch(`/api/habits/${habitId}/`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed deleting habit on backend:', err);
    }
  };

  // Handle saving vision badge
  const handleSaveVisionBadge = async (habitId: string, badge: HabitVisionBadge) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, visionBadge: badge } : h))
    );

    try {
      await apiFetch(`/api/habits/${habitId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visionBadge: badge }),
      });
    } catch (err) {
      console.error('Failed saving vision badge on backend:', err);
    }
  };

  // Handle adding prize
  const handleSavePrize = async (prizeData: {
    title: string;
    description: string;
    ticketCost: number;
    icon: string;
    category: string;
  }) => {
    const newPrize: Prize = {
      id: `prize-${Date.now()}`,
      title: prizeData.title,
      description: prizeData.description,
      ticketCost: prizeData.ticketCost,
      icon: prizeData.icon,
      category: prizeData.category,
      createdAt: todayDateStr,
      redeemedCount: 0,
    };

    setPrizes((prev) => [newPrize, ...prev]);

    try {
      const res = await apiFetch('/api/prizes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrize),
      });
      if (res.ok) {
        const savedPrize = await res.json();
        setPrizes((prev) => prev.map((p) => (p.id === newPrize.id ? savedPrize : p)));
      }
    } catch (err) {
      console.error('Failed creating prize on backend:', err);
    }
  };

  // Handle delete prize
  const handleDeletePrize = async (prizeId: string) => {
    setPrizes((prev) => prev.filter((p) => p.id !== prizeId));

    try {
      await apiFetch(`/api/prizes/${prizeId}/`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed deleting prize on backend:', err);
    }
  };

  // Handle redeeming prize
  const handleRedeemPrize = async (prize: Prize) => {
    if (ticketStats.balance < prize.ticketCost) return;

    const tempRedemption: PrizeRedemption = {
      id: `redemption-${Date.now()}`,
      prizeId: prize.id,
      prizeTitle: prize.title,
      ticketCost: prize.ticketCost,
      redeemedAt: new Date().toISOString(),
    };

    setRedemptions((prev) => [...prev, tempRedemption]);
    setPrizes((prev) =>
      prev.map((p) =>
        p.id === prize.id ? { ...p, redeemedCount: p.redeemedCount + 1 } : p
      )
    );

    try {
      const res = await apiFetch(`/api/prizes/${prize.id}/redeem/`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setPrizes((prev) => prev.map((p) => (p.id === prize.id ? data.prize : p)));
        setRedemptions((prev) =>
          prev.map((r) => (r.id === tempRedemption.id ? data.redemption : r))
        );
      }
    } catch (err) {
      console.error('Failed redeeming prize on backend:', err);
    }
  };

  // Summary counts for selected date
  const completedTodayCount = habits.filter((h) => Boolean(h.history[selectedDate])).length;
  const goldTodayCount = habits.filter((h) => h.history[selectedDate] === 'gold').length;
  const totalHabitsCount = habits.length;
  const isAllGoldToday = checkDayIsPerfectGold(habits, selectedDate);

  // Categories list
  const allCategories = ['All', ...Array.from(new Set(habits.map((h) => h.category)))];

  // Filtered habits
  const filteredHabits =
    categoryFilter === 'All'
      ? habits
      : habits.filter((h) => h.category === categoryFilter);

  // Calculate highest current streak
  const highestStreak = habits.reduce((max, h) => {
    const s = calculateStreak(h.history, todayDateStr);
    return Math.max(max, s.currentStreak);
  }, 0);

  // Auth gate: session check -> loading spinner -> auth screen -> app.
  if (!isAuthCheckDone) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-400">
        <span className="text-sm">Loading…</span>
      </div>
    );
  }
  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewHabit={() => {
          setEditingHabit(null);
          setIsNewHabitModalOpen(true);
        }}
        onOpenResetData={() => setIsResetDataModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        completedTodayCount={completedTodayCount}
        totalHabitsCount={totalHabitsCount}
        ticketBalance={ticketStats.balance}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* View 1: Today's Rituals */}
        {currentTab === 'today' && (
          <div className="space-y-6">
            {/* Top Motivation & Daily Summary Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Daily Momentum Hub</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {isAllGoldToday
                      ? 'Perfect Gold Day! 🎫️ Ticket Earned!'
                      : goldTodayCount === totalHabitsCount && totalHabitsCount > 0
                      ? 'All Rituals at Gold Quality! 🥇'
                      : `You have completed ${completedTodayCount} of ${totalHabitsCount} habits (${goldTodayCount} Gold)`}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                    Log Bronze, Silver, or Gold quality. Achieving <strong>Gold on all habits</strong> earns 1 🎫️ Ticket to spend in the Prize Shop!
                  </p>
                </div>

                {/* Daily Progress Gauge & Tickets */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Streak */}
                  <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Flame className="w-5 h-5 fill-amber-400/30" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white tabular-nums">
                        {highestStreak} <span className="text-xs text-slate-400 font-normal">days</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Top streak
                      </div>
                    </div>
                  </div>

                  {/* Ticket Vault Box */}
                  <button
                    onClick={() => setCurrentTab('shop')}
                    className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 rounded-2xl p-3.5 flex items-center gap-3 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                      <Ticket className="w-5 h-5 fill-slate-950" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-amber-300 tabular-nums">
                        {ticketStats.balance} 🎫️
                      </div>
                      <div className="text-[11px] text-amber-200/80 font-medium">
                        Prize Shop Vault
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden mt-5">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-amber-400 to-yellow-300 transition-all duration-500 rounded-full"
                  style={{
                    width: `${totalHabitsCount > 0 ? (goldTodayCount / totalHabitsCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Date Selection Strip */}
            <DateSelectorStrip
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              todayDateStr={todayDateStr}
            />

            {/* Category Filter Tabs */}
            {allCategories.length > 2 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filter:
                </span>
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                      categoryFilter === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Habit Cards List */}
            {isLoading ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 text-sm text-slate-400">
                Loading habits from server...
              </div>
            ) : filteredHabits.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">No habits in this category</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-5">
                  Start fresh by adding a new habit with 3-tier quality levels.
                </p>
                <button
                  onClick={() => {
                    setEditingHabit(null);
                    setIsNewHabitModalOpen(true);
                  }}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all"
                >
                  Create Habit
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {filteredHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    selectedDate={selectedDate}
                    todayDateStr={todayDateStr}
                    onSetQuality={handleSetHabitQuality}
                    onToggleDate={handleToggleHabitDate}
                    onEditHabit={(h) => {
                      setEditingHabit(h);
                      setIsNewHabitModalOpen(true);
                    }}
                    onDeleteHabit={(h) => setDeletingHabit(h)}
                    onOpenVisionBadge={(h) => setVisionBadgeHabit(h)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* View 2: Habits & Monthly Goals Roster */}
        {currentTab === 'habits' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Habit Roster & 3-Tier Targets
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-0.5">
                  All Active Habits & Quality Targets
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure Bronze, Silver, and Gold targets (count or duration) for every habit.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setIsResetDataModalOpen(true)}
                  aria-label="Delete all data"
                  title="Delete all data & reset habits"
                  className="min-h-[44px] px-3.5 py-2 text-xs sm:text-sm font-bold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Delete All Data</span>
                </button>

                <button
                  onClick={() => {
                    setEditingHabit(null);
                    setIsNewHabitModalOpen(true);
                  }}
                  className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Habit</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2.5">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  selectedDate={selectedDate}
                  todayDateStr={todayDateStr}
                  onSetQuality={handleSetHabitQuality}
                  onToggleDate={handleToggleHabitDate}
                  onEditHabit={(h) => {
                    setEditingHabit(h);
                    setIsNewHabitModalOpen(true);
                  }}
                  onDeleteHabit={(h) => setDeletingHabit(h)}
                  onOpenVisionBadge={(h) => setVisionBadgeHabit(h)}
                />
              ))}
            </div>
          </div>
        )}

        {/* View 3: Visual Period Progress Summary */}
        {currentTab === 'summary' && (
          <PeriodSummaryView
            habits={habits}
            todayDateStr={todayDateStr}
            onOpenNewHabit={() => {
              setEditingHabit(null);
              setIsNewHabitModalOpen(true);
            }}
          />
        )}

        {/* View 4: Prize Shop & Ticket Vault */}
        {currentTab === 'shop' && (
          <PrizeShopView
            prizes={prizes}
            redemptions={redemptions}
            ticketBalance={ticketStats.balance}
            totalEarnedTickets={ticketStats.totalEarned}
            earnedTicketDates={ticketStats.earnedDates}
            onOpenNewPrize={() => setIsNewPrizeModalOpen(true)}
            onRedeemPrize={handleRedeemPrize}
            onDeletePrize={handleDeletePrize}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        ticketBalance={ticketStats.balance}
      />

      {/* Modals */}
      <NewHabitModal
        isOpen={isNewHabitModalOpen}
        onClose={() => {
          setIsNewHabitModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        editingHabit={editingHabit}
      />

      <NewPrizeModal
        isOpen={isNewPrizeModalOpen}
        onClose={() => setIsNewPrizeModalOpen(false)}
        onSave={handleSavePrize}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingHabit)}
        habit={deletingHabit}
        onClose={() => setDeletingHabit(null)}
        onConfirm={handleConfirmDelete}
      />

      <VisionBadgeModal
        isOpen={Boolean(visionBadgeHabit)}
        habit={visionBadgeHabit}
        onClose={() => setVisionBadgeHabit(null)}
        onSaveBadge={handleSaveVisionBadge}
      />

      <ResetDataModal
        isOpen={isResetDataModalOpen}
        onClose={() => setIsResetDataModalOpen(false)}
        onWipeAll={handleWipeAllData}
      />

      {/* Perfect Gold Day Ticket Celebration Modal */}
      {goldDayCelebrationDate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
        >
          <div className="relative w-full max-w-md bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 border-2 border-amber-400/60 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/20">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
              <Ticket className="w-10 h-10 fill-slate-950" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/40 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Perfect Gold Day Unlocked!</span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              +1 Golden Ticket Awarded!
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              You crushed <strong>Gold Quality</strong> across every single habit on <strong>{goldDayCelebrationDate}</strong>. Your ticket is ready to spend in the Prize Shop!
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setGoldDayCelebrationDate(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Keep Tracking
              </button>
              <button
                onClick={() => {
                  setGoldDayCelebrationDate(null);
                  setCurrentTab('shop');
                }}
                className="px-5 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center gap-1.5"
              >
                <Gift className="w-4 h-4" />
                <span>Visit Prize Shop</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}