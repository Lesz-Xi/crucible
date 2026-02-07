"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black flex items-center justify-center h-screen flex-col gap-4`}>
        <h2>Something went wrong!</h2>
        <button
            onClick={() => reset()}
            className="px-4 py-2 bg-black text-white rounded"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
