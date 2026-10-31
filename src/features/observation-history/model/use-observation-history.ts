import { useCallback, useEffect, useState } from 'react';

import type { ObservationHistoryItem } from '../../../shared/api/index.ts';
import { useRequestGuard } from '../../../shared/lib/index.ts';
import {
  deleteObservation,
  deleteObservationPhoto,
  getObservationHistory,
} from '../api/observation-history-api.ts';

const pageSize = 20;

export function useObservationHistory(accessToken: string) {
  const [observations, setObservations] = useState<ObservationHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guard = useRequestGuard();

  const refresh = useCallback(async () => {
    const request = guard.begin();
    setLoading(true);
    setError(null);
    try {
      const response = await getObservationHistory(accessToken, 1, pageSize);
      if (!guard.isCurrent(request)) return;
      setObservations(response.observations);
      setPage(response.page);
      setHasMore(response.hasMore);
    } catch (cause) {
      if (guard.isCurrent(request)) {
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar sua galeria.');
      }
    } finally {
      if (guard.isCurrent(request)) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [accessToken, guard]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load remote history when session changes.
    void refresh();
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const request = guard.current();
    setLoadingMore(true);
    try {
      const response = await getObservationHistory(accessToken, page + 1, pageSize);
      if (!guard.isCurrent(request)) return;
      setObservations((current) => [...current, ...response.observations]);
      setPage(response.page);
      setHasMore(response.hasMore);
    } catch (cause) {
      if (guard.isCurrent(request)) {
        setError(
          cause instanceof Error ? cause.message : 'Não foi possível carregar mais observações.',
        );
      }
    } finally {
      if (guard.isCurrent(request)) setLoadingMore(false);
    }
  }, [accessToken, guard, hasMore, loading, loadingMore, page]);

  const removePhoto = useCallback(
    async (observationId: string, photoId: string) => {
      const result = await deleteObservationPhoto(accessToken, observationId, photoId);
      setObservations((current) =>
        result.observationDeleted
          ? current.filter((observation) => observation.id !== observationId)
          : current.map((observation) =>
              observation.id === observationId
                ? {
                    ...observation,
                    photos: observation.photos.filter((photo) => photo.id !== photoId),
                  }
                : observation,
            ),
      );
    },
    [accessToken],
  );

  const removeObservation = useCallback(
    async (observationId: string) => {
      await deleteObservation(accessToken, observationId);
      setObservations((current) =>
        current.filter((observation) => observation.id !== observationId),
      );
    },
    [accessToken],
  );

  return {
    observations,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    removePhoto,
    removeObservation,
  };
}
