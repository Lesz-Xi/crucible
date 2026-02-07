/**
 * API Route: Analyze Student Causal Profile
 * 
 * POST /api/education/analyze-student
 * 
 * Builds a personalized causal graph for a student based on:
 * - Intake data (demographics, motivation, learning style)
 * - Behavioral data (engagement, study patterns, performance)
 * 
 * Returns:
 * - Causal graph with nodes and edges
 * - Identified bottleneck (limiting factor)
 * - Leverage point (highest ROI intervention target)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  AnalyzeStudentRequest,
  AnalyzeStudentResponse,
  StudentCausalGraph,
  EducationalCausalNode,
  EducationalCausalEdge
} from "@/types/education";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body: AnalyzeStudentRequest = await request.json();
    
    // Validate required fields
    if (!body.studentId || !body.intakeData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: studentId, intakeData" },
        { status: 400 }
      );
    }
    
    console.log(`[AnalyzeStudent] Processing student: ${body.studentId.substring(0, 8)}...`);
    
    // Build personalized causal nodes from intake data
    const nodes: EducationalCausalNode[] = buildPersonalizedNodes(body);
    
    // Build causal edges with personalized strengths
    const edges: EducationalCausalEdge[] = buildPersonalizedEdges(body, nodes);
    
    // Identify bottleneck and leverage point
    const bottleneck = identifyBottleneck(nodes, edges);
    const leveragePoint = identifyLeveragePoint(nodes, edges);
    
    // Construct causal graph
    const causalGraph: StudentCausalGraph = {
      studentId: body.studentId,
      nodes,
      edges,
      bottleneck,
      leveragePoint,
      timestamp: new Date(),
      version: 1
    };
    
    // Store in database if Supabase is available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      try {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from("student_causal_profiles")
          .select("id, version")
          .eq("student_pseudonym", body.studentId)
          .single();
        
        if (existingProfile) {
          // Update existing profile
          await supabase
            .from("student_causal_profiles")
            .update({
              nodes: JSON.stringify(nodes),
              edges: JSON.stringify(edges),
              bottleneck,
              leverage_point: leveragePoint,
              version: existingProfile.version + 1,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingProfile.id);
        } else {
          // Create new profile
          await supabase
            .from("student_causal_profiles")
            .insert({
              student_pseudonym: body.studentId,
              nodes: JSON.stringify(nodes),
              edges: JSON.stringify(edges),
              bottleneck,
              leverage_point: leveragePoint,
              academic_level: body.intakeData.demographics.academicLevel,
              consent_data_collection: true,
              consent_date: new Date().toISOString()
            });
        }
        
        // Log access for FERPA compliance
        await supabase.rpc("log_educational_access", {
          p_resource_type: "student_profile",
          p_resource_id: body.studentId,
          p_accessor_id: null,
          p_accessor_role: "system",
          p_action: "analyze",
          p_purpose: "Build causal graph from intake data"
        });
      } catch (dbError) {
        console.warn("[AnalyzeStudent] Database operation failed:", dbError);
        // Continue without database - return graph anyway
      }
    }
    
    // Build response
    const response: AnalyzeStudentResponse = {
      success: true,
      causalGraph,
      timestamp: new Date()
    };
    
    // Add insights if requested
    if (body.options?.includeInsights) {
      response.insights = {
        strongestLinks: edges
          .filter(e => e.strength >= 0.7)
          .sort((a, b) => b.strength - a.strength),
        weakestLinks: edges
          .filter(e => e.strength <= 0.4)
          .sort((a, b) => a.strength - b.strength),
        bottleneck,
        leveragePoint
      };
    }
    
    const duration = Date.now() - startTime;
    console.log(`[AnalyzeStudent] Completed in ${duration}ms`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("[AnalyzeStudent] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * Build personalized causal nodes from intake data
 */
