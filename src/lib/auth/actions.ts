import { createClient } from '@/lib/supabase/client';
import type { AppAuthUser } from '@/types/auth';

function hasPublicSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  if (!hasPublicSupabaseEnv()) {
    return {
      error:
        "Google sign-in is not configured for this deployment (missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    };
  }

  let supabase;
  try {
    supabase = createClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initialize Supabase client.";
    return { error: message };
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectTo = `${origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function signOut(): Promise<{ error?: string }> {
  if (!hasPublicSupabaseEnv()) {
    return {};
  }

  let supabase;
  try {
    supabase = createClient();
  } catch {
    return {};
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function getCurrentUser(): Promise<AppAuthUser | null> {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  let supabase;
  try {
    supabase = createClient();
  } catch {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  };
}
