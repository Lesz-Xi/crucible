import type { Metadata } from "next";
import { headers } from "next/headers";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LiquidGlassRuntime } from "@/components/liquid-glass/LiquidGlassRuntime";

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-serif",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

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
  const isMarketingDark = requestHeaders.get("x-theme-scope") === "marketing-dark";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      data-theme-scope={isMarketingDark ? "marketing-dark" : undefined}
      style={isMarketingDark ? { colorScheme: "dark" } : undefined}
    >
      <body
        className="antialiased"
        data-theme-scope={isMarketingDark ? "marketing-dark" : undefined}
        style={isMarketingDark ? { colorScheme: "dark" } : undefined}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          forcedTheme={isMarketingDark ? "dark" : undefined}
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
