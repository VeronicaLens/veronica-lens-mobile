import type * as Api from './generated/types.gen.ts';

export interface DataResponse<T> {
  data: T;
}

// Auth
export type User = Api.PublicUser;
export type Session = Api.PublicSession;
export type SignUpResult = Api.SignUpResult;
export type SignUpRequest = Api.SignUpInput;
export type SignInRequest = Api.SignInInput;
export type GoogleSignInRequest = Api.GoogleSignInInput;
export type RefreshSessionRequest = Api.RefreshSessionInput;
export type PasswordRecoveryRequest = Api.PasswordRecoveryInput;
export type PasswordUpdateRequest = Api.UpdatePasswordInput;

// Profile and account
export type Profile = Api.Profile;
export type UpdateProfileRequest = Api.UpdateProfileInput;
export type MeasurementUnit = Api.Profile['measurementUnit'];
export type AppLanguage = Api.Profile['language'];
export type DeleteAccountRequest = Api.DeleteAccountInput;

// Observer, sky and conditions
export type CelestialObject = Api.CelestialObject;
export type Observer = Api.Observer;
export type SkyGuidePositionsRequest = Api.SkyPositionsInput;
export type SkyGuidePositionsData = Api.SkyPositionsResult;
export type SkyGuideObjectPosition = Api.SkyPositionsResult['positions'][number];
export type SkyRiseSetRequest = Api.RiseSetInput;
export type SkyRiseSetData = Api.RiseSetResult;
export type SkyRiseSetObject = Api.RiseSetResult['objects'][number];
export type SkyRiseSetEvent = SkyRiseSetObject['events'][number];
export type CurrentConditionsResult = Api.CurrentConditionsResult;
export type ConditionsForecastResult = Api.ConditionsForecastResult;
export type HourlyConditions = Api.HourlyConditions;
export type ObservationRating = Api.HourlyConditions['rating'];
export type ConditionFactor = Api.HourlyConditions['factors'][number];

// Planning
export type ObservationRecommendationRequest = Api.RecommendationInput;
export type ObservationRecommendation = Api.RecommendationResult;
export type RecommendedWindow = NonNullable<Api.RecommendationResult['window']>;
export type PlanningSample = Api.RecommendationResult['samples'][number];

// Events
export type AstronomicalEvent = Api.AstronomicalEvent;
export type UpcomingEvents = Api.ListEventsResponse['data'];

// Notifications
export type PushDevicePlatform = 'android' | 'ios';
export type PushDeviceRequest = Api.RegisterNotificationDeviceData['body'];

// The API documents the shapes below loosely, so they mirror its TypeScript models.
export type LearningProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface LessonProgress {
  status: LearningProgressStatus;
  progressPercent: number;
  completedAt: string | null;
}

export interface LessonProgressUpdate extends LessonProgress {
  lessonId: string;
}

export interface TrackProgress {
  totalLessons: number;
  completedLessons: number;
  percent: number;
}

export interface LearningTrack {
  id: string;
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
  progress: TrackProgress;
}

export interface LessonSummary {
  id: string;
  trackId: string;
  slug: string;
  title: string;
  sortOrder: number;
  progress: LessonProgress;
}

export interface LearningTrackDetail extends LearningTrack {
  lessons: LessonSummary[];
}

export interface LessonDetail extends LessonSummary {
  content: string;
}

export interface ObservationCaptureSummary {
  deviceName: string | null;
  iso: number | null;
  exposureTimeSeconds: number | null;
  exposureCompensationEv: number | null;
  focusMode: string | null;
  focusLensPosition: number | null;
  whiteBalanceKelvin: number | null;
}

export interface ObservationHistoryPhoto {
  id: string;
  storagePath: string;
  capturedAt: string | null;
  thumbnailUrl: string | null;
  capture: ObservationCaptureSummary | null;
}

export interface ObservationHistoryItem {
  id: string;
  title: string;
  notes: string;
  celestialObjectName: string | null;
  observedAt: string;
  latitude: number | null;
  longitude: number | null;
  photos: ObservationHistoryPhoto[];
}

export interface ObservationHistoryPage {
  observations: ObservationHistoryItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ObservationPhotoResult {
  observationId: string;
  photoId: string;
  storagePath: string;
  capturedAt: string;
}
