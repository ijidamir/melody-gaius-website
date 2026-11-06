'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/browser';
export default function ResetPassword() {
  const [password,setPassword]=useState('');const [again,setAgain]=useState('');
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const router=useRouter();
  async function submit(e:FormEvent) {
    e.preventDefault();setMessage('');
    if(password.length<8) return setMessage('Use at least 8 characters.');
    if(password!==again)return setMessage('Passwords do not match.');
    setBusy(true);
    try {
      const client=createClient();
      const {data:{user}}=await client.auth.getUser();
      if(!user) throw new Error('Your reset link has expired. Request a fresh link from the sign-in page.');
      const {error}=await client.auth.updateUser({password});if(error)throw error;
      setMessage('Password changed successfully. Redirecting to dashboard…');
      router.replace('/admin');router.refresh();
    }catch(e){setMessage(e instanceof Error?e.message:'Could not update password.');}
    finally{setBusy(false);}
  }
  return <main className="flex min-h-screen items-center justify-center px-5"><form onSubmit={submit} className="admin-panel w-full max-w-md space-y-5 p-8"><h1 className="font-display text-4xl">Choose a new password</h1><p className="admin-hint">For security, use a strong, unique password with at least eight characters.</p><label className="admin-label" htmlFor="newpass">New password</label><input id="newpass" type="password" autoComplete="new-password" minLength={8} required className="admin-input" value={password} onChange={e=>setPassword(e.target.value)}/><label className="admin-label" htmlFor="again">Confirm password</label><input id="again" type="password" autoComplete="new-password" required className="admin-input" value={again} onChange={e=>setAgain(e.target.value)}/>{message&&<p role="status" className="admin-hint">{message}</p>}<button disabled={busy} className="admin-button admin-primary w-full">{busy?'Updating…':'Update password'}</button><Link href="/admin/login" className="block text-center text-sm text-primary">Back to login</Link></form></main>;
}
