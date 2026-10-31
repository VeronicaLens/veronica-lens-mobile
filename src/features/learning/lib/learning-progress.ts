import type {
  LearningTrack,
  LessonProgress,
  LessonProgressUpdate,
  LessonSummary,
  TrackProgress,
} from '../../../shared/api/index.ts';

export interface TrackStats {
  total: number;
  completed: number;
  percent: number;
  nextLesson: LessonSummary | null;
}

export function countTrackProgress(lessons: LessonSummary[]): TrackProgress {
  const completed = lessons.filter((lesson) => lesson.progress.status === 'completed').length;
  const total = lessons.length;
  return {
    totalLessons: total,
    completedLessons: completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

/** Track totals come from the track list; the next lesson needs the lessons to be loaded. */
export function buildTrackStats(
  tracks: LearningTrack[],
  lessonsByTrack: Record<string, LessonSummary[]>,
): Map<string, TrackStats> {
  const stats = new Map<string, TrackStats>();
  for (const track of tracks) {
    const lessons = lessonsByTrack[track.id];
    stats.set(track.id, {
      total: track.progress.totalLessons,
      completed: track.progress.completedLessons,
      percent: track.progress.percent,
      nextLesson: lessons?.find((lesson) => lesson.progress.status !== 'completed') ?? null,
    });
  }
  return stats;
}

export function toLessonProgress(update: LessonProgressUpdate): LessonProgress {
  return {
    status: update.status,
    progressPercent: update.progressPercent,
    completedAt: update.completedAt,
  };
}

export function applyLessonProgress(
  lessons: LessonSummary[],
  update: LessonProgressUpdate,
): LessonSummary[] {
  return lessons.map((lesson) =>
    lesson.id === update.lessonId ? { ...lesson, progress: toLessonProgress(update) } : lesson,
  );
}
