import { getClaudeModel } from "@/lib/ai/anthropic";
import { safeParseJson } from "@/lib/ai/ai-utils";
import { Contradiction, ExtractedConcepts, NovelIdea } from "@/types";
import { SCMModelVersion, SCMHypothesisSkeleton } from "@/types/scm";
import { GuardEvaluation, HypothesisGuard } from "@/lib/services/hypothesis-guard";
import { CausalOutputBuildContext, enrichIdeaWithCausalOutput } from "@/lib/services/causal-output-contract";

interface SourceWithConcepts {
  name: string;
  concepts: ExtractedConcepts;
}

type CanonicalEdge = {
  from: string;
  to: string;
  sign?: "positive" | "negative";
};

interface CanonicalModelView {
  modelKey: string;
  version: string;
  nodes: string[];
  edges: CanonicalEdge[];
  confounders: string[];
  assumptions: string[];
}

export interface SCMHypothesisCandidate extends SCMHypothesisSkeleton {
  interventionValueScore: number;
  mechanismDepth: number;
  noveltyScore: number;
}

export interface SCMHypothesisGeneratorInput {
  sources: SourceWithConcepts[];
  contradictions: Contradiction[];
  model?: {
    modelKey: string;
    version: string;
    modelVersion: SCMModelVersion;
  };
  researchFocus?: string;
  maxIdeas?: number;

  // Thermodynamic Basis Expansion parameters
  temperature?: number;
  seed?: number;
}

interface HypothesisDraft {
  candidate: SCMHypothesisCandidate;
  guard: GuardEvaluation;
}

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toCanonicalModelView(model?: SCMHypothesisGeneratorInput["model"]): CanonicalModelView {
  if (!model) {
    const nodes = ["Input", "Mechanism", "Outcome"];
    const edges: CanonicalEdge[] = [
      { from: "Input", to: "Mechanism", sign: "positive" },
      { from: "Mechanism", to: "Outcome", sign: "positive" },
    ];

    return {
      modelKey: "generic",
      version: "v1",
      nodes,
      edges,
      confounders: ["Context", "BaselineSkill"],
      assumptions: [],
    };
  }

  const dag = model.modelVersion.dagJson ?? { nodes: [], edges: [] };
  const nodes = (Array.isArray(dag.nodes) ? dag.nodes : [])
    .map((node: any) => node?.name ?? node?.id)
    .filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0);

  const edges = (Array.isArray(dag.edges) ? dag.edges : [])
    .map((edge: any) => ({
      from: edge?.from ?? edge?.source,
      to: edge?.to ?? edge?.target,
      sign: (edge?.sign === "negative" ? "negative" : "positive") as "positive" | "negative",
    }))
    .filter(
      (edge: any): edge is CanonicalEdge =>
        typeof edge?.from === "string" && typeof edge?.to === "string"
    );

  const confounders = (model.modelVersion.confoundersJson ?? [])
    .map((item: any) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && typeof item.name === "string") return item.name;
      return null;
    })
    .filter((item: string | null): item is string => !!item);

  const assumptions = (model.modelVersion.assumptionsJson ?? [])
    .map((item: any) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return item.description ?? JSON.stringify(item);
      return null;
    })
    .filter((item: string | null): item is string => !!item);

  return {
    modelKey: model.modelKey,
    version: model.version,
    nodes,
    edges,
    confounders,
    assumptions,
  };
}

function buildAdjacency(edges: CanonicalEdge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const edge of edges) {
    const children = map.get(edge.from) ?? [];
    children.push(edge.to);
    map.set(edge.from, children);
  }
  return map;
}

function pickOutcomeVariable(nodes: string[], edges: CanonicalEdge[], contradictions: Contradiction[]): string {
  const priorityWords = ["outcome", "performance", "success", "harm", "risk", "failure"];

  const byKeyword = nodes.find((node) => {
    const normalized = normalizeToken(node);
    return priorityWords.some((word) => normalized.includes(normalizeToken(word)));
  });
  if (byKeyword) return byKeyword;

  const indegree = new Map<string, number>();
  nodes.forEach((node) => indegree.set(node, 0));
  edges.forEach((edge) => indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1));

  let maxNode = nodes[0] ?? "Outcome";
  let maxDegree = -1;
  for (const [node, degree] of indegree.entries()) {
    if (degree > maxDegree) {
      maxNode = node;
      maxDegree = degree;
    }
  }

  if (maxNode) return maxNode;

  const contradictionOutcome = contradictions[0]?.concept?.split(/\s+/)?.slice(-1)[0];
  return contradictionOutcome || "Outcome";
}

function pathFromCauseToOutcome(cause: string, outcome: string, adjacency: Map<string, string[]>): string[] {
  if (cause === outcome) return [cause];

  const queue: Array<{ node: string; path: string[] }> = [{ node: cause, path: [cause] }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.node === outcome) return current.path;
    if (visited.has(current.node)) continue;
    visited.add(current.node);

    for (const child of adjacency.get(current.node) ?? []) {
      if (!visited.has(child)) {
        queue.push({ node: child, path: [...current.path, child] });
      }
    }
  }

  return [cause, outcome];
}

