/**
 * Enhanced Slider Component
 * 
 * Advanced slider with:
 * - Research-based tooltips
 * - Color-coded feedback zones (Green 7-10, Amber 4-6, Red 0-3)
 * - Smart contextual recommendations
 * - Validation warnings
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ResearchTooltip } from './ResearchTooltip';
import { CheckCircle, Info } from 'lucide-react';

export interface SliderMetadata {
  label: string;
  tooltipTitle: string;
  tooltipDescription: string;
  research: {
    citation: string;
    url?: string;
  };
  lowValueWarning?: string;   // Warning shown when value is 0-3
  recommendations?: {
    low: string;     // 0-3: Needs attention
    medium: string;  // 4-6: Watch zone
    high: string;    // 7-10: Healthy
  };
}

interface EnhancedSliderProps {
  value: number;
  onChange: (value: number) => void;
  metadata: SliderMetadata;
  max?: number;
  description?: string;
  showRecommendations?: boolean;
}

/**
 * Get color zone for slider value
 */
function getColorZone(value: number, max: number = 10): 'red' | 'amber' | 'green' {
  const normalizedValue = (value / max) * 10;
  if (normalizedValue <= 3) return 'red';
  if (normalizedValue <= 6) return 'amber';
  return 'green';
}

/**
 * Get color classes based on zone
 */
function getZoneStyles(zone: 'red' | 'amber' | 'green') {
  switch (zone) {
    case 'red':
      return {
        track: 'bg-wabi-rust/40',
        thumb: 'bg-wabi-rust',
        text: 'text-wabi-rust',
        bg: 'bg-wabi-rust/10',
        border: 'border-wabi-rust/30',
        icon: <Info className="w-4 h-4" />
      };
    case 'amber':
      return {
        track: 'bg-wabi-clay/40',
        thumb: 'bg-wabi-clay',
        text: 'text-wabi-clay',
        bg: 'bg-wabi-clay/10',
        border: 'border-wabi-clay/30',
        icon: <Info className="w-4 h-4" />
      };
    case 'green':
      return {
        track: 'bg-wabi-moss/40',
        thumb: 'bg-wabi-moss',
        text: 'text-wabi-moss',
        bg: 'bg-wabi-moss/10',
        border: 'border-wabi-moss/30',
        icon: <CheckCircle className="w-4 h-4" />
      };
  }
}

