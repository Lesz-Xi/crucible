/**
 * Streaming Causal Analyzer - Real-time Density Detection
 * 
 * Analyzes text chunks as they stream in to provide real-time
 * causal density updates. This enables the CausalGauge to animate
 * as the assistant generates text.
 * 
 * Following Demis Workflow:
 * - L1 Impact: Minimal overhead per chunk (<5ms)
 * - L2 Risk: Throttling prevents event flooding
 * - L3 Calibration: Debounced updates (max 2/second)
 * - L4 Critical Gap: Requires client-side state management
 */


import { CausalIntegrityService, CausalDensityResult } from "@/lib/ai/causal-integrity-service";

export interface StreamingDensityUpdate extends CausalDensityResult {
  /** Progress through the stream (0-100) */
  progress: number;
  /** Whether this is a significant change worth broadcasting */
  isSignificant: boolean;
  /** Chunks processed so far */
  chunksProcessed: number;
}

/**
 * Service for analyzing causal density in real-time streaming text.
 * Maintains state across chunks and detects significant changes.
 */
export class StreamingCausalAnalyzer {
  private service: CausalIntegrityService;
  private buffer: string = "";
  private chunksProcessed: number = 0;
  private lastSignificantResult: CausalDensityResult | null = null;
  private lastUpdateTime: number = 0;
  private totalExpectedChunks: number = 0;
  
  // Throttling configuration
  private readonly MIN_UPDATE_INTERVAL_MS = 500; // Max 2 updates per second
  private readonly SIGNIFICANCE_THRESHOLD = 0.15; // 15% confidence change

  constructor(expectedLength?: number) {
    this.service = new CausalIntegrityService();
    this.totalExpectedChunks = expectedLength ? Math.ceil(expectedLength / 5) : 0;
  }

  /**
   * Process an incoming text chunk.
   * Returns a density update if significant change detected or throttling allows.
   * 
   * @param chunk - The incoming text chunk
   * @returns Density update or null if no significant change
   */
  onChunk(chunk: string): StreamingDensityUpdate | null {
    this.buffer += chunk;
    this.chunksProcessed++;

    // Evaluate current density
    const currentResult = this.service.evaluate(this.buffer);
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;

    // Determine if this is a significant change
    const isSignificant = this.isSignificantChange(currentResult);
    
    // Check throttling - always allow significant level changes
    const levelChanged = this.lastSignificantResult?.score !== currentResult.score;
    const shouldUpdate = levelChanged || 
                        (isSignificant && timeSinceLastUpdate >= this.MIN_UPDATE_INTERVAL_MS);

    if (shouldUpdate) {
      this.lastSignificantResult = currentResult;
      this.lastUpdateTime = now;

      return {
        ...currentResult,
        progress: this.calculateProgress(),
        isSignificant: true,
        chunksProcessed: this.chunksProcessed,
      };
    }

    // Return non-significant update for progress tracking only
    return {
      ...currentResult,
      progress: this.calculateProgress(),
      isSignificant: false,
      chunksProcessed: this.chunksProcessed,
    };
  }

  /**
   * Get the current analysis of the entire buffered text.
   * Use this for final evaluation after streaming completes.
   */
  getCurrentAnalysis(): CausalDensityResult {
    return this.service.evaluate(this.buffer);
  }

  /**
   * Get the full buffered text.
   */
  getBuffer(): string {
    return this.buffer;
  }

  /**
   * Reset the analyzer for a new message.
   */
  reset(expectedLength?: number): void {
    this.buffer = "";
    this.chunksProcessed = 0;
    this.lastSignificantResult = null;
    this.lastUpdateTime = 0;
    this.totalExpectedChunks = expectedLength ? Math.ceil(expectedLength / 5) : 0;
  }

  /**
   * Check if the current result represents a significant change
   * from the last significant result.
   */
  private isSignificantChange(current: CausalDensityResult): boolean {
    if (!this.lastSignificantResult) return true;

    // Level change (L1->L2, L2->L3) is always significant
    if (current.score !== this.lastSignificantResult.score) {
      return true;
    }

    // Confidence change above threshold
    const confidenceDelta = Math.abs(
      current.confidence - this.lastSignificantResult.confidence
    );
    
    return confidenceDelta >= this.SIGNIFICANCE_THRESHOLD;
  }

  /**
   * Calculate progress percentage (0-100).
   */
  private calculateProgress(): number {
    if (this.totalExpectedChunks === 0) {
      // Unknown length - use chunks as rough proxy
      return Math.min(95, this.chunksProcessed * 5);
    }
    
    return Math.min(100, Math.round(
      (this.chunksProcessed / this.totalExpectedChunks) * 100
    ));
  }
}

/**
 * Batch analyzer for processing multiple chunks efficiently.
 * Buffers chunks and analyzes at intervals to reduce CPU usage.
 */
export class BatchedCausalAnalyzer {
  private analyzer: StreamingCausalAnalyzer;
  private chunkBuffer: string[] = [];
  private readonly BATCH_SIZE = 3; // Analyze every 3 chunks

  constructor(expectedLength?: number) {
    this.analyzer = new StreamingCausalAnalyzer(expectedLength);
  }

  /**
   * Add a chunk to the buffer.
   * Returns update only when batch is full.
   */
  addChunk(chunk: string): StreamingDensityUpdate | null {
    this.chunkBuffer.push(chunk);
    
    if (this.chunkBuffer.length >= this.BATCH_SIZE) {
      const combined = this.chunkBuffer.join("");
      this.chunkBuffer = [];
      return this.analyzer.onChunk(combined);
    }
    
    return null;
  }

  /**
   * Flush remaining chunks and get final analysis.
   */
  flush(): StreamingDensityUpdate {
    if (this.chunkBuffer.length > 0) {
      const combined = this.chunkBuffer.join("");
      this.chunkBuffer = [];
      return this.analyzer.onChunk(combined) || {
        ...this.analyzer.getCurrentAnalysis(),
        progress: 100,
        isSignificant: true,
        chunksProcessed: this.analyzer["chunksProcessed"],
      };
    }

    return {
      ...this.analyzer.getCurrentAnalysis(),
      progress: 100,
      isSignificant: true,
      chunksProcessed: this.analyzer["chunksProcessed"],
    };
  }

  /**
   * Reset for new message.
   */
  reset(expectedLength?: number): void {
    this.analyzer.reset(expectedLength);
    this.chunkBuffer = [];
  }
}