function candidateVariablesFromSources(sources: SourceWithConcepts[]): string[] {
  const variables = new Set<string>();

  for (const source of sources) {
    for (const entity of source.concepts.entities ?? []) {
      if (!entity?.name) continue;
      const trimmed = entity.name.trim();
      if (trimmed.length > 1 && trimmed.length < 64) {
        variables.add(trimmed.replace(/\s+/g, ""));
      }
    }

    const thesisTokens = (source.concepts.mainThesis ?? "")
      .split(/[^A-Za-z0-9]+/)
      .filter((token) => token.length > 3)
      .slice(0, 3);

    thesisTokens.forEach((token) => variables.add(token));
  }

  return Array.from(variables);
}

function contradictionNoveltyBoost(contradictions: Contradiction[], variable: string): number {
  if (contradictions.length === 0) return 0.45;
  const text = contradictions
    .map((item) => `${item.concept} ${item.claimA} ${item.claimB}`)
    .join(" ")
    .toLowerCase();

  const present = text.includes(variable.toLowerCase());
  return present ? 0.78 : 0.54;
}

async function elaborateWithLLM(payload: {
  skeleton: SCMHypothesisSkeleton;
  contradictions: Contradiction[];
  researchFocus?: string;
  temperature?: number;
  seed?: number;
}): Promise<{
  thesis: string;
  description: string;
  mechanism: string;
  noveltyAssessment: string;
  prediction: string;
  crucialExperiment: string;
  causalClaim?: string;
  unresolvedGaps?: string[];
  nextScientificAction?: string;
} | null> {
  const model = getClaudeModel();
  const contradictionText = payload.contradictions
    .slice(0, 3)
    .map((item) => `${item.concept}: ${item.claimA} vs ${item.claimB}`)
    .join("\n");

  const prompt = `Elaborate this SCM-constrained causal hypothesis into concise scientific prose.

Hypothesis skeleton:
${JSON.stringify(payload.skeleton, null, 2)}

Contradictions:
${contradictionText || "None"}

Research focus:
${payload.researchFocus || "None"}

Return JSON:
{
  "thesis": "single sentence",
  "description": "2-3 sentence plain language summary",
  "mechanism": "causal chain explanation",
  "noveltyAssessment": "why this intervention is high-value",
  "prediction": "falsifiable expected change",
  "crucialExperiment": "one disconfirming experiment",
  "causalClaim": "single sentence with explicit assumptions language",
  "unresolvedGaps": ["gap 1", "gap 2"],
  "nextScientificAction": "one concrete next action"
}`;

  try {
    const config: any = {};
    if (payload.temperature !== undefined) {
      config.temperature = payload.temperature;
    }
    // Claude might not use "seed" directly via google/genai SDK natively without specific handling or it might be passed as an extra parameter
    // Assuming standard system usage of a config object if supported

    // We pass the string prompt. In true implementation, you'd pass the GenerationConfig.
    // The google-gen-ai SDK accepts it as the second argument.
    const response = await model.generateContent({
      contents: prompt,
      generationConfig: config
    } as any); // Type cast due to varied SDK signatures, will adjust based on actual SDK

    const parsed = safeParseJson<any>(response.response.text(), {});
    if (!parsed?.thesis || !parsed?.description) {
      return null;
    }

    return {
      thesis: parsed.thesis,
      description: parsed.description,
      mechanism: parsed.mechanism || payload.skeleton.mechanismClaim,
      noveltyAssessment: parsed.noveltyAssessment || "SCM-first ranking based on intervention leverage.",
      prediction: parsed.prediction || payload.skeleton.doQuery,
      crucialExperiment: parsed.crucialExperiment || payload.skeleton.falsifier,
      causalClaim: parsed.causalClaim,
      unresolvedGaps: Array.isArray(parsed.unresolvedGaps)
        ? parsed.unresolvedGaps.filter((item: unknown): item is string => typeof item === "string")
        : undefined,
      nextScientificAction: typeof parsed.nextScientificAction === "string" ? parsed.nextScientificAction : undefined,
    };
  } catch (error) {
    console.warn("LLM Elaboration skipped or failed", error);
    return null;
  }
}

export class SCMHypothesisGenerator {
  private guard = new HypothesisGuard();

