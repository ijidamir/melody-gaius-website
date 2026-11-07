'use client';

import {useId, useState, type ReactNode, type ChangeEvent} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, PanelsTopLeft, BookOpen, MapPinned, HeartHandshake, Film,
  UsersRound, Image as ImageIcon, Clapperboard, Link2, Share2,
  Settings, Search, Palette, UserCircle, LockKeyhole, LogOut,
  Menu, X, PanelLeftClose, PanelLeftOpen, Plus, Trash2,
  Save, ExternalLink, Upload, ChevronDown, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import {createClient} from '@/lib/supabase/browser';
import AdminThemeToggle from './admin-theme-toggle';
import type {SiteData, MediaAsset, SiteSettings, SiteSection} from '@/lib/types';
import {safeExternalLink} from '@/lib/content-utils';

type TableName = 'outreaches'|'programs'|'partners'|'social_links'|'hero_links'|'outreach_videos';
type Field = {key:string;label:string;long?:boolean;kind?:'url'|'email'|'number';hint?:string};
type Row = {id:string;sort_order:number;published:boolean;[key:string]:unknown};
type AlertKind = 'success'|'error';
type IconType = typeof LayoutDashboard;
const columns: Record<TableName,{title:string;description:string;fields:Field[];image?:boolean;video?:boolean}> = {
  outreaches:{title:'Regional outreaches',description:'Add events, locations, results and photographs. Publish only once the details have been verified.',image:true,fields:[
    {key:'title',label:'Outreach title'},{key:'location',label:'State or location'},{key:'date_label',label:'Date or timeframe'},
    {key:'stat',label:'Impact figure / highlight',hint:'Only publish figures you can verify.'},{key:'description',label:'Outreach story',long:true}]},
  programs:{title:'Care programmes',description:'Manage the care areas shown in the scrolling care section, including their individual photographs.',image:true,fields:[
    {key:'title',label:'Programme title'},{key:'description',label:'Description',long:true}]},
  partners:{title:'Partner organisations',description:'Manage the organisations displayed in the animated partners section.',fields:[
    {key:'name',label:'Organisation name'},{key:'url',label:'Partner website (optional)',kind:'url'}]},
  social_links:{title:'Footer social media links',description:'Manage WhatsApp, Instagram, Facebook and LinkedIn here. All four icons appear in the footer; a link becomes clickable only after its correct URL is entered and published.',fields:[
    {key:'platform',label:'Social platform',hint:'Use WhatsApp, Instagram, Facebook, LinkedIn or another platform name.'},
    {key:'url',label:'Profile or chat link',kind:'url',hint:'Enter the full https:// URL. For WhatsApp use https://wa.me/234XXXXXXXXXX (country code, without + or spaces). Leave blank until you have the official link.'}]},
  hero_links:{title:'Two hero website links',description:'Set the official destination for Aviv Counseling and MJ Foundation. The public hero shows the first two published links.',fields:[
    {key:'label',label:'Button label'},{key:'url',label:'Official website URL',kind:'url'}]},
  outreach_videos:{title:'Outreach videos',description:'Share video evidence of outreach work. Add a YouTube/Vimeo link OR upload a video file. Publish when ready.',video:true,fields:[
    {key:'title',label:'Video title'},{key:'description',label:'Short description',long:true},
    {key:'video_url',label:'YouTube or Vimeo URL (optional)',kind:'url',hint:'For embedded videos, paste a YouTube or Vimeo link. Alternatively upload an MP4/WebM file below.'}]},
};
const groups: {name:string;items:{id:string;label:string;icon:IconType}[]}[] = [
  {name:'Overview',items:[{id:'dashboard',label:'Dashboard',icon:LayoutDashboard}]},
  {name:'Website Management',items:[
    {id:'hero',label:'Hero Section',icon:PanelsTopLeft},
    {id:'story',label:'Our Story',icon:BookOpen},
    {id:'impact',label:'Regional Impact',icon:MapPinned},
    {id:'care',label:'Holistic Care',icon:HeartHandshake},
    {id:'videos',label:'Outreach Videos',icon:Film},
    {id:'partners',label:'Partners',icon:UsersRound},
    {id:'connect',label:'Connect Section',icon:Link2},
  ]},
  {name:'Media Management',items:[{id:'images',label:'Image Library',icon:ImageIcon},{id:'video-library',label:'Video Library',icon:Clapperboard}]},
  {name:'Links Management',items:[{id:'social',label:'Social Media',icon:Share2},{id:'hero-links',label:'Hero Website Links',icon:Link2}]},
  {name:'Website Settings',items:[
    {id:'general',label:'General Settings',icon:Settings},
    {id:'section-copy',label:'Section Headings',icon:PanelsTopLeft},
    {id:'seo',label:'SEO Settings',icon:Search},
    {id:'appearance',label:'Appearance',icon:Palette},
  ]},
  {name:'Account',items:[{id:'profile',label:'My Profile & Security',icon:UserCircle}]},
];
const headingFields:Field[] = [
  {key:'eyebrow',label:'Small section label'},{key:'heading',label:'Main heading'},
  {key:'description',label:'Supporting description',long:true},
];

