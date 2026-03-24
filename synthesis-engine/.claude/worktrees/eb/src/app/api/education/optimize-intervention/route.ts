/**
 * API Route: Optimize Educational Interventions
 * 
 * POST /api/education/optimize-intervention
 * 
 * Uses do-calculus to simulate interventions on a student's causal graph
 * and rank them by Maximum Expected Improvement (MEI).
 * 
 * Returns:
 * - Ranked list of interventions with expected gains
 * - Counterfactual scenarios
 * - Natural language explanation
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { EducationalSCM } from "@/lib/ai/educational-scm";
import { StructuralCausalModel } from "@/lib/ai/causal-blueprint";
import { evaluateInterventionGate } from "@/lib/services/identifiability-gate";
import {
  buildCounterfactualTrace,
  buildCounterfactualTraceRef,
  persistCounterfactualTrace,
} from "@/lib/services/counterfactual-trace";
import {
  OptimizeInterventionRequest,
  OptimizeInterventionResponse,
  Intervention,
  InterventionResult,
  CounterfactualScenario,
  StudentCausalGraph
} from "@/types/education";

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeNumericValue(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  if (value > 10) return Number((value / 10).toFixed(4));
  return Number(value.toFixed(4));
}

function getNodeNumericValue(graph: StudentCausalGraph, nodeName: string, fallback: number): number {
  const node = graph.nodes.find((candidate) => normalizeToken(candidate.name) === normalizeToken(nodeName));
  return normalizeNumericValue(node?.value, fallback);
}

function graphHasNode(graph: StudentCausalGraph, name: string): boolean {
  const normalized = normalizeToken(name);
  return graph.nodes.some((node) => normalizeToken(node.name) === normalized);
}

function resolveOutcomeVariable(graph: StudentCausalGraph, goal: string): string {
  const preferredTokens =
    goal === "engagement"
      ? ["contentengagement", "engagement", "participation"]
      : goal === "well_being"
        ? ["wellbeing", "mentalhealth", "stress"]
        : ["performance", "grade", "mastery"];
  const nodes = graph.nodes.map((node) => node.name);
  for (const node of nodes) {
    const normalized = normalizeToken(node);
    if (preferredTokens.some((token) => normalized.includes(token))) {
      return node;
    }
  }
  return nodes.find((node) => normalizeToken(node) === "performance") || "Performance";
}

function buildEducationalScm(graph: StudentCausalGraph): StructuralCausalModel {
  const scm = new StructuralCausalModel();
  scm.hydrate(
    graph.nodes.map((node) => ({
      name: node.name,
      type: node.type,
      domain: "education",
    })) as any[],
    graph.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      constraint: "causality",
      reversible: false,
      strength: edge.strength,
    })) as any[]
  );
  return scm;
}

function getDefaultAdjustmentSet(
  graph: StudentCausalGraph,
  treatment: string,
  outcome: string
): string[] {
  const normalizedTreatment = normalizeToken(treatment);
  const normalizedOutcome = normalizeToken(outcome);
  return Array.from(
    new Set(
      graph.nodes
        .filter((node) => {
          const normalized = normalizeToken(node.name);
          return normalized !== normalizedTreatment && normalized !== normalizedOutcome;
        })
        .filter((node) => node.type === "exogenous" || node.type === "latent")
        .map((node) => node.name)
    )
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body: OptimizeInterventionRequest = await request.json();
    
    // Validate required fields
    if (!body.studentId) {
      return NextResponse.json(
        { success: false, error: "Missing required field: studentId" },
        { status: 400 }
      );
    }
    
    console.log(`[OptimizeIntervention] Processing student: ${body.studentId.substring(0, 8)}...`);
    
    // Resolve causal graph + interventions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    let studentGraph: StudentCausalGraph | null = body.causalGraph
      ? normalizeIncomingGraph(body.causalGraph, body.studentId)
      : null;
    let interventions: Intervention[] = [];
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      if (!studentGraph) {
        // Fallback to persisted profile only when graph is not passed from client
        const { data: profile } = await supabase
          .from("student_causal_profiles")
          .select("*")
          .eq("student_pseudonym", body.studentId)
          .single();
        
        if (profile) {
          studentGraph = {
            studentId: profile.student_pseudonym,
            nodes: typeof profile.nodes === "string" ? JSON.parse(profile.nodes) : profile.nodes,
            edges: typeof profile.edges === "string" ? JSON.parse(profile.edges) : profile.edges,
            bottleneck: profile.bottleneck,
            leveragePoint: profile.leverage_point,
            timestamp: new Date(profile.updated_at),
            version: profile.version
          };
        }
      }
      
      // Fetch available interventions
      const { data: interventionData } = await supabase
        .from("interventions_library")
        .select("*")
        .eq("status", "active");
      
      if (interventionData) {
        interventions = interventionData.map(i => ({
          id: i.id,
          name: i.name,
          category: i.category,
          target: i.target_node,
          targetValue: 10, // Assume max improvement
          mechanism: i.mechanism,
          energyCost: i.energy_cost,
          duration: i.duration,
          resources: i.required_resources || [],
          evidenceBasis: i.evidence_basis,
          successRate: i.success_rate
        }));
      }
      
      // Log access for FERPA compliance
      await supabase.rpc("log_educational_access", {
        p_resource_type: "student_profile",
        p_resource_id: body.studentId,
        p_accessor_id: null,
        p_accessor_role: "system",
        p_action: "analyze",
        p_purpose: "Optimize intervention selection"
      });
    }
    
    // If no database, use defaults
    if (!studentGraph) {
      // Create a default graph for demo purposes
      const educationalSCM = new EducationalSCM();
      const defaultGraph = educationalSCM.getDefaultGraph();
      studentGraph = {
        studentId: body.studentId,
        nodes: defaultGraph.nodes.map(n => ({
          name: n.name,
          type: n.type,
          value: 5, // Default middle value
          confidence: 0.5,
          lastUpdated: new Date()
        })),
        edges: defaultGraph.edges.map(e => ({
          from: e.from,
          to: e.to,
          mechanism: "Default mechanism",
          strength: 0.5,
          evidence: "Template default",
          modifiable: true
        })),
        bottleneck: "StudyHabits",
        leveragePoint: "Motivation",
        timestamp: new Date(),
        version: 1
      };
    }
    
    if (interventions.length === 0) {
      interventions = getDefaultInterventions();
    }

    if (!studentGraph) {
      throw new Error("Student causal graph is required for intervention optimization.");
    }
    
    // Filter interventions based on constraints
    let filteredInterventions = interventions;
    if (body.constraints) {
      if (body.constraints.maxEffort !== undefined) {
        filteredInterventions = filteredInterventions.filter(
          i => i.energyCost <= body.constraints!.maxEffort!
        );
      }
      if (body.constraints.excludeCategories?.length) {
        filteredInterventions = filteredInterventions.filter(
          i => !body.constraints!.excludeCategories!.includes(i.category)
        );
      }
    }
    
    // Simulate each intervention and enforce identifiability gate
    const scm = buildEducationalScm(studentGraph);
    const outcomeVariable = resolveOutcomeVariable(studentGraph, body.optimizationGoal);
    const allowedResults: InterventionResult[] = [];
    const blockedResults: InterventionResult[] = [];
    const blockedMissingConfounders = new Set<string>();
    let hasInferredBlocks = false;

    for (const intervention of filteredInterventions) {
      const result = simulateIntervention(studentGraph, intervention, body.optimizationGoal);
      const adjustmentSet = getDefaultAdjustmentSet(studentGraph, intervention.target, outcomeVariable);
      const gate =
        graphHasNode(studentGraph, intervention.target) && graphHasNode(studentGraph, outcomeVariable)
          ? evaluateInterventionGate(scm, {
              treatment: intervention.target,
              outcome: outcomeVariable,
              adjustmentSet,
              knownConfounders: [],
            })
          : {
              allowed: false,
              allowedOutputClass: "association_only" as const,
              rationale: "Intervention gate could not map treatment/outcome to the student causal graph.",
              identifiability: {
                identifiable: false,
                requiredConfounders: [],
                adjustmentSet,
                missingConfounders: [],
                note: "No executable intervention path.",
              },
            };

      let counterfactualTrace = undefined;
      if (gate.allowed) {
        const trace = buildCounterfactualTrace(scm, {
          modelRef: {
            modelKey: "education_student_graph",
            version: `profile-v${studentGraph.version}`,
          },
          intervention: {
            variable: intervention.target,
            value: 1,
          },
          outcome: outcomeVariable,
          observedWorld: {
            [intervention.target]: getNodeNumericValue(studentGraph, intervention.target, 0.5),
            [outcomeVariable]: getNodeNumericValue(studentGraph, outcomeVariable, 0.5),
          },
          assumptions: [
            gate.rationale,
            `Optimization goal: ${body.optimizationGoal}`,
            "Counterfactual trace computed via deterministic educational SCM propagation.",
          ],
          adjustmentSet,
          method: "deterministic_graph_diff",
          uncertainty: "low",
        });
        const persisted = await persistCounterfactualTrace({
          trace,
          sourceFeature: "education",
        });
        counterfactualTrace = buildCounterfactualTraceRef(trace, persisted.persisted);
      }

      const resultWithGate: InterventionResult = {
        ...result,
        counterfactualTrace,
        interventionGate: {
          allowed: gate.allowed,
          allowedOutputClass: gate.allowedOutputClass,
          rationale: gate.rationale,
          counterfactualTrace,
          identifiability: gate.identifiability,
        },
      };

      if (gate.allowed) {
        allowedResults.push(resultWithGate);
        continue;
      }

      if (gate.allowedOutputClass === "intervention_inferred") {
        hasInferredBlocks = true;
      }
      for (const missing of gate.identifiability.missingConfounders) {
        blockedMissingConfounders.add(missing);
      }
      blockedResults.push({
        ...resultWithGate,
        expectedGain: 0,
        utility: 0,
        confidence: Math.min(resultWithGate.confidence, 0.3),
        contraIndications: Array.from(
          new Set([
            ...(resultWithGate.contraIndications || []),
            `Downgraded by identifiability gate: ${gate.rationale}`,
          ])
        ),
      });
    }

    const rankedResults = rerankInterventionsWithDiversity(allowedResults);
    const fallbackRankedBlocked = rerankInterventionsWithDiversity(blockedResults);
    const recommendationPool = rankedResults.length > 0 ? rankedResults : fallbackRankedBlocked;
    if (recommendationPool.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No interventions available after applying request constraints.",
        },
        { status: 400 }
      );
    }

    const topRecommendation = recommendationPool[0];
    const allowedOutputClass =
      rankedResults.length > 0
        ? "intervention_supported"
        : hasInferredBlocks
          ? "intervention_inferred"
          : "association_only";

    const counterfactuals =
      rankedResults.length > 0
        ? await generateCounterfactuals(studentGraph, scm, topRecommendation, outcomeVariable)
        : [];
    const counterfactualTraceIds = Array.from(
      new Set(
        [
          ...counterfactuals
            .map((scenario) => scenario.counterfactualTrace?.traceId)
            .filter((value): value is string => Boolean(value)),
          ...rankedResults
            .map((item) => item.counterfactualTrace?.traceId)
            .filter((value): value is string => Boolean(value)),
        ]
      )
    );

    let explanation = generateExplanation(studentGraph, topRecommendation, body.optimizationGoal);
    if (rankedResults.length === 0) {
      explanation = `Intervention claims are downgraded to ${allowedOutputClass} because identifiability checks could not support do-calculus claims. ${explanation}`;
    }
    
    // Build response
    const response: OptimizeInterventionResponse = {
      success: true,
      rankedInterventions: recommendationPool,
      topRecommendation,
      explanation,
      counterfactuals,
      counterfactualTraceIds,
      allowedOutputClass,
      interventionGateSummary: {
        allowedInterventions: rankedResults.length,
        blockedInterventions: blockedResults.length,
        missingConfounders: Array.from(blockedMissingConfounders),
        rationale:
          rankedResults.length > 0
            ? "Top recommendations passed identifiability gate checks."
            : "No interventions passed identifiability checks; results downgraded.",
      },
      blockedInterventions: blockedResults,
      timestamp: new Date()
    };
    
    const duration = Date.now() - startTime;
    console.log(`[OptimizeIntervention] Completed in ${duration}ms`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("[OptimizeIntervention] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

function normalizeIncomingGraph(graph: StudentCausalGraph, studentId: string): StudentCausalGraph {
  return {
    ...graph,
    studentId: graph.studentId || studentId,
    timestamp: graph.timestamp ? new Date(graph.timestamp) : new Date(),
    nodes: graph.nodes.map((node) => ({
      ...node,
      lastUpdated: node.lastUpdated ? new Date(node.lastUpdated) : new Date(),
    })),
  };
}

/**
 * Simulate intervention using do-calculus (graph surgery)
 */
