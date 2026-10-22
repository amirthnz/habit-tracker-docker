import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { formatDateKey, offsetDateKey, parseDateKey } from '../utils/habitLogic';

interface DateSelectorStripProps {
  selectedDate: string; // 'YYYY-MM-DD'
  onSelectDate: (dateStr: string) => void;
  todayDateStr: string;
}

export const DateSelectorStrip: React.FC<DateSelectorStripProps> = ({
  selectedDate,
  onSelectDate,
  todayDateStr,
}) => {
  // Generate a window of 9 days centered or leading up to today
  const days: { dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
  
  // 5 days before selected to 3 days after (up to today or slightly into future)
  for (let i = -5; i <= 3; i++) {
    const dStr = offsetDateKey(todayDateStr, i);
    const dObj = parseDateKey(dStr);
    days.push({
      dateStr: dStr,
      dayName: dObj.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: dObj.getDate(),
      isToday: dStr === todayDateStr,
    });
  }

  const selectedDateObj = parseDateKey(selectedDate);
  const formattedHeaderDate = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            {formattedHeaderDate}
          </h2>
          {selectedDate === todayDateStr && (
            <span className="text-xs text-indigo-400 font-medium ml-1">
              (Today)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectDate(offsetDateKey(selectedDate, -1))}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectDate(todayDateStr)}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Jump to Today
          </button>
          <button
            onClick={() => onSelectDate(offsetDateKey(selectedDate, 1))}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days carousel strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDate;
          return (
            <button
              key={item.dateStr}
              onClick={() => onSelectDate(item.dateStr)}
              className={`flex-1 min-w-[54px] py-2.5 px-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold scale-[1.03]'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[11px] uppercase tracking-wider mb-0.5">
                {item.dayName}
              </span>
              <span className="text-base font-bold tabular-nums">
                {item.dayNumber}
              </span>
              {item.isToday && !isSelected && (
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