function errorMessage(err:unknown):string {return err instanceof Error?err.message:String(err);}

function EditField({field,value,onChange}: {field:Field;value:unknown;onChange:(v:string)=>void}) {
  const reactId=useId();
  const id=`field-${field.key}-${reactId}`;
  return <div><label className="admin-label" htmlFor={id}>{field.label}</label>
    {field.long?<textarea id={id} rows={4} className="admin-input resize-y" value={String(value??'')} onChange={e=>onChange(e.target.value)} />
      :<input id={id} type={field.kind||'text'} className="admin-input" value={String(value??'')} onChange={e=>onChange(e.target.value)} />}
    {field.hint&&<p className="admin-hint mt-1">{field.hint}</p>}
  </div>;
}
function Panel({title,subtitle,children}: {title:string;subtitle?:string;children:ReactNode}) {
  return <div className="admin-panel p-5 sm:p-7"><h2 className="font-display text-3xl">{title}</h2>{subtitle&&<p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}<div className="mt-6">{children}</div></div>;
}

async function uploadAsset(file:File):Promise<MediaAsset> {
  const client=createClient();
  const type=file.type.startsWith('video/')?'video':file.type.startsWith('image/')?'image':null;
  if(!type)throw new Error('Choose an image or MP4/WebM video.');
  const allowed=type==='image'?['image/jpeg','image/png','image/webp','image/gif','image/avif']:['video/mp4','video/webm'];
  if(!allowed.includes(file.type))throw new Error('File type not supported. Use JPG/PNG/WebP/GIF/AVIF or MP4/WebM.');
  if(file.size>50*1024*1024)throw new Error('Files must be smaller than 50 MB. Use a YouTube link for larger videos.');
  const ext=file.name.toLowerCase().split('.').pop()?.replace(/[^a-z0-9]/g,'')||'bin';
  const path=`${type}s/${crypto.randomUUID()}.${ext}`;
  const {error:uploadError}=await client.storage.from('site-media').upload(path,file,{contentType:file.type,upsert:false});
  if(uploadError)throw uploadError;
  const {data:{publicUrl}}=client.storage.from('site-media').getPublicUrl(path);
  const {data,error}=await client.from('media_assets').insert({url:publicUrl,storage_path:path,filename:file.name,alt_text:file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' '),media_type:type,file_size:file.size}).select('*').single();
  if(error){await client.storage.from('site-media').remove([path]);throw error;}
  return data as MediaAsset;
}

function MediaChooser({data,value,onChange,type='image',onNotify}: {
  data:SiteData;value:string|null;onChange:(id:string|null)=>void;type?:'image'|'video';onNotify:(m:string,k?:AlertKind)=>void;
}) {
  const [uploading,setUploading]=useState(false);
  const [justUploaded,setJustUploaded]=useState<MediaAsset|null>(null);
  const selected=justUploaded?.id===value?justUploaded:data.media.find(m=>m.id===value);
  async function upload(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return;
    setUploading(true);
    try {const m=await uploadAsset(file);setJustUploaded(m);onChange(m.id);onNotify('Uploaded. Select Save to apply this image or video.');}
    catch(err){onNotify(errorMessage(err),'error');}
    finally{setUploading(false);e.target.value='';}
  }
  return <div className="space-y-3"><label className="admin-label">{type==='image'?'Featured image':'Video file'}</label>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <select className="admin-input flex-1" value={value||''} onChange={e=>onChange(e.target.value||null)} aria-label={`Choose ${type}`}>
        <option value="">No {type} selected</option>
        {justUploaded&&<option value={justUploaded.id}>{justUploaded.filename} (just uploaded)</option>}
        {data.media.filter(m=>m.media_type===type).filter(m=>m.id!==justUploaded?.id).map(m=><option key={m.id} value={m.id}>{m.alt_text || m.filename}</option>)}
      </select>
      <label className="admin-button admin-secondary cursor-pointer whitespace-nowrap"><Upload size={16}/>{uploading?'Uploading…':'Upload new'}
        <input type="file" className="sr-only" disabled={uploading} accept={type==='image'?'image/jpeg,image/png,image/webp,image/gif,image/avif':'video/mp4,video/webm'} onChange={upload}/>
      </label>
    </div>
    {selected?.media_type==='image'&&<img src={selected.url} alt={selected.alt_text||'Preview'} className="h-40 w-full max-w-xs rounded-lg border border-border object-cover" />}
    {selected?.media_type==='video'&&<video controls preload="metadata" src={selected.url} className="w-full max-w-xs rounded-lg" />}
    <p className="admin-hint">Choose from the library or upload a new {type}. Click Save to publish the selection.</p>
  </div>;
}