function simulateIntervention(
  graph: StudentCausalGraph,
  intervention: Intervention,
  goal: string
): InterventionResult {
  // Find target node
  const targetNode = graph.nodes.find(n => n.name === intervention.target);
  const targetValue = typeof targetNode?.value === "number" ? targetNode.value : 5;
  
  // Calculate improvement potential
  const roomForImprovement = 10 - targetValue;
  const effectiveImprovement = roomForImprovement * (intervention.successRate || 0.6);
  
  // Trace causal path to performance
  const causalPath = traceCausalPath(graph, intervention.target, "Performance");
  
  // Calculate expected gain through causal chain
  let expectedGain = effectiveImprovement;
  for (let i = 0; i < causalPath.length - 1; i++) {
    const edge = graph.edges.find(
      e => e.from === causalPath[i] && e.to === causalPath[i + 1]
    );
    if (edge) {
      expectedGain *= edge.strength;
    }
  }
  
  // Adjust for goal if not performance
  if (goal === "engagement") {
    const engagementPath = traceCausalPath(graph, intervention.target, "ContentEngagement");
    if (engagementPath.length > 0 && engagementPath.length < causalPath.length) {
      expectedGain *= 1.2; // Bonus for shorter path to engagement
    }
  }
  
  // Calculate utility
  const utility = expectedGain / Math.max(0.1, intervention.energyCost);
  
  // Estimate time to effect based on duration
  let timeToEffect = "2 weeks";
  if (intervention.duration === "one-time") {
    timeToEffect = "1 week";
  } else if (intervention.duration?.includes("semester")) {
    timeToEffect = "4-6 weeks";
  }
  
  // Determine confidence based on evidence
  const confidence = intervention.successRate 
    ? Math.min(0.9, intervention.successRate + 0.1)
    : 0.5;
  
  return {
    intervention,
    expectedGain: Math.round(expectedGain * 10) / 10,
    effortCost: intervention.energyCost,
    utility: Math.round(utility * 10) / 10,
    confidence,
    timeToEffect,
    causalPath
  };
}

