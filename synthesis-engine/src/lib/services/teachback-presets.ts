import { SCMModelVersion, TeachBackEdit, TeachBackMode } from "@/types/scm";

export type StressTestOperation = TeachBackEdit["type"];

export interface TeachBackPreset {
  id: string;
  label: string;
  displayLabel: string;
  description: string;
  rationale: string;
  canonical: string;
  expectedEffect: string;
  operation: StressTestOperation;
  mode: TeachBackMode;
  edit: TeachBackEdit;
}

export type TeachBackPresetCatalog = Record<
  TeachBackMode,
  Partial<Record<StressTestOperation, TeachBackPreset[]>>
>;

type CanonicalEdge = { from: string; to: string };
type AddEdgeRationaleCategory =
  | "confounder_to_outcome"
  | "treatment_to_outcome"
  | "high_outdegree_to_outcome"
  | "structural_gap";

type ParsedModel = {
  nodes: string[];
  edges: CanonicalEdge[];
  nodeDisplay: Map<string, string>;
  nodeHasRichDisplay: Map<string, boolean>;
  assumptions: string[];
  confounders: string[];
  outcome: string;
  inDegree: Map<string, number>;
  outDegree: Map<string, number>;
  edgeSet: Set<string>;
};

type ParsedNodeDescriptor = {
  key: string;
  displayName: string;
  aliases: string[];
  hasRichDisplay: boolean;
};

const MODE_OPERATION_MATRIX: Record<TeachBackMode, StressTestOperation[]> = {
  quick_estimate: ["challenge_assumption", "add_edge"],
  full_recompute: ["challenge_assumption", "add_edge", "remove_edge", "remove_variable"],
};

const FALLBACK_ASSUMPTIONS = [
  "Confounder control is incomplete",
  "Measurement error in key confounders is underestimated",
  "Selection effects violate exchangeability assumptions",
];

const OUTCOME_PRIORITY_TOKENS = ["performance", "outcome", "failure", "risk", "harm"];
const TREATMENT_TOKENS = ["treat", "intervention", "policy", "action", "dose", "control", "input"];

const DEFAULT_EXPECTED_EFFECT: Record<StressTestOperation, string> = {
  challenge_assumption: "Tests whether epistemic assumptions alter propagated consequence estimates.",
  add_edge: "Tests whether introducing a new structural pathway changes downstream reachability.",
  remove_edge: "Tests whether removing a pathway weakens downstream causal connectivity.",
  remove_variable: "Tests whether deleting a variable collapses dependencies in the local graph.",
};

const ADD_EDGE_RATIONALE_TEXT: Record<
  AddEdgeRationaleCategory,
  { rationale: string; expectedEffect: string }
