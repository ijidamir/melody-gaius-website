'use client';

import { useEffect, useRef, useState } from 'react';
import { Instagram, Facebook, Linkedin, Youtube, Globe, Sun, Moon, Menu, X, ArrowUpRight, Play } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import type { SiteData, Program } from '@/lib/types';
import { assetById, sectionBySlug, sectionImage, published, safeExternalLink } from '@/lib/content-utils';

gsap.registerPlugin(useGSAP, ScrollTrigger);

function useScrollY() {
  const [scroll, setScroll] = useState(0);
  useEffect(() => {
    const handler = () => setScroll(window.scrollY);
    handler(); window.addEventListener('scroll', handler, {passive:true});
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return scroll;
}

function ThemeToggle({ initial }: {initial:'light'|'dark'}) {
  const [theme, setTheme] = useState<'light'|'dark'>(initial);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('melody-theme');
      const resolved = stored === 'dark' || stored === 'light' ? stored : initial;
      document.documentElement.classList.toggle('light', resolved === 'light');
      setTheme(resolved);
    } catch { document.documentElement.classList.toggle('light', initial === 'light'); }
  },[initial]);
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next); document.documentElement.classList.toggle('light',next==='light');
    try {localStorage.setItem('melody-theme',next);} catch { /* storage disabled */ }
  }
  return <button type="button" onClick={toggle} aria-label={`Switch to ${theme==='dark'?'light':'dark'} mode`} title="Toggle colour theme" className="flex h-10 w-10 items-center justify-center rounded-full border border-current/20 transition-colors hover:bg-white/10">
    {theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}
  </button>;
}

// The four core footer profiles are shown even before their URLs are supplied.
// No visitor is sent to an invented or empty address.
const FOOTER_NETWORKS = ['WhatsApp', 'Instagram', 'Facebook', 'LinkedIn'] as const;

