"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface LiquidSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  ariaLabel?: string;
}

export function LiquidSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  className,
  ariaLabel = "Liquid slider",
}: LiquidSliderProps) {
  const percent = useMemo(() => {
    if (max <= min) return 0;
    return ((value - min) / (max - min)) * 100;
  }, [min, max, value]);

  return (
    <label className={cn("lg-slider w-full", className)}>
      <span className="sr-only">{ariaLabel}</span>
      <input
        type="range"
        className="lg-slider-input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ ["--lg-slider-percent" as string]: `${percent}%` }}
        aria-label={ariaLabel}
      />
    </label>
  );
}

