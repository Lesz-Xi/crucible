"use client";

import React from "react";
import { LabProvider } from "@/lib/contexts/LabContext";
import { LabNotebook } from "@/components/lab/LabNotebook";
import { WorkbenchShell } from "@/components/workbench/WorkbenchShell";

export default function LabLayout({ children }: { children: React.ReactNode }) {
    return (
        <LabProvider>
            <WorkbenchShell
                feature="lab"
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
