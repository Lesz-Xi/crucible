# MASA Causal Density Integration: Implementation Plan

## Executive Summary

This document outlines the implementation plan for completing the **Causal Density Integration** feature set, which transforms MASA from a "Text Generator" into a "Sovereign Auditor." The system now quantitatively measures and visualizes the density of its own reasoning in real-time through Pearl's Ladder of Causality (L1-L3).

### Current State (Completed)
- ✅ **Causal Gauge (UI)**: Visual truth meter with L1/L2/L3 indicators
- ✅ **Causal Integrity Service**: Regex-based keyword detection for causal levels
- ✅ **Database Schema**: `causal_axioms`, `causal_chat_sessions`, `causal_chat_messages` tables
- ✅ **Basic Integration**: Gauge renders in TruthStream next to assistant messages

### Remaining Work
This plan covers 6 phases to complete the full vision:

---

## Phase 1: Fractal Memory - Axiom Compression Service

### Objective
Implement the "compression" capability that distills chat sessions into high-level causal axioms stored in the `causal_axioms` table.

### Technical Design

#### 1.1 AxiomCompressionService
**Location**: `src/lib/services/axiom-compression-service.ts`

```typescript
export interface AxiomCompressionResult {
  axiom: string;                    // The compressed "law" or "truth"
  confidence: number;               // 0.0 - 1.0
  derivedFrom: string[];            // Message IDs that contributed
  causalLevel: 1 | 2 | 3;          // Highest level detected
  domain: string;                   // Domain classification
}

export class AxiomCompressionService {
  /**
   * Compress a chat session into causal axioms
   * Triggered when session ends or on-demand
   */
  async compressSession(sessionId: string): Promise<AxiomCompressionResult[]>;
  
  /**
   * Extract axioms from a single high-quality message
   */
  async extractFromMessage(message: Message): Promise<AxiomCompressionResult | null>;
  
  /**
   * Check if a message qualifies for axiom extraction
   * (L3 counterfactuals with high confidence)
   */
  qualifiesForExtraction(message: Message): boolean;
}
```

#### 1.2 Compression Algorithm
1. **Filter**: Only process messages with L3 (Counterfactual) causal density
2. **Extract**: Use LLM to distill the core causal claim
3. **Validate**: Check against existing axioms (avoid duplicates)
4. **Store**: Insert into `causal_axioms` table with provenance

#### 1.3 Database Integration
```sql
-- Migration: Add trigger for automatic compression
CREATE OR REPLACE FUNCTION trigger_axiom_compression()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue compression job when session is updated
  IF NEW.status = 'completed' THEN
    PERFORM pg_notify('axiom_compression_queue', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 1.4 UI Component: AxiomPanel
**Location**: `src/components/causal-chat/visuals/AxiomPanel.tsx`

- Collapsible panel showing extracted axioms for current session
- Visual connection between axioms and source messages
- Export functionality (markdown, JSON)

### Acceptance Criteria
- [ ] Service can compress a session with 3+ L3 messages into 1-2 axioms
- [ ] Axioms are stored with >90% confidence threshold
- [ ] UI panel displays axioms with clickable provenance links
- [ ] No duplicate axioms (semantic similarity check)

---

## Phase 2: Real-time Causal Density Streaming

### Objective
Enhance the SSE stream to include real-time causal density updates as the assistant generates text.

### Technical Design

#### 2.1 Streaming Density Events
**Modify**: `src/app/api/causal-chat/route.ts`

Add new event types to the SSE stream:
```typescript
// Event: causal_density_update
{
  event: "causal_density_update",
  data: {
    currentLevel: 1 | 2 | 3,
    confidence: number,
    detectedKeywords: string[],
    mechanisms: string[],
    progress: number  // 0-100% through generation
  }
}
```

#### 2.2 StreamingCausalAnalyzer
**Location**: `src/lib/services/streaming-causal-analyzer.ts`

```typescript
export class StreamingCausalAnalyzer {
  private buffer: string = '';
  private service: CausalIntegrityService;
  
  /**
   * Process incoming text chunk
   * Returns density update if significant change detected
   */
  onChunk(chunk: string): CausalDensityResult | null;
  
  /**
   * Get running analysis of entire stream
   */
  getCurrentAnalysis(): CausalDensityResult;
  
