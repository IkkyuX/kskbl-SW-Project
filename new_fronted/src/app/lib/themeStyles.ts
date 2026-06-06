import { THEME_PRESETS, type ThemeType } from './themeCatalog';

export function isLuxuryTheme(theme: ThemeType) {
  return theme === 'cyber';
}

export function isDarkLikeTheme(theme: ThemeType) {
  return isLuxuryTheme(theme);
}

export function getThemeShellClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'bg-[#050505] text-[var(--foreground)]'
    : 'bg-[var(--background)] text-[var(--foreground)]';
}

export function getThemePanelClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'border border-white/10 bg-[var(--card)] text-[var(--card-foreground)] shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl'
    : 'border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,255,0.98)_100%)] text-[var(--card-foreground)] shadow-[0_16px_40px_rgba(37,99,235,0.10)]';
}

export function getThemeHeaderClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'border-b border-white/10 bg-[linear-gradient(135deg,rgba(212,175,55,0.16),rgba(255,255,255,0.04),rgba(0,0,0,0.12))] backdrop-blur-2xl'
    : 'border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,249,255,0.98)_100%)]';
}

export function getThemeMutedSurfaceClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'bg-white/5'
    : 'bg-[var(--muted)]';
}

export function getThemeControlClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'border-white/10 bg-white/5 text-[var(--foreground)] placeholder:text-white/45 focus:border-amber-300/45 focus:bg-white/8'
    : 'border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(250,252,255,0.98)_100%)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]';
}

export function getThemeAccentClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'bg-[linear-gradient(135deg,#ffe8a2_0%,#d4af37_42%,#8f6916_100%)] text-[#120d06] shadow-[0_14px_30px_rgba(212,175,55,0.24)]'
    : 'bg-[var(--primary)] text-[var(--primary-foreground)]';
}

export function getThemePrimaryButtonClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? '!border-transparent !bg-[linear-gradient(135deg,#ffe8a2_0%,#d4af37_42%,#8f6916_100%)] !text-[#120d06] shadow-[0_14px_30px_rgba(212,175,55,0.24)] hover:brightness-[1.03]'
    : '!border-transparent !bg-[var(--button-primary)] !text-[var(--button-primary-foreground)] shadow-[0_12px_28px_rgba(37,99,235,0.22)] hover:brightness-[0.98]';
}

export function getThemePillClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'border border-white/10 bg-white/8 text-[var(--foreground)] shadow-[0_12px_28px_rgba(0,0,0,0.18)] backdrop-blur-xl'
    : 'border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,255,0.98)_100%)] text-[var(--foreground)] shadow-[0_8px_20px_rgba(37,99,235,0.08)]';
}

export function getThemeSoftCardClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'border border-white/10 bg-white/[0.05] text-[var(--foreground)]'
    : 'border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,255,1)_100%)] text-[var(--foreground)] shadow-[0_10px_28px_rgba(37,99,235,0.08)]';
}

export function getThemeOverlayButtonClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'bg-black/30 text-white'
    : 'bg-[var(--card)]/90 text-[var(--foreground)]';
}

export function getThemeCoverBottomFadeClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'bg-gradient-to-t from-[#050505] to-transparent'
    : 'bg-gradient-to-t from-white to-transparent';
}

export function getThemeCoverTopFadeClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'bg-gradient-to-b from-transparent via-[#050505]/85 to-[#050505]'
    : 'bg-gradient-to-b from-transparent via-white/80 to-white';
}

export function getThemeChipClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'bg-white/10 text-white'
    : 'bg-white/60 text-[var(--foreground)]';
}

export function getThemeSectionDividerClass(theme: ThemeType) {
  return isLuxuryTheme(theme) ? 'border-white/10' : 'border-[var(--border)]';
}

export function getThemeEmptyStateClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'border border-white/10 bg-white/5 text-[var(--foreground)]'
    : 'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]';
}

export function getThemeSecondaryButtonClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? '!border-white/10 !bg-white/5 !text-white'
    : '!border-[var(--button-border)] !bg-[var(--button-secondary)] !text-[var(--button-secondary-foreground)] shadow-[0_10px_24px_rgba(37,99,235,0.08)] hover:brightness-[0.99]';
}

export function getThemeVipBadgeClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'border border-amber-300/20 bg-amber-300/10 text-amber-100'
    : 'border border-[#ffd89b] bg-[#fff1d5] text-[#d26b00]';
}

export function getThemeAvatarRingClass(theme: ThemeType) {
  return isLuxuryTheme(theme) ? 'ring-4 ring-white/10' : 'ring-4 ring-white';
}

export function getThemeFloatingSurfaceClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'border border-white/10 bg-[rgba(15,11,7,0.94)] text-[var(--foreground)] shadow-[0_20px_50px_rgba(0,0,0,0.34)] backdrop-blur-2xl'
    : 'border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,251,255,0.98)_100%)] text-[var(--foreground)] shadow-[0_20px_50px_rgba(37,99,235,0.12)] backdrop-blur-2xl';
}

export function getThemePageShellClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'bg-[linear-gradient(180deg,rgba(5,5,5,0.7),rgba(15,11,7,0.88))]'
    : 'bg-gray-100 dark:bg-[var(--chat-panel)]';
}

export function getThemePageHeaderClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'bg-[linear-gradient(90deg,rgba(255,232,162,0.12),rgba(15,11,7,0.9))]'
    : 'bg-[var(--card)]';
}

export function getThemePageFooterClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'bg-[#090806]'
    : 'bg-white dark:bg-[var(--card)]';
}

export function getThemePageSoftSurfaceClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'border-white/10 bg-white/7 text-[var(--foreground)]'
    : 'border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]';
}

export function getThemeBackdropStyle(theme: ThemeType) {
  const media = THEME_PRESETS[theme].media;
  if (!media.wallpaper) {
    return { backgroundImage: 'none' } as const;
  }
  return {
    backgroundImage: `url("${media.wallpaper}")`,
  } as const;
}

export function getThemeMobileBackdropStyle(theme: ThemeType) {
  const media = THEME_PRESETS[theme].media;
  if (!media.mobileWallpaper) {
    return { backgroundImage: 'none' } as const;
  }
  return {
    backgroundImage: `url("${media.mobileWallpaper}")`,
  } as const;
}

export function getThemeReadableTextClass(theme: ThemeType) {
  return isDarkLikeTheme(theme) ? 'text-white' : 'text-gray-900';
}

export function getThemeSecondaryTextClass(theme: ThemeType) {
  return isDarkLikeTheme(theme) ? 'text-gray-400' : 'text-gray-600';
}

export function getThemeActiveIndicatorClass(theme: ThemeType) {
  return isLuxuryTheme(theme)
    ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-700'
    : 'bg-[var(--primary)]';
}

export function getThemeMomentsLayout(theme: ThemeType) {
  return THEME_PRESETS[theme].layout;
}
