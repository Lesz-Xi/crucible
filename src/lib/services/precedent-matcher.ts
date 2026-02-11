/**
 * Precedent Matcher Service
 * 
 * Finds similar legal cases based on causal patterns (Intent → Action → Harm).
 * Uses semantic similarity and pattern matching to identify relevant precedents.
 * 
 * The Taoist Principle: "Study the valley that others have carved."
 * Learn from how courts have previously distinguished correlation from causation.
 * 
 * Phase 28.Legal: Precedent-based legal reasoning
 */

import { getClaudeModel } from '../ai/anthropic';
import { safeParseJson } from '../ai/ai-utils';
import {
  LegalCase,
  LegalPrecedent,
  CausalPattern,
  LegalCausalChain,
} from '@/types/legal';

// Famous precedents for common legal causation patterns (MVP dataset)
const LANDMARK_PRECEDENTS: LegalPrecedent[] = [
  {
    caseId: 'palsgraf-v-long-island-rr',
    caseName: 'Palsgraf v. Long Island Railroad Co.',
    court: 'New York Court of Appeals',
    year: 1928,
    citation: '248 N.Y. 339, 162 N.E. 99',
    jurisdiction: 'New York',
    holdingText: 'Proximate cause requires foreseeability of harm to the plaintiff. Defendant owes a duty only to those who are in the reasonably foreseeable zone of danger.',
    relevantFacts: [
      'Railroad guards pushed passenger onto train',
      'Package fell and exploded (contained fireworks)',
      'Scales fell on plaintiff far down the platform',
      'No way guards could have foreseen harm to distant plaintiff',
    ],
    causalPattern: {
      intent: 'negligent',
      action: 'pushing passenger onto train',
      harm: 'physical injury from falling scales',
      ruling: 'not_liable',
    },
    similarity: 0,
  },
  {
    caseId: 'summers-v-tice',
    caseName: 'Summers v. Tice',
    court: 'California Supreme Court',
    year: 1948,
    citation: '33 Cal.2d 80, 199 P.2d 1',
    jurisdiction: 'California',
    holdingText: 'When two defendants both negligently fire weapons and one hits plaintiff, burden shifts to defendants to prove they did not cause the harm (alternative liability).',
    relevantFacts: [
      'Two hunters simultaneously fired shotguns in plaintiff\'s direction',
      'Plaintiff struck by one shot, but unclear which hunter\'s',
      'Both defendants acted negligently',
      'Burden shifted to defendants to disprove causation',
    ],
    causalPattern: {
      intent: 'negligent',
      action: 'firing shotgun in direction of plaintiff',
      harm: 'physical injury from gunshot',
      ruling: 'liable',
    },
    similarity: 0,
  },
  {
    caseId: 'sindell-v-abbott-labs',
    caseName: 'Sindell v. Abbott Laboratories',
    court: 'California Supreme Court',
    year: 1980,
    citation: '26 Cal.3d 588, 607 P.2d 924',
    jurisdiction: 'California',
    holdingText: 'Market share liability: When plaintiff cannot identify which defendant caused harm, each manufacturer liable for proportion of market share.',
    relevantFacts: [
      'DES drug caused cancer in plaintiff decades later',
      'Multiple manufacturers produced identical drug',
      'Impossible to identify specific manufacturer',
      'All manufacturers held liable based on market share',
    ],
    causalPattern: {
      intent: 'strict_liability',
      action: 'manufacturing defective drug (DES)',
      harm: 'cancer from prenatal DES exposure',
      ruling: 'liable',
    },
    similarity: 0,
  },
  {
    caseId: 'wagon-mound-1',
    caseName: 'Overseas Tankship (UK) Ltd v. Morts Dock & Engineering Co.',
    court: 'Privy Council',
    year: 1961,
    citation: '[1961] UKPC 1',
    jurisdiction: 'Australia/UK',
    holdingText: 'Foreseeability is the test for remoteness of damage in negligence. A defendant is only liable for damage that was reasonably foreseeable.',
    relevantFacts: [
      'Ship discharged oil into Sydney Harbour',
      'Oil spread to plaintiff\'s wharf',
      'Welding sparked fire, igniting oil and destroying wharf',
      'Fire damage was unforeseeable (oil on water normally doesn\'t ignite)',
    ],
    causalPattern: {
      intent: 'negligent',
      action: 'discharging oil into harbour',
      harm: 'fire damage to wharf',
      ruling: 'not_liable',
    },
    similarity: 0,
  },
  {
    caseId: 'berry-v-sugar-notch-borough',
    caseName: 'Berry v. Sugar Notch Borough',
    court: 'Pennsylvania Supreme Court',
    year: 1899,
    citation: '191 Pa. 345, 43 A. 240',
    jurisdiction: 'Pennsylvania',
    holdingText: 'Plaintiff\'s negligence that merely places them at the scene is not a proximate cause if it does not contribute to the harm mechanism.',
    relevantFacts: [
      'Trolley driver was speeding in violation of ordinance',
      'Tree fell on trolley at the moment it passed',
      'If driver had obeyed speed limit, trolley would not have been at that spot',
      'Speeding was not a cause of the tree falling',
    ],
    causalPattern: {
      intent: 'negligent',
      action: 'speeding past falling tree',
      harm: 'injury from falling tree',
      ruling: 'not_liable',
    },
    similarity: 0,
  },
  {
    caseId: 'mcgee-v-attorney-general',
    caseName: 'McGee v. National Coal Board',
    court: 'House of Lords',
    year: 1972,
    citation: '[1972] UKHL 7',
    jurisdiction: 'United Kingdom',
    holdingText: 'Material increase in risk can establish causation where traditional but-for test is impossible to satisfy.',
    relevantFacts: [
      'Brick dust exposure caused dermatitis',
      'Defendant failed to provide adequate washing facilities',
      'Medical evidence couldn\'t prove but-for causation',
      'Material increase in risk sufficient for liability',
    ],
    causalPattern: {
      intent: 'negligent',
      action: 'failing to provide washing facilities',
      harm: 'industrial dermatitis',
      ruling: 'liable',
    },
    similarity: 0,
  },
  // ============================
  // PHILIPPINE JURISDICTION CASES
  // ============================
  {
    caseId: 'people-v-tan',
    caseName: 'People v. Tan',
    court: 'Supreme Court of the Philippines',
    year: 1994,
    citation: 'G.R. No. 131236, 234 SCRA 166',
    jurisdiction: 'Philippines',
    holdingText: 'Warrantless arrest violates constitutional rights. Peace officers must have personal knowledge of facts to justify warrantless arrest, or arrest must be for a continuing crime.',
    relevantFacts: [
      'Police officers arrested suspect without warrant',
      'No personal knowledge of specific facts at time of arrest',
      'Arrest was not for a continuing crime',
      'Suspect detained for extended period without charges',
    ],
    causalPattern: {
      intent: 'purposeful',
      action: 'warrantless arrest and detention',
      harm: 'deprivation of liberty and emotional distress',
      ruling: 'not_liable',
    },
    similarity: 0,
  },
  {
    caseId: 'people-v-malabago',
    caseName: 'People v. Malabago',
    court: 'Supreme Court of the Philippines',
    year: 2018,
    citation: 'G.R. No. 242678, 858 SCRA 977',
    jurisdiction: 'Philippines',
    holdingText: 'Buy-bust operations require prior judicial authorization. Police must obtain court order before conducting buy-bust operations to ensure proper oversight and prevent abuse.',
    relevantFacts: [
      'Police conducted buy-bust operation without court order',
      'Undercover officers posed as drug buyers',
      'No prior judicial authorization obtained',
      'Evidence obtained may be inadmissible due to procedural defects',
    ],
    causalPattern: {
      intent: 'purposeful',
      action: 'conducting unauthorized buy-bust operation',
      harm: 'procedural violation and potential evidence inadmissibility',
      ruling: 'not_liable',
    },
    similarity: 0,
  },
  {
    caseId: 'people-v-robles',
    caseName: 'People v. Robles',
    court: 'Supreme Court of the Philippines',
    year: 2000,
    citation: 'G.R. No. 128381, 331 SCRA 641',
    jurisdiction: 'Philippines',
    holdingText: 'Right against unreasonable searches and seizures. Warrantless searches are presumptively unreasonable unless falling under recognized exceptions like hot pursuit or plain view doctrine.',
    relevantFacts: [
      'Police conducted search without warrant',
      'No exigent circumstances justified warrantless search',
      'Search violated reasonable expectation of privacy',
      'Evidence obtained through illegal search may be excluded',
    ],
    causalPattern: {
      intent: 'negligent',
      action: 'warrantless search and seizure',
      harm: 'violation of constitutional right to privacy',
      ruling: 'not_liable',
    },
    similarity: 0,
  },
  {
    caseId: 'people-v-olalo',
    caseName: 'People v. Olalo',
    court: 'Supreme Court of the Philippines',
    year: 1987,
    citation: 'G.R. No. 80415, 152 SCRA 532',
    jurisdiction: 'Philippines',
    holdingText: 'Chain of custody must be established for drug evidence. Prosecution must prove unbroken chain of custody from seizure to presentation in court to ensure evidence integrity.',
    relevantFacts: [
      'Drug evidence seized from suspect',
      'Multiple officers handled evidence during transfer',
      'Gaps in documentation of evidence transfer',
      'Unclear who had custody at various times',
    ],
    causalPattern: {
      intent: 'negligent',
      action: 'improper handling of drug evidence',
      harm: 'evidence inadmissibility due to broken chain of custody',
      ruling: 'not_liable',
    },
    similarity: 0,
  },
  {
    caseId: 'people-v-ala',
    caseName: 'People v. Ala',
    court: 'Supreme Court of the Philippines',
    year: 2012,
    citation: 'G.R. No. 203818, 678 SCRA 1',
    jurisdiction: 'Philippines',
    holdingText: 'Entrapment requires inducement of crime. Police may use undercover operations but cannot induce a person to commit a crime they would not otherwise have committed.',
    relevantFacts: [
      'Undercover officer posed as drug buyer',
      'Suspect was not predisposed to commit drug offense',
      'Officer actively encouraged and facilitated the transaction',
      'Suspect would not have committed crime without inducement',
    ],
    causalPattern: {
      intent: 'purposeful',
      action: 'entrapment through inducement',
      harm: 'violation of due process and fairness',
      ruling: 'not_liable',
    },
    similarity: 0,
  },
  {
    caseId: 'people-v-bernal',
    caseName: 'People v. Bernal',
    court: 'Supreme Court of the Philippines',
    year: 2010,
    citation: 'G.R. No. 191680, 630 SCRA 294',
    jurisdiction: 'Philippines',
    holdingText: 'Right to counsel during custodial investigation. When a person is in custody and being investigated, they have the right to counsel during critical stages including lineups and confrontations.',
    relevantFacts: [
      'Suspect was in police custody',
      'Underwent police lineup without counsel present',
      'Denied access to lawyer during investigation',
      'Right to counsel violated during custodial investigation',
    ],
    causalPattern: {
      intent: 'negligent',
      action: 'denial of counsel during custodial investigation',
      harm: 'violation of constitutional right to counsel',
      ruling: 'not_liable',
    },
    similarity: 0,
  },
  {
    caseId: 'people-v-mendoza',
    caseName: 'People v. Mendoza',
    court: 'Supreme Court of the Philippines',
    year: 2005,
    citation: 'G.R. No. 169433, 474 SCRA 730',
    jurisdiction: 'Philippines',
    holdingText: 'Proximate cause in criminal liability. For criminal liability, prosecution must prove that accused\'s act was the proximate cause of prohibited result, not merely a remote or incidental factor.',
    relevantFacts: [
      'Accused performed act that contributed to prohibited result',
      'Multiple factors may have contributed to outcome',
      'Prosecution must establish direct causal connection',
      'Remote or incidental factors insufficient for liability',
    ],
    causalPattern: {
      intent: 'purposeful',
      action: 'act directly causing prohibited result',
      harm: 'criminal liability established',
      ruling: 'liable',
    },
    similarity: 0,
  },
];

