"use client";

/**
 * FlickeringGrid — canvas-based dot-matrix grid with optional text mask.
 *
 * Adapted from the flickering-footer reference. Replaces the `color-bits`
 * dependency with a plain hex→rgba helper — safe for all MASA palette values.
 *
 * Pauses animation via IntersectionObserver when the canvas is off-screen.
 * Fully SSR-safe: all canvas/window calls are inside useEffect.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ── Hex → rgba converter (replaces color-bits) ─────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  // Support 3-char shorthand (#abc → #aabbcc)
  const full = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  /** Hex color string (e.g. "#c8965a") */
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: number | string;
}

// ── Component ───────────────────────────────────────────────────────────────

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 3,
  gridGap = 3,
  flickerChance = 0.2,
  color = "#c8965a",
  width,
  height,
  className,
  maxOpacity = 0.15,
  text = "",
  fontSize = 140,
  fontWeight = 600,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Pre-compute the base RGBA string once
  const baseColor = useMemo(() => hexToRgba(color, 1), [color]);

  // ── Draw one frame ────────────────────────────────────────────────────────

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvasW: number,
      canvasH: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number,
    ) => {
      ctx.clearRect(0, 0, canvasW, canvasH);

      // Off-screen canvas for text mask
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = canvasW;
      maskCanvas.height = canvasH;
      const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!maskCtx) return;

      if (text) {
        maskCtx.save();
        maskCtx.scale(dpr, dpr);
        maskCtx.fillStyle = "white";
        maskCtx.font = `${fontWeight} ${fontSize}px "IBM Plex Mono", "JetBrains Mono", monospace`;
        maskCtx.textAlign = "center";
        maskCtx.textBaseline = "middle";
        maskCtx.fillText(text, canvasW / (2 * dpr), canvasH / (2 * dpr));
        maskCtx.restore();
      }

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * (squareSize + gridGap) * dpr;
          const y = j * (squareSize + gridGap) * dpr;
          const sw = squareSize * dpr;
          const sh = squareSize * dpr;

          // Check if this cell overlaps the text mask
          const maskData = maskCtx.getImageData(x, y, sw, sh).data;
          const hasText = maskData.some((v, idx) => idx % 4 === 0 && v > 0);

          const opacity = squares[i * rows + j];
          // Cells inside text are visibly brighter
          const finalOpacity = hasText
            ? Math.min(1, opacity * 3 + 0.4)
            : opacity;

          // Derive RGBA from precomputed base color
          ctx.fillStyle = hexToRgba(color, finalOpacity);
          ctx.fillRect(x, y, sw, sh);
        }
      }
    },
    [color, squareSize, gridGap, text, fontSize, fontWeight],
  );

  // ── Setup canvas dimensions + initial squares ────────────────────────────

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const cols = Math.ceil(w / (squareSize + gridGap));
      const rows = Math.ceil(h / (squareSize + gridGap));
      const squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity;
      }
      return { cols, rows, squares, dpr };
    },
    [squareSize, gridGap, maxOpacity],
  );

  // ── Flicker step ─────────────────────────────────────────────────────────

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[i] = Math.random() * maxOpacity;
        }
      }
    },
    [flickerChance, maxOpacity],
  );

  // ── Animation loop ────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let gridParams: ReturnType<typeof setupCanvas>;
    let animationFrameId: number;
    let lastTime = performance.now();

    // IntersectionObserver — pause when off-screen
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    // ResizeObserver — recalculate on container size change
    const resizeObserver = new ResizeObserver(() => {
      const newWidth = width ?? container.clientWidth;
      const newHeight = height ?? container.clientHeight;
      setCanvasSize({ width: newWidth, height: newHeight });
      gridParams = setupCanvas(canvas, newWidth, newHeight);
    });
    resizeObserver.observe(container);

    // Initial setup
    const initWidth = width ?? container.clientWidth;
    const initHeight = height ?? container.clientHeight;
    setCanvasSize({ width: initWidth, height: initHeight });
    gridParams = setupCanvas(canvas, initWidth, initHeight);

    function animate(time: number) {
      if (!isInView) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      updateSquares(gridParams.squares, deltaTime);
      drawGrid(
        ctx!,
        canvas!.width,
        canvas!.height,
        gridParams.cols,
        gridParams.rows,
        gridParams.squares,
        gridParams.dpr,
      );
      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupCanvas, updateSquares, drawGrid, width, height]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: width ?? "100%", height: height ?? "100%" }}
      {...props}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          display: "block",
        }}
      />
    </div>
  );
};
