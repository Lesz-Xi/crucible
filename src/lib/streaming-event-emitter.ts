
import { SynthesisResult, HypothesisNode } from "@/types";

export type AgentPersona = 'creator' | 'skeptic' | 'architect' | 'methodologist';

export type StreamEvent = 
  | { event: 'ingestion_start', files: number }
  | { event: 'pdf_processed', filename: string }
  | { event: 'pdf_error', filename: string, error: string }
  | { event: 'hypothesis_generated', hypothesis: HypothesisNode }
  | { event: 'hypothesis_refuted', id: string, reason: string }
  | { event: 'confidence_update', factor: string, score: number }
  | { event: 'agent_switch', agent: AgentPersona }
  | { event: 'thinking_step', content: string }
  | { event: 'step_update', step: string }
  | { event: 'protocol_validated', ideaId: string, success: boolean, pValue?: number }
  | { event: 'spectral_gap_analysis', spectralGap: { lambda_min: number, lambda_max: number, spectralGap: number, conditionNumber: number, threshold: number }, lipschitzConstant: number, expansionTriggered?: boolean }
  | { event: 'thermodynamic_expansion', triggered: boolean, temperature: number }
  | { event: 'phase_transition', phase: string, stepIndex: number }
  | { event: 'phase_transition', phase: string, stepIndex: number }
  | { 
      event: 'consciousness_update', 
      state: {
        mode: 'strict' | 'balanced' | 'exploratory',
        ceiling: number,
        friction_alert: { alert: boolean, reason?: string },
        causal_evidence?: { pn: number, ps: number, rr: number },
        history: { scores: number[], avg_score: number, rejection_rate: number },
        mode_history: Array<{ mode: string, score: number, timestamp: string }>
      }
    }
  | { event: 'complete', synthesis: SynthesisResult }
  | { event: 'error', message: string };

export class StreamingEventEmitter {
  private controller: ReadableStreamDefaultController | WritableStreamDefaultWriter;
  private encoder: TextEncoder;

  constructor(controller: ReadableStreamDefaultController | WritableStreamDefaultWriter) {
    this.controller = controller;
    this.encoder = new TextEncoder();
  }

  emit(data: StreamEvent) {
    try {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      const encoded = this.encoder.encode(payload);
      
      if ('enqueue' in this.controller) {
        this.controller.enqueue(encoded);
      } else {
        this.controller.write(encoded);
      }
    } catch (error) {
      console.warn("Failed to emit event:", error);
    }
  }

  close() {
    try {
      this.controller.close();
    } catch (error) {
      console.warn("Failed to close controller:", error);
    }
  }
}
