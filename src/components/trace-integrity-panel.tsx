'use client';

import React from 'react';
import { Shield, Hash, Key, CheckCircle2 } from 'lucide-react';

/**
 * TraceIntegrityPanel
 * 
 * Phase 1 Frontend Shell (Mock Data)
 * Displays synthesis provenance metadata:
 * - Session UUID (UUIDv7)
 * - Input Hashes (SHA-256)
 * - Seed Value (for determinism)
 * 
 * Wabi-Sabi Integration:
 * - Monospaced font for UUIDs/hashes (technical aesthetic)
 * - Subtle glass-card transparency
 * - Warm color accents for verification states
 * 
 * Backend Dependency: Phase 2 SSE event 'trace_manifest'
 */

interface TraceIntegrityData {
  sessionUUID: string;
  inputHashes: Array<{ name: string; hash: string }>;
  seedValue: number | null;
  timestamp: string;
}

export const TraceIntegrityPanel: React.FC<{ data?: TraceIntegrityData }> = ({ data }) => {
  // Mock data for Phase 1 design validation
  const mockData: TraceIntegrityData = {
    sessionUUID: '018d3e5a-7b2f-7890-a1b2-c3d4e5f67890',
    inputHashes: [
      { name: 'paper_1.pdf', hash: 'a3f5c9d2e1b4f8a7c6d5e3b2f1a9c8d7e6f5a4b3c2d1e0' },
      { name: 'paper_2.pdf', hash: 'b4e6d3f2a1c5b9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3' },
    ],
    seedValue: 42,
    timestamp: new Date().toISOString(),
  };

  const displayData = data || mockData;

  return (
    <div className="bg-glass-card backdrop-blur-md border border-wabi-sand/20 rounded-lg p-6 shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-wabi-emerald/10 rounded-lg">
          <Shield className="w-5 h-5 text-wabi-emerald" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-wabi-charcoal dark:text-wabi-sand">
            Trace Integrity
          </h3>
          <p className="text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60">
            Provenance Manifest
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Session UUID */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-wabi-rust" />
            <span className="text-sm font-medium text-wabi-charcoal dark:text-wabi-sand">
              Session ID
            </span>
          </div>
          <div className="bg-wabi-charcoal/5 dark:bg-wabi-sand/5 rounded-md p-3 border border-wabi-sand/10">
            <code className="text-xs font-mono text-wabi-rust break-all">
              {displayData.sessionUUID}
            </code>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-wabi-emerald">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>UUIDv7 Verified</span>
          </div>
        </div>

        {/* Input Hashes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-wabi-rust" />
            <span className="text-sm font-medium text-wabi-charcoal dark:text-wabi-sand">
              Input Hashes
            </span>
            <span className="text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60">
              (SHA-256)
            </span>
          </div>
          <div className="space-y-3">
            {displayData.inputHashes.map((input, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="text-xs font-medium text-wabi-charcoal/80 dark:text-wabi-sand/80">
                  {input.name}
                </div>
                <div className="bg-wabi-charcoal/5 dark:bg-wabi-sand/5 rounded-md p-2.5 border border-wabi-sand/10">
                  <code className="text-[10px] font-mono text-wabi-charcoal/70 dark:text-wabi-sand/70 break-all leading-relaxed">
                    {input.hash}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seed Value */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-wabi-rust/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-wabi-rust" />
            </div>
            <span className="text-sm font-medium text-wabi-charcoal dark:text-wabi-sand">
              Deterministic Seed
            </span>
          </div>
          <div className="bg-wabi-charcoal/5 dark:bg-wabi-sand/5 rounded-md p-3 border border-wabi-sand/10">
            <code className="text-sm font-mono font-semibold text-wabi-rust">
              {displayData.seedValue}
            </code>
          </div>
          <p className="text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60 italic">
            Enables synthesis replay and verification
          </p>
        </div>

        {/* Timestamp */}
        <div className="pt-4 border-t border-wabi-sand/10">
          <div className="text-xs text-wabi-charcoal/50 dark:text-wabi-sand/50">
            Manifest Generated: {new Date(displayData.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
