"use client";

import React from "react";
import { cn } from "@/lib/utils";

// =============================================================
// LabSkeleton — Loading skeletons for Bio-Computation Lab views
// GAP-3 Step 5: Loading Skeletons
// =============================================================

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-white/10 border border-white/10",
        className
      )}
      aria-hidden="true"
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4" aria-label="Loading dashboard…" role="status">
      {/* Header pill */}
      <SkeletonBlock className="h-10 w-64 mx-auto" />
      {/* Instruments rail */}
      <SkeletonBlock className="h-24 w-full" />
      {/* Tool cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-32" />
        ))}
      </div>
      {/* Recent experiments */}
      <SkeletonBlock className="h-6 w-40" />
      {Array.from({ length: 2 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-20" />
      ))}
    </div>
  );
}

export function BuilderSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4" aria-label="Loading builder…" role="status">
      <SkeletonBlock className="h-10 w-48 mx-auto" />
      <SkeletonBlock className="h-40 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-10" />
      </div>
      <SkeletonBlock className="h-24 w-full" />
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4" aria-label="Loading history…" role="status">
      <SkeletonBlock className="h-8 w-32" />
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-16" />
      ))}
    </div>
  );
}
