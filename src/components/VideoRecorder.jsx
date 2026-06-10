import { useEffect, useRef, useState } from 'react';
import { MAX_VIDEO_DURATION_SEC, pickRecorderMimeType } from '../lib/videoUtils';

export default function VideoRecorder({ onRecorded, disabled }) {
  const videoRef = useRef(null);
  const mediaRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function stopStream() {
    mediaRef.current?.getTracks().forEach((t) => t.stop());
    mediaRef.current = null;
  }

  async function startPreview() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      mediaRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPreview(true);
    } catch {
      setError('Camera access denied. Use upload from gallery instead.');
    }
  }

  async function startRecording() {
    if (!mediaRef.current) await startPreview();
    if (!mediaRef.current) return;

    const mimeType = pickRecorderMimeType();
    chunksRef.current = [];
    const recorder = new MediaRecorder(mediaRef.current, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const type = recorder.mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      onRecorded?.(blob, type);
      setRecording(false);
      setSeconds(0);
      stopStream();
      setPreview(false);
    };

    recorder.start(250);
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_VIDEO_DURATION_SEC) {
          stopRecording();
          return MAX_VIDEO_DURATION_SEC;
        }
        return s + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
  }

  return (
    <div className="video-recorder">
      {error && <div className="auth-banner auth-banner--error">{error}</div>}

      <div className="video-recorder__viewport">
        {preview ? (
          <video ref={videoRef} className="video-recorder__preview" playsInline muted />
        ) : (
          <div className="video-recorder__placeholder">
            <span>📹</span>
            <p>Portrait video · max {MAX_VIDEO_DURATION_SEC}s</p>
          </div>
        )}
        {recording && <span className="video-recorder__timer">REC {seconds}s</span>}
      </div>

      <div className="video-recorder__actions">
        {!preview && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={startPreview} disabled={disabled}>
            Open camera
          </button>
        )}
        {preview && !recording && (
          <button type="button" className="btn btn-primary btn-sm" onClick={startRecording} disabled={disabled}>
            Start recording
          </button>
        )}
        {recording && (
          <button type="button" className="btn btn-primary btn-sm" onClick={stopRecording}>
            Stop ({MAX_VIDEO_DURATION_SEC - seconds}s left)
          </button>
        )}
      </div>
    </div>
  );
}
