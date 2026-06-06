import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LEGACY_THEME_CLASSES, THEME_ORDER, THEME_PRESETS, type ThemeType, isThemeType } from '../lib/themeCatalog';
export type BubbleStyleType = 'qq' | 'ios' | 'simple' | 'rounded';
export type { ThemeType } from '../lib/themeCatalog';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  bubbleStyle: BubbleStyleType;
  setBubbleStyle: (style: BubbleStyleType) => void;
  chatFontSize: number;
  setChatFontSize: (size: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'sw_theme_v1';
const BUBBLE_STYLE_STORAGE_KEY = 'sw_bubble_style_v1';
const CHAT_FONT_SIZE_STORAGE_KEY = 'sw_chat_font_size_v1';

function readStoredTheme(): ThemeType {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value && isThemeType(value) ? value : 'light';
}

function readStoredBubbleStyle(): BubbleStyleType {
  if (typeof window === 'undefined') {
    return 'qq';
  }
  const value = window.localStorage.getItem(BUBBLE_STYLE_STORAGE_KEY);
  return value === 'ios' || value === 'simple' || value === 'rounded' ? value : 'qq';
}

function readStoredChatFontSize(): number {
  if (typeof window === 'undefined') {
    return 16;
  }
  const raw = window.localStorage.getItem(CHAT_FONT_SIZE_STORAGE_KEY);
  if (!raw) {
    return 16;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(20, Math.max(14, value)) : 16;
}

function setThemeAsset(root: HTMLElement, key: string, value?: string) {
  if (value) {
    root.style.setProperty(key, `url("${value}")`);
  } else {
    root.style.setProperty(key, 'none');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(readStoredTheme);
  const [bubbleStyle, setBubbleStyleState] = useState<BubbleStyleType>(readStoredBubbleStyle);
  const [chatFontSize, setChatFontSizeState] = useState<number>(readStoredChatFontSize);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...THEME_ORDER, ...LEGACY_THEME_CLASSES);
    root.classList.add(theme);
    root.dataset.theme = theme;
    setThemeAsset(root, '--theme-wallpaper', THEME_PRESETS[theme].media.wallpaper);
    setThemeAsset(root, '--theme-mobile-wallpaper', THEME_PRESETS[theme].media.mobileWallpaper);
    setThemeAsset(root, '--theme-panel-texture', THEME_PRESETS[theme].media.panelTexture);
    setThemeAsset(root, '--theme-accent-texture', THEME_PRESETS[theme].media.accentTexture);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(BUBBLE_STYLE_STORAGE_KEY, bubbleStyle);
  }, [bubbleStyle]);

  useEffect(() => {
    window.localStorage.setItem(CHAT_FONT_SIZE_STORAGE_KEY, String(chatFontSize));
    document.documentElement.style.setProperty('--chat-font-size', `${chatFontSize}px`);
  }, [chatFontSize]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setThemeState,
        bubbleStyle,
        setBubbleStyle: setBubbleStyleState,
        chatFontSize,
        setChatFontSize: setChatFontSizeState,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
