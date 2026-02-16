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
      <div className="relative min-h-screen w-full overflow-hidden bg-black">
        {/* === ATMOSPHERIC BACKGROUND LAYER (Apple Liquid Glass Support) === */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            {/* Deep gradient base */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f1115] via-[#13161c] to-[#0f1115]" />
            
            {/* Subtle Orbs for Glass Effect Reflection */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[8000ms]" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[60vw] h-[60vw] bg-teal-900/10 rounded-full blur-[100px] mix-blend-screen" />
            
            {/* Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.03] subpixel-antialiased mix-blend-overlay"
                 style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'1\'/%3E%3C/svg%3E")' }} 
            />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 w-full h-full">
          <Suspense fallback={<div className="lab-shell min-h-screen bg-transparent" />}>
            <ChatWorkbenchV2 />
          </Suspense>
        </div>
      </div>
    );
  }

  return <ChatLegacyView />;
}