  async generate(input: SCMHypothesisGeneratorInput): Promise<NovelIdea[]> {
    const maxIdeas = Math.max(1, input.maxIdeas ?? 3);
    const canonical = toCanonicalModelView(input.model);

    const sourceVariables = candidateVariablesFromSources(input.sources);
    const nodePool = canonical.nodes.length > 0 ? canonical.nodes : sourceVariables;
    const edges = canonical.edges.length > 0
      ? canonical.edges
      : [
        { from: nodePool[0] || "Input", to: nodePool[1] || "Mechanism", sign: "positive" as const },
        { from: nodePool[1] || "Mechanism", to: nodePool[2] || "Outcome", sign: "positive" as const },
      ];

    const outcome = pickOutcomeVariable(nodePool, edges, input.contradictions);
    const adjacency = buildAdjacency(edges);

    const causes = nodePool
      .filter((node) => node !== outcome)
      .slice(0, Math.max(maxIdeas + 2, 4));

    const drafts: HypothesisDraft[] = [];
    for (const cause of causes) {
      const path = pathFromCauseToOutcome(cause, outcome, adjacency);
      const interventionValueScore = clamp(path.length <= 1 ? 0.35 : 0.45 + Math.min(path.length, 4) * 0.13);
      const noveltyScore = contradictionNoveltyBoost(input.contradictions, cause);
      const mechanismDepth = clamp(path.length / 5, 0.2, 1);

      const confounders = (canonical.confounders.length > 0
        ? canonical.confounders
        : nodePool.filter((node) => /support|baseline|context|time|resource/i.test(node)))
        .filter((candidate) => candidate !== cause && candidate !== outcome)
        .slice(0, 3);

      const skeleton: SCMHypothesisCandidate = {
        cause,
        effect: outcome,
        mechanismClaim: `${path.join(" -> ")} forms the dominant mechanism chain to ${outcome}.`,
        doQuery: `Estimate E[${outcome} | do(${cause}=+1σ)] while holding confounders fixed.`,
        falsifier: `If ${outcome} does not shift materially after repeated do(${cause}) interventions under matched confounders, reject this hypothesis.`,
        confounders,
        expectedSign: "positive",
        interventionValueScore,
        mechanismDepth,
        noveltyScore,
      };

      const guard = this.guard.evaluate(skeleton, {
        canonicalVariables: nodePool,
        requiredConfounders: canonical.confounders,
      });

      drafts.push({ candidate: skeleton, guard });
    }

    const rankedDrafts = drafts
      .filter((draft) => draft.guard.accepted)
      .sort((left, right) => {
        const leftScore =
          left.guard.interventionValueScore * 0.4 +
          left.guard.falsifiabilityScore * 0.25 +
          left.guard.identifiabilityScore * 0.2 +
          left.guard.mechanismDepth * 0.1 +
          left.guard.noveltyScore * 0.05;

        const rightScore =
          right.guard.interventionValueScore * 0.4 +
          right.guard.falsifiabilityScore * 0.25 +
          right.guard.identifiabilityScore * 0.2 +
          right.guard.mechanismDepth * 0.1 +
          right.guard.noveltyScore * 0.05;

        return rightScore - leftScore;
      })
      .slice(0, maxIdeas);

    const causalOutputContext: CausalOutputBuildContext = {
      modelRef: `${canonical.modelKey}@${canonical.version}`,
      variables: canonical.nodes,
      directedEdges: canonical.edges.map((edge) => ({ from: edge.from, to: edge.to })),
      assumptions: canonical.assumptions,
      contradictions: input.contradictions,
    };

    const ideas: NovelIdea[] = [];

    for (let index = 0; index < rankedDrafts.length; index += 1) {
      const draft = rankedDrafts[index];
      const llmElaboration = await elaborateWithLLM({
        skeleton: draft.candidate,
        contradictions: input.contradictions,
        researchFocus: input.researchFocus,
        temperature: input.temperature,
        seed: input.seed,
      });

      const confidence = Math.round(
        clamp(
          draft.guard.interventionValueScore * 0.4 +
          draft.guard.identifiabilityScore * 0.25 +
          draft.guard.falsifiabilityScore * 0.25 +
          draft.guard.noveltyScore * 0.1
        ) * 100
      );

      const baseIdea = {
        id: `scm-hyp-${Date.now()}-${index}`,
        thesis:
          llmElaboration?.thesis ||
          `Intervening on ${draft.candidate.cause} will causally shift ${draft.candidate.effect}.`,
        description:
          llmElaboration?.description ||
          `SCM-first hypothesis focused on ${draft.candidate.cause} as a leverage point for ${draft.candidate.effect}.`,
        bridgedConcepts: [draft.candidate.cause, draft.candidate.effect, ...draft.candidate.confounders.slice(0, 2)],
        confidence,
        noveltyAssessment:
          llmElaboration?.noveltyAssessment ||
          `Ranked by intervention value (${draft.guard.interventionValueScore.toFixed(2)}) before novelty.`,
        mechanism: llmElaboration?.mechanism || draft.candidate.mechanismClaim,
        prediction: llmElaboration?.prediction || draft.candidate.doQuery,
      } as NovelIdea;

      const enriched = enrichIdeaWithCausalOutput(baseIdea, causalOutputContext);

      ideas.push(enriched);
    }

    return ideas;
  }
}
