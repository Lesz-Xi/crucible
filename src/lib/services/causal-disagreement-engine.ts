import { SCMRegistryService } from "@/lib/services/scm-registry";
import {
  DisagreementAtom,
  DisagreementReport,
  EpistemicWeightBreakdown,
  SCMModel,
  SCMModelVersion,
} from "@/types/scm";

type EdgeShape = { from: string; to: string; sign?: "positive" | "negative" };

export interface SCMModelRef {
  modelKey: string;
  version?: string;
}

export interface InlineSCMSpec {
  modelKey?: string;
  version?: string;
  dagJson: { nodes: Array<{ name?: string; id?: string } | string>; edges: Array<Record<string, unknown>> };
  assumptionsJson?: Array<Record<string, unknown> | string>;
  confoundersJson?: Array<Record<string, unknown> | string>;
  validationJson?: Record<string, unknown>;
}

export interface CompareDisagreementInput {
  leftModelRef?: SCMModelRef;
  rightModelRef?: SCMModelRef;
  leftSpec?: InlineSCMSpec;
  rightSpec?: InlineSCMSpec;
  outcomeVar: string;
  interventions?: string[];
}

interface ResolvedModel {
  model: SCMModel;
  version: SCMModelVersion;
  nodes: string[];
  edges: EdgeShape[];
  assumptions: string[];
  confounders: string[];
}

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toStringList(payload: Array<Record<string, unknown> | string> | undefined): string[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        if (typeof item.name === "string") return item.name;
        if (typeof item.description === "string") return item.description;
        return JSON.stringify(item);
      }
      return "";
    })
    .filter((entry) => entry.trim().length > 0);
}

function toNodes(version: SCMModelVersion): string[] {
  const dagNodes = Array.isArray(version.dagJson?.nodes) ? version.dagJson.nodes : [];
  return dagNodes
    .map((node: any) => node?.name ?? node?.id)
    .filter((node: unknown): node is string => typeof node === "string" && node.trim().length > 0);
}

function toEdges(version: SCMModelVersion): EdgeShape[] {
  const dagEdges = Array.isArray(version.dagJson?.edges) ? version.dagJson.edges : [];
  const edges: EdgeShape[] = [];

  for (const rawEdge of dagEdges as any[]) {
    const from = rawEdge?.from ?? rawEdge?.source;
    const to = rawEdge?.to ?? rawEdge?.target;
    if (typeof from !== "string" || typeof to !== "string") continue;

    const sign = (rawEdge?.sign === "negative" ? "negative" : "positive") as "positive" | "negative";
    edges.push({ from, to, sign });
  }

  return edges;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function severityWeight(severity: DisagreementAtom["severity"]): number {
  if (severity === "high") return 1;
  if (severity === "medium") return 0.6;
  return 0.3;
}

function parseEvidenceWeight(validationJson: Record<string, unknown>): number {
  const candidates = [
    validationJson.evidenceScore,
    validationJson.dataQuality,
    validationJson.identifiability,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number") {
      if (candidate > 1) return clamp(candidate / 100);
      return clamp(candidate);
    }
  }

  return 0.55;
}

function edgeKey(edge: EdgeShape, canonicalMap: Map<string, string>): string {
  const from = canonicalMap.get(normalize(edge.from)) ?? edge.from;
  const to = canonicalMap.get(normalize(edge.to)) ?? edge.to;
  return `${normalize(from)}->${normalize(to)}`;
}

function pairKey(a: string, b: string): string {
  const first = normalize(a);
  const second = normalize(b);
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

function interventionEffect(edges: EdgeShape[], intervention: string, outcome: string): number {
  const adjacency = new Map<string, Array<{ to: string; sign: number }>>();

  for (const edge of edges) {
    const bucket = adjacency.get(edge.from) ?? [];
    bucket.push({ to: edge.to, sign: edge.sign === "negative" ? -1 : 1 });
    adjacency.set(edge.from, bucket);
  }

  const queue: Array<{ node: string; sign: number; depth: number }> = [{ node: intervention, sign: 1, depth: 0 }];
  const visited = new Set<string>();
  let total = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.depth > 4) continue;

    if (current.node === outcome && current.depth > 0) {
      total += current.sign / current.depth;
      continue;
    }

    const visitKey = `${normalize(current.node)}:${current.depth}`;
    if (visited.has(visitKey)) continue;
    visited.add(visitKey);

    for (const child of adjacency.get(current.node) ?? []) {
      queue.push({
        node: child.to,
        sign: current.sign * child.sign,
        depth: current.depth + 1,
      });
    }
  }

  return total;
}

