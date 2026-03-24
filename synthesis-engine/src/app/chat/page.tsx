"use client";

import { Suspense, useEffect } from "react";
import { ChatWorkbenchV2 } from "@/components/causal-chat/ChatWorkbenchV2";
import { bootstrapHistoryRecovery } from "@/lib/migration/history-import-bootstrap";

export default function ChatPage() {
  useEffect(() => {
    void bootstrapHistoryRecovery();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[var(--lab-bg)] text-[var(--lab-text-primary)]">
      <Suspense fallback={<div className="lab-shell min-h-screen" />}>
        <ChatWorkbenchV2 />
      </Suspense>
    </div>
  );
}
