import { StructuralCausalModel } from "../ai/causal-blueprint";
import { BiologicalEcologyTemplate } from "../ai/biological-ecology-template";
import { SelfishGeneTemplate } from "../ai/selfish-gene-template";
import { CognitivePsychologyTemplate } from "../ai/cognitive-psychology-template";
import { ScalingLawsTemplate } from "../ai/scaling-laws-template";
import { EducationalSCM } from "../ai/educational-scm";
import { SCMRegistryService } from "./scm-registry";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { PhenomenalBridge, EpistemicQualia } from "./phenomenal-bridge";

import { SupabaseClient } from "@supabase/supabase-js";
import type { CausalEdge, CausalNode } from "../ai/causal-blueprint";

type DagNodeLike = Partial<CausalNode> & { id?: string; label?: string };
type DagEdgeLike = Partial<CausalEdge> & { source?: string; target?: string };
type DagJsonLike = { nodes?: unknown; edges?: unknown } | null | undefined;

/**
 * SCMContext: The complete causal + phenomenal state
 * 
 * Implements Chalmers' Universe Tuple: U = ⟨P, M, E, L⟩
 * - P (Physical): Database state, SCM structure
 * - M (Functional): primaryScm, tier2 (Do-Calculus logic)
 * - E (Phenomenal): phenomenalState (epistemic qualia)
 * - L (Laws): The constraints and bridging function Ψ
 */
export interface SCMContext {
  primaryScm: StructuralCausalModel;
  tier2?: StructuralCausalModel;
  domain: string;
  model?: {
    modelKey: string;
    version: string;
    validationJson?: Record<string, unknown>;
  };
  phenomenalState?: EpistemicQualia; // NEW: Chalmers E-Domain
}

