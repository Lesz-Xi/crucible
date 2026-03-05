import React from "react";
import { FalsifierChecklistItem } from "@/types/report-analysis";
import { CheckSquare, Clock } from "lucide-react";

interface FalsifierChecklistProps {
  items: FalsifierChecklistItem[];
}

export function FalsifierChecklist({ items }: FalsifierChecklistProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckSquare className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white/90">Verification Checklist</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
          Falsifiability
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div 
            key={`${item.claimId}-${i}`}
            className="flex flex-col p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-mono px-2 py-1 rounded bg-black/40 text-purple-300">
                Claim {item.claimId.slice(-6)}
              </span>
              <div className="flex items-center gap-1 text-xs text-white/50 bg-black/40 px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                {item.window} Window
              </div>
            </div>
            <p className="text-sm text-white/80 line-clamp-3">
              {item.test}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
