import type {
  HybridTimelineReceipt,
  HybridTimelineStageKey,
  HybridTimelineStageRecord,
  HybridTimelineStageState,
  HybridTimelineStageTelemetry,
} from '@/types/hybrid-timeline';

const STAGE_SPECS: Array<{
  stage: HybridTimelineStageKey;
  title: string;
  rationale: string;
  optional: boolean;
}> = [
  {
    stage: 'ingestion',
    title: 'Ingestion',
    rationale: 'Sources accepted and queued for deterministic processing.',
    optional: false,
  },
  {
    stage: 'pdf_parsing',
    title: 'PDF Parsing',
    rationale: 'Extracting textual structure and candidate evidence spans.',
    optional: false,
  },
  {
    stage: 'entity_harvest',
    title: 'Entity Harvest',
    rationale: 'Resolving company entities and semantic proxies for synthesis.',
    optional: true,
  },
  {
    stage: 'contradiction_scan',
    title: 'Contradiction Scan',
    rationale: 'Building contradiction matrix and confidence-tagged tensions.',
    optional: false,
  },
  {
    stage: 'hypothesis_generation',
    title: 'Hypothesis Generation',
    rationale: 'Generating causal candidates with refinement and critique loops.',
    optional: false,
  },
  {
    stage: 'novelty_proof',
    title: 'Novelty Proof',
    rationale: 'Computing prior-art distance, mechanism delta, and falsifiability.',
    optional: false,
  },
  {
    stage: 'novelty_gate',
    title: 'Novelty Gate',
    rationale: 'Applying hard novelty policy to pass, recover, or fail.',
    optional: false,
  },
  {
    stage: 'recovery_plan',
    title: 'Recovery Plan',
    rationale: 'Generating rerun recipe when novelty evidence is insufficient.',
    optional: true,
  },
  {
    stage: 'completed',
    title: 'Completed',
    rationale: 'Scientific receipt finalized and run persisted.',
    optional: false,
  },
];

export function createInitialTimelineReceipt(now = new Date().toISOString()): HybridTimelineReceipt {
  return {
    startedAt: now,
    stages: STAGE_SPECS.map((spec): HybridTimelineStageRecord => ({
      stage: spec.stage,
      title: spec.title,
      rationale: spec.rationale,
      optional: spec.optional,
      state: 'pending',
    })),
  };
}

function findStageIndex(stages: HybridTimelineStageRecord[], key: HybridTimelineStageKey): number {
  return stages.findIndex((stage) => stage.stage === key);
}

export function updateTimelineStage(
  receipt: HybridTimelineReceipt,
  input: {
    stage: HybridTimelineStageKey;
    state: HybridTimelineStageState;
    timestamp?: string;
    telemetry?: HybridTimelineStageTelemetry;
  },
): HybridTimelineReceipt {
  const timestamp = input.timestamp || new Date().toISOString();
  const next: HybridTimelineReceipt = {
    ...receipt,
    stages: receipt.stages.map((stage) => ({ ...stage })),
  };

  const index = findStageIndex(next.stages, input.stage);
  if (index < 0) {
    return next;
  }

  const stage = next.stages[index];
  stage.state = input.state;
  stage.telemetry = {
    ...(stage.telemetry || {}),
    ...(input.telemetry || {}),
  };

  if (input.state === 'active' && !stage.startedAt) {
    stage.startedAt = timestamp;
  }
  if ((input.state === 'done' || input.state === 'skipped' || input.state === 'blocked') && !stage.completedAt) {
    if (!stage.startedAt) {
      stage.startedAt = timestamp;
    }
    stage.completedAt = timestamp;
    stage.telemetry = {
      ...(stage.telemetry || {}),
      durationMs: Date.parse(stage.completedAt) - Date.parse(stage.startedAt),
    };
  }

  if (input.stage === 'completed' && (input.state === 'done' || input.state === 'blocked')) {
    next.completedAt = timestamp;
    next.totalDurationMs = Date.parse(timestamp) - Date.parse(next.startedAt);
  }

  return next;
}

export function timelineStageOrder(stage: HybridTimelineStageKey): number {
  return STAGE_SPECS.findIndex((spec) => spec.stage === stage);
}
