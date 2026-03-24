import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface QualiaBarProps {
  label: string;
  value: number; // 0.0 to 1.0
  icon: LucideIcon;
  colorClass: string; // e.g., "bg-emerald-500"
  description?: string;
}

export function QualiaBar({ label, value, icon: Icon, colorClass, description }: QualiaBarProps) {
  // Clamp value between 0 and 1
  const clampedValue = Math.max(0, Math.min(1, value));
  const percentage = Math.round(clampedValue * 100);

  return (
    <div className="group relative">
        <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-[10px] font-mono font-medium text-stone-600 uppercase tracking-wider">
                    {label}
                </span>
            </div>
            <span className="text-[10px] font-mono text-stone-500">
                {percentage}%
            </span>
        </div>
        
        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200/50">
            <div 
                className={cn("h-full transition-all duration-1000 ease-out rounded-full", colorClass)}
                style={{ width: `${percentage}%` }}
            />
        </div>

        {/* Tooltip on hover */}
        {description && (
            <div className="absolute left-0 -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-stone-800 text-stone-50 text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">
                {description}
                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-stone-800 rotate-45" />
            </div>
        )}
    </div>
  );
}