function SettingsEditor({initial,fields,onSaved,onNotify,title,description}: {
  initial:SiteSettings;fields:Field[];onSaved:()=>void;onNotify:(m:string,k?:AlertKind)=>void;
  title:string;description?:string;
}) {
  const [form,setForm]=useState<Record<string,unknown>>({...initial});const [saving,setSaving]=useState(false);
  async function save(){
    const patch:Record<string,unknown>={};for(const f of fields)patch[f.key]=form[f.key];
    for(const f of fields.filter(f=>f.kind==='url')){const v=String(patch[f.key]||'');if(v&&!safeExternalLink(v))return onNotify(`${f.label}: use a complete https:// link.`,'error');}
    setSaving(true);
    try {const {error}=await createClient().from('site_settings').update({...patch,updated_at:new Date().toISOString()}).eq('id',1);if(error)throw error;onNotify('Website settings saved.');onSaved();}
    catch(err){onNotify(errorMessage(err),'error');}finally{setSaving(false);}
  }
  return <Panel title={title} subtitle={description}><div className="grid gap-5">{fields.map(f=><EditField key={f.key} field={f} value={form[f.key]} onChange={v=>setForm({...form,[f.key]:v})}/>)}<div><button type="button" disabled={saving} className="admin-button admin-primary" onClick={save}><Save size={16}/>{saving?'Saving…':'Save changes'}</button></div></div></Panel>;
}

function SectionEditor({section,onSaved,onNotify}: {section:SiteSection;onSaved:()=>void;onNotify:(m:string,k?:AlertKind)=>void}) {
  const [form,setForm]=useState({...section});const [saving,setSaving]=useState(false);
  async function save(){setSaving(true);try{const {error}=await createClient().from('site_sections').update({heading:form.heading,eyebrow:form.eyebrow,description:form.description}).eq('id',section.id);if(error)throw error;onNotify(`${section.slug} section updated.`);onSaved();}catch(err){onNotify(errorMessage(err),'error');}finally{setSaving(false);}}
  return <div className="admin-panel space-y-4 p-5"><p className="font-display text-2xl capitalize">{section.slug}</p>{headingFields.map(f=><EditField key={f.key} field={f} value={form[f.key as keyof SiteSection]} onChange={v=>setForm({...form,[f.key]:v})}/>)}<button type="button" className="admin-button admin-primary" disabled={saving} onClick={save}><Save size={16}/>Save heading</button></div>;
}

function SectionPhoto({sectionKey,data,onSaved,onNotify}: {sectionKey:string;data:SiteData;onSaved:()=>void;onNotify:(m:string,k?:AlertKind)=>void}) {
  const image=data.section_media.find(m=>m.section_key===sectionKey);
  const [id,setId]=useState<string|null>(image?.media_id||null);
  const [busy,setBusy]=useState(false);
  async function save(){setBusy(true);try{
    const {error}=await createClient().from('section_media').upsert({section_key:sectionKey,media_id:id,sort_order:0},{onConflict:'section_key'});
    if(error)throw error;onNotify('Section image saved.');onSaved();
  }catch(err){onNotify(errorMessage(err),'error');}finally{setBusy(false);}}
  return <Panel title="Section photograph" subtitle="This photograph appears on the public website. Select an image from the library or upload a replacement.">
    <MediaChooser data={data} type="image" value={id} onChange={setId} onNotify={onNotify}/><button disabled={busy} className="admin-button admin-primary mt-5" onClick={save}><Save size={16}/>Save section image</button>
  </Panel>;
}

