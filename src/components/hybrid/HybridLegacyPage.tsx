"use client";

// Hybrid Synthesis Page - Combine PDFs + Companies
import { useState, useEffect, useRef, useMemo } from "react";
import { PDFUpload } from "@/components/pdf-upload";
import { CompanyInput } from "@/components/company-input";
import { TacticalButton } from "@/components/ui/tactical-button";
import {
  NovelIdeaCard,
  StructuredApproachDisplay,
  PriorArtDisplay,
} from "@/components/novel-idea-display";
import MetacognitionDashboard from "@/components/MetacognitionDashboard";
import { SynthesisAuditView } from "@/components/synthesis-audit-view";
import { 
  NovelIdea, 
  StructuredApproach, 
  PriorArt,
  MasaAudit,
  Contradiction,
  ExtractedConcepts,
  ConsciousnessState
} from "@/types";
import { SynthesisResult } from "@/lib/ai/synthesis-engine";
import {
  Loader2,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileText,
  Building2,
  Zap,
  History,
  Clock,
  ChevronRight,
  Plus,
  AlertCircle,
  Download,
  Crown,
  Shield
} from "lucide-react";
import { downloadMarkdown, SynthesisExportData } from "@/lib/services/markdown-export-service";
import { StreamEvent } from "@/lib/streaming-event-emitter";
import { AuthButton } from "@/components/auth/AuthButton";

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
    consciousnessState?: ConsciousnessState; // Phase 23: Layer 0 State
  };
  error?: string;
}

type Stage = "input" | "processing" | "stabilizing" | "results";

