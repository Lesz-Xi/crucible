"use client";

// PDF Synthesis Page - Main Feature Interface
import { useState } from "react";
import { PDFUpload } from "@/components/pdf-upload";
import {
  NovelIdeaCard,
  StructuredApproachDisplay,
  PriorArtDisplay,
} from "@/components/novel-idea-display";
import { NovelIdea, StructuredApproach, PriorArt, ExtractedConcepts } from "@/types";
import { Loader2, Sparkles, ArrowRight, BookOpen } from "lucide-react";

interface SynthesisSource {
  name: string;
  mainThesis: string;
  keyArguments: string[];
  entities: { name: string; type: string; description: string }[];
}

interface EnhancedNovelIdea extends NovelIdea {
  priorArt: PriorArt[];
  noveltyScore: number;
}

interface SynthesisResponse {
  success: boolean;
  synthesis: {
    sources: SynthesisSource[];
    contradictions: Array<{
      concept: string;
      sourceA: string;
      claimA: string;
      sourceB: string;
      claimB: string;
    }>;
    novelIdeas: EnhancedNovelIdea[];
    structuredApproach?: StructuredApproach;
  };
  error?: string;
}

type Stage = "upload" | "processing" | "results";

export default function PDFSynthesisPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<SynthesisResponse["synthesis"] | null>(null);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
  };

  const handleSynthesize = async () => {
    if (files.length < 2) {
      setError("Please upload at least 2 PDFs for synthesis");
      return;
    }

    setStage("processing");
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/synthesize", {
        method: "POST",
        body: formData,
      });

      const data: SynthesisResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Synthesis failed");
      }

      setResult(data.synthesis);
      setStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStage("upload");
    }
  };

  const selectedIdea = result?.novelIdeas[selectedIdeaIndex];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-100">
                  Sovereign Synthesis Engine
                </h1>
                <p className="text-xs text-gray-500">PDF Synthesis</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Stage */}
        {stage === "upload" && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">
                Synthesize Ideas from Multiple Sources
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto">
                Upload 2-5 PDFs and our Hong-inspired synthesis engine will
                identify contradictions, bridge concepts, and generate genuinely
                novel ideas.
              </p>
            </div>

            <PDFUpload
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              isProcessing={false}
            />

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSynthesize}
              disabled={files.length < 2}
              className={`
                w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300
                ${files.length >= 2
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              <span>Synthesize Ideas</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Processing Stage */}
        {stage === "processing" && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-gray-800 rounded-full" />
              <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-100">
                Synthesizing Novel Ideas...
              </h3>
              <p className="text-gray-400">
                Extracting concepts, detecting contradictions, generating insights
              </p>
            </div>
          </div>
        )}

        {/* Results Stage */}
        {stage === "results" && result && (
          <div className="space-y-8">
            {/* Sources Summary */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-indigo-400" />
                Sources Analyzed
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.sources.map((source, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gray-800/50 rounded-xl border border-gray-700"
                  >
                    <h3 className="font-medium text-gray-200 mb-2 truncate">
                      {source.name}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {source.mainThesis}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Contradictions */}
            {result.contradictions.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-amber-400">
                  Tensions Detected
                </h2>
                <div className="space-y-3">
                  {result.contradictions.map((c, i) => (
                    <div
                      key={i}
                      className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
                    >
                      <p className="font-medium text-amber-300 mb-2">
                        {c.concept}
                      </p>
                      <p className="text-sm text-gray-400">
                        <strong>{c.sourceA}:</strong> &quot;{c.claimA}&quot;
                      </p>
                      <p className="text-sm text-gray-400">
                        <strong>{c.sourceB}:</strong> &quot;{c.claimB}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Novel Ideas */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-indigo-400" />
                Novel Ideas Generated
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {result.novelIdeas.map((idea, i) => (
                  <NovelIdeaCard
                    key={idea.id}
                    idea={idea}
                    index={i}
                    isSelected={i === selectedIdeaIndex}
                    onSelect={() => setSelectedIdeaIndex(i)}
                  />
                ))}
              </div>
            </section>

            {/* Selected Idea Details */}
            {selectedIdea && (
              <>
                {/* Prior Art */}
                <PriorArtDisplay
                  priorArt={selectedIdea.priorArt}
                  noveltyScore={selectedIdea.noveltyScore}
                />

                {/* Structured Approach */}
                {result.structuredApproach && (
                  <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Implementation Approach</h2>
                    <StructuredApproachDisplay
                      approach={result.structuredApproach}
                    />
                  </section>
                )}
              </>
            )}

            {/* Start Over */}
            <div className="flex justify-center pt-8">
              <button
                onClick={() => {
                  setStage("upload");
                  setFiles([]);
                  setResult(null);
                }}
                className="px-6 py-3 border border-gray-700 rounded-xl text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
              >
                Start New Synthesis
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
