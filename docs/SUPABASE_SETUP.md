# Supabase Setup — Phase 1 Auth

This guide walks through connecting Dojang to Supabase for real authentication, profiles, and role-based access.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon public** key from **Settings → API**.

## 2. Configure environment variables

Copy `.env.example` to `.env` and set:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
```

Restart the dev server after changing env vars.

## 3. Run the Phase 1 migration

Open **SQL Editor** in Supabase and run the full contents of:

```
supabase/migrations/001_phase1_auth.sql
```

This creates:

- `profiles`, `parent_student_links`, `instructor_students`, `link_codes`
- Trigger to auto-create profiles on signup
- RPCs: `redeem_link_code`, `find_profile_by_email`
- Row Level Security policies

## 4. Auth settings (optional)

In **Authentication → Providers → Email**:

- Enable email/password signups
- For local dev, you may disable **Confirm email** to skip verification

For password reset, add `http://localhost:5173/login` to **Redirect URLs**.

## 5. Create test accounts

Use the app **Sign up** page or Supabase Auth dashboard. Choose role at signup:

| Role | Suggested test email |
|------|---------------------|
| Student | `student@test.local` |
| Parent | `parent@test.local` |
| Instructor | `instructor@test.local` |

Each account lands on its role dashboard after login.

## 6. Link parent to student

1. Sign in as **student** → **Profile** → **Generate new code**
2. Sign in as **parent** → **Children** → enter the 6-character code
3. Parent should see the linked student on the Children page

## 7. Assign student to instructor roster

1. Ensure the student profile has `notification_email` set (Profile settings).
2. Sign in as **instructor** → **Students** → add student by that email.

## 8. Verify RLS

- Students can only read/update their own profile
- Parents can read linked children's profiles
- Instructors can read roster students' profiles
- Cross-family access should fail at the database layer

## Demo mode (no Supabase)

If env vars are missing, the app runs in **demo mode**:

- Auth is stored in `localStorage`
- Dashboards use sample data from `src/data/demoData.js`
- A banner indicates demo mode is active

This allows UI development without a backend.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login returns but profile is null | Check migration ran; verify `handle_new_user` trigger exists |
| Parent code redeem fails | Code expired (7 days) or already used; generate a new one |
| Instructor can't find student | Student must exist; email must match auth email or notification email |
| CORS errors | Use the anon key, not the service role key, in the frontend |

## Phase 2 — Curriculum

Run `supabase/migrations/002_phase2_curriculum.sql` after Phase 1.

Instructors: **Curriculum → Edit belt → Seed full WT curriculum** loads all belt requirements.

Students see requirements matching their profile `belt_id` (e.g. `yellow`).

## Phase 3 — Workflow

Run `supabase/migrations/003_phase3_workflow.sql`.

Deploy the email edge function:

```bash
supabase functions deploy send-workflow-email
```

Set secrets: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, optional `WORKFLOW_EMAIL_TO` for dev routing.

**Demo E2E flow:** Sign up as Student → mark requirement attempted → sign in as Parent → Verify → sign in as Instructor → Approve/Deny. Check the 🔔 notification bell at each step.

## Phase 4 — Video

1. Run `supabase/migrations/004_phase4_video.sql`
2. Create a **private** Storage bucket named `submissions`
3. Deploy: `supabase functions deploy signed-video-url`

**Video flow:** Student records/uploads on Training detail → Parent approves at **Videos** → Instructor plays in **Reviews** (slow-mo + fullscreen).