function RowCollection({table,rows,data,onSaved,onNotify}: {
  table:TableName;rows:Row[];data:SiteData;onSaved:()=>void;onNotify:(m:string,k?:AlertKind)=>void;
}) {
  const spec=columns[table];const [adding,setAdding]=useState(false);
  const coreSocials = ['WhatsApp','Instagram','Facebook','LinkedIn'];
  const missingSocials = table === 'social_links'
    ? coreSocials.filter(p => !rows.some(row => String(row.platform || '').trim().toLowerCase() === p.toLowerCase()))
    : [];
  async function createMissingSocials(){
    if(!missingSocials.length)return;
    setAdding(true);
    try {
      const additions = missingSocials.map((platform,index) => ({
        platform, url:'', published:true, sort_order:coreSocials.indexOf(platform)+1,
      }));
      const {error}=await createClient().from('social_links').insert(additions);
      if(error)throw error;
      onNotify('Missing footer social accounts created. Open each one to enter its official link.');
      onSaved();
    } catch(err) {onNotify(errorMessage(err),'error');}
    finally {setAdding(false);}
  }
  async function add(){setAdding(true);try{
    const next=Math.max(0,...rows.map(r=>r.sort_order))+1;
    const {error}=await createClient().from(table).insert({sort_order:next,published:false});
    if(error)throw error;onNotify('New unpublished item created. Open it below to add content.');onSaved();
  }catch(err){onNotify(errorMessage(err),'error');}finally{setAdding(false);}}
  return <Panel title={spec.title} subtitle={spec.description}><div className="space-y-4">
    {missingSocials.length>0&&<div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">Set up the four footer channels</p><p className="mt-1 text-xs text-muted-foreground">Still missing: {missingSocials.join(', ')}. These accounts can be added in one click.</p></div><button type="button" disabled={adding} onClick={createMissingSocials} className="admin-button admin-primary shrink-0"><Plus size={15}/>Add missing channels</button></div>}
    {rows.length===0&&<p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">No entries yet. Create your first one.</p>}
    {[...rows].sort((a,b)=>a.sort_order-b.sort_order).map((row,i)=><RowEditor key={row.id} row={row} table={table} data={data} onSaved={onSaved} onNotify={onNotify} open={rows.length===1&&i===0}/>)}
    <button onClick={add} disabled={adding} className="admin-button admin-secondary w-full"><Plus size={17}/>{adding?'Adding…':`Add ${table==='outreach_videos'?'video':'new item'}`}</button></div>
  </Panel>;
}

function RowEditor({row,table,data,onSaved,onNotify,open}: {
  row:Row;table:TableName;data:SiteData;onSaved:()=>void;onNotify:(m:string,k?:AlertKind)=>void;open:boolean;
}) {
  const [form,setForm]=useState<Record<string,unknown>>({...row});const [busy,setBusy]=useState(false);
  const spec=columns[table];
  const label=String(row.title||row.name||row.platform||row.label||'New draft');
  async function save(){
    for(const f of spec.fields.filter(f=>f.kind==='url')) {
      const val=String(form[f.key]||'');if(val&&!safeExternalLink(val))return onNotify(`${f.label}: enter a complete https:// URL.`,'error');
    }
    if(table==='outreach_videos' && Boolean(form.published)&&!form.video_url&&!form.video_media_id) return onNotify('Add a video link or upload a video before publishing.','error');
    const patch:Record<string,unknown>={sort_order:Number(form.sort_order)||0,published:Boolean(form.published)};
    for(const f of spec.fields)patch[f.key]=form[f.key]||'';
    if(spec.image)patch.media_id=form.media_id||null;
    if(spec.video){patch.video_media_id=form.video_media_id||null;patch.thumbnail_media_id=form.thumbnail_media_id||null;}
    setBusy(true);
    try{const {error}=await createClient().from(table).update(patch).eq('id',row.id);if(error)throw error;onNotify('Item saved successfully.');onSaved();}
    catch(err){onNotify(errorMessage(err),'error');}finally{setBusy(false);}
  }
  async function remove(){
    if(!window.confirm(`Permanently delete "${label}"? This cannot be undone.`))return;
    setBusy(true);
    try{const {error}=await createClient().from(table).delete().eq('id',row.id);if(error)throw error;onNotify('Item deleted.');onSaved();}
    catch(err){onNotify(errorMessage(err),'error');}finally{setBusy(false);}
  }
  return <details open={open} className="group rounded-xl border border-border bg-background/50">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 [&::-webkit-details-marker]:hidden"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{label}</span><span className={`mt-1 block text-xs ${row.published?'text-emerald-500':'text-muted-foreground'}`}>{row.published?'Published':'Unpublished draft'}</span></span><ChevronDown size={19} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"/></summary>
    <div className="space-y-5 border-t border-border p-4 sm:p-6">{spec.fields.map(f=><EditField key={f.key} field={f} value={form[f.key]} onChange={v=>setForm({...form,[f.key]:v})}/>)}
      {spec.image&&<MediaChooser data={data} value={String(form.media_id||'')||null} onChange={v=>setForm({...form,media_id:v})} onNotify={onNotify}/>}
      {spec.video&&<><MediaChooser data={data} type="video" value={String(form.video_media_id||'')||null} onChange={v=>setForm({...form,video_media_id:v})} onNotify={onNotify}/><MediaChooser data={data} type="image" value={String(form.thumbnail_media_id||'')||null} onChange={v=>setForm({...form,thumbnail_media_id:v})} onNotify={onNotify}/></>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="w-full sm:w-28"><EditField field={{key:'sort_order',label:'Display order',kind:'number'}} value={form.sort_order} onChange={v=>setForm({...form,sort_order:Number(v)})}/></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-amber-500" checked={Boolean(form.published)} onChange={e=>setForm({...form,published:e.target.checked})}/>Publish on website</label></div>
      <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4"><button type="button" disabled={busy} className="admin-button admin-primary" onClick={save}><Save size={15}/>{busy?'Working…':'Save item'}</button><button type="button" disabled={busy} className="admin-button admin-danger" onClick={remove}><Trash2 size={15}/>Delete</button></div>
    </div>
  </details>;
}

function MediaLibrary({data,type,onSaved,onNotify}: {data:SiteData;type:'image'|'video';onSaved:()=>void;onNotify:(m:string,k?:AlertKind)=>void}) {
  const [busy,setBusy]=useState(false);
  async function upload(e:ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;setBusy(true);try{const asset=await uploadAsset(file);if(asset.media_type!==type)onNotify('File uploaded to the other media library.');else onNotify('Media uploaded.');onSaved();}catch(err){onNotify(errorMessage(err),'error');}finally{setBusy(false);e.target.value='';}}
  return <Panel title={type==='image'?'Image library':'Video library'} subtitle="A central place for uploaded media. Choose these files when editing any website section. Deleting media in use will clear its selection on the website.">
    <div className="mb-7"><label className="admin-button admin-primary cursor-pointer"><Upload size={16}/>{busy?'Uploading…':`Upload ${type}`}<input type="file" className="sr-only" accept={type==='image'?'image/jpeg,image/png,image/webp,image/gif,image/avif':'video/mp4,video/webm'} disabled={busy} onChange={upload}/></label></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.media.filter(m=>m.media_type===type).map(m=><MediaCard key={m.id} media={m} onSaved={onSaved} onNotify={onNotify}/>)}</div>
  </Panel>;
}
function MediaCard({media,onSaved,onNotify}: {media:MediaAsset;onSaved:()=>void;onNotify:(m:string,k?:AlertKind)=>void}) {
  const [alt,setAlt]=useState(media.alt_text);const [busy,setBusy]=useState(false);
  async function save(){setBusy(true);try{const{error}=await createClient().from('media_assets').update({alt_text:alt}).eq('id',media.id);if(error)throw error;onNotify('Media description saved.');onSaved();}catch(err){onNotify(errorMessage(err),'error');}finally{setBusy(false);}}
  async function remove(){if(!confirm(`Delete ${media.filename}? Website sections using it will need a replacement.`))return;setBusy(true);try{const client=createClient();const{error}=await client.from('media_assets').delete().eq('id',media.id);if(error)throw error;if(media.storage_path){const{error:storageError}=await client.storage.from('site-media').remove([media.storage_path]);if(storageError)onNotify(`Database entry deleted, but storage cleanup failed: ${storageError.message}`,'error');}onNotify('Media entry removed.');onSaved();}catch(err){onNotify(errorMessage(err),'error');}finally{setBusy(false);}}
  return <div className="overflow-hidden rounded-xl border border-border bg-background/50">{media.media_type==='image'?<img src={media.url} alt={media.alt_text||media.filename} className="aspect-video w-full object-cover" loading="lazy"/>:<video src={media.url} controls preload="none" className="aspect-video w-full bg-black"/>}<div className="space-y-3 p-4"><p className="truncate text-xs text-muted-foreground" title={media.filename}>{media.filename}</p><label className="admin-label" htmlFor={`alt-${media.id}`}>{media.media_type==='image'?'Image description (alt text)':'Video description'}</label><input id={`alt-${media.id}`} className="admin-input" value={alt} onChange={e=>setAlt(e.target.value)}/><div className="flex justify-between gap-2"><button className="admin-button admin-secondary" disabled={busy} onClick={save}><Save size={14}/>Save</button><button className="admin-button admin-danger" disabled={busy} onClick={remove}><Trash2 size={14}/></button></div></div></div>;
}

function SecurityPanel({email,onNotify}: {email:string;onNotify:(m:string,k?:AlertKind)=>void}) {
  const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);
  async function updatePassword(){if(password.length<8)return onNotify('Use a password of at least eight characters.','error');setBusy(true);try{const{error}=await createClient().auth.updateUser({password});if(error)throw error;setPassword('');onNotify('Password updated.');}catch(err){onNotify(errorMessage(err),'error');}finally{setBusy(false);}}
  return <div className="space-y-5"><Panel title="Administrator profile" subtitle="This dashboard is available only to explicitly authorised administrator accounts."><div className="space-y-4"><div><p className="admin-label">Signed-in email</p><p className="text-sm">{email}</p></div><p className="admin-hint">To change the administrator email, use Supabase Authentication settings and verify the address. Never share account passwords.</p></div></Panel>
    <Panel title="Change password" subtitle="Update your password without leaving the dashboard."><div className="max-w-md space-y-4"><label htmlFor="change-pass" className="admin-label">New password (8+ characters)</label><input id="change-pass" className="admin-input" type="password" autoComplete="new-password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/><button className="admin-button admin-primary" disabled={busy} onClick={updatePassword}><LockKeyhole size={16}/>Update password</button></div></Panel>
  </div>;
}

export default function AdminConsole({initial,email}: {initial:SiteData;email:string}) {
  const router=useRouter();
  const [active,setActive]=useState('dashboard');
  const [collapsed,setCollapsed]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [alert,setAlert]=useState<{message:string;kind:AlertKind}|null>(null);
  const notify=(message:string,kind:AlertKind='success')=>{setAlert({message,kind});window.setTimeout(()=>setAlert(null),5500);};
  const refresh=()=>router.refresh();
  const data=initial;
  const section=(slug:string)=>data.sections.find(x=>x.slug===slug);
  const rows=(table:TableName)=>(data[table] as unknown as Row[]);
  function navigate(id:string){setActive(id);setMobileOpen(false);window.scrollTo({top:0,behavior:'smooth'});}
  async function signOut(){try{await createClient().auth.signOut();router.replace('/admin/login');router.refresh();}catch(err){notify(errorMessage(err),'error');}}
  const title=groups.flatMap(g=>g.items).find(x=>x.id===active)?.label||'Dashboard';
  function sectionEditor(slug:string){const s=section(slug);return s?<SectionEditor key={`${slug}-${s.id}`} section={s} onSaved={refresh} onNotify={notify}/>:<p className="admin-hint">Section missing. Run the Supabase seed migration.</p>;}

  const sidebar=<div className="flex h-full flex-col"><div className="flex items-center justify-between gap-3 border-b border-border px-4 py-5"><div className={`min-w-0 ${collapsed?'lg:hidden':''}`}><p className="font-display text-xl">Melody <em className="text-gold">Studio</em></p><p className="mt-1 text-[10px] uppercase tracking-[.23em] text-muted-foreground">Website Management</p></div><button title="Collapse sidebar" aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} className="hidden rounded-lg p-2 hover:bg-background lg:block" onClick={()=>setCollapsed(v=>!v)}>{collapsed?<PanelLeftOpen size={20}/>:<PanelLeftClose size={20}/>}</button><button className="rounded-lg p-2 lg:hidden" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}><X size={20}/></button></div>
    <nav aria-label="Admin sections" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">{groups.map(group=><details key={group.name} open className="group/nav"><summary className={`flex cursor-pointer list-none items-center justify-between px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground [&::-webkit-details-marker]:hidden ${collapsed?'lg:sr-only':''}`}>{group.name}<ChevronDown size={13} className="transition-transform group-open/nav:rotate-180"/></summary><div className="space-y-1">{group.items.map(item=>{const Icon=item.icon;return <button key={item.id} type="button" title={item.label} className={`admin-link ${active===item.id?'is-active':''} ${collapsed?'lg:justify-center':''}`} onClick={()=>navigate(item.id)}><Icon size={18} className="shrink-0"/><span className={`${collapsed?'lg:hidden':''}`}>{item.label}</span></button>;})}</div></details>)}</nav>
    <div className="border-t border-border p-3"><Link href="/" target="_blank" rel="noopener noreferrer" className="admin-link" title="View public site"><ExternalLink size={18}/><span className={`${collapsed?'lg:hidden':''}`}>View website</span></Link><button type="button" className="admin-link" onClick={signOut} title="Sign out"><LogOut size={18}/><span className={`${collapsed?'lg:hidden':''}`}>Sign out</span></button></div>
  </div>;

  return <div className="flex min-h-screen bg-background text-foreground">
    {mobileOpen&&<button aria-label="Close admin menu" className="fixed inset-0 z-40 bg-black/65 lg:hidden" onClick={()=>setMobileOpen(false)}/>}
    <aside className={`admin-sidebar fixed inset-y-0 left-0 z-50 w-72 border-r transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${mobileOpen?'translate-x-0':'-translate-x-full'} ${collapsed?'lg:w-[76px]':'lg:w-72'}`}>{sidebar}</aside>
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex h-18 items-center justify-between gap-3 border-b border-border bg-background/90 px-5 backdrop-blur-xl sm:px-8"><div className="flex min-w-0 items-center gap-3"><button aria-label="Open admin navigation" className="rounded-lg p-2 hover:bg-card lg:hidden" onClick={()=>setMobileOpen(true)}><Menu size={22}/></button><div className="min-w-0"><p className="truncate font-display text-2xl sm:text-3xl">{title}</p><p className="hidden text-xs text-muted-foreground sm:block">Edit and publish without touching code.</p></div></div><div className="flex shrink-0 items-center gap-2"><AdminThemeToggle/><span className="hidden max-w-[220px] truncate rounded-full border border-border px-3 py-2 text-xs text-muted-foreground sm:block">{email}</span></div></header>
      <main className="mx-auto max-w-6xl space-y-6 p-4 pb-20 sm:p-8">
        {alert&&<div role={alert.kind==='error'?'alert':'status'} className={`fixed right-4 top-20 z-[80] flex max-w-sm items-start gap-2 rounded-xl border p-4 text-sm shadow-2xl ${alert.kind==='error'?'border-red-500/40 bg-[#452329] text-red-100':'border-emerald-500/40 bg-[#17352b] text-emerald-100'}`}>{alert.kind==='error'?<AlertTriangle size={18}/>:<CheckCircle2 size={18}/>}<span>{alert.message}</span><button onClick={()=>setAlert(null)} aria-label="Close notice"><X size={16}/></button></div>}
        {active==='dashboard'&&<><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
          ['Regional outreaches',data.outreaches.length,MapPinned,'impact'],['Care programmes',data.programs.length,HeartHandshake,'care'],
          ['Partners',data.partners.length,UsersRound,'partners'],['Outreach videos',data.outreach_videos.length,Film,'videos'],
        ].map(([name,count,Icon,target])=>{const CardIcon=Icon as IconType;return <button key={String(name)} onClick={()=>navigate(String(target))} className="admin-panel p-6 text-left transition-transform hover:-translate-y-1"><CardIcon size={21} className="text-primary"/><p className="mt-5 font-display text-4xl">{Number(count)}</p><p className="mt-2 text-sm text-muted-foreground">{String(name)}</p></button>;})}</div>
          <Panel title="Welcome to your content studio" subtitle="Use the sidebar to update text, photographs, outreach records, social media links and videos. Changes are shown on your website once saved and published."><p className="mb-5 text-sm font-semibold">Quick actions</p><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[
            ['Edit homepage','hero'],['Replace hero image','hero'],['Add outreach','impact'],['Add a video','videos'],['Update social links','social'],['Manage images','images'],
          ].map(([label,id])=><button key={label} onClick={()=>navigate(id)} className="admin-button admin-secondary justify-between">{label}<ExternalLink size={15}/></button>)}</div></Panel>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-sm leading-relaxed text-muted-foreground"><b className="text-foreground">Tip:</b> Save each edited item before leaving its section. Keep unverified achievements as unpublished drafts.</div>
        </>}
        {active==='hero'&&<><SettingsEditor key="hero-settings" initial={data.settings} title="Hero text" description="The mission statement and introduction shown at the top of the website." fields={[{key:'tagline',label:'Professional tagline'},{key:'mission',label:'Main mission statement'},{key:'intro',label:'Short introduction',long:true}]} onSaved={refresh} onNotify={notify}/><SectionPhoto sectionKey="hero" data={data} onSaved={refresh} onNotify={notify}/><RowCollection table="hero_links" data={data} rows={rows('hero_links')} onSaved={refresh} onNotify={notify}/></>}
        {active==='story'&&<><SettingsEditor key="story-settings" initial={data.settings} title="Her story" description="Edit her biography, recognition and counselling information." fields={[{key:'about',label:'About Melody',long:true},{key:'recognition',label:'Recognition',long:true},{key:'counseling',label:'Counselling',long:true}]} onSaved={refresh} onNotify={notify}/><SectionPhoto sectionKey="story" data={data} onSaved={refresh} onNotify={notify}/>{sectionEditor('story')}</>}
        {active==='impact'&&<>{sectionEditor('impact')}<RowCollection table="outreaches" data={data} rows={rows('outreaches')} onSaved={refresh} onNotify={notify}/></>}
        {active==='care'&&<>{sectionEditor('care')}<RowCollection table="programs" data={data} rows={rows('programs')} onSaved={refresh} onNotify={notify}/></>}
        {active==='videos'&&<>{sectionEditor('videos')}<RowCollection table="outreach_videos" data={data} rows={rows('outreach_videos')} onSaved={refresh} onNotify={notify}/></>}
        {active==='partners'&&<>{sectionEditor('partners')}<RowCollection table="partners" data={data} rows={rows('partners')} onSaved={refresh} onNotify={notify}/></>}
        {active==='connect'&&<>{sectionEditor('connect')}<SectionPhoto sectionKey="connect" data={data} onSaved={refresh} onNotify={notify}/><SettingsEditor title="Contact details" initial={data.settings} fields={[{key:'contact_email',label:'Public contact email',kind:'email'}]} onSaved={refresh} onNotify={notify}/></>}
        {active==='images'&&<MediaLibrary data={data} type="image" onSaved={refresh} onNotify={notify}/>}
        {active==='video-library'&&<MediaLibrary data={data} type="video" onSaved={refresh} onNotify={notify}/>}
        {active==='social'&&<RowCollection table="social_links" data={data} rows={rows('social_links')} onSaved={refresh} onNotify={notify}/>}
        {active==='hero-links'&&<RowCollection table="hero_links" data={data} rows={rows('hero_links')} onSaved={refresh} onNotify={notify}/>}
        {active==='general'&&<SettingsEditor initial={data.settings} title="General information" description="Basic name and identity displayed on the website." fields={[{key:'name',label:'Display name'},{key:'tagline',label:'Professional tagline'},{key:'contact_email',label:'Contact email',kind:'email'},{key:'footer_location',label:'Footer location'}]} onSaved={refresh} onNotify={notify}/>}
        {active==='section-copy'&&<Panel title="Website section headings" subtitle="All section titles, eyebrow labels and supporting paragraphs can be edited here. These are fixed sections to preserve the website design."><div className="grid gap-5 xl:grid-cols-2">{data.sections.map(s=><SectionEditor key={s.id} section={s} onSaved={refresh} onNotify={notify}/>)}</div></Panel>}
        {active==='seo'&&<><SettingsEditor initial={data.settings} title="Search engine settings" description="Edit the public title and description shown in search and social previews." fields={[{key:'seo_title',label:'SEO page title'},{key:'seo_description',label:'SEO page description',long:true}]} onSaved={refresh} onNotify={notify}/><SeoImage data={data} onSaved={refresh} onNotify={notify}/></>}
        {active==='appearance'&&<Panel title="Website and dashboard appearance" subtitle="The dashboard switch changes your personal viewing preference. The website default below sets the starting theme for visitors who have not chosen one."><div className="max-w-sm space-y-8"><div className="space-y-3"><p className="admin-label">Your dashboard theme</p><AdminThemeToggle showLabel/><p className="admin-hint">Your choice is remembered in this browser and shared with the public website view.</p></div><div className="border-t border-border pt-6"><ThemeSetting initial={data.settings.default_theme} onSaved={refresh} onNotify={notify}/></div></div></Panel>}
        {active==='profile'&&<SecurityPanel email={email} onNotify={notify}/>}
      </main>
    </div>
  </div>;
}

