# BEGINNER GUIDE — Connect Melody's website to Supabase

This guide assumes you have never used Supabase. You do **not** need to write SQL: the full SQL script is already included.

## Before you start

- Have a computer with Node.js **20.9 or newer** and npm installed.
- You need access to the email address that will be the **only administrator**.
- Start with a **new, empty Supabase project**. Do not run the supplied initial migration over an existing/production database.
- Never send passwords, Supabase secret/service-role keys, recovery links, or access tokens to anyone.

## Step 1 — Open the application locally

1. Extract `melody-website-nextjs.zip` on your computer.
2. Open its folder with VS Code or your preferred code editor.
3. Open a terminal inside the folder.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Visit `http://localhost:3000` in your browser.

**Before Supabase setup:** The public site will display the original images and preview text. The admin dashboard will display a clear “Connect Supabase” message and will not allow content changes. This is intentional.

## Step 2 — Create your Supabase project

1. Go to the Supabase website and sign up or log in.
2. Click **New project**, choose your organisation, and name it e.g. `melody-website`.
3. Choose the database region closest to your users and create a strong **database password**. Keep it private. The app never needs this password.
4. Wait until the project dashboard becomes available.

## Step 3 — Create all tables and media-storage policies

1. Open your Supabase project.
2. In the left menu, select **SQL Editor**.
3. Choose **New query**.
4. In this project folder open:
   `supabase/migrations/20261106000000_initial.sql`
5. Copy **all** of the SQL and paste it into the Supabase SQL Editor.
6. Click **Run**. The query creates the related database tables, demo content, Row Level Security policies, and the `site-media` storage bucket.
7. Verify in **Database → Tables** that these tables exist:

   - `user_roles` — controls access, never editable by the public website.
   - `site_settings` — website-wide text, SEO and theme.
   - `site_sections` — headings and descriptions for fixed sections.
   - `media_assets` — uploaded media metadata and URLs.
   - `section_media` — selects the hero, story and connect photographs.
   - `outreaches` — regional outreach records.
   - `programs` — care programmes and associated photographs.
   - `partners` — collaborating organisations.
   - `social_links` — footer social accounts.
   - `hero_links` — Aviv and MJ Foundations website links.
   - `outreach_videos` — outreach films, thumbnails and publishing status.

**Security:** The original uploaded project had a dangerous first-signup-becomes-admin trigger. This new project deliberately **does not** install that trigger. Administrator privileges are assigned manually only to a known account.

## Step 4 — Set up authentication URLs

1. In Supabase go to **Authentication → URL Configuration** (menu labels can vary).
2. Set **Site URL** to `http://localhost:3000` during local testing.
3. Add this **Redirect URL**:

   `http://localhost:3000/auth/callback`

4. After deploying the site, also add:

   `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback`

   Set **Site URL** to the final production domain when you publish.

5. The application includes secure email password-recovery and callback pages. In Supabase Authentication email settings, keep password recovery emails enabled.

## Step 5 — Connect your Next.js application

1. In Supabase, open the project's **Connect** dialog or **Project Settings → API Keys**.
2. Copy the **Project URL** and the **publishable key** (sometimes called the `anon` key in older Supabase dashboards).
3. In the Next.js root directory, create a file named `.env.local`.
4. Paste the following, replacing the sample values with your actual values:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
   ```

5. Restart the local development server (Ctrl+C, then `npm run dev`).

**Important:** The publishable key is intended for browser usage and is protected by Row Level Security. Never place a `service_role`, `sb_secret_...`, database password, or personal password into a `NEXT_PUBLIC_` variable. Do not commit `.env.local` to Git.

## Step 6 — Create and authorise the website administrator

**The website has no public signup page.**

1. In Supabase, select **Authentication → Users**.
2. Select **Add user** → **Create new user** (or **Invite user** if you prefer email invitations).
3. Use Melody's confirmed administrator email address. Set a strong initial password or send her a secure invitation.
4. Confirm/verify the email address according to the method used.
5. Find that user in the user list and copy their **User UID** (a UUID such as `11111111-2222-3333-4444-555555555555`).
6. Open **SQL Editor → New query** and run **this query only after replacing the UUID**:

   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('PASTE-REAL-USER-UUID-HERE', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

7. Open `http://localhost:3000/admin/login` and sign in with that authorised email and password.
8. If you see **Access not approved**, the account exists but you have not completed the administrator-role query (or are signed in to a different email).

**Recommended:** In **Authentication → Providers → Email**, disable public/new user signups after you have created the authorised administrator account. The admin role policy still protects edits even if an unrelated Supabase account is created.

