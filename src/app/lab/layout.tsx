"use client";

import React from "react";
import { LabProvider } from "@/lib/contexts/LabContext";
import { LabSidebar } from "@/components/lab/LabSidebar";
import { LabNotebook } from "@/components/lab/LabNotebook";

export default function LabLayout({ children }: { children: React.ReactNode }) {
    return (
        <LabProvider>
            <div className="flex h-screen w-full lab-shell overflow-hidden">
                <LabSidebar />
                <main className="flex-1 flex flex-col relative h-full">
                    {/* Main Canvas Area */}
                    <div className="flex-1 relative overflow-hidden">
                        {children}
                    </div>
                    {/* Bottom Notebook Panel */}
                    <LabNotebook />
                </main>
            </div>
        </LabProvider>
    );
}
