import { AuthReturningClient } from '@/components/auth/AuthReturningClient';

type SearchParams = Promise<{
  next?: string | string[];
}>;

function normalizeSingle(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) return value[0] || null;
  return null;
}

export default async function AuthReturningPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : undefined;
  const rawNext = normalizeSingle(params?.next);
  const nextPath = rawNext && rawNext.startsWith('/') ? rawNext : '/chat';

  return <AuthReturningClient nextPath={nextPath} />;
}
