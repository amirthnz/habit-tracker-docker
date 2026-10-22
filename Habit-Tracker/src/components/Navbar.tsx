import React from 'react';
import { Plus, Volume2, VolumeX, Sparkles, BarChart3, Calendar, CheckCircle2, Ticket, Gift, Trash2, LogOut } from 'lucide-react';
import { AuthUser } from '../api';

interface NavbarProps {
  currentTab: 'today' | 'habits' | 'summary' | 'shop';
  onTabChange: (tab: 'today' | 'habits' | 'summary' | 'shop') => void;
  onOpenNewHabit: () => void;
  onOpenResetData: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  completedTodayCount: number;
  totalHabitsCount: number;
  ticketBalance: number;
  user: AuthUser;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenNewHabit,
  onOpenResetData,
  soundEnabled,
  onToggleSound,
  ticketBalance,
  user,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4 w-full">
        {/* Zone 1: Brand Wordmark (responsive text) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-400 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <button
            onClick={() => onTabChange('today')}
            className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white whitespace-nowrap text-left hover:text-indigo-200 transition-colors"
          >
            HabitPulse
          </button>
        </div>

        {/* Zone 2: Navigation Links (desktop only) */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onTabChange('today')}
            className={`whitespace-nowrap transition-colors flex items-center gap-2 py-1 ${
              currentTab === 'today'
                ? 'text-indigo-400 font-bold border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Today's Rituals</span>
          </button>

          <button
            onClick={() => onTabChange('habits')}
            className={`whitespace-nowrap transition-colors flex items-center gap-2 py-1 ${
              currentTab === 'habits'
                ? 'text-indigo-400 font-bold border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Habits & Goals</span>
          </button>

          <button
            onClick={() => onTabChange('summary')}
            className={`whitespace-nowrap transition-colors flex items-center gap-2 py-1 ${
              currentTab === 'summary'
                ? 'text-indigo-400 font-bold border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Period Summary</span>
          </button>

          <button
            onClick={() => onTabChange('shop')}
            className={`whitespace-nowrap transition-colors flex items-center gap-1.5 py-1 ${
              currentTab === 'shop'
                ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Prize Shop</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] font-black tabular-nums ml-1">
              {ticketBalance} 🎫️
            </span>
          </button>
        </nav>

        {/* Zone 3: Actions (Responsive on all screen sizes) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Ticket vault quick badge */}
          <button
            onClick={() => onTabChange('shop')}
            title="Open Prize Shop"
            aria-label={`Prize shop: ${ticketBalance} tickets`}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 transition-all text-xs font-bold h-9 sm:h-10 shrink-0"
          >
            <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400 shrink-0" />
            <span className="tabular-nums font-black text-xs sm:text-sm">{ticketBalance}</span>
            <span className="hidden sm:inline">🎫️</span>
          </button>

          {/* Delete All Data Button with Confirmation */}
          <button
            onClick={onOpenResetData}
            aria-label="Delete all data with confirmation"
            title="Delete all data & reset"
            className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/40 transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Disable audio chimes' : 'Enable audio chimes'}
            title={soundEnabled ? 'Sound is ON (click to mute)' : 'Sound is OFF (click to unmute)'}
            className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors shrink-0"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            )}
          </button>

          {/* Logged-in user + logout */}
          <div className="flex items-center gap-1.5 shrink-0 pl-1 sm:pl-2 border-l border-slate-700/60">
            <span
              title={user.email || user.username}
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase"
            >
              {(user.username || '?').slice(0, 2)}
            </span>
            <button
              onClick={onLogout}
              aria-label="Log out"
              title={`Log out ${user.username}`}
              className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/40 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* New Habit Primary Button */}
          <button
            onClick={onOpenNewHabit}
            className="h-9 sm:h-10 px-2 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-600/25 flex items-center gap-1 sm:gap-1.5 transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New Habit</span>
            <span className="sm:hidden text-xs">Habit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
