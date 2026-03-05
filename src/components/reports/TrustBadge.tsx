import React, { useState } from "react";
import { SCMGroundedReport, HonestFramingState, WarningCode, WARNING_CODE_LABELS } from "@/types/report-analysis";
import { ShieldAlert, ShieldCheck, ShieldQuestion, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  report: SCMGroundedReport;
}

export function TrustBadge({ report }: TrustBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { causalDepth, allowVerified, verificationFailures } = report.meta;

  const getConfig = (state: HonestFramingState) => {
    switch (state) {
      case "verified":
        return {
          icon: ShieldCheck,
          label: "Verified Causal Claim",
          colors: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
        };
      case "heuristic":
        return {
          icon: ShieldAlert,
          label: "Heuristic Assessment",
          colors: "text-amber-500 bg-amber-500/10 border-amber-500/30",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          label: "Warning: Low Trust",
          colors: "text-orange-500 bg-orange-500/10 border-orange-500/30",
        };
      case "unknown":
      default:
        return {
          icon: ShieldQuestion,
          label: "Unknown State",
          colors: "text-gray-400 bg-gray-500/10 border-gray-500/30",
        };
    }
  };

  const config = getConfig(causalDepth);
  const Icon = config.icon;
  const hasDowngrades = verificationFailures.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => hasDowngrades && setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all",
          config.colors,
          hasDowngrades ? "cursor-pointer hover:bg-opacity-20" : "cursor-default"
        )}
      >
        <Icon className="w-4 h-4" />
        {config.label}
        {hasDowngrades && (
          <span className="ml-1 opacity-70">
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        )}
      </button>

      {isOpen && hasDowngrades && (
        <div className="mt-2 p-4 rounded-lg bg-black/40 border border-white/10 text-sm overflow-hidden animate-in fade-in slide-in-from-top-2">
          <h4 className="font-semibold text-white/90 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Why was this downgraded?
          </h4>
          
          {verificationFailures.length > 0 && (
            <div className="mb-3">
              <span className="text-xs text-white/50 uppercase tracking-wider font-mono mb-2 block">Failed Gates & Warnings</span>
              <ul className="space-y-1.5">
                {verificationFailures.map((failure, i) => (
                  <li key={i} className="text-amber-200/90 text-sm flex gap-2 items-start">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {failure}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
