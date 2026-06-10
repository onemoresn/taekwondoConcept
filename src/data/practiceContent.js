import { CURRICULUM_SEED } from './curriculumSeed';
import { REQUIREMENT_TYPES } from '../constants/roles';

/** Demo technique video URLs (royalty-free placeholders) */
const DEMO_VIDEOS = {
  frontKick: 'https://www.w3schools.com/html/mov_bbb.mp4',
  roundhouse: 'https://www.w3schools.com/html/movie.mp4',
  stance: 'https://www.w3schools.com/html/mov_bbb.mp4',
};

/** Daily exercise routines per belt */
export const EXERCISE_ROUTINES = {
  white: [
    { id: 'w-ex-1', title: 'Jumping jacks', category: 'cardio', reps: 20, requirementSlug: 'w-cond-1' },
    { id: 'w-ex-2', title: 'Horse stance hold', category: 'stance', durationSec: 30, sets: 3, requirementSlug: 'w-cond-1' },
    { id: 'w-ex-3', title: 'Push-ups (knees OK)', category: 'strength', reps: 10 },
  ],
  yellow: [
    { id: 'y-ex-1', title: 'Front kick drills', category: 'technique', reps: 10, requirementSlug: 'y-tech-1' },
    { id: 'y-ex-2', title: 'Horse stance hold', category: 'stance', durationSec: 30, sets: 3, requirementSlug: 'y-cond-1' },
    { id: 'y-ex-3', title: 'Taegeuk Il Jang walk-through', category: 'form', sets: 2, requirementSlug: 'y-form-1' },
    { id: 'y-ex-4', title: 'Sit-ups', category: 'strength', reps: 20 },
  ],
  green: [
    { id: 'g-ex-1', title: 'Roundhouse kick', category: 'technique', reps: 12, requirementSlug: 'g-tech-1' },
    { id: 'g-ex-2', title: 'Taegeuk Yi Jang', category: 'form', sets: 2, requirementSlug: 'g-form-1' },
    { id: 'g-ex-3', title: 'Push-ups', category: 'strength', reps: 20, requirementSlug: 'g-cond-1' },
  ],
  blue: [
    { id: 'b-ex-1', title: 'Side kick drills', category: 'technique', reps: 10, requirementSlug: 'b-tech-1' },
    { id: 'b-ex-2', title: 'Taegeuk Sam Jang', category: 'form', sets: 2, requirementSlug: 'b-form-1' },
  ],
  red: [
    { id: 'r-ex-1', title: 'Spinning back kick', category: 'technique', reps: 8, requirementSlug: 'r-tech-1' },
    { id: 'r-ex-2', title: 'Taegeuk Sa Jang', category: 'form', sets: 2, requirementSlug: 'r-form-1' },
  ],
  black: [
    { id: 'bk-ex-1', title: 'Koryo full form', category: 'form', sets: 3, requirementSlug: 'bk-form-1' },
    { id: 'bk-ex-2', title: 'Class leadership drill', category: 'leadership', sets: 1, requirementSlug: 'bk-lead-1' },
  ],
};

function enrichTechnique(req) {
  const videoMap = {
    'y-tech-1': DEMO_VIDEOS.frontKick,
    'y-tech-2': DEMO_VIDEOS.frontKick,
    'g-tech-1': DEMO_VIDEOS.roundhouse,
    'b-tech-1': DEMO_VIDEOS.frontKick,
    'r-tech-1': DEMO_VIDEOS.roundhouse,
    'w-tech-1': DEMO_VIDEOS.stance,
    'w-tech-2': DEMO_VIDEOS.stance,
  };
  return {
    id: req.slug,
    beltSlug: req.beltSlug,
    title: req.title,
    description: req.description,
    korean: req.content?.korean,
    keyPoints: req.content?.keyPoints ?? [],
    videoUrl: req.content?.videoUrl ?? videoMap[req.slug] ?? null,
  };
}

export function getTechniquesForBelt(beltSlug) {
  const reqs = CURRICULUM_SEED.requirements[beltSlug] ?? [];
  return reqs
    .filter((r) => r.type === REQUIREMENT_TYPES.TECHNIQUE)
    .map((r) => enrichTechnique({ ...r, beltSlug }));
}

export function getAllTechniques(beltFilter = 'all') {
  const belts = beltFilter === 'all'
    ? Object.keys(CURRICULUM_SEED.requirements)
    : [beltFilter];
  return belts.flatMap((slug) => getTechniquesForBelt(slug));
}

export function getLessonPlansForBelt(beltSlug) {
  const reqs = CURRICULUM_SEED.requirements[beltSlug] ?? [];
  const forms = reqs.filter((r) => r.type === REQUIREMENT_TYPES.FORM);
  const selfDefense = reqs.filter((r) => r.type === REQUIREMENT_TYPES.SELF_DEFENSE);
  return { forms, selfDefense };
}

export function getAllTermCards(beltFilter = 'all') {
  const belts = beltFilter === 'all'
    ? Object.keys(CURRICULUM_SEED.requirements)
    : [beltFilter];
  const cards = [];
  belts.forEach((beltSlug) => {
    const reqs = CURRICULUM_SEED.requirements[beltSlug] ?? [];
    reqs
      .filter((r) => r.type === REQUIREMENT_TYPES.TERMINOLOGY)
      .forEach((req) => {
        (req.content?.cards ?? []).forEach((card, i) => {
          cards.push({
            id: `${req.slug}-${i}`,
            beltSlug,
            korean: card.korean,
            english: card.english,
            requirementSlug: req.slug,
          });
        });
      });
  });
  return cards;
}

export function getExercisesForBelt(beltSlug) {
  return EXERCISE_ROUTINES[beltSlug] ?? [];
}

export function getBeltTestChecklist(beltSlug) {
  const reqs = CURRICULUM_SEED.requirements[beltSlug] ?? [];
  return reqs.map((r) => ({
    slug: r.slug,
    type: r.type,
    title: r.title,
    description: r.description,
  }));
}

export const BELT_OPTIONS = CURRICULUM_SEED.belts.map((b) => ({
  slug: b.slug,
  name: b.name,
}));
