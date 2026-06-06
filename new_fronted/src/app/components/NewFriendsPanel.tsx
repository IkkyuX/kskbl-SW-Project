import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, RefreshCw, Search, UserPlus, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useTheme } from '../context/ThemeContext';
import { isLuxuryTheme } from '../lib/themeStyles';
import { notifyUnreadIndicatorsChanged } from '../hooks/useUnreadMessageCount';
import {
  acceptFriendRequest,
  addFriendByUNumber,
  buildAvatarUrl,
  lookupUserByUNumber,
  openGroupConversation,
  FriendRequestDto,
  getFriendRequests,
} from '../lib/backend';
import { useAppLanguage } from '../lib/i18n';

interface NewFriendsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function NewFriendsPanel({ isOpen, onClose, onUpdated }: NewFriendsPanelProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  const luxuryTheme = isLuxuryTheme(theme);
  const [friendRequests, setFriendRequests] = useState<FriendRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uNumberInput, setUNumberInput] = useState('');
  const [groupNumberInput, setGroupNumberInput] = useState('');
  const [addingByUNumber, setAddingByUNumber] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [lookupResult, setLookupResult] = useState<{ nickname: string; uNumber: number; avatarUrl: string | null } | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const requests = await getFriendRequests();
      setFriendRequests(requests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '친구 신청을 불러오지 못했습니다' : '好友申请加载失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void loadRequests();
    }
  }, [isOpen]);

  const handleAccept = async (requestId: number) => {
    setActioningId(requestId);
    try {
      await acceptFriendRequest(requestId);
      await loadRequests();
      notifyUnreadIndicatorsChanged();
      onUpdated?.();
    } finally {
      setActioningId(null);
    }
  };

  const handleLookup = async () => {
    const uNumber = Number(uNumberInput.trim());
    if (!Number.isFinite(uNumber) || uNumber <= 0) {
      setError(language === 'ko-KR' ? '올바른 계정을 입력해 주세요' : '请输入有效的账号');
      setLookupResult(null);
      return;
    }
    try {
      const result = await lookupUserByUNumber(uNumber);
      setLookupResult(result);
      setError(null);
    } catch (err) {
      setLookupResult(null);
      setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '사용자를 찾지 못했습니다' : '用户查找失败'));
    }
  };

  const handleAddByUNumber = async () => {
    const uNumber = Number(uNumberInput.trim());
    if (!Number.isFinite(uNumber) || uNumber <= 0) {
      setError(language === 'ko-KR' ? '올바른 계정을 입력해 주세요' : '请输入有效的账号');
      return;
    }
    setAddingByUNumber(true);
    try {
      await addFriendByUNumber(uNumber);
      await loadRequests();
      notifyUnreadIndicatorsChanged();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '친구 추가에 실패했습니다' : '添加好友失败'));
    } finally {
      setAddingByUNumber(false);
    }
  };

  const handleJoinGroup = async () => {
    const groupNumber = Number(groupNumberInput.trim());
    if (!Number.isFinite(groupNumber) || groupNumber <= 0) {
      setError(language === 'ko-KR' ? '올바른 그룹 번호를 입력해 주세요' : '请输入有效的群号');
      return;
    }
    setJoiningGroup(true);
    try {
      await openGroupConversation(groupNumber);
      notifyUnreadIndicatorsChanged();
      setError(null);
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '그룹 참가에 실패했습니다' : '加群失败'));
    } finally {
      setJoiningGroup(false);
    }
  };

  const pendingCount = friendRequests.filter((request) => request.status === 'PENDING').length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 z-40 ${luxuryTheme ? 'bg-slate-950/35 backdrop-blur-sm' : 'bg-black/12 backdrop-blur-[2px]'}`}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className={`fixed right-0 top-0 bottom-0 z-50 flex w-full flex-col overflow-hidden shadow-2xl md:w-[440px] ${
              luxuryTheme
                ? 'border-l border-white/10 bg-slate-950/78 backdrop-blur-2xl'
                : 'border-l border-[var(--border)] bg-[var(--card)] backdrop-blur-2xl'
            }`}
          >
            <div className={`flex h-[72px] items-center justify-between border-b px-4 ${luxuryTheme ? 'border-white/10 bg-white/5' : 'border-[var(--border)] bg-[var(--background)]'}`}>
              <button type="button" onClick={onClose} className="text-[var(--foreground)] transition-transform active:scale-95">
                <ArrowLeft className="size-6" />
              </button>
              <div className="text-center">
                <h1 className="text-lg font-semibold text-[var(--foreground)]">{language === 'ko-KR' ? '친구 추가 / 그룹 참가' : '加好友 / 加群'}</h1>
                <p className="text-xs text-[var(--muted-foreground)]">{language === 'ko-KR' ? `${pendingCount}건 대기 중` : `${pendingCount} 条待处理`}</p>
              </div>
              <button type="button" onClick={() => void loadRequests()} className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] active:scale-95">
                <RefreshCw className={`size-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3 p-4">
                <div className={`rounded-2xl border p-3 ${luxuryTheme ? 'border-white/10 bg-white/5' : 'border-[var(--border)] bg-[var(--card)]'}`}>
                  <div className="mb-2 text-sm font-medium text-[var(--foreground)]">{language === 'ko-KR' ? '계정으로 친구 추가' : '通过账号加好友'}</div>
                  <div className="flex items-center gap-2">
                    <Input value={uNumberInput} onChange={(event) => setUNumberInput(event.target.value)} placeholder={language === 'ko-KR' ? '계정 입력' : '输入账号'} className="h-10 flex-1 rounded-xl" />
                    <Button variant="secondary" size="icon" className="size-10" onClick={() => void handleLookup()}>
                      <Search className="size-4" />
                    </Button>
                  </div>
                  {lookupResult && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-black/5 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={lookupResult.avatarUrl || buildAvatarUrl(lookupResult.nickname)} alt={lookupResult.nickname} />
                          <AvatarFallback>{lookupResult.nickname[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-[var(--foreground)]">{lookupResult.nickname}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{language === 'ko-KR' ? `계정 ${lookupResult.uNumber}` : `账号 ${lookupResult.uNumber}`}</p>
                        </div>
                      </div>
                      <Button size="sm" className="h-8 px-3" onClick={() => void handleAddByUNumber()} disabled={addingByUNumber}>
                        {language === 'ko-KR' ? '추가' : '添加'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className={`rounded-2xl border p-3 ${luxuryTheme ? 'border-white/10 bg-white/5' : 'border-[var(--border)] bg-[var(--card)]'}`}>
                  <div className="mb-2 text-sm font-medium text-[var(--foreground)]">{language === 'ko-KR' ? '그룹 번호로 그룹 채팅 참가' : '通过群号加入群聊'}</div>
                  <div className="flex items-center gap-2">
                    <Input value={groupNumberInput} onChange={(event) => setGroupNumberInput(event.target.value)} placeholder={language === 'ko-KR' ? '그룹 번호 입력' : '输入群号'} className="h-10 flex-1 rounded-xl" />
                    <Button variant="secondary" size="icon" className="size-10" onClick={() => void handleJoinGroup()} disabled={joiningGroup}>
                      <Users className="size-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">{language === 'ko-KR' ? '그룹 채팅은 메시지 페이지에서 열리며 채널 페이지로 이동하지 않습니다.' : '群聊会在消息页中打开，不会跳到频道页。'}</p>
                </div>

                {error && (
                  <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-700 backdrop-blur">
                    {error}
                  </div>
                )}

                {!error && friendRequests.length === 0 && (
                  <div className={`flex flex-col items-center justify-center rounded-2xl border px-4 py-16 text-center ${luxuryTheme ? 'border-white/10 bg-white/5' : 'border-[var(--border)] bg-[var(--card)]'}`}>
                    <div className={`mb-3 flex size-14 items-center justify-center rounded-full ${luxuryTheme ? 'bg-white/50' : 'bg-[var(--muted)]'}`}>
                      <UserPlus className="size-7 text-[var(--muted-foreground)]" />
                    </div>
                    <p className="text-sm text-[var(--foreground)]">{language === 'ko-KR' ? '친구 신청이 없습니다' : '暂无好友申请'}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{language === 'ko-KR' ? '다른 사용자가 보낸 신청이 여기에 표시됩니다' : '别人发来申请后会显示在这里'}</p>
                  </div>
                )}

                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`rounded-2xl border p-3 ${luxuryTheme ? 'border-white/10 bg-white/5' : 'border-[var(--border)] bg-[var(--card)]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11 flex-shrink-0">
                        <AvatarImage src={request.targetAvatarUrl || buildAvatarUrl(request.targetNickname)} alt={request.targetNickname} />
                        <AvatarFallback>{request.targetNickname[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm text-[var(--foreground)]">{request.targetNickname}</span>
                        </div>
                        <p className="truncate text-xs text-[var(--muted-foreground)]">
                          {request.direction === 'OUTGOING' ? (language === 'ko-KR' ? '내가 보낸 친구 신청' : '你发起的好友申请') : (language === 'ko-KR' ? '상대가 보낸 친구 신청' : '别人发给你的好友申请')}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-2">
                        {request.canRespond ? (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="h-8 px-3" disabled={actioningId === request.id} onClick={() => void handleAccept(request.id)}>
                              {language === 'ko-KR' ? '수락' : '同意'}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