/**
 * Greedy diversity-aware reranking.
 * Keeps strong utility while discouraging repeated targets/categories near the top.
 */
function rerankInterventionsWithDiversity(results: InterventionResult[]): InterventionResult[] {
  const remaining = [...results];
  const ranked: InterventionResult[] = [];
  const targetCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  // Tuned for current utility scale (~0-6)
  const targetPenalty = 0.8;
  const categoryPenalty = 0.35;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const sameTarget = targetCounts.get(candidate.intervention.target) ?? 0;
      const sameCategory = categoryCounts.get(candidate.intervention.category) ?? 0;
      const adjustedScore = candidate.utility - (sameTarget * targetPenalty) - (sameCategory * categoryPenalty);

      if (
        adjustedScore > bestScore
        || (adjustedScore === bestScore && candidate.utility > remaining[bestIndex].utility)
      ) {
        bestScore = adjustedScore;
        bestIndex = i;
      }
    }

    const selected = remaining.splice(bestIndex, 1)[0];
    ranked.push(selected);

    targetCounts.set(
      selected.intervention.target,
      (targetCounts.get(selected.intervention.target) ?? 0) + 1
    );
    categoryCounts.set(
      selected.intervention.category,
      (categoryCounts.get(selected.intervention.category) ?? 0) + 1
    );
  }

  return ranked;
}

