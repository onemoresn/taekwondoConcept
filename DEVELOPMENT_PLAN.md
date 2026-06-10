# Taekwondo Training & Belt-Progression App — Development Plan

A phased roadmap to build a fully responsive, role-based Taekwondo platform for **students**, **parents**, and **instructors** with belt tracking, video submissions, parent verification, and instructor notifications.

---

## Executive Summary

| Item | Detail |
|------|--------|
| **Product** | Multi-role Taekwondo dojang app (training, belt progression, video submissions, approvals) |
| **Primary users** | Students (kids/teens), parents/guardians, instructors |
| **Approach** | Mobile-first responsive web app (PWA-capable), cloud backend, email notifications |
| **Suggested timeline** | ~6–9 months for core product (Phases 0–5); Phase 6+ optional |
| **Starting point** | Greenfield or rebuild; prior prototype covered static curriculum UI only (no auth, backend, or workflows) |

---

## Goals & Success Criteria

1. **Responsive everywhere** — Usable on phones (primary), tablets, and desktop without layout breakage.
2. **Role clarity** — Each role sees only what they need; permissions enforced server-side.
3. **Trust chain** — Student → Parent verification → Instructor approval for every requirement.
4. **Instructor awareness** — Email (and in-app) alerts when action is required.
5. **Video-first learning** — Techniques and submissions center on short demo/review clips.
6. **Belt-aware content** — Curriculum, exercises, and checklists filter automatically by rank.

---

## Recommended Architecture

### Frontend
- **React 18 + Vite** — Fast dev, code-splitting, PWA plugin for install/offline shell
- **React Router** — Role-based route guards
- **TanStack Query** — Server state, caching, real-time invalidation
- **CSS** — Mobile-first design tokens + breakpoints (480 / 640 / 768 / 1024 / 1280px); optional Tailwind if team prefers utility workflow
- **Media** — `MediaRecorder` API + `<input type="file" capture>` for mobile recording/upload

### Backend (recommended: **Supabase** or **Firebase** for speed; **custom Node** if multi-tenant complexity grows)
- **PostgreSQL** — Users, roles, belts, requirements, progress, submissions
- **Auth** — Email/password + magic link; optional OAuth for parents
- **Storage** — S3-compatible (Supabase Storage, R2, or S3) for videos with signed URLs
- **Edge functions / serverless** — Email triggers, webhooks, approval state machine
- **Realtime** — Postgres changes or WebSockets for dashboard updates

### Email
- **SendGrid** (or Resend, AWS SES, SMTP via Outlook 365)
- Templates: requirement completed, parent verification needed, instructor review link

### Security
- Row-level security (RLS) by `user_id`, `child_id`, `school_id`, `role`
- JWT/session with short-lived tokens; refresh rotation
- Video URLs time-limited; no public buckets
- COPPA/parent-consent considerations if serving minors

---

## Data Model (High Level)

```
School
  └── Instructor (many)
  └── Students (many)
        └── Parent links (many-to-many guardian ↔ child)

BeltRank (White → Black)
  └── Requirement (type: technique | form | self_defense | terminology | conditioning | leadership)
        └── Content (video URL, steps, flashcards, checklist items)

StudentProgress
  └── requirement_id
  └── status: not_started | attempted | parent_verified | submitted | instructor_approved | denied
  └── parent_notes, instructor_feedback
  └── video_submission_id (optional)

VideoSubmission
  └── student_id, requirement_id, storage_key, duration, uploaded_at
  └── parent_approved_at, instructor_reviewed_at

Tip / Stripe / TestReadiness (derived or explicit flags)
Notification (in-app) + EmailLog
```

---

## User Roles & Permissions

