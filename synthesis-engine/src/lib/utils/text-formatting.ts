/**
 * Text Formatting Utilities
 * 
 * Convert technical variable names to human-readable format
 */

/**
 * Convert camelCase or PascalCase to Title Case with spaces
 * 
 * @example
 * camelToTitle("practiceQuality") => "Practice Quality"
 * camelToTitle("FamilySupport") => "Family Support"
 * camelToTitle("cognitiveLoad") => "Cognitive Load"
 */
export function camelToTitle(text: string): string {
  // Insert space before capital letters and capitalize first letter
  return text
    .replace(/([A-Z])/g, ' $1')  // Insert space before capitals
    .replace(/^./, (str) => str.toUpperCase())  // Capitalize first letter
    .trim();
}

/**
 * Convert snake_case to Title Case
 * 
 * @example
 * snakeToTitle("study_habits") => "Study Habits"
 */
export function snakeToTitle(text: string): string {
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format node names for display in UI
 * Handles both camelCase and PascalCase
 */
export function formatNodeName(nodeName: string): string {
  return camelToTitle(nodeName);
}

/**
 * Get short description for common educational nodes
 */
export function getNodeDescription(nodeName: string): string {
  const descriptions: Record<string, string> = {
    FamilySupport: "Emotional and practical support from family and loved ones",
    SleepQuality: "Quality and quantity of sleep (hours and restfulness)",
    LearningStyle: "Preferred modality for absorbing information",
    PriorKnowledge: "Existing knowledge of prerequisite concepts",
    Motivation: "Intrinsic and extrinsic drive to learn",
    StudyHabits: "Consistency and quality of study practices",
    ContentEngagement: "Active participation with learning materials",
    PracticeQuality: "Effectiveness of practice techniques (active recall, spacing)",
    Performance: "Academic outcomes measured by grades and mastery",
    CognitiveLoad: "Mental effort required relative to working memory capacity",
    SelfEfficacy: "Belief in one's ability to succeed in academic tasks",
    PerceivedCompetence: "How capable you feel in this subject area"
  };
  
  return descriptions[nodeName] || "A factor in your learning system";
}

/**
 * Get research citation for node
 */
export function getNodeResearch(nodeName: string): { citation: string; url?: string } {
  const research: Record<string, { citation: string; url?: string }> = {
    FamilySupport: {
      citation: "Deci & Ryan (2000) - Self-Determination Theory",
      url: "https://doi.org/10.1037/0003-066X.55.1.68"
    },
    SleepQuality: {
      citation: "Walker (2017) - Why We Sleep",
      url: "https://www.goodreads.com/book/show/34466963-why-we-sleep"
    },
    Motivation: {
      citation: "Deci & Ryan (2000) - Intrinsic and Extrinsic Motivations",
      url: "https://doi.org/10.1037/0003-066X.55.1.68"
    },
    StudyHabits: {
      citation: "Zimmerman (2002) - Self-Regulated Learning",
      url: "https://doi.org/10.1037/0022-0663.94.1.3"
    },
    ContentEngagement: {
      citation: "Chi (2009) - Active-Constructive-Interactive Framework",
      url: "https://doi.org/10.1111/j.1756-8765.2008.01005.x"
    },
    PracticeQuality: {
      citation: "Roediger & Karpicke (2006) - Test-Enhanced Learning",
      url: "https://doi.org/10.1111/j.1467-9280.2006.01693.x"
    },
    Performance: {
      citation: "Ericsson (1993) - The Role of Deliberate Practice",
      url: "https://doi.org/10.1037/0033-295X.100.3.363"
    },
    CognitiveLoad: {
      citation: "Sweller (1988) - Cognitive Load During Problem Solving",
      url: "https://doi.org/10.1016/0364-0213(88)90023-7"
    },
    SelfEfficacy: {
      citation: "Bandura (1997) - Self-Efficacy: The Exercise of Control",
      url: "https://www.goodreads.com/book/show/400597.Self_Efficacy"
    }
  };
  
  return research[nodeName] || { citation: "Learning science research" };
}

/**
 * Format intervention category for display
 */
export function formatInterventionCategory(category: string): string {
  const formatted: Record<string, string> = {
    motivation: "Motivation & Mindset",
    study_habits: "Study Habits & Techniques",
    content_format: "Content Delivery",
    family_support: "Environment & Support",
    cognitive_strategies: "Metacognitive Strategies"
  };
  
  return formatted[category] || snakeToTitle(category);
}

/**
 * Format effort level for display
 */
export function formatEffortLevel(cost: number): { label: string; color: string } {
  if (cost < 0.3) {
    return { label: "Low", color: "text-emerald-500" };
  } else if (cost < 0.6) {
    return { label: "Medium", color: "text-amber-500" };
  } else {
    return { label: "High", color: "text-red-500" };
  }
}
