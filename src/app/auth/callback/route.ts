import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextParam = requestUrl.searchParams.get('next');
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/chat';
  const providerError = requestUrl.searchParams.get('error');
  const providerErrorDescription = requestUrl.searchParams.get('error_description');

  const buildAuthRedirect = (message: string) => {
    const authUrl = new URL('/auth', request.url);
    authUrl.searchParams.set('next', next);
    authUrl.searchParams.set('error', message);
    return NextResponse.redirect(authUrl);
  };

  if (providerError) {
    const message = providerErrorDescription || 'Google sign-in was interrupted. Please try again.';
    return buildAuthRedirect(message);
  }

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'We could not complete the sign-in exchange. Please try again.';
      return buildAuthRedirect(message);
    }
  } else {
    return buildAuthRedirect('No authorization code was returned by Google. Please try again.');
  }

  const returningUrl = new URL('/auth/returning', request.url);
  returningUrl.searchParams.set('next', next);

  return NextResponse.redirect(returningUrl);
}
