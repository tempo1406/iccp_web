'use client';

let activeScrollAnimationFrame: number | null = null;

function easeInOutCubic(progress: number): number {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

export function scrollToLandingSection(hash: string, offset = 104): boolean {
  if (typeof window === 'undefined' || !hash.startsWith('#') || hash.length <= 1) {
    return false;
  }

  const targetId = decodeURIComponent(hash.slice(1));
  const target = document.getElementById(targetId);
  if (!target) return false;

  const startTop = window.scrollY;
  const targetTop = Math.max(
    0,
    target.getBoundingClientRect().top + window.scrollY - offset,
  );
  const distance = targetTop - startTop;

  if (Math.abs(distance) < 2) {
    window.history.replaceState(null, '', hash);
    return true;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    window.scrollTo({ top: targetTop, behavior: 'auto' });
    window.history.replaceState(null, '', hash);
    return true;
  }

  if (activeScrollAnimationFrame !== null) {
    window.cancelAnimationFrame(activeScrollAnimationFrame);
  }

  const duration = Math.min(1100, Math.max(520, Math.abs(distance) * 0.75));
  const startTime = performance.now();

  const tick = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(progress);
    window.scrollTo({
      top: startTop + distance * easedProgress,
      behavior: 'auto',
    });

    if (progress < 1) {
      activeScrollAnimationFrame = window.requestAnimationFrame(tick);
      return;
    }

    activeScrollAnimationFrame = null;
    window.history.replaceState(null, '', hash);
  };

  activeScrollAnimationFrame = window.requestAnimationFrame(tick);
  return true;
}
