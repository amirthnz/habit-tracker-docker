import React, { useState } from 'react';
import {
  Ticket,
  Plus,
  Sparkles,
  ShoppingBag,
  Trash2,
  Check,
  Film,
  Utensils,
  Coffee,
  Compass,
  Gift,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Prize, PrizeRedemption } from '../utils/habitLogic';
import { triggerMilestoneCelebration, triggerGoalAchievedFanfare } from '../utils/particleEffects';
import { soundManager } from '../utils/soundEffects';

interface PrizeShopViewProps {
  prizes: Prize[];
  redemptions: PrizeRedemption[];
  ticketBalance: number;
  totalEarnedTickets: number;
  earnedTicketDates: string[];
  onOpenNewPrize: () => void;
  onRedeemPrize: (prize: Prize) => void;
  onDeletePrize: (prizeId: string) => void;
}

export const PrizeShopView: React.FC<PrizeShopViewProps> = ({
  prizes,
  redemptions,
  ticketBalance,
  totalEarnedTickets,
  earnedTicketDates,
  onOpenNewPrize,
  onRedeemPrize,
  onDeletePrize,
}) => {
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const handleRedeem = (prize: Prize) => {
    if (ticketBalance < prize.ticketCost) return;
    setRedeemingId(prize.id);
    soundManager.playCelebrationChime();
    triggerGoalAchievedFanfare();
    onRedeemPrize(prize);
    setTimeout(() => {
      setRedeemingId(null);
    }, 800);
  };

  const getPrizeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Utensils':
        return <Utensils className="w-5 h-5 text-amber-400" />;
      case 'Film':
        return <Film className="w-5 h-5 text-indigo-400" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-rose-400" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-emerald-400" />;
      default:
        return <Gift className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Ticket Vault Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/70 border border-amber-500/30 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              <Ticket className="w-4 h-4 fill-amber-400/20" />
              <span>Ticket Vault & Rewards Store</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Spend Your Hard-Earned Tickets
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Earn 1 🎫️ Ticket each day you hit <strong>Gold Quality</strong> across every single habit. Redeem your tickets here for real-life rewards!
            </p>
          </div>

          {/* Ticket Balance Cards */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Available Balance */}
            <div className="bg-amber-500/15 border border-amber-400/40 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg shadow-amber-500/10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-extrabold shadow-md">
                <Ticket className="w-6 h-6 fill-slate-950" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums">
                  {ticketBalance}
                </div>
                <div className="text-xs font-semibold text-amber-200/80">
                  Available Tickets
                </div>
              </div>
            </div>

            {/* Total Earned & Redeemed stats */}
            <div className="hidden sm:flex flex-col gap-1.5 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
              <div>
                Lifetime Earned:{' '}
                <strong className="text-amber-400 tabular-nums font-bold">
                  {totalEarnedTickets} 🎫️
                </strong>
              </div>
              <div>
                Redeemed:{' '}
                <strong className="text-indigo-300 tabular-nums font-bold">
                  {redemptions.length} gifts
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Perfect Gold Days ticker */}
        {earnedTicketDates.length > 0 && (
          <div className="mt-5 pt-3 border-t border-amber-500/20 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-amber-300/80 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Perfect Gold Days:
            </span>
            {earnedTicketDates.slice(-6).map((dateStr) => (
              <span
                key={dateStr}
                className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/25 text-[11px] font-mono font-medium"
              >
                🎫️ {dateStr}
              </span>
            ))}
            {earnedTicketDates.length > 6 && (
              <span className="text-[11px] text-slate-400">
                +{earnedTicketDates.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Prize Shop Header & Action */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            Reward Catalog
          </h2>
          <p className="text-xs text-slate-400">
            Set your own desired rewards and the ticket cost required to unlock them.
          </p>
        </div>

        <button
          onClick={onOpenNewPrize}
          className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Custom Prize</span>
        </button>
      </div>

      {/* Prizes Grid */}
      {prizes.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
          <Gift className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No prizes configured yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
            Create motivating rewards like movie tickets, cheat meals, or travel!
          </p>
          <button
            onClick={onOpenNewPrize}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
          >
            Add Your First Prize
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prizes.map((prize) => {
            const canAfford = ticketBalance >= prize.ticketCost;
            const diffNeeded = prize.ticketCost - ticketBalance;

            return (
              <div
                key={prize.id}
                className={`relative rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between ${
                  canAfford
                    ? 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700/60'
                }`}
              >
                <div>
                  {/* Top: Icon, Ticket Cost Badge, and Delete Button */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0">
                      {getPrizeIcon(prize.icon)}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                        <Ticket className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="tabular-nums font-extrabold">
                          {prize.ticketCost}
                        </span>
                        <span>{prize.ticketCost === 1 ? 'Ticket' : 'Tickets'}</span>
                      </div>

                      <button
                        onClick={() => onDeletePrize(prize.id)}
                        aria-label={`Delete ${prize.title}`}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white mb-1 leading-snug">
                    {prize.title}
                  </h3>

                  {prize.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                      {prize.description}
                    </p>
                  )}
                </div>

                {/* Bottom: Redeem Action */}
                <div className="pt-3 border-t border-slate-800/80 mt-2">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-slate-400">Times Claimed:</span>
                    <span className="font-semibold text-slate-200 tabular-nums">
                      {prize.redeemedCount}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRedeem(prize)}
                    disabled={!canAfford}
                    className={`w-full min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-98 cursor-pointer'
                        : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                    }`}
                  >
                    {redeemingId === prize.id ? (
                      <Check className="w-4 h-4 stroke-[3] animate-bounce" />
                    ) : canAfford ? (
                      <>
                        <Ticket className="w-4 h-4 fill-slate-950" />
                        <span>Redeem Prize (-{prize.ticketCost} 🎫️)</span>
                      </>
                    ) : (
                      <span>Need {diffNeeded} more 🎫️ to unlock</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Redemption Log */}
      {redemptions.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Redemption History Log
          </h3>

          <div className="divide-y divide-slate-800">
            {redemptions.slice(-8).reverse().map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-white">{r.prizeTitle}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="text-amber-400 font-semibold tabular-nums">
                    -{r.ticketCost} 🎫️
                  </span>
                  <span>{new Date(r.redeemedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
