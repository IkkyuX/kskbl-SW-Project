import { ArrowLeft, Search, User, Sparkles } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useTheme, type ThemeType, type BubbleStyleType } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { THEME_ORDER, THEME_PRESETS } from '../lib/themeCatalog';
import {
  getThemeAccentClass,
  getThemeHeaderClass,
  getThemePanelClass,
  getThemePillClass,
  getThemeReadableTextClass,
  getThemeSecondaryTextClass,
  getThemeSoftCardClass,
  isDarkLikeTheme,
  isLuxuryTheme,
} from '../lib/themeStyles';
import profileCover from '../../imports/profile/ink-pine-cover.jpg';
import seoulCampus from '../../imports/channel/seoul-campus.jpg';
import weekendCity from '../../imports/channel/weekend-city.jpg';

interface PersonalizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUserPanel: () => void;
}

const PERSONALIZATION_CATALOG = {
  banner: {
    badge: 'SVIP专属',
    title: '个性装扮·真实商店',
    description: '主题、气泡、套装都放进同一套配置里，后面加新内容只需要补一条数据。',
    image: profileCover,
  },
  filters: ['排行', '上新', '套装'] as const,
  bubbles: [
    { id: 'qq', name: '基础气泡', description: '圆角黑底白字', preview: 'rounded-[18px]', price: '免费' },
    { id: 'ios', name: 'iOS风格', description: '柔和气泡', preview: 'rounded-[20px]', price: '免费' },
    { id: 'simple', name: '简约方块', description: '极简设计', preview: 'rounded-lg', price: '免费' },
    { id: 'rounded', name: '萌萌圆形', description: '可爱圆润', preview: 'rounded-full', price: 'SVIP免费' },
  ] as const,
  showcases: [
    {
      id: 'white-blue-default',
      title: '白蓝默认',
      description: '白色底色、蓝色主按钮和轻量图片层，适合日常聊天和浏览。',
      tag: '默认',
      price: '免费',
      image: seoulCampus,
      theme: 'light' as ThemeType,
      bubbleStyle: 'ios' as BubbleStyleType,
    },
    {
      id: 'night-city',
      title: '黑金奢感',
      description: '黑金主题配圆润气泡，整体更像定制皮肤包。',
      tag: '热卖',
      price: 'SVIP',
      image: weekendCity,
      theme: 'cyber' as ThemeType,
      bubbleStyle: 'rounded' as BubbleStyleType,
    },
  ] as const,
} as const;

