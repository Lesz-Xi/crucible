import type { Metadata } from "next";
import "./globals.css";
import "./workbench-shell.css";
import "./landing-theme.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LiquidGlassRuntime } from "@/components/liquid-glass/LiquidGlassRuntime";

const metadataBase =
  process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : process.env.VERCEL_URL
      ? new URL(`https://${process.env.VERCEL_URL}`)
      : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Wu-Weism",
    template: "%s | Wu-Weism",
  },
  description: "Instrument-grade scientific workspace for causal inquiry, provenance, and BYOK research.",
  applicationName: "Wu-Weism",
  icons: {
    icon: "/wu-wei-mark-true-alpha.png",
    shortcut: "/wu-wei-mark-true-alpha.png",
    apple: "/wu-wei-mark-true-alpha.png",
  },
  openGraph: {
    title: "Wu-Weism",
    description: "Instrument-grade scientific workspace for causal inquiry, provenance, and BYOK research.",
    images: [
      {
        url: "/wu-wei-mark-true-alpha.png",
        alt: "Wu-Weism mark",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Wu-Weism",
    description: "Instrument-grade scientific workspace for causal inquiry, provenance, and BYOK research.",
    images: ["/wu-wei-mark-true-alpha.png"],
  },
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
