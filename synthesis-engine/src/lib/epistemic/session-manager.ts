import { KDenseSession } from "./types";

export class SessionManager {
  
  static async createSession(title: string = "New Research Audit"): Promise<KDenseSession> {
    const res = await fetch("/api/epistemic/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, persona: "CriticalRationalist" })
    });
    
    if (!res.ok) throw new Error("Failed to create session");
    return res.json();
  }

  static async getSession(id: string): Promise<KDenseSession | null> {
    const res = await fetch(`/api/epistemic/session/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  static async addMessage(sessionId: string, content: string, role: "user" | "agent"): Promise<KDenseSession> {
    // For user messages, we hit the chat endpoint which triggers the agent
    if (role === "user") {
        const res = await fetch("/api/epistemic/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, content })
        });
        if (!res.ok) throw new Error("Failed to send message");
        
        // Return latest state immediately
        const session = await this.getSession(sessionId);
        if (!session) throw new Error("Session lost");
        return session;
    } 
    
    // For manual agent message injection (if needed clientside, though rare now)
    // We treat it as just a refresh or ignore since server handles agent
    const session = await this.getSession(sessionId);
    if (!session) throw new Error("Session lost");
    return session;
  }

  // Polling helper
  static async refreshSession(id: string): Promise<KDenseSession | null> {
      return this.getSession(id);
  }
}

