/**
 * Sycophancy Detector Service
 *
 * Detects and eliminates sycophantic alignment behaviors in favor of
 * falsification-seeking dispositions.
 */

/**
 * Categories of sycophantic patterns
 */
export type SycophancyCategory =
    | "agreementWithoutEvidence"
    | "performativeValidation"
    | "accommodationOverTruth"
    | "hedgingWithoutFalsification"
    | "epistemicSurrender";

/**
 * Detected sycophantic pattern
 */
export interface SycophanticPattern {
    category: SycophancyCategory;
    pattern: string;
    match: string;
    position: { start: number; end: number };
    severity: "fatal" | "warning";
    replacement: string;
}

/**
 * Sycophancy detection report
 */
export interface SycophancyReport {
    detected: boolean;
    patterns: SycophanticPattern[];
    severity: "fatal" | "warning" | "none";
    summary: string;
    correctionPrompt: string;
}

/**
 * Pattern definitions for sycophancy detection
 */
export const SYCOPHANTIC_PATTERNS: Record<SycophancyCategory, RegExp[]> = {
    agreementWithoutEvidence: [
        /you('re| are) (absolutely |completely |totally )?(right|correct)/gi,
        /that('s| is) (absolutely |completely )?correct/gi,
        /i (completely |totally |fully )?agree/gi,
        /exactly(!)?/gi,
        /precisely(!)?/gi,
        /you hit the nail on the head/gi,
        /spot on/gi,
    ],

    performativeValidation: [
        /great (question|point|observation|insight)/gi,
        /excellent (question|point|observation|insight)/gi,
        /good (question|point|observation|insight)/gi,
        /really insightful observation/gi,
        /insightful observation( you've made)?/gi,
        /i appreciate (your |that )?(perspective|question|input|thought)/gi,
        /thank you for (asking|sharing|that)/gi,
        /interesting (perspective|point|question)/gi,
        /that('s| is) a (good|great|excellent) (question|point)/gi,
    ],

    accommodationOverTruth: [
        /from your perspective/gi,
        /if that('s| is) what you (prefer|want|believe)/gi,
        /i can (see|understand) why you would think/gi,
        /that makes sense from your (point of view|perspective)/gi,
        /your (intuition|instinct) (is|was) (right|correct|good)/gi,
        /you('re| are) (entitled to|welcome to) your (opinion|view)/gi,
    ],

    hedgingWithoutFalsification: [
        /that('s| is) (one |a )?(possible|plausible) (interpretation|explanation)/gi,
        /there are many ways to look at this/gi,
        /both (perspectives|views|sides) have merit/gi,
        /it depends on how you look at it/gi,
        /that('s| is) a valid perspective/gi,
        /i see what you('re| are) saying/gi,
        /i might be wrong/gi,
        /perhaps/gi,
        /could possibly/gi,
        /in a sense/gi,
    ],

    epistemicSurrender: [
        /we can't know for sure/gi,
        /this is (ultimately |probably )?unknowable/gi,
        /there('s| is) no way to (know|verify|determine)/gi,
        /it('s| is) impossible to say/gi,
        /beyond our (ability|capacity) to know/gi,
        /we may never know/gi,
    ],
};

/**
 * Replacement templates for sycophantic patterns
 */
export const REPLACEMENT_TEMPLATES: Record<SycophancyCategory, string> = {
    agreementWithoutEvidence:
        "Hypothesis: [claim]. What evidence would confirm or falsify this?",

    performativeValidation:
        "Analyzing the claim: [claim]. Generating falsification criteria...",

    accommodationOverTruth:
        "Testing [claim] against available evidence. Required data: [specific evidence].",

    hedgingWithoutFalsification:
        "To resolve this uncertainty, we would need to test [specific prediction]. Proposed experiment: [test method].",

    epistemicSurrender:
        "While current evidence is insufficient, we can test [specific prediction] by [experiment].",
};

/**
 * Sycophancy Detector
 */
export class SycophancyDetector {
    /**
     * Detect all sycophantic patterns in text
     */
    detect(text: string): SycophancyReport {
        const patterns: SycophanticPattern[] = [];

        for (const [category, regexList] of Object.entries(SYCOPHANTIC_PATTERNS)) {
            for (const regex of regexList) {
                let match;
                const textToSearch = text;

                while ((match = regex.exec(textToSearch)) !== null) {
                    const severity = this.determineSeverity(category as SycophancyCategory);

                    patterns.push({
                        category: category as SycophancyCategory,
                        pattern: regex.source,
                        match: match[0],
                        position: { start: match.index, end: match.index + match[0].length },
                        severity,
                        replacement: this.generateReplacement(category as SycophancyCategory, match[0]),
                    });
                }
            }
        }

        // Determine overall severity
        let severity: SycophancyReport["severity"] = "none";
        if (patterns.some(p => p.severity === "fatal")) {
            severity = "fatal";
        } else if (patterns.length > 0) {
            severity = "warning";
        }

        return {
            detected: patterns.length > 0,
            patterns,
            severity,
            summary: this.generateSummary(patterns),
            correctionPrompt: this.generateCorrectionPrompt(patterns),
        };
    }

    /**
     * Determine severity for a category
     */
    private determineSeverity(category: SycophancyCategory): "fatal" | "warning" {
        // Fatal categories - must be removed
        const fatalCategories: SycophancyCategory[] = [
            "epistemicSurrender",
            "agreementWithoutEvidence",
        ];

        return fatalCategories.includes(category) ? "fatal" : "warning";
    }

    /**
     * Generate replacement text for a pattern
     */
    private generateReplacement(category: SycophancyCategory, _matchedText: string): string {
        const template = REPLACEMENT_TEMPLATES[category];

        // Customize based on matched text
        if (category === "agreementWithoutEvidence") {
            return "Hypothesis: [extract claim]. Falsification criteria: [what would disprove].";
        }

        if (category === "epistemicSurrender") {
            return "Current evidence is insufficient. Proposed test: [specific experiment].";
        }

        return template;
    }

    /**
     * Generate summary of detected patterns
     */
    private generateSummary(patterns: SycophanticPattern[]): string {
        if (patterns.length === 0) return "No sycophantic patterns detected.";

        const categoryCounts = new Map<SycophancyCategory, number>();
        for (const p of patterns) {
            categoryCounts.set(p.category, (categoryCounts.get(p.category) || 0) + 1);
        }

        const parts: string[] = [];
        for (const [category, count] of categoryCounts) {
            parts.push(`${count} ${category}`);
        }

        return `Detected ${patterns.length} sycophantic pattern(s): ${parts.join(", ")}.`;
    }

    /**
     * Generate correction prompt
     */
    private generateCorrectionPrompt(patterns: SycophanticPattern[]): string {
        if (patterns.length === 0) return "";

        const fatalPatterns = patterns.filter(p => p.severity === "fatal");
        const warningPatterns = patterns.filter(p => p.severity === "warning");

        let prompt = "### SYCOPHANCY DETECTED\n\n";

        if (fatalPatterns.length > 0) {
            prompt += "**FATAL (must remove):**\n";
            for (const p of fatalPatterns) {
                prompt += `- "${p.match}" [${p.category}]\n`;
                prompt += `  Replace with: "${p.replacement}"\n`;
            }
        }

        if (warningPatterns.length > 0) {
            prompt += "\n**WARNINGS (should revise):**\n";
            for (const p of warningPatterns) {
                prompt += `- "${p.match}" [${p.category}]\n`;
            }
        }

        prompt += "\n**INSTRUCTION:** Remove all sycophantic patterns. Replace with hypothesis-driven response structure:\n";
        prompt += "1. Observation: [phenomenon]\n";
        prompt += "2. Hypothesis: [falsifiable claim]\n";
        prompt += "3. Prediction: [testable consequence]\n";
        prompt += "4. Falsification: [what would disprove]\n";

        return prompt;
    }

    /**
     * Remove sycophantic patterns from text
     */
    sanitize(text: string): { sanitized: string; removed: SycophanticPattern[] } {
        let sanitized = text;
        const removed: SycophanticPattern[] = [];

        const report = this.detect(text);

        // Sort by position (reverse) to replace from end to start
        const sortedPatterns = [...report.patterns].sort(
            (a, b) => b.position.start - a.position.start
        );

        for (const p of sortedPatterns) {
            // Remove the pattern
            sanitized = sanitized.slice(0, p.position.start) + sanitized.slice(p.position.end);
            removed.push(p);
        }

        return { sanitized, removed };
    }

    /**
     * Quick check if text contains sycophancy
     */
    hasSycophancy(text: string): boolean {
        return this.detect(text).detected;
    }

    /**
     * Count sycophantic patterns
     */
    countPatterns(text: string): number {
        return this.detect(text).patterns.length;
    }
}

/**
 * Singleton instance
 */
let instance: SycophancyDetector | null = null;

export function getSycophancyDetector(): SycophancyDetector {
    if (!instance) {
        instance = new SycophancyDetector();
    }
    return instance;
}

/**
 * Convenience function for quick detection
 */
export function detectSycophancy(text: string): SycophancyReport {
    return getSycophancyDetector().detect(text);
}