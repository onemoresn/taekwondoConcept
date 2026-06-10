# Dojang — Taekwondo Training App

Phase **1** complete: authentication, role-based routing, and profile linking.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — **Sign up** or **Sign in**. Without Supabase env vars, the app runs in **demo mode** (local auth + sample data).

For production auth, see [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md).

Run `002_phase2_curriculum.sql` after Phase 1 migration for belt/requirement tables.

Phase **2** complete: belt curriculum engine, instructor editor, and student belt dashboard.

Phase **5** complete: technique library, lesson plans, exercises, flashcards, reports & enhanced dashboards.

## Phase 5 deliverables

| Item | Location |
|------|----------|
| Practice content | `src/data/practiceContent.js` |
| Practice progress (local) | `src/services/practiceService.js` |
| Reports & export | `src/services/reportService.js` |
| Student Learn hub | `src/pages/student/StudentLearnPage.jsx` |
| Flashcards | `src/components/FlashcardDeck.jsx` |
| Instructor reports | `src/pages/instructor/InstructorReportsPage.jsx` |
| Readiness heatmap | `src/components/ReadinessHeatmap.jsx` |

## Phase 4 deliverables

## Phase 4 deliverables

| Item | Location |
|------|----------|
| Video service | `src/services/videoService.js` |
| Recorder / uploader / player | `src/components/VideoRecorder.jsx`, `VideoUploader.jsx`, `VideoPlayer.jsx` |
| Student submission panel | `src/components/VideoSubmissionPanel.jsx` |
| Parent video approvals | `src/pages/parent/ParentVideosPage.jsx` |
| SQL migration | `supabase/migrations/004_phase4_video.sql` |
| Signed URL function | `supabase/functions/signed-video-url/` |

## Phase 3 deliverables

## Phase 3 deliverables

| Item | Location |
|------|----------|
| Workflow RPCs | `supabase/migrations/003_phase3_workflow.sql` |
| Workflow service | `src/services/workflowService.js` |
| Notifications | `src/services/notificationService.js` |
| SendGrid edge fn | `supabase/functions/send-workflow-email/` |
| Notification bell | `src/components/NotificationBell.jsx` |

## Phase 2 deliverables

| Item | Location |
|------|----------|
| Curriculum seed (WT forms, terms) | `src/data/curriculumSeed.js` |
| Curriculum service | `src/services/curriculumService.js` |
| Progress / belt flags service | `src/services/progressService.js` |
| Instructor curriculum editor | `src/components/BeltCurriculumEditor.jsx` |
| Student grouped requirements | `src/components/RequirementGroup.jsx` |
| SQL migration | `supabase/migrations/002_phase2_curriculum.sql` |

## Phase 1 deliverables

| Item | Location |
|------|----------|
| Auth context | `src/context/AuthProvider.jsx` |
| Login / signup / reset | `src/pages/auth/` |
| Protected routes | `src/components/ProtectedRoute.jsx` |
| Profile settings | `src/pages/shared/ProfileSettingsPage.jsx` |
| Parent linking | `src/pages/parent/ParentChildrenPage.jsx` |
| Instructor roster | `src/pages/instructor/InstructorStudentsPage.jsx` |
| Supabase migration | `supabase/migrations/001_phase1_auth.sql` |
| Setup guide | [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) |

## Phase 0 deliverables

| Item | Location |
|------|----------|
| Development plan | [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) |
| Design tokens | [docs/DESIGN_TOKENS.md](./docs/DESIGN_TOKENS.md) |
| ERD draft | [docs/ERD.md](./docs/ERD.md) |
| API contract | [docs/API.md](./docs/API.md) |
| Environments | [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) |
| Responsive shell | `src/layouts/AppShell.jsx` |
| Role dashboards | `src/pages/{student,parent,instructor}/` |
| CI | `.github/workflows/ci.yml` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Responsive behavior

- **Mobile:** Bottom navigation, single-column layouts
- **Tablet (640px+):** Multi-column grids for lists and cards
- **Desktop (1024px+):** Sidebar navigation, wider content area (max 1200px)

## Next: Phase 1

Authentication, Supabase integration, and real role-based route guards. See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md).

## Tech stack

React 18 · Vite · React Router · PWA-ready · CSS design tokens