/**
 * Trace causal path between nodes using BFS
 */
function traceCausalPath(
  graph: StudentCausalGraph,
  from: string,
  to: string
): string[] {
  if (from === to) return [from];
  
  const visited = new Set<string>();
  const queue: { node: string; path: string[] }[] = [{ node: from, path: [from] }];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (visited.has(current.node)) continue;
    visited.add(current.node);
    
    // Find outgoing edges
    const outgoing = graph.edges.filter(e => e.from === current.node);
    
    for (const edge of outgoing) {
      const newPath = [...current.path, edge.to];
      
      if (edge.to === to) {
        return newPath;
      }
      
      queue.push({ node: edge.to, path: newPath });
    }
  }
  
  return [from]; // No path found
}

/**
 * Generate deterministic counterfactual scenarios with trace IDs.
 */
async function generateCounterfactuals(
  graph: StudentCausalGraph,
  scm: StructuralCausalModel,
  topResult: InterventionResult,
  outcomeVariable: string
): Promise<CounterfactualScenario[]> {
  const treatment = topResult.intervention.target;
  const observedWorld = {
    [treatment]: getNodeNumericValue(graph, treatment, 0.5),
    [outcomeVariable]: getNodeNumericValue(graph, outcomeVariable, 0.5),
  };

  const scenarioSpecs: Array<{
    type: CounterfactualScenario["type"];
    interventionValue: number;
    condition: string;
    expectedOutcome: string;
    testsPurpose: string;
    assumptions: string[];
  }> = [
    {
      type: "boundary",
      interventionValue: 0.5,
      condition: `What if ${treatment} only improves marginally (+0.5 units)?`,
      expectedOutcome: "Outcome should improve, but less than full intervention.",
      testsPurpose: "Checks boundary sensitivity of intervention magnitude.",
      assumptions: ["Boundary stress test with submaximal intervention intensity."],
    },
    {
      type: "alternative_intervention",
      interventionValue: 1,
      condition: `What if we intervene directly on ${treatment} with full intensity (+1.0)?`,
      expectedOutcome: "Outcome should move in the causal direction predicted by the graph.",
      testsPurpose: "Validates primary intervention mechanism on the treatment node.",
      assumptions: ["Primary intervention path under deterministic graph propagation."],
    },
    {
      type: "confounding",
      interventionValue: -0.5,
      condition: `What if confounding pressure degrades ${treatment} (-0.5)?`,
      expectedOutcome: "Outcome should decline or stall if confounding dominates the path.",
      testsPurpose: "Tests robustness under adverse confounder pressure.",
      assumptions: ["Adversarial counterfactual to probe confounder sensitivity."],
    },
  ];

  const scenarios: CounterfactualScenario[] = [];
  for (const spec of scenarioSpecs) {
    const trace = buildCounterfactualTrace(scm, {
      modelRef: {
        modelKey: "education_student_graph",
        version: `profile-v${graph.version}`,
      },
      intervention: {
        variable: treatment,
        value: spec.interventionValue,
      },
      outcome: outcomeVariable,
      observedWorld,
      assumptions: [
        ...spec.assumptions,
        topResult.intervention.mechanism,
      ],
      adjustmentSet: topResult.interventionGate?.identifiability.adjustmentSet || [],
      method: "deterministic_graph_diff",
      uncertainty: "low",
    });
    const persisted = await persistCounterfactualTrace({
      trace,
      sourceFeature: "education",
    });
    const traceRef = buildCounterfactualTraceRef(trace, persisted.persisted);

    scenarios.push({
      type: spec.type,
      condition: spec.condition,
      expectedOutcome: spec.expectedOutcome,
      testsPurpose: spec.testsPurpose,
      counterfactualTrace: traceRef,
      result: {
        passed: trace.result.delta >= 0,
        actualOutcome: `actual=${trace.result.actualOutcome.toFixed(3)}, counterfactual=${trace.result.counterfactualOutcome.toFixed(3)}, delta=${trace.result.delta.toFixed(3)}`,
        explanation: trace.result.delta >= 0
          ? "Counterfactual trajectory supports the proposed causal direction."
          : "Counterfactual trajectory weakens the proposed causal direction.",
      },
    });
  }

  return scenarios;
}

