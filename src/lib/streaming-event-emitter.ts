
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
  | { event: 'complete', synthesis: SynthesisResult }
  | { event: 'error', message: string };

export class StreamingEventEmitter {
  private controller: ReadableStreamDefaultController;
  private encoder: TextEncoder;

  constructor(controller: ReadableStreamDefaultController) {
    this.controller = controller;
    this.encoder = new TextEncoder();
  }

  emit(data: StreamEvent) {
    try {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      this.controller.enqueue(this.encoder.encode(payload));
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
