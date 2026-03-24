'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function LandingThemeLock() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Align next-themes state + DOM classes.
    setTheme('light');

    const forceLight = () => {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
    };

    forceLight();

    // Guard against any late class flips while landing page is mounted.
    const observer = new MutationObserver(() => {
      if (root.classList.contains('dark') || body.classList.contains('dark')) {
        forceLight();
      }
    });

    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    observer.observe(body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [setTheme]);

  return null;
}
