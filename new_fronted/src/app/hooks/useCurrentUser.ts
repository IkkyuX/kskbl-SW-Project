import { useCallback, useEffect, useState } from 'react';
import { backendRequest, resolveAvatarUrl, syncLoggedInAccountProfile, UserProfileDto } from '../lib/backend';

export interface AppUser {
  id: string;
  uNumber: number;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  customStatus?: string;
  vip?: boolean;
  level?: number;
  experience?: number;
  school?: string;
  major?: string;
  languages?: string[];
  tags?: string[];
  privacyLevel?: string;
  bio?: string;
}

const CURRENT_USER_CACHE_KEY = 'sw_current_user_cache_v2';

function readCachedCurrentUser() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AppUser;
    return typeof parsed.uNumber === 'number' && Number.isFinite(parsed.uNumber) && parsed.uNumber > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedCurrentUser(user: AppUser) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(CURRENT_USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage quota issues; the module-level cache still helps during this session.
  }
}

function clearCachedCurrentUser() {
  cachedCurrentUser = null;
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(CURRENT_USER_CACHE_KEY);
  } catch {
    // Ignore storage failures; the next profile request will refresh memory state.
  }
}

let cachedCurrentUser: AppUser | null = readCachedCurrentUser();
let pendingProfileRequest: Promise<AppUser> | null = null;

function mapProfileToUser(profile: UserProfileDto): AppUser {
  return {
    id: String(profile.id),
    uNumber: profile.unumber,
    name: profile.nickname,
    avatar: resolveAvatarUrl(profile.avatarUrl, profile.nickname),
    status: profile.status === '未设置' ? 'online' : 'away',
    customStatus: profile.bio || '在线',
    vip: true,
    level: profile.level,
    experience: profile.experience,
    school: profile.school,
    major: profile.major,
    languages: profile.languages,
    tags: profile.tags,
    privacyLevel: profile.privacyLevel,
    bio: profile.bio,
  };
}

async function loadCurrentUserProfile(force = false) {
  if (cachedCurrentUser && !force) {
    return cachedCurrentUser;
  }
  if (pendingProfileRequest && !force) {
    return pendingProfileRequest;
  }

  pendingProfileRequest = backendRequest<UserProfileDto>('/users/profile')
    .then((profile) => {
      syncLoggedInAccountProfile(profile);
      cachedCurrentUser = mapProfileToUser(profile);
      writeCachedCurrentUser(cachedCurrentUser);
      return cachedCurrentUser;
    })
    .finally(() => {
      pendingProfileRequest = null;
    });

  return pendingProfileRequest;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(cachedCurrentUser);
  const [loading, setLoading] = useState(!cachedCurrentUser);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (signal?: { cancelled: boolean }, force = false) => {
    try {
      const user = await loadCurrentUserProfile(force);
      if (signal?.cancelled) {
        return;
      }
      setCurrentUser(user);
      setError(null);
    } catch (err) {
      if (!signal?.cancelled) {
        setError(err instanceof Error ? err.message : '用户资料加载失败');
      }
    } finally {
      if (!signal?.cancelled) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    void loadProfile(signal);
    const handler = () => {
      void loadProfile({ cancelled: false }, true);
    };
    const authHandler = () => {
      clearCachedCurrentUser();
      setCurrentUser(null);
      setLoading(true);
      void loadProfile({ cancelled: false }, true);
    };
    window.addEventListener('sw-user-profile-updated', handler);
    window.addEventListener('sw-auth-changed', authHandler);
    return () => {
      signal.cancelled = true;
      window.removeEventListener('sw-user-profile-updated', handler);
      window.removeEventListener('sw-auth-changed', authHandler);
    };
  }, [loadProfile]);

  return { currentUser, loading, error };
}
