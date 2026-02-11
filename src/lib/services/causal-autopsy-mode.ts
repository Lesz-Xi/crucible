import { PersistenceService } from "@/lib/db/persistence-service";
import { CounterfactualGenerator } from "@/lib/services/counterfactual-generator";
import { SCMRegistryService } from "@/lib/services/scm-registry";
import { CausalAutopsyRequest, CausalAutopsyResponse } from "@/types/scm";

interface CausalAutopsyDeps {
  registry: SCMRegistryService;
  persistence: PersistenceService;
}

type GraphEdge = { from: string; to: string };

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractNodes(version: any): string[] {
  return (version?.dagJson?.nodes ?? [])
    .map((node: any) => node?.name ?? node?.id)
    .filter((node: unknown): node is string => typeof node === "string" && node.trim().length > 0);
}

function extractEdges(version: any): GraphEdge[] {
  return (version?.dagJson?.edges ?? [])
    .map((edge: any) => ({ from: edge?.from ?? edge?.source, to: edge?.to ?? edge?.target }))
    .filter(
      (edge: GraphEdge) => typeof edge.from === "string" && edge.from.length > 0 && typeof edge.to === "string" && edge.to.length > 0
    );
}

function inferOutcomeVariable(nodes: string[]): string {
  const priorities = ["performance", "outcome", "failure", "risk", "harm"];
  for (const node of nodes) {
    const normalizedNode = normalize(node);
    if (priorities.some((token) => normalizedNode.includes(token))) {
      return node;
    }
  }
  return nodes[nodes.length - 1] || "Outcome";
}

function shortestPathLength(edges: GraphEdge[], from: string, to: string): number | null {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const next = adjacency.get(edge.from) ?? [];
    next.push(edge.to);
    adjacency.set(edge.from, next);
  }

  const queue: Array<{ node: string; depth: number }> = [{ node: from, depth: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (normalize(current.node) === normalize(to)) return current.depth;
    if (visited.has(normalize(current.node))) continue;
    visited.add(normalize(current.node));

    for (const child of adjacency.get(current.node) ?? []) {
      if (!visited.has(normalize(child))) {
        queue.push({ node: child, depth: current.depth + 1 });
      }
    }
  }

  return null;
}

function stringifyAssumption(item: unknown): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const maybeDescription = (item as any).description;
    if (typeof maybeDescription === "string") return maybeDescription;
    return JSON.stringify(item);
  }
  return String(item);
}

export class CausalAutopsyMode {
  constructor(private readonly deps: CausalAutopsyDeps) {}

