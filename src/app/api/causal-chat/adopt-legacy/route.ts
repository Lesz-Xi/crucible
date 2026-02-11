import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServerSupabaseAdminClient } from '@/lib/supabase/server-admin';

interface LegacyAdoptionRequest {
  legacyClientToken?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as LegacyAdoptionRequest;
    const legacyClientToken = String(payload.legacyClientToken || '').trim();

    if (!legacyClientToken) {
      return NextResponse.json({ success: false, error: 'legacyClientToken is required' }, { status: 400 });
    }

    let adminClient;
    try {
      adminClient = createServerSupabaseAdminClient();
    } catch {
      return NextResponse.json(
        { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is required for legacy adoption.' },
        { status: 500 }
      );
    }

    const { data: sessions, error: sessionReadError } = await adminClient
      .from('causal_chat_sessions')
      .select('id')
      .is('user_id', null)
      .eq('legacy_client_token', legacyClientToken);

    if (sessionReadError) {
      return NextResponse.json({ success: false, error: sessionReadError.message }, { status: 500 });
    }

    const sessionIds = (sessions || []).map((row) => row.id as string);
    if (sessionIds.length === 0) {
      return NextResponse.json({ success: true, adoptedSessions: 0, adoptedMessages: 0 });
    }

    const { error: updateError } = await adminClient
      .from('causal_chat_sessions')
      .update({ user_id: user.id, updated_at: new Date().toISOString() })
      .in('id', sessionIds)
      .is('user_id', null)
      .eq('legacy_client_token', legacyClientToken);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    const { count: adoptedMessages, error: messageCountError } = await adminClient
      .from('causal_chat_messages')
      .select('id', { head: true, count: 'exact' })
      .in('session_id', sessionIds);

    if (messageCountError) {
      return NextResponse.json({ success: false, error: messageCountError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      adoptedSessions: sessionIds.length,
      adoptedMessages: adoptedMessages || 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to adopt legacy sessions';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
