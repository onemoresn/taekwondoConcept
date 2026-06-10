export const MAX_VIDEO_DURATION_SEC = 30;
export const MAX_VIDEO_SIZE_MB = 50;
export const CHUNK_SIZE = 2 * 1024 * 1024;

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function getVideoDuration(blob) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error('Could not read video duration'));
    video.src = URL.createObjectURL(blob);
  });
}

export async function generateVideoThumbnail(blob) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = Math.round(320 * (video.videoHeight / video.videoWidth)) || 180;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (thumbBlob) => {
            URL.revokeObjectURL(video.src);
            resolve(thumbBlob);
          },
          'image/jpeg',
          0.8
        );
      } catch (err) {
        reject(err);
      }
    };

    video.onerror = () => reject(new Error('Could not generate thumbnail'));
    video.src = URL.createObjectURL(blob);
  });
}

export function pickRecorderMimeType() {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}
