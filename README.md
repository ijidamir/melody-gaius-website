# Melody Gaius Danjuma — Humanitarian Portfolio + CMS

Next.js App Router implementation of the supplied humanitarian portfolio template, preserving the public-facing editorial design and adding a professional, secure CMS.

## Features

- Next.js 16 / React 19 / TypeScript / Tailwind CSS 4.
- Original dark-and-gold design + user-selectable light mode.
- GSAP + ScrollTrigger entrance animations and hero parallax, respecting reduced-motion preferences.
- Mobile navigation and fully responsive public pages.
- Editable hero / story / connect images, outreach images, programme images, video files and thumbnails.
- CMS-editable copy, outreach statistics, programmes, partners, section headlines, SEO, social links and two hero links.
- Outreach videos with YouTube/Vimeo embeds or Supabase Storage video files.
- Admin-only login, no public signup, password recovery with Supabase Auth, role checks and RLS.
- Professional admin area with collapsible sidebar, multiple management modules and CRUD.
- Multi-table PostgreSQL schema, data seeds and Storage policies under `supabase/migrations`.

## Quick start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. Without environment variables the public site displays preview content and the admin is locked, intentionally.

To connect Supabase, follow **[SETUP_SUPABASE.md](SETUP_SUPABASE.md)**. Copy `.env.example` to `.env.local` and insert your own project's URL + publishable key. Create the database using the SQL migration and manually grant the owner's `admin` role.

## Routes

| Route | Purpose |
|---|---|
| `/` | Responsive public portfolio |
| `/admin` | Protected dashboard and CMS |
| `/admin/login` | Secure sign-in / forgot password |
| `/admin/reset-password` | New-password form |
| `/auth/callback` | Secure Supabase PKCE recovery callback |

## Source directories

- `src/components/site` — public UI/UX
- `src/components/admin` — CMS, CRUD and uploads
- `src/lib` — content, preview data, Supabase client utilities
- `src/app` — Next.js App Router pages and styles
- `public/images` — inherited original images
- `supabase/migrations` — schema, RLS, Storage, seed content

## Status / important limitations

- This is a complete implementation **in source code**, not a deployed website.
- External links for **Aviv Counseling** and **MJ Foundations** require the official destinations from the owner; placeholders deliberately have no destination.
- Original sample images are placeholders until the owner's approved real photographs are uploaded.
- New Supabase project and administrator account must be created by the owner following the guide. There are no secrets embedded in the project.
- The project could not be fully built or browser-tested in this execution environment because npm dependencies could not be fetched and no Supabase project credentials were supplied; no claims of production readiness are made.
