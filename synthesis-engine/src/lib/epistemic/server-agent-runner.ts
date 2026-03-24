
import { v4 as uuidv4 } from 'uuid';
import { ServerSessionManager } from './server-session-manager';
import { KDenseSession, ExecutionStep } from './types';

export class ServerAgentRunner {
  
  /**
   * Processes a user message and triggers the agent's cognitive loop
   */
  static async processTurn(sessionId: string, userMessage: string) {
    // 1. Add User Message
    const session = await ServerSessionManager.addMessage(sessionId, userMessage, "user");
    if (!session) throw new Error("Session not found");

    // 2. Determine Agent Action (State Machine)
    // Simulating "thinking" time could be done via queue, but for now we run directly
    await this.runCognitiveStep(session);
  }

  private static async runCognitiveStep(session: KDenseSession) {
    let responseText = "I acknowledge that.";
    let nextStatus = session.status;
    let shouldUpdatePlan = false;

    // --- State Machine Logic ---

    if (session.status === "calibrating_intent") {
       responseText = "Excellent. To ensure our theory is hard-to-vary, I propose a strict 3-step refutation process. Shall I generate the conjecture plan now?";
       // Transitions to 'generating_conjecture' on next user 'yes' (simplified here: manual transition for demo flow)
       // For this demo, we'll assume the user said "yes" and just wait for the explicit command or infer it.
       // Actually, the frontend mock transitioned based on status.
       // Let's assume the user's message triggers the NEXT state if meaningful.
       // For safety, we keep the user in 'calibrating_intent' untill they agree.
       // If user says "yes" or "proceed", we move to generating.
       if (session.messages.at(-1)?.content.toLowerCase().includes("yes") || 
           session.messages.at(-1)?.content.toLowerCase().includes("proceed")) {
           nextStatus = "generating_conjecture";
       }

    } else if (session.status === "generating_conjecture") {
       // ACTION: Generate the Plan & Persist it
       await this.generateAndPersistPlan(session.id);
       
       responseText = "I have conjectured an execution plan. Please review the criticism steps in the center panel.";
       nextStatus = "executing"; // User confirms execution next
       shouldUpdatePlan = true;

    } else if (session.status === "executing" || session.status === "error_correction") {
       responseText = "Proceeding with error correction (execution)...";
       await this.startExecution(session.id);
       nextStatus = "error_correction"; 
       shouldUpdatePlan = true;
    }

    // 3. Add Agent Response
    await ServerSessionManager.addMessage(session.id, responseText, "agent");
    
    // 4. Update Status if changed
    if (nextStatus !== session.status) {
        await ServerSessionManager.updateSession(session.id, { status: nextStatus });
    }
  }

  private static async generateAndPersistPlan(sessionId: string) {
      // Create the plan structure
      const steps: ExecutionStep[] = [
      {
        id: uuidv4(),
        order: 1,
        label: "Phenomenon Observation",
        status: "pending",
        logs: [],
        artifacts: ["data/equations.json"]
      },
      {
        id: uuidv4(),
        order: 2,
        label: "Computability Check",
        status: "pending",
        logs: [],
        artifacts: ["results/verification.md"]
      },
      {
        id: uuidv4(),
        order: 3,
        label: "Criticism & Refutation",
        status: "pending",
        logs: [],
        artifacts: ["workflow/critique.json"]
      },
      {
        id: uuidv4(),
        order: 4,
        label: "Hard-to-Vary Explanation",
        status: "pending",
        logs: [],
        artifacts: ["results/final_report.pdf"]
      }
    ];

    await ServerSessionManager.updateSession(sessionId, { plan: steps });

    // Persist placeholder artifacts so they appear in file tree
    await ServerSessionManager.saveArtifact(sessionId, "data/equations.json", {
        type: "equations",
        extracted: ["E = mc^2", "pV = nRT"]
    });
    
    await ServerSessionManager.saveArtifact(sessionId, "results/verification.md", "# Verification\n\nAll checks passed.");
  }

  private static async startExecution(sessionId: string) {
      // Simulate starting the first step
      const session = await ServerSessionManager.getSession(sessionId);
      if(!session || session.plan.length === 0) return;

      const newPlan = [...session.plan];
      if(newPlan[0]) {
          newPlan[0].status = "running";
          newPlan[0].logs.push({
            id: uuidv4(),
            timestamp: Date.now(),
            type: "system",
            message: "Observation started (Server)"
          });
      }

      await ServerSessionManager.updateSession(sessionId, { plan: newPlan });

      // Simulate async completion of step 1 (fire and forget for this turn)
      this.simulateAsyncStepCompletion(sessionId, newPlan[0].id);
  }

  private static async simulateAsyncStepCompletion(sessionId: string, stepId: string) {
      // This would normally be a real job queue
      await new Promise(r => setTimeout(r, 2000));
      
      const session = await ServerSessionManager.getSession(sessionId);
      if(!session) return;

      const newPlan = [...session.plan];
      const step = newPlan.find(s => s.id === stepId);
      if(step) {
          step.status = "completed";
          step.logs.push({
             id: uuidv4(),
             timestamp: Date.now(),
             type: "system",
             message: "Step completed successfully."
          });
      }
      
      await ServerSessionManager.updateSession(sessionId, { plan: newPlan });
  }
}
