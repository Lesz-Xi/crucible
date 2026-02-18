"use client";

import React, { useEffect } from "react";
import { LabProvider } from "@/lib/contexts/LabContext";
import { LabSidebar } from "@/components/lab/LabSidebar";
import { LabNotebook } from "@/components/lab/LabNotebook";

import { ModelSettingsModal } from "@/components/lab/settings/ModelSettingsModal";

export default function LabLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        document.body.classList.add('liquid-glass-v2', 'lab-glass-system');
        return () => {
            document.body.classList.remove('liquid-glass-v2', 'lab-glass-system');
        };
    }, []);

    return (
        <LabProvider>
            <div className="feature-lab flex h-screen w-full lab-shell overflow-hidden">
                <LabSidebar />
                <main className="flex-1 flex flex-col relative h-full">
                    {/* Main Canvas Area */}
                    <div className="flex-1 relative overflow-hidden">
                        {children}
                    </div>
                    {/* Bottom Notebook Panel */}
                    <LabNotebook />
                </main>
                <ModelSettingsModal />
            </div>
        </LabProvider>
    );
}
