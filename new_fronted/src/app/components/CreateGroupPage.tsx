import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useTheme } from '../context/ThemeContext';
import { getThemePageFooterClass, getThemePageHeaderClass, getThemePageShellClass } from '../lib/themeStyles';
import { buildAvatarUrl, createGroupConversation, FriendDto, getFriends } from '../lib/backend';

interface CreateGroupPageProps {
  onBack: () => void;
  onCreated: (chatId: string) => void;
}

export function CreateGroupPage({ onBack, onCreated }: CreateGroupPageProps) {
  const { theme } = useTheme();
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getFriends().then((list) => {
      if (!cancelled) setFriends(list);
    }).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : '好友加载失败');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFriends = useMemo(
    () => friends.filter((friend) => [friend.nickname, String(friend.unumber), friend.school, friend.major, friend.bio].join(' ').toLowerCase().includes(searchTerm.toLowerCase())),
    [friends, searchTerm],
  );

  const toggleMember = (userId: number) => {
    setSelectedMemberIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };

  const handleCreate = async () => {
    const memberUserIds = Array.from(new Set(selectedMemberIds)).filter((id) => Number.isFinite(id));
    if (memberUserIds.length === 0) {
      setError('请选择至少一位好友');
      return;
    }
    setCreating(true);
    try {
      const detail = await createGroupConversation(memberUserIds);
      onCreated(String(detail.id));
      setError(null);
      setSelectedMemberIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建群聊失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={`min-h-0 flex-1 flex flex-col h-full overflow-hidden ${getThemePageShellClass(theme)}`}>
      <div className={`shrink-0 min-h-[80px] px-4 py-3 flex items-center justify-between border-b border-[var(--border)] ${getThemePageHeaderClass(theme)}`}>
        <button onClick={onBack} className="flex items-center gap-2 text-[var(--foreground)]">
          <ArrowLeft className="size-6" />
          <span className="text-sm">返回</span>
        </button>
        <div className="text-center">
          <h3 className="font-medium text-lg text-[var(--foreground)]">创建群聊</h3>
          <p className="text-xs text-[var(--muted-foreground)]">先选好友，群资料之后在群聊设置里补充</p>
        </div>
        <div className="w-[72px]" />
      </div>
      <ScrollArea className="min-h-0 flex-1 px-4 py-4">
        <div className="space-y-3">
          {error && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</div>}
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索好友昵称 / uNumber" />
          <div className="text-sm font-medium text-[var(--foreground)]">选择好友</div>
          <div className="grid gap-2">
            {filteredFriends.map((friend) => (
              <button key={friend.userId} type="button" onClick={() => toggleMember(friend.userId)} className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left ${selectedMemberIds.includes(friend.userId) ? 'border-[var(--primary)] bg-[var(--chat-hover)]' : 'border-[var(--border)] bg-[var(--background)]'}`}>
                <Avatar className="size-10">
                  <AvatarImage src={friend.avatarUrl || buildAvatarUrl(friend.nickname)} alt={friend.nickname} />
                  <AvatarFallback>{friend.nickname[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-[var(--foreground)]">{friend.nickname}</div>
                  <div className="truncate text-xs text-[var(--muted-foreground)]">uNumber {friend.unumber}</div>
                </div>
              </button>
            ))}
            {filteredFriends.length === 0 && <div className="py-6 text-center text-sm text-[var(--muted-foreground)]">没有找到好友</div>}
          </div>
        </div>
      </ScrollArea>
      <div className={`shrink-0 border-t border-[var(--border)] px-4 py-3 ${getThemePageFooterClass(theme)}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-[var(--muted-foreground)]">已选 {selectedMemberIds.length} 位好友</div>
          <Button onClick={() => void handleCreate()} disabled={creating}>创建群聊</Button>
        </div>
      </div>
    </div>
  );
}