| Capability | Student | Parent | Instructor |
|------------|:-------:|:------:|:----------:|
| View own belt & requirements | ✓ | ✓ (child) | ✓ (all assigned) |
| Watch technique / lesson videos | ✓ | ✓ | ✓ |
| Mark requirement **attempted** | ✓ | — | — |
| Verify child completion | — | ✓ | — |
| Upload / confirm video | ✓ (record) | ✓ (approve upload) | — |
| Approve / deny progress | — | — | ✓ |
| Comment / feedback | — | notes | ✓ |
| Manage curriculum | — | — | ✓ |
| Export reports | — | — | ✓ |
| Email notifications | optional | ✓ | ✓ |

---

## UI/UX Principles

- **Mobile-first**, progressive enhancement to tablet/desktop (sidebar nav ≥1024px)
- **Martial-arts theme** — Dark default with red/gold belt accents; **light mode** toggle (Phase 6)
- **Color-coded belts** — Progress rings, strips, and badges match rank colors
- **Simple navigation** — Large tap targets for kids; plain language for parents
- **Video-first** — Thumbnail cards, inline players, record/upload prominent on requirement detail
- **Status chips** — Attempted → Parent verified → Instructor approved (color-coded pipeline)
- **Accessibility** — WCAG 2.1 AA contrast, keyboard nav, captions on technique videos

---

# Development Phases

---

## Phase 0 — Foundation & Discovery (2 weeks)

**Objective:** Align stakeholders, establish repo, design system, and technical baseline.

### Deliverables
- [x] Product requirements sign-off (this document + wireframes)
- [x] Monorepo or single-repo structure (`/apps/web`, `/packages/shared`, `/services/api` optional)
- [x] CI/CD (GitHub Actions: lint, test, preview deploy)
- [x] Environment strategy (dev, staging, production)
- [x] ERD + API contract draft
- [x] Responsive **app shell** (no auth): home, nav, belt colors, typography
- [x] Design mockups for Student / Parent / Instructor dashboards

### Acceptance Criteria
- App runs on mobile emulator and desktop browser at all breakpoints
- Design tokens documented (colors, spacing, breakpoints, belt palette)
- Team agrees on backend choice (Supabase vs custom)

### Dependencies
None

---

## Phase 1 — Authentication & Role-Based Access (3 weeks)

**Objective:** Secure login and role routing for Student, Parent, Instructor.

### Deliverables
- [x] Auth provider integration (signup, login, password reset, session)
- [x] User profile model with `role` enum
- [x] Parent ↔ child linking (invite code or instructor assignment)
- [x] Instructor ↔ school/student assignment
- [x] Protected routes and layout per role
- [x] Basic profile settings (name, avatar, notification email)

### Technical Tasks
- Database tables: `users`, `profiles`, `parent_student_links`, `instructor_students`
- RLS policies: students see self; parents see linked children; instructors see roster
- Middleware: reject cross-role API access

### Acceptance Criteria
- Three test accounts (one per role) land on correct dashboard after login
- Parent cannot access another family’s data (verified by integration tests)
- Session persists on mobile PWA add-to-home-screen

### Dependencies
Phase 0

---

## Phase 2 — Belt Curriculum & Requirement Engine (4 weeks)

**Objective:** Model belts, requirements, and static curriculum delivery (no workflows yet).

### Deliverables
- [x] **Belt rank** admin (instructor): CRUD ranks, order, colors
- [x] **Requirement types** per belt:
  - Techniques
  - Forms (poomsae) with step lists
  - Self-defense steps
  - Terminology lists
  - Conditioning exercises
  - Leadership / character tasks
- [x] Instructor UI: curriculum editor (requirements + attached content metadata)
- [x] Student UI: belt dashboard — requirements grouped by type with progress % 
- [x] Seed data: WT-style Taegeuk forms, sample terminology (port from prototype curriculum)
- [x] **Tips, stripes, test readiness** flags (manual instructor toggle initially)

### Content Types (stored as JSON or related tables)
- Technique: name, Korean, demo video URL, key points
- Form: name, meaning, ordered steps
- Terminology: flashcard pairs
- Exercise: reps/duration, category
- Checklist: test-day items

