import React, { useState, useEffect } from 'react';
import { X, Sparkles, Target, Check, Award, Layers } from 'lucide-react';
import { Habit, QualityTierConfig } from '../utils/habitLogic';
import { ICON_OPTIONS, COLOR_OPTIONS, HabitIcon } from './HabitIcon';

interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: {
    id?: string;
    title: string;
    description: string;
    category: string;
    icon: string;
    color: string;
    monthlyGoal: number;
    qualityConfig: QualityTierConfig;
  }) => void;
  editingHabit?: Habit | null;
}

const CATEGORIES = [
  'Health',
  'Productivity',
  'Fitness',
  'Growth',
  'Mindfulness',
  'Creativity',
  'Routine',
];

const GOAL_PRESETS = [10, 15, 20, 24, 28];

const QUALITY_PRESETS = [
  {
    name: 'Steps (Walking)',
    unit: 'steps',
    bronze: { value: 1000, label: '1,000 steps' },
    silver: { value: 4000, label: '4,000 steps' },
    gold: { value: 8000, label: '8,000 steps' },
  },
  {
    name: 'Deep Work (Time)',
    unit: 'minutes',
    bronze: { value: 10, label: '10 min' },
    silver: { value: 60, label: '60 min' },
    gold: { value: 180, label: '180 min' },
  },
  {
    name: 'Reading (Pages)',
    unit: 'pages',
    bronze: { value: 5, label: '5 pages' },
    silver: { value: 20, label: '20 pages' },
    gold: { value: 40, label: '40 pages' },
  },
  {
    name: 'Workout (Duration)',
    unit: 'minutes',
    bronze: { value: 15, label: '15 min' },
    silver: { value: 35, label: '35 min' },
    gold: { value: 60, label: '60 min' },
  },
  {
    name: 'Hydration (Water)',
    unit: 'liters',
    bronze: { value: 1, label: '1 L' },
    silver: { value: 2, label: '2 L' },
    gold: { value: 3, label: '3 L' },
  },
];

