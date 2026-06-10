import { useEffect, useState, useCallback } from 'react';
import {
  fetchBeltRanks,
  fetchRequirementsForBelt,
  fetchBeltBySlug,
} from '../services/curriculumService';

export function useCurriculum(beltSlug) {
  const [belt, setBelt] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!beltSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [beltData, reqs] = await Promise.all([
        fetchBeltBySlug(beltSlug),
        fetchRequirementsForBelt(beltSlug),
      ]);
      setBelt(beltData);
      setRequirements(reqs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [beltSlug]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { belt, requirements, loading, error, reload };
}

export function useBeltRanks() {
  const [belts, setBelts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBeltRanks();
      setBelts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { belts, loading, error, reload };
}