export class SCMRetriever {
  /**
   * Retrieves the relevant SCM context for a domain
   * @param domain - The domain to retrieve (e.g., 'forest_ecology')
   * @param supabase - Optional Supabase client for "Truth Store" access
   * @param opts - Optional retrieval hints (explicit model key selection)
   */
  async retrieve(
    domain: string,
    supabase?: SupabaseClient,
    opts?: { modelKey?: string | null }
  ): Promise<SCMContext> {
    const rawDomain = typeof domain === "string" ? domain : "";
    const normalizedDomain = normalizeDomainKey(rawDomain);
    const keywordCandidates = deriveKeywordCandidates(rawDomain);
    const canonicalDomain = keywordCandidates[0] ?? normalizedDomain ?? rawDomain;
    console.log(`[SCMRetriever] Retrieving SCM for domain: ${rawDomain}`);
    const requestedModelKey = typeof opts?.modelKey === "string" ? opts.modelKey.trim() : "";
    
    // Always start with Tier 1
    const primaryScm = new StructuralCausalModel();
    let tier2: StructuralCausalModel | undefined = undefined;

    // 1. Instantiate the Logic Layer (TypeScript Classes)
    switch (canonicalDomain) {
      case 'ecology':
      case 'forest_ecology': // Handle alias
        const bioTemplate = new BiologicalEcologyTemplate();
        await bioTemplate.initialize();
        tier2 = bioTemplate;
        break;
      case 'evolutionary_biology':
        const selfishGeneTemplate = new SelfishGeneTemplate();
        await selfishGeneTemplate.initialize();
        tier2 = selfishGeneTemplate;
        break;
      case 'cognitive_psychology':
        const cognitiveTemplate = new CognitivePsychologyTemplate();
        await cognitiveTemplate.initialize();
        tier2 = cognitiveTemplate;
        break;
      case 'scaling_laws':
        const scalingTemplate = new ScalingLawsTemplate();
        await scalingTemplate.initialize();
        tier2 = scalingTemplate;
        break;
      case 'education':
      case 'educational':
      case 'learning':
        // Educational Systems - Pearl's SCM for personalized learning
        const educationalTemplate = new EducationalSCM();
        tier2 = educationalTemplate;
        break;
      case 'alignment':
      case 'ai_alignment':
        // Alignment currently uses canonical/legacy DB graph hydration only.
        break;
      case 'neuroscience':
      case 'neural_topology':
      case 'brain_networks':
        // Neural topology currently uses canonical/legacy DB graph hydration only.
        break;
      case 'theoretical_neuroscience':
      case 'neural_dynamics':
        // Neural dynamics currently uses canonical/legacy DB graph hydration only.
        break;
      case 'consciousness':
      case 'hot':
      case 'hot_theory':
      case 'higher_order':
      case 'metacognition':
      case 'rosenthal':
      case 'lau':
        // HOT Theory - uses canonical scm_models registry
        break;
      case 'iml':
      case 'interpretability':
      case 'interpretable_epistemology':
      case 'interpretable_machine_learning':
        // IML epistemology - uses canonical scm_models registry
        break;
      case 'iit':
      case 'integrated_information':
      case 'tononi':
      case 'phi':
      case 'boly':
      case 'cause_effect_structure':
        // Integrated Information Theory - uses canonical scm_models registry
        break;
      case 'chalmers':
      case 'chalmers_dualism':
      case 'hard_problem':
      case 'property_dualism':
      case 'zombie_argument':
      case 'naturalistic_dualism':
        // Chalmers Naturalistic Dualism - uses canonical scm_models registry
        break;
      default:
        // No Tier 2 for abstract or physics (physics is already in Tier 1)
        break;
    }

    const normalizeLookupDomains = (raw: string): string[] => {
      const normalized = normalizeDomainKey(raw);
      const keywordCandidates = deriveKeywordCandidates(raw);
      const aliases: Record<string, string[]> = {
        forest_ecology: ["ecology"],
        educational: ["education"],
        learning: ["education"],
        ai_alignment: ["alignment"],
        alignment_bias_scm: ["alignment"],
        neural_topology: ["neuroscience"],
        neural_topology_v1: ["neuroscience"],
        brain_networks: ["neuroscience"],
        theoretical_neuroscience: ["neural_dynamics"],
        neural_dynamics: ["theoretical_neuroscience"],
        neural_dynamics_v1: ["theoretical_neuroscience"],
        hot: ["hot_theory", "consciousness"],
        hot_theory: ["consciousness"],
        higher_order: ["hot_theory", "consciousness"],
        metacognition: ["hot_theory", "consciousness"],
        rosenthal: ["hot_theory", "consciousness"],
        lau: ["hot_theory", "consciousness"],
        hot_rosenthal_v1: ["hot_theory", "consciousness"],
        iit: ["integrated_information"],
        integrated_information: ["iit"],
        integrated_information_theory: ["iit"],
        tononi: ["iit"],
        phi: ["iit"],
        boly: ["iit"],
        cause_effect_structure: ["iit"],
        iit_v1: ["iit"],
        chalmers: ["chalmers_dualism"],
        chalmers_dualism: ["consciousness"],
        hard_problem: ["chalmers_dualism", "consciousness"],
        property_dualism: ["chalmers_dualism", "consciousness"],
        zombie_argument: ["chalmers_dualism", "consciousness"],
        naturalistic_dualism: ["chalmers_dualism", "consciousness"],
        chalmers_dualism_v1: ["chalmers_dualism", "consciousness"],
        interpretability: ["iml"],
        interpretable_epistemology: ["iml"],
        iml_epistemology_v1: ["iml"],
      };
      const candidates = [
        raw,
        normalized,
        canonicalDomain,
        ...(aliases[normalized] ?? []),
        ...keywordCandidates,
      ];
      const seen = new Set<string>();
      return candidates.filter((item) => {
        if (!item) return false;
        const key = normalizeDomainKey(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const applyDagToModel = (targetScm: StructuralCausalModel, dagJson: DagJsonLike) => {
      const rawNodes = Array.isArray(dagJson?.nodes) ? (dagJson.nodes as DagNodeLike[]) : [];
      const rawEdges = Array.isArray(dagJson?.edges) ? (dagJson.edges as DagEdgeLike[]) : [];

      const nodes = rawNodes
        .map((node): CausalNode => ({
          type: node.type === "observable" || node.type === "latent" || node.type === "exogenous" || node.type === "intervention"
            ? node.type
            : "observable",
          domain: node.domain === "physics" || node.domain === "chemistry" || node.domain === "biology" || node.domain === "abstract"
            ? node.domain
            : "abstract",
          description: typeof node.description === "string" ? node.description : undefined,
          domain_range: typeof node.domain_range === "string" ? node.domain_range : undefined,
          measurement_method: typeof node.measurement_method === "string" ? node.measurement_method : undefined,
          ...node,
          name: node?.name ?? node?.id ?? node?.label ?? "Unknown",
        }))
        .filter((node) => Boolean(node?.name));

      const edges = rawEdges
        .map((edge): CausalEdge => ({
          constraint:
            edge.constraint === "conservation" ||
            edge.constraint === "entropy" ||
            edge.constraint === "causality" ||
            edge.constraint === "locality" ||
            edge.constraint === "network_cooperation" ||
            edge.constraint === "empirical_contradiction" ||
            edge.constraint === "kin_selection" ||
            edge.constraint === "reference_point" ||
            edge.constraint === "loss_aversion" ||
            edge.constraint === "beta_regime" ||
            edge.constraint === "singularity_risk" ||
            edge.constraint === "interventional_contradiction"
              ? edge.constraint
              : "causality",
          reversible: typeof edge.reversible === "boolean" ? edge.reversible : false,
          sign: edge.sign === "+" || edge.sign === "-" || edge.sign === "unknown" ? edge.sign : undefined,
          strength: typeof edge.strength === "number" ? edge.strength : undefined,
          mechanism_description: typeof edge.mechanism_description === "string" ? edge.mechanism_description : undefined,
          evidence_type: typeof edge.evidence_type === "string" ? edge.evidence_type : undefined,
          ...edge,
          from: edge?.from ?? edge?.source ?? "",
          to: edge?.to ?? edge?.target ?? "",
        }))
        .filter((edge) => Boolean(edge?.from) && Boolean(edge?.to));

      if (nodes.length > 0 || edges.length > 0) {
        targetScm.hydrate(nodes, edges);
      }
    };

    const targetScm = tier2 || primaryScm;

    // 2. Hydrate from canonical SCM registry first (if available)
    if (supabase && FEATURE_FLAGS.SCM_REGISTRY_ENABLED) {
      try {
        const registry = new SCMRegistryService(supabase);

        if (requestedModelKey) {
          const registryByModelKey = await registry.getModelVersion(requestedModelKey);
          if (registryByModelKey) {
            applyDagToModel(targetScm, registryByModelKey.version.dagJson);
            console.log(
              `[SCMRetriever] Hydrated via explicit model key ${requestedModelKey} -> ${registryByModelKey.model.domain}`
            );
            return {
              primaryScm,
              tier2,
              domain: registryByModelKey.model.domain,
              model: {
                modelKey: registryByModelKey.model.modelKey,
                version: registryByModelKey.version.version,
                validationJson: registryByModelKey.version.validationJson,
              },
            };
          }
        }

        const lookupDomains = normalizeLookupDomains(domain);
        for (const lookupDomain of lookupDomains) {
          const registryModel = await registry.getCurrentModelByDomain(lookupDomain);
          if (registryModel) {
            applyDagToModel(targetScm, registryModel.version.dagJson);
            console.log(
              `[SCMRetriever] Hydrated ${domain} from SCM registry ${registryModel.model.modelKey}@${registryModel.version.version}`
            );
            return {
              primaryScm,
              tier2,
              domain: lookupDomain,
              model: {
                modelKey: registryModel.model.modelKey,
                version: registryModel.version.version,
                validationJson: registryModel.version.validationJson,
              },
            };
          }
        }
      } catch (err) {
        console.warn("[SCMRetriever] Registry hydration failed, attempting legacy fallback:", err);
      }
    }

    // 3. Legacy fallback from causal_models table
    if (supabase) {
      try {
        const lookupDomains = normalizeLookupDomains(domain);
        for (const lookupDomain of lookupDomains) {
          console.log(`[SCMRetriever] Legacy fallback lookup for domain: ${lookupDomain}`);
          const { data, error } = await supabase
            .from('causal_models')
            .select('nodes, edges')
            .eq('domain', lookupDomain)
            .single();

          if (error || !data) {
            continue;
          }

          if (data.nodes && data.edges) {
            const nodes = Array.isArray(data.nodes) ? (data.nodes as CausalNode[]) : [];
            const edges = Array.isArray(data.edges) ? (data.edges as CausalEdge[]) : [];
            console.log(`[SCMRetriever] Legacy hydrated ${lookupDomain} with ${nodes.length} nodes.`);
            targetScm.hydrate(nodes, edges);
            return {
              primaryScm,
              tier2,
              domain: lookupDomain,
            };
          }
        }
      } catch (err) {
        console.error("[SCMRetriever] Legacy hydration error:", err);
      }
    }

    // Compute phenomenal state (Ψ: P → E)
    // This happens for all SCM retrievals, including fallback/default
    const context: SCMContext = {
      primaryScm,
      tier2,
      domain: canonicalDomain || rawDomain
    };
    
    // Apply Chalmers' Ψ bridging function
    if (supabase && FEATURE_FLAGS.PHENOMENAL_LAYER_ENABLED !== false) {
      try {
        const phenomenalBridge = new PhenomenalBridge();
        const qualia = await phenomenalBridge.getOrComputeQualia(
          targetScm.id,
          context
        );
        context.phenomenalState = qualia;
        console.log(
          `[SCMRetriever] Computed epistemic qualia: ` +
          `confidence=${qualia.confidence_qualia.toFixed(2)}, ` +
          `clarity=${qualia.clarity_qualia.toFixed(2)}, ` +
          `tension=${qualia.tension_qualia.toFixed(2)}`
        );
      } catch (err) {
        console.warn("[SCMRetriever] Phenomenal bridge computation failed:", err);
        // Non-critical: continue without qualia
      }
    }
    
    return context;
  }
}

function normalizeDomainKey(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function deriveKeywordCandidates(raw: string): string[] {
  const lower = raw.toLowerCase();
  const candidates = new Set<string>();

  if (lower.includes("alignment") || lower.includes("rlhf") || lower.includes("safety")) {
    candidates.add("alignment");
    candidates.add("ai_alignment");
    candidates.add("alignment_bias_scm");
  }

  if (lower.includes("neuroscience") || lower.includes("neural") || lower.includes("brain")) {
    candidates.add("neuroscience");
    candidates.add("neural_topology");
    candidates.add("brain_networks");
  }

  if (lower.includes("theoretical neuroscience") || lower.includes("neural dynamics")) {
    candidates.add("theoretical_neuroscience");
    candidates.add("neural_dynamics");
  }

  if (lower.includes("consciousness") || lower.includes("higher order") || lower.includes("hot theory")) {
    candidates.add("consciousness");
    candidates.add("hot_theory");
  }

  if (lower.includes("interpretability") || lower.includes("mechanistic")) {
    candidates.add("iml");
    candidates.add("interpretable_epistemology");
  }

  if (lower.includes("integrated information") || lower.includes("iit")) {
    candidates.add("iit");
  }

  if (lower.includes("chalmers") || lower.includes("dualism") || lower.includes("hard problem")) {
    candidates.add("chalmers_dualism");
    candidates.add("consciousness");
  }

  if (lower.includes("education") || lower.includes("learning")) {
    candidates.add("education");
  }

  if (lower.includes("scaling law") || lower.includes("power law")) {
    candidates.add("scaling_laws");
  }

  if (lower.includes("ecology") || lower.includes("forest")) {
    candidates.add("ecology");
    candidates.add("forest_ecology");
  }

  return Array.from(candidates);
}
