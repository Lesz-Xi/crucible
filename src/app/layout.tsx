import type { Metadata } from "next";
import { Geist, Geist_Mono, Crimson_Pro, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Wu-Weism | Wabi-Sabi Synthesis Engine",
  description: "Synthesize ideas with a cinematic Wabi-Sabi interface.",
  icons: {
    icon: "/wu-wei-mark.png",
    shortcut: "/wu-wei-mark.png",
    apple: "/wu-wei-mark.png",
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import { LiquidGlassRuntime } from "@/components/liquid-glass/LiquidGlassRuntime";

// ... existing code ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const liquidGlassEnabled = process.env.NEXT_PUBLIC_THEME_LIQUID_GLASS_V2 !== "false";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${crimsonPro.variable} ${playfairDisplay.variable} antialiased ${liquidGlassEnabled ? "liquid-glass-v2" : ""}`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            storageKey="wu-weism-theme"
            disableTransitionOnChange
          >
            {liquidGlassEnabled ? <LiquidGlassRuntime /> : null}
            {children}
          </ThemeProvider>
      </body>
    </html>
  );
}
