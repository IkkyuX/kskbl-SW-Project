import { Settings, Palette, LogOut, Crown, Gift, SunMedium, Moon, Star, ChevronRight, Sparkles, Circle, Clock3, Ban, EyeOff, MessageCircleMore, Battery, Music, Palmtree, Briefcase, Coffee, Dumbbell, CloudRain, Heart, Smile } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { isLuxuryTheme } from '../lib/themeStyles';
import { getPresenceMeta, type PresenceStatusId } from '../lib/presence';
import { t, useAppLanguage } from '../lib/i18n';

interface UserProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfileDetail?: () => void;
  onOpenPersonalization?: () => void;
  onOpenSettings?: () => void;
  onOpenLevelCenter?: () => void;
  onLogout?: () => void;
  currentStatusId: PresenceStatusId;
}

export function UserProfilePanel({ isOpen, onClose, onOpenProfileDetail, onOpenPersonalization, onOpenSettings, onOpenLevelCenter, onLogout, currentStatusId }: UserProfilePanelProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  const luxuryTheme = isLuxuryTheme(theme);
  const { currentUser } = useCurrentUser();
  const user = currentUser ?? { name: t(language, 'commonLoading'), avatar: '', vip: false, customStatus: '', level: 1, uNumber: 0 };
  const presenceMeta = getPresenceMeta(currentStatusId);
  const level = Math.max(0, user.level ?? 0);
  const profileSignature = user.bio?.trim() || user.customStatus?.trim() || t(language, 'userSignatureEmpty');
  const presenceIndicator = (() => {
    switch (currentStatusId) {
      case 'away':
        return { icon: Clock3, iconClass: 'text-orange-400' };
      case 'busy':
      case 'dnd':
        return { icon: Ban, iconClass: 'text-rose-500' };
      case 'invisible':
        return { icon: EyeOff, iconClass: 'text-slate-400' };
      case 'qme':
        return { icon: MessageCircleMore, iconClass: 'text-sky-400' };
      case 'battery':
        return { icon: Battery, iconClass: 'text-emerald-400' };
      case 'music':
        return { icon: Music, iconClass: 'text-violet-400' };
      case 'out':
        return { icon: Palmtree, iconClass: 'text-cyan-400' };
      case 'travel':
        return { icon: Briefcase, iconClass: 'text-indigo-400' };
      case 'tired':
        return { icon: Coffee, iconClass: 'text-amber-400' };
      case 'sport':
        return { icon: Dumbbell, iconClass: 'text-orange-500' };
      case 'weather':
        return { icon: CloudRain, iconClass: 'text-sky-400' };
      case 'crush':
        return { icon: Heart, iconClass: 'text-pink-400' };
      case 'love':
        return { icon: Smile, iconClass: 'text-rose-400' };
      case 'custom':
        return { icon: Sparkles, iconClass: 'text-fuchsia-400' };
      case 'online':
      default:
        return { icon: Circle, iconClass: 'text-emerald-400' };
    }
  })();

  const levelIcons: Array<{ key: string; icon: typeof Crown; className: string; title: string }> = [];
  const addLevelIcons = (count: number, keyPrefix: string, icon: typeof Crown, className: string, title: string) => {
    for (let i = 0; i < count; i += 1) {
      levelIcons.push({ key: `${keyPrefix}-${i}`, icon, className, title });
    }
  };

  let remainingLevel = level;
  const crownCount = Math.floor(remainingLevel / 50);
  remainingLevel %= 50;
  const sunCount = Math.floor(remainingLevel / 30);
  remainingLevel %= 30;
  const moonCount = Math.floor(remainingLevel / 10);
  remainingLevel %= 10;
  const starCount = remainingLevel;

  addLevelIcons(crownCount, 'crown', Crown, 'text-[#d4a017]', '50级');
  addLevelIcons(sunCount, 'sun', SunMedium, 'text-[#e5a800]', '30级');
  addLevelIcons(moonCount, 'moon', Moon, 'text-[#7c9cff]', '10级');
  addLevelIcons(starCount, 'star', Star, 'text-[#f0c24b]', '1级');

  const menuItems = [
    { icon: Palette, label: t(language, 'userMenuPersonalization'), description: t(language, 'userMenuPersonalizationDesc'), onClick: onOpenPersonalization },
    { icon: Settings, label: t(language, 'userMenuSettings'), description: t(language, 'userMenuSettingsDesc'), onClick: onOpenSettings },
    { icon: Crown, label: t(language, 'userMenuLevelCenter'), description: `${language === 'ko-KR' ? '현재' : '当前'} ${user.level ?? 1} ${language === 'ko-KR' ? '레벨' : '级'} · ${user.experience ?? 0} EXP`, onClick: onOpenLevelCenter },
    { icon: Gift, label: t(language, 'userMenuWallet'), description: t(language, 'userMenuWalletDesc') },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed left-0 top-0 bottom-0 w-80 z-50 shadow-2xl ${
              luxuryTheme
                ? 'bg-[#090806] backdrop-blur-xl border-r border-white/10'
                : 'bg-white border-r border-[var(--border)]'
            }`}
          >
            {!luxuryTheme && (
              <>
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,251,255,1)_100%)]" />
                <div className="pointer-events-none absolute -top-12 right-0 size-36 rounded-full bg-blue-300/12 blur-3xl" />
                <div className="pointer-events-none absolute bottom-12 -left-10 size-28 rounded-full bg-indigo-300/10 blur-3xl" />
              </>
            )}
            <div className="relative overflow-hidden px-3 pt-3">
              <div className={`absolute inset-0 ${
                luxuryTheme
                  ? 'bg-[linear-gradient(135deg,rgba(255,232,162,0.16),rgba(212,175,55,0.1),rgba(15,11,7,0.2))]'
                  : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
              }`} />
              <div className={`absolute -top-10 -right-10 size-32 rounded-full ${luxuryTheme ? 'bg-amber-300/10' : 'bg-blue-400/10'} blur-2xl`} />
              <div className={`absolute -bottom-10 -left-10 size-32 rounded-full ${luxuryTheme ? 'bg-amber-400/8' : 'bg-indigo-400/10'} blur-2xl`} />

              <div className={`relative w-full rounded-[26px] border overflow-hidden text-left shadow-[0_12px_28px_rgba(0,0,0,0.08)] min-h-[186px] ${
                luxuryTheme
                  ? 'border-white/10 bg-[#120e08]/85 backdrop-blur-xl'
                  : 'border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,249,255,0.98)_100%)]'
              }`}>
                <div className={`absolute inset-0 ${
                  luxuryTheme
                    ? 'bg-[linear-gradient(135deg,rgba(255,232,162,0.1),rgba(212,175,55,0.06),rgba(15,11,7,0.12))]'
                    : 'bg-gradient-to-br from-white/90 via-blue-50/90 to-indigo-50/90'
                }`} />

                <div className="relative flex min-h-[186px] flex-col justify-center px-4 py-5">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0 overflow-visible pb-1 pr-1 pt-0.5">
                      <div className={`absolute inset-0 rounded-full blur-xl ${luxuryTheme ? 'bg-[linear-gradient(135deg,rgba(255,232,162,0.32),rgba(212,175,55,0.22))]' : 'bg-gradient-to-br from-blue-400/35 to-indigo-500/35'}`} />
                      <Avatar className="relative size-[68px] ring-4 ring-white/25 shadow-xl">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -left-2 -bottom-2 z-10 flex size-7 items-center justify-center rounded-full border shadow-lg backdrop-blur-sm ${
                          luxuryTheme
                            ? 'border-white/18 bg-white/8'
                            : 'border-white/90 bg-white/95'
                        }`}
                        title={`当前状态：${presenceMeta.label}`}
                        aria-label={`当前状态：${presenceMeta.label}`}
                      >
                        <presenceIndicator.icon className={`size-4 ${presenceIndicator.iconClass}`} strokeWidth={2.1} />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className={`min-w-0 truncate text-[1.5rem] leading-tight font-semibold ${luxuryTheme ? 'text-white' : 'text-gray-900'}`}>
                  {user.name}
                </h2>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <span>账号 {user.uNumber || '-'}</span>
              </div>

              <p className={`mt-2 text-sm leading-6 ${
                        luxuryTheme
                          ? 'text-amber-100/85'
                          : isLuxuryTheme(theme)
                          ? 'text-gray-300'
                          : 'text-gray-600'
                      }`}>
                        {profileSignature}
                      </p>

                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onOpenLevelCenter}
                      className={`flex flex-1 items-center justify-between rounded-2xl px-3 py-2 text-left transition-colors ${
                      luxuryTheme
                        ? 'bg-[linear-gradient(135deg,rgba(255,232,162,0.12),rgba(212,175,55,0.06),rgba(15,11,7,0.18))] hover:bg-[linear-gradient(135deg,rgba(255,232,162,0.18),rgba(212,175,55,0.1),rgba(15,11,7,0.2))]'
                        : 'bg-black/5 hover:bg-black/8'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-[11px] font-medium uppercase tracking-[0.18em] ${luxuryTheme ? 'text-amber-100/75' : 'text-[var(--muted-foreground)]'}`}>
                          Level
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className={`text-sm font-semibold ${luxuryTheme ? 'text-white' : 'text-[var(--foreground)]'}`}>Lv.{level}</span>
                          {levelIcons.map((item) => {
                            const Icon = item.icon;
                            return (
                              <span
                                key={item.key}
                                title={item.title}
                                className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full ${luxuryTheme ? 'bg-white/8' : 'bg-[var(--muted)]'} ${item.className}`}
                              >
                                <Icon className="size-3.5" strokeWidth={2.2} />
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <ChevronRight className={`size-4 shrink-0 ${luxuryTheme ? 'text-amber-200/70' : 'text-[var(--muted-foreground)]/70'}`} />
                    </button>
                    {onOpenProfileDetail && (
                      <button
                        type="button"
                        onClick={onOpenProfileDetail}
                        className={`shrink-0 rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${
                          luxuryTheme
                            ? 'bg-white/8 text-amber-100 hover:bg-white/12'
                            : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]'
                        }`}
                      >
                        资料
                      </button>
                    )}
                  </div>
                </div>
              </div>

                <div
                  className="mx-3 mt-3 h-px"
                  style={{
                    backgroundImage: luxuryTheme
                      ? 'linear-gradient(90deg, transparent 0%, rgba(255, 232, 162, 0.18) 50%, transparent 100%)'
                      : 'linear-gradient(90deg, transparent 0%, rgba(214, 227, 247, 0.95) 50%, transparent 100%)',
                  }}
                />

            </div>

            <div className="relative z-10 mt-3 flex h-[calc(100vh-252px)] flex-col justify-center px-3 py-2">
              <div className="space-y-1.5">
                {menuItems.map((item, index) => (
                  <div key={index} className="flex w-full flex-col">
                    <button
                      type="button"
                      onClick={item.onClick}
                      disabled={!item.onClick}
                      aria-disabled={!item.onClick}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${luxuryTheme ? 'hover:bg-white/5' : 'hover:bg-[var(--chat-hover)]'}`}
                    >
                      <div className={`size-10 rounded-xl flex items-center justify-center ${luxuryTheme ? 'bg-[linear-gradient(135deg,rgba(255,232,162,0.12),rgba(212,175,55,0.08),rgba(15,11,7,0.16))] group-hover:bg-[linear-gradient(135deg,rgba(255,232,162,0.2),rgba(212,175,55,0.12),rgba(15,11,7,0.18))]' : 'bg-[var(--muted)] group-hover:bg-[var(--accent)]'} transition-colors`}>
                        <item.icon className="size-5 text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{item.description}</p>
                      </div>
                      <ChevronRight className={`size-4 shrink-0 transition-colors ${
                        luxuryTheme ? 'text-amber-200/70 group-hover:text-amber-200' : 'text-[var(--muted-foreground)]/70 group-hover:text-[var(--primary)]'
                      }`} />
                    </button>

                    {index < menuItems.length - 1 && (
                      <div
                        className="mx-4 my-1 h-px"
                        style={{
                          backgroundImage: luxuryTheme
                            ? 'linear-gradient(90deg, transparent 0%, rgba(255, 232, 162, 0.18) 50%, transparent 100%)'
                            : isLuxuryTheme(theme)
                            ? 'linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.55) 50%, transparent 100%)'
                            : 'linear-gradient(90deg, transparent 0%, rgba(214, 227, 247, 0.95) 50%, transparent 100%)',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={onLogout}
                className={`mt-6 w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${luxuryTheme ? 'hover:bg-red-500/10' : 'hover:bg-red-50 dark:hover:bg-red-950'}`}
              >
                <div className={`size-10 rounded-xl flex items-center justify-center ${luxuryTheme ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-red-50 dark:bg-red-950 group-hover:bg-red-100 dark:group-hover:bg-red-900'} transition-colors`}>
                  <LogOut className="size-5 text-red-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-red-500">退出登录</p>
                  <p className="text-xs text-red-500/70">安全退出当前账号</p>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
