import type {
  DataResponse,
  DeleteAccountRequest,
  Profile,
  UpdateProfileRequest,
} from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;
type ProfileEnvelope = DataResponse<{ profile: Profile }>;

function authorization(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getProfile(
  accessToken: string,
  request: Request = apiRequest,
): Promise<Profile> {
  return (await request<ProfileEnvelope>('/profile', { headers: authorization(accessToken) })).data
    .profile;
}

export async function updateProfile(
  accessToken: string,
  input: UpdateProfileRequest,
  request: Request = apiRequest,
): Promise<Profile> {
  return (
    await request<ProfileEnvelope>('/profile', {
      method: 'PATCH',
      headers: authorization(accessToken),
      body: JSON.stringify(input),
    })
  ).data.profile;
}

/** Permanently removes the account and everything stored for it. */
export async function deleteAccount(
  accessToken: string,
  request: Request = apiRequest,
): Promise<void> {
  const body: DeleteAccountRequest = { confirmation: 'DELETE' };
  await request<void>('/account', {
    method: 'DELETE',
    headers: authorization(accessToken),
    body: JSON.stringify(body),
  });
}
