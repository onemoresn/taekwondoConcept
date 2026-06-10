import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useWorkflowRefresh } from '../../hooks/useWorkflowRefresh';
import {
  fetchParentVideoQueue,
  parentApproveVideo,
  getVideoPlaybackUrl,
  getThumbnailUrl,
} from '../../services/videoService';
import { getBeltById } from '../../data/belts';
import VideoPlayer from '../../components/VideoPlayer';
import { formatDuration } from '../../lib/videoUtils';

function VideoApprovalCard({ item, onUpdated }) {
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const student = item.student;
  const belt = getBeltById(student?.belt_id);
  const title = item.requirement?.title ?? 'Practice video';

  useEffect(() => {
    async function load() {
      const [play, thumb] = await Promise.all([
        getVideoPlaybackUrl(item, 'parent'),
        getThumbnailUrl(item),
      ]);
      setPlaybackUrl(play);
      setThumbUrl(thumb);
    }
    load();
  }, [item]);

  async function handleApprove() {
    setError('');
    setSubmitting(true);
    try {
      await parentApproveVideo(item.id);
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Could not approve');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="verify-card">
      <div className="verify-card__header">
        <span className="eyebrow">{student?.full_name} · {belt?.name ?? student?.belt_id}</span>
        <h2>{title}</h2>
        <p>{formatDuration(item.duration_sec)} · submitted for review</p>
      </div>
      <p className="verify-card__note">
        Preview your child&apos;s video. Approve to make it visible to their instructor.
      </p>
      <VideoPlayer src={playbackUrl} durationSec={item.duration_sec} poster={thumbUrl} />
      {error && <div className="auth-banner auth-banner--error">{error}</div>}
      <div className="verify-card__actions">
        <button type="button" className="btn btn-primary" disabled={submitting} onClick={handleApprove}>
          {submitting ? 'Approving…' : 'Approve video for instructor'}
        </button>
      </div>
    </article>
  );
}

export default function ParentVideosPage() {
  const { profile } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await fetchParentVideoQueue(profile.id);
      setQueue(data);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);
  useWorkflowRefresh(load);

  return (
    <div className="page">
      <h1 className="page-title">Video approvals</h1>
      <p className="page-desc">
        Review practice videos before instructors can see them.
      </p>

      {loading && <p className="empty-note">Loading…</p>}
      {!loading && queue.length === 0 && (
        <p className="empty-note">No videos awaiting your approval.</p>
      )}

      {queue.map((item) => (
        <VideoApprovalCard key={item.id} item={item} onUpdated={load} />
      ))}
    </div>
  );
}