export function EnhancedSlider({
  value: externalValue,
  onChange,
  metadata,
  max = 10,
  description,
  showRecommendations = true
}: EnhancedSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [internalValue, setInternalValue] = useState(externalValue);
  
  // Sync internal value with external value
  useEffect(() => {
    setInternalValue(externalValue);
  }, [externalValue]);
  
  // Calculate color zone and recommendation using internal value
  const zone = useMemo(() => getColorZone(internalValue, max), [internalValue, max]);
  const styles = useMemo(() => getZoneStyles(zone), [zone]);
  
  const recommendation = useMemo(() => {
    if (!metadata.recommendations || !showRecommendations) return null;
    
    const normalizedValue = (internalValue / max) * 10;
    if (normalizedValue <= 3) return metadata.recommendations.low;
    if (normalizedValue <= 6) return metadata.recommendations.medium;
    return metadata.recommendations.high;
  }, [internalValue, max, metadata.recommendations, showRecommendations]);
  
  // Show validation warning for very low values
  const showWarning = internalValue <= (max * 0.3) && metadata.lowValueWarning;
  
  return (
    <div className="space-y-3">
      {/* Label with Research Tooltip */}
      <div className="flex justify-between items-center">
        <ResearchTooltip
          title={metadata.tooltipTitle}
          description={metadata.tooltipDescription}
          research={metadata.research}
        >
          <label className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] cursor-help">
            {metadata.label}
          </label>
        </ResearchTooltip>
        
        {/* Value Display with Color */}
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 ${styles.text}`}>
            {styles.icon}
          </div>
          <span className={`font-mono text-sm font-semibold ${styles.text}`}>
            {internalValue}/{max}
          </span>
        </div>
      </div>
      
      {/* Slider with Color-Coded Track */}
      <div className="relative flex items-center">
        {/* Visual zones background */}
        <div className="absolute w-full h-2 rounded-full overflow-hidden pointer-events-none bg-[var(--border-subtle)]/60">
          <div className="absolute left-0 w-[30%] h-full bg-wabi-rust/25" />
          <div className="absolute left-[30%] w-[30%] h-full bg-wabi-clay/25" />
          <div className="absolute left-[60%] w-[40%] h-full bg-wabi-moss/25" />
        </div>
        
        <input
          type="range"
          min="0"
          max={max}
          value={internalValue}
          onChange={(e) => {
            const newValue = parseInt(e.target.value, 10);
            if (!isNaN(newValue)) {
              setInternalValue(newValue);
              onChange(newValue);
            }
          }}
          onInput={(e) => {
            const newValue = parseInt((e.target as HTMLInputElement).value, 10);
            if (!isNaN(newValue)) {
              setInternalValue(newValue);
              onChange(newValue);
            }
          }}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className={`relative w-full h-6 rounded-full appearance-none cursor-pointer bg-transparent flex items-center
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:${styles.thumb}
            [&::-webkit-slider-thumb]:border-[2px]
            [&::-webkit-slider-thumb]:border-[var(--bg-primary)]
            [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_10px_rgba(0,0,0,0.18)]
            [&::-webkit-slider-thumb]:transition-all
            [&::-webkit-slider-thumb]:duration-200
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:hover:shadow-[0_0_0_2px_rgba(255,255,255,0.6),0_6px_12px_rgba(0,0,0,0.22)]
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:${styles.thumb}
            [&::-moz-range-thumb]:border-[2px]
            [&::-moz-range-thumb]:border-[var(--bg-primary)]
            [&::-moz-range-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_10px_rgba(0,0,0,0.18)]
            [&::-moz-range-thumb]:transition-all
            [&::-moz-range-thumb]:duration-200
            [&::-moz-range-thumb]:hover:scale-110
            [&::-moz-range-thumb]:hover:shadow-[0_0_0_2px_rgba(255,255,255,0.6),0_6px_12px_rgba(0,0,0,0.22)]
            ${isDragging ? '[&::-webkit-slider-thumb]:scale-115 [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.3)] [&::-moz-range-thumb]:scale-115 [&::-moz-range-thumb]:shadow-[0_0_0_3px_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.3)]' : ''}
          `}
        />
        
        {/* Zone Labels */}
        <div className="relative w-full text-[10px] font-medium mt-2">
          <div className="absolute left-[15%] -translate-x-1/2 text-wabi-rust whitespace-nowrap">
            Needs care
          </div>
          <div className="absolute left-[45%] -translate-x-1/2 text-wabi-clay whitespace-nowrap">
            Steady
          </div>
          <div className="absolute left-[80%] -translate-x-1/2 text-wabi-moss whitespace-nowrap">
            Strong
          </div>
        </div>
        {/* Spacer to prevent label overlap with content below */}
        <div className="h-4" />
      </div>
      
      {/* Description */}
      {description && (
        <p className="text-xs text-[var(--text-tertiary)]">{description}</p>
      )}
      
      {/* Validation Warning */}
      {showWarning && (
        <div className={`p-3 rounded-lg ${styles.bg} border ${styles.border} flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200`}>
          <Info className={`w-4 h-4 ${styles.text} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className={`text-xs font-medium ${styles.text} mb-1`}>Gentle note</p>
            <p className="text-xs text-[var(--text-secondary)]">{metadata.lowValueWarning}</p>
          </div>
        </div>
      )}
      
      {/* Smart Recommendation */}
      {recommendation && !showWarning && (
        <div className={`p-3 rounded-lg ${styles.bg} border ${styles.border} flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200`}>
          <div className={`${styles.text} flex-shrink-0 mt-0.5`}>
            {styles.icon}
          </div>
          <div className="flex-1">
            <p className={`text-xs font-medium ${styles.text} mb-1`}>
              {zone === 'red' ? 'Suggested step' : zone === 'amber' ? 'Gentle insight' : 'Quiet strength'}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">{recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Predefined slider metadata for common educational metrics
 */
export const SLIDER_METADATA: Record<string, SliderMetadata> = {
  intrinsic: {
    label: 'Love of Learning (Intrinsic)',
    tooltipTitle: 'Intrinsic Motivation',
    tooltipDescription: 'Intrinsic motivation refers to engaging in an activity for its inherent satisfaction rather than for external rewards. Research shows it leads to deeper learning, better retention, and greater academic persistence.',
    research: {
      citation: 'Deci & Ryan (2000) - Self-Determination Theory and the Facilitation of Intrinsic Motivation',
      url: 'https://doi.org/10.1037/0003-066X.55.1.68'
    },
    lowValueWarning: 'Low intrinsic motivation can make learning feel flat. Try linking the course to a personal interest or real-world question you care about.',
    recommendations: {
      low: 'Low intrinsic motivation? Try connecting topics to your personal interests or real-world applications that excite you.',
      medium: 'Moderate intrinsic motivation. Explore different aspects of the subject to find what genuinely interests you.',
      high: 'Strong love of learning! Leverage this by diving deeper into topics that fascinate you.'
    }
  },
  
  extrinsic: {
    label: 'Goal-Driven (Extrinsic)',
    tooltipTitle: 'Extrinsic Motivation',
    tooltipDescription: 'Extrinsic motivation involves engaging in behavior to earn rewards or avoid punishment. While not as powerful as intrinsic motivation for deep learning, it can provide necessary structure and accountability.',
    research: {
      citation: 'Ryan & Deci (2000) - Intrinsic and Extrinsic Motivations: Classic Definitions',
      url: 'https://doi.org/10.1006/ceps.1999.1020'
    },
    recommendations: {
      low: 'Low external motivation might mean unclear goals. Set specific, measurable milestones tied to career or academic outcomes.',
      medium: 'Balanced external motivation. Consider setting concrete short-term goals to maintain momentum.',
      high: 'Strong goal orientation! Channel this by breaking down larger objectives into actionable weekly targets.'
    }
  },
  
  courseValue: {
    label: 'Course Value',
    tooltipTitle: 'Perceived Value of Course',
    tooltipDescription: 'Utility value—believing that course material is useful for your future—is one of the strongest predictors of academic success. Students who see relevance persist longer and achieve higher grades.',
    research: {
      citation: 'Wigfield & Eccles (2000) - Expectancy–Value Theory of Achievement Motivation',
      url: 'https://doi.org/10.1006/ceps.1999.1015'
    },
    lowValueWarning: 'When value feels low, persistence gets harder. Consider asking your instructor for real-world applications or aligning topics with your goals.',
    recommendations: {
      low: 'Don\'t see the value? Research how this content applies to your career path or talk to professionals in your field.',
      medium: 'You see some value. Try journaling about how each topic could benefit your future goals.',
      high: 'You clearly see the relevance! Use this conviction to stay motivated during challenging sections.'
    }
  },
  
  familySupport: {
    label: 'Family Support',
    tooltipTitle: 'Family & Social Support',
    tooltipDescription: 'Family support provides both emotional encouragement and practical resources that buffer against academic stress. Research shows it significantly impacts persistence, especially for first-generation students.',
    research: {
      citation: 'Dennis et al. (2005) - The Influence of Motivation on Academic Success',
      url: 'https://doi.org/10.1353/csd.2005.0026'
    },
    lowValueWarning: 'Limited family support can feel isolating, but it does not determine outcomes. Campus advisors, mentors, and peer groups can help.',
    recommendations: {
      low: 'Limited family support? Build your support network through study groups, mentors, or student organizations.',
      medium: 'You have some support. Consider expanding your network to include academic peers who share your goals.',
      high: 'Strong family support is a powerful asset. Share your academic journey with them to maintain accountability.'
    }
  },
  
  socialBelonging: {
    label: 'Social Belonging',
    tooltipTitle: 'Sense of Belonging',
    tooltipDescription: 'Belonging—feeling accepted and valued in academic communities—directly impacts motivation, engagement, and retention. Students with strong belonging show higher achievement and persistence.',
    research: {
      citation: 'Walton & Cohen (2007) - A Question of Belonging: Race, Social Fit, and Achievement',
      url: 'https://doi.org/10.1037/0022-3514.92.1.82'
    },
    lowValueWarning: 'Feeling isolated is more common than it seems. A single study group or club can shift belonging over time.',
    recommendations: {
      low: 'Low belonging? Join one study group or student organization this week. Connections build gradually.',
      medium: 'You have some connections. Deepen them by initiating study sessions or attending office hours regularly.',
      high: 'Strong sense of belonging! Be a welcoming presence for others who are still finding their community.'
    }
  },
  
  mentalHealth: {
    label: 'Mental Well-being',
    tooltipTitle: 'Mental Health & Well-being',
    tooltipDescription: 'Mental health directly affects cognitive function, motivation, and academic performance. Anxiety, depression, and stress can impair working memory and attention—addressing them is not optional.',
    research: {
      citation: 'Eisenberg et al. (2007) - Prevalence and Correlates of Depression among University Students',
      url: 'https://doi.org/10.1176/appi.ps.58.4.534'
    },
    lowValueWarning: 'If well‑being feels low, support can help. Campus counseling or a trusted professional is a good next step.',
    recommendations: {
      low: 'Mental health challenges are real. Please contact campus counseling services or a mental health professional immediately.',
      medium: 'Moderate well-being. Prioritize sleep, exercise, and stress management alongside academics.',
      high: 'Strong mental well-being! Maintain healthy habits and don\'t hesitate to seek support if things change.'
    }
  },
  
  selfEfficacy: {
    label: 'Self-Efficacy (Confidence)',
    tooltipTitle: 'Academic Self-Efficacy',
    tooltipDescription: 'Self-efficacy—belief in your ability to succeed—is one of the strongest predictors of academic achievement. It\'s built through mastery experiences, not just positive thinking.',
    research: {
      citation: 'Bandura (1997) - Self-Efficacy: The Exercise of Control',
      url: 'https://www.goodreads.com/book/show/400597.Self_Efficacy'
    },
    lowValueWarning: 'Low confidence usually signals missing strategies, not ability. Consider a tutor, office hours, or a study partner.',
    recommendations: {
      low: 'Low confidence often means you need better strategies, not more ability. Start with small wins and track progress.',
      medium: 'Moderate confidence. Build it through consistent small successes and celebrating incremental progress.',
      high: 'Strong confidence! Challenge yourself with harder problems to build even deeper mastery.'
    }
  },
  
  priorKnowledge: {
    label: 'Prior Knowledge',
    tooltipTitle: 'Prerequisite Knowledge',
    tooltipDescription: 'Prior knowledge is the foundation for new learning. Gaps in foundational concepts create exponential difficulty downstream—addressing them early is critical for success.',
    research: {
      citation: 'Hailikari et al. (2008) - The Relevance of Prior Knowledge in Learning',
      url: 'https://doi.org/10.1007/s10648-008-9083-2'
    },
    lowValueWarning: 'Foundations matter. A brief prerequisite review now can save a lot of effort later.',
    recommendations: {
      low: 'Low prior knowledge? Dedicate early weeks to prerequisites. Khan Academy, YouTube, or office hours can fill gaps quickly.',
      medium: 'Moderate foundation. Identify specific weak spots and address them before they compound.',
      high: 'Strong foundation! Use your knowledge to help others—teaching reinforces your own understanding.'
    }
  }
};
