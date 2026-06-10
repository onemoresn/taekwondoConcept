import { supabase } from '../lib/supabaseClient';
import { isDemoAuthMode } from '../lib/authConfig';
import { CURRICULUM_SEED } from '../data/curriculumSeed';

const DEMO_CURRICULUM_KEY = 'dojang-curriculum';

function loadDemoCurriculum() {
  try {
    const raw = localStorage.getItem(DEMO_CURRICULUM_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* use seed */
  }
  return buildDemoCurriculumFromSeed();
}

function saveDemoCurriculum(data) {
  localStorage.setItem(DEMO_CURRICULUM_KEY, JSON.stringify(data));
}

function buildDemoCurriculumFromSeed() {
  const belts = CURRICULUM_SEED.belts.map((b) => ({
    id: `demo-belt-${b.slug}`,
    school_id: 'demo-school',
    ...b,
  }));

  const requirements = [];
  for (const belt of belts) {
    const reqs = CURRICULUM_SEED.requirements[belt.slug] ?? [];
    reqs.forEach((r) => {
      requirements.push({
        id: `demo-req-${r.slug}`,
        belt_rank_id: belt.id,
        belt_slug: belt.slug,
        ...r,
        published: true,
        content: r.content ?? {},
      });
    });
  }

  return { belts, requirements };
}

function getDemoStore() {
  return loadDemoCurriculum();
}

export async function fetchBeltRanks() {
  if (isDemoAuthMode()) {
    return getDemoStore().belts.sort((a, b) => a.sort_order - b.sort_order);
  }

  const { data, error } = await supabase
    .from('belt_ranks')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchBeltBySlug(slug) {
  const belts = await fetchBeltRanks();
  return belts.find((b) => b.slug === slug) ?? null;
}

export async function fetchRequirementsForBelt(beltSlugOrId) {
  if (isDemoAuthMode()) {
    const store = getDemoStore();
    const belt = store.belts.find((b) => b.slug === beltSlugOrId || b.id === beltSlugOrId);
    if (!belt) return [];
    return store.requirements
      .filter((r) => r.belt_rank_id === belt.id && r.published !== false)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  let beltId = beltSlugOrId;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(beltSlugOrId)) {
    const belt = await fetchBeltBySlug(beltSlugOrId);
    if (!belt) return [];
    beltId = belt.id;
  }

  const { data, error } = await supabase
    .from('requirements')
    .select('*, belt_ranks!inner(slug)')
    .eq('belt_rank_id', beltId)
    .eq('published', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, belt_slug: r.belt_ranks?.slug }));
}

export async function fetchAllRequirementsForBeltAdmin(beltId) {
  if (isDemoAuthMode()) {
    const store = getDemoStore();
    return store.requirements
      .filter((r) => r.belt_rank_id === beltId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  const { data, error } = await supabase
    .from('requirements')
    .select('*')
    .eq('belt_rank_id', beltId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createBeltRank(belt) {
  if (isDemoAuthMode()) {
    const store = getDemoStore();
    const id = `demo-belt-${belt.slug}`;
    const row = { id, school_id: 'demo-school', ...belt };
    store.belts.push(row);
    saveDemoCurriculum(store);
    return row;
  }

  const { data, error } = await supabase.from('belt_ranks').insert(belt).select().single();
  if (error) throw error;
  return data;
}

export async function updateBeltRank(id, updates) {
  if (isDemoAuthMode()) {
    const store = getDemoStore();
    store.belts = store.belts.map((b) => (b.id === id ? { ...b, ...updates } : b));
    saveDemoCurriculum(store);
    return store.belts.find((b) => b.id === id);
  }

  const { data, error } = await supabase.from('belt_ranks').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBeltRank(id) {
  if (isDemoAuthMode()) {
    const store = getDemoStore();
    store.belts = store.belts.filter((b) => b.id !== id);
    store.requirements = store.requirements.filter((r) => r.belt_rank_id !== id);
    saveDemoCurriculum(store);
    return;
  }

  const { error } = await supabase.from('belt_ranks').delete().eq('id', id);
  if (error) throw error;
}

export async function createRequirement(requirement) {
  if (isDemoAuthMode()) {
    const store = getDemoStore();
    const slug = requirement.slug ?? `req-${Date.now()}`;
    const row = {
      id: `demo-req-${slug}`,
      slug,
      content: {},
      published: true,
      ...requirement,
    };
    store.requirements.push(row);
    saveDemoCurriculum(store);
    return row;
  }

  const { data, error } = await supabase.from('requirements').insert(requirement).select().single();
  if (error) throw error;
  return data;
}

export async function updateRequirement(id, updates) {
  if (isDemoAuthMode()) {
    const store = getDemoStore();
    store.requirements = store.requirements.map((r) => (r.id === id ? { ...r, ...updates } : r));
    saveDemoCurriculum(store);
    return store.requirements.find((r) => r.id === id);
  }

  const { data, error } = await supabase.from('requirements').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRequirement(id) {
  if (isDemoAuthMode()) {
    const store = getDemoStore();
    store.requirements = store.requirements.filter((r) => r.id !== id);
    saveDemoCurriculum(store);
    return;
  }

  const { error } = await supabase.from('requirements').delete().eq('id', id);
  if (error) throw error;
}

export async function seedFullCurriculumFromApp() {
  if (isDemoAuthMode()) {
    const data = buildDemoCurriculumFromSeed();
    saveDemoCurriculum(data);
    return data;
  }

  const { data: schools } = await supabase.from('schools').select('id').eq('name', 'Demo Dojang').limit(1);
  const schoolId = schools?.[0]?.id;
  if (!schoolId) throw new Error('Demo Dojang school not found');

  for (const belt of CURRICULUM_SEED.belts) {
    const { data: beltRow, error: beltErr } = await supabase
      .from('belt_ranks')
      .upsert({ school_id: schoolId, ...belt }, { onConflict: 'school_id,slug' })
      .select()
      .single();
    if (beltErr) throw beltErr;

    const reqs = CURRICULUM_SEED.requirements[belt.slug] ?? [];
    for (const req of reqs) {
      const { error: reqErr } = await supabase.from('requirements').upsert(
        {
          belt_rank_id: beltRow.id,
          slug: req.slug,
          type: req.type,
          title: req.title,
          description: req.description,
          sort_order: req.sort_order,
          content: req.content ?? {},
          published: true,
        },
        { onConflict: 'belt_rank_id,slug' }
      );
      if (reqErr) throw reqErr;
    }
  }
}

export function countApprovedProgress(requirements, progressMap) {
  const total = requirements.length;
  const approved = requirements.filter(
    (r) => progressMap[r.id] === 'instructor_approved'
  ).length;
  return {
    total,
    approved,
    percent: total ? Math.round((approved / total) * 100) : 0,
  };
}
