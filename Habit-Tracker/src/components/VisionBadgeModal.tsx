import React, { useState } from 'react';
import { X, Sparkles, Wand2, RefreshCw, Check, Image as ImageIcon } from 'lucide-react';
import { Habit, HabitVisionBadge } from '../utils/habitLogic';
import { triggerMilestoneCelebration } from '../utils/particleEffects';
import { apiFetch } from '../api';

interface VisionBadgeModalProps {
  isOpen: boolean;
  habit: Habit | null;
  onClose: () => void;
  onSaveBadge: (habitId: string, badge: HabitVisionBadge) => void;
}

const INSPIRATION_PROMPTS = [
  'Radiant dawn sun rising through mountain peaks with geometric gold lines',
  'A neon cybernetic circuit runner pulsing with electric violet energy',
  'Zen temple stone garden with floating emerald leaves and water ripples',
  'Cosmic open book with constellations and nebula clouds emerging from pages',
  'Spartan shield with roaring flame crest and polished steel borders',
];

export const VisionBadgeModal: React.FC<VisionBadgeModalProps> = ({
  isOpen,
  habit,
  onClose,
  onSaveBadge,
}) => {
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBadge, setGeneratedBadge] = useState<HabitVisionBadge | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !habit) return null;

  const currentBadge = generatedBadge || habit.visionBadge;

  const handleGenerate = async (isEdit: boolean = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await apiFetch('/api/generate-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitTitle: habit.title,
          habitCategory: habit.category,
          habitColor: habit.color,
          userPrompt: prompt || `Artistic milestone emblem for ${habit.title}`,
          editInstructions: isEdit ? editPrompt : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedBadge({
          title: data.badgeTitle || `${habit.title} Badge`,
          slogan: data.slogan || 'Every habit is a vote for who you want to become.',
          themeColor: data.themeColor || habit.color,
          badgeSvg: data.svgContent,
          unlockedAt: new Date().toISOString(),
        });
        if (isEdit) {
          setEditPrompt('');
        }
      } else {
        setError(data.error || 'Failed to generate badge.');
      }
    } catch (err) {
      setError('Connection error generating badge. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePinBadge = () => {
    if (!currentBadge) return;
    onSaveBadge(habit.id, currentBadge);
    triggerMilestoneCelebration();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vision-badge-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="vision-badge-title" className="text-lg font-bold text-white">
                Habit Vision Badge & Artwork
              </h2>
              <p className="text-xs text-slate-400">
                Use text prompts to create and edit milestone emblems with Gemini.
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Visual Showcase Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
            {currentBadge?.badgeSvg ? (
              <div
                className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl mb-3 flex items-center justify-center p-1 bg-slate-950/80 border border-slate-700/60"
                dangerouslySetInnerHTML={{ __html: currentBadge.badgeSvg }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
                style={{
                  backgroundColor: `${habit.color}25`,
                  color: habit.color,
                }}
              >
                <Sparkles className="w-12 h-12 stroke-[1.8]" />
              </div>
            )}

            <h3 className="text-base font-bold text-white mt-1">
              {currentBadge ? currentBadge.title : `${habit.title} Milestone`}
            </h3>
            <p className="text-xs text-indigo-300 italic max-w-sm mt-1">
              "{currentBadge ? currentBadge.slogan : 'Describe a vision to generate a custom motivation badge.'}"
            </p>
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="badge-prompt" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Design Prompt
            </label>
            <div className="flex gap-2">
              <input
                id="badge-prompt"
                type="text"
                placeholder="Describe visuals: colors, symbols, mood, lighting..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
              <button
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={isGenerating}
                className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* Inspiration Chips */}
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
              Inspiration Prompts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {INSPIRATION_PROMPTS.map((insp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(insp)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-left"
                >
                  "{insp.slice(0, 36)}..."
                </button>
              ))}
            </div>
          </div>

          {/* Edit / Refine existing badge */}
          {currentBadge && (
            <div className="pt-3 border-t border-slate-800">
              <label htmlFor="badge-edit" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Edit & Refine Artwork
              </label>
              <div className="flex gap-2">
                <input
                  id="badge-edit"
                  type="text"
                  placeholder="e.g. Add glowing stars, change colors to emerald green..."
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating || !editPrompt.trim()}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-indigo-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl transition-all whitespace-nowrap"
                >
                  Apply Edit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePinBadge}
            disabled={!currentBadge}
            className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Pin Badge to Habit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
