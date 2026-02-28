'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function LandingThemeLock() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Align next-themes state + DOM classes.
    setTheme('dark');

    const forceDark = () => {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
      body.classList.add('dark');
    };

    forceDark();

    // Guard against any late class flips while landing page is mounted.
    const observer = new MutationObserver(() => {
      if (root.classList.contains('light') || body.classList.contains('light')) {
        forceDark();
      }
    });

    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    observer.observe(body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [setTheme]);

  return null;
}
