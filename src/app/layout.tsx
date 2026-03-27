import type { Metadata } from "next";
import { Lora, Libre_Baskerville, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "./workbench-shell.css";
import "./landing-theme.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LiquidGlassRuntime } from "@/components/liquid-glass/LiquidGlassRuntime";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

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
    icon: "/wu-logo.png",
    shortcut: "/wu-logo.png",
    apple: "/wu-logo.png",
  },
  openGraph: {
    title: "Wu-Weism",
    description: "Instrument-grade scientific workspace for causal inquiry, provenance, and BYOK research.",
    images: [
      {
        url: "/wu-logo.png",
        alt: "Wu-Weism mark",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Wu-Weism",
    description: "Instrument-grade scientific workspace for causal inquiry, provenance, and BYOK research.",
    images: ["/wu-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${lora.variable} ${libreBaskerville.variable} ${ibmPlexMono.variable}`}>
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
