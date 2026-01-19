// Hybrid Synthesis API Route - Combines PDFs + Companies
// Tier 1: Integrated calibrated confidence
import { NextRequest, NextResponse } from "next/server";
import { processMultiplePDFs } from "@/lib/extractors/pdf-extractor";
import { processMultipleCompanies } from "@/lib/extractors/company-extractor";
import {
  extractConcepts,
  detectContradictions,
  generateNovelIdeas,
  generateStructuredApproach,
  estimateConfidenceFactors,
  calculateCalibratedConfidence,
  refineNovelIdea,
} from "@/lib/ai/synthesis-engine";
import {
  searchPriorArt,
  calculateNoveltyScore,
  generateNoveltyAssessment,
} from "@/lib/ai/novelty-evaluator";
import { ExtractedConcepts, NovelIdea } from "@/types";

export const maxDuration = 120; // Extended time for hybrid processing

interface UnifiedSource {
  name: string;
  type: "pdf" | "company";
  concepts: ExtractedConcepts;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Get PDFs
    const files = formData.getAll("files") as File[];
    
    // Get company names (JSON array)
    const companiesJson = formData.get("companies") as string | null;
    const companies: string[] = companiesJson ? JSON.parse(companiesJson) : [];

    const totalSources = files.length + companies.length;

    if (totalSources < 2) {
      return NextResponse.json(
        { error: "Please provide at least 2 sources (PDFs and/or companies)" },
        { status: 400 }
      );
    }

    if (totalSources > 12) {
      return NextResponse.json(
        { error: "Maximum 12 sources allowed (combined PDFs + companies)" },
        { status: 400 }
      );
    }

    const unifiedSources: UnifiedSource[] = [];

    // Process PDFs
    const pdfErrors: { name: string; error: string }[] = [];
    if (files.length > 0) {
      const pdfBuffers = await Promise.all(
        files.map(async (file) => ({
          buffer: await file.arrayBuffer(),
          name: file.name,
        }))
      );

      const { successful, failed } = await processMultiplePDFs(pdfBuffers);
      pdfErrors.push(...failed);

      // Extract concepts from each PDF
      for (const pdf of successful) {
        const concepts = await extractConcepts(
          pdf.fullText.slice(0, 50000),
          pdf.fileName
        );
        unifiedSources.push({
          name: pdf.fileName,
          type: "pdf",
          concepts,
        });
      }
    }

    // Process Companies
    const companyErrors: { name: string; error: string }[] = [];
    if (companies.length > 0) {
      const { successful, failed } = await processMultipleCompanies(companies);
      companyErrors.push(...failed);

      for (const company of successful) {
        if (company.extractedConcepts) {
          unifiedSources.push({
            name: company.companyName,
            type: "company",
            concepts: company.extractedConcepts,
          });
        }
      }
    }

    if (unifiedSources.length === 0) {
      return NextResponse.json(
        { 
          error: "Processing failed for all sources.",
          details: {
            pdfErrors,
            companyErrors
          }
        },
        { status: 422 }
      );
    }

    // Detect contradictions across all sources
    const contradictions = await detectContradictions(
      unifiedSources.map((s) => ({
        name: s.name,
        thesis: s.concepts.mainThesis,
        arguments: s.concepts.keyArguments,
      }))
    );

    // Generate novel ideas from unified sources
    let novelIdeas = await generateNovelIdeas(
      unifiedSources.map((s) => ({
        name: s.name,
        concepts: s.concepts,
      })),
      contradictions
    );

    // TIER 1: Evaluate and refine loop with calibration
    const MAX_REFINEMENT_ITERATIONS = 3;
    const NOVELTY_THRESHOLD = 0.30;
    let totalRefinements = 0;

    const ideasWithNovelty = await Promise.all(
      novelIdeas.map(async (idea) => {
        let currentIdea = idea;
        let iteration = 0;

        while (iteration < MAX_REFINEMENT_ITERATIONS) {
          // Search prior art
          const priorArt = await searchPriorArt(currentIdea.thesis, currentIdea.description);
          const noveltyScore = calculateNoveltyScore(priorArt);
          const noveltyAssessment = generateNoveltyAssessment(priorArt, noveltyScore);

          // Calculate calibrated confidence with Tier 1 factors
          const factors = estimateConfidenceFactors(
            unifiedSources.map((s) => ({ name: s.name, concepts: s.concepts })),
            contradictions,
            currentIdea,
            priorArt
          );
          const { score: calibratedConfidence, explanation: confidenceExplanation } = calculateCalibratedConfidence(factors);

          // Update idea with calibration
          currentIdea = {
            ...currentIdea,
            confidence: calibratedConfidence,
            confidenceFactors: factors,
            confidenceExplanation,
            noveltyAssessment,
          };

          // Check if refinement needed
          const maxSimilarity = priorArt.length > 0 
            ? Math.max(...priorArt.map(p => p.similarity)) 
            : 0;

          if (maxSimilarity > (1 - NOVELTY_THRESHOLD) && iteration < MAX_REFINEMENT_ITERATIONS - 1) {
            // Too similar - attempt refinement
            const similarArt = priorArt.filter(p => p.similarity > 0.5);
            try {
              currentIdea = await refineNovelIdea(currentIdea, similarArt, iteration + 1);
              totalRefinements++;
              iteration++;
            } catch {
              // Refinement failed, return current with prior art
              return {
                ...currentIdea,
                priorArt,
                noveltyScore,
              };
            }
          } else {
            // Novel enough or max iterations reached
            return {
              ...currentIdea,
              priorArt,
              noveltyScore,
            };
          }
        }

        // Return after max iterations
        const finalPriorArt = await searchPriorArt(currentIdea.thesis, currentIdea.description);
        return {
          ...currentIdea,
          priorArt: finalPriorArt,
          noveltyScore: calculateNoveltyScore(finalPriorArt),
        };
      })
    );

    // Generate structured approach for top idea (use calibrated confidence)
    let structuredApproach;
    if (ideasWithNovelty.length > 0) {
      const topIdea = ideasWithNovelty.reduce((prev, curr) =>
        curr.confidence > prev.confidence ? curr : prev
      );
      structuredApproach = await generateStructuredApproach(topIdea);
    }

    return NextResponse.json({
      success: true,
      synthesis: {
        sources: unifiedSources.map((s) => ({
          name: s.name,
          type: s.type,
          mainThesis: s.concepts.mainThesis,
          keyArguments: s.concepts.keyArguments,
          entities: s.concepts.entities,
        })),
        contradictions,
        novelIdeas: ideasWithNovelty,
        structuredApproach,
        metadata: {
          pdfCount: files.length,
          companyCount: companies.length,
          totalSources,
          // Tier 1 metadata
          refinementIterations: totalRefinements,
          calibrationApplied: true,
        },
      },
    });
  } catch (error) {
    console.error("Hybrid synthesis error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Hybrid synthesis failed",
      },
      { status: 500 }
    );
  }
}