function buildEpistemic(
  type: DisagreementAtom["type"],
  leftEvidence: number,
  rightEvidence: number
): EpistemicWeightBreakdown {
  const avgEvidence = average([leftEvidence, rightEvidence]);

  if (type === "assumption") {
    return {
      dataGrounded: clamp(avgEvidence * 0.35),
      mechanismGrounded: 0.45,
      assumptionGrounded: 0.9,
    };
  }

  if (type === "confounder") {
    return {
      dataGrounded: clamp(avgEvidence * 0.5),
      mechanismGrounded: 0.55,
      assumptionGrounded: 0.8,
    };
  }

  return {
    dataGrounded: clamp(avgEvidence),
    mechanismGrounded: 0.82,
    assumptionGrounded: 0.4,
  };
}

export class CausalDisagreementEngine {
  constructor(private readonly registry: SCMRegistryService) {}

  private async resolveModel(ref?: SCMModelRef, inline?: InlineSCMSpec): Promise<ResolvedModel> {
    if (inline) {
      const version: SCMModelVersion = {
        id: "inline-version",
        modelId: "inline-model",
        version: inline.version ?? "inline",
        isCurrent: true,
        dagJson: {
          nodes: Array.isArray(inline.dagJson?.nodes)
            ? inline.dagJson.nodes.map((node: any) => (typeof node === "string" ? { name: node } : node))
            : [],
          edges: Array.isArray(inline.dagJson?.edges) ? (inline.dagJson.edges as any[]) : [],
        },
        structuralEquationsJson: [],
        assumptionsJson: inline.assumptionsJson ?? [],
        confoundersJson: inline.confoundersJson ?? [],
        constraintsJson: [],
        provenanceJson: {},
        validationJson: inline.validationJson ?? {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const model: SCMModel = {
        id: "inline-model",
        modelKey: inline.modelKey ?? "inline",
        domain: "inline",
        name: inline.modelKey ?? "Inline Model",
        description: "Inline SCM specification",
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        model,
        version,
        nodes: toNodes(version),
        edges: toEdges(version),
        assumptions: toStringList(version.assumptionsJson),
        confounders: toStringList(version.confoundersJson),
      };
    }

    if (!ref?.modelKey) {
      throw new Error("Missing model reference");
    }

    const resolved = await this.registry.getModelVersion(ref.modelKey, ref.version);
    if (!resolved) {
      throw new Error(`SCM model not found: ${ref.modelKey}${ref.version ? `@${ref.version}` : ""}`);
    }

    return {
      model: resolved.model,
      version: resolved.version,
      nodes: toNodes(resolved.version),
      edges: toEdges(resolved.version),
      assumptions: toStringList(resolved.version.assumptionsJson),
      confounders: toStringList(resolved.version.confoundersJson),
    };
  }

  async compare(input: CompareDisagreementInput): Promise<DisagreementReport> {
    const left = await this.resolveModel(input.leftModelRef, input.leftSpec);
    const right = await this.resolveModel(input.rightModelRef, input.rightSpec);

    const ontology = await this.registry.getVariableOntology();
    const inputVars = [...left.nodes, ...right.nodes];
    const alignment = this.registry.alignVariables(inputVars, ontology);
    const canonicalMap = new Map<string, string>();
    for (const item of alignment.aligned) {
      if (item.canonical) {
        canonicalMap.set(normalize(item.input), item.canonical);
      }
    }

    const totalInputs = alignment.aligned.length || inputVars.length || 1;
    const matchedCount = alignment.aligned.filter((item) => item.matchedBy !== "none").length;
    const crossDomain = normalize(left.model.domain) !== normalize(right.model.domain);
    const alignmentThreshold = crossDomain ? 0.95 : 0.9;
    const alignmentCoverage = clamp(matchedCount / totalInputs);

    const leftEvidence = parseEvidenceWeight(left.version.validationJson);
    const rightEvidence = parseEvidenceWeight(right.version.validationJson);

    const atoms: DisagreementAtom[] = [];

    if (alignmentCoverage < alignmentThreshold) {
      atoms.push({
        type: "assumption",
        severity: "high",
        leftModelValue: `${Math.round(alignmentCoverage * 100)}%`,
        rightModelValue: `>=${Math.round(alignmentThreshold * 100)}%`,
        reason: "Ontology alignment coverage is below required threshold for cross-model comparison.",
        epistemicWeight: buildEpistemic("assumption", leftEvidence, rightEvidence),
      });
    }

    const leftEdgeMap = new Map<string, EdgeShape>();
    const rightEdgeMap = new Map<string, EdgeShape>();
    for (const edge of left.edges) leftEdgeMap.set(edgeKey(edge, canonicalMap), edge);
    for (const edge of right.edges) rightEdgeMap.set(edgeKey(edge, canonicalMap), edge);

    const allEdgeKeys = new Set([...leftEdgeMap.keys(), ...rightEdgeMap.keys()]);
    for (const key of allEdgeKeys) {
      const leftEdge = leftEdgeMap.get(key);
      const rightEdge = rightEdgeMap.get(key);

      if (!!leftEdge !== !!rightEdge) {
        const edge = leftEdge || rightEdge;
        atoms.push({
          type: "edge_presence",
          severity: "high",
          leftModelValue: leftEdge ? "present" : "absent",
          rightModelValue: rightEdge ? "present" : "absent",
          edge: edge ? { from: edge.from, to: edge.to } : undefined,
          reason: "One model includes a causal edge the other omits.",
          epistemicWeight: buildEpistemic("edge_presence", leftEvidence, rightEvidence),
        });
        continue;
      }

      if (!leftEdge || !rightEdge) continue;

      if ((leftEdge.sign ?? "positive") !== (rightEdge.sign ?? "positive")) {
        atoms.push({
          type: "edge_sign",
          severity: "medium",
          leftModelValue: leftEdge.sign ?? "positive",
          rightModelValue: rightEdge.sign ?? "positive",
          edge: { from: leftEdge.from, to: leftEdge.to },
          reason: "Both models agree on structure but disagree on effect sign.",
          epistemicWeight: buildEpistemic("edge_sign", leftEvidence, rightEvidence),
        });
      }
    }

    const leftPairs = new Map<string, EdgeShape>();
    const rightPairs = new Map<string, EdgeShape>();
    left.edges.forEach((edge) => leftPairs.set(pairKey(edge.from, edge.to), edge));
    right.edges.forEach((edge) => rightPairs.set(pairKey(edge.from, edge.to), edge));

    for (const key of new Set([...leftPairs.keys(), ...rightPairs.keys()])) {
      const leftEdge = leftPairs.get(key);
      const rightEdge = rightPairs.get(key);
      if (!leftEdge || !rightEdge) continue;

      if (normalize(leftEdge.from) === normalize(rightEdge.to) && normalize(leftEdge.to) === normalize(rightEdge.from)) {
        atoms.push({
          type: "edge_direction",
          severity: "high",
          leftModelValue: `${leftEdge.from} -> ${leftEdge.to}`,
          rightModelValue: `${rightEdge.from} -> ${rightEdge.to}`,
          edge: { from: leftEdge.from, to: leftEdge.to },
          reason: "Models reverse the direction of causality for the same variable pair.",
          epistemicWeight: buildEpistemic("edge_direction", leftEvidence, rightEvidence),
        });
      }
    }

    const leftAssumptions = new Set(left.assumptions.map(normalize));
    const rightAssumptions = new Set(right.assumptions.map(normalize));

    for (const assumption of left.assumptions) {
      if (!rightAssumptions.has(normalize(assumption))) {
        atoms.push({
          type: "assumption",
          severity: "medium",
          leftModelValue: assumption,
          rightModelValue: "missing",
          reason: "Assumption is explicit in left model but absent in right model.",
          epistemicWeight: buildEpistemic("assumption", leftEvidence, rightEvidence),
        });
      }
    }

    for (const assumption of right.assumptions) {
      if (!leftAssumptions.has(normalize(assumption))) {
        atoms.push({
          type: "assumption",
          severity: "medium",
          leftModelValue: "missing",
          rightModelValue: assumption,
          reason: "Assumption is explicit in right model but absent in left model.",
          epistemicWeight: buildEpistemic("assumption", leftEvidence, rightEvidence),
        });
      }
    }

    const leftConfounders = new Set(left.confounders.map(normalize));
    const rightConfounders = new Set(right.confounders.map(normalize));

    for (const confounder of left.confounders) {
      if (!rightConfounders.has(normalize(confounder))) {
        atoms.push({
          type: "confounder",
          severity: "high",
          variable: confounder,
          leftModelValue: "tracked",
          rightModelValue: "not tracked",
          reason: "Confounder adjustment set diverges.",
          epistemicWeight: buildEpistemic("confounder", leftEvidence, rightEvidence),
        });
      }
    }

    for (const confounder of right.confounders) {
      if (!leftConfounders.has(normalize(confounder))) {
        atoms.push({
          type: "confounder",
          severity: "high",
          variable: confounder,
          leftModelValue: "not tracked",
          rightModelValue: "tracked",
          reason: "Confounder adjustment set diverges.",
          epistemicWeight: buildEpistemic("confounder", leftEvidence, rightEvidence),
        });
      }
    }

    for (const intervention of input.interventions ?? []) {
      const leftEffect = interventionEffect(left.edges, intervention, input.outcomeVar);
      const rightEffect = interventionEffect(right.edges, intervention, input.outcomeVar);
      const delta = Math.abs(leftEffect - rightEffect);

      if (delta > 0.2) {
        const severity: DisagreementAtom["severity"] = delta > 0.75 ? "high" : "medium";
        atoms.push({
          type: "intervention",
          severity,
          variable: intervention,
          leftModelValue: leftEffect.toFixed(3),
          rightModelValue: rightEffect.toFixed(3),
          reason: `Predicted do(${intervention}) response differs for outcome ${input.outcomeVar}.`,
          epistemicWeight: buildEpistemic("intervention", leftEvidence, rightEvidence),
        });

        if (delta > 0.5) {
          atoms.push({
            type: "counterfactual",
            severity,
            variable: intervention,
            leftModelValue: `Without ${intervention}, effect≈${(-leftEffect).toFixed(3)}`,
            rightModelValue: `Without ${intervention}, effect≈${(-rightEffect).toFixed(3)}`,
            reason: "Counterfactual necessity judgments diverge between models.",
            epistemicWeight: buildEpistemic("counterfactual", leftEvidence, rightEvidence),
          });
        }
      }
  }

    const score = clamp(
      atoms.length === 0
        ? 0
        :
            atoms.reduce((sum, atom) => {
              const epistemic = average([
                atom.epistemicWeight.dataGrounded,
                atom.epistemicWeight.mechanismGrounded,
                atom.epistemicWeight.assumptionGrounded,
              ]);
              return sum + severityWeight(atom.severity) * epistemic;
            }, 0) /
            atoms.length
    );

    const summary =
      atoms.length === 0
        ? "No material causal disagreement detected between the compared models."
        : `Detected ${atoms.length} disagreement atom(s) across structure, assumptions, and intervention predictions.`;

    return {
      success: true,
      score: Number(score.toFixed(4)),
      summary,
      atoms,
      alignedVariables: alignment.aligned,
      alignmentQuality: {
        coverage: Number(alignmentCoverage.toFixed(4)),
        threshold: alignmentThreshold,
        unknownVariables: alignment.unknown,
        crossDomain,
      },
    };
  }
}
