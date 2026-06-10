# Environment Strategy

| Environment | Purpose | URL (example) | Backend |
|-------------|---------|---------------|---------|
| **development** | Local dev | `http://localhost:5173` | Mock data / Supabase dev project |
| **staging** | QA & stakeholder review | `https://staging.dojang.app` | Supabase staging |
| **production** | Live dojang users | `https://app.dojang.app` | Supabase production |

## Local setup

1. Copy `.env.example` → `.env.local`
2. Set `VITE_APP_ENV=development`
3. Run `npm run dev`

## Secrets (never commit)

| Variable | Phase | Where |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | 1 | Frontend |
| `VITE_SUPABASE_ANON_KEY` | 1 | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | 1+ | CI / Edge functions only |
| `SENDGRID_API_KEY` | 3 | Server / Edge functions |

## Deployment targets (recommended)

- **Frontend:** Vercel, Netlify, or Cloudflare Pages (preview per PR)
- **Backend:** Supabase hosted project per environment
- **Video storage:** Supabase Storage bucket per environment

## Phase 0 status

- Frontend runs locally with demo data
- No backend env vars required yet