> = {
  confounder_to_outcome: {
    rationale: "Suggested because the source looks like a confounder that may directly bias the outcome.",
    expectedEffect: "Checks whether confounding pathways become newly reachable at the outcome node.",
  },
  treatment_to_outcome: {
    rationale: "Suggested because the source appears intervention-like and may directly influence the outcome.",
    expectedEffect: "Checks for direct treatment-to-outcome reachability without intermediary mediators.",
  },
  high_outdegree_to_outcome: {
    rationale: "Suggested because the source is already structurally central and may plausibly bridge to the outcome.",
    expectedEffect: "Checks whether a central upstream node unlocks broader downstream propagation.",
  },
  structural_gap: {
    rationale: "Suggested as a structural gap candidate to probe missing mechanism pathways.",
    expectedEffect: "Checks whether adding this bridge introduces new downstream paths in graph recompute.",
  },
};

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function sanitizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function edgeKey(edge: CanonicalEdge): string {
  return `${edge.from}=>${edge.to}`;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => sanitizeText(item)).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function humanizeNodeToken(value: string): string {
  const cleaned = sanitizeText(
    value
      .replace(/[_-]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
  );
  if (!cleaned) return "Variable";

  return cleaned
    .split(" ")
    .map((part) => {
      if (!part) return part;
      if (part.length <= 2 && /^[A-Z0-9]+$/.test(part)) return part;
      return part[0].toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function isOpaqueNodeKey(value: string): boolean {
  const trimmed = sanitizeText(value);
  if (!trimmed) return true;
  if (/[_.-]/.test(trimmed)) return true;
  if (!/\s/.test(trimmed) && trimmed.length <= 4) return true;
  return false;
}

function readStringProperty(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw === "string") {
      const sanitized = sanitizeText(raw);
      if (sanitized) return sanitized;
    }
  }
  return null;
}

function parseNodeDescriptor(node: Record<string, unknown> | string): ParsedNodeDescriptor | null {
  if (typeof node === "string") {
    const canonical = sanitizeText(node);
    if (!canonical) return null;
    const hasRichDisplay = !isOpaqueNodeKey(canonical);
    return {
      key: canonical,
      displayName: hasRichDisplay ? canonical : humanizeNodeToken(canonical),
      aliases: [canonical],
      hasRichDisplay,
    };
  }

  const id = readStringProperty(node, ["id"]);
  const label = readStringProperty(node, ["label"]);
  const displayName = readStringProperty(node, ["displayName"]);
  const title = readStringProperty(node, ["title"]);
  const name = readStringProperty(node, ["name"]);

  const key = id || name || label || displayName || title;
  if (!key) return null;

  const preferredDisplay = label || displayName || title || name || id || humanizeNodeToken(key);
  const aliases = Array.from(new Set([id, name, label, displayName, title, key].filter(Boolean))) as string[];
  const hasRichDisplay = Boolean(label || displayName || title || (name && !isOpaqueNodeKey(name)));

  return {
    key,
    displayName: preferredDisplay,
    aliases,
    hasRichDisplay,
  };
}

function registerAlias(aliasToCanonical: Map<string, string>, alias: string, canonical: string): void {
  const normalized = normalizeToken(alias);
  if (!normalized || aliasToCanonical.has(normalized)) return;
  aliasToCanonical.set(normalized, canonical);
}

function resolveNodeKey(value: string, aliasToCanonical: Map<string, string>): string {
  const sanitized = sanitizeText(value);
  const normalized = normalizeToken(sanitized);
  return aliasToCanonical.get(normalized) ?? sanitized;
}

function ensureNodeEntry(
  nodeSet: Set<string>,
  nodeDisplay: Map<string, string>,
  nodeHasRichDisplay: Map<string, boolean>,
  nodeKey: string,
  hasRichDisplay: boolean,
  displayName?: string
): void {
  nodeSet.add(nodeKey);

  const priorRich = nodeHasRichDisplay.get(nodeKey) ?? false;
  const resolvedDisplay = sanitizeText(displayName ?? "") || humanizeNodeToken(nodeKey);
  const shouldPromoteDisplay = !nodeDisplay.has(nodeKey) || (!priorRich && hasRichDisplay);
  if (shouldPromoteDisplay) {
    nodeDisplay.set(nodeKey, resolvedDisplay);
  }

  nodeHasRichDisplay.set(nodeKey, priorRich || hasRichDisplay);
}

function parseRawEdges(version: SCMModelVersion | null | undefined): CanonicalEdge[] {
  const rawEdges = version?.dagJson?.edges ?? [];
  const parsed = rawEdges
    .map((edge) => {
      const entry = edge as Record<string, unknown>;
      const from = readStringProperty(entry, ["from"]);
      const to = readStringProperty(entry, ["to"]);
      if (!from || !to) return null;
      return { from, to };
    })
    .filter((edge): edge is CanonicalEdge => edge !== null);

  const dedup = new Map<string, CanonicalEdge>();
  for (const edge of parsed) {
    dedup.set(edgeKey(edge), edge);
  }
  return Array.from(dedup.values()).sort((a, b) => edgeKey(a).localeCompare(edgeKey(b)));
}

function parseAssumptions(version: SCMModelVersion | null | undefined): string[] {
  const rawAssumptions = version?.assumptionsJson ?? [];
  const parsed = rawAssumptions
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const description = readStringProperty(item as Record<string, unknown>, [
          "description",
          "assumption",
          "name",
          "label",
        ]);
        if (description) return description;
        return JSON.stringify(item);
      }
      return String(item);
    })
    .map((item) => sanitizeText(item))
    .filter((item) => item.length > 0);

  return uniqueSorted(parsed);
}

function parseConfounders(version: SCMModelVersion | null | undefined): string[] {
  const raw = version?.confoundersJson ?? [];
  const parsed = raw
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const name = readStringProperty(item as Record<string, unknown>, [
          "name",
          "label",
          "id",
          "title",
        ]);
        if (name) return name;
        return JSON.stringify(item);
      }
      return String(item);
    })
    .map((item) => sanitizeText(item))
    .filter((item) => item.length > 0);

  return uniqueSorted(parsed);
}

function inferOutcomeNode(nodes: string[], nodeDisplay: Map<string, string>): string {
  for (const node of nodes) {
    const normalizedNode = normalizeToken(node);
    const normalizedDisplay = normalizeToken(nodeDisplay.get(node) ?? "");
    if (
      OUTCOME_PRIORITY_TOKENS.some(
        (token) => normalizedNode.includes(token) || normalizedDisplay.includes(token)
      )
    ) {
      return node;
    }
  }
  return nodes[nodes.length - 1] || "Outcome";
}