export function PersonalizationPanel({ isOpen, onClose, onOpenUserPanel }: PersonalizationPanelProps) {
  const { theme, setTheme, bubbleStyle, setBubbleStyle } = useTheme();
  const themes = THEME_ORDER.map((id) => ({ id, ...THEME_PRESETS[id] }));
  const bubbleStyles = PERSONALIZATION_CATALOG.bubbles;
  const showcaseCards = PERSONALIZATION_CATALOG.showcases;
  const luxuryTheme = isLuxuryTheme(theme);

  const getBubblePreviewClass = (styleId: string, received = false) =>
    styleId === 'qq'
      ? luxuryTheme
        ? 'bg-[linear-gradient(135deg,rgba(255,232,162,0.16),rgba(212,175,55,0.16),rgba(15,11,7,0.92))] text-[#f9ebc8] shadow-[0_8px_18px_rgba(0,0,0,0.22)]'
        : 'bg-[var(--card)] text-[var(--foreground)] shadow-[0_8px_18px_rgba(0,0,0,0.12)] border border-[var(--border)]'
      : received
        ? 'bg-[var(--chat-bubble-received)] text-[var(--chat-bubble-received-text)]'
        : 'bg-[var(--chat-bubble-sent)] text-white';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 bottom-0 w-full md:w-[480px] z-50 flex flex-col overflow-hidden shadow-2xl ${getThemePanelClass(theme)}`}
          >
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between ${getThemeHeaderClass(theme)}`}>
              <button
                onClick={onClose}
                className="text-[var(--foreground)] active:scale-95 transition-transform"
              >
                <ArrowLeft className="size-6" />
              </button>
              <h1 className="text-lg font-semibold text-[var(--foreground)]">个性装扮</h1>
              <div className="flex items-center gap-2">
                <button className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] active:scale-95 transition-all">
                  <Search className="size-6" />
                </button>
                <button
                  onClick={onOpenUserPanel}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] active:scale-95 transition-all"
                >
                  <User className="size-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="recommend" className="flex-1 flex min-h-0 flex-col gap-0">
              <div className="px-4 pt-3 pb-2">
                <TabsList className="w-full">
                  <TabsTrigger value="recommend" className="flex-1">推荐</TabsTrigger>
                  <TabsTrigger value="theme" className="flex-1">主题</TabsTrigger>
                  <TabsTrigger value="bubble" className="flex-1">气泡</TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1">
                <ScrollArea className="h-full min-h-0">
                {/* Recommend Tab */}
                <TabsContent value="recommend" className="m-0 min-h-0 p-4">
                  {/* Featured Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative mb-6 overflow-hidden rounded-2xl border ${luxuryTheme ? 'border-white/10' : 'border-[var(--border)]'}`}
                  >
                    <ImageWithFallback
                      src={PERSONALIZATION_CATALOG.banner.image}
                      alt={PERSONALIZATION_CATALOG.banner.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
                    <div className="relative z-10 min-h-[190px] p-6">
                          <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="rounded-lg bg-[rgba(255,255,255,0.2)] px-2 py-1 text-xs font-medium text-white backdrop-blur-md">
                            {PERSONALIZATION_CATALOG.banner.badge}
                          </div>
                        </div>
                        <Sparkles className="size-6 text-white/80" />
                      </div>
                      <div className="mt-12 max-w-[18rem]">
                        <h3 className="text-xl font-bold leading-tight text-white">
                          {PERSONALIZATION_CATALOG.banner.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-white/80">
                          {PERSONALIZATION_CATALOG.banner.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Quick Filters */}
                  <div className="flex items-center gap-2 mb-6">
                    {PERSONALIZATION_CATALOG.filters.map((filter) => (
                      <button
                        key={filter}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${getThemePillClass(theme)}`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  {/* Shop Showcase */}
                  <div className="mb-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-base font-semibold text-[var(--foreground)]">精选商城</h3>
                      <span className="text-xs text-[var(--muted-foreground)]">真实图片素材</span>
                    </div>
                    <div className="space-y-3">
                      {showcaseCards.map((item) => {
                        const isActive = theme === item.theme && bubbleStyle === item.bubbleStyle;
                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setTheme(item.theme);
                              setBubbleStyle(item.bubbleStyle);
                            }}
                            whileTap={{ scale: 0.985 }}
                            className={`block w-full overflow-hidden rounded-2xl border text-left ${getThemeSoftCardClass(theme)}`}
                          >
                            <div className="relative h-36 overflow-hidden">
                              <ImageWithFallback
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/76 via-black/18 to-transparent" />
                              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-[rgba(255,255,255,0.2)] px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                                      {item.tag}
                                    </span>
                                    <span className="text-[10px] text-white/80">{item.price}</span>
                                  </div>
                                  <p className="mt-2 truncate text-base font-semibold text-white">{item.title}</p>
                                  <p className="mt-1 h-10 overflow-hidden text-xs leading-5 text-white/80">
                                    {item.description}
                                  </p>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                                    isActive
                                      ? 'bg-[var(--card)] text-[var(--foreground)]'
                                      : 'bg-[rgba(255,255,255,0.2)] text-white backdrop-blur-md'
                                  }`}
                                >
                                  {isActive ? '使用中' : '试用'}
                                </span>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Theme Preview */}
                  <div className="mb-6">
                    <h3 className="mb-3 text-base font-semibold text-[var(--foreground)]">热门主题</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {themes.map((themeOption) => (
                        <motion.button
                          key={themeOption.id}
                          onClick={() => setTheme(themeOption.id as ThemeType)}
                          className={`relative p-4 rounded-2xl transition-all text-left ${
                            theme === themeOption.id
                              ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]'
                              : ''
                          } ${getThemeSoftCardClass(theme)}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className={`relative w-full h-24 rounded-xl mb-3 overflow-hidden ${themeOption.previewClass} flex items-center justify-center shadow-sm`}>
                            {themeOption.media.wallpaper ? (
                              <>
                                <ImageWithFallback
                                  src={themeOption.media.wallpaper}
                                  alt={themeOption.name}
                                  className="absolute inset-0 h-full w-full object-cover"
                                />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/12 to-transparent" />
                              </>
                            ) : (
                              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_55%,rgba(37,99,235,0.12))]" />
                            )}
                            <div className={`relative size-8 rounded-full ${themeOption.accentClass}`} />
                          </div>
                          <p className="mb-0.5 text-sm font-medium text-[var(--foreground)]">{themeOption.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{themeOption.description}</p>
                          {theme === themeOption.id && (
                            <motion.div
                              layoutId="activeThemeRecommend"
                              className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${getThemeAccentClass(theme)}`}
                              initial={false}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              使用中
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Bubble Preview */}
                  <div className="mb-6">
                    <h3 className="mb-3 text-base font-semibold text-[var(--foreground)]">可爱聊天气泡</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {bubbleStyles.map((style) => (
                        <motion.button
                          key={style.id}
                          onClick={() => setBubbleStyle(style.id as BubbleStyleType)}
                          className={`relative p-4 rounded-2xl transition-all text-left ${
                            bubbleStyle === style.id
                              ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]'
                              : ''
                          } ${getThemeSoftCardClass(theme)}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="mb-3 space-y-2">
                            <div className={`h-10 ${style.preview} ${getBubblePreviewClass(style.id)} flex items-center px-3`}>
                              <span className="text-xs">大家好！</span>
                            </div>
                            <div className={`h-10 ${style.preview} ${getBubblePreviewClass(style.id, true)} flex items-center px-3 ml-auto w-3/4`}>
                              <span className="text-xs">你好呀～</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="mb-0.5 text-sm font-medium text-[var(--foreground)]">{style.name}</p>
                              <p className="text-xs text-[var(--muted-foreground)]">{style.description}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              style.price === '免费'
                                ? luxuryTheme
                                  ? 'bg-emerald-500/18 text-emerald-300'
                                  : 'bg-green-100 text-green-700'
                                : luxuryTheme
                                ? 'bg-amber-500/18 text-amber-200'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {style.price}
                            </span>
                          </div>
                          {bubbleStyle === style.id && (
                            <motion.div
                              layoutId="activeBubbleRecommend"
                              className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[var(--primary)] text-white text-[10px] font-medium"
                              initial={false}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              使用中
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Theme Tab */}
                <TabsContent value="theme" className="m-0 min-h-0 p-4">
                  <div className="space-y-3">
                    {themes.map((themeOption) => (
                      <motion.button
                        key={themeOption.id}
                        onClick={() => setTheme(themeOption.id as ThemeType)}
                          className={`w-full p-4 rounded-2xl transition-all flex items-center gap-4 ${
                            theme === themeOption.id
                              ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]'
                              : ''
                          } ${getThemeSoftCardClass(theme)}`}
                          whileTap={{ scale: 0.98 }}
                        >
                        <div className={`relative w-16 h-16 rounded-xl overflow-hidden ${themeOption.previewClass} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          {themeOption.media.wallpaper ? (
                            <>
                              <ImageWithFallback
                                src={themeOption.media.wallpaper}
                                alt={themeOption.name}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/8 to-transparent" />
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),transparent_58%,rgba(37,99,235,0.14))]" />
                          )}
                          <div className={`relative size-6 rounded-full ${themeOption.accentClass}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-base font-medium mb-1 ${getThemeReadableTextClass(theme)}`}>{themeOption.name}</p>
                          <p className={`text-sm ${getThemeSecondaryTextClass(theme)}`}>{themeOption.description}</p>
                        </div>
                        {theme === themeOption.id && (
                        <div className="px-3 py-1 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium">
                          使用中
                        </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </TabsContent>

                {/* Bubble Tab */}
                <TabsContent value="bubble" className="m-0 min-h-0 p-4">
                  <div className="space-y-3">
                    {bubbleStyles.map((style) => (
                      <motion.button
                        key={style.id}
                        onClick={() => setBubbleStyle(style.id as BubbleStyleType)}
                          className={`w-full p-4 rounded-2xl transition-all ${
                            bubbleStyle === style.id
                              ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]'
                              : ''
                          } ${getThemeSoftCardClass(theme)}`}
                          whileTap={{ scale: 0.98 }}
                        >
                        <div className="mb-4 space-y-2">
                          <div className={`h-12 ${style.preview} ${getBubblePreviewClass(style.id)} flex items-center px-4`}>
                            <span className="text-sm">这是我发送的消息</span>
                          </div>
                          <div className={`h-12 ${style.preview} ${getBubblePreviewClass(style.id, true)} flex items-center px-4 ml-auto w-4/5`}>
                            <span className="text-sm">这是收到的回复～</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className={`text-base font-medium mb-1 ${getThemeReadableTextClass(theme)}`}>{style.name}</p>
                            <p className={`text-sm ${getThemeSecondaryTextClass(theme)}`}>{style.description}</p>
                          </div>
                          {bubbleStyle === style.id ? (
                            <div className="px-3 py-1 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium">
                              使用中
                            </div>
                          ) : (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              style.price === '免费'
                                ? isDarkLikeTheme(theme)
                                  ? 'bg-green-500/30 text-green-300'
                                  : 'bg-green-100 text-green-700'
                                : isDarkLikeTheme(theme)
                                ? 'bg-yellow-500/30 text-yellow-300'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {style.price}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
