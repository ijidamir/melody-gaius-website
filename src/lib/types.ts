export type MediaAsset = {
  id: string; url: string; storage_path: string | null; filename: string;
  alt_text: string; media_type: 'image' | 'video'; file_size: number; created_at: string;
};
export type SiteSettings = {
  id: number; name: string; tagline: string; intro: string; mission: string;
  about: string; recognition: string; counseling: string; contact_email: string;
  seo_title: string; seo_description: string; seo_image_id: string | null;
  default_theme: 'dark' | 'light'; footer_location: string; updated_at?: string;
};
export type SiteSection = {
  id: string; slug: string; eyebrow: string; heading: string; description: string;
};
export type SectionMedia = {
  id: string; section_key: string; media_id: string | null; sort_order: number;
};
export type Outreach = {
  id: string; title: string; location: string; date_label: string;
  description: string; stat: string; media_id: string | null;
  sort_order: number; published: boolean;
};
export type Program = {
  id: string; title: string; description: string; media_id: string | null;
  sort_order: number; published: boolean;
};
export type Partner = {
  id: string; name: string; url: string; sort_order: number; published: boolean;
};
export type SocialLink = {
  id: string; platform: string; url: string; sort_order: number; published: boolean;
};
export type HeroLink = {
  id: string; label: string; url: string; sort_order: number; published: boolean;
};
export type OutreachVideo = {
  id: string; title: string; description: string; video_url: string;
  video_media_id: string | null; thumbnail_media_id: string | null;
  sort_order: number; published: boolean;
};
export type SiteData = {
  settings: SiteSettings; sections: SiteSection[]; media: MediaAsset[];
  section_media: SectionMedia[]; outreaches: Outreach[]; programs: Program[];
  partners: Partner[]; social_links: SocialLink[]; hero_links: HeroLink[];
  outreach_videos: OutreachVideo[];
};
