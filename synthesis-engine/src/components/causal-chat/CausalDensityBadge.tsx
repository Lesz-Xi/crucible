import React from 'react';
import { Leaf, Wind, Flower2, CircleDashed } from 'lucide-react';

interface CausalDensityBadgeProps {
  level: 'L0' | 'L1' | 'L2' | 'L3';
  score: number;
  label: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LEVEL_CONFIG = {
  L0: {
    color: 'text-[#C4A77D]', // wabi-clay
    bgColor: 'bg-[#2A2621]', // sidebar-bg
    borderColor: 'border-[#3E3830]', // sidebar-border
    icon: CircleDashed,
    description: 'Associational: Surface-level patterns',
    gradient: 'from-[#2A2621] to-[#2C2824]'
  },
  L1: {
    color: 'text-[#C4A77D]',
    bgColor: 'bg-[#2A2621]',
    borderColor: 'border-[#3E3830]',
    icon: Leaf,
    description: 'Correlational: Statistical relationships',
    gradient: 'from-[#2A2621] to-[#2C2824]'
  },
  L2: {
    color: 'text-[#C4A77D]',
    bgColor: 'bg-[#2A2621]',
    borderColor: 'border-[#3E3830]',
    icon: Wind,
    description: 'Interventional: Cause-and-effect reasoning',
    gradient: 'from-[#2A2621] to-[#2C2824]'
  },
  L3: {
    color: 'text-[#C4A77D]',
    bgColor: 'bg-[#2A2621]',
    borderColor: 'border-[#3E3830]',
    icon: Flower2,
    description: 'Counterfactual: Deep explanatory mechanisms',
    gradient: 'from-[#2A2621] to-[#2C2824]'
  }
};

const SIZE_CONFIG = {
  sm: {
    container: 'px-3 py-1.5 text-xs',
    icon: 'w-3 h-3',
    badge: 'text-xs',
    score: 'text-[10px]'
  },
  md: {
    container: 'px-4 py-2 text-sm',
    icon: 'w-4 h-4',
    badge: 'text-sm',
    score: 'text-xs'
  },
  lg: {
    container: 'px-5 py-3 text-base',
    icon: 'w-5 h-5',
    badge: 'text-base',
    score: 'text-sm'
  }
};

export function CausalDensityBadge({
  level,
  score,
  label,
  showTooltip = true,
  size = 'md'
}: CausalDensityBadgeProps) {
  const config = LEVEL_CONFIG[level];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <div className="group/badge relative inline-flex">
      {/* Enhanced Badge */}
      <div
        className={`
          inline-flex items-center gap-2.5 rounded-full 
          ${config.bgColor} ${config.borderColor} ${config.color}
          ${config.gradient} bg-gradient-to-br
          border shadow-sm backdrop-blur-md
          ${sizeConfig.container}
          transition-all duration-300 ease-out
          hover:scale-[1.02] hover:shadow-md hover:bg-opacity-20
          animate-in fade-in slide-in-from-bottom-1
          cursor-default select-none
        `}
      >
        {/* Helper Icon */}
        <Icon 
          className={`${sizeConfig.icon} opacity-80`} 
          strokeWidth={2}
        />
        
        {/* Single Line Content: Level - Label */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className={`font-bold tracking-tight ${sizeConfig.badge} font-mono opacity-80 mix-blend-screen`}>
            {level}
          </span>
          <span className={`font-medium ${sizeConfig.badge} text-[#D4CFC6]`}>
            {label}
          </span>
        </div>

        {/* Vertical Divider */}
        <div className={`w-px h-3 bg-current opacity-20 mx-0.5`} />

        {/* Score */}
        <span className={`font-mono font-medium tracking-tight opacity-90 ${sizeConfig.score}`}>
          ~{score}%
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={`
            absolute bottom-full left-1/2 -translate-x-1/2 mb-3
            px-4 py-2.5 rounded-xl
            bg-zinc-900/80 backdrop-blur-md text-amber-50
            text-xs font-medium tracking-wide
            whitespace-nowrap pointer-events-none
            opacity-0 group-hover/badge:opacity-100
            transition-all duration-300 ease-out transform group-hover/badge:translate-y-0 translate-y-2
            shadow-2xl border border-white/10
            z-50 min-w-max
          `}
        >
          <span className="text-amber-200/90 mr-2 font-semibold">
            {level === 'L3' ? 'Counterfactual:' : level === 'L2' ? 'Interventional:' : level === 'L1' ? 'Correlational:' : 'Associational:'}
          </span>
          <span className="opacity-90 text-wabi-sand font-normal">
             {level === 'L3' ? 'Deep explanatory mechanisms' : level === 'L2' ? 'Cause-and-effect reasoning' : level === 'L1' ? 'Statistical relationships' : 'Surface-level patterns'}
          </span>
          <span className="block mt-1 text-[10px] text-wabi-stone/80">
             Heuristic confidence estimate (not an exact probability)
          </span>
          
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
            <div className="border-[6px] border-transparent border-t-zinc-900/80" />
          </div>
        </div>
      )}
    </div>
  );
}

// Convenience wrapper for streaming updates with animation
export function AnimatedCausalDensityBadge({
  level,
  score,
  label,
  showTooltip = true,
  size = 'md'
}: CausalDensityBadgeProps) {
  const [displayScore, setDisplayScore] = React.useState(0);

  React.useEffect(() => {
    // Animate score count-up
    const duration = 800;
    const steps = 30;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  return (
    <CausalDensityBadge
      level={level}
      score={displayScore}
      label={label}
      showTooltip={showTooltip}
      size={size}
    />
  );
}