export const NewHabitModal: React.FC<NewHabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingHabit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Health');
  const [icon, setIcon] = useState('Sun');
  const [color, setColor] = useState('#6366f1');
  const [monthlyGoal, setMonthlyGoal] = useState(20);

  // 3-Level Quality Configurations
  const [unit, setUnit] = useState('minutes');
  const [bronzeVal, setBronzeVal] = useState('10');
  const [bronzeLabel, setBronzeLabel] = useState('10 min');
  const [silverVal, setSilverVal] = useState('60');
  const [silverLabel, setSilverLabel] = useState('60 min');
  const [goldVal, setGoldVal] = useState('180');
  const [goldLabel, setGoldLabel] = useState('180 min');

  const [error, setError] = useState('');

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title);
      setDescription(editingHabit.description || '');
      setCategory(editingHabit.category || 'Health');
      setIcon(editingHabit.icon || 'Sun');
      setColor(editingHabit.color || '#6366f1');
      setMonthlyGoal(editingHabit.monthlyGoal || 20);

      if (editingHabit.qualityConfig) {
        setUnit(editingHabit.qualityConfig.unit);
        setBronzeVal(String(editingHabit.qualityConfig.bronze.value));
        setBronzeLabel(editingHabit.qualityConfig.bronze.label);
        setSilverVal(String(editingHabit.qualityConfig.silver.value));
        setSilverLabel(editingHabit.qualityConfig.silver.label);
        setGoldVal(String(editingHabit.qualityConfig.gold.value));
        setGoldLabel(editingHabit.qualityConfig.gold.label);
      }
      setError('');
    } else {
      setTitle('');
      setDescription('');
      setCategory('Health');
      setIcon('Sun');
      setColor('#6366f1');
      setMonthlyGoal(20);
      setUnit('steps');
      setBronzeVal('1000');
      setBronzeLabel('1,000 steps');
      setSilverVal('4000');
      setSilverLabel('4,000 steps');
      setGoldVal('8000');
      setGoldLabel('8,000 steps');
      setError('');
    }
  }, [editingHabit, isOpen]);

  if (!isOpen) return null;

  const applyPreset = (preset: typeof QUALITY_PRESETS[0]) => {
    setUnit(preset.unit);
    setBronzeVal(String(preset.bronze.value));
    setBronzeLabel(preset.bronze.label);
    setSilverVal(String(preset.silver.value));
    setSilverLabel(preset.silver.label);
    setGoldVal(String(preset.gold.value));
    setGoldLabel(preset.gold.label);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a habit title.');
      return;
    }
    if (monthlyGoal < 1 || monthlyGoal > 31) {
      setError('Monthly goal must be between 1 and 31 days.');
      return;
    }

    const bVal = Number(bronzeVal) || 1;
    const sVal = Number(silverVal) || 2;
    const gVal = Number(goldVal) || 3;

    onSave({
      id: editingHabit ? editingHabit.id : undefined,
      title: title.trim(),
      description: description.trim(),
      category,
      icon,
      color,
      monthlyGoal: Number(monthlyGoal),
      qualityConfig: {
        unit: unit.trim() || 'count',
        bronze: { value: bVal, label: bronzeLabel.trim() || `${bVal} ${unit}` },
        silver: { value: sVal, label: silverLabel.trim() || `${sVal} ${unit}` },
        gold: { value: gVal, label: goldLabel.trim() || `${gVal} ${unit}` },
      },
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 id="habit-modal-title" className="text-lg font-bold text-white">
              {editingHabit ? 'Edit Habit & 3-Tier Quality' : 'Create Habit with 3-Level Quality'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set Bronze, Silver, and Gold targets (count or duration). Gold earns daily tickets!
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="habit-title" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Habit Name *
            </label>
            <input
              id="habit-title"
              type="text"
              placeholder="e.g. Daily Walking, Deep Focus, Reading..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              autoFocus
            />
          </div>

          {/* 3-Tier Quality Configuration Section */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  3-Level Quality Configuration (Count or Duration)
                </span>
              </div>
              <span className="text-[11px] text-amber-400 font-medium">
                Gold 🥇 earns daily ticket
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
              {QUALITY_PRESETS.map((qp) => (
                <button
                  key={qp.name}
                  type="button"
                  onClick={() => applyPreset(qp)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] border border-slate-700 transition-colors"
                >
                  {qp.name}
                </button>
              ))}
            </div>

            {/* Unit Input */}
            <div>
              <label htmlFor="quality-unit" className="block text-[11px] font-semibold text-slate-400 mb-1">
                Quality Unit (e.g. steps, minutes, pages, reps, km)
              </label>
              <input
                id="quality-unit"
                type="text"
                placeholder="e.g. steps, minutes, pages"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* 3 Tier Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Bronze */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-800/40">
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500 mb-1.5">
                  <span>🥉 Bronze Level</span>
                </div>
                <input
                  type="number"
                  placeholder="Value"
                  value={bronzeVal}
                  onChange={(e) => setBronzeVal(e.target.value)}
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs mb-1.5"
                />
                <input
                  type="text"
                  placeholder="Display Label (e.g. 1,000 steps)"
                  value={bronzeLabel}
                  onChange={(e) => setBronzeLabel(e.target.value)}
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
                />
              </div>

              {/* Silver */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-300 mb-1.5">
                  <span>🥈 Silver Level</span>
                </div>
                <input
                  type="number"
                  placeholder="Value"
                  value={silverVal}
                  onChange={(e) => setSilverVal(e.target.value)}
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs mb-1.5"
                />
                <input
                  type="text"
                  placeholder="Display Label (e.g. 4,000 steps)"
                  value={silverLabel}
                  onChange={(e) => setSilverLabel(e.target.value)}
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
                />
              </div>

              {/* Gold */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/50">
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400 mb-1.5">
                  <span>🥇 Gold Level</span>
                </div>
                <input
                  type="number"
                  placeholder="Value"
                  value={goldVal}
                  onChange={(e) => setGoldVal(e.target.value)}
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs mb-1.5"
                />
                <input
                  type="text"
                  placeholder="Display Label (e.g. 8,000 steps)"
                  value={goldLabel}
                  onChange={(e) => setGoldLabel(e.target.value)}
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="habit-desc" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description or Intent (optional)
            </label>
            <input
              id="habit-desc"
              type="text"
              placeholder="e.g. Outdoor morning stride in natural light"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Monthly Goal Setting */}
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="monthly-goal" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-400" />
                Monthly Target Cadence *
              </label>
              <span className="text-sm font-bold text-indigo-400 tabular-nums">
                {monthlyGoal} days / month
              </span>
            </div>

            <input
              id="monthly-goal"
              type="range"
              min="1"
              max="31"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(Number(e.target.value))}
              className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-700/40">
              <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
              {GOAL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMonthlyGoal(preset)}
                  className={`px-2.5 py-0.5 text-xs rounded-lg transition-colors font-medium ${
                    monthlyGoal === preset
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset}d
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                    category === cat
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Icon & Color Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Icon
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {ICON_OPTIONS.slice(0, 8).map((item) => {
                  const isSelected = icon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIcon(item.id)}
                      aria-label={item.label}
                      className={`min-h-[40px] rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <item.Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Accent Theme
              </label>
              <div className="flex items-center gap-2.5 flex-wrap pt-1">
                {COLOR_OPTIONS.map((item) => {
                  const isSelected = color === item.hex;
                  return (
                    <button
                      key={item.hex}
                      type="button"
                      onClick={() => setColor(item.hex)}
                      aria-label={item.name}
                      className="min-h-[38px] min-w-[38px] rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                      style={{ backgroundColor: item.hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
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
              className="min-h-[44px] px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            >
              {editingHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
