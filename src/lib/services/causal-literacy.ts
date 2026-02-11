import {
  CausalLiteracyLayer,
  CausalLiteracyRequest,
  CausalLiteracyResponse,
  SCMModel,
  SCMModelVersion,
  TeachBackEdit,
  TeachBackMode,
} from "@/types/scm";

type GraphNode = { name: string } | { id: string } | Record<string, unknown>;
type GraphEdge = { from: string; to: string } | Record<string, unknown>;
type CanonicalEdge = { from: string; to: string };

const NOVICE_MAX_BULLETS = 4;
const INTERMEDIATE_MAX_BULLETS = 6;
const NOVICE_MECHANISM_BULLET_MAX_CHARS = 200;
const INTERMEDIATE_BULLET_MAX_CHARS = 260;
const EXPERT_BULLET_MAX_CHARS = 360;

const OUTCOME_PRIORITY_TOKENS = ["performance", "outcome", "failure", "risk", "harm"];
const QUICK_LIMITATIONS = [
  "Heuristic propagation estimates directional impact only.",
  "No structural equation solving is performed in quick mode.",
  "Result is ephemeral and not persisted.",
];
const FULL_LIMITATIONS = [
  "Deterministic graph diff analyzes topology, not full equation dynamics.",
  "Path deltas estimate structural change and not calibrated outcome magnitude.",
  "Result is ephemeral and not persisted.",
];

const QUICK_OPERATION_PENALTY: Record<TeachBackEdit["type"], number> = {
  add_edge: -0.04,
  remove_edge: -0.03,
  remove_variable: -0.08,
  challenge_assumption: -0.05,
};

const FULL_OPERATION_PENALTY: Record<TeachBackEdit["type"], number> = {
  add_edge: -0.03,
  remove_edge: -0.02,
  remove_variable: -0.06,
  challenge_assumption: -0.04,
};