function buildPersonalizedNodes(request: AnalyzeStudentRequest): EducationalCausalNode[] {
  const { intakeData, behaviorData } = request;
  const now = new Date();
  
  const nodes: EducationalCausalNode[] = [
    // Exogenous nodes (background factors)
    {
      name: "FamilySupport",
      type: "exogenous",
      value: intakeData.studyEnvironment.familySupport,
      unit: "scale_0_10",
      confidence: 0.8,
      lastUpdated: now
    },
    {
      name: "SleepQuality",
      type: "exogenous",
      value: behaviorData?.studyPatterns.sleepQuality ?? 5,
      unit: "scale_0_10",
      confidence: behaviorData ? 0.9 : 0.5,
      lastUpdated: now
    },
    {
      name: "LearningStyle",
      type: "exogenous",
      value: intakeData.learningStyle,
      confidence: 0.7,
      lastUpdated: now
    },
    {
      name: "PriorKnowledge",
      type: "exogenous",
      value: intakeData.priorKnowledgeScore,
      unit: "percentage",
      confidence: 0.9,
      lastUpdated: now
    },
    
    // Observable nodes
    {
      name: "Motivation",
      type: "observable",
      value: calculateMotivationScore(intakeData.motivationProfile),
      unit: "scale_0_10",
      confidence: 0.75,
      lastUpdated: now
    },
    {
      name: "StudyHabits",
      type: "observable",
      value: behaviorData 
        ? calculateStudyHabitsScore(behaviorData.studyPatterns)
        : 5,
      unit: "scale_0_10",
      confidence: behaviorData ? 0.85 : 0.4,
      lastUpdated: now
    },
    {
      name: "ContentEngagement",
      type: "observable",
      value: behaviorData
        ? calculateEngagementScore(behaviorData.engagement)
        : 5,
      unit: "scale_0_10",
      confidence: behaviorData ? 0.9 : 0.4,
      lastUpdated: now
    },
    {
      name: "PracticeQuality",
      type: "observable",
      value: behaviorData
        ? calculatePracticeQualityScore(behaviorData.studyPatterns)
        : 5,
      unit: "scale_0_10",
      confidence: behaviorData ? 0.85 : 0.4,
      lastUpdated: now
    },
    {
      name: "Performance",
      type: "observable",
      value: behaviorData
        ? calculatePerformanceScore(behaviorData.performance)
        : intakeData.priorKnowledgeScore / 10,
      unit: "scale_0_10",
      confidence: behaviorData ? 0.95 : 0.5,
      lastUpdated: now
    },
    
    // Latent nodes
    {
      name: "CognitiveLoad",
      type: "latent",
      value: estimateCognitiveLoad(intakeData, behaviorData),
      unit: "scale_0_10",
      confidence: 0.6,
      lastUpdated: now
    },
    {
      name: "SelfEfficacy",
      type: "latent",
      value: intakeData.selfEfficacy,
      unit: "scale_0_10",
      confidence: 0.7,
      lastUpdated: now
    }
  ];
  
  return nodes;
}

/**
 * Build personalized causal edges with estimated strengths
 */
