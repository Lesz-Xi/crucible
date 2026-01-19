// PDF Synthesis API Route
import { NextRequest, NextResponse } from "next/server";
import { processMultiplePDFs } from "@/lib/extractors/pdf-extractor";
import { runSynthesisPipeline } from "@/lib/ai/synthesis-engine";
import {
  searchPriorArt,
  calculateNoveltyScore,
  generateNoveltyAssessment,
} from "@/lib/ai/novelty-evaluator";

export const maxDuration = 60; // Max execution time in seconds

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 files allowed" },
        { status: 400 }
      );
    }

    // Validate file types
    for (const file of files) {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only PDFs are allowed.` },
          { status: 400 }
        );
      }
    }

    // Step 1: Process PDFs
    const pdfBuffers = await Promise.all(
      files.map(async (file) => ({
        buffer: await file.arrayBuffer(),
        name: file.name,
      }))
    );

    const pdfResults = await processMultiplePDFs(pdfBuffers);

    // Step 2: Run synthesis pipeline
    const synthesisResult = await runSynthesisPipeline(pdfResults);

    // Step 3: Evaluate novelty for each idea
    const ideasWithNovelty = await Promise.all(
      synthesisResult.novelIdeas.map(async (idea) => {
        const priorArt = await searchPriorArt(idea.thesis, idea.description);
        const noveltyScore = calculateNoveltyScore(priorArt);
        const noveltyAssessment = generateNoveltyAssessment(priorArt, noveltyScore);

        return {
          ...idea,
          priorArt,
          noveltyScore,
          noveltyAssessment,
        };
      })
    );

    return NextResponse.json({
      success: true,
      synthesis: {
        sources: synthesisResult.sources.map((s) => ({
          name: s.name,
          mainThesis: s.concepts.mainThesis,
          keyArguments: s.concepts.keyArguments,
          entities: s.concepts.entities,
        })),
        contradictions: synthesisResult.contradictions,
        novelIdeas: ideasWithNovelty,
        structuredApproach: synthesisResult.structuredApproach,
      },
    });
  } catch (error) {
    console.error("Synthesis error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Synthesis failed",
      },
      { status: 500 }
    );
  }
}
