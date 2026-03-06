"use client";

import "./globals.css";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen flex-col items-center justify-center gap-4 bg-white text-black antialiased">
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