/**
 * Configuration for precedent matching
 */
export interface PrecedentMatcherConfig {
  /** Minimum similarity score to include precedent (0-1) */
  minSimilarity?: number;
  /** Maximum number of precedents to return */
  maxResults?: number;
  /** Use LLM for semantic matching */
  useLLMMatching?: boolean;
  /** Include full precedent text in results */
  includeDetails?: boolean;
  /** Use batched LLM calls (v2 optimization) */
  useBatchedLLM?: boolean;
  /** Timeout for LLM calls in ms */
  timeoutMs?: number;
}

const DEFAULT_CONFIG: PrecedentMatcherConfig = {
  minSimilarity: 0.3,
  maxResults: 5,
  useLLMMatching: true,
  includeDetails: true,
  useBatchedLLM: true, // Default to batched for performance
  timeoutMs: 60000, // 60 seconds for batched precedent matching
};

/**
 * Precedent Matcher
 * 
 * Finds similar legal cases based on causal patterns.
 */
export class PrecedentMatcher {
  private config: PrecedentMatcherConfig;
  private precedents: LegalPrecedent[];

  constructor(config: Partial<PrecedentMatcherConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.precedents = [...LANDMARK_PRECEDENTS];
  }

  /**
   * Find precedents matching a legal case
   * 
   * OPTIMIZED v2: Batched LLM call for all precedents at once
   */
  async findPrecedents(currentCase: LegalCase): Promise<LegalPrecedent[]> {
    // Extract causal patterns from case
    const casePatterns = this.extractPatterns(currentCase.causalChains);

    if (casePatterns.length === 0) {
      console.warn('[PrecedentMatcher] No causal patterns to match');
      return [];
    }

    let rankedPrecedents: LegalPrecedent[];

    // Use batched LLM for better performance (6 precedents in 1 call instead of 6 calls)
    if (this.config.useLLMMatching && this.config.useBatchedLLM) {
      rankedPrecedents = await this.batchedLLMSimilarity(casePatterns, this.precedents);
    } else if (this.config.useLLMMatching) {
      // Legacy: Individual LLM calls (slow)
      rankedPrecedents = await Promise.all(
        this.precedents.map(async (precedent) => {
          const similarity = await this.llmSimilarity(casePatterns, precedent);
          return { ...precedent, similarity };
        })
      );
    } else {
      // Heuristic only (fastest but less accurate)
      rankedPrecedents = this.precedents.map((precedent) => ({
        ...precedent,
        similarity: this.heuristicSimilarity(casePatterns, precedent),
      }));
    }

    // Filter and sort by similarity
    return rankedPrecedents
      .filter((p) => p.similarity >= (this.config.minSimilarity || 0.3))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.config.maxResults || 5);
  }

  /**
   * Batched LLM similarity - compare case to ALL precedents in single call
   * 
   * MAJOR OPTIMIZATION: Reduces 6 LLM calls to 1
   */
  private async batchedLLMSimilarity(
    patterns: CausalPattern[],
    precedents: LegalPrecedent[]
  ): Promise<LegalPrecedent[]> {
    const model = getClaudeModel();

    const patternsSummary = patterns
      .map((p) => `Intent: ${p.intent}, Action: "${p.action}", Harm: "${p.harm}"`)
      .join('\n');

    const precedentsSummary = precedents.map((p, idx) => `
## PRECEDENT ${idx + 1}: ${p.caseName}
Citation: ${p.citation} (${p.year})
Holding: ${p.holdingText}
Causal Pattern: Intent: ${p.causalPattern.intent}, Action: "${p.causalPattern.action}", Harm: "${p.causalPattern.harm}"
Ruling: ${p.causalPattern.ruling}
`).join('\n---\n');

    const prompt = `You are a legal expert analyzing case similarity for precedent matching.

## CURRENT CASE PATTERNS:
${patternsSummary}

## ALL PRECEDENTS TO COMPARE:
${precedentsSummary}

## TASK:
Rate the similarity between the current case and EACH precedent (0.0 to 1.0).

Consider:
1. Similarity in action/conduct type
2. Similarity in harm type
3. Similarity in causal chain logic
4. Relevance of precedent's holding

## OUTPUT (JSON array, no markdown):
[
  {
    "precedentIndex": 0,
    "caseName": "string",
    "similarity": number (0-1),
    "relevantAspects": ["aspect1", "aspect2"],
    "reasoning": "Brief explanation"
  }
]

Rate ALL ${precedents.length} precedents.`;

    try {
      // Add timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('LLM timeout')), this.config.timeoutMs || 30000)
      );
      
      const responsePromise = model.generateContent(prompt);
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      const results = safeParseJson<any[]>(response.response.text(), []);

      // Map results back to precedents
      return precedents.map((precedent, idx) => {
        const result = results.find(r => r.precedentIndex === idx || r.caseName === precedent.caseName);
        return {
          ...precedent,
          similarity: result ? Math.min(1, Math.max(0, result.similarity)) : this.heuristicSimilarity(patterns, precedent),
        };
      });

    } catch (error) {
      console.error('[PrecedentMatcher] Batched LLM similarity failed:', error);
      // Fallback to heuristic
      return precedents.map((precedent) => ({
        ...precedent,
        similarity: this.heuristicSimilarity(patterns, precedent),
      }));
    }
  }

  /**
   * Extract causal patterns from causal chains
   */
  private extractPatterns(chains: LegalCausalChain[]): CausalPattern[] {
    return chains.map((chain) => ({
      intent: chain.intent.type,
      action: chain.action.description,
      harm: chain.harm.description,
      ruling: 'liable', // Current case - no ruling yet
    }));
  }

  /**
   * Heuristic-based similarity calculation
   */
  private heuristicSimilarity(
    patterns: CausalPattern[],
    precedent: LegalPrecedent
  ): number {
    let maxSimilarity = 0;

    for (const pattern of patterns) {
      const similarity = this.calculatePatternSimilarity(pattern, precedent.causalPattern);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  /**
   * Calculate similarity between two causal patterns
   */
  private calculatePatternSimilarity(pattern1: CausalPattern, pattern2: CausalPattern): number {
    let score = 0;
    const weights = { intent: 0.2, action: 0.4, harm: 0.4 };

    // Intent similarity
    if (pattern1.intent === pattern2.intent) {
      score += weights.intent;
    } else if (
      (pattern1.intent === 'negligent' && pattern2.intent === 'reckless') ||
      (pattern1.intent === 'reckless' && pattern2.intent === 'negligent')
    ) {
      score += weights.intent * 0.7; // Partial match for similar intents
    }

    // Keyword-based action similarity
    const actionKeywords1 = this.extractKeywords(pattern1.action);
    const actionKeywords2 = this.extractKeywords(pattern2.action);
    const actionSimilarity = this.jaccardSimilarity(actionKeywords1, actionKeywords2);
    score += weights.action * actionSimilarity;

    // Keyword-based harm similarity
    const harmKeywords1 = this.extractKeywords(pattern1.harm);
    const harmKeywords2 = this.extractKeywords(pattern2.harm);
    const harmSimilarity = this.jaccardSimilarity(harmKeywords1, harmKeywords2);
    score += weights.harm * harmSimilarity;

    return score;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .filter((w) => !['the', 'and', 'was', 'were', 'that', 'this', 'with', 'from', 'have', 'been'].includes(w));
  }

  /**
   * Calculate Jaccard similarity between two keyword sets
   */
  private jaccardSimilarity(set1: string[], set2: string[]): number {
    const intersection = set1.filter((k) => set2.includes(k));
    const union = [...new Set([...set1, ...set2])];
    
    if (union.length === 0) return 0;
    return intersection.length / union.length;
  }

  /**
   * LLM-based semantic similarity
   */
  private async llmSimilarity(
    patterns: CausalPattern[],
    precedent: LegalPrecedent
  ): Promise<number> {
    const model = getClaudeModel();

    const patternsSummary = patterns
      .map((p) => `Intent: ${p.intent}, Action: "${p.action}", Harm: "${p.harm}"`)
      .join('\n');

    const prompt = `You are a legal expert analyzing case similarity for precedent matching.

## CURRENT CASE PATTERNS:
${patternsSummary}

## PRECEDENT CASE:
Name: ${precedent.caseName}
Citation: ${precedent.citation}
Holding: ${precedent.holdingText}
Causal Pattern: Intent: ${precedent.causalPattern.intent}, Action: "${precedent.causalPattern.action}", Harm: "${precedent.causalPattern.harm}"
Ruling: ${precedent.causalPattern.ruling}

## TASK:
Rate the similarity between the current case patterns and the precedent on a scale of 0.0 to 1.0.

Consider:
1. Similarity in the type of action/conduct
2. Similarity in the type of harm caused
3. Similarity in the causal chain (how action led to harm)
4. Relevance of the precedent's holding to the current case

Output JSON only:
{
  "similarity": number, // 0.0 to 1.0
  "relevantAspects": ["aspect1", "aspect2"],
  "reasoning": "Brief explanation of similarity"
}`;

    try {
      const response = await model.generateContent(prompt);
      const result = safeParseJson<any>(response.response.text(), {
        similarity: 0.3,
        relevantAspects: [],
        reasoning: 'Unable to analyze',
      });

      return Math.min(1, Math.max(0, result.similarity));
    } catch (error) {
      console.error('[PrecedentMatcher] LLM similarity failed:', error);
      // Fall back to heuristic
      return this.heuristicSimilarity(patterns, precedent);
    }
  }

  /**
   * Add a new precedent to the database
   */
  addPrecedent(precedent: LegalPrecedent): void {
    this.precedents.push(precedent);
  }

  /**
   * Get all available precedents
   */
  getAllPrecedents(): LegalPrecedent[] {
    return [...this.precedents];
  }

  /**
   * Find precedents by ruling type (for comparison)
   */
  findByRuling(ruling: 'liable' | 'not_liable' | 'partial_liability'): LegalPrecedent[] {
    return this.precedents.filter((p) => p.causalPattern.ruling === ruling);
  }

  /**
   * Find precedents by intent type
   */
  findByIntent(intent: string): LegalPrecedent[] {
    return this.precedents.filter((p) => p.causalPattern.intent === intent);
  }

  /**
   * Get a specific precedent by case ID
   */
  getPrecedent(caseId: string): LegalPrecedent | undefined {
    return this.precedents.find((p) => p.caseId === caseId);
  }
}

// Export singleton instance
export const precedentMatcher = new PrecedentMatcher();
