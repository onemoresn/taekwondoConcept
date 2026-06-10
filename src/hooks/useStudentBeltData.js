import { useEffect, useState, useCallback } from 'react';
import { fetchStudentProgress, fetchStudentBeltFlags } from '../services/progressService';

export function useStudentBeltData(studentId) {
  const [progress, setProgress] = useState({});
  const [flags, setFlags] = useState({ tips: 0, stripes: 0, test_ready: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [progressMap, flagData] = await Promise.all([
        fetchStudentProgress(studentId),
        fetchStudentBeltFlags(studentId),
      ]);
      setProgress(progressMap);
      setFlags(flagData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { progress, flags, loading, error, reload, setFlags };
}
