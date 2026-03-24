"use client";

// =============================================================
// LabCopilotActions — Quick action chips under each response
// Spec: Labs-CoPilot_specv2.md §2.4
// =============================================================

import React from "react";
import {
  Dna,
  Atom,
  Search,
  BookmarkPlus,
  MessageSquarePlus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CopilotAnswer } from "@/lib/validations/lab-copilot";

export type QuickAction =
  | "run_sequence_analysis"
  | "run_docking"
  | "fetch_related_structure"
  | "create_notebook_entry"
  | "ask_followup";

interface ActionChip {
  id: QuickAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "default" | "primary" | "accent";
}

const ACTION_CHIPS: ActionChip[] = [
  {
    id: "run_sequence_analysis",
    label: "Run Sequence Analysis",
    icon: Dna,
    variant: "default",
  },
  {
    id: "run_docking",
    label: "Run Docking",
    icon: Atom,
    variant: "default",
  },
  {
    id: "fetch_related_structure",
    label: "Fetch Related Structure",
    icon: Search,
    variant: "default",
  },
  {
    id: "create_notebook_entry",
    label: "Create Notebook Entry",
    icon: BookmarkPlus,
    variant: "accent",
  },
  {
    id: "ask_followup",
    label: "Ask Follow-up",
    icon: MessageSquarePlus,
    variant: "primary",
  },
];

const VARIANT_STYLES: Record<ActionChip["variant"], string> = {
  default:
    "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5",
  primary:
    "border-primary/30 text-primary hover:bg-primary/10",
  accent:
    "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10",
};

interface LabCopilotActionsProps {
  answer: CopilotAnswer;
  onAction: (action: QuickAction, answer: CopilotAnswer) => void;
  loadingAction?: QuickAction | null;
  disabledActions?: QuickAction[];
}

export function LabCopilotActions({
  answer,
  onAction,
  loadingAction,
  disabledActions = [],
}: LabCopilotActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {ACTION_CHIPS.map((chip) => {
        const isLoading = loadingAction === chip.id;
        const isDisabled = disabledActions.includes(chip.id) || !!loadingAction;
        const Icon = chip.icon;

        return (
          <button
            key={chip.id}
            type="button"
            disabled={isDisabled}
            onClick={() => onAction(chip.id, answer)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              VARIANT_STYLES[chip.variant]
            )}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Icon className="w-3 h-3" />
            )}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
