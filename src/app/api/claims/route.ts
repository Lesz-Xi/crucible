import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get('limit') || '20');
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 100)) : 20;
    const sourceFeature = searchParams.get('sourceFeature');
    const sessionId = searchParams.get('sessionId');
    const traceId = searchParams.get('traceId');

    let query = supabase
      .from('claims')
      .select('id, source_feature, claim_kind, status, confidence_score, uncertainty_label, trace_id, session_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sourceFeature) {
      query = query.eq('source_feature', sourceFeature);
    }
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    if (traceId) {
      query = query.eq('trace_id', traceId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, claims: data || [] });
  } catch (error) {
    console.error('[Claims API] List error:', error);
    return NextResponse.json({ success: false, error: 'Failed to list claims' }, { status: 500 });
  }
}
