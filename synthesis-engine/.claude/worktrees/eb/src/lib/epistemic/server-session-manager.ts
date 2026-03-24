
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { KDenseSession, VirtualFile, ChatMessage, ExecutionStep, ExecutionLog, SessionStatus, AgentPersona } from './types';

const BASE_DIR = path.join(process.cwd(), 'data', 'sessions');

export class ServerSessionManager {

  private static getSessionPath(sessionId: string): string {
    return path.join(BASE_DIR, sessionId);
  }

  private static getSessionJsonPath(sessionId: string): string {
    return path.join(this.getSessionPath(sessionId), 'session.json');
  }

  private static getFilesPath(sessionId: string): string {
    return path.join(this.getSessionPath(sessionId), 'files');
  }

  /**
   * Initializes a new persisted session
   */
  static async createSession(title: string = "New Research Audit", persona: AgentPersona = "CriticalRationalist"): Promise<KDenseSession> {
    const id = uuidv4();
    const now = Date.now();
    
    const newSession: KDenseSession = {
      id,
      title,
      status: "initializing_problem",
      persona,
      fileSystem: [], // Rebuilt on load
      messages: [
        {
          id: uuidv4(),
          role: "agent",
          content: "I am ready to perform a rigorous audit. To construct a hard-to-vary explanation, I first need to understand the problem-situation. What specific aspect of the methodology would you like me to scrutinize?",
          timestamp: now
        }
      ],
      plan: [],
      currentStepIndex: 0,
      createdAt: now,
      updatedAt: now
    };

    const sessionDir = this.getSessionPath(id);
    const filesDir = this.getFilesPath(id);

    await fs.mkdir(sessionDir, { recursive: true });
    await fs.mkdir(filesDir, { recursive: true });
    // Create standard subdirectories
    await fs.mkdir(path.join(filesDir, 'workflow'), { recursive: true });
    await fs.mkdir(path.join(filesDir, 'data'), { recursive: true });
    await fs.mkdir(path.join(filesDir, 'results'), { recursive: true });

    await this.saveSessionState(newSession);

    return newSession;
  }

  /**
   * Retrieves a session and dynamically rebuilds the file tree
   */
  static async getSession(id: string): Promise<KDenseSession | null> {
    try {
      const jsonPath = this.getSessionJsonPath(id);
      const data = await fs.readFile(jsonPath, 'utf-8');
      const session = JSON.parse(data) as KDenseSession;

      // Rebuild File System from disk
      const filesDir = this.getFilesPath(id);
      session.fileSystem = await this.buildVirtuaFileTree(filesDir, filesDir);

      return session;
    } catch (error) {
      console.error(`Failed to load session ${id}:`, error);
      return null;
    }
  }

  /**
   * Saves the session metadata (messages, plan, status)
   */
  static async updateSession(id: string, updates: Partial<KDenseSession>): Promise<KDenseSession | null> {
    const session = await this.getSession(id);
    if (!session) return null;

    const updatedSession = { ...session, ...updates, updatedAt: Date.now() };
    await this.saveSessionState(updatedSession);
    return updatedSession;
  }

  /**
   * Adds a message to the session
   */
  static async addMessage(id: string, content: string, role: "user" | "agent"): Promise<KDenseSession | null> {
      const session = await this.getSession(id);
      if(!session) return null;

      const message: ChatMessage = {
          id: uuidv4(),
          role,
          content,
          timestamp: Date.now()
      };

      const updatedMessages = [...session.messages, message];
      
      // Auto-transition logic (mirrors the mock)
      let newStatus = session.status;
      if(session.status === 'initializing_problem' && role === 'user') {
          newStatus = 'calibrating_intent';
      }

      return this.updateSession(id, { messages: updatedMessages, status: newStatus });
  }

  /**
   * Saves an artifact to the session's file system
   * @param internalPath e.g., "workflow/1_epistemologist.json"
   */
  static async saveArtifact(sessionId: string, internalPath: string, content: string | object): Promise<void> {
    const fullPath = path.join(this.getFilesPath(sessionId), internalPath);
    const dir = path.dirname(fullPath);
    
    await fs.mkdir(dir, { recursive: true });

    const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    await fs.writeFile(fullPath, fileContent, 'utf-8');
  }

  // --- Helpers ---

  private static async saveSessionState(session: KDenseSession): Promise<void> {
    const jsonPath = this.getSessionJsonPath(session.id);
    // Don't persist fileSystem array, it's dynamic
    const { fileSystem, ...persistentState } = session; 
    await fs.writeFile(jsonPath, JSON.stringify(persistentState, null, 2), 'utf-8');
  }

  private static async buildVirtuaFileTree(rootDir: string, currentDir: string): Promise<VirtualFile[]> {
    const items = await fs.readdir(currentDir, { withFileTypes: true });
    const virtualFiles: VirtualFile[] = [];

    for (const item of items) {
      if (item.name.startsWith('.')) continue; // skip hidden

      const fullPath = path.join(currentDir, item.name);
      // Remove rootDir from path to get relative path for display
      // e.g. /data/sessions/123/files/workflow -> workflow
      const relativePath = path.relative(rootDir, fullPath); 
      
      const stats = await fs.stat(fullPath);

      if (item.isDirectory()) {
        const children = await this.buildVirtuaFileTree(rootDir, fullPath);
        virtualFiles.push({
          name: item.name,
          type: 'folder',
          path: relativePath,
          size: 0,
          createdAt: stats.birthtimeMs,
          children
        });
      } else {
        virtualFiles.push({
          name: item.name,
          type: 'file',
          path: relativePath,
          size: stats.size,
          createdAt: stats.birthtimeMs
        });
      }
    }

    return virtualFiles;
  }
}
