import { MessageSquare, Users, Sparkles, Hash } from 'lucide-react';
import { Badge } from './ui/badge';
import { useTheme } from '../context/ThemeContext';
import { useUnreadMessageCount } from '../hooks/useUnreadMessageCount';
import { motion } from 'motion/react';
import { getThemeActiveIndicatorClass, getThemePageFooterClass, isLuxuryTheme } from '../lib/themeStyles';
import { t, useAppLanguage } from '../lib/i18n';

interface MobileNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  const { unreadMessageCount, unreadContactCount } = useUnreadMessageCount();
  const navItems = [
    { id: 'messages', icon: MessageSquare, label: t(language, 'navMessages'), href: '#messages' },
    { id: 'contacts', icon: Users, label: t(language, 'navContacts'), badge: 0, href: '#contacts' },
    { id: 'channels', icon: Hash, label: t(language, 'navChannels'), badge: 0, href: '#channels' },
    { id: 'moments', icon: Sparkles, label: t(language, 'navMoments'), badge: 0, href: '#moments' },
  ] as const;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-[var(--border)] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden ${getThemePageFooterClass(theme)}`}>
      <div className="h-full flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const badgeCount = item.id === 'messages'
            ? unreadMessageCount
            : item.id === 'contacts'
              ? unreadContactCount
              : (item.badge ?? 0);
          return (
            <motion.a
              key={item.id}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                onViewChange(item.id);
              }}
              className={`relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl ${
                isActive
                  ? isLuxuryTheme(theme)
                    ? 'text-amber-300'
                    : 'text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)]'
              }`}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              animate={{
                backgroundColor: isActive
                  ? (isLuxuryTheme(theme)
                    ? ['rgba(255, 232, 162, 0.08)', 'rgba(212, 175, 55, 0.14)', 'rgba(255, 232, 162, 0.08)']
                    : ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.1)'])
                  : 'rgba(0, 0, 0, 0)'
              }}
              transition={{
                backgroundColor: isActive ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {
                  duration: 0.2
                }
              }}
            >
              <motion.div
                className="relative"
                initial={false}
                animate={{
                  scale: isActive ? [1, 1.15, 1] : 1,
                  rotate: isActive ? [0, 5, -5, 0] : 0
                }}
                transition={{
                  duration: isActive ? 0.6 : 0.2,
                  ease: "easeInOut"
                }}
              >
                <item.icon className={`size-6 transition-all ${
                  isActive ? 'stroke-[2.5]' : 'stroke-[2]'
                }`} />
                {badgeCount > 0 && (
                  <Badge className={`absolute -top-2 -right-2 size-4 flex items-center justify-center p-0 text-[8px] bg-gradient-to-br from-red-500 to-pink-600 border-2 ${
                    isLuxuryTheme(theme) ? 'border-[#090806]' : 'border-[var(--card)]'
                  }`}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                )}
              </motion.div>
              <motion.span
                className={`text-[10px] font-medium ${
                  isActive ? 'font-semibold' : ''
                }`}
                initial={false}
                animate={{
                  scale: isActive ? [1, 1.05, 1] : 1
                }}
                transition={{
                  duration: isActive ? 0.3 : 0.2,
                  ease: "easeInOut"
                }}
              >
                {item.label}
              </motion.span>

              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute -bottom-1 h-1 rounded-full ${getThemeActiveIndicatorClass(theme)}`}
                  initial={false}
                  style={{ width: '60%' }}
                  animate={{
                    opacity: [0.7, 1, 0.7]
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
          );
        })}
      </div>
    </div>
  );
}
