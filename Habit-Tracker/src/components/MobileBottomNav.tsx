import React from 'react';
import { CheckCircle2, Calendar, BarChart3, Gift, Ticket } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'today' | 'habits' | 'summary' | 'shop';
  onTabChange: (tab: 'today' | 'habits' | 'summary' | 'shop') => void;
  ticketBalance: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  ticketBalance,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0b0f19]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl shadow-black"
    >
      <button
        onClick={() => onTabChange('today')}
        className={`flex-1 min-h-[48px] py-1 flex flex-col items-center justify-center rounded-xl transition-colors ${
          currentTab === 'today'
            ? 'text-indigo-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] mt-0.5">Today</span>
      </button>

      <button
        onClick={() => onTabChange('habits')}
        className={`flex-1 min-h-[48px] py-1 flex flex-col items-center justify-center rounded-xl transition-colors ${
          currentTab === 'habits'
            ? 'text-indigo-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Calendar className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] mt-0.5">Habits</span>
      </button>

      <button
        onClick={() => onTabChange('summary')}
        className={`flex-1 min-h-[48px] py-1 flex flex-col items-center justify-center rounded-xl transition-colors ${
          currentTab === 'summary'
            ? 'text-indigo-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <BarChart3 className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] mt-0.5">Summary</span>
      </button>

      <button
        onClick={() => onTabChange('shop')}
        className={`flex-1 min-h-[48px] py-1 flex flex-col items-center justify-center rounded-xl transition-colors relative ${
          currentTab === 'shop'
            ? 'text-amber-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Gift className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] mt-0.5">Prize Shop</span>
        {ticketBalance > 0 && (
          <span className="absolute top-1 right-3 px-1 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black">
            {ticketBalance}
          </span>
        )}
      </button>
    </nav>
  );
};
