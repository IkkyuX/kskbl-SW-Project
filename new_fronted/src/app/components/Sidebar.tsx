import { MessageSquare, Users, Sparkles, Hash, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useUnreadMessageCount } from '../hooks/useUnreadMessageCount';
import { getPresenceMeta, type PresenceStatusId } from '../lib/presence';
import { isLuxuryTheme } from '../lib/themeStyles';
import { t, useAppLanguage } from '../lib/i18n';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onOpenUserPanel: () => void;
  onOpenProfileDetail: () => void;
  currentStatusId: PresenceStatusId;
}

export function Sidebar({ activeView, onViewChange, onOpenUserPanel, onOpenProfileDetail, currentStatusId }: SidebarProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  const { currentUser } = useCurrentUser();
  const { unreadMessageCount, unreadContactCount } = useUnreadMessageCount();
  const user = currentUser ?? { name: language === 'ko-KR' ? '불러오는 중' : '加载中', avatar: '', vip: false };
  const presenceMeta = getPresenceMeta(currentStatusId);
  const navItems = [
    { id: 'messages', icon: MessageSquare, label: t(language, 'navMessages'), href: '#messages' },
    { id: 'contacts', icon: Users, label: t(language, 'navContacts'), badge: 0, href: '#contacts' },
    { id: 'channels', icon: Hash, label: t(language, 'navChannels'), badge: 0, href: '#channels' },
    { id: 'moments', icon: Sparkles, label: t(language, 'navMoments'), badge: 0, href: '#moments' },
  ] as const;

  return (
    <div className={`relative w-20 h-full flex flex-col items-center justify-start pt-2 pb-4 gap-4 border-r border-[var(--sidebar-border)] overflow-hidden ${
      isLuxuryTheme(theme)
        ? 'bg-[linear-gradient(180deg,rgba(255,232,162,0.08)_0%,rgba(255,255,255,0.02)_56%,rgba(0,0,0,0.22)_100%)] backdrop-blur-xl'
        : 'bg-[var(--sidebar)] shadow-[2px_0_18px_rgba(37,99,235,0.06)]'
    }`}>
      {!isLuxuryTheme(theme) && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,255,1)_100%)]" />
          <div className="pointer-events-none absolute -top-10 -right-10 size-24 rounded-full bg-blue-400/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-8 -left-8 size-20 rounded-full bg-indigo-400/10 blur-2xl" />
        </>
      )}
      {/* User Avatar */}
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              className="relative z-10 flex min-h-[150px] w-full cursor-pointer flex-col items-center justify-start gap-3 bg-transparent border-0 px-0 pt-1"
              onClick={onOpenProfileDetail}
              type="button"
            >
              <div className="relative overflow-visible">
                <Avatar className="size-12 ring-2 ring-[var(--primary)]/30 ring-offset-2 ring-offset-transparent transition-all group-hover:ring-[var(--primary)]">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                {user.vip && (
                  <div className="avatar-badge avatar-badge-top-right size-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-[10px] font-bold text-white">
                    V
                  </div>
                )}
                <div
                  className={`avatar-badge avatar-badge-bottom-right size-3.5 rounded-full border-2 border-[var(--sidebar)] ${presenceMeta.dotClass}`}
                  title={`当前状态：${presenceMeta.label}`}
                  aria-label={`当前状态：${presenceMeta.label}`}
                />
              </div>
              <div className="flex min-h-[70px] flex-col items-center justify-start gap-1 px-1 text-center">
                <div className="text-[15px] font-semibold leading-none text-[var(--foreground)] opacity-0">.</div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{user.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Separator */}
      <div className="relative z-10 w-10 h-px bg-[var(--border)]" />

      {/* Navigation Icons */}
      <div className="relative z-10 flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const badgeCount = item.id === 'messages'
            ? unreadMessageCount
            : item.id === 'contacts'
              ? unreadContactCount
              : (item.badge ?? 0);
          return (
            <div key={item.id} className="flex w-full flex-col items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.a
                      href={item.href}
                      onClick={(event) => {
                        event.preventDefault();
                        onViewChange(item.id);
                      }}
                      className={`relative size-12 flex items-center justify-center rounded-2xl transition-all duration-300 group ${
                        isActive
                          ? isLuxuryTheme(theme)
                            ? 'bg-[linear-gradient(135deg,rgba(255,232,162,0.22),rgba(212,175,55,0.15),rgba(15,11,7,0.25))] shadow-lg shadow-amber-500/15'
                            : 'bg-[var(--chat-active)] shadow-lg'
                          : 'hover:bg-[var(--chat-hover)]'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        animate={isActive ? {
                          rotate: [0, -8, 8, 0]
                        } : {}}
                        transition={{
                          duration: 0.6,
                          ease: "easeInOut"
                        }}
                        className={`${
                          isActive
                            ? isLuxuryTheme(theme)
                              ? 'text-amber-300'
                              : 'text-[var(--primary)]'
                            : 'text-[var(--muted-foreground)] group-hover:text-[var(--primary)]'
                        } transition-colors`}
                      >
                        <item.icon className={`size-6 ${
                          isActive ? 'stroke-[2.5]' : 'stroke-[2]'
                        }`} />
                      </motion.div>
                      <ChevronRight className={`absolute right-1.5 size-3.5 transition-colors ${
                        isActive
                          ? isLuxuryTheme(theme)
                            ? 'text-amber-200/90'
                            : 'text-[var(--primary)]'
                          : 'text-[var(--muted-foreground)]/60 group-hover:text-[var(--primary)]'
                      }`} />
                      {badgeCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-[10px] bg-gradient-to-br from-red-500 to-pink-600 border-2 border-[var(--sidebar)]">
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </Badge>
                      )}

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActiveTab"
                          className={`absolute left-0 w-1 h-8 rounded-r-full ${
                            isLuxuryTheme(theme)
                              ? 'bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-700'
                              : 'bg-[var(--primary)]'
                          }`}
                          initial={false}
                          animate={{
                            opacity: [0.8, 1, 0.8]
                          }}
                          transition={{
                            layout: {
                              type: "spring",
                              stiffness: 500,
                              damping: 30
                            },
                            opacity: {
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }
                          }}
                        />
                      )}
                    </motion.a>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {item.id !== navItems[navItems.length - 1].id && (
                <div
                  className="my-1 h-px w-10"
                  style={{
                    backgroundImage: isLuxuryTheme(theme)
                      ? 'linear-gradient(90deg, transparent 0%, rgba(255, 232, 162, 0.22) 50%, transparent 100%)'
                      : 'linear-gradient(90deg, transparent 0%, rgba(214, 227, 247, 0.95) 50%, transparent 100%)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
