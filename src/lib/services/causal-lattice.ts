import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CrossSessionAxiomEvent, LatticeBroadcastGateResult } from "@/types/persistent-memory";

interface LatticePolicyInput {
  originSessionId: string;
  targetSessionId: string;
  userId: string;
  domain: string;
  confidenceThreshold: number;
}

export class CausalLatticeService {
  validateBroadcastPolicy(input: LatticePolicyInput): LatticeBroadcastGateResult {
    const event: CrossSessionAxiomEvent = {
      originSessionId: input.originSessionId,
      targetSessionId: input.targetSessionId,
      axiomIds: [],
      policy: "same_user_domain_compatibility",
      timestamp: new Date().toISOString(),
    };

    if (!input.originSessionId || !input.targetSessionId || !input.userId) {
      return { accepted: false, reason: "missing_required_context", event };
    }

    if (input.originSessionId === input.targetSessionId) {
      return { accepted: false, reason: "same_session_noop", event };
    }

    if (input.confidenceThreshold < 0.5) {
      return { accepted: false, reason: "confidence_threshold_too_low", event };
    }

    return { accepted: true, reason: "policy_pass", event };
  }

  async broadcastValidatedAxioms(
    supabase: SupabaseClient,
    input: LatticePolicyInput,
  ): Promise<LatticeBroadcastGateResult> {
    const gate = this.validateBroadcastPolicy(input);

    if (!gate.accepted) {
      await supabase.from("cross_session_axiom_events").insert({
        id: randomUUID(),
        origin_session_id: input.originSessionId,
        target_session_id: input.targetSessionId,
        axiom_ids: [],
        policy: gate.reason,
        accepted: false,
        created_at: new Date().toISOString(),
      });
      return gate;
    }

    const { data: entries } = await supabase
      .from("causal_memory_entries")
      .select("id, confidence")
      .eq("session_id", input.originSessionId)
      .gte("confidence", input.confidenceThreshold)
      .order("created_at", { ascending: false })
      .limit(12);

    const axiomIds = (entries || []).map((entry: { id: string }) => entry.id);

    const event: CrossSessionAxiomEvent = {
      ...gate.event,
      axiomIds,
    };

    await supabase.from("cross_session_axiom_events").insert({
      id: randomUUID(),
      origin_session_id: input.originSessionId,
      target_session_id: input.targetSessionId,
      axiom_ids: axiomIds,
      policy: event.policy,
      accepted: true,
      created_at: event.timestamp,
    });

    return {
      accepted: true,
      reason: axiomIds.length > 0 ? "broadcast_applied" : "broadcast_no_axioms",
      event,
    };
  }
}
