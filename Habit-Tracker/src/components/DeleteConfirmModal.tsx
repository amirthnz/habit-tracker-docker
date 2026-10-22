import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Habit } from '../utils/habitLogic';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  habit: Habit | null;
  onClose: () => void;
  onConfirm: (habitId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  habit,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !habit) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h2 id="delete-dialog-title" className="text-base font-bold text-white">
              Remove Habit?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6 bg-slate-800/50 p-3.5 rounded-xl border border-slate-800">
          Are you sure you want to remove <strong className="text-white">"{habit.title}"</strong> and all its recorded streaks and history?
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(habit.id);
              onClose();
            }}
            className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Habit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
