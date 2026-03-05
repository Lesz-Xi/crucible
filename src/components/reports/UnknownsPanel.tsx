import React from "react";
import { HelpCircle, AlertOctagon } from "lucide-react";

interface UnknownsPanelProps {
  unknowns: string[];
}

export function UnknownsPanel({ unknowns }: UnknownsPanelProps) {
  if (!unknowns || unknowns.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertOctagon className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-semibold text-white/90">Latent Unknowns & Gaps</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/20">
          {unknowns.length} Identified
        </span>
      </div>

      <div className="space-y-2">
        {unknowns.map((unknown, i) => (
          <div 
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg border border-orange-500/10 bg-orange-500/5 hover:bg-orange-500/10 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-orange-100/80 leading-relaxed">
              {unknown}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
