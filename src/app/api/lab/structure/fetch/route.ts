import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ScientificGateway } from '@/lib/services/scientific-gateway';

type ProteinSource = 'rcsb' | 'alphafold';

const PDB_ID_REGEX = /^[A-Z0-9]{4}$/;
const UNIPROT_ACCESSION_REGEX = /^(?:[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9](?:[A-Z][A-Z0-9]{2}[0-9]){1,2})$/i;

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { identifier?: string; source?: ProteinSource } | null;
  const source: ProteinSource = body?.source === 'alphafold' ? 'alphafold' : 'rcsb';
  const rawInput = body?.identifier?.trim();

  if (!rawInput) {
    return NextResponse.json({ success: false, error: 'identifier is required' }, { status: 400 });
  }

  const gateway = ScientificGateway.getInstance();
  let resolvedId = rawInput.toUpperCase();

  if (source === 'rcsb' && !PDB_ID_REGEX.test(resolvedId)) {
    const resolved = await gateway.resolvePdbId(rawInput);
    if (!resolved.success || !resolved.pdbId) {
      return NextResponse.json({ success: false, error: resolved.error || 'Could not resolve PDB ID' }, { status: 404 });
    }
    resolvedId = resolved.pdbId;
  }

  if (source === 'alphafold' && !UNIPROT_ACCESSION_REGEX.test(resolvedId)) {
    const resolved = await gateway.resolveUniProtAccession(rawInput);
    if (!resolved.success || !resolved.accession) {
      return NextResponse.json({ success: false, error: resolved.error || 'Could not resolve UniProt accession' }, { status: 404 });
    }
    resolvedId = resolved.accession;
  }

  const result = source === 'rcsb'
    ? await gateway.fetchProteinStructure(resolvedId)
    : await gateway.fetchAlphaFoldStructure(resolvedId);

  if (!result.success || !result.data) {
    return NextResponse.json({ success: false, error: result.error || 'Failed to fetch structure' }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    data: {
      source,
      resolvedId,
      content: result.data,
    },
  });
}