function sanitizeFormalText(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\*+/g, "").replace(/`+/g, "").replace(/\s+/g, " ").trim();
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function getNodeName(node: GraphNode): string | null {
  if (typeof (node as any).name === "string") return (node as any).name;
  if (typeof (node as any).id === "string") return (node as any).id;
  return null;
}

function getEdgeFrom(edge: GraphEdge): string | null {
  if (typeof (edge as any).from === "string") return (edge as any).from;
  if (typeof (edge as any).source === "string") return (edge as any).source;
  return null;
}

function getEdgeTo(edge: GraphEdge): string | null {
  if (typeof (edge as any).to === "string") return (edge as any).to;
  if (typeof (edge as any).target === "string") return (edge as any).target;
  return null;
}

function edgeKey(edge: CanonicalEdge): string {
  return `${edge.from}=>${edge.to}`;
}

function canonicalizeEdges(rawEdges: GraphEdge[]): CanonicalEdge[] {
  const canonical = rawEdges
    .map((edge) => ({ from: getEdgeFrom(edge), to: getEdgeTo(edge) }))
    .filter(
      (edge): edge is { from: string; to: string } =>
        typeof edge.from === "string" && edge.from.length > 0 && typeof edge.to === "string" && edge.to.length > 0
    );

  const dedup = new Map<string, CanonicalEdge>();
  for (const edge of canonical) {
    dedup.set(edgeKey(edge), edge);
  }

  return Array.from(dedup.values()).sort((a, b) => edgeKey(a).localeCompare(edgeKey(b)));
}

function summarizeAssumptions(version: SCMModelVersion): string[] {
  const assumptions = Array.isArray(version.assumptionsJson) ? version.assumptionsJson : [];
  if (assumptions.length === 0) return ["No explicit assumptions stored; interpret constraints conservatively."];
  return assumptions
    .slice(0, 4)
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        return (item as any).description || JSON.stringify(item);
      }
      return String(item);
    })
    .map((s) => sanitizeFormalText(s));
}

function userLevelTone(userLevel: CausalLiteracyRequest["userLevel"]) {
  if (userLevel === "novice") {
    return {
      modelIntro: "Think of this as a map of causes and effects, not just correlations.",
      interventionIntro: "A do-intervention means we actively change one factor and watch what follows.",
      counterfactualIntro: "Counterfactual asks: what would likely have happened if one key factor were different?",
      assumptionIntro: "Assumptions are the parts where the model can be wrong even if the math is clean.",
    };
  }
  if (userLevel === "expert") {
    return {
      modelIntro: "Structural representation with directed mechanisms and explicit variable roles.",
      interventionIntro: "Intervention layer approximates do-operator effects over downstream nodes.",
      counterfactualIntro: "Counterfactual layer summarizes necessity/sufficiency style checks.",
      assumptionIntro: "Assumption layer surfaces identifiability and confounder caveats.",
    };
  }
  return {
    modelIntro: "The DAG encodes mechanism direction and where causal leverage exists.",
    interventionIntro: "Interventions approximate policy effects by propagating structural changes.",
    counterfactualIntro: "Counterfactuals test whether outcomes persist under altered antecedents.",
    assumptionIntro: "Assumptions and confounders define model reliability boundaries.",
  };
}

function buildLayer(title: string, summary: string, bullets: string[]): CausalLiteracyLayer {
  return {
    title,
    summary,
    bullets,
  };
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  const sliced = value.slice(0, maxChars);
  const lastSpace = sliced.lastIndexOf(" ");
  const cutoff = lastSpace > 0 ? lastSpace : maxChars;
  return `${sliced.slice(0, cutoff).trimEnd()}...`;
}

function splitLongTextBySeparator(value: string, separator: RegExp, maxChars: number): string[] {
  const pieces = value
    .split(separator)
    .map((piece) => sanitizeFormalText(piece))
    .filter((piece) => piece.length > 0);

  if (pieces.length === 0) return [value];

  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    const candidate = current ? `${current} ${piece}` : piece;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) chunks.push(current);
    current = piece.length > maxChars ? truncateText(piece, maxChars) : piece;
  }
  if (current) chunks.push(current);

  return chunks.length > 0 ? chunks : [truncateText(value, maxChars)];
}

function splitLongBulletText(
  value: string,
  maxChars: number,
  maxChunks: number
): string[] {
  const normalized = sanitizeFormalText(value);
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const stepExpanded = normalized.replace(/\s+\((\d+)\)\s+/g, ". Step $1: ");
  let chunks = splitLongTextBySeparator(stepExpanded, /(?<=[.!?])\s+/g, maxChars);

  if (chunks.length <= 1 && stepExpanded.length > maxChars) {
    chunks = splitLongTextBySeparator(stepExpanded, /[,;]\s+/g, maxChars);
  }

  if (chunks.length <= maxChunks) return chunks;

  const trimmed = chunks.slice(0, maxChunks - 1);
  const overflow = chunks.slice(maxChunks - 1).join(" ");
  trimmed.push(overflow);
  return trimmed;
}

function formatBulletForDepth(
  bullet: string,
  userLevel: CausalLiteracyRequest["userLevel"]
): string[] {
  const normalized = sanitizeFormalText(bullet);
  if (!normalized) return [];

  if (userLevel === "novice") {
    if (/^Mechanism Claim:/i.test(normalized)) {
      return splitLongBulletText(normalized, NOVICE_MECHANISM_BULLET_MAX_CHARS, 3);
    }
    return [normalized];
  }

  if (userLevel === "intermediate") {
    return splitLongBulletText(normalized, INTERMEDIATE_BULLET_MAX_CHARS, 4);
  }

  return splitLongBulletText(normalized, EXPERT_BULLET_MAX_CHARS, 3);
}

function applyDepthToBullets(
  bullets: string[],
  userLevel: CausalLiteracyRequest["userLevel"]
): string[] {
  const maxBullets =
    userLevel === "novice"
      ? NOVICE_MAX_BULLETS
      : userLevel === "intermediate"
        ? INTERMEDIATE_MAX_BULLETS
        : Number.POSITIVE_INFINITY;

  const normalized = bullets.flatMap((bullet) => formatBulletForDepth(bullet, userLevel));

  return normalized.slice(0, maxBullets);
}

function applyDepthToLayer(
  layer: CausalLiteracyLayer,
  userLevel: CausalLiteracyRequest["userLevel"]
): CausalLiteracyLayer {
  return {
    ...layer,
    bullets: applyDepthToBullets(layer.bullets, userLevel),
  };
}

function parseConfounders(values: Array<Record<string, unknown> | string> | undefined): string[] {
  return (values ?? [])
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        const name = (item as any).name;
        if (typeof name === "string") return name;
        return JSON.stringify(item);
      }
      return String(item);
    })
    .map((entry) => sanitizeFormalText(entry))
    .filter((entry) => entry.length > 0);
}

function parseNodeNames(nodes: GraphNode[]): string[] {
  return uniqueSorted(
    nodes
      .map((node) => getNodeName(node))
      .filter((node): node is string => typeof node === "string" && node.trim().length > 0)
  );
}

function inferOutcomeVariable(nodeNames: string[]): string {
  for (const nodeName of nodeNames) {
    const token = normalizeToken(nodeName);
    if (OUTCOME_PRIORITY_TOKENS.some((candidate) => token.includes(candidate))) {
      return nodeName;
    }
  }
  return nodeNames[nodeNames.length - 1] || "Outcome";
}

function buildAdjacency(edges: CanonicalEdge[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adjacency.get(edge.from) ?? [];
    list.push(edge.to);
    adjacency.set(edge.from, list);
  }

  for (const [node, children] of adjacency.entries()) {
    adjacency.set(node, uniqueSorted(children));
  }

  return adjacency;
}

function reachableFromRoots(edges: CanonicalEdge[], roots: string[]): Set<string> {
  const adjacency = buildAdjacency(edges);
  const reachable = new Set<string>();
  const queue = [...roots];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of adjacency.get(current) ?? []) {
      if (reachable.has(child)) continue;
      reachable.add(child);
      queue.push(child);
    }
  }

  return reachable;
}

function shortestPathLength(edges: CanonicalEdge[], from: string, to: string): number | null {
  const adjacency = buildAdjacency(edges);
  const queue: Array<{ node: string; depth: number }> = [{ node: from, depth: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (normalizeToken(current.node) === normalizeToken(to)) return current.depth;
    const key = normalizeToken(current.node);
    if (visited.has(key)) continue;
    visited.add(key);

    for (const child of adjacency.get(current.node) ?? []) {
      const childKey = normalizeToken(child);
      if (!visited.has(childKey)) {
        queue.push({ node: child, depth: current.depth + 1 });
      }
    }
  }

  return null;
}

function inferRootsFromAssumption(
  assumption: string,
  nodeNames: string[],
  confounders: string[]
): string[] {
  const normalizedAssumption = normalizeToken(assumption);
  if (!normalizedAssumption) return [];

  const candidates = uniqueSorted([...nodeNames, ...confounders]);
  const matched = candidates.filter((candidate) => {
    const normalizedCandidate = normalizeToken(candidate);
    if (!normalizedCandidate) return false;
    return (
      normalizedAssumption.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedAssumption)
    );
  });

  if (matched.length > 0) return matched;

  const assumptionTokens = assumption
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);

  const tokenMatched = candidates.filter((candidate) => {
    const normalizedCandidate = normalizeToken(candidate);
    return assumptionTokens.some(
      (token) => normalizedCandidate.includes(token) || token.includes(normalizedCandidate)
    );
  });

  if (tokenMatched.length > 0) return uniqueSorted(tokenMatched);

  return uniqueSorted(confounders.slice(0, 2));
}

function applyEdits(baseEdges: CanonicalEdge[], edits: TeachBackEdit[]): {
  editedEdges: CanonicalEdge[];
  touchedRoots: string[];
  operationPenaltyQuick: number;
  operationPenaltyFull: number;
  lastOperation: TeachBackEdit["type"];
} {
  let edited = [...baseEdges];
  const roots = new Set<string>();
  let operationPenaltyQuick = 0;
  let operationPenaltyFull = 0;
  let lastOperation: TeachBackEdit["type"] = "challenge_assumption";

  for (const edit of edits) {
    lastOperation = edit.type;
    operationPenaltyQuick += QUICK_OPERATION_PENALTY[edit.type];
    operationPenaltyFull += FULL_OPERATION_PENALTY[edit.type];

    switch (edit.type) {
      case "add_edge":
        if (edit.from && edit.to) {
          edited.push({ from: edit.from, to: edit.to });
          roots.add(edit.from);
        }
        break;
      case "remove_edge":
        if (edit.from && edit.to) {
          edited = edited.filter((edge) => !(edge.from === edit.from && edge.to === edit.to));
          roots.add(edit.from);
        }
        break;
      case "remove_variable":
        if (edit.variable) {
          edited = edited.filter((edge) => edge.from !== edit.variable && edge.to !== edit.variable);
          roots.add(edit.variable);
        }
        break;
      case "challenge_assumption":
        break;
      default:
        break;
    }
  }

  return {
    editedEdges: canonicalizeEdges(edited),
    touchedRoots: uniqueSorted(Array.from(roots)),
    operationPenaltyQuick,
    operationPenaltyFull,
    lastOperation,
  };
}

function clamp(value: number, min = -0.5, max = 0.2): number {
  return Math.max(min, Math.min(max, value));
}

function computePathDelta(roots: string[], baselineEdges: CanonicalEdge[], editedEdges: CanonicalEdge[], outcome: string): number {
  let changed = 0;
  for (const root of roots) {
    const before = shortestPathLength(baselineEdges, root, outcome);
    const after = shortestPathLength(editedEdges, root, outcome);
    if (before !== after) changed += 1;
  }
  return changed;
}

function computeTeachBack(params: {
  mode: TeachBackMode;
  edits: TeachBackEdit[];
  nodeNames: string[];
  baseEdges: CanonicalEdge[];
  confounders: string[];
  outcomeVariable: string;
}): CausalLiteracyResponse["teachBack"] {
  const { mode, edits, nodeNames, baseEdges, confounders, outcomeVariable } = params;
  const editResult = applyEdits(baseEdges, edits);

  const assumptionRoots = uniqueSorted(
    edits
      .filter((edit) => edit.type === "challenge_assumption")
      .flatMap((edit) => inferRootsFromAssumption(edit.assumption ?? "", nodeNames, confounders))
  );

  const effectiveRoots = uniqueSorted([
    ...editResult.touchedRoots,
    ...assumptionRoots,
    ...(editResult.touchedRoots.length === 0 && assumptionRoots.length === 0 ? confounders.slice(0, 2) : []),
  ]);

  const baselineReachable = reachableFromRoots(baseEdges, effectiveRoots);
  const editedReachable = reachableFromRoots(editResult.editedEdges, effectiveRoots);

  const newlyReachable = uniqueSorted(Array.from(editedReachable).filter((node) => !baselineReachable.has(node))).slice(0, 8);
  const noLongerReachable = uniqueSorted(Array.from(baselineReachable).filter((node) => !editedReachable.has(node))).slice(0, 8);

  const affectedNodes =
    mode === "full_recompute"
      ? uniqueSorted([...newlyReachable, ...noLongerReachable, ...effectiveRoots])
      : uniqueSorted(Array.from(editedReachable));

  const baselineEdgeSet = new Set(baseEdges.map(edgeKey));
  const editedEdgeSet = new Set(editResult.editedEdges.map(edgeKey));

  const addedEdges = Array.from(editedEdgeSet).filter((edge) => !baselineEdgeSet.has(edge)).length;
  const removedEdges = Array.from(baselineEdgeSet).filter((edge) => !editedEdgeSet.has(edge)).length;
  const affectedPaths = computePathDelta(effectiveRoots, baseEdges, editResult.editedEdges, outcomeVariable);

  const hasStructuralEvidence = newlyReachable.length > 0 || noLongerReachable.length > 0 || affectedPaths > 0;

  let confidenceDelta =
    mode === "full_recompute" ? editResult.operationPenaltyFull : editResult.operationPenaltyQuick;

  if (mode === "full_recompute" && hasStructuralEvidence && confidenceDelta < 0) {
    confidenceDelta += 0.02;
  }

  const isNoEffect =
    mode === "full_recompute"
      ? newlyReachable.length === 0 && noLongerReachable.length === 0 && affectedPaths === 0
      : affectedNodes.length === 0;

  const consequenceSummary = isNoEffect
    ? mode === "full_recompute"
      ? "No structural reachability change detected after recompute."
      : "No graph-propagation effect detected from current assumption mapping."
    : mode === "full_recompute"
      ? `Recompute detected ${addedEdges} added edge(s), ${removedEdges} removed edge(s), and ${affectedPaths} path delta(s).`
      : `Heuristic propagation touched ${affectedNodes.length} downstream node(s): ${affectedNodes.slice(0, 8).join(", ")}.`;

  return {
    mode,
    operation: editResult.lastOperation,
    persisted: false,
    method: mode === "full_recompute" ? "deterministic_graph_diff" : "heuristic_graph_propagation",
    uncertainty: mode === "full_recompute" ? "medium" : "high",
    limitations: mode === "full_recompute" ? FULL_LIMITATIONS : QUICK_LIMITATIONS,
    affectedNodes,
    confidenceDelta: Number(clamp(confidenceDelta).toFixed(2)),
    consequenceSummary,
    ...(mode === "full_recompute"
      ? {
          delta: {
            addedEdges,
            removedEdges,
            affectedPaths,
            newlyReachable,
            noLongerReachable,
          },
        }
      : {}),
  };
}

export function buildLiteracyExplanation(params: {
  model: SCMModel;
  modelVersion: SCMModelVersion;
  request: CausalLiteracyRequest;
}): CausalLiteracyResponse {
  const { model, modelVersion, request } = params;
  const tone = userLevelTone(request.userLevel);
  const dag = modelVersion.dagJson ?? { nodes: [], edges: [] };
  const nodes = Array.isArray(dag.nodes) ? (dag.nodes as GraphNode[]) : [];
  const edges = Array.isArray(dag.edges) ? (dag.edges as GraphEdge[]) : [];

  const nodeNames = parseNodeNames(nodes);
  const canonicalEdges = canonicalizeEdges(edges);
  const outcomeVariable = inferOutcomeVariable(nodeNames);

  const hypothesis = request.hypothesis ?? {};
  const confounders = hypothesis.confounderSet ?? parseConfounders(modelVersion.confoundersJson);

  const modelLayer = applyDepthToLayer(
    buildLayer("Model Layer", tone.modelIntro, [
      `Model: ${model.name} v${modelVersion.version} (${model.domain})`,
      `Variables: ${nodes.length} · Directed Links: ${canonicalEdges.length}`,
      hypothesis.thesis
        ? `Current Hypothesis: ${sanitizeFormalText(hypothesis.thesis)}`
        : "No explicit hypothesis thesis provided for this explanation.",
    ]),
    request.userLevel
  );

  const interventionLayer = applyDepthToLayer(
    buildLayer("Intervention Layer", tone.interventionIntro, [
      hypothesis.doPlan || hypothesis.doQuery || "No explicit do-plan provided; intervention path inferred from DAG.",
      hypothesis.mechanism
        ? `Mechanism Claim: ${sanitizeFormalText(hypothesis.mechanism)}`
        : "Mechanism claim missing; intervention confidence is reduced.",
      "Downstream impact is estimated from directed paths, not correlation strength alone.",
    ]),
    request.userLevel
  );

  const counterfactualLayer = applyDepthToLayer(
    buildLayer("Counterfactual Layer", tone.counterfactualIntro, [
      hypothesis.falsifier || "No falsifier provided yet. Add one to make this claim truly testable.",
      "Necessity check asks whether outcome still appears if proposed cause is removed.",
      "Sufficiency check asks whether applying the cause induces the outcome under stable confounders.",
    ]),
    request.userLevel
  );

  const assumptionLayer = applyDepthToLayer(
    buildLayer("Assumption Layer", tone.assumptionIntro, [
      ...summarizeAssumptions(modelVersion),
      confounders.length > 0
        ? `Tracked confounders: ${confounders.slice(0, 5).join(", ")}`
        : "No confounders declared; causal estimates are likely optimistic.",
      request.audit?.validityScore !== undefined
        ? `Audit score reference: ${request.audit.validityScore}/100`
        : "No audit score attached for this explanation.",
    ]),
    request.userLevel
  );

  const response: CausalLiteracyResponse = {
    success: true,
    modelRef: {
      modelKey: model.modelKey,
      version: modelVersion.version,
    },
    userLevel: request.userLevel,
    modelLayer,
    interventionLayer,
    counterfactualLayer,
    assumptionLayer,
  };

  if (request.teachBackEdits && request.teachBackEdits.length > 0) {
    const sandboxMode: TeachBackMode = request.sandboxMode ?? "quick_estimate";

    response.teachBack = computeTeachBack({
      mode: sandboxMode,
      edits: request.teachBackEdits,
      nodeNames,
      baseEdges: canonicalEdges,
      confounders,
      outcomeVariable,
    });
  }

  return response;
}
