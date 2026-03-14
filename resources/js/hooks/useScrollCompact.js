import React from 'react';

export function useScrollCompact(options = {}) {
  const {
    enterY = 120,
    exitY = 24,
    lockMs = 320,
    minTravelAfterToggle = 80,
    initialCompact = false,
    disabled = false,
  } = options;

  const [isCompact, setIsCompact] = React.useState(initialCompact);
  const lastToggleAtRef = React.useRef(0);
  const lastToggleYRef = React.useRef(0);
  const hasToggledRef = React.useRef(false);
  const lastYRef = React.useRef(0);

  React.useEffect(() => {
    if (typeof window === 'undefined' || disabled) return undefined;

    const initialY = window.scrollY || window.pageYOffset || 0;
    lastToggleYRef.current = initialY;
    lastYRef.current = initialY;

    let ticking = false;

    const update = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const prevY = lastYRef.current;
      const delta = y - prevY;
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

      // Ignore tiny jitter from layout/sticky recalculations.
      if (Math.abs(delta) < 2) {
        lastYRef.current = y;
        ticking = false;
        return;
      }

      setIsCompact((prev) => {
        if (now - lastToggleAtRef.current < lockMs) return prev;

        if (!prev && delta > 0 && y >= enterY) {
          if (hasToggledRef.current && Math.abs(y - lastToggleYRef.current) < minTravelAfterToggle) {
            return prev;
          }
          lastToggleAtRef.current = now;
          lastToggleYRef.current = y;
          hasToggledRef.current = true;
          return true;
        }

        if (prev && delta < 0 && y <= exitY) {
          // Expanding near the top must remain responsive; do not gate with travel distance.
          lastToggleAtRef.current = now;
          lastToggleYRef.current = y;
          hasToggledRef.current = true;
          return false;
        }

        return prev;
      });

      lastYRef.current = y;

      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [enterY, exitY, lockMs, minTravelAfterToggle, disabled]);

  return isCompact;
}

export default useScrollCompact;