function buildDegreeMaps(nodes: string[], edges: CanonicalEdge[]): {
  inDegree: Map<string, number>;
  outDegree: Map<string, number>;
} {
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();

  for (const node of nodes) {
    inDegree.set(node, 0);
    outDegree.set(node, 0);
  }

  for (const edge of edges) {
    outDegree.set(edge.from, (outDegree.get(edge.from) ?? 0) + 1);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  return { inDegree, outDegree };
}

function parseModel(version: SCMModelVersion | null | undefined): ParsedModel {
  const nodeSet = new Set<string>();
  const nodeDisplay = new Map<string, string>();
  const nodeHasRichDisplay = new Map<string, boolean>();
  const aliasToCanonical = new Map<string, string>();

  const rawNodes = version?.dagJson?.nodes ?? [];
  for (const rawNode of rawNodes) {
    const descriptor = parseNodeDescriptor(rawNode as Record<string, unknown> | string);
    if (!descriptor) continue;

    ensureNodeEntry(
      nodeSet,
      nodeDisplay,
      nodeHasRichDisplay,
      descriptor.key,
      descriptor.hasRichDisplay,
      descriptor.displayName
    );
    registerAlias(aliasToCanonical, descriptor.key, descriptor.key);
    for (const alias of descriptor.aliases) {
      registerAlias(aliasToCanonical, alias, descriptor.key);
    }
  }

  const rawEdges = parseRawEdges(version);
  const edgeDedup = new Map<string, CanonicalEdge>();
  for (const edge of rawEdges) {
    const from = resolveNodeKey(edge.from, aliasToCanonical);
    const to = resolveNodeKey(edge.to, aliasToCanonical);
    if (!from || !to) continue;

    ensureNodeEntry(nodeSet, nodeDisplay, nodeHasRichDisplay, from, false);
    ensureNodeEntry(nodeSet, nodeDisplay, nodeHasRichDisplay, to, false);
    registerAlias(aliasToCanonical, from, from);
    registerAlias(aliasToCanonical, to, to);

    edgeDedup.set(edgeKey({ from, to }), { from, to });
  }
  const edges = Array.from(edgeDedup.values()).sort((a, b) => edgeKey(a).localeCompare(edgeKey(b)));

  const assumptions = parseAssumptions(version);
  const confounders = uniqueSorted(
    parseConfounders(version).map((raw) => {
      const canonical = resolveNodeKey(raw, aliasToCanonical);
      ensureNodeEntry(nodeSet, nodeDisplay, nodeHasRichDisplay, canonical, false);
      registerAlias(aliasToCanonical, raw, canonical);
      return canonical;
    })
  );

  const nodes = Array.from(nodeSet).sort((a, b) => a.localeCompare(b));
  const outcome = inferOutcomeNode(nodes, nodeDisplay);
  if (nodes.length > 0) {
    ensureNodeEntry(nodeSet, nodeDisplay, nodeHasRichDisplay, outcome, false);
  }

  const stableNodes = Array.from(nodeSet).sort((a, b) => a.localeCompare(b));
  const { inDegree, outDegree } = buildDegreeMaps(stableNodes, edges);

  return {
    nodes: stableNodes,
    edges,
    nodeDisplay,
    nodeHasRichDisplay,
    assumptions,
    confounders,
    outcome,
    inDegree,
    outDegree,
    edgeSet: new Set(edges.map((edge) => edgeKey(edge))),
  };
}

function canonicalFromEdit(edit: TeachBackEdit): string {
  switch (edit.type) {
    case "add_edge":
    case "remove_edge":
      return `${edit.from ?? "?"} -> ${edit.to ?? "?"}`;
    case "remove_variable":
      return `remove ${edit.variable ?? "variable"}`;
    case "challenge_assumption":
      return edit.assumption ?? "assumption challenge";
    default:
      return JSON.stringify(edit);
  }
}

function makePreset(
  mode: TeachBackMode,
  operation: StressTestOperation,
  index: number,
  label: string,
  description: string,
  edit: TeachBackEdit,
  metadata?: Partial<Pick<TeachBackPreset, "displayLabel" | "rationale" | "canonical" | "expectedEffect">>
): TeachBackPreset {
  return {
    id: `${mode}:${operation}:${index}`,
    mode,
    operation,
    label,
    displayLabel: metadata?.displayLabel ?? label,
    description,
    rationale: metadata?.rationale ?? description,
    canonical: metadata?.canonical ?? canonicalFromEdit(edit),
    expectedEffect: metadata?.expectedEffect ?? DEFAULT_EXPECTED_EFFECT[operation],
    edit,
  };
}

function dedupePresets(presets: TeachBackPreset[]): TeachBackPreset[] {
  const dedup = new Map<string, TeachBackPreset>();
  for (const preset of presets) {
    const key = JSON.stringify(preset.edit);
    if (!dedup.has(key)) dedup.set(key, preset);
  }
  return Array.from(dedup.values()).map((preset, index) => ({
    ...preset,
    id: `${preset.mode}:${preset.operation}:${index}`,
  }));
}

function isTreatmentLike(node: string): boolean {
  const normalized = normalizeToken(node);
  return TREATMENT_TOKENS.some((token) => normalized.includes(token));
}

function displayNodeName(model: ParsedModel, node: string): string {
  return model.nodeDisplay.get(node) ?? humanizeNodeToken(node);
}

function assumptionPresets(mode: TeachBackMode, model: ParsedModel): TeachBackPreset[] {
  const fromAssumptions = model.assumptions.slice(0, 3).map((assumption, index) =>
    makePreset(
      mode,
      "challenge_assumption",
      index,
      `Stress: ${assumption}`,
      "Challenge this assumption to test fragility under altered epistemic constraints.",
      { type: "challenge_assumption", assumption }
    )
  );

  const confTemplates = model.confounders.slice(0, 3).flatMap((confounder, idx) => [
    makePreset(
      mode,
      "challenge_assumption",
      100 + idx * 2,
      `${confounder} control is incomplete`,
      "Probe robustness when confounder control is weakened.",
      { type: "challenge_assumption", assumption: `${confounder} control is incomplete` }
    ),
    makePreset(
      mode,
      "challenge_assumption",
      101 + idx * 2,
      `Measurement error in ${confounder} is underestimated`,
      "Probe robustness under underestimated measurement error.",
      { type: "challenge_assumption", assumption: `Measurement error in ${confounder} is underestimated` }
    ),
  ]);

  const presets = dedupePresets([...fromAssumptions, ...confTemplates]);

  if (presets.length > 0) return presets;

  return FALLBACK_ASSUMPTIONS.map((assumption, index) =>
    makePreset(
      mode,
      "challenge_assumption",
      index,
      assumption,
      "Global fallback assumption stress preset.",
      { type: "challenge_assumption", assumption }
    )
  );
}

function classifyAddEdgeCandidate(
  candidate: { from: string; to: string },
  model: ParsedModel
): AddEdgeRationaleCategory {
  if (candidate.to === model.outcome && model.confounders.includes(candidate.from)) {
    return "confounder_to_outcome";
  }
  if (candidate.to === model.outcome && isTreatmentLike(candidate.from)) {
    return "treatment_to_outcome";
  }
  if (candidate.to === model.outcome && (model.outDegree.get(candidate.from) ?? 0) > 0) {
    return "high_outdegree_to_outcome";
  }
  return "structural_gap";
}

function buildAddEdgeDisplayLabel(model: ParsedModel, from: string, to: string): string {
  const hasRichFrom = model.nodeHasRichDisplay.get(from) ?? false;
  const hasRichTo = model.nodeHasRichDisplay.get(to) ?? false;

  if (!hasRichFrom && !hasRichTo) {
    return `Variable ${from} may influence ${to}`;
  }

  return `${displayNodeName(model, from)} may influence ${displayNodeName(model, to)}`;
}

function addEdgePresets(mode: TeachBackMode, model: ParsedModel): TeachBackPreset[] {
  if (model.nodes.length < 2) return [];

  const candidates: Array<{ from: string; to: string; score: number }> = [];
  for (const from of model.nodes) {
    for (const to of model.nodes) {
      if (from === to) continue;
      if (model.edgeSet.has(edgeKey({ from, to }))) continue;

      let score = 0;
      if (to === model.outcome) score += 50;
      if (model.confounders.includes(from)) score += 30;
      if (isTreatmentLike(from)) score += 20;
      score += Math.min(10, model.outDegree.get(from) ?? 0);

      candidates.push({ from, to, score });
    }
  }

  const sorted = candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const left = `${a.from}=>${a.to}`;
    const right = `${b.from}=>${b.to}`;
    return left.localeCompare(right);
  });

  const top = sorted.slice(0, 8);
  if (top.length > 0) {
    return top.map((candidate, index) => {
      const category = classifyAddEdgeCandidate(candidate, model);
      const rationale = ADD_EDGE_RATIONALE_TEXT[category];
      const canonical = `${candidate.from} -> ${candidate.to}`;
      return makePreset(
        mode,
        "add_edge",
        index,
        canonical,
        "Inject a plausible causal edge and inspect downstream structural effects.",
        { type: "add_edge", from: candidate.from, to: candidate.to },
        {
          displayLabel: buildAddEdgeDisplayLabel(model, candidate.from, candidate.to),
          rationale: rationale.rationale,
          canonical,
          expectedEffect: rationale.expectedEffect,
        }
      );
    });
  }

  const fallbackPair = model.nodes.length >= 2 ? { from: model.nodes[0], to: model.nodes[1] } : null;
  if (!fallbackPair || fallbackPair.from === fallbackPair.to) return [];

  const canonical = `${fallbackPair.from} -> ${fallbackPair.to}`;
  return [
    makePreset(
      mode,
      "add_edge",
      0,
      canonical,
      "Fallback add-edge preset generated from available nodes.",
      { type: "add_edge", from: fallbackPair.from, to: fallbackPair.to },
      {
        displayLabel: buildAddEdgeDisplayLabel(model, fallbackPair.from, fallbackPair.to),
        rationale: ADD_EDGE_RATIONALE_TEXT.structural_gap.rationale,
        canonical,
        expectedEffect: ADD_EDGE_RATIONALE_TEXT.structural_gap.expectedEffect,
      }
    ),
  ];
}

