-- MELODY GAIUS DANJUMA | FRESH SUPABASE PROJECT SCHEMA
-- Run once in a NEW Supabase project (SQL Editor). Do NOT combine with the source project's
-- insecure first-signup-admin trigger. No public signup or automatic admin privileges here.

-- In case an earlier experiment installed the insecure source-project trigger:
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP FUNCTION IF EXISTS public.handle_first_admin();

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles AS r
    WHERE r.user_id = (SELECT auth.uid()) AND r.role::text = 'admin'
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  storage_path text UNIQUE,
  filename text NOT NULL DEFAULT '',
  alt_text text NOT NULL DEFAULT '',
  media_type text NOT NULL DEFAULT 'image' CHECK(media_type IN ('image', 'video')),
  file_size bigint NOT NULL DEFAULT 0 CHECK(file_size >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK(id = 1),
  name text NOT NULL DEFAULT '', tagline text NOT NULL DEFAULT '',
  intro text NOT NULL DEFAULT '', mission text NOT NULL DEFAULT '',
  about text NOT NULL DEFAULT '', recognition text NOT NULL DEFAULT '',
  counseling text NOT NULL DEFAULT '', contact_email text NOT NULL DEFAULT '',
  seo_title text NOT NULL DEFAULT '', seo_description text NOT NULL DEFAULT '',
  seo_image_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  default_theme text NOT NULL DEFAULT 'dark' CHECK(default_theme IN('dark','light')),
  footer_location text NOT NULL DEFAULT 'Taraba State, Nigeria',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.site_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  eyebrow text NOT NULL DEFAULT '',
  heading text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS public.section_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.outreaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '', date_label text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '', stat text NOT NULL DEFAULT '',
  media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), platform text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.hero_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), label text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.outreach_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '', video_url text NOT NULL DEFAULT '',
  video_media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  thumbnail_media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Row-level security: ALL writes require server-verified admin role.
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own role" ON public.user_roles;
CREATE POLICY "Read own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
GRANT SELECT ON public.user_roles TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'site_settings','site_sections','media_assets','section_media','outreaches',
    'programs','partners','social_links','hero_links','outreach_videos'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public read" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admin insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admin update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admin delete" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Public read" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Admin insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Admin update" ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Admin delete" ON public.%I FOR DELETE TO authenticated USING (public.is_admin())', t);
  END LOOP;
END $$;

-- Override read policies on publishable lists: draft rows are admin-only.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['outreaches','programs','partners','social_links','hero_links','outreach_videos'] LOOP
    EXECUTE format('DROP POLICY "Public read" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Published or admin read" ON public.%I FOR SELECT TO anon, authenticated USING (published OR public.is_admin())', t);
  END LOOP;
END $$;

-- Storage: public media bucket for published site imagery, only approved admins can upload/edit/delete.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('site-media','site-media',true,52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif','video/mp4','video/webm'])
ON CONFLICT (id) DO UPDATE SET public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS "Public site-media read" ON storage.objects;
CREATE POLICY "Public site-media read" ON storage.objects FOR SELECT TO anon,authenticated
  USING (bucket_id='site-media');
DROP POLICY IF EXISTS "Admin site-media uploads" ON storage.objects;
CREATE POLICY "Admin site-media uploads" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='site-media' AND public.is_admin());
DROP POLICY IF EXISTS "Admin site-media changes" ON storage.objects;
CREATE POLICY "Admin site-media changes" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id='site-media' AND public.is_admin()) WITH CHECK (bucket_id='site-media' AND public.is_admin());
DROP POLICY IF EXISTS "Admin site-media deletes" ON storage.objects;
CREATE POLICY "Admin site-media deletes" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='site-media' AND public.is_admin());

-- Four starter images (copied to /public/images/ in the Next.js app).
INSERT INTO public.media_assets(id,url,filename,alt_text,media_type) VALUES
 ('00000000-0000-4000-8000-000000000001','/images/hero.jpg','hero.jpg','Melody Gaius Danjuma','image'),
 ('00000000-0000-4000-8000-000000000002','/images/feeding.jpg','feeding.jpg','Community feeding and outreach','image'),
 ('00000000-0000-4000-8000-000000000003','/images/widows.jpg','widows.jpg','Widow support and community care','image'),
 ('00000000-0000-4000-8000-000000000004','/images/counsel.jpg','counsel.jpg','Counselling and support','image')