/**
 * Generate natural language explanation
 */
function generateExplanation(
  graph: StudentCausalGraph,
  topResult: InterventionResult,
  goal: string
): string {
  const { intervention, expectedGain, causalPath, confidence } = topResult;
  
  const pathDescription = causalPath.length > 1
    ? causalPath.join(" → ")
    : intervention.target;
  
  return `**Recommended Intervention: ${intervention.name}**

Based on your causal profile, we recommend targeting **${intervention.target}** because:

1. **Current Bottleneck:** Your causal graph shows ${graph.bottleneck} as the primary limiting factor.

2. **Mechanism:** ${intervention.mechanism}

3. **Causal Path to ${goal === "performance" ? "Performance" : goal === "engagement" ? "Engagement" : "Well-being"}:**
   ${pathDescription}

4. **Expected Outcome:** This intervention is predicted to improve your ${goal} by approximately **${expectedGain} points** (on a 10-point scale) with ${Math.round(confidence * 100)}% confidence.

5. **Effort Required:** ${intervention.energyCost < 0.3 ? "Low" : intervention.energyCost < 0.6 ? "Moderate" : "High"} effort (${intervention.duration})

6. **Evidence Basis:** ${intervention.evidenceBasis}

**Why this over other options?**
This intervention ranks highest after balancing utility (gain per effort) with target diversity across options, given your unique causal fingerprint. Targeting ${intervention.target} addresses a root cause rather than treating symptoms.`;
}