function removeEdgePresets(mode: TeachBackMode, model: ParsedModel): TeachBackPreset[] {
  if (model.edges.length === 0) return [];

  const sorted = [...model.edges].sort((a, b) => {
    const aOutcome = a.to === model.outcome ? 1 : 0;
    const bOutcome = b.to === model.outcome ? 1 : 0;
    if (aOutcome !== bOutcome) return bOutcome - aOutcome;

    const aConf = model.confounders.includes(a.from) ? 1 : 0;
    const bConf = model.confounders.includes(b.from) ? 1 : 0;
    if (aConf !== bConf) return bConf - aConf;

    return edgeKey(a).localeCompare(edgeKey(b));
  });

  return sorted.slice(0, 8).map((edge, index) =>
    makePreset(
      mode,
      "remove_edge",
      index,
      `${edge.from} -> ${edge.to}`,
      "Remove an existing edge to test whether key pathways collapse.",
      { type: "remove_edge", from: edge.from, to: edge.to }
    )
  );
}

function removeVariablePresets(mode: TeachBackMode, model: ParsedModel): TeachBackPreset[] {
  if (model.nodes.length === 0) return [];

  const mediatorNodes = model.nodes.filter((node) => {
    if (model.confounders.includes(node)) return false;
    if (node === model.outcome) return false;
    return (model.inDegree.get(node) ?? 0) > 0 && (model.outDegree.get(node) ?? 0) > 0;
  });

  const others = model.nodes.filter(
    (node) => !model.confounders.includes(node) && !mediatorNodes.includes(node)
  );

  const ordered = [...model.confounders, ...mediatorNodes, ...others];

  return uniqueSorted(ordered)
    .slice(0, 8)
    .map((node, index) =>
      makePreset(
        mode,
        "remove_variable",
        index,
        node,
        "Remove a variable and its incident links to stress structural dependence.",
        { type: "remove_variable", variable: node }
      )
    );
}