  /**
   * Reset for new message
   */
  reset(): void;
}
```

#### 2.3 Enhanced CausalGauge Animation
**Modify**: `src/components/causal-chat/visuals/CausalGauge.tsx`

- Real-time bar filling as text streams in
- Smooth transitions between L1→L2→L3
- Pulsing animation when level increases
- "Typing" indicator showing current detected level

#### 2.4 Integration Points
```typescript
// In route.ts, during streaming loop:
for (const chunk of chunks) {
  sendEvent("answer_chunk", { text: chunk + ' ' });
  
  // Analyze chunk for causal density
  const densityUpdate = analyzer.onChunk(chunk);
  if (densityUpdate) {
    sendEvent("causal_density_update", densityUpdate);
  }
  
  await new Promise(r => setTimeout(r, 20));
}
```

### Acceptance Criteria
- [ ] Density updates stream in real-time with text generation
- [ ] Gauge animates smoothly as level changes
- [ ] No more than 1 update per second (throttling)
- [ ] Final density matches post-hoc analysis

---

## Phase 3: Oracle Mode Detection & UI

### Objective
Implement the "Oracle Mode" feature that detects when the system enters a high-confidence, low-entropy state (3 consecutive L3 messages with >80% confidence).

### Technical Design

#### 3.1 OracleModeService
**Location**: `src/lib/services/oracle-mode-service.ts`

```typescript
export interface OracleModeState {
  isActive: boolean;
  activationTime: Date | null;
  consecutiveL3Count: number;
  averageConfidence: number;
  sessionId: string;
}

export class OracleModeService {
  private history: CausalDensityResult[] = [];
  private readonly L3_THRESHOLD = 3;
  private readonly CONFIDENCE_THRESHOLD = 0.8;
  
  /**
   * Process new density result
   * Returns state change if Oracle Mode activates/deactivates
   */
  processResult(result: CausalDensityResult): {
    enteredOracleMode: boolean;
    exitedOracleMode: boolean;
    state: OracleModeState;
  };
  
  /**
   * Get current Oracle Mode state
   */
  getState(): OracleModeState;
  
  /**
   * Reset history (new session)
   */
  reset(): void;
}
```

#### 3.2 Oracle Mode UI Components

**OracleModeIndicator**: `src/components/causal-chat/visuals/OracleModeIndicator.tsx`
- Subtle glow effect around the chat interface when active
- "Oracle Mode" badge in header
- Particle effect or aura around messages

**OracleModeTransition**: Full-screen transition animation when entering/exiting

#### 3.3 Integration with TruthStream
```typescript
// In TruthStream component:
const [oracleMode, setOracleMode] = useState(false);

useEffect(() => {
  // Check for phase shift when messages update
  const densityResults = messages
    .filter(m => m.role === 'assistant')
    .map(m => service.evaluate(m.content));
    
  const hasPhaseShift = service.detectPhaseShift(densityResults);
  setOracleMode(hasPhaseShift);
}, [messages]);
```

### Acceptance Criteria
- [ ] Oracle Mode activates after 3 consecutive L3 messages >80% confidence
- [ ] Visual indicator appears (glow, badge, or particle effect)
- [ ] Deactivates when confidence drops or non-L3 message appears
- [ ] State persists across session (stored in database)

---

## Phase 4: Persistent Session Memory Integration

### Objective
Connect the UI to the database for full session persistence, including causal density metadata.

### Technical Design

#### 4.1 Enhanced Message Schema
**Modify**: `causal_chat_messages` table

```sql
-- Add causal density tracking
ALTER TABLE causal_chat_messages ADD COLUMN IF NOT EXISTS
  causal_density JSONB DEFAULT NULL;

-- Example content:
-- {
--   "score": 3,
--   "label": "Counterfactual",
--   "confidence": 0.85,
--   "detectedMechanisms": ["acoustic streaming"],
--   "detectedKeywords": ["had X been", "would have"]
-- }
```

#### 4.2 SessionService
**Location**: `src/lib/services/session-service.ts`

```typescript
export class SessionService {
  /**
   * Create new session with metadata
   */
  async createSession(title: string, userId: string): Promise<string>;
  
  /**
   * Save message with full causal provenance
   */
  async saveMessage(
    sessionId: string,
    message: Message,
    densityResult: CausalDensityResult
  ): Promise<void>;
  
