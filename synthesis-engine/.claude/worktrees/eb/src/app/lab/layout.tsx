"use client";

import React, { useEffect } from "react";
import { LabProvider } from "@/lib/contexts/LabContext";
import { LabNotebook } from "@/components/lab/LabNotebook";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";

export default function LabLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        document.body.classList.add('liquid-glass-v2', 'lab-glass-system');
        return () => {
            document.body.classList.remove('liquid-glass-v2', 'lab-glass-system');
        };
    }, []);

    return (
        <LabProvider>
            <AppDashboardShell>
                <div className="feature-lab flex h-screen w-full lab-shell overflow-hidden">
                    <main className="flex-1 flex flex-col relative h-full">
                        <div className="flex-1 relative overflow-hidden">
                            {children}
                        </div>
                        <LabNotebook />
                    </main>
                </div>
            </AppDashboardShell>
        </LabProvider>
    );
}
