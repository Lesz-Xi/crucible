"use client";

// Novel Idea Display Component
import { NovelIdea, StructuredApproach, PriorArt } from "@/types";
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

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
      ? "text-emerald-400"
      : idea.confidence >= 40
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div
      onClick={onSelect}
      className={`
        relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer
        ${isSelected
          ? "border-indigo-500 bg-indigo-500/10"
          : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm text-gray-500">Idea #{index + 1}</span>
        </div>
        <div className={`flex items-center gap-1 ${confidenceColor}`}>
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">{idea.confidence}%</span>
        </div>
      </div>

      {/* Thesis */}
      <h3 className="text-lg font-semibold text-gray-100 mb-3">
        {idea.thesis}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-3">
        {idea.description}
      </p>

      {/* Hypothesis Structure */}
      {(idea.mechanism || idea.prediction) && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {idea.mechanism && (
            <div className="p-3 bg-indigo-900/20 border border-indigo-500/20 rounded-xl">
              <h4 className="text-xs font-semibold text-indigo-300 mb-1 uppercase tracking-wider">Mechanism</h4>
              <p className="text-sm text-indigo-100/80">{idea.mechanism}</p>
            </div>
          )}
          {idea.prediction && (
            <div className="p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-xl">
              <h4 className="text-xs font-semibold text-emerald-300 mb-1 uppercase tracking-wider">Prediction</h4>
              <p className="text-sm text-emerald-100/80">{idea.prediction}</p>
            </div>
          )}
        </div>
      )}

      {/* Bridged Concepts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {idea.bridgedConcepts.slice(0, 4).map((concept, i) => (
          <span
            key={i}
            className="px-2 py-1 text-xs bg-gray-700/50 text-gray-300 rounded-lg"
          >
            {concept}
          </span>
        ))}
        {idea.bridgedConcepts.length > 4 && (
          <span className="px-2 py-1 text-xs text-gray-500">
            +{idea.bridgedConcepts.length - 4} more
          </span>
        )}
      </div>

      {/* Critical Analysis (Peer Review) */}
      {idea.criticalAnalysis && (
        <div className="mb-4 p-4 bg-red-900/10 border border-red-500/20 rounded-xl">
           <div className="flex items-center justify-between mb-2">
             <h4 className="text-xs font-semibold text-red-300 uppercase tracking-wider flex items-center gap-2">
               <AlertTriangle className="w-3 h-3" />
               Peer Review
             </h4>
             <span className="text-xs font-mono text-red-400">Validity: {idea.criticalAnalysis.validityScore}/100</span>
           </div>
           
           <p className="text-sm text-gray-400 mb-2 italic">"{idea.criticalAnalysis.critique}"</p>
           
           {(idea.criticalAnalysis.logicalFallacies.length > 0 || idea.criticalAnalysis.biasDetected.length > 0) && (
             <div className="flex flex-wrap gap-2 mt-2">
               {idea.criticalAnalysis.logicalFallacies.map((f, i) => (
                 <span key={`f-${i}`} className="px-1.5 py-0.5 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                   Fallacy: {f}
                 </span>
               ))}
               {idea.criticalAnalysis.biasDetected.map((b, i) => (
                 <span key={`b-${i}`} className="px-1.5 py-0.5 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                   Bias: {b}
                 </span>
               ))}
             </div>
           )}
        </div>
      )}

      {/* Novelty Assessment */}
      <div className="p-3 bg-gray-900/50 rounded-xl">
        <p className="text-xs text-gray-400">{idea.noveltyAssessment}</p>
      </div>
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
    <div className="space-y-6 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100">{approach.title}</h2>
      </div>

      {/* Problem Statement */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Problem Statement</h3>
        <p className="text-gray-200">{approach.problemStatement}</p>
      </div>

      {/* Proposed Solution */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Proposed Solution</h3>
        <p className="text-gray-200">{approach.proposedSolution}</p>
      </div>

      {/* Key Steps */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Implementation Steps</h3>
        <div className="space-y-3">
          {approach.keySteps.map((step) => (
            <div
              key={step.order}
              className="flex gap-4 p-4 bg-gray-900/50 rounded-xl"
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-full font-semibold text-sm">
                {step.order}
              </div>
              <div>
                <h4 className="font-medium text-gray-200">{step.title}</h4>
                <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                {step.dependencies && step.dependencies.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Depends on: {step.dependencies.join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risks */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Risks & Mitigations</h3>
        <div className="space-y-2">
          {approach.risks.map((risk, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border ${
                risk.severity === "high"
                  ? "border-red-500/30 bg-red-500/10"
                  : risk.severity === "medium"
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-gray-600 bg-gray-900/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle
                  className={`w-4 h-4 ${
                    risk.severity === "high"
                      ? "text-red-400"
                      : risk.severity === "medium"
                        ? "text-amber-400"
                        : "text-gray-400"
                  }`}
                />
                <span className="text-sm font-medium text-gray-200">
                  {risk.description}
                </span>
              </div>
              <p className="text-xs text-gray-400 ml-6">
                Mitigation: {risk.mitigation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Success Metrics */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Success Metrics</h3>
        <div className="flex flex-wrap gap-2">
          {approach.successMetrics.map((metric, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">{metric}</span>
            </div>
          ))}
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
  const scoreColor =
    noveltyScore >= 70
      ? "text-emerald-400"
      : noveltyScore >= 40
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Prior Art Analysis</h3>
        <div className={`text-2xl font-bold ${scoreColor}`}>
          {noveltyScore}% Novel
        </div>
      </div>

      {priorArt.length === 0 ? (
        <p className="text-gray-400">No significant prior art detected.</p>
      ) : (
        <div className="space-y-3">
          {priorArt.slice(0, 5).map((art, i) => (
            <div
              key={i}
              className="flex items-start justify-between p-3 bg-gray-900/50 rounded-xl"
            >
              <div className="flex-1">
                <a
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {art.title}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-xs text-gray-500 mt-1">{art.differentiator}</p>
              </div>
              <span
                className={`text-sm font-medium ${
                  art.similarity >= 50 ? "text-amber-400" : "text-gray-400"
                }`}
              >
                {art.similarity}% similar
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
