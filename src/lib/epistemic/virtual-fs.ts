import { VirtualFile } from "./types";

/**
 * A lightweight in-memory file system to mimic a persistent session directory.
 * In a real production app, this would verify against S3 or a real EFS.
 */
export class VirtualFileSystem {
  private root: VirtualFile[] = [];

  constructor(initialState: VirtualFile[] = []) {
    this.root = initialState;
    
    // Ensure default directories exist
    this.ensureDirectory("data");
    this.ensureDirectory("results");
    this.ensureDirectory("workflow");
  }

  getTree(): VirtualFile[] {
    return this.root;
  }

  /**
   * Create or update a file at a specific path
   * e.g., "results/extracted_data.json"
   */
  writeFile(path: string, content: string): VirtualFile {
    const parts = path.split("/");
    const fileName = parts.pop()!;
    const dirPath = parts.join("/");

    // Simple handling for 1 level deep for now, can expand to recursive later
    let targetDir = this.root;
    if (dirPath) {
      const dir = this.findDirectory(dirPath);
      if (dir && dir.children) {
        targetDir = dir.children;
      } else {
        // Create if missing
        const newDir = this.createDirectory(dirPath);
        targetDir = newDir.children!;
      }
    }

    // Check if file exists to update
    const existingIndex = targetDir.findIndex(f => f.name === fileName && f.type === "file");
    const now = Date.now();

    const newFile: VirtualFile = {
      name: fileName,
      type: "file",
      content,
      size: new TextEncoder().encode(content).length,
      path,
      createdAt: now,
      mimeType: this.guessMimeType(fileName)
    };

    if (existingIndex >= 0) {
      targetDir[existingIndex] = { ...targetDir[existingIndex], ...newFile };
    } else {
      targetDir.push(newFile);
    }

    return newFile;
  }

  ensureDirectory(name: string): VirtualFile {
    const existing = this.root.find(f => f.name === name && f.type === "folder");
    if (existing) return existing;
    return this.createDirectory(name);
  }

  createDirectory(name: string): VirtualFile {
    const dir: VirtualFile = {
      name,
      type: "folder",
      path: name,
      size: 0,
      children: [],
      createdAt: Date.now()
    };
    this.root.push(dir);
    return dir;
  }

  private findDirectory(name: string): VirtualFile | undefined {
    return this.root.find(f => f.name === name && f.type === "folder");
  }

  private guessMimeType(filename: string): string {
    if (filename.endsWith(".json")) return "application/json";
    if (filename.endsWith(".md")) return "text/markdown";
    if (filename.endsWith(".pdf")) return "application/pdf";
    return "text/plain";
  }
}
