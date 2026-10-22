import confetti from 'canvas-confetti';

/**
 * Trigger dynamic particle bursts
 */

export function triggerCompletionBurst(x?: number, y?: number, colorHex?: string) {
  // If coordinates are provided, normalize to 0-1 for canvas-confetti
  const origin = {
    x: x !== undefined ? Math.max(0.1, Math.min(0.9, x / window.innerWidth)) : 0.5,
    y: y !== undefined ? Math.max(0.1, Math.min(0.9, y / window.innerHeight)) : 0.5,
  };

  const colors = colorHex 
    ? [colorHex, '#f59e0b', '#ec4899', '#6366f1', '#10b981', '#38bdf8']
    : ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#fbbf24'];

  // Sharp initial burst
  confetti({
    particleCount: 45,
    spread: 60,
    startVelocity: 35,
    origin,
    colors,
    ticks: 200,
    gravity: 0.9,
    scalar: 1,
    shapes: ['circle', 'square'],
    disableForReducedMotion: true,
  });

  // Sparkle stars
  setTimeout(() => {
    confetti({
      particleCount: 25,
      spread: 90,
      startVelocity: 25,
      origin,
      colors: ['#ffd700', '#ffffff', colorHex || '#38bdf8'],
      ticks: 150,
      gravity: 0.6,
      scalar: 1.2,
      shapes: ['star'],
      disableForReducedMotion: true,
    });
  }, 75);
}

/**
 * Special milestone or streak burst
 */
export function triggerMilestoneCelebration() {
  const duration = 1200;
  const animationEnd = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981'],
      disableForReducedMotion: true,
    });

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

/**
 * Super celebratory goal achieved fanfare
 */
export function triggerGoalAchievedFanfare() {
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#10b981', '#fbbf24', '#38bdf8', '#818cf8', '#f43f5e'],
    disableForReducedMotion: true,
  });
}
