import React from 'react';
import { Trash2, X, ShieldAlert } from 'lucide-react';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWipeAll: () => void;
}

export const ResetDataModal: React.FC<ResetDataModalProps> = ({
  isOpen,
  onClose,
  onWipeAll,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-rose-950/40">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h2 id="reset-dialog-title" className="text-xl font-black text-white">
            Delete All Habit Data?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Are you sure you want to delete all data? This action will permanently remove all tracked progress.
          </p>
        </div>

        <div className="my-4 p-3.5 rounded-2xl bg-slate-950/60 border border-rose-500/20 text-xs text-slate-300 space-y-1.5">
          <div className="font-bold text-rose-400 flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            The following data will be erased:
          </div>
          <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] sm:text-xs">
            <li>All habit streaks and daily check-in histories</li>
            <li>All Bronze, Silver, and Gold logs</li>
            <li>All Golden Ticket balances & Perfect Gold achievements</li>
            <li>All custom prizes and redemption histories</li>
          </ul>
        </div>

        {/* Action Options */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              onWipeAll();
              onClose();
            }}
            className="w-full min-h-[46px] px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.99] rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Delete All Data (Empty Slate)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[42px] px-4 py-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