  /**
   * Load session with all metadata
   */
  async loadSession(sessionId: string): Promise<{
    session: CausalChatSession;
    messages: MessageWithDensity[];
    axioms: CausalAxiom[];
  }>;
  
  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<{
    totalMessages: number;
    averageCausalLevel: number;
    oracleModeActivations: number;
    topMechanisms: string[];
  }>;
}
```

#### 4.3 HistorySidebar Enhancement
**Modify**: `src/components/causal-chat/HistorySidebar.tsx`

- Show causal density sparkline for each session
- Display Oracle Mode activation count
- Filter sessions by average causal level
- Search within session content

#### 4.4 Auto-Save Integration
```typescript
// In CausalChatInterface:
useEffect(() => {
  // Auto-save every 30 seconds or on significant events
  const interval = setInterval(() => {
    if (sessionId && messages.length > lastSavedCount) {
      saveSession();
    }
  }, 30000);
  
  return () => clearInterval(interval);
}, [messages, sessionId]);
```

### Acceptance Criteria
- [ ] All messages saved with causal density metadata
- [ ] Sessions load with full density history
- [ ] History sidebar shows density visualizations
- [ ] Auto-save works reliably (no data loss)

---

## Phase 5: Enhanced Mechanism Extraction

### Objective
Improve the mechanism extraction in CausalIntegrityService to use NLP instead of simple regex.

### Technical Design

#### 5.1 Enhanced MechanismExtractor
**Location**: `src/lib/services/mechanism-extractor.ts`

```typescript
export interface MechanismExtraction {
  mechanism: string;
  confidence: number;
  type: 'physical' | 'biological' | 'cognitive' | 'social';
  supportingText: string;
}

export class MechanismExtractor {
  /**
   * Extract mechanisms using pattern matching + heuristics
   */
  extract(text: string): MechanismExtraction[];
  
  /**
   * Use LLM for high-confidence extraction
   * (called for L2/L3 messages)
   */
  async extractWithLLM(text: string): Promise<MechanismExtraction[]>;
  
