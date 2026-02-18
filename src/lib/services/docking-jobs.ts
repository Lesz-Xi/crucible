export type DockingJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface DockingJob {
  id: string;
  userId: string;
  pdbId: string;
  smiles: string;
  seed: number;
  status: DockingJobStatus;
  createdAt: string;
  updatedAt: string;
  result?: any;
  error?: string;
}

const jobs = new Map<string, DockingJob>();

export function createDockingJob(input: Pick<DockingJob, 'userId' | 'pdbId' | 'smiles' | 'seed'>): DockingJob {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const job: DockingJob = {
    id,
    userId: input.userId,
    pdbId: input.pdbId,
    smiles: input.smiles,
    seed: input.seed,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(id, job);
  return job;
}

export function getDockingJob(id: string): DockingJob | null {
  return jobs.get(id) ?? null;
}

export function updateDockingJob(id: string, patch: Partial<DockingJob>): DockingJob | null {
  const current = jobs.get(id);
  if (!current) return null;
  const next: DockingJob = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  jobs.set(id, next);
  return next;
}