export function getOperationsForMode(mode: TeachBackMode): StressTestOperation[] {
  return [...MODE_OPERATION_MATRIX[mode]];
}

export function getAvailableOperations(
  catalog: TeachBackPresetCatalog,
  mode: TeachBackMode
): StressTestOperation[] {
  const operations = getOperationsForMode(mode);
  return operations.filter((operation) => (catalog[mode][operation] ?? []).length > 0);
}

export function buildTeachBackPresetCatalog(
  version: SCMModelVersion | null | undefined
): TeachBackPresetCatalog {
  const model = parseModel(version);

  const quickAssumption = assumptionPresets("quick_estimate", model);
  const quickAddEdge = addEdgePresets("quick_estimate", model);

  const fullAssumption = assumptionPresets("full_recompute", model);
  const fullAddEdge = addEdgePresets("full_recompute", model);
  const fullRemoveEdge = removeEdgePresets("full_recompute", model);
  const fullRemoveVariable = removeVariablePresets("full_recompute", model);

  return {
    quick_estimate: {
      challenge_assumption: quickAssumption,
      add_edge: quickAddEdge,
    },
    full_recompute: {
      challenge_assumption: fullAssumption,
      add_edge: fullAddEdge,
      remove_edge: fullRemoveEdge,
      remove_variable: fullRemoveVariable,
    },
  };
}
