"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme } from "next-themes";

function ThemeAttributeSync() {
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    if (!resolvedTheme) return;

    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.body.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeAttributeSync />
      {children}
    </NextThemesProvider>
  );
}