function buildPersonalizedEdges(
  request: AnalyzeStudentRequest,
  nodes: EducationalCausalNode[]
): EducationalCausalEdge[] {
  // Get node values for edge strength calculation
  const nodeValues: Record<string, number> = {};
  for (const node of nodes) {
    if (typeof node.value === "number") {
      nodeValues[node.name] = node.value;
    }
  }
  
  const edges: EducationalCausalEdge[] = [
    {
      from: "FamilySupport",
      to: "Motivation",
      mechanism: "Social support increases self-efficacy and perceived value of education",
      strength: calculateEdgeStrength(nodeValues.FamilySupport, 10, 0.6),
      evidence: "Deci & Ryan (2000) Self-Determination Theory",
      interventionPoints: ["family_counseling", "peer_mentoring"],
      modifiable: true
    },
    {
      from: "SleepQuality",
      to: "Motivation",
      mechanism: "Sleep deprivation reduces prefrontal cortex function and emotional regulation",
      strength: calculateEdgeStrength(nodeValues.SleepQuality, 10, 0.5),
      evidence: "Walker (2017) Why We Sleep",
      interventionPoints: ["sleep_hygiene_training"],
      modifiable: true
    },
    {
      from: "SleepQuality",
      to: "CognitiveLoad",
      mechanism: "Poor sleep reduces available working memory capacity",
      strength: calculateEdgeStrength(10 - nodeValues.SleepQuality, 10, 0.7),
      evidence: "Sweller (1988) Cognitive Load Theory",
      interventionPoints: ["sleep_hygiene_training"],
      modifiable: true
    },
    {
      from: "Motivation",
      to: "StudyHabits",
      mechanism: "Motivated students allocate more time and effort to studying",
      strength: calculateEdgeStrength(nodeValues.Motivation, 10, 0.7),
      evidence: "Zimmerman (2002) Self-Regulated Learning",
      interventionPoints: ["goal_setting", "growth_mindset_workshop"],
      modifiable: true
    },
    {
      from: "SelfEfficacy",
      to: "StudyHabits",
      mechanism: "Self-efficacious students persist through difficulties",
      strength: calculateEdgeStrength(nodeValues.SelfEfficacy, 10, 0.65),
      evidence: "Bandura (1997) Self-Efficacy",
      interventionPoints: ["mastery_experiences", "success_scaffolding"],
      modifiable: true
    },
    {
      from: "LearningStyle",
      to: "ContentEngagement",
      mechanism: "Content matched to learning preference reduces friction",
      strength: 0.4, // Fixed moderate strength - evidence is mixed
      evidence: "Pashler et al. (2008) Learning Styles: Concepts and Evidence",
      interventionPoints: ["content_format_adjustment"],
      modifiable: true
    },
    {
      from: "StudyHabits",
      to: "PracticeQuality",
      mechanism: "Regular practice enables deliberate practice techniques",
      strength: calculateEdgeStrength(nodeValues.StudyHabits, 10, 0.8),
      evidence: "Ericsson (1993) Deliberate Practice",
      interventionPoints: ["spaced_repetition_training", "active_recall_protocol"],
      modifiable: true
    },
    {
      from: "ContentEngagement",
      to: "PracticeQuality",
      mechanism: "Engaged students practice more effectively and ask better questions",
      strength: calculateEdgeStrength(nodeValues.ContentEngagement, 10, 0.5),
      evidence: "Chi (2009) Active-Constructive-Interactive Framework",
      interventionPoints: ["elaborative_interrogation"],
      modifiable: true
    },
    {
      from: "CognitiveLoad",
      to: "PracticeQuality",
      mechanism: "Excessive cognitive load prevents effective encoding",
      strength: calculateEdgeStrength(10 - nodeValues.CognitiveLoad, 10, 0.6),
      evidence: "Sweller (1988) Cognitive Load Theory",
      interventionPoints: ["content_chunking", "worked_examples"],
      modifiable: true
    },
    {
      from: "PriorKnowledge",
      to: "Performance",
      mechanism: "Prior knowledge provides schema for new learning",
      strength: calculateEdgeStrength(nodeValues.PriorKnowledge / 10, 10, 0.7),
      evidence: "Ausubel (1968) Educational Psychology",
      interventionPoints: ["prerequisite_review", "bridging_assignments"],
      modifiable: false // Can't change prior knowledge directly
    },
    {
      from: "PracticeQuality",
      to: "Performance",
      mechanism: "Deliberate practice drives skill acquisition",
      strength: calculateEdgeStrength(nodeValues.PracticeQuality, 10, 0.9),
      evidence: "Roediger & Karpicke (2006) Test-Enhanced Learning",
      interventionPoints: ["practice_test_regimen"],
      modifiable: true
    }
  ];
  
  return edges;
}

/**
 * Identify the primary bottleneck in the causal graph
 */
function identifyBottleneck(
  nodes: EducationalCausalNode[],
  edges: EducationalCausalEdge[]
): string {
  // Find nodes with low values that have high-strength outgoing edges
  let worstNode = "";
  let worstScore = Infinity;
  
  for (const node of nodes) {
    if (typeof node.value !== "number") continue;
    
    // Get outgoing edges
    const outgoingEdges = edges.filter(e => e.from === node.name);
    if (outgoingEdges.length === 0) continue;
    
    // Calculate bottleneck score: low value + high downstream impact
    const avgDownstreamStrength = outgoingEdges.reduce((sum, e) => sum + e.strength, 0) / outgoingEdges.length;
    const bottleneckScore = node.value - (avgDownstreamStrength * 5);
    
    if (bottleneckScore < worstScore) {
      worstScore = bottleneckScore;
      worstNode = node.name;
    }
  }
  
  return worstNode || "Performance";
}

/**
 * Identify the highest-ROI intervention target
 */
function identifyLeveragePoint(
  nodes: EducationalCausalNode[],
  edges: EducationalCausalEdge[]
): string {
  // Find modifiable edges with highest strength leading to Performance
  let bestTarget = "";
  let bestScore = 0;
  
  // Build path strengths to Performance
  const pathStrengths: Record<string, number> = {};
  
  // Simple: look at direct edges to Performance
  for (const edge of edges) {
    if (edge.to === "Performance" && edge.modifiable) {
      pathStrengths[edge.from] = edge.strength;
    }
  }
  
  // Add indirect paths (one step removed)
  for (const edge of edges) {
    if (pathStrengths[edge.to] && edge.modifiable) {
      const indirectStrength = edge.strength * pathStrengths[edge.to] * 0.8; // Discount
      pathStrengths[edge.from] = Math.max(pathStrengths[edge.from] || 0, indirectStrength);
    }
  }
  
  // Find node with highest path strength and room for improvement
  for (const node of nodes) {
    if (typeof node.value !== "number") continue;
    if (!pathStrengths[node.name]) continue;
    
    const roomForImprovement = 10 - node.value;
    const leverageScore = pathStrengths[node.name] * roomForImprovement;
    
    if (leverageScore > bestScore) {
      bestScore = leverageScore;
      bestTarget = node.name;
    }
  }
  
  return bestTarget || "StudyHabits";
}

