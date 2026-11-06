import type {SiteData} from './types';

export function assetById(data: SiteData, id: string | null | undefined) {
  return data.media.find((m) => m.id === id);
}
export function sectionImage(data: SiteData, key: string) {
  return assetById(data, data.section_media.find((m) => m.section_key === key)?.media_id);
}
export function sectionBySlug(data: SiteData, slug: string) {
  return data.sections.find((s) => s.slug === slug);
}
export function published<T extends {published: boolean;sort_order: number}>(rows: T[]) {
  return rows.filter((r) => r.published).sort((a,b) => a.sort_order-b.sort_order);
}
export function safeExternalLink(url: string) {
  try { const p = new URL(url); return p.protocol === 'https:' ? p.href : null; }
  catch { return null; }
}
