import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { fetchContent } from '@/lib/content-server';
import AdminConsole from '@/components/admin/admin-console';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title:'Website Management | Melody', robots:{index:false,follow:false} };

export default async function AdminPage() {
  if (!isSupabaseConfigured()) return <main className="flex min-h-screen items-center justify-center bg-background px-5">
    <div className="admin-panel max-w-xl space-y-5 p-9"><h1 className="font-display text-4xl">Connect Supabase to activate the CMS.</h1>
    <p className="text-muted-foreground">Your public website is available in preview mode. The dashboard remains locked until you create a Supabase project, run the included SQL migration, and configure the environment variables.</p>
    <p className="text-sm text-muted-foreground">Open <code>SETUP_SUPABASE.md</code> in the downloaded project for the step-by-step beginner guide.</p>
    <Link href="/" className="admin-button admin-primary">← Return to website</Link></div>
  </main>;
  const client = await createClient();
  const {data:{user},error} = await client.auth.getUser();
  if (error || !user) redirect('/admin/login');
  const {data:role,error:roleError} = await client.from('user_roles').select('role').eq('user_id',user.id).eq('role','admin').maybeSingle();
  if (roleError || !role) return <main className="flex min-h-screen items-center justify-center px-5"><div className="admin-panel max-w-lg space-y-4 p-8"><h1 className="font-display text-3xl">Access not approved</h1><p className="text-muted-foreground">Your email is signed in, but it has not been granted administrator permission. Follow step 6 of SETUP_SUPABASE.md to assign the owner&apos;s account.</p><Link href="/admin/login" className="admin-button admin-secondary">Sign in with another account</Link></div></main>;
  try {
    const data = await fetchContent(client);
    return <AdminConsole key={user.id} initial={data} email={user.email||''}/>;
  } catch(e) {
    return <main className="mx-auto max-w-2xl px-5 py-20"><h1 className="font-display text-4xl">Database setup needed</h1><p className="mt-4 text-muted-foreground">{e instanceof Error?e.message:'Unable to read site content.'}</p><p className="mt-4 text-muted-foreground">Run the entire migration in Supabase SQL Editor and reload this page.</p></main>;
  }
}
