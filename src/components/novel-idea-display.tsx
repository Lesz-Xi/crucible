"use client";

// Novel Idea Display Component
import { NovelIdea, StructuredApproach, PriorArt, MasaAudit } from "@/types";
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck, Microscope, Zap, ChevronDown, ChevronUp, FileText, Code, FlaskConical } from "lucide-react";
import { useState } from "react";
import { SpectralHealthWidget } from "./spectral-health-widget";
import { LabJobViewer } from "./lab-job-viewer";

interface NovelIdeaCardProps {
  idea: NovelIdea;
  index: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function NovelIdeaCard({
  idea,
  index,
  isSelected = false,
  onSelect,
}: NovelIdeaCardProps) {
  const confidenceColor =
    idea.confidence >= 70
      ? "text-orange-400"
      : idea.confidence >= 40
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div
      onClick={onSelect}
      className={`
        group relative overflow-hidden rounded-2xl border transition-all duration-500 cursor-pointer
        ${isSelected
          ? "border-orange-500/50 bg-[#0A0A0A] shadow-xl ring-1 ring-orange-500/20"
          : "border-white/10 bg-[#0A0A0A] hover:border-orange-500/30 hover:shadow-2xl hover:-translate-y-1"
        }
      `}
    >
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-sans text-orange-400 font-bold uppercase tracking-[0.2em] bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                Novel Idea {String(index + 1).padStart(2, '0')}
              </span>
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border bg-white/5 ${confidenceColor} border-white/10`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  idea.confidence >= 70 ? "bg-orange-500" : 
                  idea.confidence >= 40 ? "bg-amber-500" : "bg-red-500"
                }`} />
                <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-400">{idea.confidence}% CONFIDENCE</span>
              </div>
              {/* Hong Theoretical Alignment Badge */}
              {idea.isLogConcave && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/20">
                  <span className="text-sm">🧬</span>
                  <span className="text-[10px] font-mono font-bold tracking-wider">HONG-ALIGNED</span>
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-neutral-200 leading-snug font-sans tracking-tight w-full">
              {idea.thesis}
            </h3>
          </div>
        </div>

        {/* Mechanism & Prediction Grid */}
        {(idea.mechanism || idea.prediction) && (
          <div className={`grid bg-[#111] border border-white/10 rounded-xl overflow-hidden font-mono divide-white/10 ${
            idea.mechanism && idea.prediction 
              ? "grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" 
              : "grid-cols-1"
          }`}>
            {idea.mechanism && (
              <div className="relative p-6 flex flex-col gap-3 group/cell h-full transition-colors hover:bg-white/5">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/40 group-hover/cell:bg-orange-500 transition-colors" />
                <span className="text-orange-400 uppercase tracking-[0.2em] text-[10px] font-bold pl-2">
                  Mechanism
                </span>
                <p className="text-neutral-300 text-sm leading-[1.8] relative z-10 flex-1 opacity-90 pl-2">
                  {idea.mechanism}
                </p>
              </div>
            )}
            {idea.prediction && (
              <div className="relative p-6 flex flex-col gap-3 group/cell h-full transition-colors hover:bg-white/5">
                 <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40 group-hover/cell:bg-amber-500 transition-colors" />
                <span className="text-amber-400 uppercase tracking-[0.2em] text-[10px] font-bold pl-2">
                   Prediction
                </span>
                <p className="text-neutral-300 text-sm leading-[1.8] relative z-10 flex-1 opacity-90 pl-2">
                  {idea.prediction}
                </p>
              </div>
            )}
          </div>
        )}
=
        {/* Description */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-bold">Concept Overview</span>
          <p className="text-sm text-neutral-300 font-medium leading-relaxed border-l-2 border-white/10 pl-4 py-1">
            {idea.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
          {(idea.bridgedConcepts ?? []).slice(0, 3).map((concept, i) => (
            <span
              key={i}
              className="px-2 py-1 text-[10px] font-mono text-neutral-400 bg-white/5 border border-white/10 rounded hover:border-orange-500/30 hover:text-orange-400 transition-colors cursor-default"
            >
              {concept}
            </span>
          ))}
          {(idea.bridgedConcepts?.length ?? 0) > 3 && (
            <span className="px-2 py-1 text-[10px] font-mono text-neutral-500">
              +{idea.bridgedConcepts!.length - 3} MORE
            </span>
          )}
        </div>

        {/* Peer Review Summary (Mini) */}
        {idea.criticalAnalysis && (
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 bg-white/[0.02] px-3 py-2 rounded">
             <span className="flex items-center gap-2">
               <ShieldCheck className="w-3 h-3 text-neutral-500" />
               VALIDITY SCORE
             </span>
             <span className={idea.criticalAnalysis.validityScore >= 70 ? "text-orange-400" : "text-amber-400"}>
               {idea.criticalAnalysis.validityScore}/100
             </span>
          </div>
        )}
        
        {/* Expanded Audit View */}
        {idea.masaAudit && (
           <div className="pt-2">
             <AuditTraceViewer audit={idea.masaAudit} />
           </div>
        )}

        {/* Scientific Artifacts (Phase 3) */}
        {(idea as any).scientificArtifacts && (
          <ScientificArtifactsViewer artifacts={(idea as any).scientificArtifacts} />
        )}

        {/* Spectral Health (Phase 3) */}
        {(idea as any).spectralInterference && (
          <div className="pt-2">
            <SpectralHealthWidget interference={(idea as any).spectralInterference} />
          </div>
        )}
      </div>
    </div>
  );
}

interface ScientificArtifactsViewerProps {
  artifacts: {
    protocolCode?: string;
    labManual?: string;
    labJob?: any;
  };
}

function ScientificArtifactsViewer({ artifacts }: ScientificArtifactsViewerProps) {
  const [expandedSection, setExpandedSection] = useState<'protocol' | 'manual' | 'labjob' | null>(null);

  if (!artifacts.protocolCode && !artifacts.labManual && !artifacts.labJob) {
    return null;
  }

  return (
    <div className="space-y-3 pt-4 border-t border-white/5">
      <h4 className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-wider">Scientific Artifacts</h4>
      
      {/* Protocol Code */}
      {artifacts.protocolCode && (
        <div className="space-y-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedSection(expandedSection === 'protocol' ? null : 'protocol');
            }}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-[#111] border border-white/10 hover:border-blue-500/50 transition-all text-left group"
          >
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-500 group-hover:text-blue-400" />
              <span className="text-sm font-medium text-neutral-300 group-hover:text-blue-200">Protocol Code (Python)</span>
            </div>
            {expandedSection === 'protocol' ? <ChevronUp className="w-4 h-4 text-neutral-600" /> : <ChevronDown className="w-4 h-4 text-neutral-600" />}
          </button>
          {expandedSection === 'protocol' && (
            <pre className="p-4 bg-[#0A0A0A] border border-white/10 rounded-lg overflow-x-auto text-xs text-neutral-300 font-mono animate-in fade-in slide-in-from-top-2 duration-300">
              <code>{artifacts.protocolCode}</code>
            </pre>
          )}
        </div>
      )}

      {/* Lab Manual */}
      {artifacts.labManual && (
        <div className="space-y-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedSection(expandedSection === 'manual' ? null : 'manual');
            }}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-[#111] border border-white/10 hover:border-green-500/50 transition-all text-left group"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-500 group-hover:text-green-400" />
              <span className="text-sm font-medium text-neutral-300 group-hover:text-green-200">Lab Manual (Markdown)</span>
            </div>
            {expandedSection === 'manual' ? <ChevronUp className="w-4 h-4 text-neutral-600" /> : <ChevronDown className="w-4 h-4 text-neutral-600" />}
          </button>
          {expandedSection === 'manual' && (
            <div className="p-4 bg-[#0A0A0A] border border-white/10 rounded-lg overflow-x-auto text-sm text-neutral-300 prose prose-invert prose-sm max-w-none animate-in fade-in slide-in-from-top-2 duration-300">
              <pre className="whitespace-pre-wrap font-sans">{artifacts.labManual}</pre>
            </div>
          )}
        </div>
      )}

      {/* Lab Job (RIL) */}
      {artifacts.labJob && (
        <div className="space-y-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedSection(expandedSection === 'labjob' ? null : 'labjob');
            }}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-[#111] border border-white/10 hover:border-purple-500/50 transition-all text-left group"
          >
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-purple-500 group-hover:text-purple-400" />
              <span className="text-sm font-medium text-neutral-300 group-hover:text-purple-200">Robotic Lab Job (RIL)</span>
            </div>
            {expandedSection === 'labjob' ? <ChevronUp className="w-4 h-4 text-neutral-600" /> : <ChevronDown className="w-4 h-4 text-neutral-600" />}
          </button>
          {expandedSection === 'labjob' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <LabJobViewer labJob={artifacts.labJob} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AuditTraceViewerProps {
  audit: MasaAudit;
}

export function AuditTraceViewer({ audit }: AuditTraceViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-[#111] border border-white/10 hover:border-orange-500/50 hover:shadow-md transition-all text-left shadow-sm group"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-500 group-hover:text-orange-400" />
          <span className="text-sm font-bold text-neutral-300 group-hover:text-orange-200">Epistemic Audit Trace</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-600 group-hover:text-orange-500" /> : <ChevronDown className="w-4 h-4 text-neutral-600 group-hover:text-orange-500" />}
      </button>

      {isOpen && (
        <div className="space-y-4 p-4 rounded-xl bg-[#0A0A0A] border border-white/10 shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Epistemologist */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-400">
              <Microscope className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">The Epistemologist</span>
              <span className="ml-auto text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">
                Score: {audit.methodologist.score}/100
              </span>
            </div>
            <p className="text-sm text-neutral-400 font-medium leading-relaxed pl-6 border-l-2 border-orange-500/30">
              {audit.methodologist.critique.replace(/\*\*/g, "").replace(/\*/g, "")}
            </p>
          </div>

          {/* Skeptic */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-500">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">The Skeptic</span>
              <span className="ml-auto text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">
                Score: {audit.skeptic.score}/100
              </span>
            </div>
            <p className="text-sm text-neutral-400 font-medium leading-relaxed pl-6 border-l-2 border-amber-500/30">
              {audit.skeptic.critique.replace(/\*\*/g, "").replace(/\*/g, "")}
            </p>
            {(audit.skeptic.biasesDetected?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 pl-6">
                {(audit.skeptic.biasesDetected ?? []).map((bias, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold">
                    {bias}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Architect Verdict */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Sovereign Verdict</span>
              <span className={`ml-auto text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${audit.finalSynthesis.isApproved ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {audit.finalSynthesis.isApproved ? 'APPROVED' : 'REJECTED'} ({audit.finalSynthesis.validityScore}/100)
              </span>
            </div>
            {(audit.finalSynthesis.remediationPlan?.length ?? 0) > 0 && (
              <div className="pl-6 border-l-2 border-orange-500/30">
                 <h5 className="text-[10px] font-bold text-neutral-500 uppercase mb-2">Refinement Applied</h5>
                 <ul className="space-y-1">
                   {audit.finalSynthesis.remediationPlan.map((step, i) => {
                     const cleanedStep = step.replace(/\*\*/g, "").replace(/\*/g, "");
                     const finalStep = cleanedStep.endsWith('.') ? cleanedStep : `${cleanedStep}.`;
                     return (
                       <li key={i} className="text-xs text-neutral-300 font-medium flex items-start gap-2">
                         <span className="mt-1.5 w-1 h-1 rounded-full bg-orange-500" />
                         {finalStep}
                       </li>
                     );
                   })}
                 </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface StructuredApproachDisplayProps {
  approach: StructuredApproach;
}

export function StructuredApproachDisplay({
  approach,
}: StructuredApproachDisplayProps) {
  return (
    <div className="space-y-8 p-8 bg-[#0A0A0A] rounded-2xl border border-white/10 relative overflow-hidden shadow-sm">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

      {/* Title */}
      <div className="relative z-10 flex items-start justify-between border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold text-neutral-200 font-sans tracking-tight">{approach.title}</h2>
        <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
          Execution Plan
        </span>
      </div>

      {/* Problem Statement */}
      <div className="relative z-10">
        <h3 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-2">Problem Statement</h3>
        <p className="text-neutral-300 font-light border-l-2 border-orange-500/30 pl-4 py-1 leading-relaxed">{approach.problemStatement}</p>
      </div>

      {/* Proposed Solution */}
      <div className="group/section relative z-10">
        <h3 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-2 transition-colors duration-300 group-hover/section:text-orange-400">Proposed Solution</h3>
        <p className="text-neutral-200 font-light group-hover/section:text-white transition-colors duration-300 leading-relaxed bg-white/[0.03] p-4 rounded-lg border border-white/5">
          {approach.proposedSolution}
        </p>
      </div>

      {/* Key Steps */}
      <div className="relative z-10">
        <h3 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-4">Implementation Steps</h3>
        <div className="space-y-3">
          {approach.keySteps.map((step) => (
            <div
              key={step.order}
              className="flex gap-4 p-5 bg-[#111] border border-white/10 rounded-xl group hover:border-orange-500/30 hover:bg-white/5 transition-colors"
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-orange-500/10 text-orange-400 rounded text-xs font-mono border border-orange-500/20 group-hover:bg-orange-500/20 group-hover:text-orange-300 transition-colors">
                {String(step.order).padStart(2, '0')}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-neutral-300 text-sm group-hover:text-orange-200 transition-colors">{step.title}</h4>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{step.description}</p>
                {step.dependencies && step.dependencies.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase text-neutral-600 font-mono">Prerequisites:</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {step.dependencies.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 relative z-10 pt-6 border-t border-white/10">
        {/* Risks */}
          <div>
            <h3 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-3">Risks & Mitigations</h3>
            <div className="space-y-3">
              {approach.risks.map((risk, i) => {
                const severityConfig = {
                  high: {
                     color: "text-rose-400",
                     borderColor: "border-rose-500/20",
                     bgColor: "bg-rose-500/5 hover:bg-rose-500/10",
                     badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                     icon: AlertTriangle
                  },
                  medium: {
                     color: "text-amber-400",
                     borderColor: "border-amber-500/20",
                     bgColor: "bg-amber-500/5 hover:bg-amber-500/10",
                     badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                     icon: AlertTriangle
                  },
                  low: {
                     color: "text-blue-400",
                     borderColor: "border-blue-500/20",
                     bgColor: "bg-blue-500/5 hover:bg-blue-500/10",
                     badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                     icon: ShieldCheck
                  }
                };

                const config = severityConfig[risk.severity as keyof typeof severityConfig] || severityConfig.medium;
                const Icon = config.icon;

                return (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border transition-all duration-300 group ${config.borderColor} ${config.bgColor}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                         <div className={`p-1.5 rounded-lg border ${config.borderColor} ${config.badge.split(' ')[0]}`}>
                            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                         </div>
                         <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${config.badge}`}>
                            {risk.severity || 'Medium'} Risk
                         </span>
                      </div>
                    </div>
                    
                    <p className={`text-sm font-medium leading-relaxed mb-3 ${config.color.replace('400', '200')}`}>
                      {risk.description}
                    </p>

                    <div className="flex items-start gap-2 pl-3 border-l-2 border-white/10 group-hover:border-white/20 transition-colors">
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-500 mt-0.5" />
                      <div>
                         <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-0.5">Mitigation Strategy</span>
                         <p className="text-xs text-neutral-400 leading-relaxed">
                            {risk.mitigation}
                         </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        {/* Success Metrics */}
        <div>
          <h3 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-3">Success Metrics</h3>
          <div className="grid grid-cols-1 gap-2">
            {approach.successMetrics.map((metric, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg group hover:bg-white/[0.07] transition-colors"
              >
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-500/50 group-hover:bg-orange-500 group-hover:shadow-[0_0_8px_rgba(249,115,22,0.4)] transition-all" />
                <span className="text-xs text-neutral-400 group-hover:text-neutral-300 font-mono font-medium">{metric}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PriorArtDisplayProps {
  priorArt: PriorArt[];
  noveltyScore: number;
}

export function PriorArtDisplay({ priorArt, noveltyScore }: PriorArtDisplayProps) {
  const validPriorArt = priorArt || [];

  const scoreColor =
    noveltyScore >= 70
      ? "text-orange-400"
      : noveltyScore >= 40
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="p-8 bg-[#0A0A0A] rounded-2xl border border-white/10 relative overflow-hidden shadow-sm">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <h3 className="text-xl font-bold text-neutral-200 font-mono tracking-tight">Prior Art Analysis</h3>
        <div className={`text-xl font-mono font-bold ${scoreColor} bg-white/[0.03] px-3 py-1.5 rounded border border-white/5`}>
          {validPriorArt.length === 0 && !noveltyScore ? (
            <span className="text-orange-400">95% NOVEL <span className="text-xs text-orange-500/70 font-mono tracking-normal normal-case">(no similar work found)</span></span>
          ) : (
            <>{noveltyScore || 95}% NOVEL</>
          )}
        </div>
      </div>

      {validPriorArt.length === 0 ? (
        <p className="text-neutral-500 relative z-10 text-sm font-mono p-4 border border-dashed border-white/10 rounded-lg">
          No significant prior art detected.
        </p>
      ) : (
        <div className="space-y-3 relative z-10">
          {validPriorArt.slice(0, 5).map((art, i) => (
            <div
              key={i}
              className="flex items-start justify-between p-5 bg-[#111] border border-white/10 rounded-xl group hover:border-orange-500/30 hover:bg-white/5 transition-colors"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex flex-col gap-1.5">
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1.5 font-mono truncate"
                  >
                    {art.title}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                  
                  {/* Metadata Row */}
                  <div className="flex flex-wrap gap-2 text-[10px] text-neutral-500 items-center font-mono uppercase tracking-wide">
                    {art.venue && <span className="font-bold text-neutral-400">{art.venue}</span>}
                    {art.year && <span>({art.year})</span>}
                    {art.authors && art.authors.length > 0 && (
                      <span className="normal-case tracking-normal">
                        by {art.authors.slice(0, 2).join(", ")}
                        {art.authors.length > 2 && " et al."}
                      </span>
                    )}
                  </div>

                  {/* PDF Link */}
                  {art.openAccessPdf && (
                    <a 
                      href={art.openAccessPdf}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded hover:bg-emerald-500/20 transition-colors flex items-center gap-1 w-fit font-mono"
                    >
                      <FileText className="w-3 h-3" />
                      PDF ACCESS
                    </a>
                  )}

                  <p className="text-xs text-neutral-500 mt-2 leading-relaxed border-l border-white/10 pl-3">
                    {art.differentiator}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono font-medium px-2 py-1 rounded border ${
                  art.similarity >= 50 
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
                    : "text-neutral-500 bg-white/5 border-white/10"
                }`}
              >
                {art.similarity}% MATCH
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
