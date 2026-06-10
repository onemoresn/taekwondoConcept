import { supabase } from '../lib/supabaseClient';

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchLinkedStudentsForParent(parentId) {
  const { data, error } = await supabase
    .from('parent_student_links')
    .select(`
      student_id,
      relationship,
      profiles:student_id ( id, full_name, belt_id, role )
    `)
    .eq('parent_id', parentId);
  if (error) throw error;
  return data?.map((row) => row.profiles).filter(Boolean) ?? [];
}

export async function fetchRosterForInstructor(instructorId) {
  const { data, error } = await supabase
    .from('instructor_students')
    .select(`
      student_id,
      profiles:student_id ( id, full_name, belt_id, role )
    `)
    .eq('instructor_id', instructorId);
  if (error) throw error;
  return data?.map((row) => row.profiles).filter(Boolean) ?? [];
}

export async function assignStudentToInstructor(instructorId, studentId, schoolId = null) {
  const { data, error } = await supabase
    .from('instructor_students')
    .insert({ instructor_id: instructorId, student_id: studentId, school_id: schoolId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findStudentByEmail(email) {
  const { data, error } = await supabase.rpc('find_profile_by_email', { p_email: email });
  if (error) {
    const { data: profiles, error: err2 } = await supabase
      .from('profiles')
      .select('id, full_name, belt_id, role, notification_email')
      .eq('notification_email', email)
      .eq('role', 'student')
      .maybeSingle();
    if (err2) throw err2;
    return profiles;
  }
  return data;
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createLinkCode(studentId, createdBy) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from('link_codes')
      .insert({
        code,
        student_id: studentId,
        created_by: createdBy,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();
    if (!error) return data;
    if (error.code !== '23505') throw error;
  }
  throw new Error('Could not generate unique link code');
}

export async function redeemLinkCode(code, parentId) {
  const { data, error } = await supabase.rpc('redeem_link_code', {
    p_code: code.trim(),
    p_parent_id: parentId,
  });
  if (error) throw error;
  return data;
}

export async function fetchActiveLinkCodesForStudent(studentId) {
  const { data, error } = await supabase
    .from('link_codes')
    .select('*')
    .eq('student_id', studentId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
