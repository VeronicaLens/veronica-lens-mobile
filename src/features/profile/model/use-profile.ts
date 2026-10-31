import { useCallback, useEffect, useState } from 'react';

import type { Profile, UpdateProfileRequest } from '../../../shared/api/index.ts';
import { useRequestGuard } from '../../../shared/lib/index.ts';
import { getProfile, updateProfile } from '../api/profile-api.ts';
import { uploadProfileAvatar } from '../api/profile-avatar-api.ts';

export function useProfile(accessToken: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guard = useRequestGuard();

  const load = useCallback(async () => {
    const request = guard.begin();
    setLoading(true);
    setError(null);
    try {
      const loaded = await getProfile(accessToken);
      if (guard.isCurrent(request)) setProfile(loaded);
    } catch (cause) {
      if (guard.isCurrent(request)) {
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar seu perfil.');
      }
    } finally {
      if (guard.isCurrent(request)) setLoading(false);
    }
  }, [accessToken, guard]);

  useEffect(() => {
    // The effect intentionally starts synchronization with the remote profile.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const save = useCallback(
    async (input: UpdateProfileRequest) => {
      setSaving(true);
      setError(null);
      try {
        const updated = await updateProfile(accessToken, input);
        setProfile(updated);
        return updated;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Não foi possível salvar seu perfil.');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [accessToken],
  );

  const saveAvatar = useCallback(
    async (uri: string, contentType: 'image/jpeg' | 'image/png' | 'image/webp') => {
      setSaving(true);
      setError(null);
      try {
        const updated = await uploadProfileAvatar(accessToken, uri, contentType);
        setProfile(updated);
        return updated;
      } catch {
        setError('Não foi possível salvar sua foto de perfil.');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [accessToken],
  );

  return { profile, loading, saving, error, load, save, saveAvatar };
}
