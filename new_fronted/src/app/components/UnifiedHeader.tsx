import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useRef } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { isLuxuryTheme } from '../lib/themeStyles';

interface UnifiedHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  onOpenUserPanel: () => void;
  onOpenStatusPanel?: () => void;
}

export function UnifiedHeader({
  title,
  subtitle,
  actionButton,
  onOpenUserPanel,
  onOpenStatusPanel
}: UnifiedHeaderProps) {
  const { theme } = useTheme();
  const { currentUser } = useCurrentUser();
  const user = currentUser ?? { name: '加载中', avatar: '' };
  const longPressTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const didLongPressRef = useRef(false);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLongPress = () => {
    didLongPressRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      didLongPressRef.current = true;
      if (onOpenStatusPanel) {
        onOpenStatusPanel();
      }
    }, 500);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    startLongPress();
  };

  const handlePointerUp = () => {
    clearLongPressTimer();
  };

  const handlePointerCancel = () => {
    clearLongPressTimer();
  };

  const handleClick = () => {
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      return;
    }
    onOpenUserPanel();
  };

  useEffect(() => () => clearLongPressTimer(), []);

  return (
    <>
      {/* Main Header Bar */}
      <div className={`min-h-[80px] px-4 py-3 flex items-center justify-between border-b border-[var(--border)] ${
        isLuxuryTheme(theme)
          ? 'bg-[linear-gradient(90deg,rgba(255,232,162,0.1),rgba(15,11,7,0.9))] backdrop-blur-xl'
          : 'bg-[var(--card)]'
      }`}>
        <div className="flex items-center gap-3">
          {/* Avatar with long press support - Hidden on desktop (md+) */}
            <div
              className="md:hidden cursor-pointer transition-transform hover:scale-105 select-none"
              onClick={handleClick}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onPointerLeave={handlePointerCancel}
            >
              <Avatar className={`size-11 ring-2 transition-all ${
                isLuxuryTheme(theme)
                  ? 'ring-amber-300/30 hover:ring-amber-300/50'
                  : 'ring-[var(--primary)]/30 hover:ring-[var(--primary)]/50'
              }`}>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--foreground)]">{title}</h1>
              {subtitle && (
                <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>
              )}
            </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
            {actionButton || (
              <button type="button" className={`size-9 flex items-center justify-center rounded-xl transition-all ${
                isLuxuryTheme(theme)
                  ? 'text-amber-300 hover:bg-amber-400/10'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--chat-hover)]'
              }`}>
                <Plus className="size-5" />
              </button>
            )}
        </div>
      </div>
    </>
  );
}