// Helper functions

function calculateMotivationScore(profile: AnalyzeStudentRequest["intakeData"]["motivationProfile"]): number {
  // Weighted combination: intrinsic matters most, amotivation is negative
  return Math.min(10, Math.max(0,
    (profile.intrinsic * 0.5) + 
    (profile.extrinsic * 0.3) + 
    (profile.perceivedValueOfCourse * 0.4) -
    (profile.amotivation * 0.5)
  ));
}

function calculateStudyHabitsScore(patterns: NonNullable<AnalyzeStudentRequest["behaviorData"]>["studyPatterns"]): number {
  let score = 5; // Baseline
  
  // Positive factors
  if (patterns.usesActiveRecall) score += 1.5;
  if (patterns.usesSpacedRepetition) score += 1.5;
  score += patterns.consistency * 2; // 0-1 scale
  
  // Negative factors
  score -= patterns.procrastinationIndex * 0.3;
  
  // Hours factor (diminishing returns)
  score += Math.min(2, patterns.totalStudyHours / 10);
  
  return Math.min(10, Math.max(0, score));
}

function calculateEngagementScore(metrics: NonNullable<AnalyzeStudentRequest["behaviorData"]>["engagement"]): number {
  const attendance = metrics.lectureAttendance / 10; // Convert 0-100 to 0-10
  const videoAvg = metrics.videoCompletion.length > 0
    ? metrics.videoCompletion.reduce((a, b) => a + b, 0) / metrics.videoCompletion.length / 10
    : 5;
  const interaction = Math.min(2, metrics.videoInteractionRate * 0.5);
  const questions = Math.min(2, metrics.questionAsking * 0.2);
  const officeHours = Math.min(1, metrics.officeHoursAttendance * 0.25);
  const peer = metrics.peerCollaboration;
  
  return Math.min(10, (attendance + videoAvg + interaction + questions + officeHours + peer) / 6 * 10);
}

function calculatePracticeQualityScore(patterns: NonNullable<AnalyzeStudentRequest["behaviorData"]>["studyPatterns"]): number {
  let score = 3; // Low baseline for passive study
  
  if (patterns.usesActiveRecall) score += 3;
  if (patterns.usesSpacedRepetition) score += 2;
  score += patterns.consistency * 2;
  
  return Math.min(10, Math.max(0, score));
}

function calculatePerformanceScore(performance: NonNullable<AnalyzeStudentRequest["behaviorData"]>["performance"]): number {
  const allScores = [
    ...performance.homeworkScores,
    ...performance.quizScores,
    ...performance.examScores,
    ...performance.projectGrades
  ];
  
  if (allScores.length === 0) return 5;
  
  const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  return avg / 10; // Convert 0-100 to 0-10
}

function estimateCognitiveLoad(
  intakeData: AnalyzeStudentRequest["intakeData"],
  behaviorData?: AnalyzeStudentRequest["behaviorData"]
): number {
  let load = 5; // Baseline
  
  // Prior knowledge reduces load
  load -= (intakeData.priorKnowledgeScore / 100) * 2;
  
  // Working memory affects capacity
  if (intakeData.workingMemoryScore) {
    load -= (intakeData.workingMemoryScore - 100) / 50;
  }
  
  // Sleep affects capacity
  if (behaviorData?.studyPatterns.sleepQuality) {
    load += (10 - behaviorData.studyPatterns.sleepQuality) * 0.3;
  }
  
  // Learning disabilities increase load
  if (intakeData.demographics.learningDisabilities?.length) {
    load += intakeData.demographics.learningDisabilities.length * 0.5;
  }
  
  return Math.min(10, Math.max(0, load));
}

function calculateEdgeStrength(value: number, max: number, baseStrength: number): number {
  // Scale edge strength based on node value
  const normalized = value / max;
  // Strength varies ±30% based on node value
  return Math.min(1, Math.max(0.1, baseStrength * (0.7 + normalized * 0.6)));
}
