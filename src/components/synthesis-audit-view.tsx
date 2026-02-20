"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Circle,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { StreamEvent } from "@/lib/streaming-event-emitter";
import { TraceIntegrityPanel } from "./trace-integrity-panel";
import { LiveEpistemicMonitor } from "./live-epistemic-monitor";
import { SpectralHealthMonitor } from "./spectral-health-monitor";
import { IterativeTimelineView } from "./iterative-timeline-view";

type TimelineStepKey =
  | "ingestion"
  | "pdf_parsing"
  | "entity_harvest"
  | "contradiction_scan"
  | "hypothesis_generation"
  | "audit_refinement"
  | "protocol_validation"
  | "complete";

type StepStatus = "pending" | "active" | "complete" | "warning";

interface TimelineStep {
  key: TimelineStepKey;
  title: string;
  description: string;
}

interface LogEntry {
  id: string;
  at: number;
  kind: string;
  title: string;
  details?: string;
}

interface SynthesisAuditViewProps {
  files: File[];
  companies: string[];
  latestEvent?: StreamEvent | null;
  userPrompt?: string;
  // Phase 2: Real-Time Monitoring SSE Data
  traceManifest?: {
    sessionUUID: string;
    inputHashes: Array<{ name: string; hash: string }>;
    seedValue: number | null;
    timestamp: string;
  } | null;
  epistemicData?: {
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
  } | null;
  spectralHealth?: {
    lambda_min: number;
    lambda_max: number;
    spectralGap: number;
    healthStatus: 'optimal' | 'good' | 'warning' | 'critical';
    timestamp: number;
  } | null;
  refinementCycle?: {
    iteration: number;
    maxIterations: number;
    status: 'running' | 'complete';
    approved?: boolean;
    validityScore?: number;
  } | null;
  tbeTelemetry?: {
    spectralGap: number;
    temperature: number;
    isTriggered: boolean;
  } | null;
}

const BASE_STEPS: TimelineStep[] = [
  { key: "ingestion", title: "Ingestion", description: "Sources accepted and queued." },
  { key: "pdf_parsing", title: "PDF Parsing", description: "Extracting text and structured context." },
  { key: "entity_harvest", title: "Entity Harvest", description: "Resolving company entities and proxies." },
  { key: "contradiction_scan", title: "Contradiction Scan", description: "Detecting tension across sources." },
  { key: "hypothesis_generation", title: "Hypothesis Generation", description: "Drafting candidate causal claims." },
  { key: "audit_refinement", title: "Audit + Refinement", description: "Skeptic review, pruning, and sharpening." },
  { key: "protocol_validation", title: "Protocol Validation", description: "Running lab or sandbox checks." },
  { key: "complete", title: "Complete", description: "Outputs stabilized for review." },
];

function phaseLabel(key: TimelineStepKey): "Initiation" | "Synthesis" | "Inference" {
  if (key === "ingestion" || key === "pdf_parsing" || key === "entity_harvest") return "Initiation";
  if (key === "contradiction_scan" || key === "hypothesis_generation" || key === "audit_refinement") return "Synthesis";
  return "Inference";
}

function toLog(event: StreamEvent): LogEntry {
  const at = Date.now();
  switch (event.event) {
    case "ingestion_start":
      return { id: `${at}-ingestion`, at, kind: "INGESTION", title: `Accepted ${event.files} file(s)` };
    case "pdf_processed":
      return { id: `${at}-pdf-ok-${event.filename}`, at, kind: "PDF", title: `Processed: ${event.filename}` };
    case "pdf_error":
      return { id: `${at}-pdf-err-${event.filename}`, at, kind: "PDF", title: `Failed: ${event.filename}`, details: event.error };
    case "thinking_step":
      return { id: `${at}-think`, at, kind: "THINKING", title: event.content };
    case "step_update":
      return { id: `${at}-step`, at, kind: "STEP", title: event.step };
    case "agent_switch":
      return { id: `${at}-agent`, at, kind: "AGENT", title: `Switched to ${event.agent}` };
    case "hypothesis_generated":
      return {
        id: `${at}-hyp-${event.hypothesis.id}`,
        at,
        kind: "HYPOTHESIS",
        title: event.hypothesis.label ?? event.hypothesis.thesis,
      };
    case "hypothesis_refuted":
      return { id: `${at}-hyp-r-${event.id}`, at, kind: "REFUTATION", title: `Refuted: ${event.id}`, details: event.reason };
    case "protocol_validated":
      return {
        id: `${at}-protocol-${event.ideaId}`,
        at,
        kind: "PROTOCOL",
        title: `${event.success ? "Validated" : "Rejected"}: ${event.ideaId}`,
        details: event.pValue != null ? `p-value ${event.pValue}` : undefined,
      };
    case "confidence_update":
      return { id: `${at}-conf-${event.factor}`, at, kind: "CONFIDENCE", title: `${event.factor}: ${(event.score * 100).toFixed(1)}%` };
    case "complete":
      return { id: `${at}-complete`, at, kind: "COMPLETE", title: "Synthesis complete" };
    case "error":
      return { id: `${at}-error`, at, kind: "ERROR", title: event.message };
    default:
      return { id: `${at}-event`, at, kind: "EVENT", title: JSON.stringify(event) };
  }
}

