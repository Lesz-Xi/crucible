import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

    const { data, error } = await supabase.rpc('adopt_legacy_chat_sessions', {
      p_legacy_client_token: legacyClientToken,
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    const adoptedSessions = Number(result?.adopted_sessions || 0);
    const adoptedMessages = Number(result?.adopted_messages || 0);

    return NextResponse.json({
      success: true,
      adoptedSessions,
      adoptedMessages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to adopt legacy sessions';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
