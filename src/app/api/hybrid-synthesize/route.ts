
import { NextRequest, NextResponse } from "next/server";
import { processMultiplePDFs } from "@/lib/extractors/pdf-extractor";
import { processMultipleCompanies } from "@/lib/extractors/company-extractor";
import {
  runEnhancedSynthesisPipeline,
  SynthesisResult,
  type EnhancedSynthesisConfig,
} from "@/lib/ai/synthesis-engine";
import { searchPriorArt } from "@/lib/ai/novelty-evaluator";
import { PersistenceService } from "@/lib/db/persistence-service";
import { PDFExtractionResult } from "@/lib/extractors/pdf-extractor";
import { StreamingEventEmitter } from "@/lib/streaming-event-emitter";
import { validateProtocol } from "@/lib/services/protocol-validator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Synthesis limits configuration
const MAX_PDF_FILES = 6;
const MAX_COMPANIES = 5;
const MAX_IDEAS_FOR_COMPANY_ANALYSIS = 2;

export const maxDuration = 300; // Extended time to 5 minutes

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get PDFs
    const files = formData.getAll("files") as File[];

    // Get company names (JSON array)
    const companiesJson = formData.get("companies") as string | null;
    const companies: string[] = companiesJson ? JSON.parse(companiesJson) : [];
    const researchFocus = formData.get("researchFocus") as string || "";
    // Default to Parallel Enabled (3 concurrent) for speed unless explicitly disabled
    const enableParallel = formData.get("enableParallelRefinement") !== "false";
    const concurrency = parseInt(formData.get("parallelConcurrency") as string) || 3;

    const totalSources = files.length + companies.length;

    if (totalSources < 2) {
      return NextResponse.json(
        { error: "Please provide at least 2 sources (PDFs and/or companies)" },
        { status: 400 }
      );
    }

    let userId = request.headers.get("x-user-id") || undefined;
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        userId = user.id;
      }
    } catch {
      // Keep header fallback for environments where auth is unavailable.
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emitter = new StreamingEventEmitter(controller);

        try {
          emitter.emit({ event: 'ingestion_start', files: files.length });

          // Step 1: Process PDFs to text
          const pdfResults: PDFExtractionResult[] = [];

          for (const file of files) {
            const buffer = await file.arrayBuffer();
            // We'll process one by one to stream updates if needed, 
            // but for now keeping batch process for efficiency unless we split it
            // Actually, let's process them to emit events
            const { successful } = await processMultiplePDFs([{ buffer, name: file.name }]);
            if (successful.length > 0) {
              pdfResults.push(successful[0]);
              emitter.emit({ event: 'pdf_processed', filename: file.name });
            } else {
              emitter.emit({ event: 'pdf_error', filename: file.name, error: "Extraction failed" });
            }
          }

          // Step 2: Process Companies
          const companyResults: PDFExtractionResult[] = [];
          if (companies.length > 0) {
            const { successful } = await processMultipleCompanies(companies);
            for (const company of successful) {
              companyResults.push({
                fileName: company.companyName,
                fullText: JSON.stringify(company.extractedConcepts),
                totalPages: 0,
                chunks: [],
                sourceType: 'company'
              } as PDFExtractionResult);
              emitter.emit({ event: 'pdf_processed', filename: `Company: ${company.companyName}` });
            }
          }

          // Step 3: Run Pipeline with Emitter
          const combinedSources = [...pdfResults, ...companyResults];
          const persistence = new PersistenceService();

          const config = {
            maxRefinementIterations: 2,
            priorArtSearchFn: searchPriorArt,
            priorRejectionCheckFn: (t: string, m: string, d?: string) => persistence.checkRejection(t, m, d),
            validateProtocolFn: validateProtocol,
            eventEmitter: emitter,
            researchFocus: researchFocus || undefined,
            enableParallelRefinement: enableParallel,
            parallelConcurrency: concurrency,
            userId: userId, // Add explicitly to config
            noveltyProofEnabled: process.env.HYBRID_NOVELTY_PROOF_V1 !== "false",
          } as unknown as EnhancedSynthesisConfig;

          const result: SynthesisResult = await runEnhancedSynthesisPipeline(combinedSources, config);

          // Step 4: Persist
          const saveStatus = await persistence.saveSynthesis(result, userId);

          const finalResult = {
            ...result,
            runId: saveStatus?.runId
          };

          emitter.emit({
            event: 'complete',
            synthesis: finalResult
          });

        } catch (error) {
          console.error("Streaming synthesis error:", error);
          emitter.emit({ event: 'error', message: error instanceof Error ? error.message : "Synthesis failed" });
        } finally {
          emitter.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Route handler error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
