/**
 * Legal Document Extractor
 * 
 * Extracts structured legal information from raw text documents:
 * - Legal entities (defendant, plaintiff, witnesses, victims)
 * - Timeline of actions
 * - Identified harms/damages
 * - Intent classifications
 * 
 * Phase 28.Legal: Intent → Action → Harm extraction pipeline
 * 
 * SECURITY v2: Added input sanitization to prevent prompt injection
 */

import { getClaudeModel } from '../ai/anthropic';
import { safeParseJson } from '../ai/ai-utils';

/**
 * Sanitize document text to prevent prompt injection attacks
 * 
 * @param text - Raw text that may contain malicious content
 * @returns Sanitized text safe for LLM prompts
 */
function sanitizeDocumentText(text: string): string {
  // Remove or escape potentially dangerous patterns
  let sanitized = text;
  
  // 1. Escape markdown code blocks that could contain prompt injections
  sanitized = sanitized.replace(/```/g, '`\u200B`\u200B`'); // Zero-width space breaks the block
  
  // 2. Remove XML/HTML-like tags that might be interpreted as instructions
  sanitized = sanitized.replace(/<\/?(?:system|assistant|user|human|prompt|instruction)[^>]*>/gi, '[TAG_REMOVED]');
  
  // 3. Escape common prompt injection patterns
  const injectionPatterns = [
    /ignore (?:the )?(?:above|previous|all) (?:instructions?|prompts?)/gi,
    /disregard (?:the )?(?:above|previous|all) (?:instructions?|prompts?)/gi,
    /forget (?:the )?(?:above|previous|all) (?:instructions?|prompts?)/gi,
    /new (?:instructions?|system|prompt):/gi,
    /you are now/gi,
    /pretend (?:to be|you are)/gi,
    /act as if/gi,
    /role[:\s]*(?:assistant|system|user|human)/gi,
  ];
  
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  }
  
  // 4. Limit consecutive special characters (potential delimiter attacks)
  sanitized = sanitized.replace(/([#=\-*_]{5,})/g, (match) => match.slice(0, 4));
  
  // 5. Remove null bytes and other control characters (except newlines, tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}
import {
  LegalEntity,
  LegalEntityType,
  LegalAction,
  Harm,
  HarmType,
  HarmSeverity,
  Intent,
  IntentType,
  LegalExtractionResult,
  LegalDocumentType,
} from '@/types/legal';

// Extraction prompt for legal document analysis
// PERFORMANCE: Limited to 5 actions and 5 harms to keep analysis under 25 pairs (2-3 min max)
const LEGAL_EXTRACTION_PROMPT = `You are a legal document analyzer specialized in extracting causal information for liability analysis.

## DOCUMENT TO ANALYZE:
{DOCUMENT}

## EXTRACTION REQUIREMENTS:

Extract the MOST IMPORTANT items from the document. Quality over quantity.

### 1. ENTITIES (Parties involved - max 6)
- Type: defendant, plaintiff, witness, victim, third_party, expert
- Name: Full name or identifier
- Role: Their role in the case
Only include directly relevant parties.

### 2. TIMELINE (Actions - MAXIMUM 5 MOST IMPORTANT)
⚠️ CRITICAL: Extract only the 5 most legally significant actions that could establish causation.
Prioritize actions that:
- Directly caused harm
- Violated a legal duty
- Showed intent or negligence
- Are key to establishing liability

For each action:
- Actor: Who performed the action (entity name)
- Timestamp: When it occurred (ISO format or "unknown")
- Description: What happened
- Intent: The mental state of the actor
  - Type: purposeful, knowing, reckless, negligent, strict_liability
  - Evidence: What text supports this intent classification

### 3. HARMS (MAXIMUM 5 MOST SIGNIFICANT)
⚠️ CRITICAL: Extract only the 5 most significant harms/damages.
Prioritize harms that:
- Have clear causation from identified actions
- Are most severe
- Are most provable/documented

For each harm:
- Victim: Who was harmed (entity name)
- Type: physical, economic, emotional, property, reputational, environmental
- Description: Nature of the harm
- Severity: minor, moderate, severe, catastrophic

### 4. DOCUMENT TYPE
Classify as: case_law, statute, complaint, evidence, witness_statement, expert_report, unknown

## OUTPUT FORMAT (JSON only, no markdown):
{
  "documentType": "case_law" | "statute" | "complaint" | "evidence" | "witness_statement" | "expert_report" | "unknown",
  "entities": [
    {
      "type": "defendant" | "plaintiff" | "witness" | "victim" | "third_party" | "expert",
      "name": "string",
      "role": "string",
      "aliases": ["string"]
    }
  ],
  "timeline": [
    {
      "actor": "entity name",
      "timestamp": "ISO date or 'unknown'",
      "description": "what happened",
      "intent": {
        "type": "purposeful" | "knowing" | "reckless" | "negligent" | "strict_liability",
        "description": "mental state evidence",
        "evidenceSnippets": ["relevant text from document"]
      }
    }
  ],
  "harms": [
    {
      "victim": "entity name",
      "type": "physical" | "economic" | "emotional" | "property" | "reputational" | "environmental",
      "description": "nature of harm",
      "severity": "minor" | "moderate" | "severe" | "catastrophic",
      "timestamp": "ISO date or 'unknown'"
    }
  ],
  "extractionConfidence": number // 0-1, your confidence in the extraction quality
}`;

/**
 * Legal Document Extractor
 * 
 * Extracts structured legal information from text documents
 * for Intent → Action → Harm causal analysis.
 */
export class LegalDocumentExtractor {
  private maxTextLength: number;

  constructor(maxTextLength: number = 50000) {
    this.maxTextLength = maxTextLength;
  }

  /**
   * Extract legal information from a document
   * 
   * @param text - Raw text content of the legal document
   * @returns Structured extraction result
   */
  async extract(text: string): Promise<LegalExtractionResult> {
    const model = getClaudeModel();
    
    // SECURITY: Sanitize input to prevent prompt injection
    const sanitizedText = sanitizeDocumentText(text);
    
    // Truncate if necessary
    const truncatedText = sanitizedText.slice(0, this.maxTextLength);
    const prompt = LEGAL_EXTRACTION_PROMPT.replace('{DOCUMENT}', truncatedText);

    try {
      const response = await model.generateContent(prompt);
      const parsed = safeParseJson<any>(response.response.text(), {
        documentType: 'unknown',
        entities: [],
        timeline: [],
        harms: [],
        extractionConfidence: 0.5,
      });

      // Convert to proper typed structures with IDs
      const entities = this.processEntities(parsed.entities || []);
      const entityMap = new Map(entities.map(e => [e.name, e.id]));
      
      // PERFORMANCE: Enforce hard limits even if LLM returns more
      // Max 5 actions × Max 5 harms = Max 25 pairs for analysis
      const MAX_ACTIONS = 5;
      const MAX_HARMS = 5;
      
      let timeline = this.processTimeline(parsed.timeline || [], entityMap);
      let harms = this.processHarms(parsed.harms || [], entityMap);
      
      // Truncate if LLM exceeded limits
      if (timeline.length > MAX_ACTIONS) {
        console.log(`[LegalExtractor] Truncating ${timeline.length} actions to ${MAX_ACTIONS}`);
        timeline = timeline.slice(0, MAX_ACTIONS);
      }
      if (harms.length > MAX_HARMS) {
        console.log(`[LegalExtractor] Truncating ${harms.length} harms to ${MAX_HARMS}`);
        harms = harms.slice(0, MAX_HARMS);
      }
      
      const intents = this.extractIntents(timeline);

      // Validate document type
      const documentType = this.validateDocumentType(parsed.documentType);

      return {
        entities,
        timeline,
        harms,
        intents,
        documentType,
        extractionConfidence: Math.min(1, Math.max(0, parsed.extractionConfidence || 0.5)),
        rawTextLength: text.length,
        warnings: this.generateWarnings(entities, timeline, harms),
      };
    } catch (error) {
      console.error('[LegalExtractor] Extraction failed:', error);
      return {
        entities: [],
        timeline: [],
        harms: [],
        intents: new Map(),
        documentType: 'unknown',
        extractionConfidence: 0,
        rawTextLength: text.length,
        warnings: [`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Process raw entity data into typed LegalEntity objects
   */
  private processEntities(rawEntities: any[]): LegalEntity[] {
    return rawEntities.map((e, index) => {
      const entityType = this.validateEntityType(e.type);
      return {
        id: `entity-${index}-${Date.now()}`,
        type: entityType,
        name: String(e.name || 'Unknown'),
        role: String(e.role || 'Unspecified'),
        relevantActions: [],
        metadata: {
          aliases: Array.isArray(e.aliases) ? e.aliases : [],
        },
      };
    });
  }

  /**
   * Process raw timeline data into typed LegalAction objects
   */
  private processTimeline(
    rawTimeline: any[],
    entityMap: Map<string, string>
  ): LegalAction[] {
    return rawTimeline.map((t, index) => {
      const actorId = entityMap.get(String(t.actor)) || 'unknown';
      const intent = this.processIntent(t.intent);
      
      return {
        id: `action-${index}-${Date.now()}`,
        actor: actorId,
        timestamp: this.parseTimestamp(t.timestamp),
        description: String(t.description || 'No description'),
        intent,
        causedHarm: [],
        butForRelevance: 0.5, // Initial placeholder, will be updated by ButForAnalyzer
        evidenceSnippets: intent?.evidenceSnippets || [],
      };
    });
  }

  /**
   * Process raw harm data into typed Harm objects
   */
  private processHarms(
    rawHarms: any[],
    entityMap: Map<string, string>
  ): Harm[] {
    return rawHarms.map((h, index) => {
      const victimId = entityMap.get(String(h.victim)) || 'unknown';
      const harmType = this.validateHarmType(h.type);
      const severity = this.validateSeverity(h.severity);
      
      return {
        id: `harm-${index}-${Date.now()}`,
        victim: victimId,
        type: harmType,
        description: String(h.description || 'No description'),
        severity,
        timestamp: this.parseTimestamp(h.timestamp),
        proximateCause: [],
      };
    });
  }

  /**
   * Process raw intent data into typed Intent object
   */
  private processIntent(rawIntent: any): Intent | undefined {
    if (!rawIntent) return undefined;

    const intentType = this.validateIntentType(rawIntent.type);
    
    return {
      type: intentType,
      description: String(rawIntent.description || 'Unknown'),
      evidenceSnippets: Array.isArray(rawIntent.evidenceSnippets) 
        ? rawIntent.evidenceSnippets.map(String) 
        : [],
      confidence: 0.7, // Default confidence
    };
  }

  /**
   * Extract intents from timeline and map to actor IDs
   */
  private extractIntents(timeline: LegalAction[]): Map<string, Intent> {
    const intents = new Map<string, Intent>();
    
    for (const action of timeline) {
      if (action.intent && !intents.has(action.actor)) {
        intents.set(action.actor, action.intent);
      }
    }
    
    return intents;
  }

  /**
   * Parse timestamp string to Date
   */
  private parseTimestamp(timestamp: string | undefined): Date {
    if (!timestamp || timestamp === 'unknown') {
      return new Date();
    }
    
    try {
      const parsed = new Date(timestamp);
      if (isNaN(parsed.getTime())) {
        return new Date();
      }
      return parsed;
    } catch {
      return new Date();
    }
  }

  /**
   * Validate and normalize entity type
   */
  private validateEntityType(type: string | undefined): LegalEntityType {
    const validTypes: LegalEntityType[] = ['defendant', 'plaintiff', 'witness', 'victim', 'third_party', 'expert'];
    const normalized = String(type || '').toLowerCase();
    
    if (validTypes.includes(normalized as LegalEntityType)) {
      return normalized as LegalEntityType;
    }
    
    // Try to map common variations
    if (normalized.includes('defend')) return 'defendant';
    if (normalized.includes('plaint') || normalized.includes('claimant')) return 'plaintiff';
    if (normalized.includes('witness')) return 'witness';
    if (normalized.includes('victim') || normalized.includes('injured')) return 'victim';
    if (normalized.includes('expert')) return 'expert';
    
    return 'third_party';
  }

  /**
   * Validate and normalize harm type
   */
  private validateHarmType(type: string | undefined): HarmType {
    const validTypes: HarmType[] = ['physical', 'economic', 'emotional', 'property', 'reputational', 'environmental'];
    const normalized = String(type || '').toLowerCase();
    
    if (validTypes.includes(normalized as HarmType)) {
      return normalized as HarmType;
    }
    
    // Try to map common variations
    if (normalized.includes('physical') || normalized.includes('bodily') || normalized.includes('injur')) return 'physical';
    if (normalized.includes('econom') || normalized.includes('financial') || normalized.includes('monetary')) return 'economic';
    if (normalized.includes('emotion') || normalized.includes('mental') || normalized.includes('psych')) return 'emotional';
    if (normalized.includes('property') || normalized.includes('damage')) return 'property';
    if (normalized.includes('reputat')) return 'reputational';
    if (normalized.includes('environ')) return 'environmental';
    
    return 'physical'; // Default
  }

  /**
   * Validate and normalize severity
   */
  private validateSeverity(severity: string | undefined): HarmSeverity {
    const validSeverities: HarmSeverity[] = ['minor', 'moderate', 'severe', 'catastrophic'];
    const normalized = String(severity || '').toLowerCase();
    
    if (validSeverities.includes(normalized as HarmSeverity)) {
      return normalized as HarmSeverity;
    }
    
    // Try to map common variations
    if (normalized.includes('minor') || normalized.includes('slight')) return 'minor';
    if (normalized.includes('moderate') || normalized.includes('medium')) return 'moderate';
    if (normalized.includes('severe') || normalized.includes('serious')) return 'severe';
    if (normalized.includes('catastroph') || normalized.includes('fatal') || normalized.includes('death')) return 'catastrophic';
    
    return 'moderate'; // Default
  }

  /**
   * Validate and normalize intent type
   */
  private validateIntentType(type: string | undefined): IntentType {
    const validTypes: IntentType[] = ['purposeful', 'knowing', 'reckless', 'negligent', 'strict_liability'];
    const normalized = String(type || '').toLowerCase();
    
    if (validTypes.includes(normalized as IntentType)) {
      return normalized as IntentType;
    }
    
    // Try to map common variations
    if (normalized.includes('purpose') || normalized.includes('intentional') || normalized.includes('deliberate')) return 'purposeful';
    if (normalized.includes('knowing') || normalized.includes('aware')) return 'knowing';
    if (normalized.includes('reckless') || normalized.includes('wanton')) return 'reckless';
    if (normalized.includes('negligen') || normalized.includes('careless')) return 'negligent';
    if (normalized.includes('strict')) return 'strict_liability';
    
    return 'negligent'; // Default
  }

  /**
   * Validate and normalize document type
   */
  private validateDocumentType(type: string | undefined): LegalDocumentType {
    const validTypes: LegalDocumentType[] = ['case_law', 'statute', 'complaint', 'evidence', 'witness_statement', 'expert_report', 'unknown'];
    const normalized = String(type || '').toLowerCase().replace(/\s+/g, '_');
    
    if (validTypes.includes(normalized as LegalDocumentType)) {
      return normalized as LegalDocumentType;
    }
    
    return 'unknown';
  }

  /**
   * Generate warnings for potential issues in the extraction
   */
  private generateWarnings(
    entities: LegalEntity[],
    timeline: LegalAction[],
    harms: Harm[]
  ): string[] {
    const warnings: string[] = [];

    // Check for missing defendants
    const hasDefendant = entities.some(e => e.type === 'defendant');
    if (!hasDefendant) {
      warnings.push('No defendant identified in document');
    }

    // Check for missing plaintiffs/victims
    const hasPlaintiffOrVictim = entities.some(e => e.type === 'plaintiff' || e.type === 'victim');
    if (!hasPlaintiffOrVictim) {
      warnings.push('No plaintiff or victim identified in document');
    }

    // Check for empty timeline
    if (timeline.length === 0) {
      warnings.push('No actions/events extracted from document');
    }

    // Check for no identified harms
    if (harms.length === 0) {
      warnings.push('No harms/damages identified in document');
    }

    // Check for actions without intents
    const actionsWithoutIntent = timeline.filter(a => !a.intent);
    if (actionsWithoutIntent.length > 0) {
      warnings.push(`${actionsWithoutIntent.length} action(s) have no identified intent`);
    }

    return warnings;
  }

  /**
   * Normalize entity name for deduplication
   * Handles case differences, extra whitespace, and common variations
   */
  private normalizeEntityName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')           // Normalize multiple spaces
      .replace(/[.,]/g, '')           // Remove punctuation
      .replace(/\bthe\b/gi, '')       // Remove "the"
      .trim();
  }

  /**
   * Check if two entity names refer to the same entity
   * Uses fuzzy matching for similar names like "Police Officers" and "Police Personnel"
   */
  private isSameEntity(name1: string, name2: string): boolean {
    const norm1 = this.normalizeEntityName(name1);
    const norm2 = this.normalizeEntityName(name2);
    
    // Exact match after normalization
    if (norm1 === norm2) return true;
    
    // Check if one contains the other (for partial matches)
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
    
    // Fuzzy match for common variations
    // "police officers" vs "police personnel" → both start with "police"
    const words1 = norm1.split(' ');
    const words2 = norm2.split(' ');
    
    // If first word matches and type is similar (e.g., both are "police")
    if (words1[0] === words2[0] && words1[0].length > 3) {
      // Check if it's a group term (officers, personnel, department, etc.)
      const groupTerms = ['officers', 'personnel', 'department', 'unit', 'team', 'force'];
      const isGroup1 = words1.some(w => groupTerms.includes(w));
      const isGroup2 = words2.some(w => groupTerms.includes(w));
      if (isGroup1 && isGroup2) return true;
    }
    
    return false;
  }

  /**
   * Check if two descriptions are similar enough to be considered duplicates
   * Uses normalized comparison and word overlap
   */
  private isSimilarDescription(desc1: string, desc2: string): boolean {
    const norm1 = this.normalizeEntityName(desc1);
    const norm2 = this.normalizeEntityName(desc2);
    
    // Exact match after normalization
    if (norm1 === norm2) return true;
    
    // Check if one contains the other (80% of length)
    if (norm1.length > 20 && norm2.length > 20) {
      if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
    }
    
    // Word overlap: if >70% of words match, consider similar
    const words1 = norm1.split(' ').filter(w => w.length > 3);
    const words2Set = new Set(norm2.split(' ').filter(w => w.length > 3));
    
    if (words1.length < 3 || words2Set.size < 3) return false;
    
    let overlap = 0;
    for (const word of words1) {
      if (words2Set.has(word)) overlap++;
    }
    
    const overlapRatio = overlap / Math.min(words1.length, words2Set.size);
    return overlapRatio >= 0.7;
  }

  /**
   * Merge two entities into one, combining their information
   */
  private mergeEntities(existing: LegalEntity, newEntity: LegalEntity): LegalEntity {
    // Keep the more "formal" name (typically the first one or the longer one)
    const name = existing.name.length >= newEntity.name.length ? existing.name : newEntity.name;
    
    // Combine roles if different
    let role = existing.role;
    if (newEntity.role && newEntity.role !== existing.role) {
      role = `${existing.role}; ${newEntity.role}`;
    }
    
    // Merge aliases
    const aliases = new Set([
      ...(existing.metadata?.aliases || []),
      ...(newEntity.metadata?.aliases || []),
      existing.name,
      newEntity.name,
    ]);
    
    return {
      ...existing,
      name,
      role,
      metadata: {
        ...existing.metadata,
        aliases: Array.from(aliases).filter(a => a !== name),
      },
    };
  }

  /**
   * Extract from multiple documents and merge results
   */
  async extractMultiple(texts: string[]): Promise<LegalExtractionResult> {
    const results = await Promise.all(texts.map(text => this.extract(text)));

    // Merge all results
    const mergedEntities: LegalEntity[] = [];
    const mergedTimeline: LegalAction[] = [];
    const mergedHarms: Harm[] = [];
    const mergedIntents = new Map<string, Intent>();
    const allWarnings: string[] = [];
    let totalRawLength = 0;
    let totalConfidence = 0;

    for (const result of results) {
      // Merge entities with intelligent deduplication
      for (const entity of result.entities) {
        // Find if this entity already exists (case-insensitive, fuzzy match)
        const existingIndex = mergedEntities.findIndex(e => this.isSameEntity(e.name, entity.name));
        
        if (existingIndex >= 0) {
          // Merge with existing entity
          mergedEntities[existingIndex] = this.mergeEntities(mergedEntities[existingIndex], entity);
          console.log(`[Dedup] Merged entity "${entity.name}" with existing "${mergedEntities[existingIndex].name}"`);
        } else {
          // New entity
          mergedEntities.push(entity);
        }
      }

      // Merge timeline actions with deduplication (similar descriptions = same event)
      for (const action of result.timeline) {
        const existingIndex = mergedTimeline.findIndex(a => 
          this.isSimilarDescription(a.description, action.description)
        );
        if (existingIndex < 0) {
          mergedTimeline.push(action);
        } else {
          console.log(`[Dedup] Skipped duplicate action: "${action.description.slice(0, 50)}..."`);
        }
      }
      
      // Merge harms with deduplication (similar descriptions = same harm)
      for (const harm of result.harms) {
        const existingIndex = mergedHarms.findIndex(h => 
          this.isSimilarDescription(h.description, harm.description)
        );
        if (existingIndex < 0) {
          mergedHarms.push(harm);
        } else {
          console.log(`[Dedup] Skipped duplicate harm: "${harm.description.slice(0, 50)}..."`);
        }
      }
      
      for (const [actorId, intent] of result.intents) {
        if (!mergedIntents.has(actorId)) {
          mergedIntents.set(actorId, intent);
        }
      }

      allWarnings.push(...(result.warnings || []));
      totalRawLength += result.rawTextLength;
      totalConfidence += result.extractionConfidence;
    }

    // Sort timeline by timestamp
    mergedTimeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // PERFORMANCE: Apply final limits AFTER merging all documents
    // Max 5 actions × Max 5 harms = Max 25 pairs for analysis
    const MAX_ACTIONS = 5;
    const MAX_HARMS = 5;
    
    let finalTimeline = mergedTimeline;
    let finalHarms = mergedHarms;
    
    if (finalTimeline.length > MAX_ACTIONS) {
      console.log(`[LegalExtractor:extractMultiple] Truncating ${finalTimeline.length} merged actions to ${MAX_ACTIONS}`);
      finalTimeline = finalTimeline.slice(0, MAX_ACTIONS);
    }
    if (finalHarms.length > MAX_HARMS) {
      console.log(`[LegalExtractor:extractMultiple] Truncating ${finalHarms.length} merged harms to ${MAX_HARMS}`);
      finalHarms = finalHarms.slice(0, MAX_HARMS);
    }
    
    console.log(`[LegalExtractor:extractMultiple] Final: ${finalTimeline.length} actions × ${finalHarms.length} harms = ${finalTimeline.length * finalHarms.length} pairs`);

    return {
      entities: mergedEntities,
      timeline: finalTimeline,
      harms: finalHarms,
      intents: mergedIntents,
      documentType: 'unknown', // Mixed documents
      extractionConfidence: results.length > 0 ? totalConfidence / results.length : 0,
      rawTextLength: totalRawLength,
      warnings: [...new Set(allWarnings)], // Deduplicate warnings
    };
  }
}

// Export singleton instance
export const legalExtractor = new LegalDocumentExtractor();
