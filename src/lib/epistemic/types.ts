export type SessionStatus = "initializing_problem" | "calibrating_intent" | "generating_conjecture" | "executing" | "error_correction" | "theory_stabilized" | "failed";

export type AgentPersona = "Methodologist" | "Skeptic" | "Synthesizer" | "Reviewer" | "CriticalRationalist";

export interface VirtualFile {
  name: string;
  type: "file" | "folder";
  content?: string; // For text/md/json files
  size: number;
  path: string;
  parentId?: string;
  children?: VirtualFile[]; // For folders
  mimeType?: string;
  createdAt: number;
}

export interface ExecutionLog {
  id: string;
  timestamp: number;
  stepId?: string;
  type: "thought" | "action" | "system" | "error";
  message: string;
  metadata?: any;
}

export interface ExecutionStep {
  id: string;
  order: number;
  label: string; // e.g., "Dialectical Analysis"
  description?: string; // e.g., "Extract claims and detect contradictions"
  status: "pending" | "running" | "completed" | "failed";
  logs: ExecutionLog[];
  artifacts: string[]; // Paths to files created during this step
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface KDenseSession {
  id: string;
  title: string;
  status: SessionStatus;
  persona: AgentPersona;
  
  // File System State
  fileSystem: VirtualFile[]; // Root level items
  
  // Interaction State
  messages: ChatMessage[];
  
  // Execution State
  plan: ExecutionStep[];
  currentStepIndex: number;
  
  createdAt: number;
  updatedAt: number;
}