### Acceptance Criteria
- Instructor publishes curriculum; student at Yellow sees Yellow requirements only
- Progress bar = completed requirements / total for current belt
- Fully responsive curriculum views (single column mobile, multi-column desktop)

### Dependencies
Phase 1

---

## Phase 3 — Progress Workflow & Email Notifications (4 weeks)

**Objective:** Implement Student → Parent → Instructor approval chain with email alerts.

### Workflow States
```
not_started → attempted (student)
           → parent_verified (parent)
           → pending_review (video optional)
           → approved | denied (instructor)
```

### Deliverables
- [x] Student: mark requirement **Attempted** + optional note
- [x] Parent: notification prompt + **Verify** / **Not yet** + optional note
- [x] Instructor: queue of items awaiting review; approve/deny + comment
- [x] **Email notifications** (SendGrid):
  - Parent: child marked requirement attempted
  - Instructor: parent verified OR video submitted
  - Student/parent: instructor approved/denied with feedback
- [x] Email content: student name, belt, requirement name, **deep link** to review screen
- [x] In-app notification center (bell icon)
- [x] Real-time or near-real-time dashboard refresh (Supabase realtime / polling)

### Acceptance Criteria
- End-to-end test: student attempts → parent verifies → instructor receives email → approves → student progress updates
- Denied requirement returns to attempted/not_started with visible feedback
- All notification emails render on mobile mail clients

### Dependencies
Phase 2

---

## Phase 4 — Video Recording, Upload & Review (5 weeks)

**Objective:** Device-native capture, parent gate, instructor playback and feedback.

### Deliverables
- [x] **Record in browser** (`MediaRecorder`) — mobile portrait, max duration limit
- [x] **Upload from gallery** — `<input accept="video/*" capture>`
- [x] Chunked/resumable upload for large files (tus or S3 multipart)
- [x] Attach video to specific **requirement_id**
- [x] **Parent approval** required before video visible to instructor
- [x] Instructor review player: slow-mo, fullscreen, timestamp comments (v1: text comment only)
- [ ] Storage lifecycle: compress on upload (FFmpeg server-side optional); delete after retention policy
- [x] Thumbnail generation for lists

### Optional (same phase if capacity)
- [x] **Offline record** — Service Worker queues blob; upload when online (PWA)

### Acceptance Criteria
- Student records 30s clip on iPhone/Android Chrome; parent approves; instructor plays in dashboard
- Videos never exposed without auth; signed URLs expire
- Upload progress UI works on slow 3G (simulated)

### Dependencies
Phase 3 (workflow states include video submission)

---

## Phase 5 — Curriculum Delivery & Practice Tools (4 weeks)

**Objective:** Rich learning experience beyond checklists.

### Deliverables
- [x] **Technique library** — filter by belt; embedded demo videos
- [x] **Step-by-step lesson plans** — forms & one-step sparring (existing prototype content)
- [x] **Daily / weekly exercise routines** — assignable by instructor; check-off syncs with requirements
- [x] **Terminology flashcards** — swipe/spaced repetition mode
- [x] **Belt test checklist** — printable/exportable PDF (instructor)
- [x] **Parent dashboard** — child progress summary, upcoming requirements, pending verifications
- [x] **Instructor dashboard** — roster, readiness heatmap, students near test-ready
- [x] **Progress reports** — CSV/PDF export per student or class

### Acceptance Criteria
- Student completes flashcard session; progress logged
- Instructor exports readiness report for upcoming test
- All modules responsive: flashcards usable one-handed on phone

### Dependencies
Phase 2 (content model), Phase 3 (progress)

---

## Phase 6 — Polish, Gamification & Scale (4+ weeks, optional)

**Objective:** Retention, multi-location, theme polish, future-ready features.

