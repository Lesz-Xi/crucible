// GridLines — full-page fixed CSS grid overlay
// Server Component: no hooks, no event handlers, no "use client" needed.
// z-0 sits behind all content (hd-section = z-1, main = z-10, Navbar = z-30).
// pointer-events: none ensures all clicks and scroll events pass through.

export function GridLines() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 25,
        pointerEvents: "none",
        backgroundImage: [
          "linear-gradient(var(--landing-grid-line) 1px, transparent 1px)",
          "linear-gradient(90deg, var(--landing-grid-line) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "80px 80px",
      }}
    />
  );
}
