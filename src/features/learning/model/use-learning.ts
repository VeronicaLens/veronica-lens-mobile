import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  LearningTrack,
  LessonDetail,
  LessonProgress,
  LessonSummary,
} from '../../../shared/api/index.ts';
import { useRequestGuard } from '../../../shared/lib/index.ts';
import {
  getLearningLesson,
  getLearningTrack,
  getLearningTracks,
  upsertLessonProgress,
} from '../api/learning-api.ts';
import {
  applyLessonProgress,
  buildTrackStats,
  countTrackProgress,
} from '../lib/learning-progress.ts';

export function useLearning(accessToken: string) {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [lessonsByTrack, setLessonsByTrack] = useState<Record<string, LessonSummary[]>>({});
  const [lessonDetails, setLessonDetails] = useState<Record<string, LessonDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonsLoading, setLessonsLoading] = useState<string | null>(null);
  const [lessonLoading, setLessonLoading] = useState<string | null>(null);
  const [lessonsFailedFor, setLessonsFailedFor] = useState<string | null>(null);
  const [lessonFailedFor, setLessonFailedFor] = useState<string | null>(null);
  const guard = useRequestGuard();

  const load = useCallback(async () => {
    const request = guard.begin();
    setLoading(true);
    setError(null);
    try {
      const loaded = await getLearningTracks(accessToken);
      if (!guard.isCurrent(request)) return;
      setTracks(loaded);
      setLessonsByTrack({});
      setLessonDetails({});
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
      const track = tracks.find((candidate) => candidate.id === trackId);
      if (!track || lessonsByTrack[trackId] || lessonsLoading === trackId) return;
      setLessonsFailedFor(null);
      setLessonsLoading(trackId);
      try {
        const detail = await getLearningTrack(accessToken, track.slug);
        setLessonsByTrack((current) => ({ ...current, [trackId]: detail.lessons }));
      } catch {
        setLessonsFailedFor(trackId);
      } finally {
        setLessonsLoading((current) => (current === trackId ? null : current));
      }
    },
    [accessToken, lessonsByTrack, lessonsLoading, tracks],
  );

  const loadLesson = useCallback(
    async (lessonId: string) => {
      if (lessonDetails[lessonId] || lessonLoading === lessonId) return;
      setLessonFailedFor(null);
      setLessonLoading(lessonId);
      try {
        const lesson = await getLearningLesson(accessToken, lessonId);
        setLessonDetails((current) => ({ ...current, [lessonId]: lesson }));
      } catch {
        setLessonFailedFor(lessonId);
      } finally {
        setLessonLoading((current) => (current === lessonId ? null : current));
      }
    },
    [accessToken, lessonDetails, lessonLoading],
  );

  const progressByLessonId = useMemo(() => {
    const map = new Map<string, LessonProgress>();
    for (const lessons of Object.values(lessonsByTrack)) {
      for (const lesson of lessons) map.set(lesson.id, lesson.progress);
    }
    return map;
  }, [lessonsByTrack]);

  const trackStats = useMemo(
    () => buildTrackStats(tracks, lessonsByTrack),
    [lessonsByTrack, tracks],
  );

  const continueTrack = useMemo(
    () =>
      tracks.find((track) => {
        const stats = trackStats.get(track.id);
        return stats && stats.completed > 0 && stats.completed < stats.total;
      }) ?? null,
    [tracks, trackStats],
  );

  const markLessonComplete = useCallback(
    async (lessonId: string) => {
      const updated = await upsertLessonProgress(accessToken, lessonId, {
        status: 'completed',
        progressPercent: 100,
      });
      const trackId = Object.keys(lessonsByTrack).find((id) =>
        lessonsByTrack[id]?.some((lesson) => lesson.id === lessonId),
      );
      if (!trackId) return;
      const lessons = applyLessonProgress(lessonsByTrack[trackId] ?? [], updated);
      setLessonsByTrack((current) => ({ ...current, [trackId]: lessons }));
      setTracks((current) =>
        current.map((track) =>
          track.id === trackId ? { ...track, progress: countTrackProgress(lessons) } : track,
        ),
      );
    },
    [accessToken, lessonsByTrack],
  );

  return {
    tracks,
    lessonsByTrack,
    lessonDetails,
    lessonsLoading,
    lessonLoading,
    lessonsFailedFor,
    lessonFailedFor,
    progressByLessonId,
    trackStats,
    continueTrack,
    loading,
    error,
    refresh: load,
    loadLessons,
    loadLesson,
    markLessonComplete,
  };
}
