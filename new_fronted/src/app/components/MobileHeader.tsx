import { Settings, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useTheme } from '../context/ThemeContext';
import { UserProfilePanel } from './UserProfilePanel';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { type PresenceStatusId } from '../lib/presence';
import { getThemePageHeaderClass } from '../lib/themeStyles';

interface MobileHeaderProps {
  title: string;
  currentStatusId: PresenceStatusId;
  onOpenUserPanel: () => void;
}

export function MobileHeader({ title, currentStatusId, onOpenUserPanel }: MobileHeaderProps) {
  const { theme } = useTheme();
  const { currentUser } = useCurrentUser();
  const user = currentUser ?? { name: '加载中', avatar: '' };

  return (
    <>
      <div className={`md:hidden h-14 px-4 flex items-center justify-between border-b border-[var(--border)] ${getThemePageHeaderClass(theme)}`}>
        <div className="flex items-center gap-3">
          <div
            className="cursor-pointer"
            onClick={onOpenUserPanel}
          >
            <Avatar className="size-9 ring-2 ring-[var(--primary)]/30">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
          </div>
          <h1 className="text-[var(--foreground)] font-medium">{title}</h1>
        </div>

      <div className="flex items-center gap-2">
        <button className="size-9 flex items-center justify-center rounded-xl text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--chat-hover)] transition-all">
          <Plus className="size-5" />
        </button>
        <button className="size-9 flex items-center justify-center rounded-xl text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--chat-hover)] transition-all">
          <Settings className="size-5" />
        </button>
      </div>
    </div>

    {/* User Profile Panel */}
    <UserProfilePanel isOpen={false} onClose={() => {}} currentStatusId={currentStatusId} />
    </>
  );
}
