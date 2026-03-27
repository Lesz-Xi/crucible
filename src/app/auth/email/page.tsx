import type { Metadata } from 'next';
import { AuthVintage } from '@/components/auth/AuthVintage';

export const metadata: Metadata = {
  title: 'Email Access',
  description: 'Email sign-in and account creation fallback for the Wu-Weism workspace.',
};

type SearchParams = Promise<{
  next?: string | string[];
  error?: string | string[];
}>;

function hasAuthEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function normalizeSingle(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) return value[0] || null;
  return null;
}

export default async function AuthEmailPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : undefined;
  const rawNext = normalizeSingle(params?.next);
  const rawError = normalizeSingle(params?.error);
  const nextPath = rawNext && rawNext.startsWith('/') ? rawNext : '/chat';

  return (
    <AuthVintage
      nextPath={nextPath}
      callbackError={rawError}
      authConfigured={hasAuthEnv()}
    />
  );
}
