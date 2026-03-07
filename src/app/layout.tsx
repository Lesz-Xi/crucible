import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LiquidGlassRuntime } from "@/components/liquid-glass/LiquidGlassRuntime";

export const metadata: Metadata = {
  title: "Crucible - Automated Scientist",
  description: "Sovereign Synthesis Engine",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const isMarketingLight = requestHeaders.get("x-theme-scope") === "marketing-light";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme-scope={isMarketingLight ? "marketing-light" : undefined}
      style={isMarketingLight ? { colorScheme: "light" } : undefined}
    >
      <body
        className="antialiased"
        data-theme-scope={isMarketingLight ? "marketing-light" : undefined}
        style={isMarketingLight ? { colorScheme: "light" } : undefined}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          forcedTheme={isMarketingLight ? "light" : undefined}
          storageKey="wu-weism-theme"
          disableTransitionOnChange
        >
          <LiquidGlassRuntime />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