function WhatsAppIcon({size = 19}: {size?: number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.76-1.653-2.057-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.173.198-.297.297-.495.099-.198.05-.372-.025-.52-.074-.148-.669-1.612-.916-2.206-.242-.579-.487-.5-.67-.51-.173-.009-.371-.011-.57-.011-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.874 1.213 3.073c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.422 7.61h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.74.981.998-3.648-.235-.374a9.865 9.865 0 0 1-1.51-5.26c.003-5.45 4.438-9.884 9.89-9.884a9.823 9.823 0 0 1 6.99 2.895 9.825 9.825 0 0 1 2.891 6.993c-.003 5.45-4.438 9.885-9.888 9.889m8.413-18.3A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.333.157 11.893a11.83 11.83 0 0 0 1.588 5.934L.057 24l6.3-1.652a11.9 11.9 0 0 0 5.69 1.448h.005c6.554 0 11.89-5.333 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z"/>
  </svg>;
}

const iconSet: Record<string, typeof Instagram> = {
  instagram: Instagram, facebook: Facebook, linkedin: Linkedin, youtube: Youtube,
};
function FooterSocialIcon({platform}: {platform:string}) {
  if (platform.toLowerCase() === 'whatsapp') return <WhatsAppIcon/>;
  const Icon = iconSet[platform.toLowerCase()] || Globe;
  return <Icon size={19}/>;
}
function RichHeading({text, focus}: {text:string;focus:string}) {
  const index = text.toLowerCase().indexOf(focus.toLowerCase());
  if (index === -1) return <>{text}</>;
  return <>{text.slice(0,index)}<em className="text-gold">{text.slice(index,index+focus.length)}</em>{text.slice(index+focus.length)}</>;
}
function videoEmbed(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.pathname.slice(1))}`;
    if (['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)) {
      const id = u.searchParams.get('v') || u.pathname.match(/^\/shorts\/([^/]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (['vimeo.com','www.vimeo.com'].includes(u.hostname)) {
      const id = u.pathname.replace(/\//g,'');
      return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch { return null; }
  return null;
}

export default function PublicSite({data}: {data: SiteData}) {
  const s = data.settings;
  const main = useRef<HTMLDivElement>(null);
  const y = useScrollY();
  const [mobileOpen,setMobileOpen] = useState(false);
  const [first,...rest] = s.name.split(' ');
  const getImage = (key:string, fallback:string) => sectionImage(data,key)?.url || fallback;
  const nav = [ ['Story','story'],['Impact','impact'],['Care','care'],['Videos','videos'],['Connect','connect'] ];
  const heroLinks = published(data.hero_links).slice(0,2);
  const outreach = published(data.outreaches);
  const programs = published(data.programs);
  const partners = published(data.partners);
  const videos = published(data.outreach_videos);
  const publishedSocials = published(data.social_links);
  const footerSocials = [
    ...FOOTER_NETWORKS.map(platform => ({
      platform,
      url: publishedSocials.find(l => l.platform.trim().toLowerCase() === platform.toLowerCase())?.url || '',
    })),
    // Keep any other channels added by the owner in the CMS (e.g. YouTube).
    ...publishedSocials.filter(l => !FOOTER_NETWORKS.some(p => p.toLowerCase() === l.platform.trim().toLowerCase())),
  ];
  const story = sectionBySlug(data,'story');
  const impact = sectionBySlug(data,'impact');
  const care = sectionBySlug(data,'care');
  const videoSection = sectionBySlug(data,'videos');
  const partnerSection = sectionBySlug(data,'partners');
  const connect = sectionBySlug(data,'connect');

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.utils.toArray<HTMLElement>('.gsap-reveal').forEach(el => {
      gsap.from(el, {opacity:0, y:38, duration:.95, ease:'power3.out', clearProps:'opacity,transform',
        scrollTrigger: {trigger:el,start:'top 87%',once:true}});
    });
    const hero = main.current?.querySelector('.hero-parallax');
    if (hero) gsap.fromTo(hero,{scale:1.06,yPercent:0},{scale:1.12,yPercent:15,ease:'none',scrollTrigger:{trigger:'#top',start:'top top',end:'bottom top',scrub:true}});
  },{scope:main,dependencies:[data],revertOnUpdate:true});

  return <div ref={main} className="min-h-screen overflow-x-clip bg-background font-sans text-foreground antialiased">
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${y>40?'border-b border-border bg-background/90 py-3 text-foreground shadow-sm backdrop-blur-xl':'py-6 text-white'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 md:px-6">
        <a href="#top" aria-label="Home" onClick={()=>setMobileOpen(false)} className="font-display text-[1.45rem] tracking-tight sm:text-2xl">{first} <span className="italic text-gold">{rest.join(' ')}</span></a>
        <nav aria-label="Main navigation" className="hidden gap-7 text-sm md:flex">
          {nav.map(([label,id])=><a key={id} href={`#${id}`} className="transition-opacity hover:opacity-70">{label}</a>)}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle initial={s.default_theme} />
          <a href="#connect" className="hidden rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-[#2a2116] transition-transform hover:scale-105 sm:block">Support the work</a>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-current/20 md:hidden" aria-label={mobileOpen?'Close navigation':'Open navigation'} aria-expanded={mobileOpen} onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?<X size={20}/>:<Menu size={20}/>}</button>
        </div>
      </div>
      {mobileOpen && <nav aria-label="Mobile navigation" className="mt-3 flex flex-col gap-1 border-t border-border bg-background px-6 py-3 text-foreground shadow-xl md:hidden">
        {nav.map(([label,id])=><a key={id} href={`#${id}`} className="rounded-xl px-3 py-3 text-sm hover:bg-card" onClick={()=>setMobileOpen(false)}>{label}</a>)}
        <a href="#connect" className="rounded-xl bg-gold px-3 py-3 text-center text-sm font-semibold text-[#2a2116] sm:hidden" onClick={()=>setMobileOpen(false)}>Support the work</a>
      </nav>}
    </header>

    <section id="top" className="relative flex min-h-[780px] min-h-screen items-end overflow-hidden text-white">
      <img src={getImage('hero','/images/hero.jpg')} alt={sectionImage(data,'hero')?.alt_text || s.name} className="hero-parallax absolute inset-0 h-full w-full object-cover object-[30%_20%]" fetchPriority="high" />
      <div className="hero-layer absolute inset-0" />
      <div className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-44 hero-shadow sm:pb-24">
        <p className="text-xs uppercase tracking-[.26em] text-[#e1be7a] sm:tracking-[.35em]">{s.tagline}</p>
        <h1 className="mt-6 max-w-5xl font-display text-[clamp(3.9rem,10vw,8.5rem)] leading-[.97] tracking-tight"><RichHeading text={s.mission} focus="feeding" /></h1>
        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-base leading-relaxed text-white/75 md:text-lg">{s.intro}</p>
          <div className="flex flex-wrap gap-3">
            {heroLinks.map((link,i)=>safeExternalLink(link.url)
              ? <a key={link.id} href={safeExternalLink(link.url)!} target="_blank" rel="noopener noreferrer" className={`pill inline-flex items-center gap-2 ${i===0?'pill-outline':'pill-gold'}`}>{link.label}<ArrowUpRight size={16}/></a>
              : <span key={link.id} aria-label={`${link.label}: website link pending`} title="Link will be added soon" className={`pill inline-flex items-center gap-2 opacity-65 ${i===0?'pill-outline':'pill-gold'}`}>{link.label}<ArrowUpRight size={16}/></span>)}
            {heroLinks.length===0 && <a href="#impact" className="pill pill-gold">See the impact ↓</a>}
          </div>
        </div>
      </div>
    </section>

    <section className="border-y border-border"><div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border md:grid-cols-4">
      {[...outreach.map(o=>[o.stat,o.location]),[String(partners.length),'Partner organisations']].slice(0,4).map(([n,l],i)=><div key={i} className="gsap-reveal px-6 py-10"><p className="font-display text-3xl text-gold md:text-4xl">{n}</p><p className="mt-2 text-sm text-muted-foreground">{l}</p></div>)}
    </div></section>

    <section id="story" className="section-target mx-auto grid max-w-7xl gap-16 px-6 py-24 md:grid-cols-2 md:py-32">
      <div className="md:sticky md:top-28 md:h-fit"><p className="text-xs uppercase tracking-[.35em] text-primary">{story?.eyebrow || 'Her story'}</p><h2 className="mt-6 font-display text-5xl leading-tight md:text-7xl"><RichHeading text={story?.heading || 'Faith, food & healing.'} focus="&" /></h2>
        <div className="mt-10 overflow-hidden rounded-2xl"><img src={getImage('story','/images/counsel.jpg')} alt={sectionImage(data,'story')?.alt_text || 'Counseling session'} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-[1.5s] hover:scale-105" /></div>
      </div>
      <div className="space-y-16 md:space-y-20 md:pt-40">{[[sectionBySlug(data,'story_about')?.heading||'About',s.about],[sectionBySlug(data,'story_recognition')?.heading||'Recognition',s.recognition],[sectionBySlug(data,'story_counseling')?.heading||'Counseling',s.counseling]].map(([title,body],i)=><div key={title} className="gsap-reveal"><span className="font-display text-xl italic text-primary">0{i+1}</span><h3 className="mt-2 font-display text-4xl">{title}</h3><p className="mt-5 text-lg leading-relaxed text-muted-foreground">{body}</p></div>)}</div>
    </section>

    <section id="impact" className="section-target relative px-6 pb-28 md:pb-32"><div className="mx-auto max-w-7xl">
      <div className="gsap-reveal mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end"><h2 className="font-display text-5xl md:text-7xl"><RichHeading text={impact?.heading || 'Regional impact'} focus="impact" /></h2><p className="max-w-sm text-muted-foreground">{impact?.description}</p></div>
      <div className="space-y-8">{outreach.map((o,i)=>{const m = assetById(data,o.media_id);return <article key={o.id} className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl md:sticky" style={{top:`${96+i*18}px`}}><div className="grid md:grid-cols-2">
        <div className="relative h-72 md:h-[480px]"><img src={m?.url || '/images/feeding.jpg'} alt={m?.alt_text || o.title} loading="lazy" className="h-full w-full object-cover" /><span className="absolute left-5 top-5 rounded-full bg-black/65 px-4 py-1.5 text-xs uppercase tracking-widest text-white backdrop-blur">{o.location}</span></div>
        <div className="flex flex-col justify-between p-8 md:p-12"><div>{o.date_label && <p className="text-sm text-primary">{o.date_label}</p>}<h3 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{o.title}</h3><p className="mt-5 text-lg leading-relaxed text-muted-foreground">{o.description}</p></div><p className="mt-10 font-display text-4xl text-gold md:text-5xl">{o.stat}</p></div>
      </div></article>})}</div>
    </div></section>

    <Care programs={programs} data={data} title={care?.heading || 'Beyond the plate.'} eyebrow={care?.eyebrow || 'Holistic care'} />

    <section id="videos" className="section-target mx-auto max-w-7xl px-6 py-28 md:py-32"><div className="gsap-reveal mb-12 max-w-3xl"><p className="text-xs uppercase tracking-[.35em] text-primary">{videoSection?.eyebrow || 'Stories in motion'}</p><h2 className="mt-5 font-display text-5xl md:text-7xl"><RichHeading text={videoSection?.heading || 'Impact in motion'} focus="motion" /></h2><p className="mt-5 max-w-xl text-lg text-muted-foreground">{videoSection?.description}</p></div>
      {videos.length ? <div className="grid gap-7 md:grid-cols-2">{videos.map(v=>{const asset=assetById(data,v.video_media_id);const thumb=assetById(data,v.thumbnail_media_id);const embed=videoEmbed(v.video_url);return <article key={v.id} className="gsap-reveal overflow-hidden rounded-2xl border border-border bg-card">
        {embed ? <div className="aspect-video"><iframe title={v.title} className="h-full w-full" src={embed} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
          : asset?.url ? <video controls preload="none" className="aspect-video w-full bg-black object-contain" poster={thumb?.url} src={asset.url} />
          : <div className="flex aspect-video items-center justify-center bg-black/30"><Play size={44} className="text-primary" /></div>}
        <div className="p-7"><h3 className="font-display text-3xl">{v.title}</h3><p className="mt-3 text-muted-foreground">{v.description}</p></div></article>})}</div>
       : <div className="gsap-reveal flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">Outreach films and stories will appear here soon.</div>}
    </section>

    <section className="border-y border-border py-16"><p className="mb-8 text-center text-xs uppercase tracking-[.35em] text-muted-foreground">{partnerSection?.eyebrow || 'In partnership with'}</p>
      {partners.length>0&&<div className="flex overflow-hidden"><div className="marquee flex shrink-0 gap-16 pr-16">{[...partners,...partners,...partners,...partners].map((p,i)=><span key={`${p.id}-${i}`} className="whitespace-nowrap font-display text-4xl text-foreground/70 md:text-5xl">{safeExternalLink(p.url)?<a href={safeExternalLink(p.url)!} rel="noopener noreferrer" target="_blank" className="hover:text-primary">{p.name}</a>:p.name}<span className="ml-16 text-primary">✦</span></span>)}</div></div>}
    </section>

    <section id="connect" className="section-target relative overflow-hidden px-6 py-32 text-center md:py-40"><img src={getImage('connect','/images/feeding.jpg')} alt={sectionImage(data,'connect')?.alt_text || ''} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25"/><div className="absolute inset-0 bg-fade"/>
      <div className="gsap-reveal relative mx-auto max-w-3xl"><h2 className="font-display text-5xl leading-tight md:text-7xl"><RichHeading text={connect?.heading || 'Every meal is a message of hope.'} focus="message of hope" /></h2><p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">{connect?.description}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">{s.contact_email&&<a href={`mailto:${s.contact_email}`} className="pill pill-gold">Get in touch</a>}{heroLinks.map(l=>safeExternalLink(l.url)&&<a key={l.id} href={safeExternalLink(l.url)!} target="_blank" rel="noopener noreferrer" className="pill admin-secondary">Visit {l.label} ↗</a>)}</div>
      </div>
    </section>

    <footer className="border-t border-border px-6 py-10 sm:py-12">
      <div className="mx-auto grid max-w-7xl gap-7 text-center text-sm text-muted-foreground lg:grid-cols-[1fr_auto] lg:text-left">
        <div>
          <span className="font-display text-2xl text-foreground">{s.name}</span>
          <p className="mt-2">© {new Date().getFullYear()} · {s.footer_location || 'Taraba State, Nigeria'}</p>
        </div>
        <div className="flex flex-col items-center gap-5 lg:items-end">
          <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-5 gap-y-3 sm:gap-x-7">
            {nav.map(([label,id])=><a key={id} href={`#${id}`} className="transition-colors hover:text-primary">{label}</a>)}
          </nav>
          <div className="flex flex-wrap items-center justify-center gap-3" aria-label="Social media channels">
            {footerSocials.map(({platform,url}) => {
              const href = safeExternalLink(url);
              const className = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border transition-colors';
              return href
                ? <a key={platform} href={href} target="_blank" rel="noopener noreferrer" title={platform} aria-label={`Visit ${platform}`} className={`${className} text-foreground hover:border-primary hover:text-primary`}><FooterSocialIcon platform={platform}/></a>
                : <span key={platform} aria-label={`${platform} link coming soon`} title={`${platform} — link not configured yet`} className={`${className} cursor-not-allowed text-muted-foreground opacity-55`}><FooterSocialIcon platform={platform}/></span>;
            })}
          </div>
        </div>
      </div>
    </footer>
  </div>;
}