## Step 7 — Test basic content edits

1. Open `/admin/login` and sign in.
2. Use the **collapsible sidebar** to select **Hero Section**.
3. Edit a text field and click **Save changes**.
4. Choose an existing hero image or click **Upload new**, then click **Save section image**.
5. Open the public homepage in another tab; reload to see your updates.
6. In **Social Media**, check the seeded Instagram profile link.
7. In **Hero Website Links**, paste the official Aviv and MJ Foundations links when available. They are **intentionally blank in the template** and should not point to guessed URLs.
8. For outreaches, programmes, and videos, uncheck **Publish on website** while preparing content; use **Save item** when ready.
9. The **Outreach Videos** section is empty until you add real videos. You can add YouTube/Vimeo URLs or upload short MP4/WebM files (max 50 MB).

## Step 8 — Test password recovery

1. Sign out.
2. Go to `/admin/login`.
3. Click **Forgot password?** and enter the authorised email.
4. Open the recovery email and follow the link.
5. Enter and confirm a new password on `/admin/reset-password`.
6. Log in again to confirm that the password works.

If the link fails, verify the Auth redirect URLs in Step 4 and request a fresh link. For public production use, configure an appropriate SMTP provider in Supabase so recovery emails are delivered reliably; the built-in testing mailer has limitations.

## Step 9 — Publish on Vercel

1. Create a new Git repository from the Next.js source (do not commit `.env.local`).
2. Import the repository into **Vercel** as a Next.js project.
3. Under **Project → Settings → Environment Variables**, enter:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

4. Deploy the app and copy the live Vercel URL.
5. Add `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback` to Supabase's Auth redirect allow list.
6. Update the Supabase Site URL to your production domain once it is final.
7. Test the homepage, theme toggle, image changes, the admin login, image uploads, video playback, and password recovery on a real phone.
8. Later, when you use a custom domain, add that exact domain's callback URL to Supabase too.

## Useful CMS sections

| Menu | What the administrator can do |
|---|---|
| Dashboard | See counts and open common tasks |
| Hero Section | Edit mission, intro, image, and two links |
| Our Story | Update story text and photograph |
| Regional Impact | Create, read, edit, delete, publish and reorder outreaches; attach image |
| Holistic Care | Manage programmes and their photos |
| Outreach Videos | Add YouTube/Vimeo videos or uploaded films and thumbnails |
| Partners | Manage collaborating organisations |
| Connect Section | Edit call-to-action, image, and contact email |
| Image / Video Library | Upload, edit descriptions, and delete media |
| Social Media | Manage footer social accounts |
| Hero Website Links | Manage the two external buttons |
| Website Settings | Edit general identity, section headings, SEO and default theme |
| My Profile & Security | See signed-in email, change password and sign out |

## Important notes

- **Original appearance:** The public site's broad layout, fonts, image set, section order (with the new video section), colour aesthetic, and storytelling cards are inherited from the uploaded reference project.
- **New framework:** The code now uses Next.js App Router rather than TanStack Start.
- **Images:** Existing starter images remain included locally for preview. Any replacements are uploaded to the Supabase `site-media` bucket and their references stored in the database.
- **Photo authenticity:** Starter images came from the original template. Confirm permission to publish images and replace them with authorised photographs of Melody and her team.
- **Claims:** Outreach impact figures and recognition were provided as draft content; confirm before publishing as verified facts.
- **Links pending:** The official website URLs for Aviv and MJ Foundations have not been supplied. They are deliberately left blank, and the hero shows non-clickable labels until configured.
- **Performance:** Large films should generally be embedded from an official YouTube/Vimeo account rather than uploaded directly.
- **Security:** The owner is the only intended editor; do not insert additional roles casually. Supabase RLS is essential and must not be disabled.

## Troubleshooting

- **Admin says "Connect Supabase":** `.env.local` is missing or contains empty values; restart the server.
- **Admin says "Access not approved":** Follow Step 6 and grant the existing auth user the admin role via SQL.
- **Tables missing:** Step 3 SQL was not run completely in the intended Supabase project.
- **Upload gives "row-level security" error:** Your signed-in user is not in `user_roles` or the SQL policies were not installed.
- **Forgot-password link fails:** Check redirect allow lists, email template settings and the live domain URL.
- **Changes do not show:** Press Save on the item and reload the public page; ensure the record is Published.

---

**Environment status:** These source files were assembled and syntax-parsed in the workspace, but no live Supabase project, actual administrator credentials, complete dependency installation, production build or browser end-to-end test was available here. Follow the steps above, run `npm run build` and `npm run typecheck`, and validate the deployed site before sharing it publicly.
