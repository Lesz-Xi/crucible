"use client";

import { cn } from "@/lib/utils";

export interface LiquidSegmentOption<T extends string> {
  value: T;
  label: string;
}

interface LiquidSegmentedControlProps<T extends string> {
  options: Array<LiquidSegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

export function LiquidSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel = "Segmented control",
}: LiquidSegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const width = options.length > 0 ? 100 / options.length : 100;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (options.length === 0) return;
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
      return;
    }
    event.preventDefault();
    if (event.key === "Home") {
      onChange(options[0].value);
      return;
    }
    if (event.key === "End") {
      onChange(options[options.length - 1].value);
      return;
    }
    const step = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (activeIndex + step + options.length) % options.length;
    onChange(options[nextIndex].value);
  };

  return (
    <div className={cn("lg-segmented", className)} role="tablist" aria-label={ariaLabel} onKeyDown={handleKeyDown}>
      <div
        className="lg-segmented-thumb"
        aria-hidden
        style={{
          width: `${width}%`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={cn("lg-segmented-item", active && "active")}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
