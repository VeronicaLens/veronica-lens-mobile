import { useCallback, useEffect, useMemo, useState } from 'react';

import type { LearningTrack, Lesson, LessonProgress } from '../../../shared/api/index.ts';
import { useRequestGuard } from '../../../shared/lib/index.ts';
import {
  getLearningProgress,
  getLearningTracks,
  getLessons,
  upsertLessonProgress,
} from '../api/learning-api.ts';

export function useLearning(accessToken: string) {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [lessonsByTrack, setLessonsByTrack] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonsLoading, setLessonsLoading] = useState<string | null>(null);
  const guard = useRequestGuard();

  const load = useCallback(async () => {
    const request = guard.begin();
    setLoading(true);
    setError(null);
    try {
      const [tracksResult, progressResult] = await Promise.all([
        getLearningTracks(accessToken),
        getLearningProgress(accessToken),
      ]);
      if (!guard.isCurrent(request)) return;
      setTracks(tracksResult);
      setProgress(progressResult);

      const lessonsEntries = await Promise.all(
        tracksResult.map(async (track) => {
          const lessons = await getLessons(accessToken, track.id);
          return [track.id, lessons] as const;
        }),
      );
      if (!guard.isCurrent(request)) return;
      setLessonsByTrack(Object.fromEntries(lessonsEntries));
    } catch {
      if (guard.isCurrent(request)) {
        setError('Não foi possível carregar as trilhas de aprendizado.');
      }
    } finally {
      if (guard.isCurrent(request)) setLoading(false);
    }
  }, [accessToken, guard]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load remote tracks when session changes.
    void load();
  }, [load]);

  const loadLessons = useCallback(
    async (trackId: string) => {
      if (lessonsByTrack[trackId]) return;
      setLessonsLoading(trackId);
      try {
        const lessons = await getLessons(accessToken, trackId);
        setLessonsByTrack((current) => ({ ...current, [trackId]: lessons }));
      } finally {
        setLessonsLoading((current) => (current === trackId ? null : current));
      }
    },
    [accessToken, lessonsByTrack],
  );

  const progressByLessonId = useMemo(
    () => new Map(progress.map((entry) => [entry.lessonId, entry])),
    [progress],
  );

  const trackStats = useMemo(() => {
    const stats = new Map<
      string,
      { total: number; completed: number; percent: number; nextLesson: Lesson | null }
    >();
    for (const track of tracks) {
      const lessons = lessonsByTrack[track.id] ?? [];
      const total = lessons.length;
      const completed = lessons.filter(
        (lesson) => progressByLessonId.get(lesson.id)?.status === 'completed',
      ).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const nextLesson =
        lessons.find((lesson) => progressByLessonId.get(lesson.id)?.status !== 'completed') ?? null;
      stats.set(track.id, { total, completed, percent, nextLesson });
    }
    return stats;
  }, [tracks, lessonsByTrack, progressByLessonId]);

  const continueTrack = useMemo(() => {
    return (
      tracks.find((track) => {
        const stats = trackStats.get(track.id);
        return stats && stats.completed > 0 && stats.completed < stats.total;
      }) ?? null
    );
  }, [tracks, trackStats]);

  const markLessonComplete = useCallback(
    async (lessonId: string) => {
      const updated = await upsertLessonProgress(accessToken, lessonId, {
        status: 'completed',
        progressPercent: 100,
      });
      setProgress((current) => [
        ...current.filter((entry) => entry.lessonId !== lessonId),
        updated,
      ]);
    },
    [accessToken],
  );

  return {
    tracks,
    lessonsByTrack,
    lessonsLoading,
    progressByLessonId,
    trackStats,
    continueTrack,
    loading,
    error,
    refresh: load,
    loadLessons,
    markLessonComplete,
  };
}