function SeoImage({data,onSaved,onNotify}: {data:SiteData;onSaved:()=>void;onNotify:(m:string,k?:AlertKind)=>void}) {
  const [id,setId]=useState(data.settings.seo_image_id);const [saving,setSaving]=useState(false);
  async function save(){setSaving(true);try{const{error}=await createClient().from('site_settings').update({seo_image_id:id}).eq('id',1);if(error)throw error;onNotify('SEO image updated.');onSaved();}catch(e){onNotify(errorMessage(e),'error');}finally{setSaving(false);}}
  return <Panel title="Social sharing image" subtitle="Select the image used when someone shares your website."><MediaChooser data={data} value={id} onChange={setId} onNotify={onNotify}/><button className="admin-button admin-primary mt-5" disabled={saving} onClick={save}><Save size={16}/>Save preview image</button></Panel>;
}
function ThemeSetting({initial,onSaved,onNotify}: {initial:'dark'|'light';onSaved:()=>void;onNotify:(m:string,k?:AlertKind)=>void}) {
  const [theme,setTheme]=useState(initial);const [busy,setBusy]=useState(false);
  async function save(){setBusy(true);try{const{error}=await createClient().from('site_settings').update({default_theme:theme}).eq('id',1);if(error)throw error;onNotify('Default website theme saved.');onSaved();}catch(e){onNotify(errorMessage(e),'error');}finally{setBusy(false);}}
  return <div className="space-y-4"><label htmlFor="theme" className="admin-label">Default mode</label><select id="theme" className="admin-input" value={theme} onChange={e=>setTheme(e.target.value as 'light'|'dark')}><option value="dark">Dark (original design)</option><option value="light">Light</option></select><button disabled={busy} className="admin-button admin-primary" onClick={save}><Save size={16}/>Save appearance</button></div>;
}
