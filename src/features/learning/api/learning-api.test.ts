import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { LearningTrackDetail, LessonDetail } from '../../../shared/api/index.ts';
import {
  getLearningLesson,
  getLearningTrack,
  getLearningTracks,
  upsertLessonProgress,
} from './learning-api.ts';

const progress = { status: 'not_started', progressPercent: 0, completedAt: null } as const;

describe('learning API', () => {
  it('requests published tracks through the authenticated backend', async () => {
    let path = '';
    let init: RequestInit | undefined;
    const request = <T>(receivedPath: string, receivedInit?: RequestInit) => {
      path = receivedPath;
      init = receivedInit;
      return Promise.resolve({ data: { tracks: [] }, meta: { count: 0 } } as T);
    };

    assert.deepEqual(await getLearningTracks('token', request), []);

    assert.equal(path, '/learning/tracks');
    assert.deepEqual(init?.headers, { Authorization: 'Bearer token' });
  });

  it('loads a track with its lessons by slug', async () => {
    let path = '';
    const track: LearningTrackDetail = {
      id: 'track-1',
      slug: 'primeiros-passos',
      title: 'Primeiros passos',
      description: 'Comece aqui',
      sortOrder: 1,
      progress: { totalLessons: 1, completedLessons: 0, percent: 0 },
      lessons: [
        {
          id: 'lesson-1',
          trackId: 'track-1',
          slug: 'o-ceu',
          title: 'O céu',
          sortOrder: 1,
          progress,
        },
      ],
    };
    const request = <T>(receivedPath: string) => {
      path = receivedPath;
      return Promise.resolve({ data: { track } } as T);
    };

    assert.deepEqual(await getLearningTrack('token', 'primeiros-passos', request), track);
    assert.equal(path, '/learning/tracks/primeiros-passos');
  });

  it('loads one lesson with its content', async () => {
    let path = '';
    const lesson: LessonDetail = {
      id: 'lesson-1',
      trackId: 'track-1',
      slug: 'o-ceu',
      title: 'O céu',
      sortOrder: 1,
      progress,
      content: 'Conteúdo da aula',
    };
    const request = <T>(receivedPath: string) => {
      path = receivedPath;
      return Promise.resolve({ data: { lesson } } as T);
    };

    assert.equal((await getLearningLesson('token', 'lesson-1', request)).content, lesson.content);
    assert.equal(path, '/learning/lessons/lesson-1');
  });

  it('sends the status and progress to the authenticated backend', async () => {
    let path = '';
    let init: RequestInit | undefined;
    const request = <T>(receivedPath: string, receivedInit?: RequestInit) => {
      path = receivedPath;
      init = receivedInit;
      return Promise.resolve({
        data: {
          progress: {
            lessonId: 'lesson-1',
            status: 'completed',
            progressPercent: 100,
            completedAt: '2026-09-05T12:00:00.000Z',
          },
        },
      } as T);
    };

    const result = await upsertLessonProgress(
      'token',
      'lesson-1',
      { status: 'completed', progressPercent: 100 },
      request,
    );

    assert.equal(path, '/learning/lessons/lesson-1/progress');
    assert.equal(init?.method, 'PUT');
    assert.deepEqual(JSON.parse(String(init?.body)), {
      status: 'completed',
      progressPercent: 100,
    });
    assert.equal(result.status, 'completed');
    assert.equal(result.lessonId, 'lesson-1');
  });
});
