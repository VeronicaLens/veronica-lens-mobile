import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { LearningTrack, LessonSummary } from '../../../shared/api/index.ts';
import {
  applyLessonProgress,
  buildTrackStats,
  countTrackProgress,
  toLessonProgress,
} from './learning-progress.ts';

function lesson(id: string, status: LessonSummary['progress']['status']): LessonSummary {
  return {
    id,
    trackId: 'track-1',
    slug: id,
    title: id,
    sortOrder: 1,
    progress: {
      status,
      progressPercent: status === 'completed' ? 100 : 0,
      completedAt: status === 'completed' ? '2026-09-05T12:00:00.000Z' : null,
    },
  };
}

const track: LearningTrack = {
  id: 'track-1',
  slug: 'track-1',
  title: 'Trilha',
  description: '',
  sortOrder: 1,
  progress: { totalLessons: 3, completedLessons: 1, percent: 33 },
};

describe('learning progress', () => {
  it('counts completed lessons and rounds the percentage', () => {
    assert.deepEqual(
      countTrackProgress([
        lesson('a', 'completed'),
        lesson('b', 'not_started'),
        lesson('c', 'in_progress'),
      ]),
      { totalLessons: 3, completedLessons: 1, percent: 33 },
    );
    assert.deepEqual(countTrackProgress([]), { totalLessons: 0, completedLessons: 0, percent: 0 });
  });

  it('builds stats from track totals and finds the next lesson once lessons are loaded', () => {
    const lessons = [
      lesson('a', 'completed'),
      lesson('b', 'not_started'),
      lesson('c', 'not_started'),
    ];

    const loaded = buildTrackStats([track], { 'track-1': lessons }).get('track-1');
    const notLoaded = buildTrackStats([track], {}).get('track-1');

    assert.equal(loaded?.total, 3);
    assert.equal(loaded?.completed, 1);
    assert.equal(loaded?.nextLesson?.id, 'b');
    assert.equal(notLoaded?.nextLesson, null);
    assert.equal(notLoaded?.percent, 33);
  });

  it('applies a progress update only to the matching lesson', () => {
    const update = {
      lessonId: 'b',
      status: 'completed' as const,
      progressPercent: 100,
      completedAt: '2026-09-06T12:00:00.000Z',
    };

    const result = applyLessonProgress(
      [lesson('a', 'not_started'), lesson('b', 'not_started')],
      update,
    );

    assert.equal(result[0]?.progress.status, 'not_started');
    assert.deepEqual(result[1]?.progress, toLessonProgress(update));
  });
});
