import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isSupabaseConfigured} from '@/lib/supabase/config';

export async function GET(request:NextRequest) {
  const url=new URL(request.url);
  const code=url.searchParams.get('code');
  const next=url.searchParams.get('next');
  // Only accept an explicitly allowlisted internal path; no open redirects.
  const destination=next==='/admin/reset-password'?next:'/admin';
  if(code && isSupabaseConfigured()) {
    const supabase=await createClient();
    const {error}=await supabase.auth.exchangeCodeForSession(code);
    if(!error) return NextResponse.redirect(new URL(destination, url.origin));
  }
  return NextResponse.redirect(new URL('/admin/login?error=link_expired',url.origin));
}
