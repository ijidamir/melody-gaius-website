import type { Metadata } from 'next';
import { getPublicContent } from '@/lib/content-server';
import PublicSite from '@/components/site/public-site';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getPublicContent();
  return {
    title: data.settings.seo_title || data.settings.name,
    description: data.settings.seo_description || data.settings.intro,
    openGraph: { title: data.settings.seo_title || data.settings.name,
      description: data.settings.seo_description || data.settings.intro,
      images: data.media.filter(m => m.id === data.settings.seo_image_id).map(m => m.url)},
  };
}
export default async function HomePage() {
  const { data } = await getPublicContent();
  return <PublicSite data={data} />;
}
