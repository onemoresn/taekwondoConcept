import { saveDemoVideoBlob } from './demoVideoStore';

const QUEUE_KEY = 'dojang-offline-upload-queue';

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(items) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function queueOfflineUpload({ progressId, studentId, requirementId, blob, mimeType }) {
  const id = `offline-${Date.now()}`;
  await saveDemoVideoBlob(id, blob);
  const queue = loadQueue();
  queue.push({ id, progressId, studentId, requirementId, mimeType, queuedAt: new Date().toISOString() });
  saveQueue(queue);
}

export async function flushOfflineUploadQueue(uploadFn) {
  const queue = loadQueue();
  if (!queue.length) return;

  const { getDemoVideoBlob } = await import('./demoVideoStore');
  const remaining = [];

  for (const item of queue) {
    const blob = await getDemoVideoBlob(item.id);
    if (!blob) {
      remaining.push(item);
      continue;
    }
    try {
      await uploadFn({
        progressId: item.progressId,
        studentId: item.studentId,
        requirementId: item.requirementId,
        blob,
        mimeType: item.mimeType,
      });
    } catch {
      remaining.push(item);
    }
  }

  saveQueue(remaining);
}
