"use client";

import { CausalChatInterface } from "@/components/causal-chat/CausalChatInterface";
import { ChatLayout } from "@/components/causal-chat/ChatLayout";

export default function ChatPage() {
  // This function will be passed down to both components
  const handleLoadSession = async (sessionId: string) => {
    // This triggers the load - implementation is actually in CausalChatInterface
    // We use a ref to call the child's method
    console.log('[ChatPage] Requesting session load:', sessionId);
    
    // Send custom event that CausalChatInterface can listen to
    window.dispatchEvent(new CustomEvent('loadSession', { 
      detail: { sessionId } 
    }));
  };

  // Handle starting a new chat
  const handleNewChat = () => {
    console.log('[ChatPage] Requesting new chat');
    window.dispatchEvent(new Event('newChat'));
  };

  return (
    <ChatLayout onLoadSession={handleLoadSession} onNewChat={handleNewChat}>
       <CausalChatInterface />
    </ChatLayout>
  );
}