/**
 * Default interventions when database is unavailable
 */
function getDefaultInterventions(): Intervention[] {
  return [
    {
      id: "default-1",
      name: "Growth Mindset Workshop",
      category: "motivation",
      target: "Motivation",
      targetValue: 10,
      mechanism: "Reframes ability as malleable through effort",
      energyCost: 0.2,
      duration: "one-time",
      resources: ["2-hour workshop"],
      evidenceBasis: "Yeager & Dweck (2012)",
      successRate: 0.65
    },
    {
      id: "default-2",
      name: "Spaced Repetition Training",
      category: "study_habits",
      target: "StudyHabits",
      targetValue: 10,
      mechanism: "Distributes practice over time for better retention",
      energyCost: 0.4,
      duration: "1 semester",
      resources: ["Anki software"],
      evidenceBasis: "Cepeda et al. (2006)",
      successRate: 0.75
    },
    {
      id: "default-3",
      name: "Active Recall Protocol",
      category: "study_habits",
      target: "PracticeQuality",
      targetValue: 10,
      mechanism: "Replaces passive re-reading with retrieval practice",
      energyCost: 0.35,
      duration: "2 weeks",
      resources: ["Flashcard system"],
      evidenceBasis: "Roediger & Karpicke (2006)",
      successRate: 0.80
    },
    {
      id: "default-4",
      name: "Metacognitive Monitoring",
      category: "cognitive_strategies",
      target: "PracticeQuality",
      targetValue: 10,
      mechanism: "Improves self-assessment accuracy",
      energyCost: 0.3,
      duration: "4 weeks",
      resources: ["Prediction tracking"],
      evidenceBasis: "Dunlosky & Rawson (2012)",
      successRate: 0.60
    },
    {
      id: "default-5",
      name: "Sleep Hygiene Training",
      category: "family_support",
      target: "SleepQuality",
      targetValue: 10,
      mechanism: "Improves sleep quality for better cognitive function",
      energyCost: 0.25,
      duration: "2 weeks",
      resources: ["Sleep tracking app"],
      evidenceBasis: "Walker (2017)",
      successRate: 0.55
    }
  ];
}
