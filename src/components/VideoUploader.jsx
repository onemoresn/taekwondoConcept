import { useRef, useState } from 'react';
import { MAX_VIDEO_SIZE_MB } from '../lib/videoUtils';

export default function VideoUploader({ onSelected, disabled }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  function handleChange(e) {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Please select a video file.');
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setError(`Video must be under ${MAX_VIDEO_SIZE_MB} MB.`);
      return;
    }

    onSelected?.(file, file.type);
    e.target.value = '';
  }

  return (
    <div className="video-uploader">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="video-uploader__input"
        onChange={handleChange}
        disabled={disabled}
      />
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        Upload from gallery
      </button>
      {error && <p className="auth-banner auth-banner--error">{error}</p>}
    </div>
  );
}
