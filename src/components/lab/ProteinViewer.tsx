"use client";

import { useEffect, useRef, useState } from 'react';
import { useLab } from '@/lib/contexts/LabContext';

export function ProteinViewer({ pdbData, structureName }: { pdbData?: string, structureName?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [nglLoaded, setNglLoaded] = useState(false);

    // Dynamic Script Injection for NGL
    useEffect(() => {
        if ((window as any).NGL) {
            setNglLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = "https://unpkg.com/ngl@2.0.0-dev.37/dist/ngl.js";
        script.async = true;
        script.onload = () => setNglLoaded(true);
        document.body.appendChild(script);

        return () => {
            // Cleanup if needed? Usually global NGL is fine.
        };
    }, []);

    // Render Logic
    useEffect(() => {
        if (!nglLoaded || !containerRef.current || !pdbData) {
            setIsLoading(false);
            return;
        }

        const NGL = (window as any).NGL;
        const stage = new NGL.Stage(containerRef.current, { backgroundColor: "black" }); // Or transparent?

        const stringBlob = new Blob([pdbData], { type: 'text/plain' });
        stage.loadFile(stringBlob, { ext: "pdb", defaultRepresentation: true }).then((component: any) => {
            component.addRepresentation("cartoon", { colorScheme: "chainid" });
            component.autoView();
            setIsLoading(false);
        });

        // Resize handler
        const handleResize = () => stage.handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
             window.removeEventListener('resize', handleResize);
             stage.dispose();
        };

    }, [nglLoaded, pdbData]);

    if (!pdbData) {
        return (
             <div className="flex items-center justify-center h-full text-slate-400 font-mono text-sm">
                No structure loaded. Use "fetch_protein_structure" tool.
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-black/20 rounded-xl overflow-hidden border border-white/10">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 text-cyan-400 font-mono text-xs animate-pulse">
                    Initializing NGL Viewer...
                </div>
            )}
             <div ref={containerRef} className="w-full h-full" />
             {structureName && (
                 <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded text-xs text-white font-mono border border-white/10">
                    {structureName}
                 </div>
             )}
        </div>
    );
}
