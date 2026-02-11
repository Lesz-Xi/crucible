'use client';

import { useEffect } from 'react';

export function LandingThemeLock() {
  useEffect(() => {
    const root = document.documentElement;
    const previousDark = root.classList.contains('dark');
    const previousLight = root.classList.contains('light');

    root.classList.remove('dark');
    root.classList.add('light');

    return () => {
      root.classList.remove('light');
      if (previousDark) {
        root.classList.add('dark');
      }
      if (previousLight) {
        root.classList.add('light');
      }
    };
  }, []);

  return null;
}