export function SynthesisAuditView({ 
  files, 
  companies, 
  latestEvent, 
  userPrompt,
  traceManifest,
  epistemicData,
  spectralHealth,
  refinementCycle,
  tbeTelemetry
}: SynthesisAuditViewProps) {
  const steps = useMemo(
    () => (companies.length > 0 ? BASE_STEPS : BASE_STEPS.filter((s) => s.key !== "entity_harvest")),
    [companies.length]
  );

  // Core state
  const [activeKey, setActiveKey] = useState<TimelineStepKey>("ingestion");
  const [completed, setCompleted] = useState<Set<TimelineStepKey>>(new Set());
  const [warnings, setWarnings] = useState<Set<TimelineStepKey>>(new Set());
  const [log, setLog] = useState<LogEntry[]>([]);
  const [pdfDone, setPdfDone] = useState(0);
  const [companyDone, setCompanyDone] = useState(0);

  // MASA Gating state
  const [isReviewing, setIsReviewing] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<StreamEvent[]>([]);

  const expectedPdf = files.length;
  const expectedCompany = companies.length;

  // Reset state on new synthesis
  useEffect(() => {
    setActiveKey("ingestion");
    setCompleted(new Set());
    setWarnings(new Set());
    setLog([]);
    setPdfDone(0);
    setCompanyDone(0);
    setIsReviewing(false);
    setPendingEvents([]);
  }, [files.length, companies.length, userPrompt]);

  // Helper to handle timeline updates
  const completeStep = (key: TimelineStepKey) => setCompleted((prev) => new Set(prev).add(key));
  const warnStep = (key: TimelineStepKey) => setWarnings((prev) => new Set(prev).add(key));

  const processStreamEvent = (event: StreamEvent) => {
    // Always log the event (unless buffering? No, log immediately even if buffering? 
    // MASA Spec: User should see log, but timeline pauses? 
    // Actually, if we buffer, we hide it.
    // So logging happens here.)
    setLog((prev) => [toLog(event), ...prev].slice(0, 100));

    switch (event.event) {
      case "ingestion_start":
        setActiveKey("ingestion");
        break;
      case "pdf_processed": {
        const isCompany = event.filename.startsWith("Company:");
        if (isCompany) {
          setCompanyDone((prev) => {
            const next = prev + 1;
            if (companies.length > 0 && next >= expectedCompany) {
               // MASA Gating: Stop here
               setIsReviewing(true);
            }
            return next;
          });
          if (companies.length > 0) {
            completeStep("pdf_parsing");
            completeStep("ingestion");
            setActiveKey("entity_harvest");
          }
        } else {
          setPdfDone((prev) => {
            const next = prev + 1;
            if (next >= expectedPdf) {
              completeStep("pdf_parsing");
              if (companies.length === 0) {
                 // MASA Gating: Stop here if no companies
                 setIsReviewing(true);
              }
            } else {
              setActiveKey("pdf_parsing");
            }
            return next;
          });
          completeStep("ingestion");
        }
        break;
      }
      case "pdf_error":
        completeStep("ingestion");
        warnStep("pdf_parsing");
        setActiveKey("pdf_parsing");
        break;
      case "thinking_step": {
        const lower = event.content.toLowerCase();
        if (lower.includes("contradict")) setActiveKey("contradiction_scan");
        if (lower.includes("audit") || lower.includes("skeptic")) setActiveKey("audit_refinement");
        break;
      }
      case "hypothesis_generated":
        completeStep("contradiction_scan");
        setActiveKey("hypothesis_generation");
        break;
      case "hypothesis_refuted":
        completeStep("hypothesis_generation");
        setActiveKey("audit_refinement");
        break;
      case "agent_switch":
      case "step_update":
        completeStep("hypothesis_generation");
        setActiveKey("audit_refinement");
        break;
      case "protocol_validated":
        completeStep("audit_refinement");
        setActiveKey("protocol_validation");
        if (!event.success) warnStep("protocol_validation");
        break;
      case "complete":
        steps.forEach((s) => completeStep(s.key));
        setActiveKey("complete");
        break;
      case "error":
        warnStep(activeKey);
        break;
      default:
        break;
    }
  };

  // Main Event Listener
  useEffect(() => {
    if (!latestEvent) return;

    if (isReviewing) {
        setPendingEvents(prev => [...prev, latestEvent]);
    } else {
        processStreamEvent(latestEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestEvent]); // We exclude processing dependencies to avoid stale closures if possible, but standard practice suggests including them or using refs. 
                     // Here we rely on functional state updates mostly. activeKey is the weak point.

  // Flush Buffer on Approve
  const handleApprove = () => {
     setIsReviewing(false);
     // Flush buffer
     pendingEvents.forEach(e => processStreamEvent(e));
     setPendingEvents([]);
     
     // Advance state manually after approval
     if (companies.length > 0) {
        completeStep("entity_harvest");
        setActiveKey("contradiction_scan");
     } else {
        setActiveKey("contradiction_scan");
     }
  };

  const currentStep = steps.find((s) => s.key === activeKey) ?? steps[0];
  const inputCount = files.length + companies.length;

  return (
    <div className="space-y-7">
      <div className="text-center space-y-2">
        <p className="text-xs font-mono uppercase tracking-[0.34em] text-[var(--text-tertiary)]">Phase II: {phaseLabel(activeKey)}</p>
        <h3 className="font-serif text-5xl md:text-6xl leading-none text-[var(--text-primary)]">Synthesis</h3>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--text-secondary)]">Current Step: {currentStep.title}</p>
      </div>

      {/* Real-Time Monitoring Grid (Phase 2 - Live SSE Data) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-6 mb-8">
        <div className="h-[500px] 2xl:h-[600px]">
          <TraceIntegrityPanel data={traceManifest || undefined} />
        </div>
        <div className="h-[500px] 2xl:h-[600px]">
          <IterativeTimelineView data={undefined} />
        </div>
        <div className="h-[500px] 2xl:h-[600px]">
          <LiveEpistemicMonitor data={epistemicData || undefined} />
        </div>
        <div className="h-[500px] 2xl:h-[600px]">
          <SpectralHealthMonitor 
            data={spectralHealth ? { current: spectralHealth, history: [] } : undefined}
            tbeData={tbeTelemetry}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[5fr_7fr] gap-8 items-start">
        <div className="space-y-6">
          <section className="rounded-3xl p-6 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md border border-white/20 border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-mono uppercase tracking-[0.32em] text-[var(--text-tertiary)]">Source Ledger</p>
              <span className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-secondary)]">{inputCount} Inputs</span>
            </div>

            <div className="space-y-6">
              <div>
                <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[var(--text-tertiary)]">PDF Sources</p>
                <div className="space-y-2">
                  {files.map((file) => {
                    const isProcessed = log.some((entry) => entry.kind === "PDF" && entry.title.includes(file.name) && entry.title.startsWith("Processed"));
                    const isError = log.some((entry) => entry.kind === "PDF" && entry.title.includes(file.name) && entry.title.startsWith("Failed"));
                    return (
                      <div key={file.name} className="flex items-center justify-between rounded-full border border-stone-200 bg-white/65 px-4 py-2 text-sm">
                        <span className="flex items-center gap-3 text-[var(--text-primary)]"><FileText className="h-4 w-4 text-wabi-clay" />{file.name}</span>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                          {isError ? "Error" : isProcessed ? "Processed" : "Queued"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Company Entities</p>
                {companies.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">No entities provided.</p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {companies.map((company) => (
                      <span key={company} className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-3 py-1 text-xs text-[var(--text-primary)]">
                        <Building2 className="h-3.5 w-3.5 text-wabi-charcoal" />
                        {company}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Research Intent</p>
                <div className="rounded-2xl border border-stone-200 bg-white/65 p-4 text-sm leading-relaxed text-[var(--text-primary)]">
                  {userPrompt?.trim() || "Intent: Unspecified"}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl p-6 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md border border-white/20 border-stone-200 shadow-sm">
            <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-wabi-clay/35 to-transparent" />
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-mono uppercase tracking-[0.32em] text-[var(--text-tertiary)]">Process Timeline</p>
              <span className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-secondary)]">Live</span>
            </div>

            <ol className="space-y-3">
              {steps.map((step, idx) => {
                const status: StepStatus = warnings.has(step.key)
                  ? "warning"
                  : completed.has(step.key)
                    ? "complete"
                    : step.key === activeKey
                      ? "active"
                      : "pending";

                return (
                  <li key={step.key} className="relative pl-11">
                    {idx < steps.length - 1 && <span className="absolute left-[14px] top-8 h-[36px] w-px bg-stone-200" />}
                    <span className={`absolute left-0 top-0 inline-flex h-7 w-7 items-center justify-center rounded-full border ${status === "complete" ? "border-wabi-moss/40 bg-wabi-moss/10 text-wabi-moss" : status === "warning" ? "border-red-300 bg-red-50 text-red-600" : status === "active" ? "border-wabi-clay/55 bg-wabi-clay/10 text-wabi-clay" : "border-stone-300 bg-white/60 text-stone-400"}`}>
                      {status === "complete" ? <Check className="h-4 w-4" /> : status === "warning" ? <X className="h-4 w-4" /> : status === "active" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Circle className="h-3 w-3" />}
                    </span>
                    {status === "active" && <span className="absolute left-[-4px] top-[-4px] h-9 w-9 rounded-full border border-wabi-clay/35 animate-pulse" />}
                    <p className="text-[18px] [font-family:var(--font-playfair)] font-medium leading-[1.1] text-[var(--text-primary)] tracking-[-0.01em]">{step.title}</p>
                    <p className="mt-0.5 text-[13px] [font-family:var(--font-geist-sans)] font-normal leading-snug text-[var(--text-secondary)]">{step.description}</p>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* MASA GAP-05: Manual Gate UI */}
          {isReviewing && (
            <section className="rounded-3xl p-6 bg-wabi-clay/5 border border-wabi-clay/20 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col gap-6">
                 <div className="flex items-start gap-4">
                    <div className="rounded-full bg-wabi-clay/10 p-2">
                       <Check className="h-5 w-5 text-wabi-clay" />
                    </div>
                    <div>
                       <h4 className="font-serif text-lg font-medium text-[var(--text-primary)]">Initiation Complete</h4>
                       <p className="text-sm text-[var(--text-secondary)] mt-1">
                          Sources have been ingested and parsed. MASA Protocol requires human verification of the "Source Ledger" before engaging the Synthesis Engine.
                       </p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3 pt-2">
                    <button 
                       onClick={handleApprove}
                       className="px-5 py-2.5 rounded-full bg-[#303030] text-white text-sm font-medium hover:bg-black transition-colors"
                    >
                       Approve & Begin Synthesis
                    </button>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
                       {pendingEvents.length > 0 ? `${pendingEvents.length} events buffered` : "Ready"}
                    </p>
                 </div>
              </div>
            </section>
          )}

          <section className="rounded-3xl p-6 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md border border-white/20 border-stone-200 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-mono uppercase tracking-[0.32em] text-[var(--text-tertiary)]">Event Log</p>
              <span className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-secondary)]">{log.length} Events</span>
            </div>

            <div className="max-h-[360px] min-h-[240px] space-y-2.5 overflow-y-auto pr-1">
              {log.length === 0 ? (
                <div className="rounded-2xl border border-stone-200 bg-white/60 p-4 text-sm text-[var(--text-secondary)]">Waiting for first event...</div>
              ) : (
                log.map((entry) => (
                  <article key={entry.id} className="rounded-2xl border border-stone-200 bg-white/65 p-3.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-tertiary)]">{entry.kind}</span>
                      <time className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                        {new Date(entry.at).toLocaleTimeString()}
                      </time>
                    </div>
                    <p className="text-[13px] text-[var(--text-primary)]">{entry.title}</p>
                    {entry.details && <p className="mt-1 text-xs text-[var(--text-secondary)]">{entry.details}</p>}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <p className="text-center text-xs font-mono uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Framework affects model logic. Depth affects presentation detail.</p>
    </div>
  );
}
