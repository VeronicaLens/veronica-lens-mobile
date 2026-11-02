import type {
  DataResponse,
  LearningProgressStatus,
  LearningTrack,
  LearningTrackDetail,
  LessonDetail,
  LessonProgressUpdate,
} from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

function authorization(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getLearningTracks(
  accessToken: string,
  request: Request = apiRequest,
): Promise<LearningTrack[]> {
  const response = await request<DataResponse<{ tracks: LearningTrack[] }>>('/learning/tracks', {
    headers: authorization(accessToken),
  });
  return response.data.tracks;
}

export async function getLearningTrack(
  accessToken: string,
  slug: string,
  request: Request = apiRequest,
): Promise<LearningTrackDetail> {
  const response = await request<DataResponse<{ track: LearningTrackDetail }>>(
    `/learning/tracks/${encodeURIComponent(slug)}`,
    { headers: authorization(accessToken) },
  );
  return response.data.track;
}

export async function getLearningLesson(
  accessToken: string,
  lessonId: string,
  request: Request = apiRequest,
): Promise<LessonDetail> {
  const response = await request<DataResponse<{ lesson: LessonDetail }>>(
    `/learning/lessons/${encodeURIComponent(lessonId)}`,
    { headers: authorization(accessToken) },
  );
  return response.data.lesson;
}

export async function upsertLessonProgress(
  accessToken: string,
  lessonId: string,
  input: { status: LearningProgressStatus; progressPercent: number },
  request: Request = apiRequest,
): Promise<LessonProgressUpdate> {
  const response = await request<DataResponse<{ progress: LessonProgressUpdate }>>(
    `/learning/lessons/${encodeURIComponent(lessonId)}/progress`,
    {
      method: 'PUT',
      headers: authorization(accessToken),
      body: JSON.stringify(input),
    },
  );
  return response.data.progress;
}
