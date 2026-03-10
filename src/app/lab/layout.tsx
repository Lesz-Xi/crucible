"use client";

import React from "react";
import { LabProvider } from "@/lib/contexts/LabContext";
import { LabNotebook } from "@/components/lab/LabNotebook";
import { WorkbenchShell } from "@/components/workbench/WorkbenchShell";
import type { WorkbenchEvidenceRailConfig } from "@/types/workbench";

const defaultLabRail: WorkbenchEvidenceRailConfig = {
    subtitle: "Live posture and provenance",
    live: false,
    causalDensity: {
        activeLevel: null,
        status: "Awaiting scored output",
    },
    alignmentPosture: {
        tone: "neutral",
        text: "No auditable posture has been emitted for this surface yet.",
    },
    modelProvenance: {
        title: "unavailable",
        text: "No verified model provenance was emitted for this run.",
    },
    activeDomain: {
        label: "lab",
    },
    scientificEvidence: [],
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
    return (
        <LabProvider>
            <WorkbenchShell
                feature="lab"
                evidenceRail={defaultLabRail}
                mainMode="report"
                mainContent={
                    <div className="feature-lab flex min-h-full w-full lab-shell overflow-hidden">
                        <main className="flex-1 flex flex-col relative min-h-full">
                            <div className="flex-1 relative overflow-hidden">
                                {children}
                            </div>
                        </main>
                    </div>
                }
                inputArea={<LabNotebook />}
            />
        </LabProvider>
    );
}