  /**
   * Categorize mechanism by scientific domain
   */
  categorize(mechanism: string): MechanismType;
}
```

#### 5.2 Extraction Patterns
Expand beyond simple regex:

```typescript
const MECHANISM_PATTERNS = [
  // "X works by Y"
  /(\w+)\s+works?\s+(?:by|through|via)\s+([^.]+)/gi,
  
  // "The mechanism is X"
  /(?:the\s+)?mechanism\s+(?:is|involves)\s+([^.]+)/gi,
  
  // "Caused by X"
  /caused\s+by\s+([^.]+)/gi,
  
  // "Results from X"
  /results?\s+(?:from|in)\s+([^.]+)/gi,
  
  // "Due to X"
  /due\s+to\s+([^.]+)/gi,
  
  // "Because of X"
  /because\s+(?:of\s+)?([^.]+)/gi,
];
```

#### 5.3 Mechanism Visualization
**New Component**: `src/components/causal-chat/visuals/MechanismCloud.tsx`

- Word cloud of extracted mechanisms
- Color-coded by domain (physics=blue, biology=green, etc.)
- Click to highlight related messages
- Export mechanism list

### Acceptance Criteria
- [ ] Extract 3+ mechanisms from typical scientific responses
- [ ] Categorize mechanisms by domain with >80% accuracy
- [ ] LLM fallback for complex extractions
- [ ] Visual cloud displays top mechanisms

---

## Phase 6: Testing & Validation Strategy

### Objective
Ensure all components work correctly through comprehensive testing.

### Test Plan

#### 6.1 Unit Tests

**CausalIntegrityService Tests**:
```typescript
describe('CausalIntegrityService', () => {
  it('detects L1 (Association) in correlation statements', () => {
    const text = "X is associated with Y in most cases";
    expect(service.evaluate(text).score).toBe(1);
  });
  
  it('detects L2 (Intervention) in mechanism statements', () => {
    const text = "If we intervene on X, Y changes through mechanism Z";
    expect(service.evaluate(text).score).toBe(2);
  });
  
  it('detects L3 (Counterfactual) in hypothetical statements', () => {
    const text = "Had X been different, Y would have occurred";
    expect(service.evaluate(text).score).toBe(3);
  });
  
  it('detects Oracle Mode after 3 L3 messages', () => {
    const results = [
      { score: 3, confidence: 0.9 },
      { score: 3, confidence: 0.85 },
      { score: 3, confidence: 0.82 },
    ];
    expect(service.detectPhaseShift(results)).toBe(true);
  });
});
```

#### 6.2 Integration Tests

**API Route Tests**:
- Test SSE stream includes all event types
- Test causal density updates stream correctly
- Test session persistence

**Database Tests**:
- Test axiom compression stores correctly
- Test no duplicate axioms created
- Test session statistics calculation

#### 6.3 E2E Tests

**User Flows**:
1. Start chat → Ask scientific question → Verify gauge appears
2. Continue conversation → Reach Oracle Mode → Verify indicator
3. End session → Verify axioms extracted
4. Reload page → Verify session restored with density

#### 6.4 Performance Benchmarks

| Metric | Target |
|--------|--------|
| Density analysis latency | <50ms per message |
| Axiom compression time | <2s per session |
| Database query time | <100ms |
| UI render time | <16ms (60fps) |

### Acceptance Criteria
- [ ] >90% test coverage for new services
- [ ] All E2E flows pass
- [ ] Performance benchmarks met
- [ ] No regressions in existing functionality

---

## Implementation Timeline

### Week 1: Foundation
- Phase 1: Axiom Compression Service
- Database migrations
- Basic UI panel

### Week 2: Real-time Features
- Phase 2: Streaming density
- Enhanced CausalGauge animations
- Integration with API

### Week 3: Advanced Features
- Phase 3: Oracle Mode
- Phase 4: Session persistence
- History sidebar enhancements

### Week 4: Polish & Testing
- Phase 5: Mechanism extraction
- Phase 6: Testing & validation
- Bug fixes and optimization

---

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Frontend["Frontend Layer"]
        UI[TruthStream]
        GG[CausalGauge]
        OP[OracleModeIndicator]
        AP[AxiomPanel]
        MC[MechanismCloud]
    end
    
    subgraph API["API Layer"]
        ROUTE[/api/causal-chat]
        STREAM[StreamingCausalAnalyzer]
    end
    
    subgraph Services["Service Layer"]
        CIS[CausalIntegrityService]
        ACS[AxiomCompressionService]
        OMS[OracleModeService]
        SS[SessionService]
        ME[MechanismExtractor]
    end
    
    subgraph Database["Database Layer"]
        CS[(causal_chat_sessions)]
        CM[(causal_chat_messages)]
        CA[(causal_axioms)]
    end
    
    UI --> GG
    UI --> OP
    UI --> AP
    UI --> MC
    
    ROUTE --> STREAM
    STREAM --> CIS
    
    CIS --> OMS
    CIS --> ME
    
    ACS --> CA
    SS --> CS
    SS --> CM
    
    OMS --> UI
    ACS --> AP
    ME --> MC
```

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM rate limits for axiom compression | Medium | High | Batch processing, caching |
| Performance degradation with streaming | Low | Medium | Throttling, debouncing |
| Database migration issues | Low | High | Test migrations, backups |
| UI complexity increases | Medium | Medium | Component isolation, storybook |

---

## Success Metrics

1. **User Engagement**: Average session length increases 20%
2. **Causal Quality**: 80% of messages reach L2 or higher
3. **Oracle Mode**: Activated in 30% of scientific sessions
4. **Axiom Utility**: 50% of axioms referenced in future sessions
5. **Performance**: <100ms added latency per message

---

## Appendix: File Structure

```
synthesis-engine/src/
├── components/causal-chat/visuals/
│   ├── TruthStream.tsx          # Existing - message list
│   ├── CausalGauge.tsx          # Existing - density meter
│   ├── UnifiedField.tsx         # Existing - background
│   ├── OracleModeIndicator.tsx  # NEW - Oracle mode UI
│   ├── AxiomPanel.tsx           # NEW - Axiom display
│   └── MechanismCloud.tsx       # NEW - Mechanism viz
│
├── lib/services/
│   ├── streaming-causal-analyzer.ts  # NEW - Real-time analysis
│   ├── axiom-compression-service.ts  # NEW - Axiom extraction
│   ├── oracle-mode-service.ts        # NEW - Phase shift detection
│   ├── session-service.ts            # NEW - Persistence layer
│   └── mechanism-extractor.ts        # NEW - NLP extraction
│
├── lib/ai/
│   └── causal-integrity-service.ts   # Existing - enhance
│
└── app/api/causal-chat/
    └── route.ts                 # Modify - add streaming events
```
