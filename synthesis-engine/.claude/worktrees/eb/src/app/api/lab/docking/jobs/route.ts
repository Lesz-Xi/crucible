import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ScientificGateway } from '@/lib/services/scientific-gateway';
import { createDockingJob, updateDockingJob } from '@/lib/services/docking-jobs';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { pdbId?: string; smiles?: string; seed?: number } | null;
  const pdbId = body?.pdbId?.trim().toUpperCase();
  const smiles = body?.smiles?.trim();
  const seed = Number(body?.seed ?? 42);

  if (!pdbId || !smiles) {
    return NextResponse.json({ success: false, error: 'pdbId and smiles are required' }, { status: 400 });
  }

  const job = createDockingJob({ userId: user.id, pdbId, smiles, seed });

  // Fire-and-forget execution
  void (async () => {
    updateDockingJob(job.id, { status: 'running' });
    const gateway = ScientificGateway.getInstance();
    const result = await gateway.dockLigand(pdbId, smiles, seed);
    if (result.success) {
      updateDockingJob(job.id, { status: 'succeeded', result: result.data });
    } else {
      updateDockingJob(job.id, { status: 'failed', error: result.error || 'Docking failed' });
    }
  })();

  return NextResponse.json({ success: true, jobId: job.id, status: job.status });
}
