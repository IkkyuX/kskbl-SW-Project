import { useTheme } from '../context/ThemeContext';
import { THEME_PRESETS } from '../lib/themeCatalog';
import { getThemeBackdropStyle, getThemeMobileBackdropStyle, isLuxuryTheme } from '../lib/themeStyles';

export function ThemeBackdrop() {
  const { theme } = useTheme();
  const preset = THEME_PRESETS[theme];
  const luxury = isLuxuryTheme(theme);
  const hasDesktopWallpaper = Boolean(preset.media.wallpaper);
  const hasMobileWallpaper = Boolean(preset.media.mobileWallpaper);
  const hasTexture = Boolean(preset.media.panelTexture);

  if (!luxury) {
    return <div className="pointer-events-none fixed inset-0 -z-10 bg-[var(--background)]" />;
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.04)_0%,rgba(14,10,6,0.2)_35%,rgba(5,5,5,0.84)_100%)]" />
      {hasDesktopWallpaper && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
          style={getThemeBackdropStyle(theme)}
        />
      )}
      {hasMobileWallpaper && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 md:hidden"
          style={getThemeMobileBackdropStyle(theme)}
        />
      )}
      <div className="theme-noise absolute inset-0 opacity-70" />
      <div className="absolute inset-x-0 top-0 h-[28vh] bg-[linear-gradient(180deg,rgba(255,232,162,0.08),transparent)]" />
      {luxury && hasTexture && (
        <img
          src={preset.media.panelTexture}
          alt=""
          className="absolute left-1/2 top-[14%] hidden w-[38rem] -translate-x-1/2 select-none opacity-[0.07] mix-blend-screen md:block"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
    </div>
  );
}
