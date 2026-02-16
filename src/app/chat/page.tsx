"use client";

import { Suspense, useEffect, useState } from "react";
import { CausalChatInterface } from "@/components/causal-chat/CausalChatInterface";
import { ChatLayout } from "@/components/causal-chat/ChatLayout";
import { ChatWorkbenchV2 } from "@/components/causal-chat/ChatWorkbenchV2";
import { bootstrapHistoryRecovery } from "@/lib/migration/history-import-bootstrap";

function ChatLegacyView() {
  const handleLoadSession = async (sessionId: string) => {
    window.dispatchEvent(
      new CustomEvent("loadSession", {
        detail: { sessionId },
      })
    );
  };

  const handleNewChat = () => {
    window.dispatchEvent(new Event("newChat"));
  };

  return (
    <ChatLayout onLoadSession={handleLoadSession} onNewChat={handleNewChat}>
      <CausalChatInterface />
    </ChatLayout>
  );
}

export default function ChatPage() {
  const [useV2, setUseV2] = useState(true);

  useEffect(() => {
    void bootstrapHistoryRecovery();
    setUseV2(true);

    document.body.classList.add("chat-theme-shell");
    return () => {
      document.body.classList.remove("chat-theme-shell");
    };
  }, []);

  if (useV2) {
    return (
      <Suspense fallback={<div className="lab-shell min-h-screen" />}>
        <ChatWorkbenchV2 />
      </Suspense>
    );
  }

  return <ChatLegacyView />;
}
