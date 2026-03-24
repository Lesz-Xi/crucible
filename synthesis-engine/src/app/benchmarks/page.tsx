"use client";

import { BenchmarkDashboard } from '@/components/benchmark-dashboard';

export default function BenchmarksPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-6">
          <a 
            href="/" 
            className="text-xs font-mono text-neutral-500 hover:text-orange-500 transition-colors flex items-center gap-2"
          >
            ← BACK TO SYNTHESIS
          </a>
        </div>
        
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <BenchmarkDashboard />
        </div>
      </div>
    </main>
  );
}
