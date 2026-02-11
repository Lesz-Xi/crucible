import type { CausalEdge, CausalNode } from "@/lib/ai/causal-blueprint";
import type {
  AlignmentEdge,
  AlignmentNode,
  AlignmentScmSpec,
  AlignmentValidationMetadata,
} from "@/types/alignment";

const DEFAULT_DOMAIN: CausalNode["domain"] = "abstract";

export function isAlignmentScmSpec(value: unknown): value is AlignmentScmSpec {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AlignmentScmSpec>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.version === "string" &&
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.edges)
  );
}

function toNodeType(kind: string): CausalNode["type"] {
  const normalized = kind.toLowerCase();
  if (normalized === "latent") return "latent";
  if (normalized === "exogenous") return "exogenous";
  if (normalized === "intervention") return "intervention";
  return "observable";
}

function toConstraint(): CausalEdge["constraint"] {
  return "causality";
}

function normalizeNode(node: AlignmentNode): CausalNode {
  return {
    name: node.id,
    type: toNodeType(node.kind),
    domain: DEFAULT_DOMAIN,
    description: node.description || node.label,
  };
}

function normalizeEdge(edge: AlignmentEdge): CausalEdge {
  return {
    from: edge.source,
    to: edge.target,
    constraint: toConstraint(),
    reversible: false,
    sign: "unknown",
    mechanism_description: edge.channel,
    evidence_type: edge.type,
  };
}

export function normalizeAlignmentScmToMasa(
  spec: AlignmentScmSpec
): { nodes: CausalNode[]; edges: CausalEdge[] } {
  return {
    nodes: spec.nodes.map(normalizeNode),
    edges: spec.edges.map(normalizeEdge),
  };
}

export function extractAlignmentValidation(
  spec: AlignmentScmSpec
): AlignmentValidationMetadata {
  return {
    alignment_formula: spec.alignment_formula,
    bias_sensitive_paths: spec.bias_sensitive_paths || [],
    do_interventions: spec.do_interventions || [],
  };
}