  async run(request: CausalAutopsyRequest): Promise<CausalAutopsyResponse> {
    const runDetails = request.runId ? await this.deps.persistence.getRunDetails(request.runId) : null;

    const lookupKey = request.modelKey ?? request.domain;
    if (!lookupKey) {
      throw new Error("Autopsy requires a canonical model key or domain.");
    }

    let modelRecord = request.modelKey
      ? await this.deps.registry.getModelVersion(request.modelKey, request.version)
      : null;

    if (!modelRecord && request.domain) {
      modelRecord = await this.deps.registry.getCurrentModelByDomain(request.domain);
    }

    if (!modelRecord && request.modelKey) {
      // Treat modelKey as a domain for canonical lookup (legacy callers)
      modelRecord = await this.deps.registry.getCurrentModelByDomain(request.modelKey);
    }

    if (!modelRecord) {
      throw new Error(
        `No canonical SCM model for domain ${lookupKey}. Autopsy requires a registry model.`
      );
    }

    const modelNodes = extractNodes(modelRecord.version);
    const modelEdges = extractEdges(modelRecord.version);
    const outcomeVar = request.failureEvent?.observedOutcome || inferOutcomeVariable(modelNodes);

    const observedActions = [
      ...(request.failureEvent?.observedActions ?? []),
      ...((runDetails?.novelIdeas ?? [])
        .flatMap((idea: any) => [idea?.thesis, idea?.doPlan, ...(idea?.bridgedConcepts ?? [])])
        .filter((item: unknown): item is string => typeof item === "string" && item.length > 0)),
    ];

    const observedTokens = new Set(observedActions.map((entry) => normalize(entry)));
    const matchedNodes = modelNodes.filter((node) => {
      const token = normalize(node);
      return [...observedTokens].some((entry) => entry.includes(token) || token.includes(entry));
    });

    const failedAssumptions = [
      ...(modelRecord.version.assumptionsJson ?? []).map(stringifyAssumption),
      ...((runDetails?.contradictions ?? [])
        .map((item: any) => item?.concept)
        .filter((item: unknown): item is string => typeof item === "string" && item.length > 0)
        .slice(0, 2)),
    ].filter((value, index, array) => value && array.indexOf(value) === index);

    const counterfactual = new CounterfactualGenerator();
    let counterfactualCritique: string | null = null;
    try {
      const mechanism =
        request.failureEvent?.timeline?.join(" ") ||
        runDetails?.novelIdeas?.[0]?.mechanism ||
        "No mechanism provided";

      await counterfactual.initialize();
      const scenarios = await counterfactual.generateScenarios(mechanism);
      const evaluation = await counterfactual.evaluateMechanism(mechanism, scenarios);
      counterfactualCritique = evaluation.critique;
    } catch {
      counterfactualCritique = null;
    }

    if (counterfactualCritique) {
      failedAssumptions.push(`Counterfactual critique: ${counterfactualCritique}`);
    }

    const candidateFactors = Array.from(new Set([...matchedNodes, ...modelNodes.slice(0, 6)]))
      .filter((node) => normalize(node) !== normalize(outcomeVar));

    const necessityScores: Array<{ factor: string; score: number }> = [];

    for (const factor of candidateFactors) {
      const pathLength = shortestPathLength(modelEdges, factor, outcomeVar);
      const pathScore = pathLength === null ? 0.15 : clamp(1 - pathLength * 0.18, 0.25, 0.95);
      const assumptionBoost = failedAssumptions.some((assumption) => normalize(assumption).includes(normalize(factor)))
        ? 0.15
        : 0;

      const recurrenceDetected = runDetails?.novelIdeas?.[0]?.mechanism
        ? await this.deps.persistence.checkRejection(factor, runDetails.novelIdeas[0].mechanism)
        : false;
      const recurrenceBoost = recurrenceDetected ? 0.15 : 0;

      const score = clamp(pathScore + assumptionBoost + recurrenceBoost);
      necessityScores.push({ factor, score: Number(score.toFixed(3)) });
    }

    necessityScores.sort((a, b) => b.score - a.score);

    const rootCauses = necessityScores.filter((item) => item.score >= 0.58).slice(0, 3).map((item) => item.factor);
    const symptoms = necessityScores
      .filter((item) => item.score < 0.58)
      .slice(0, 4)
      .map((item) => item.factor);

    if (rootCauses.length === 0 && necessityScores.length > 0) {
      rootCauses.push(necessityScores[0].factor);
    }

    const preventionPlan = rootCauses.map(
      (cause, index) =>
        `${index + 1}. Intervene on ${cause} with explicit do(${cause}) trials and track downstream effect on ${outcomeVar}.`
    );

    if (rootCauses.length > 0) {
      preventionPlan.push(
        `Anchor monitoring on ${rootCauses[0]} -> ${outcomeVar} path and audit confounders weekly.`
      );
    }

    return {
      success: true,
      modelRef: {
        modelKey: modelRecord.model.modelKey,
        version: modelRecord.version.version,
        domain: modelRecord.model.domain,
        name: modelRecord.model.name,
        status: modelRecord.model.status,
        provenance: modelRecord.version.provenanceJson ?? {},
      },
      rootCauses,
      symptoms,
      failedAssumptions,
      necessityScores,
      preventionPlan,
    };
  }
}
