export type LanguageCode = 'zh-CN' | 'ko-KR';

export interface SettingsPreferences {
  messageAlerts: boolean;
  friendRequestAlerts: boolean;
  soundEnabled: boolean;
  language: LanguageCode;
}

const SETTINGS_PREFS_KEY = 'sw_settings_prefs_v1';
const SETTINGS_UPDATED_EVENT = 'sw-settings-prefs-updated';

export const DEFAULT_SETTINGS_PREFERENCES: SettingsPreferences = {
  messageAlerts: true,
  friendRequestAlerts: true,
  soundEnabled: true,
  language: 'zh-CN',
};

function normalizeLanguage(value: unknown): LanguageCode {
  return value === 'ko-KR' ? value : DEFAULT_SETTINGS_PREFERENCES.language;
}

function normalizePreferences(value: Partial<SettingsPreferences> | null | undefined): SettingsPreferences {
  return {
    messageAlerts: value?.messageAlerts ?? DEFAULT_SETTINGS_PREFERENCES.messageAlerts,
    friendRequestAlerts: value?.friendRequestAlerts ?? DEFAULT_SETTINGS_PREFERENCES.friendRequestAlerts,
    soundEnabled: value?.soundEnabled ?? DEFAULT_SETTINGS_PREFERENCES.soundEnabled,
    language: normalizeLanguage(value?.language),
  };
}

export function readSettingsPreferences(): SettingsPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_PREFS_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS_PREFERENCES;
    }
    return normalizePreferences(JSON.parse(raw) as Partial<SettingsPreferences>);
  } catch {
    return DEFAULT_SETTINGS_PREFERENCES;
  }
}

export function applySettingsPreferences(prefs: SettingsPreferences) {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.lang = prefs.language;
}

export function writeSettingsPreferences(prefs: SettingsPreferences) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextValue = JSON.stringify(prefs);
  const currentValue = window.localStorage.getItem(SETTINGS_PREFS_KEY);
  if (currentValue === nextValue) {
    applySettingsPreferences(prefs);
    return;
  }

  window.localStorage.setItem(SETTINGS_PREFS_KEY, nextValue);
  applySettingsPreferences(prefs);
  window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
}

export function subscribeSettingsPreferences(onChange: (prefs: SettingsPreferences) => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange: EventListener = () => {
    onChange(readSettingsPreferences());
  };

  window.addEventListener(SETTINGS_UPDATED_EVENT, handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener(SETTINGS_UPDATED_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
}
