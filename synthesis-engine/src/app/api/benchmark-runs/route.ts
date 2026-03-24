// Benchmark Runs List API Route
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // Auto-cleanup stale benchmarks (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await supabase
      .from('benchmark_runs')
      .update({ 
        status: 'failed', 
        error_message: 'Process timeout or interrupted' 
      })
      .eq('status', 'running')
      .lt('created_at', oneHourAgo);

    const { data, error } = await supabase
      .from('benchmark_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Failed to fetch benchmark runs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch benchmark runs' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ runs: data || [] });
    
  } catch (error) {
    console.error('Benchmark runs API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