export default function HybridSynthesisPage() {
  const [stage, setStage] = useState<Stage>("input");
  const [files, setFiles] = useState<File[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [result, setResult] = useState<HybridSynthesisResponse["synthesis"] | null>(null);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historicalRuns, setHistoricalRuns] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [researchFocus, setResearchFocus] = useState<string>("");
  
  // Streaming State
  const [latestEvent, setLatestEvent] = useState<StreamEvent | null>(null);
  
  // Thermodynamic state
  const [spectralGapData, setSpectralGapData] = useState<{
    lambda_min: number;
    lambda_max: number;
    spectralGap: number;
    conditionNumber: number;
    threshold: number;
    lipschitzConstant: number;
  } | null>(null);
  const [expansionTriggered, setExpansionTriggered] = useState(false);

  const totalSources = files.length + companies.length;
  const canSynthesize = totalSources >= 2 && totalSources <= 12;
  const pdfSourceUrls = useMemo(() => {
    const entries = files.map((file) => [file.name, URL.createObjectURL(file)] as const);
    return Object.fromEntries(entries);
  }, [files]);

  useEffect(() => {
    return () => {
      Object.values(pdfSourceUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pdfSourceUrls]);

  // Real-time Consciousness State (SSE)
  const [realtimeState, setRealtimeState] = useState<ConsciousnessState | null>(null);
  
  // Phase 2: Real-Time Monitoring SSE States
  const [traceManifest, setTraceManifest] = useState<{
    sessionUUID: string;
    inputHashes: Array<{ name: string; hash: string }>;
    seedValue: number | null;
    timestamp: string;
  } | null>(null);
  
  const [epistemicData, setEpistemicData] = useState<{
    consciousnessState: {
      energy: number;
      entropy: number;
      freeEnergy: number;
      perceptionIntensity: number;
      workingMemoryAccess: number;
      awarenessLevel: number;
    };
    iteration: number;
    maxIterations: number;
    plateauReached: boolean;
  } | null>(null);
  
  const [spectralHealth, setSpectralHealth] = useState<{
    lambda_min: number;
    lambda_max: number;
    spectralGap: number;
    healthStatus: 'optimal' | 'good' | 'warning' | 'critical';
    timestamp: number;
  } | null>(null);
  
  const [refinementCycle, setRefinementCycle] = useState<{
    iteration: number;
    maxIterations: number;
    status: 'running' | 'complete';
    approved?: boolean;
    validityScore?: number;
  } | null>(null);

  // Handle cinematic transition from stabilization to results
  useEffect(() => {
    if (stage === "stabilizing") {
      const timer = setTimeout(() => {
        setStage("results");
      }, 3000); // 3 second cinematic stabilizing period
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const handleSynthesize = async () => {
    if (!canSynthesize) {
      setError("Please add 2-12 sources (PDFs and/or companies)");
      return;
    }

    setStage("processing");
    setError(null);
    setLatestEvent(null);
    setRealtimeState(null); // Reset real-time state
    setIsSynthesizing(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("companies", JSON.stringify(companies));
      formData.append("researchFocus", researchFocus);

      const response = await fetch("/api/hybrid-synthesize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
         throw new Error(`Synthesis failed: ${response.statusText}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Split by double newline (SSE standard)
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || ""; // Keep the last incomplete part in buffer
        
        for (const part of parts) {
           if (part.startsWith("data: ")) {
              try {
                 const jsonStr = part.substring(6);
                 const event: StreamEvent = JSON.parse(jsonStr);
                 setLatestEvent(event);
                 
                 // Artificial delay to ensure React renders each event state
                 // preventing batching from swallowing consecutive logs
                 await new Promise(resolve => setTimeout(resolve, 50));

                  // Phase 2: Handle Real-Time Monitoring Events
                  if (event.event === 'trace_manifest') {
                    setTraceManifest({
                      sessionUUID: event.sessionUUID,
                      inputHashes: event.inputHashes,
                      seedValue: event.seedValue,
                      timestamp: event.timestamp
                    });
                  } else if (event.event === 'epistemic_update') {
                    setEpistemicData({
                      consciousnessState: event.consciousnessState,
                      iteration: event.iteration,
                      maxIterations: event.maxIterations,
                      plateauReached: event.plateauReached
                    });
                  } else if (event.event === 'spectral_health_tick') {
                    setSpectralHealth({
                      lambda_min: event.lambda_min,
                      lambda_max: event.lambda_max,
                      spectralGap: event.spectralGap,
                      healthStatus: event.healthStatus,
                      timestamp: event.timestamp
                    });
                  } else if (event.event === 'refinement_cycle_start') {
                    setRefinementCycle({
                      iteration: event.iteration,
                      maxIterations: event.maxIterations,
                      status: 'running'
                    });
                  } else if (event.event === 'refinement_cycle_complete') {
                    setRefinementCycle({
                      iteration: event.iteration,
                      maxIterations: event.maxIterations,
                      status: 'complete',
                      approved: event.approved,
                      validityScore: event.validityScore
                    });
                  }

                 if (event.event === 'complete') {
                    // Safe cast assuming the backend returns the correct shape
                    setResult(event.synthesis as any);
                    setStage("stabilizing");
                    fetchHistory();
                 } else if (event.event === 'error') {
                    throw new Error(event.message);
                 }
              } catch (e) {
                 console.warn("Failed to parse SSE event:", e);
              }
           }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStage("input");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
    window.addEventListener("historyImported", fetchHistory);
    return () => {
      window.removeEventListener("historyImported", fetchHistory);
    };
  }, []);

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch("/api/synthesis-history");
      if (res.status === 401) {
        setHistoricalRuns([]);
        return;
      }
      const data = await res.json();
      if (data.history) setHistoricalRuns(data.history);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadHistoricalRun = async (runId: string) => {
    setHistoryOpen(false);
    setStage("processing");
    try {
      const res = await fetch(`/api/synthesis-history?id=${runId}`);
      const data = await res.json();
      if (data.success && data.run) {
        setResult(data.run);
        setStage("results");
        setSelectedIdeaIndex(0);
      }
    } catch (err) {
      console.error("Failed to load run details:", err);
      setStage("input");
    }
  };

  const resetToNew = () => {
    setResult(null);
    setStage("input");
    setSelectedIdeaIndex(0);
    setFiles([]);
    setCompanies([]);
    setLatestEvent(null);
    // Phase 2: Clear monitoring states
    setTraceManifest(null);
    setEpistemicData(null);
    setSpectralHealth(null);
    setRefinementCycle(null);
  };

  const selectedIdea = result?.novelIdeas[selectedIdeaIndex];

  return (
      <div className="flex flex-col min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-wabi-clay/20 relative overflow-x-hidden">

      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--paper-050)]/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="w-full px-6 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 relative rounded-lg bg-black p-1.5">
<img src="/wu-wei-mark.png" alt="Wu-Weism logo" className="w-full h-full object-contain invert" />
                </div>
                <div>
                  <h1 className="text-xl font-mono font-bold text-[var(--text-primary)] tracking-wider">
                    Wu-Weism
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <AuthButton compact className="hidden sm:block" />
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[var(--paper-050)]/80 hover:bg-[var(--paper-050)] text-[var(--text-secondary)] text-sm rounded-lg border border-[var(--border-subtle)] hover:border-[var(--oxide-500)]/40 transition-all"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>History</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-wabi-clay/10 text-wabi-clay text-[10px] font-mono font-bold rounded-lg border border-wabi-clay/20 uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  <span>Phase 3: Orthogonality Active</span>
                </div>
                {stage === "results" && (
                  <button
                    onClick={resetToNew}
                    className="flex items-center gap-2 px-3 py-1.5 bg-wabi-clay/10 hover:bg-wabi-clay/15 text-wabi-clay text-sm rounded-lg border border-wabi-clay/25 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 transition-all duration-700 ${
        stage === "processing" ? "w-full max-w-[98vw]" : "max-w-[1600px]"
      }`}>
        {/* Input Stage */}
        {stage === "input" && (
          <div className="w-full max-w-[1536px] mx-auto space-y-8 px-8">
            <div className="text-center space-y-4">
              <h2 className="wabi-heading-2">
                Dialectical Synthesis Engine
              </h2>
              <p className="text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
                Upload research papers and analyze companies. The Sovereign Mastermind will detect 
                contradictions between sources and generate novel ideas that bridge opposing claims.
              </p>
            </div>

            {/* Source Counters */}
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-3 px-4 py-2 bg-wabi-clay/10 border border-wabi-clay/30 rounded-xl">
                <FileText className="w-4 h-4 text-wabi-clay" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {files.length} PDFs
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-wabi-charcoal/10 border border-wabi-charcoal/30 rounded-xl">
                <Building2 className="w-4 h-4 text-wabi-charcoal" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {companies.length} Companies
                </span>
              </div>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                  canSynthesize
                    ? "bg-wabi-moss/10 border-wabi-moss/30"
                    : "bg-[var(--paper-050)]/80 border-[var(--border-subtle)]"
                }`}
              >
                <span
                  className={`text-sm font-medium font-mono ${
                    canSynthesize ? "text-wabi-moss" : "text-[var(--text-tertiary)]"
                  }`}
                >
                  {totalSources}/12 Total
                </span>
              </div>
            </div>

            {/* Optional Research Focus */}
            <div className="max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Research focus (optional): e.g., 'drug delivery mechanisms' or 'diagnostic tools'"
                value={researchFocus}
                onChange={(e) => setResearchFocus(e.target.value)}
                className="w-full px-4 py-3 wabi-glass-panel border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-wabi-clay/60 focus:outline-none focus:ring-1 focus:ring-wabi-clay/20 transition-all"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1.5 text-center">
                Leave empty for autonomous exploration across all contradictions
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* PDF Upload Section */}
              <div className="space-y-3 h-full">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-wabi-clay" />
                  <h3 className="text-lg font-mono font-bold text-[var(--text-primary)]">Research & Documents</h3>
                </div>
                <PDFUpload
                  onFilesSelected={setFiles}
                  maxFiles={6}
                  isProcessing={false}
                />
              </div>

              {/* Company Input Section */}
              <div className="space-y-3 h-full">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-wabi-charcoal" />
                  <h3 className="text-lg font-mono font-bold text-[var(--text-primary)]">Companies to Analyze</h3>
                </div>
                <CompanyInput
                  companies={companies}
                  onCompaniesChange={setCompanies}
                  maxCompanies={5}
                  isProcessing={false}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Synthesize Button - Tactical Style */}
            <div className="pt-8">
              <TacticalButton
                onClick={handleSynthesize}
                disabled={isSynthesizing || (files.length === 0 && companies.length === 0)}
                isLoading={isSynthesizing}
              >
                Start Building
              </TacticalButton>
            </div>
          </div>
        )}

        {/* Processing Stage (Epistemic Audit) */}
        {stage === "processing" && (
          <div className="w-full h-full mx-auto space-y-8 px-6">
            <SynthesisAuditView 
               files={files} 
               companies={companies} 
               latestEvent={latestEvent} 
               userPrompt={researchFocus}
               traceManifest={traceManifest}
               epistemicData={epistemicData}
               spectralHealth={spectralHealth}
               refinementCycle={refinementCycle}
            />
          </div>
        )}

        {/* Stabilizing Stage (Cinematic Transition) */}
        {stage === "stabilizing" && (
          <div className="flex flex-col items-center justify-center h-[600px] space-y-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--oxide-500)] blur-2xl opacity-20 animate-pulse" />
              <div className="p-6 bg-[var(--obsidian-900)] border border-[var(--ash-200)]/20 rounded-2xl relative z-10 shadow-lg backdrop-blur-sm">
                <Loader2 className="w-12 h-12 text-[var(--oxide-500)] animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Theory Stabilizing</h3>
              <p className="text-neutral-400 max-w-md">
                The Architect persona is finalizing the dialectical verdict and hardening the explanatory depth.
              </p>
            </div>
          </div>
        )}

        {/* Results Stage */}
        {stage === "results" && result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Results Header with Export Button */}
            <div className="flex items-center justify-between">
              <h2 className="wabi-heading-2">Synthesis Results</h2>
              <button
                onClick={() => {
                  const exportData: SynthesisExportData = {
                    sources: (result.sources ?? []).map(s => ({
                      name: s.name,
                      type: s.type,
                      concepts: {
                        mainThesis: s.mainThesis,
                        keyArguments: s.keyArguments,
                        entities: (s.entities ?? []).map(e => ({ 
                          ...e, 
                          sourceId: s.name,
                          type: e.type as "person" | "concept" | "organization" | "technology" | "method"
                        }))
                      }
                    })),
                    contradictions: result.contradictions ?? [],
                    novelIdeas: result.novelIdeas ?? [],
                    structuredApproach: result.structuredApproach,
                    priorArt: result.novelIdeas?.flatMap(i => (i as any).priorArt || []) ?? [],
                    metadata: result.metadata,
                    synthesisGoal: "Hybrid Synthesis"
                  };
                  downloadMarkdown(exportData, { title: "Hybrid Synthesis Report" });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--paper-050)]/80 hover:bg-[var(--paper-050)] text-[var(--text-primary)] font-bold font-mono uppercase tracking-wider text-sm rounded-xl shadow-sm transition-all duration-300 border border-[var(--border-subtle)] hover:border-[var(--oxide-500)]/45"
              >
                <Download className="w-4 h-4" />
                Download Markdown
              </button>
            </div>

            {/* Sources Summary - Separated by Type */}
            <section className="space-y-8">
              <h2 className="wabi-heading-2 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-wabi-clay" />
                Sources Analyzed ({result.metadata?.totalSources ?? result.sources?.length ?? 0})
              </h2>

              {/* PDF Sources */}
              {(() => {
                const pdfSources = (result.sources ?? []).filter(s => s.type === 'pdf' || (!s.type && s.name.toLowerCase().endsWith('.pdf')));
                if (pdfSources.length === 0) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[var(--oxide-500)]/10 border border-[var(--oxide-500)]/20">
                        <FileText className="w-5 h-5 text-[var(--oxide-500)]" />
                      </div>
                      <h3 className="text-lg font-bold text-neutral-300 font-mono uppercase tracking-wider">
                        Research & Publications
                        <span className="ml-2 text-sm text-neutral-500 font-normal">({pdfSources.length})</span>
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                      {pdfSources.map((source, i) => (
                        <div
                          key={`pdf-${i}`}
                          className="group p-4 rounded-xl border wabi-glass-panel wabi-texture wabi-elevation-light border-stone-200 hover:border-wabi-clay/40 transition-all duration-300"
                        >
                          <div className="flex items-start gap-2.5 mb-2.5">
                            <div className="p-1.5 rounded-lg bg-wabi-clay/10 text-wabi-clay group-hover:bg-wabi-clay/20 group-hover:shadow-[0_0_15px_-3px_rgba(158,126,107,0.3)] transition-all">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[var(--text-primary)] truncate text-xs font-mono tracking-tight group-hover:text-wabi-clay transition-colors">
                                {source.name}
                              </h4>
                              <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">PDF Document</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-[var(--text-secondary)] line-clamp-3 leading-relaxed border-l-2 border-wabi-clay/20 pl-2.5">
                            {source.mainThesis}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Company Sources */}
              {(() => {
                const companySources = (result.sources ?? []).filter(s => s.type === 'company' || (!s.type && !s.name.toLowerCase().endsWith('.pdf')));
                if (companySources.length === 0) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
                        <Building2 className="w-5 h-5 text-sky-400" />
                      </div>
                      <h3 className="text-lg font-bold text-neutral-300 font-mono uppercase tracking-wider">
                        Companies Analyzed
                        <span className="ml-2 text-sm text-neutral-500 font-normal">({companySources.length})</span>
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                      {companySources.map((source, i) => (
                        <div
                          key={`company-${i}`}
                          className="group p-4 rounded-xl border wabi-glass-panel wabi-texture wabi-elevation-light border-stone-200 hover:border-wabi-charcoal/40 transition-all duration-300"
                        >
                          <div className="flex items-start gap-2.5 mb-2.5">
                            <div className="p-1.5 rounded-lg bg-wabi-charcoal/10 text-wabi-charcoal group-hover:bg-wabi-charcoal/20 group-hover:shadow-[0_0_15px_-3px_rgba(139,94,60,0.3)] transition-all">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[var(--text-primary)] truncate text-xs font-mono tracking-tight group-hover:text-wabi-charcoal transition-colors">
                                {source.name}
                              </h4>
                              <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">Company Profile</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-[var(--text-secondary)] line-clamp-3 leading-relaxed border-l-2 border-wabi-charcoal/25 pl-2.5">
                            {source.mainThesis}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* Thermodynamic Spectral Gap Analysis */}
            {latestEvent?.event === 'spectral_gap_analysis' && (
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-amber-400" />
                  <h2 className="text-2xl font-bold text-amber-400">
                    Spectral Gap Analysis
                  </h2>
                </div>
                <div className="p-6 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="bg-[var(--obsidian-900)]/40 p-4 rounded-xl border border-[var(--oxide-500)]/20">
                      <div className="text-xs text-amber-500/60 uppercase tracking-wider mb-1">λ_min</div>
                      <div className="text-2xl font-bold text-amber-300">
                        {latestEvent.spectralGap.lambda_min.toFixed(3)}
                      </div>
                    </div>
                    <div className="bg-[var(--obsidian-900)]/40 p-4 rounded-xl border border-[var(--oxide-500)]/20">
                      <div className="text-xs text-amber-500/60 uppercase tracking-wider mb-1">λ_max</div>
                      <div className="text-2xl font-bold text-amber-300">
                        {latestEvent.spectralGap.lambda_max.toFixed(3)}
                      </div>
                    </div>
                    <div className="bg-[var(--obsidian-900)]/40 p-4 rounded-xl border border-[var(--oxide-500)]/20">
                      <div className="text-xs text-amber-500/60 uppercase tracking-wider mb-1">Spectral Gap</div>
                      <div className="text-2xl font-bold text-amber-300">
                        {latestEvent.spectralGap.spectralGap.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  {/* Visual Indicator */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-amber-500/60">
                      <span>Expansion Threshold</span>
                      <span>{latestEvent.spectralGap.threshold?.toFixed(3) || 'N/A'}</span>
                    </div>
                    <div className="relative h-3 bg-[var(--obsidian-900)]/50 rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (latestEvent.spectralGap.lambda_min / (latestEvent.spectralGap.threshold || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Expansion Status */}
                  {latestEvent.expansionTriggered && (
                    <div className="mt-4 p-3 bg-[var(--oxide-500)]/10 border border-[var(--oxide-500)]/30 rounded-xl flex items-center gap-3">
                      <div className="w-2 h-2 bg-[var(--oxide-500)] rounded-full animate-pulse" />
                      <span className="text-sm text-[var(--oxide-500)] font-medium">
                        🔥 Thermodynamic expansion phase activated - generating diverse ideas
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Phase 23/24: Layer 0 Consciousness Dashboard (Real-time + Final) */}
            {(realtimeState || result?.consciousnessState) && (
              <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <MetacognitionDashboard 
                  consciousnessState={realtimeState || result?.consciousnessState!}
                  className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-xl"
                />
              </section>
            )}

            {/* Conceptual Tensions - Redesigned with Wabi-Sabi palette */}
            {(result.contradictions?.length ?? 0) > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-[rgba(158,126,107,0.6)] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[rgba(158,126,107,0.8)]" />
                  </div>
                  <h2 className="wabi-heading-2 text-[var(--oxide-500)]">
                    Conceptual Tensions
                  </h2>
                </div>
                <div className="space-y-6">
                  {(result.contradictions ?? []).map((c, i) => (
                    <div
                      key={i}
                      className="group relative p-6 wabi-gradient-tension border border-[rgba(158,126,107,0.3)] rounded-2xl wabi-elevation-mid hover:border-[rgba(158,126,107,0.5)] transition-all duration-300 wabi-glow-hover"
                    >
                      {/* Tension Number Badge */}
                      <div className="absolute -top-3 -left-3 w-8 h-8 bg-[rgba(158,126,107,0.2)] backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-bold text-[var(--oxide-500)] border-2 border-[rgba(158,126,107,0.4)]">
                        {i + 1}
                      </div>

                      {/* Concept Title */}
                      <h3 className="wabi-heading-3 text-[var(--oxide-500)] mb-4 pr-8">
                        {c.concept}
                      </h3>

                      {/* Claims Grid */}
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="shrink-0 mt-1">
                            <div className="w-6 h-6 rounded-full bg-[rgba(158,126,107,0.2)] border border-[rgba(158,126,107,0.4)] flex items-center justify-center text-xs font-bold text-[rgba(158,126,107,0.8)]">
                              A
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-[rgba(158,126,107,0.7)] font-medium mb-1">{c.sourceA}</div>
                            <p className="text-sm text-[var(--mist-400)] leading-relaxed bg-[var(--obsidian-900)]/30 p-3 rounded-lg border-l-2 border-[var(--oxide-500)]/40">
                              {c.claimA}
                            </p>
                          </div>
                        </div>

                        {/* VS Divider */}
                        <div className="flex items-center gap-3 py-1">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(158,126,107,0.3)] to-transparent" />
                          <span className="text-xs font-bold text-[rgba(158,126,107,0.5)]">VS</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(158,126,107,0.3)] to-transparent" />
                        </div>

                        <div className="flex gap-3">
                          <div className="shrink-0 mt-1">
                            <div className="w-6 h-6 rounded-full bg-[rgba(168,181,160,0.2)] border border-[rgba(168,181,160,0.4)] flex items-center justify-center text-xs font-bold text-[rgba(168,181,160,0.8)]">
                              B
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-[rgba(168,181,160,0.7)] font-medium mb-1">{c.sourceB}</div>
                            <p className="text-sm text-[var(--mist-400)] leading-relaxed bg-[var(--obsidian-900)]/30 p-3 rounded-lg border-l-2 border-[var(--oxide-500)]/40">
                              {c.claimB}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Novel Ideas */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="wabi-heading-2 flex items-center gap-3 text-neutral-200">
                  <Sparkles className="w-6 h-6 text-[var(--moss-500)]" />
                  Novel Ideas
                </h2>
                
                {/* Navigation Controls */}
                <div className="flex bg-[var(--ash-200)]/20 p-1 rounded-lg border border-[var(--ash-200)]">
                  {(result.novelIdeas ?? []).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedIdeaIndex(i)}
                      className={`
                        px-4 py-1.5 text-xs font-mono font-bold rounded-md transition-all
                        ${selectedIdeaIndex === i 
                          ? "bg-[var(--paper-050)] text-[var(--stone-700)] shadow-sm border border-[var(--ash-200)]" 
                          : "text-[var(--mist-400)] hover:text-[var(--stone-700)] hover:bg-[var(--ash-200)]/30"
                        }
                      `}
                    >
                      IDEA {String(i + 1).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Idea Card */}
              <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 key={selectedIdeaIndex}">
                {result.novelIdeas && result.novelIdeas[selectedIdeaIndex] && (
                  <NovelIdeaCard
                    idea={result.novelIdeas[selectedIdeaIndex]}
                    index={selectedIdeaIndex}
                    isSelected={true}
                    onSelect={() => {}} 
                    pdfSourceUrls={pdfSourceUrls}
                  />
                )}
              </div>
            </section>

            {/* Selected Idea Details */}
            {selectedIdea && (
              <div className="animate-in fade-in duration-700">
                <PriorArtDisplay
                  priorArt={selectedIdea.priorArt}
                  noveltyScore={selectedIdea.noveltyScore}
                />

                {result.structuredApproach && (
                  <section className="space-y-4 mt-8">
                    <h2 className="wabi-heading-2">Implementation Approach</h2>
                    <StructuredApproachDisplay
                      approach={result.structuredApproach}
                    />
                  </section>
                )}
              </div>
            )}

            {/* Start Over */}
            <div className="flex justify-center pt-8">
              <button
                onClick={() => {
                  setStage("input");
                  setFiles([]);
                  setCompanies([]);
                  setResult(null);
                  setLatestEvent(null);
                }}
                className="px-6 py-3 border border-gray-700 rounded-xl text-gray-600 hover:text-gray-200 hover:border-gray-600 transition-colors"
              >
                Start New Synthesis
              </button>
            </div>
          </div>
        )}

        {/* History Sidebar Drawer */}
        {historyOpen && (
          <div 
            className="fixed inset-0 z-[100] flex justify-end"
            onClick={() => setHistoryOpen(false)}
          >
            <div className="absolute inset-0 bg-[var(--obsidian-900)]/70 backdrop-blur-sm" />
            <div 
              className="relative w-full max-w-md h-full bg-[var(--obsidian-900)] border-l border-[var(--ash-200)]/20 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <History className="w-5 h-5 text-[var(--oxide-500)]" />
                  Synthesis History
                </h2>
                <button 
                  onClick={() => setHistoryOpen(false)}
                  className="p-2 hover:bg-[var(--ash-200)]/10 rounded-lg transition-colors"
                  aria-label="Close history"
                >
                  <Plus className="w-5 h-5 text-gray-500 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isHistoryLoading ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-sm text-gray-500 font-medium">Retrieving archives...</p>
                  </div>
                ) : historicalRuns.length === 0 ? (
                  <p className="text-center text-gray-500 py-20">No archives found.</p>
                ) : (
                  historicalRuns.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => loadHistoricalRun(run.id)}
                      className="w-full p-4 rounded-xl bg-[var(--obsidian-900)]/60 border border-[var(--ash-200)]/10 hover:border-[var(--oxide-500)]/50 hover:bg-[var(--obsidian-900)]/80 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-2">
                         <span className="text-xs text-neutral-500 flex items-center gap-1 font-mono">
                           <Clock className="w-3 h-3" />
                           {new Date(run.created_at).toLocaleDateString()}
                         </span>
                         <span className="px-1.5 py-0.5 text-[10px] bg-[var(--moss-500)]/10 text-[var(--moss-500)] rounded border border-[var(--moss-500)]/20 font-mono tracking-wider">
                           {run.total_ideas} Ideas
                         </span>
                      </div>
                      <h4 className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors line-clamp-2 mb-2 font-mono">
                        {run.sources?.[0]?.name || "Untitled Run"}
                        {run.sources?.length > 1 && ` + ${run.sources.length - 1} more`}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-neutral-500">
                         <span className="uppercase tracking-wider font-bold">{run.status}</span>
                         <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-[var(--oxide-500)]" />
                      </div>
                    </button>
                  ))
                )}
              </div>
              
              <div className="p-6 border-t border-[var(--ash-200)]/10 bg-[var(--obsidian-900)]">
                <TacticalButton
                  onClick={resetToNew}
                  icon={Plus}
                >
                  Start New Session
                </TacticalButton>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
  );
}