### Deliverables (prioritize with stakeholders)
- [x] **Dark / light mode** — system preference + manual toggle
- [x] **Gamification** — XP, badges, practice streaks (optional per school)
- [x] **Leaderboards** — attendance / practice consistency (opt-in, privacy-safe)
- [x] **Multi-school support** — instructor belongs to multiple dojangs; school switcher
- [x] **Printable belt-test readiness report** — branded PDF
- [x] Performance audit (Lighthouse mobile ≥90) — `npm run lighthouse` script
- [x] E2E test suite (Playwright): critical flows per role
- [x] App Store / Play Store wrapper (Capacitor) if native distribution needed — `capacitor.config.json` + `npm run cap:sync`

### Future (Phase 7+)
- [ ] AI technique feedback (pose estimation — research spike only)
- [ ] Live class scheduling integration
- [ ] Payment / billing for tests

### Dependencies
Phases 1–5 stable in production

---

# Feature ↔ Phase Matrix

| Feature | Phase |
|---------|-------|
| Responsive UI shell | 0 |
| Auth & roles | 1 |
| Belt requirements model | 2 |
| Student attempted / parent verify / instructor approve | 3 |
| SendGrid email notifications | 3 |
| Video record & upload | 4 |
| Parent video approval gate | 4 |
| Technique videos & lesson plans | 5 |
| Flashcards & exercise routines | 5 |
| Parent & instructor dashboards | 5 |
| Progress export | 5 |
| Dark/light mode | 6 |
| Gamification & leaderboards | 6 |
| Multi-school | 6 |
| Offline video queue | 4 or 6 |
| AI feedback | 7+ |

---

# Sprint Cadence (Suggested)

| Sprint | Length | Focus |
|--------|--------|--------|
| 2 weeks | × 12–18 | 1 phase ≈ 2–3 sprints depending on team size |
| Team of 2–3 | FE + BE + design part-time | Phases 0–5 ≈ 22 weeks core |

**Recommended order:** Never start Phase 4 before Phase 3 workflow is stable — video attaches to requirement states.

---

# Testing Strategy

| Layer | Scope |
|-------|--------|
| Unit | State machine transitions, permission helpers |
| Integration | RLS policies, email trigger functions |
| E2E | Login → attempt → parent verify → instructor approve (Playwright, mobile viewport) |
| Manual | Video record on real iOS Safari + Android Chrome |
| Load | Concurrent video uploads (staging) |

---

# Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Video storage cost | Max duration, compression, retention policy |
| COPPA / minor privacy | Parent account required; minimal PII; consent flow |
| Email deliverability | Verified domain, SendGrid templates, fallback in-app |
| Safari MediaRecorder quirks | Feature detect; fallback to file upload only |
| Scope creep | Strict phase gates; optional items only in Phase 6+ |

---

# Immediate Next Steps (Week 1)

1. **Approve this plan** and pick backend (recommend Supabase for MVP speed).
2. **Recreate project scaffold** — Vite + React + responsive shell + PWA manifest.
3. **Implement Phase 0** — design tokens, role-aware route stubs, CI.
4. **Draft wireframes** for the three dashboards and requirement detail (video CTA).
5. **Set up SendGrid** sandbox + Supabase/Firebase dev project.

---

# Appendix: Mapping from Current Prototype

If rebuilding from the earlier **Dojang** prototype, reuse:

| Prototype asset | Reuse in |
|-----------------|----------|
| `curriculum.js` belt/form/sparring/terms data | Phase 2 seed content |
| Responsive CSS breakpoints & belt color system | Phase 0 design tokens |
| Bottom nav / sidebar layout | Phase 0 shell (extend with role menus) |
| Exercise checklist UI | Phase 5 routines (wire to backend progress) |
| Progress ring component | Student dashboard (Phase 2+) |

**Not in prototype (net new):** Auth, backend, workflows, video, email, parent/instructor dashboards, RLS, reports.

---

*Document version: 1.0 — Generated for TaekwondoApp project planning.*
