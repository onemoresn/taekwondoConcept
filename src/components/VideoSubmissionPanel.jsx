import { useEffect, useState, useCallback } from 'react';
import { PROGRESS_STATUS } from '../constants/roles';
import { fetchProgressRecord } from '../services/workflowService';
import {
  fetchVideoForProgress,
  uploadVideoSubmission,
  getThumbnailUrl,
  getVideoPlaybackUrl,
} from '../services/videoService';
import { formatDuration, formatFileSize } from '../lib/videoUtils';
import VideoRecorder from './VideoRecorder';
import VideoUploader from './VideoUploader';
import VideoPlayer from './VideoPlayer';

export default function VideoSubmissionPanel({ profile, requirement, onUpdated }) {
  const [progressRecord, setProgressRecord] = useState(null);
  const [video, setVideo] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const status = progressRecord?.status ?? PROGRESS_STATUS.NOT_STARTED;
  const canUpload = progressRecord && [
    PROGRESS_STATUS.ATTEMPTED,
    PROGRESS_STATUS.PARENT_VERIFIED,
    PROGRESS_STATUS.DENIED,
    PROGRESS_STATUS.SUBMITTED,
  ].includes(status);

  const load = useCallback(async () => {
    const record = await fetchProgressRecord(profile.id, requirement.id, requirement.slug);
    setProgressRecord(record);
    if (!record?.id) return;

    const v = await fetchVideoForProgress(record.id);
    setVideo(v);
    if (v) {
      const thumb = await getThumbnailUrl(v);
      setThumbUrl(thumb);
      const url = await getVideoPlaybackUrl(v, 'student');
      setPlaybackUrl(url);
    } else {
      setThumbUrl(null);
      setPlaybackUrl(null);
    }
  }, [profile.id, requirement.id, requirement.slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(blob, mimeType) {
    if (!progressRecord?.id) {
      setError('Mark this requirement as attempted before uploading video.');
      return;
    }
    setError('');
    setMessage('');
    setUploading(true);
    setUploadPct(0);
    try {
      if (!navigator.onLine) {
        const { queueOfflineUpload } = await import('../lib/offlineUploadQueue');
        await queueOfflineUpload({
          progressId: progressRecord.id,
          studentId: profile.id,
          requirementId: requirement.id,
          blob,
          mimeType,
        });
        setMessage('Offline — video queued and will upload when you are back online.');
        return;
      }
      await uploadVideoSubmission({
        progressId: progressRecord.id,
        studentId: profile.id,
        requirementId: requirement.id,
        blob,
        mimeType,
        onProgress: setUploadPct,
      });
      setMessage('Video uploaded — waiting for parent approval before instructor review.');
      await load();
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  }

  useEffect(() => {
    function onOnline() {
      import('../lib/offlineUploadQueue').then(({ flushOfflineUploadQueue }) => {
        flushOfflineUploadQueue(uploadVideoSubmission).then(() => load());
      });
    }
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [load]);

  return (
    <section className="panel video-panel">
      <div className="panel__head">
        <h2>Video submission</h2>
        {video && (
          <span className="panel__meta">
            {formatDuration(video.duration_sec)} · {formatFileSize(video.file_size)}
          </span>
        )}
      </div>

      {!canUpload && (
        <p className="phase-note">Mark as attempted first to attach a practice video.</p>
      )}

      {error && <div className="auth-banner auth-banner--error">{error}</div>}
      {message && <div className="auth-banner auth-banner--success">{message}</div>}

      {video && (
        <div className="video-status">
          {thumbUrl && <img src={thumbUrl} alt="" className="video-status__thumb" />}
          <p>
            {video.parent_approved_at
              ? 'Parent approved — instructor can review'
              : 'Awaiting parent video approval'}
          </p>
        </div>
      )}

      {playbackUrl && <VideoPlayer src={playbackUrl} durationSec={video?.duration_sec} poster={thumbUrl} />}

      {canUpload && !uploading && (
        <>
          <VideoRecorder onRecorded={handleUpload} disabled={uploading} />
          <VideoUploader onSelected={handleUpload} disabled={uploading} />
        </>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="upload-progress__bar" style={{ width: `${Math.round(uploadPct * 100)}%` }} />
          <span>Uploading… {Math.round(uploadPct * 100)}%</span>
        </div>
      )}
    </section>
  );
}
