import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Search, Pin, Volume2, Trash2, Plus, UserPlus, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { UnifiedHeader } from './UnifiedHeader';
import { useTheme } from '../context/ThemeContext';
import { isLuxuryTheme } from '../lib/themeStyles';
import {
  backendRequest,
  buildAvatarUrl,
  ConversationDetailDto,
  ConversationSummaryDto,
  FriendDto,
  getFriends,
  getHiddenConversationIds,
  getTemporaryConversationIds,
  hideConversationId,
  removeTemporaryConversationId,
} from '../lib/backend';
import { useAppLanguage } from '../lib/i18n';

interface ChatListProps {
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onConversationsChange?: (chatIds: string[]) => void;
  onOpenUserPanel: () => void;
  onOpenStatusPanel?: () => void;
  onOpenAddFriend?: () => void;
  onOpenAddGroup?: () => void;
}

interface SwipeableChatItemProps {
  chat: ConversationSummaryDto;
  selected: boolean;
  onSelect: (chatId: string) => void;
  onRequestDelete: (chat: ConversationSummaryDto) => void;
  isExpanded: boolean;
  onExpand: (conversationId: number) => void;
  onCollapse: (conversationId: number) => void;
}

function SwipeableChatItem({ chat, selected, onSelect, onRequestDelete, isExpanded, onExpand, onCollapse }: SwipeableChatItemProps) {
  const language = useAppLanguage();
  const [offsetX, setOffsetX] = useState(0);
  const startRef = useRef<{ x: number; y: number; swiping: boolean; pointerId?: number } | null>(null);
  const offsetRef = useRef(0);
  const preventClickRef = useRef(false);
  const revealThreshold = 56;
  const revealOffset = -80;
  const maxSwipeOffset = -96;

  useEffect(() => {
    if (!isExpanded) {
      offsetRef.current = 0;
      setOffsetX(0);
    }
  }, [isExpanded]);

  const updateOffset = (value: number) => {
    const next = Math.min(0, Math.max(value * 0.42, maxSwipeOffset));
    offsetRef.current = next;
    setOffsetX(next);
  };

  const truncateText = (value: string, maxLength: number) => (value.length <= maxLength ? value : `${value.slice(0, Math.max(0, maxLength - 1))}...`);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    startRef.current = { x: event.clientX, y: event.clientY, swiping: false, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (!start.swiping && Math.abs(deltaX) > 8) start.swiping = Math.abs(deltaX) > Math.abs(deltaY);
    if (!start.swiping) return;
    event.preventDefault();
    preventClickRef.current = true;
    if (deltaX < -8) onExpand(chat.id);
    updateOffset(deltaX);
  };

  const finishSwipe = () => {
    if (!startRef.current) return;
    const pointerId = startRef.current.pointerId;
    startRef.current = null;
    if (pointerId !== undefined) {
      try {
        (document.activeElement as HTMLElement | null)?.blur?.();
      } catch {}
    }
    if (Math.abs(offsetRef.current) >= revealThreshold) {
      updateOffset(revealOffset);
      onExpand(chat.id);
    } else {
      updateOffset(0);
      onCollapse(chat.id);
    }
    window.setTimeout(() => {
      preventClickRef.current = false;
    }, 0);
  };

  const handleClick = () => {
    if (preventClickRef.current) {
      preventClickRef.current = false;
      return;
    }
    if (offsetRef.current < 0) {
      updateOffset(0);
      onCollapse(chat.id);
      return;
    }
    onSelect(String(chat.id));
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className="absolute right-0 top-1/2 z-20 flex h-9 w-[76px] -translate-y-1/2 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 px-2 text-xs font-medium text-white shadow-lg shadow-red-500/20 transition-all duration-200 ease-out"
        style={{ opacity: Math.min(1, Math.abs(offsetX) / revealThreshold), transform: `translateX(${Math.max(0, (1 - Math.min(1, Math.abs(offsetX) / revealThreshold)) * 12)}px) scale(${0.98 + Math.min(1, Math.abs(offsetX) / revealThreshold) * 0.02})` }}
      >
        <button type="button" onClick={(event) => { event.stopPropagation(); onRequestDelete(chat); }} className="flex h-full w-full items-center justify-center gap-1 rounded-xl text-xs font-medium text-white" aria-label={language === 'ko-KR' ? `${chat.name} 대화 삭제` : `删除与 ${chat.name} 的会话`} title={language === 'ko-KR' ? '대화 삭제' : '删除会话'}>
          <Trash2 className="size-3.5" />
          {language === 'ko-KR' ? '삭제' : '删除'}
        </button>
      </div>
      <div
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        className={`relative z-10 p-3 rounded-2xl cursor-pointer duration-200 group touch-pan-y ${offsetX < 0 ? 'shadow-lg' : ''} ${selected ? 'bg-[var(--chat-active)]' : offsetX < 0 ? 'bg-[var(--card)]' : 'hover:bg-[var(--chat-hover)]'}`}
        style={{ transform: `translateX(${offsetX}px)`, transition: startRef.current ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 280ms ease-out' }}
      >
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0 overflow-visible">
            <Avatar className="size-12">
              <AvatarImage src={chat.avatarUrl || buildAvatarUrl(chat.avatarSeed)} alt={chat.name} />
              <AvatarFallback>{chat.name[0]}</AvatarFallback>
            </Avatar>
            {chat.unread > 0 && <Badge className="avatar-badge avatar-badge-top-right size-5 p-0 text-[10px] bg-gradient-to-br from-red-500 to-pink-600 border-2 border-[var(--card)]">{chat.unread > 99 ? '99+' : chat.unread}</Badge>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="min-w-0 max-w-full truncate text-[var(--foreground)] font-medium">{chat.name}</span>
                {chat.temporary && <span className="shrink-0 rounded-md bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">{language === 'ko-KR' ? '임시' : '临时'}</span>}
                {chat.pinned && <Pin className="size-3 shrink-0 text-[var(--primary)]" />}
              </div>
              {chat.time && <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{chat.time}</span>}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm text-[var(--muted-foreground)]">{truncateText(chat.lastMessage || (language === 'ko-KR' ? '메시지 없음' : '暂无消息'), 34)}</p>
              {chat.status === 'sent' && <Volume2 className="size-3 shrink-0 text-[var(--muted-foreground)]" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageAddMenuProps {
  onOpenAddFriend?: () => void;
  onOpenCreateGroup?: () => void;
}

function MessageAddMenu({ onOpenAddFriend, onOpenCreateGroup }: MessageAddMenuProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  const luxuryTheme = isLuxuryTheme(theme);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={language === 'ko-KR' ? '추가' : '添加'} title={language === 'ko-KR' ? '추가' : '添加'} className={`size-9 flex items-center justify-center rounded-xl transition-all ${luxuryTheme ? 'text-amber-300 hover:bg-amber-400/10' : 'text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--chat-hover)]'}`}>
          <Plus className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className={`w-44 rounded-2xl border p-1.5 shadow-2xl ${luxuryTheme ? 'border-white/10 bg-[#120e08]/95 text-[var(--foreground)] shadow-black/40 backdrop-blur-2xl' : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-slate-900/12'}`}>
        <DropdownMenuItem onSelect={onOpenAddFriend} className="h-11 cursor-pointer rounded-xl px-3 text-sm focus:bg-[var(--chat-hover)] focus:text-[var(--foreground)]">
          <UserPlus className="size-4 text-[var(--primary)]" />
          <span>{language === 'ko-KR' ? '친구 추가' : '加好友'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenCreateGroup} className="h-11 cursor-pointer rounded-xl px-3 text-sm focus:bg-[var(--chat-hover)] focus:text-[var(--foreground)]">
          <Users className="size-4 text-[var(--primary)]" />
          <span>{language === 'ko-KR' ? '그룹 채팅 만들기' : '创建群聊'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ChatList({ selectedChatId, onSelectChat, onDeleteChat, onConversationsChange, onOpenUserPanel, onOpenStatusPanel, onOpenAddFriend, onOpenAddGroup }: ChatListProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  const [conversations, setConversations] = useState<ConversationSummaryDto[]>([]);
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedConversationId, setExpandedConversationId] = useState<number | null>(null);
  const [pendingDeleteConversation, setPendingDeleteConversation] = useState<ConversationSummaryDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [friendConversations, temporaryDetails, friendList] = await Promise.all([
          backendRequest<ConversationSummaryDto[]>('/messages/conversations'),
          Promise.all(getTemporaryConversationIds().map((conversationId) => backendRequest<ConversationDetailDto>(`/messages/conversations/${conversationId}`).catch(() => null))),
          getFriends(),
        ]);
        if (cancelled) return;
        const temporaryConversations = temporaryDetails.filter((detail): detail is ConversationDetailDto => detail !== null && !detail.isFriend).map(mapTemporaryConversation);
        const friendIds = new Set(friendConversations.map((conversation) => conversation.id));
        const hiddenIds = new Set(getHiddenConversationIds());
        setConversations([
          ...friendConversations,
          ...temporaryConversations.filter((conversation) => !friendIds.has(conversation.id)),
        ].filter((conversation) => !hiddenIds.has(conversation.id)));
        setFriends(friendList);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '대화 목록을 불러오지 못했습니다' : '会话加载失败'));
      }
    };
    void load();

    const refreshOnRemarkChange = () => {
      void load();
    };
    window.addEventListener('sw-friend-remark-updated', refreshOnRemarkChange);
    return () => {
      cancelled = true;
      window.removeEventListener('sw-friend-remark-updated', refreshOnRemarkChange);
    };
  }, [language]);

  const mapTemporaryConversation = (detail: ConversationDetailDto): ConversationSummaryDto => {
    const lastMessage = detail.messages.at(-1);
    return { id: detail.id, participantUserId: detail.participantUserId, groupNumber: detail.groupNumber ?? null, groupName: detail.groupName ?? null, groupDescription: detail.groupDescription ?? null, name: detail.name, avatarSeed: detail.avatarSeed, avatarUrl: detail.avatarUrl, lastMessage: lastMessage?.content ?? (language === 'ko-KR' ? '임시 대화' : '临时会话'), time: lastMessage?.time ?? '', unread: 0, online: detail.online, pinned: false, status: 'read', nickname: detail.nickname, isFriend: false, temporary: true, requestStatus: detail.requestStatus, requestStatusLabel: detail.requestStatusLabel, requestDirection: detail.requestDirection, requestId: detail.requestId };
  };

  const filteredConversations = useMemo(() => conversations.filter((chat) => [chat.name, chat.lastMessage, chat.nickname].join(' ').toLowerCase().includes(searchTerm.toLowerCase())), [conversations, searchTerm]);

  useEffect(() => {
    onConversationsChange?.(conversations.map((chat) => String(chat.id)));
  }, [conversations, onConversationsChange]);

  const handleDeleteConversation = (conversation: ConversationSummaryDto) => {
    setPendingDeleteConversation(conversation);
  };

  const confirmDeleteConversation = () => {
    if (!pendingDeleteConversation) {
      return;
    }
    const conversationId = pendingDeleteConversation.id;
    hideConversationId(conversationId);
    removeTemporaryConversationId(conversationId);
    setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));
    setExpandedConversationId((current) => (current === conversationId ? null : current));
    setPendingDeleteConversation(null);
    onDeleteChat?.(String(conversationId));
  };

  return (
    <div className={`w-full md:w-[23rem] lg:w-[25rem] h-full flex flex-col overflow-hidden border-r border-[var(--chat-panel-border)] ${isLuxuryTheme(theme) ? 'bg-white/5 backdrop-blur-xl' : 'bg-[var(--card)]'}`}>
      <UnifiedHeader
        title={language === 'ko-KR' ? '메시지' : '消息'}
        onOpenUserPanel={onOpenUserPanel}
        onOpenStatusPanel={onOpenStatusPanel}
        actionButton={<MessageAddMenu onOpenAddFriend={onOpenAddFriend} onOpenCreateGroup={onOpenAddGroup} />}
      />

      <div className={`px-4 py-3 ${isLuxuryTheme(theme) ? 'bg-white/5' : 'bg-[var(--background)]'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
          <Input placeholder={language === 'ko-KR' ? '검색' : '搜索'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-10 h-9 rounded-xl transition-all ${isLuxuryTheme(theme) ? 'bg-white/5 border-white/10 text-white placeholder:text-amber-100/45 focus:border-amber-400/45 focus:bg-white/10' : 'bg-[var(--input-background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]'}`} />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 pb-4 md:pb-2">
          {error && <div className="px-3 py-2 text-sm text-red-500">{error}</div>}
          {!error && filteredConversations.length === 0 && (
            <div className="px-4 py-10 text-center text-sm leading-6 text-[var(--muted-foreground)]">
              {searchTerm.trim() ? (language === 'ko-KR' ? '일치하는 대화가 없습니다. 다른 키워드를 시도해 보세요.' : '没有匹配到会话，试试换个关键词。') : (language === 'ko-KR' ? '아직 대화가 없습니다. 연락처에서 채팅을 시작해 보세요.' : '还没有会话，去联系人页发起聊天吧。')}
            </div>
          )}
          {filteredConversations.map((chat) => (
              <SwipeableChatItem
              key={chat.id}
              chat={chat}
              selected={selectedChatId === String(chat.id)}
              onSelect={onSelectChat}
              onRequestDelete={handleDeleteConversation}
              isExpanded={expandedConversationId === chat.id}
              onExpand={setExpandedConversationId}
              onCollapse={(conversationId) => setExpandedConversationId((current) => (current === conversationId ? null : current))}
            />
          ))}
        </div>
      </ScrollArea>

      <Dialog open={pendingDeleteConversation !== null} onOpenChange={(open) => { if (!open) setPendingDeleteConversation(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ko-KR' ? '대화 삭제' : '删除会话'}</DialogTitle>
            <DialogDescription>
              {language === 'ko-KR' ? `「${pendingDeleteConversation?.name ?? '이 대화'}」를 삭제할까요? 삭제 후 목록에서 숨겨집니다.` : `确认删除「${pendingDeleteConversation?.name ?? '该会话'}」吗？删除后会从列表中隐藏。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPendingDeleteConversation(null)}>
              {language === 'ko-KR' ? '취소' : '取消'}
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteConversation}>
              {language === 'ko-KR' ? '삭제' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
