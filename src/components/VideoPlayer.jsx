import { useEffect, useRef, useState } from 'react';
import { formatDuration } from '../lib/videoUtils';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25];

export default function VideoPlayer({ src, durationSec, poster }) {
  const videoRef = useRef(null);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
  }, [rate, src]);

  function toggleFullscreen() {
    const el = videoRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }

  if (!src) {
    return (
      <div className="video-player video-player--empty">
        <span>🎥</span>
        <p>Video not available</p>
      </div>
    );
  }

  return (
    <div className="video-player">
      {error && <div className="auth-banner auth-banner--error">{error}</div>}
      <video
        ref={videoRef}
        className="video-player__video"
        src={src}
        poster={poster ?? undefined}
        controls
        playsInline
        onError={() => setError('Could not play video')}
      />
      <div className="video-player__toolbar">
        <span className="video-player__duration">{formatDuration(durationSec)}</span>
        <div className="video-player__rates">
          {PLAYBACK_RATES.map((r) => (
            <button
              key={r}
              type="button"
              className={`btn btn-sm btn-secondary${rate === r ? ' is-active' : ''}`}
              onClick={() => setRate(r)}
            >
              {r}x
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-sm btn-secondary" onClick={toggleFullscreen}>
          Fullscreen
        </button>
      </div>
    </div>
  );
}
