'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LockKeyhole, Mail, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export default function AdminLogin() {
  const router = useRouter();
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [visible,setVisible] = useState(false);
  const [forgot,setForgot] = useState(false);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  useEffect(() => { if (new URLSearchParams(window.location.search).get('error')==='link_expired') setError('That password-reset link is invalid or expired. Please request a new one.'); }, []);

  async function submit(e:FormEvent) {
    e.preventDefault(); setError('');setMessage('');
    if (!isSupabaseConfigured()) return setError('Supabase is not connected. Follow SETUP_SUPABASE.md.');
    setBusy(true);
    try {
      const supabase=createClient();
      if (forgot) {
        const {error} = await supabase.auth.resetPasswordForEmail(email,{
          redirectTo:`${window.location.origin}/auth/callback?next=/admin/reset-password`,
        });
        if(error) throw error;
        setMessage('If this email belongs to an account, a password-reset link has been sent. Check your inbox and spam folder.');
      } else {
        const {error} = await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        router.replace('/admin');router.refresh();
      }
    } catch(err) {setError(err instanceof Error?err.message:'Something went wrong.');}
    finally {setBusy(false);}
  }

  return <main className="flex min-h-screen flex-col justify-center bg-background px-5 py-16"><div className="mx-auto w-full max-w-md">
    <Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>Back to website</Link>
    <div className="mb-9"><p className="text-xs uppercase tracking-[.3em] text-primary">Melody · Website Management</p><h1 className="mt-5 font-display text-5xl">{forgot?'Reset your password':'Welcome back.'}</h1><p className="mt-4 text-sm text-muted-foreground">{forgot?'Enter your administrator email to receive a secure reset link.':'Sign in to manage your website content and media.'}</p></div>
    <form onSubmit={submit} className="admin-panel space-y-5 p-6 sm:p-8">
      <div><label className="admin-label" htmlFor="email">Email address</label><div className="relative"><Mail size={17} className="absolute left-2 top-3.5 text-muted-foreground"/><input id="email" className="admin-input pl-15" value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></div></div>
      {!forgot&&<div><label className="admin-label" htmlFor="password">Password</label><div className="relative"><LockKeyhole size={17} className="absolute left-2 top-3.5 text-muted-foreground"/><input id="password" className="admin-input pl-15 pr-11" value={password} onChange={e=>setPassword(e.target.value)} type={visible?'text':'password'} autoComplete="current-password" required minLength={6}/><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?'Hide password':'Show password'} className="absolute right-3 top-3 text-muted-foreground">{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>}
      {error&&<p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}{message&&<p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400">{message}</p>}
      <button type="submit" disabled={busy} className="admin-button admin-primary w-full">{busy?'Please wait…':forgot?'Send reset link':'Sign in securely'}</button>
      <button type="button" className="w-full text-center text-sm text-primary hover:underline" onClick={()=>{setForgot(!forgot);setError('');setMessage('');}}>{forgot?'Return to sign in':'Forgot password?'}</button>
    </form><p className="mt-6 text-center text-xs text-muted-foreground">Administrator accounts are created privately. Public sign-up is disabled.</p>
  </div></main>;
}
