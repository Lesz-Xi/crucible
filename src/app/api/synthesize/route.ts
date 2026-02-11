// PDF Synthesis API Route
import { NextRequest, NextResponse } from "next/server";
import { processMultiplePDFs } from "@/lib/extractors/pdf-extractor";
import { runEnhancedSynthesisPipeline } from "@/lib/ai/synthesis-engine";
import {
  searchPriorArt,
  calculateNoveltyScore,
  generateNoveltyAssessment,
} from "@/lib/ai/novelty-evaluator";
import { StreamingEventEmitter } from "@/lib/streaming-event-emitter";
import { NovelIdea } from "@/types";

export const maxDuration = 60; // Max execution time in seconds

export async function POST(request: NextRequest) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const emitter = new StreamingEventEmitter(writer);

  // Extract User ID from headers (set by middleware or client)
  const userId = request.headers.get("x-user-id") || undefined;

  // Start background processing
  (async () => {
    try {
      const formData = await request.formData();
      const files = formData.getAll("files") as File[];

      if (!files || files.length === 0) {
        emitter.emit({ event: 'error', message: "No files provided" });
        emitter.close();
        return;
      }

      if (files.length > 5) {
        emitter.emit({ event: 'error', message: "Maximum 5 files allowed" });
        emitter.close();
        return;
      }

      // Step 1: Process PDFs
      emitter.emit({ event: 'ingestion_start', files: files.length });

      // Validate file types
      for (const file of files) {
        if (file.type !== "application/pdf") {
          emitter.emit({ event: 'pdf_error', filename: file.name, error: "Invalid file type. Only PDFs are allowed." });
        }
      }

      const pdfBuffers = await Promise.all(
        files.map(async (file) => ({
          buffer: await file.arrayBuffer(),
          name: file.name,
        }))
      );

      const pdfResults = await processMultiplePDFs(pdfBuffers);

      // Emit PDF processing status
      pdfResults.successful.forEach(pdf => {
        emitter.emit({ event: 'pdf_processed', filename: pdf.fileName });
      });

      pdfResults.failed.forEach(pdf => {
        emitter.emit({ event: 'pdf_error', filename: pdf.name, error: pdf.error || "Unknown error" });
      });

      if (pdfResults.successful.length === 0) {
        emitter.emit({ event: 'error', message: "No valid PDFs could be processed." });
        emitter.close();
        return;
      }

      // Step 2: Run synthesis pipeline (with streaming)
      const synthesisResult = await runEnhancedSynthesisPipeline(
        pdfResults.successful,
        {
          priorArtSearchFn: searchPriorArt,
          maxRefinementIterations: 2,
          eventEmitter: emitter,
          userId: userId // Add explicitly to config
        } as any
      );

      // Step 3: Evaluate novelty for each idea
      emitter.emit({ event: 'thinking_step', content: "Evaluating novelty against prior art..." });

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

      // Final Response Construction
      const finalSynthesis = {
        sources: synthesisResult.sources.map((s) => ({
          name: s.name,
          mainThesis: s.concepts.mainThesis,
          keyArguments: s.concepts.keyArguments,
          entities: s.concepts.entities,
          concepts: s.concepts // Pass through full concepts object
        })),
        contradictions: synthesisResult.contradictions,
        novelIdeas: ideasWithNovelty,
        structuredApproach: synthesisResult.structuredApproach
      };

      emitter.emit({ event: 'complete', synthesis: finalSynthesis });

    } catch (error) {
      console.error("Synthesis error:", error);
      emitter.emit({
        event: 'error',
        message: error instanceof Error ? error.message : "Synthesis failed"
      });
    } finally {
      emitter.close();
    }
  })();

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
