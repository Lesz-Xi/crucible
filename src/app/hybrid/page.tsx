"use client";

// Hybrid Synthesis Page - Combine PDFs + Companies
import { useState } from "react";
import { PDFUpload } from "@/components/pdf-upload";
import { CompanyInput } from "@/components/company-input";
import {
  NovelIdeaCard,
  StructuredApproachDisplay,
  PriorArtDisplay,
} from "@/components/novel-idea-display";
import { NovelIdea, StructuredApproach, PriorArt } from "@/types";
import {
  Loader2,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileText,
  Building2,
  Zap,
} from "lucide-react";

interface SynthesisSource {
  name: string;
  type: "pdf" | "company";
  mainThesis: string;
  keyArguments: string[];
  entities: { name: string; type: string; description: string }[];
}

interface EnhancedNovelIdea extends NovelIdea {
  priorArt: PriorArt[];
  noveltyScore: number;
}

interface HybridSynthesisResponse {
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
    metadata: {
      pdfCount: number;
      companyCount: number;
      totalSources: number;
    };
  };
  error?: string;
}

type Stage = "input" | "processing" | "results";

export default function HybridSynthesisPage() {
  const [stage, setStage] = useState<Stage>("input");
  const [files, setFiles] = useState<File[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [result, setResult] = useState<HybridSynthesisResponse["synthesis"] | null>(null);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const totalSources = files.length + companies.length;
  const canSynthesize = totalSources >= 2 && totalSources <= 12;

  const handleSynthesize = async () => {
    if (!canSynthesize) {
      setError("Please add 2-12 sources (PDFs and/or companies)");
      return;
    }

    setStage("processing");
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("companies", JSON.stringify(companies));

      const response = await fetch("/api/hybrid-synthesize", {
        method: "POST",
        body: formData,
      });

      const data: HybridSynthesisResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Synthesis failed");
      }

      setResult(data.synthesis);
      setStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStage("input");
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
              <div className="p-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-100">
                  Hybrid Synthesis
                </h1>
                <p className="text-xs text-gray-500">PDFs + Companies → Novel Ideas</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Stage */}
        {stage === "input" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">
                Bridge Theory & Practice
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto">
                Combine academic knowledge from PDFs with real-world company strategies
                to generate novel startup ideas and innovative approaches.
              </p>
            </div>

            {/* Source Counters */}
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-indigo-300">
                  {files.length} PDFs
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">
                  {companies.length} Companies
                </span>
              </div>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                  canSynthesize
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-gray-800 border border-gray-700"
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    canSynthesize ? "text-emerald-300" : "text-gray-500"
                  }`}
                >
                  {totalSources}/12 Total
                </span>
              </div>
            </div>

            {/* PDF Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-semibold">Research & Documents</h3>
              </div>
              <PDFUpload
                onFilesSelected={setFiles}
                maxFiles={6}
                isProcessing={false}
              />
            </div>

            {/* Company Input Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold">Companies to Analyze</h3>
              </div>
              <CompanyInput
                companies={companies}
                onCompaniesChange={setCompanies}
                maxCompanies={6}
                isProcessing={false}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSynthesize}
              disabled={!canSynthesize}
              className={`
                w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300
                ${canSynthesize
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              <Sparkles className="w-5 h-5" />
              <span>Synthesize Hybrid Ideas</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-center text-sm text-gray-500">
              Minimum 2 sources required • Maximum 12 sources
            </p>
          </div>
        )}

        {/* Processing Stage */}
        {stage === "processing" && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-gray-800 rounded-full" />
              <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-indigo-500 border-r-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-100">
                Synthesizing from {totalSources} Sources...
              </h3>
              <p className="text-gray-400">
                Bridging {files.length} PDFs + {companies.length} companies
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
                Sources Analyzed ({result.metadata.totalSources})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.sources.map((source, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${
                      source.type === "pdf"
                        ? "bg-indigo-500/10 border-indigo-500/30"
                        : "bg-purple-500/10 border-purple-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {source.type === "pdf" ? (
                        <FileText className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Building2 className="w-4 h-4 text-purple-400" />
                      )}
                      <span className="text-xs uppercase text-gray-500">
                        {source.type}
                      </span>
                    </div>
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
                <Sparkles className="w-6 h-6 text-pink-400" />
                Novel Hybrid Ideas
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
                <PriorArtDisplay
                  priorArt={selectedIdea.priorArt}
                  noveltyScore={selectedIdea.noveltyScore}
                />

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
                  setStage("input");
                  setFiles([]);
                  setCompanies([]);
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
