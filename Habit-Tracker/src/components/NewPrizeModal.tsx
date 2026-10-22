import React, { useState } from 'react';
import { X, Ticket, Utensils, Film, Coffee, Compass, Gift, Sparkles } from 'lucide-react';
import { Prize } from '../utils/habitLogic';

interface NewPrizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prizeData: {
    title: string;
    description: string;
    ticketCost: number;
    icon: string;
    category: string;
  }) => void;
}

const PRIZE_ICONS = [
  { id: 'Utensils', label: 'Food / Burger', Icon: Utensils },
  { id: 'Film', label: 'Cinema / Movies', Icon: Film },
  { id: 'Coffee', label: 'Coffee / Treat', Icon: Coffee },
  { id: 'Compass', label: 'Trip / Adventure', Icon: Compass },
  { id: 'Sparkles', label: 'Self-Care', Icon: Sparkles },
  { id: 'Gift', label: 'General Gift', Icon: Gift },
];

const CATEGORIES = ['Treats', 'Entertainment', 'Self-Care', 'Adventure', 'Shopping'];
const COST_PRESETS = [1, 2, 3, 4, 6, 8, 10];

export const NewPrizeModal: React.FC<NewPrizeModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ticketCost, setTicketCost] = useState(2);
  const [icon, setIcon] = useState('Utensils');
  const [category, setCategory] = useState('Treats');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a prize name.');
      return;
    }
    if (ticketCost < 1) {
      setError('Ticket cost must be at least 1.');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      ticketCost: Number(ticketCost),
      icon,
      category,
    });

    setTitle('');
    setDescription('');
    setTicketCost(2);
    setError('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-prize-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Ticket className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 id="new-prize-title" className="text-lg font-bold text-white">
                Add Custom Reward Prize
              </h2>
              <p className="text-xs text-slate-400">
                Reward yourself for completing all your habits with Gold quality.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="prize-title" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Prize Name *
            </label>
            <input
              id="prize-title"
              type="text"
              placeholder="e.g. Gourmet Burger, Cinema Night, Spa Day..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
              autoFocus
            />
          </div>

          {/* Ticket Cost */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="ticket-cost" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                Ticket Cost *
              </label>
              <span className="text-base font-bold text-amber-400 tabular-nums">
                {ticketCost} 🎫️ {ticketCost === 1 ? 'Ticket' : 'Tickets'}
              </span>
            </div>

            <input
              id="ticket-cost"
              type="range"
              min="1"
              max="20"
              value={ticketCost}
              onChange={(e) => setTicketCost(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />

            {/* Presets */}
            <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-700/50">
              <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
              {COST_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTicketCost(preset)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    ticketCost === preset
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset}🎫️
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="prize-desc" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description or Details (optional)
            </label>
            <input
              id="prize-desc"
              type="text"
              placeholder="e.g. Double cheeseburger with extra crispy fries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reward Category & Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRIZE_ICONS.map((item) => {
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    aria-label={item.label}
                    className={`min-h-[44px] rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <item.Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              Create Prize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
