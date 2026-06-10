# API Contract (Draft)

REST-style API via **Supabase PostgREST** + **Edge Functions** for email. Phase 0 documents intended endpoints; implementation starts Phase 1.

Base URL: `https://<project>.supabase.co/rest/v1`

Auth header: `Authorization: Bearer <jwt>`

---

## Auth (Phase 1) — Supabase Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/v1/signup` | Register with role metadata |
| POST | `/auth/v1/token?grant_type=password` | Login |
| POST | `/auth/v1/logout` | Logout |

---

## Profiles

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/profiles?id=eq.{id}` | self | Get profile |
| PATCH | `/profiles?id=eq.{id}` | self | Update name, avatar |

---

## Requirements & curriculum (Phase 2)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/belt_ranks?school_id=eq.{id}` | all | List belts |
| GET | `/requirements?belt_rank_id=eq.{id}` | student+ | Requirements for belt |
| POST | `/requirements` | instructor | Create requirement |
| PATCH | `/requirements?id=eq.{id}` | instructor | Update requirement |

---

## Progress workflow (Phase 3)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/student_progress?student_id=eq.{id}` | student, parent, instructor | List progress |
| POST | `/student_progress` | student | Mark **attempted** |
| PATCH | `/student_progress?id=eq.{id}` | parent | Set **parent_verified** |
| PATCH | `/student_progress?id=eq.{id}` | instructor | **approve** or **deny** + feedback |

### Edge function: `notify-instructor`

Triggered on progress status change.

```json
POST /functions/v1/notify-instructor
{
  "progress_id": "uuid",
  "event": "parent_verified" | "video_submitted"
}
```

Response: `{ "ok": true, "email_id": "..." }`

---

## Video (Phase 4)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/storage/v1/object/submissions/{path}` | student | Upload video |
| GET | `/functions/v1/signed-video-url?submission_id=` | parent, instructor | Temporary playback URL |
| PATCH | `/video_submissions?id=eq.{id}` | parent | Approve upload |

---

## Reports (Phase 5)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/functions/v1/export-progress?student_id=` | instructor | CSV/PDF report |

---

## Realtime (Phase 3)

Subscribe: `student_progress` changes filtered by `student_id` or `school_id`.

---

## Error format

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Parent not linked to this student"
  }
}
```

## Backend decision

**Recommended:** Supabase (Postgres + Auth + Storage + Edge Functions + Realtime) for Phases 1–5.
