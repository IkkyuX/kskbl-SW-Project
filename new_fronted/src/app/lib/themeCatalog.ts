import profileCover from '../../imports/profile/ink-pine-cover.jpg';
import weekendCity from '../../imports/channel/weekend-city.jpg';
import textureA from '../../imports/image-8.png';
import textureB from '../../imports/image-9.png';
import textureC from '../../imports/image-1.png';
import textureD from '../../imports/image-2.png';

export interface ThemeMedia {
  wallpaper?: string;
  mobileWallpaper?: string;
  panelTexture?: string;
  accentTexture?: string;
}

export interface ThemeLayout {
  momentsShellClass: string;
  momentsHeroClass: string;
  momentsProfileCardClass: string;
  momentsProfileAvatarClass: string;
  momentsProfileNameClass: string;
  momentsProfileStatusClass: string;
  momentsProfileMetricClass: string;
  momentsComposerClass: string;
  momentsComposerInputClass: string;
  momentsComposerIconClass: string;
  momentsCardClass: string;
  momentsFeedClass: string;
}

export interface ThemePreset {
  name: string;
  description: string;
  previewClass: string;
  accentClass: string;
  constraints: string[];
  media: ThemeMedia;
  layout: ThemeLayout;
}

export const THEME_PRESETS = {
  light: {
    name: '白蓝默认',
    description: '纯白蓝渐变、轻纹理和清晰层级，适合作为日常默认主题。',
    previewClass:
      'bg-[linear-gradient(135deg,#ffffff_0%,#f6faff_42%,#eaf2ff_100%)]',
    accentClass: 'bg-blue-500',
    constraints: [
      '白蓝默认主题必须保持无图片底图，仅依赖渐变、边框和轻阴影建立层次。',
      '所有卡片、按钮、输入框和弹层都必须有实底，不允许只保留透明描边框。',
      '默认主题用于通用业务场景，优先保证可读性、信息层级和低噪声。',
    ],
    media: {},
    layout: {
      momentsShellClass: 'bg-gray-50',
      momentsHeroClass: 'bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400',
      momentsProfileCardClass: 'border-gray-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.92)_42%,rgba(244,248,255,1)_100%)] shadow-[0_18px_42px_rgba(37,99,235,0.08)] backdrop-blur-xl',
      momentsProfileAvatarClass: 'ring-white',
      momentsProfileNameClass: 'text-slate-900',
      momentsProfileStatusClass: 'text-slate-600',
      momentsProfileMetricClass: 'text-slate-600',
      momentsComposerClass: 'border-gray-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.9)_52%,rgba(248,251,255,1)_100%)] backdrop-blur-xl',
      momentsComposerInputClass: 'text-slate-900 placeholder:text-slate-400',
      momentsComposerIconClass: 'text-slate-500 hover:bg-blue-50 hover:text-blue-600',
      momentsCardClass: 'border border-gray-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(255,255,255,0.94)_30%,rgba(255,255,255,1)_100%)] backdrop-blur-xl',
      momentsFeedClass: 'gap-3',
    },
  },
  cyber: {
    name: '黑金奢感',
    description: '黑曜底色搭配金属光泽、图片纹理和高光层，整个界面像被重新定制。',
    previewClass:
      'bg-[radial-gradient(circle_at_top,rgba(255,229,156,0.42),transparent_52%),linear-gradient(135deg,#050505_0%,#15110c_52%,#2b1f0f_100%)]',
    accentClass: 'bg-amber-300',
    constraints: [
      '黑金主题可以使用壁纸、纹理和高光层，但所有文字、按钮和表面仍需满足对比度。',
      '媒体资产缺失时必须自动回退到静态渐变，不得出现空白底层。',
      '豪华主题只适合作为签名款，不要扩展成一组互相重复的深色变体。',
    ],
    media: {
      wallpaper: weekendCity,
      mobileWallpaper: profileCover,
      panelTexture: textureA,
      accentTexture: textureB,
    },
    layout: {
      momentsShellClass: 'bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50',
      momentsHeroClass: 'bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20',
      momentsProfileCardClass: 'border-white/10 bg-[linear-gradient(180deg,rgba(15,11,7,0.72)_0%,rgba(15,11,7,0.9)_42%,rgba(5,5,5,0.98)_100%)] text-[#f7e8c7] shadow-[0_22px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl',
      momentsProfileAvatarClass: 'ring-slate-900/90',
      momentsProfileNameClass: 'text-[#f7e8c7]',
      momentsProfileStatusClass: 'text-amber-100/80',
      momentsProfileMetricClass: 'text-amber-100/75',
      momentsComposerClass: 'border-white/10 bg-[linear-gradient(180deg,rgba(15,11,7,0.72)_0%,rgba(15,11,7,0.9)_52%,rgba(5,5,5,0.98)_100%)] backdrop-blur-xl',
      momentsComposerInputClass: 'text-[#f7e8c7] placeholder:text-amber-100/35',
      momentsComposerIconClass: 'text-amber-100/65 hover:bg-white/8 hover:text-amber-200',
      momentsCardClass: 'border border-white/10 bg-[linear-gradient(180deg,rgba(15,11,7,0.66)_0%,rgba(15,11,7,0.84)_36%,rgba(5,5,5,0.96)_100%)] backdrop-blur-xl',
      momentsFeedClass: 'gap-3',
    },
  },
} as const satisfies Record<string, ThemePreset>;

export type ThemeType = keyof typeof THEME_PRESETS;

export const THEME_ORDER: ThemeType[] = ['light', 'cyber'];
export const LEGACY_THEME_CLASSES = ['rose', 'mint', 'dark'] as const;

export function isThemeType(value: string): value is ThemeType {
  return value in THEME_PRESETS;
}