ON CONFLICT(id) DO NOTHING;

INSERT INTO public.site_settings
(id,name,tagline,intro,mission,about,recognition,counseling,contact_email,seo_title,seo_description,default_theme)
VALUES (1,'Melody Gaius Danjuma','Social worker · Christian counselor · Humanitarian',
 'A passionate social worker, Christian counselor and humanitarian based in Taraba State, Nigeria.',
 'Reveal Jesus by feeding the people.',
 'Melody is the founder and Managing Director of the Melody Gaius Foundation, a faith-based charity dedicated to feeding the hungry, hosting children''s outreach programs and providing local community support. Her work blends physical charity with spiritual ministry and psychological support.',
 'Recognized by the Rhapsodi Affos Blog as one of Taraba''s Twenty Most Influential Youths for her community and philanthropic outreach.',
 'Through Aviv Counseling, Melody focuses on family support and mental well-being.', '',
 'Melody Gaius Danjuma — Humanitarian & Counselor',
 'Faith, food and healing: outreach, counseling and community support in Taraba, Gombe and Adamawa, Nigeria.', 'dark')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.site_sections(slug,eyebrow,heading,description) VALUES
 ('story','Her story','Faith, food & healing.',''),
 ('story_about','','About',''),
 ('story_recognition','','Recognition',''),
 ('story_counseling','','Counseling',''),
 ('impact','','Regional impact','From her home in Takum to communities across northern Nigeria.'),
 ('care','Holistic care','Beyond the plate.',''),
 ('videos','Stories in motion','Impact in motion','Moments of service, compassion and hope from our community outreaches.'),
 ('partners','In partnership with','',''),
 ('connect','','Every meal is a message of hope.','Partner with the Melody Gaius Foundation to reach more children and families.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.section_media(section_key,media_id) VALUES
 ('hero','00000000-0000-4000-8000-000000000001'),
 ('story','00000000-0000-4000-8000-000000000004'),
 ('connect','00000000-0000-4000-8000-000000000002')
ON CONFLICT(section_key) DO NOTHING;

INSERT INTO public.outreaches(location,title,date_label,description,stat,media_id,sort_order) VALUES
 ('Taraba State','Where it began — Takum','Ongoing','As a native of Takum, Melody launched her earliest efforts here, providing direct meals and spiritual support to less-privileged individuals.','Hundreds fed','00000000-0000-4000-8000-000000000002',1),
 ('Gombe State','Feed a Thousand Children','May 2026','With the Purpose Ignite Initiative, the foundation distributed raw food items and cooked meals across Gombe city.','1,000+ children & families','00000000-0000-4000-8000-000000000002',2),
 ('Adamawa State','Compassion for widows — Yola','','A dedicated outreach providing relief items alongside prayer, counseling and emotional encouragement.','60+ widows','00000000-0000-4000-8000-000000000003',3);
INSERT INTO public.programs(title,description,media_id,sort_order) VALUES
 ('Targeted Aid','Partnering with local orphanages and vulnerable widows, offering financial support to help rebuild local businesses.','00000000-0000-4000-8000-000000000003',1),
 ('Teenage & Child Counselling','Emotional healing and mental health guidance sessions that help children and teenagers process silent trauma and build personal hope.','00000000-0000-4000-8000-000000000004',2),
 ('Collaborative Interventions','Networking with regional NGOs to scale the reach of community interventions.','00000000-0000-4000-8000-000000000002',3);
INSERT INTO public.partners(name,sort_order) VALUES
 ('Purpose Ignite Initiative',1),('Raising Women Initiative',2),('Magdalene Musa Foundation',3);
INSERT INTO public.social_links(platform,url,sort_order) VALUES
 ('Instagram','https://www.instagram.com/melodygaiusfoundation/',1);
INSERT INTO public.hero_links(label,url,sort_order) VALUES
 ('Aviv Counseling','',1),('MJ Foundations','',2);

-- IMPORTANT: NO AUTO-ADMIN REGISTRATION.
-- 1) In Supabase Dashboard > Authentication > Users, add the owner's email and password.
-- 2) Copy her generated auth user UUID and run the following AFTER replacing the placeholder:
-- INSERT INTO public.user_roles (user_id,role) VALUES ('PASTE-AUTH-USER-UUID','admin');
-- Never expose service_role/secret keys in browser environment variables.
