'use client';

import { useLayoutEffect } from 'react';

export function LandingThemeLock() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const previousHtmlScope = html.getAttribute('data-theme-scope');
    const previousBodyScope = body.getAttribute('data-theme-scope');
    const previousHtmlColorScheme = html.style.colorScheme;
    const previousBodyColorScheme = body.style.colorScheme;

    html.setAttribute('data-theme-scope', 'marketing-light');
    body.setAttribute('data-theme-scope', 'marketing-light');
    html.style.colorScheme = 'light';
    body.style.colorScheme = 'light';

    return () => {
      if (previousHtmlScope) {
        html.setAttribute('data-theme-scope', previousHtmlScope);
      } else {
        html.removeAttribute('data-theme-scope');
      }

      if (previousBodyScope) {
        body.setAttribute('data-theme-scope', previousBodyScope);
      } else {
        body.removeAttribute('data-theme-scope');
      }

      html.style.colorScheme = previousHtmlColorScheme;
      body.style.colorScheme = previousBodyColorScheme;
    };
  }, []);

  return null;
}