function Care({ programs, data, title, eyebrow }: {programs: Program[];data:SiteData;title:string;eyebrow:string}) {
  const [active,setActive] = useState(0);
  const refs = useRef<(HTMLDivElement|null)[]>([]);
  useEffect(()=>{
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)setActive(Number((e.target as HTMLElement).dataset.i));}),{rootMargin:'-43% 0px -43% 0px'});
    refs.current.forEach(el=>el&&observer.observe(el));return()=>observer.disconnect();
  },[programs.length]);
  return <section id="care" className="section-target bg-card"><div className="mx-auto grid max-w-7xl gap-12 px-6 py-28 md:grid-cols-2 md:py-32"><div className="md:sticky md:top-0 md:flex md:h-screen md:items-center"><div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
    {programs.map((p,i)=>{const img=assetById(data,p.media_id);return <img key={p.id} src={img?.url||'/images/counsel.jpg'} alt={img?.alt_text||p.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-all duration-1000" style={{opacity:active===i?1:0,transform:active===i?'scale(1)':'scale(1.1)'}}/>;})}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-8"><p className="text-xs uppercase tracking-[.35em] text-[#e1be7a]">{eyebrow}</p></div>
  </div></div><div><h2 className="font-display text-5xl md:text-7xl"><RichHeading text={title} focus="plate" /></h2>{programs.map((p,i)=><div key={p.id} data-i={i} ref={el=>{refs.current[i]=el;}} className={`flex min-h-[45vh] flex-col justify-center border-l-2 pl-8 transition-all duration-700 md:min-h-[60vh] ${active===i?'border-primary opacity-100':'border-border opacity-40'}`}><span className="font-display text-6xl italic text-primary">0{i+1}</span><h3 className="mt-4 font-display text-4xl md:text-5xl">{p.title}</h3><p className="mt-5 max-w-md text-lg text-muted-foreground">{p.description}</p></div>)}</div></div></section>;
}
