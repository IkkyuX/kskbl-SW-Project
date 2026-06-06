export type PresenceStatusId =
  | 'custom'
  | 'online'
  | 'away'
  | 'busy'
  | 'dnd'
  | 'invisible'
  | 'qme'
  | 'battery'
  | 'music'
  | 'out'
  | 'travel'
  | 'tired'
  | 'sport'
  | 'weather'
  | 'crush'
  | 'love';

export interface PresenceMeta {
  id: PresenceStatusId;
  label: string;
  dotClass: string;
}

export const DEFAULT_PRESENCE_STATUS: PresenceStatusId = 'online';
export const PRESENCE_STORAGE_KEY = 'sw_current_presence_v1';
const PRESENCE_BY_USER_STORAGE_KEY = 'sw_presence_by_user_v1';

const PRESENCE_META_MAP: Record<PresenceStatusId, PresenceMeta> = {
  custom: { id: 'custom', label: '自定义', dotClass: 'bg-fuchsia-500' },
  online: { id: 'online', label: '在线', dotClass: 'bg-emerald-400' },
  away: { id: 'away', label: '离开', dotClass: 'bg-amber-400' },
  busy: { id: 'busy', label: '忙碌', dotClass: 'bg-rose-500' },
  dnd: { id: 'dnd', label: '请勿打扰', dotClass: 'bg-rose-500' },
  invisible: { id: 'invisible', label: '隐身', dotClass: 'bg-slate-500' },
  qme: { id: 'qme', label: 'Q我吧', dotClass: 'bg-sky-400' },
  battery: { id: 'battery', label: '我的电量', dotClass: 'bg-emerald-300' },
  music: { id: 'music', label: '听歌中', dotClass: 'bg-purple-400' },
  out: { id: 'out', label: '出去浪', dotClass: 'bg-teal-400' },
  travel: { id: 'travel', label: '去旅行', dotClass: 'bg-indigo-400' },
  tired: { id: 'tired', label: '被掏空', dotClass: 'bg-amber-500' },
  sport: { id: 'sport', label: '运动中', dotClass: 'bg-orange-500' },
  weather: { id: 'weather', label: '今日天气', dotClass: 'bg-sky-500' },
  crush: { id: 'crush', label: '我crush了', dotClass: 'bg-pink-500' },
  love: { id: 'love', label: '爱你', dotClass: 'bg-rose-400' },
};

function isPresenceStatusId(value: string): value is PresenceStatusId {
  return value in PRESENCE_META_MAP;
}

function readPresenceStatusMap(): Record<string, PresenceStatusId> {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(PRESENCE_BY_USER_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, status]) => isPresenceStatusId(status))
    ) as Record<string, PresenceStatusId>;
  } catch {
    return {};
  }
}

export function getPresenceMeta(status?: string | null): PresenceMeta {
  if (status && isPresenceStatusId(status)) {
    return PRESENCE_META_MAP[status];
  }
  return PRESENCE_META_MAP[DEFAULT_PRESENCE_STATUS];
}

export function readPresenceStatus(userId?: number | null, fallbackStatus: PresenceStatusId = DEFAULT_PRESENCE_STATUS): PresenceStatusId {
  if (typeof window === 'undefined') {
    return fallbackStatus;
  }
  try {
    if (typeof userId === 'number' && Number.isFinite(userId)) {
      const statusMap = readPresenceStatusMap();
      const storedStatus = statusMap[String(userId)];
      if (storedStatus) {
        return storedStatus;
      }
      return fallbackStatus;
    }
    const raw = window.localStorage.getItem(PRESENCE_STORAGE_KEY);
    return raw && isPresenceStatusId(raw) ? raw : fallbackStatus;
  } catch {
    return fallbackStatus;
  }
}

export function writePresenceStatus(status: PresenceStatusId, userId?: number | null) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (typeof userId === 'number' && Number.isFinite(userId)) {
      const statusMap = readPresenceStatusMap();
      statusMap[String(userId)] = status;
      window.localStorage.setItem(PRESENCE_BY_USER_STORAGE_KEY, JSON.stringify(statusMap));
    }
    window.localStorage.setItem(PRESENCE_STORAGE_KEY, status);
  } catch {
    // Ignore storage failures; the in-memory state still drives the UI.
  }
}
