import type { SupabaseClient } from '@supabase/supabase-js';
import { previewContent } from './demo-content';
import type { SiteData } from './types';
import { isSupabaseConfigured } from './supabase/config';

const publicTables = [
  'site_settings', 'site_sections', 'media_assets', 'section_media', 'outreaches',
  'programs', 'partners', 'social_links', 'hero_links', 'outreach_videos',
] as const;

export async function fetchContent(client: SupabaseClient): Promise<SiteData> {
  const responses = await Promise.all(publicTables.map((table) => {
    let query = client.from(table).select('*');
    if (['outreaches','programs','partners','social_links','hero_links','outreach_videos','section_media'].includes(table)) {
      query = query.order('sort_order');
    }
    return query;
  }));
  for (let i = 0; i < responses.length; i++) {
    if (responses[i].error) throw new Error(`${publicTables[i]}: ${responses[i].error?.message}`);
  }
  const [settings, sections, media, sectionMedia, outreaches, programs, partners, socials, heroLinks, videos] = responses.map((r) => r.data);
  if (!settings?.[0]) throw new Error('Supabase site_settings has no seed data. Run the provided SQL migration.');
  return {
    settings: settings[0], sections: sections || [], media: media || [],
    section_media: sectionMedia || [], outreaches: outreaches || [], programs: programs || [],
    partners: partners || [], social_links: socials || [], hero_links: heroLinks || [],
    outreach_videos: videos || [],
  } as SiteData;
}

export async function getPublicContent(): Promise<{data: SiteData; setupNeeded: boolean}> {
  if (!isSupabaseConfigured()) return { data: previewContent, setupNeeded: true };
  // Public read queries are covered by database RLS and cannot fetch unpublished content.
  const { createClient } = await import('./supabase/server');
  try { return { data: await fetchContent(await createClient()), setupNeeded: false }; }
  catch (err) {
    console.error('Could not load public site content:', err);
    return { data: previewContent, setupNeeded: true };
  }
}

