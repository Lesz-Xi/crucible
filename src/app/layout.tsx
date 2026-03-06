import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LiquidGlassRuntime } from "@/components/liquid-glass/LiquidGlassRuntime";

export const metadata: Metadata = {
  title: "Crucible - Automated Scientist",
  description: "Sovereign Synthesis Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
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
