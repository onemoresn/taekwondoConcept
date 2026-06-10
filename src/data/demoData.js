import { REQUIREMENT_TYPES, PROGRESS_STATUS } from '../constants/roles';
import { BELTS } from './belts';

/** Phase 0 sample requirements — will move to backend in Phase 2 */
export const SAMPLE_REQUIREMENTS = {
  yellow: [
    { id: 'y-form-1', type: REQUIREMENT_TYPES.FORM, title: 'Taegeuk Il Jang', description: '18 movements — Keon' },
    { id: 'y-tech-1', type: REQUIREMENT_TYPES.TECHNIQUE, title: 'Front kick (Ap Chagi)', description: '10 reps each leg' },
    { id: 'y-term-1', type: REQUIREMENT_TYPES.TERMINOLOGY, title: 'Basic commands', description: 'Joonbi, Kihap, Baro' },
    { id: 'y-cond-1', type: REQUIREMENT_TYPES.CONDITIONING, title: 'Horse stance hold', description: '30 sec × 3' },
    { id: 'y-lead-1', type: REQUIREMENT_TYPES.LEADERSHIP, title: 'Lead warm-up', description: 'Lead class stretch once' },
  ],
};

/** Demo progress for dashboard stubs */
export const DEMO_STUDENT = {
  id: 'demo-student',
  name: 'Alex Kim',
  beltId: 'yellow',
  tips: 2,
  stripes: 1,
  testReady: false,
  progress: {
    'y-form-1': PROGRESS_STATUS.PARENT_VERIFIED,
    'y-tech-1': PROGRESS_STATUS.ATTEMPTED,
    'y-term-1': PROGRESS_STATUS.APPROVED,
    'y-cond-1': PROGRESS_STATUS.NOT_STARTED,
    'y-lead-1': PROGRESS_STATUS.NOT_STARTED,
  },
};

export const DEMO_CHILDREN = [
  { ...DEMO_STUDENT },
  {
    id: 'demo-student-2',
    name: 'Jordan Lee',
    beltId: 'white',
    tips: 0,
    stripes: 0,
    testReady: false,
    progress: {},
  },
];

export const DEMO_ROSTER = BELTS.flatMap((belt) =>
  belt.id === 'yellow' || belt.id === 'white'
    ? [{ studentId: 'demo-student', name: 'Alex Kim', beltId: belt.id, pendingReviews: 2 }]
    : []
).filter(Boolean);

export function getRequirementsForBelt(beltId) {
  return SAMPLE_REQUIREMENTS[beltId] ?? [];
}

export function countProgress(requirements, progressMap) {
  const total = requirements.length;
  const approved = requirements.filter(
    (r) => progressMap[r.id] === PROGRESS_STATUS.APPROVED
  ).length;
  return { total, approved, percent: total ? Math.round((approved / total) * 100) : 0 };
}
