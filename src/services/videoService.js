import { supabase } from '../lib/supabaseClient';
import { isDemoAuthMode } from '../lib/authConfig';
import {
  saveDemoVideoBlob,
  getDemoVideoBlob,
  setVideoMetaEntry,
  loadVideoMeta,
} from '../lib/demoVideoStore';
import {
  generateVideoThumbnail,
  getVideoDuration,
} from '../lib/videoUtils';

const BUCKET = 'submissions';

async function uploadToStorage(path, blob, mimeType, onProgress) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!token || !baseUrl) throw new Error('Not authenticated');

  const url = `${baseUrl}/storage/v1/object/${BUCKET}/${path}`;

  return xhrUpload(url, blob, mimeType, token, onProgress);
}

function xhrUpload(url, blob, mimeType, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve({ path: url.split(`/object/${BUCKET}/`)[1] });
      else reject(new Error(xhr.responseText || 'Upload failed'));
    });
    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.send(blob);
  });
}

export async function fetchVideoForProgress(progressId) {
  if (isDemoAuthMode()) {
    const meta = loadVideoMeta();
    return Object.values(meta).find((v) => v.progress_id === progressId) ?? null;
  }

  const { data, error } = await supabase
    .from('video_submissions')
    .select('*')
    .eq('progress_id', progressId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchParentVideoQueue(parentId) {
  if (isDemoAuthMode()) {
    const { fetchLinkedStudentsForParent } = await import('./profileService');
    const children = await fetchLinkedStudentsForParent(parentId);
    const childIds = new Set(children.map((c) => c.id));
    const meta = loadVideoMeta();
    return Object.values(meta)
      .filter((v) => childIds.has(v.student_id) && !v.parent_approved_at)
      .map((v) => ({
        ...v,
        student: children.find((c) => c.id === v.student_id),
      }));
  }

  const { data: links } = await supabase
    .from('parent_student_links')
    .select('student_id, profiles:student_id ( id, full_name, belt_id )')
    .eq('parent_id', parentId);
  const studentIds = (links ?? []).map((l) => l.student_id);
  if (!studentIds.length) return [];

  const { data, error } = await supabase
    .from('video_submissions')
    .select(`
      *,
      requirements ( title, description ),
      student_progress ( id, status )
    `)
    .in('student_id', studentIds)
    .is('parent_approved_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    student: links.find((l) => l.student_id === row.student_id)?.profiles,
    requirement: row.requirements,
  }));
}

export async function uploadVideoSubmission({
  progressId,
  studentId,
  requirementId,
  blob,
  mimeType,
  onProgress,
}) {
  const duration = await getVideoDuration(blob);
  const thumbBlob = await generateVideoThumbnail(blob).catch(() => null);
  const videoId = `demo-video-${progressId}`;

  if (isDemoAuthMode()) {
    await saveDemoVideoBlob(videoId, blob);
    if (thumbBlob) await saveDemoVideoBlob(`${videoId}-thumb`, thumbBlob);

    const entry = {
      id: videoId,
      progress_id: progressId,
      student_id: studentId,
      requirement_id: requirementId,
      storage_path: videoId,
      thumbnail_path: thumbBlob ? `${videoId}-thumb` : null,
      duration_sec: Math.round(duration),
      file_size: blob.size,
      mime_type: mimeType,
      parent_approved_at: null,
      created_at: new Date().toISOString(),
    };
    setVideoMetaEntry(videoId, entry);

    const records = JSON.parse(localStorage.getItem(`dojang-progress-records-${studentId}`) || '[]');
    const idx = records.findIndex((r) => r.id === progressId);
    if (idx >= 0) {
      records[idx] = { ...records[idx], status: 'submitted' };
      localStorage.setItem(`dojang-progress-records-${studentId}`, JSON.stringify(records));
    }
    return entry;
  }

  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const basePath = `${studentId}/${progressId}`;
  const videoPath = `${basePath}/video.${ext}`;
  const thumbPath = thumbBlob ? `${basePath}/thumb.jpg` : null;

  await uploadToStorage(videoPath, blob, mimeType, onProgress);
  if (thumbBlob) {
    await uploadToStorage(thumbPath, thumbBlob, 'image/jpeg', null);
  }

  const { data, error } = await supabase.rpc('attach_video_submission', {
    p_progress_id: progressId,
    p_storage_path: videoPath,
    p_thumbnail_path: thumbPath,
    p_duration_sec: Math.round(duration),
    p_file_size: blob.size,
    p_mime_type: mimeType,
  });
  if (error) throw error;
  return data.video;
}

export async function parentApproveVideo(videoId) {
  if (isDemoAuthMode()) {
    const meta = loadVideoMeta();
    const entry = meta[videoId];
    if (!entry) throw new Error('Video not found');
    const updated = { ...entry, parent_approved_at: new Date().toISOString() };
    setVideoMetaEntry(videoId, updated);
    return updated;
  }

  const { data, error } = await supabase.rpc('parent_approve_video', { p_video_id: videoId });
  if (error) throw error;
  return data.video;
}

export async function getVideoPlaybackUrl(videoSubmission, role = 'student') {
  if (isDemoAuthMode()) {
    const blob = await getDemoVideoBlob(videoSubmission.storage_path);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  if (role === 'instructor' && !videoSubmission.parent_approved_at) {
    return null;
  }

  const { data, error } = await supabase.functions.invoke('signed-video-url', {
    body: { path: videoSubmission.storage_path, expiresIn: 3600 },
  });
  if (error) throw error;
  return data?.signedUrl ?? null;
}

export async function getThumbnailUrl(videoSubmission) {
  if (!videoSubmission?.thumbnail_path) return null;

  if (isDemoAuthMode()) {
    const blob = await getDemoVideoBlob(videoSubmission.thumbnail_path);
    return blob ? URL.createObjectURL(blob) : null;
  }

  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(videoSubmission.thumbnail_path, 3600);
  return data?.signedUrl ?? null;
}

export function canInstructorViewVideo(video) {
  return Boolean(video?.parent_approved_at);
}
