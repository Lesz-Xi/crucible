"use client";

import { useEffect, useState } from "react";
import { CausalChatInterface } from "@/components/causal-chat/CausalChatInterface";
import { ChatLayout } from "@/components/causal-chat/ChatLayout";
import { ChatWorkbenchV2 } from "@/components/causal-chat/ChatWorkbenchV2";
import { bootstrapHistoryRecovery } from "@/lib/migration/history-import-bootstrap";
import { resolveUiFlags } from "@/lib/config/ui-flags";

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
  const [useV2, setUseV2] = useState(false);

  useEffect(() => {
    void bootstrapHistoryRecovery();
    setUseV2(resolveUiFlags().autoSciLayoutV2);
  }, []);

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

  if (useV2) {
    return <ChatWorkbenchV2 onLoadSession={handleLoadSession} onNewChat={handleNewChat} />;
  }

  return <ChatLegacyView />;
}
