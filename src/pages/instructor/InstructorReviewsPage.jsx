import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useWorkflowRefresh } from '../../hooks/useWorkflowRefresh';
import { fetchInstructorReviewQueue } from '../../services/workflowService';
import { instructorReview } from '../../services/workflowActions';
import {
  fetchVideoForProgress,
  getVideoPlaybackUrl,
  getThumbnailUrl,
  canInstructorViewVideo,
} from '../../services/videoService';
import { getBeltById } from '../../data/belts';
import { REQUIREMENT_TYPE_LABELS } from '../../data/curriculumSeed';
import VideoPlayer from '../../components/VideoPlayer';

function ReviewCard({ item, onUpdated }) {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [video, setVideo] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);

  const student = item.student;
  const req = item.requirement;
  const belt = getBeltById(student?.belt_id);
  const typeLabel = REQUIREMENT_TYPE_LABELS[req?.type] ?? req?.type;

  useEffect(() => {
    async function loadVideo() {
      const v = await fetchVideoForProgress(item.id);
      setVideo(v);
      if (v && canInstructorViewVideo(v)) {
        const [play, thumb] = await Promise.all([
          getVideoPlaybackUrl(v, 'instructor'),
          getThumbnailUrl(v),
        ]);
        setPlaybackUrl(play);
        setThumbUrl(thumb);
      }
    }
    loadVideo();
  }, [item.id]);

  async function handleReview(approved) {
    setError('');
    setSubmitting(true);
    try {
      await instructorReview({
        progressId: item.id,
        approved,
        feedback: feedback.trim() || null,
        studentId: student.id,
        studentName: student.full_name,
        requirementTitle: req?.title ?? 'Requirement',
        beltName: belt?.name ?? student.belt_id,
      });
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="verify-card">
      <span className="eyebrow">{belt?.name ?? student?.belt_id} · {typeLabel}</span>
      <h2>{student?.full_name} — {req?.title}</h2>
      <p>
        Parent verified {item.parent_verified_at
          ? new Date(item.parent_verified_at).toLocaleDateString()
          : 'recently'}
      </p>
      {item.student_note && <p className="verify-card__note">Student: {item.student_note}</p>}
      {item.parent_note && <p className="verify-card__note">Parent: {item.parent_note}</p>}

      {video && !canInstructorViewVideo(video) ? (
        <div className="video-placeholder">
          <span>🔒</span>
          <p>Video submitted — awaiting parent approval</p>
        </div>
      ) : video && playbackUrl ? (
        <VideoPlayer src={playbackUrl} durationSec={video.duration_sec} poster={thumbUrl} />
      ) : (
        <div className="video-placeholder">
          <span>🎥</span>
          <p>No video attached</p>
        </div>
      )}

      {error && <div className="auth-banner auth-banner--error">{error}</div>}

      <textarea
        className="input-field"
        placeholder="Instructor feedback…"
        rows={3}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      <div className="verify-card__actions">
        <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => handleReview(true)}>
          Approve
        </button>
        <button type="button" className="btn btn-secondary" disabled={submitting} onClick={() => handleReview(false)}>
          Request redo
        </button>
      </div>
    </article>
  );
}

export default function InstructorReviewsPage() {
  const { profile } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await fetchInstructorReviewQueue(profile.id);
      setQueue(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);
  useWorkflowRefresh(load);

  return (
    <div className="page">
      <h1 className="page-title">Review queue</h1>
      <p className="page-desc">Approve or deny progress. Videos play after parent approval.</p>

      {error && <div className="auth-banner auth-banner--error">{error}</div>}
      {loading && <p className="empty-note">Loading…</p>}

      {!loading && queue.length === 0 && (
        <p className="empty-note">No items awaiting review.</p>
      )}

      {queue.map((item) => (
        <ReviewCard key={item.id} item={item} onUpdated={load} />
      ))}
    </div>
  );
}
