import { createClient } from '@/lib/supabase/client';
import type { AppAuthUser } from '@/types/auth';

export function hasPublicSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function signInWithGoogle(nextPathOverride?: string): Promise<{ error?: string }> {
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
  const nextPath =
    typeof nextPathOverride === 'string' && nextPathOverride.startsWith('/')
      ? nextPathOverride
      : typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : '/chat';
  const redirectUrl = new URL('/auth/callback', origin);
  redirectUrl.searchParams.set('next', nextPath.startsWith('/') ? nextPath : '/chat');
  const redirectTo = redirectUrl.toString();

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

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  if (!hasPublicSupabaseEnv()) {
    return { error: "Authentication is not configured for this deployment." };
  }

  let supabase;
  try {
    supabase = createClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initialize Supabase client.";
    return { error: message };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string,
): Promise<{ error?: string; needsConfirmation?: boolean }> {
  if (!hasPublicSupabaseEnv()) {
    return { error: "Authentication is not configured for this deployment." };
  }

  let supabase;
  try {
    supabase = createClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initialize Supabase client.";
    return { error: message };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName ?? '' },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // User already exists (Supabase returns a fake user with no identities)
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: 'An account with this email already exists. Please sign in.' };
  }

  // Email confirmation required
  if (!data.session) {
    return { needsConfirmation: true };
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
