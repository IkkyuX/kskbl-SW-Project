import { Search, UserPlus, Users as UsersIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User } from '../types';
import { useEffect, useMemo, useRef, useState, type WheelEvent } from 'react';
import { UnifiedHeader } from './UnifiedHeader';
import { useTheme } from '../context/ThemeContext';
import { isLuxuryTheme } from '../lib/themeStyles';
import {
  backendRequest,
  FriendDto,
  getFriendRequests,
  getFriends,
  MatchRecommendationDto,
  resolveAvatarUrl,
} from '../lib/backend';
import {
  readSettingsPreferences,
  subscribeSettingsPreferences,
} from '../lib/settings';
import { t, useAppLanguage } from '../lib/i18n';

interface FriendListProps {
  onOpenUserPanel: () => void;
  onOpenStatusPanel?: () => void;
  onOpenChat: (userId: number) => void;
  onOpenProfile: (userId: number, fallback?: User) => void;
  onOpenNewFriends: () => void;
  refreshKey?: number;
}

export function FriendList({ onOpenUserPanel, onOpenStatusPanel, onOpenChat, onOpenProfile, onOpenNewFriends, refreshKey = 0 }: FriendListProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['recommendations']));
  const [recommendedFriends, setRecommendedFriends] = useState<User[]>([]);
  const [allFriends, setAllFriends] = useState<User[]>([]);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [friendRequestAlertsEnabled, setFriendRequestAlertsEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recommendedTrackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadFriends = async () => {
      try {
        const [recommendations, conversations, requests] = await Promise.all([
          backendRequest<MatchRecommendationDto[]>('/matches/recommendations'),
          getFriends(),
          getFriendRequests(),
        ]);
        if (cancelled) {
          return;
        }
        setRecommendedFriends(recommendations.map((item, index) => ({
          id: String(item.userId),
          name: item.nickname,
          avatar: resolveAvatarUrl(item.avatarUrl, item.nickname),
          status: index === 0 ? 'online' : 'away',
          customStatus: item.matchReason,
          vip: item.matchScore >= 90,
        })));
        setAllFriends(conversations.map((item: FriendDto) => ({
          id: String(item.userId),
          name: item.nickname,
          avatar: resolveAvatarUrl(item.avatarUrl, item.nickname),
          status: 'online',
          customStatus: item.bio || item.major || t(language, 'canStartChat'),
          vip: item.status === 'ACTIVE',
        })));
        setFriendRequestCount(requests.filter((request) => request.status === 'PENDING').length);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t(language, 'friendLoadFailed'));
        }
      }
    };
    void loadFriends();

    const refreshOnRemarkChange = () => {
      void loadFriends();
    };
    window.addEventListener('sw-friend-remark-updated', refreshOnRemarkChange);
    return () => {
      cancelled = true;
      window.removeEventListener('sw-friend-remark-updated', refreshOnRemarkChange);
    };
  }, [refreshKey, language]);

  useEffect(() => {
    const syncPreferences = (friendRequestAlerts: boolean) => {
      setFriendRequestAlertsEnabled(friendRequestAlerts);
    };

    syncPreferences(readSettingsPreferences().friendRequestAlerts);
    return subscribeSettingsPreferences((prefs) => syncPreferences(prefs.friendRequestAlerts));
  }, []);

  const friendRequestSummary = friendRequestAlertsEnabled ? `${friendRequestCount} ${t(language, 'friendRequestCountSuffix')}` : t(language, 'friendRequestsMuted');

  const friendGroups = useMemo(() => ([
    {
      id: 'recommendations',
      name: t(language, 'recommendedFriends'),
      count: recommendedFriends.length,
      expanded: true,
      friends: recommendedFriends,
    },
    {
      id: 'all',
      name: t(language, 'allFriends'),
      count: allFriends.length,
      expanded: false,
      friends: allFriends,
    },
  ]), [allFriends, recommendedFriends, language]);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-400';
      case 'busy':
        return 'bg-red-400';
      case 'away':
        return 'bg-yellow-400';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusText = (status: User['status']) => {
    switch (status) {
      case 'online':
        return t(language, 'statusOnline');
      case 'busy':
        return t(language, 'statusBusy');
      case 'away':
        return t(language, 'statusAway');
      default:
        return t(language, 'presenceOffline');
    }
  };

  const handleRecommendedWheel = (event: WheelEvent<HTMLDivElement>) => {
    const container = recommendedTrackRef.current;
    if (!container) {
      return;
    }

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    container.scrollLeft += event.deltaY;
  };

  const scrollRecommendedFriends = (delta: number) => {
    recommendedTrackRef.current?.scrollBy({
      left: delta,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`w-full md:w-80 h-full flex flex-col overflow-hidden border-r border-[var(--chat-panel-border)] ${
      isLuxuryTheme(theme) ? 'bg-white/5 backdrop-blur-xl' : 'bg-[var(--card)]'
    }`}>
      {/* Unified Header */}
      <UnifiedHeader
        title={t(language, 'contactsTitle')}
        onOpenUserPanel={onOpenUserPanel}
        onOpenStatusPanel={onOpenStatusPanel}
        actionButton={
          <button
            type="button"
            onClick={onOpenNewFriends}
            aria-label={t(language, 'addFriendAria')}
            className={`size-9 flex items-center justify-center rounded-xl transition-all ${
              isLuxuryTheme(theme)
                ? 'text-amber-300 hover:bg-amber-400/10'
                : 'text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--chat-hover)]'
            }`}
          >
            <UserPlus className="size-5" />
          </button>
        }
      />

      {/* Search Bar - Below Header */}
      <div className={`px-4 py-3 ${
        isLuxuryTheme(theme) ? 'bg-white/5' : 'bg-[var(--background)]'
      }`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
          <Input
            placeholder={t(language, 'searchPlaceholder')}
            className={`pl-10 h-9 rounded-xl transition-all ${
              isLuxuryTheme(theme)
                ? 'bg-white/5 border-white/10 text-white placeholder:text-amber-100/45 focus:border-amber-400/45 focus:bg-white/10'
                : 'bg-[var(--input-background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]'
            }`}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="groups" className="flex-1 flex flex-col gap-0">

        <div className="px-4 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="groups" className="flex-1">{t(language, 'tabGroups')}</TabsTrigger>
            <TabsTrigger value="friends" className="flex-1">{t(language, 'tabFriends')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="groups" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-2 pb-4 md:pb-2">
              {/* Special Notifications */}
              {error && <div className="px-2 py-2 text-sm text-red-500">{error}</div>}
              <div className="mb-2">
                <button
                  type="button"
                  onClick={onOpenNewFriends}
                  aria-label={t(language, 'newFriends')}
                  className="relative z-10 w-full p-3 rounded-2xl hover:bg-[var(--chat-hover)] transition-all flex items-center justify-between group touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${
                      isLuxuryTheme(theme)
                        ? 'bg-[linear-gradient(135deg,rgba(255,232,162,0.18),rgba(212,175,55,0.1),rgba(15,11,7,0.2))]'
                        : 'bg-gradient-to-br from-cyan-400/20 to-blue-500/20'
                    }`}>
                      <UserPlus className="size-5 text-[var(--primary)]" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[var(--foreground)]">{t(language, 'newFriends')}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{friendRequestSummary}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={onOpenNewFriends}
                  aria-label={t(language, 'groupNotices')}
                  className="relative z-10 w-full p-3 rounded-2xl hover:bg-[var(--chat-hover)] transition-all flex items-center justify-between group touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${
                      isLuxuryTheme(theme)
                        ? 'bg-[linear-gradient(135deg,rgba(255,232,162,0.14),rgba(212,175,55,0.08),rgba(15,11,7,0.18))]'
                        : 'bg-gradient-to-br from-purple-400/20 to-pink-500/20'
                    }`}>
                      <UsersIcon className={`size-5 ${isLuxuryTheme(theme) ? 'text-amber-300' : 'text-purple-300'}`} />
                    </div>
                    <span className="text-[var(--foreground)]">{t(language, 'groupNotices')}</span>
                  </div>
                  <ChevronRight className="size-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
                </button>
              </div>

              {/* Friend Groups */}
              {friendGroups.map((group) => (
                <div key={group.id} className="mb-2">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full p-2 rounded-xl hover:bg-[var(--chat-hover)] transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      {expandedGroups.has(group.id) ? (
                        <ChevronDown className="size-4 text-[var(--muted-foreground)]" />
                      ) : (
                        <ChevronRight className="size-4 text-[var(--muted-foreground)]" />
                      )}
                      <span className="text-[var(--foreground)] font-medium">{group.name}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{group.count}</span>
                    </div>
                  </button>

                  {expandedGroups.has(group.id) && (
                    group.id === 'recommendations' ? (
                      <div className="ml-4 mt-1">
                        {group.friends.length === 0 ? (
                          <div className="px-2 py-3 text-xs text-[var(--muted-foreground)]">
                            {t(language, 'noRecommendedFriends')}
                          </div>
                        ) : (
                          <div className="relative w-full overflow-hidden pr-8" style={{ WebkitOverflowScrolling: 'touch' }}>
                            <div
                              ref={recommendedTrackRef}
                              onWheel={handleRecommendedWheel}
                              className="flex w-full gap-3 overflow-x-auto overflow-y-hidden px-2 pb-2 pr-4 scrollbar-hidden touch-pan-x overscroll-x-contain"
                              style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                              {group.friends.map((friend) => (
                                <button
                                  key={friend.id}
                                  type="button"
                                  onClick={() => onOpenProfile(Number(friend.id), friend)}
                                  className="flex w-[clamp(68px,18vw,92px)] shrink-0 flex-col items-center gap-2 rounded-2xl px-2 py-2 text-center transition-all hover:bg-[var(--chat-hover)]"
                                >
                                  <div className="relative overflow-visible">
                                    <Avatar className="size-[clamp(3rem,12vw,3.75rem)]">
                                      <AvatarImage src={friend.avatar} alt={friend.name} />
                                      <AvatarFallback>{friend.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className={`avatar-badge avatar-badge-bottom-right size-3.5 ${getStatusColor(friend.status)} rounded-full border-2 border-[var(--card)]`} />
                                  </div>
                                  <span className="w-full truncate text-xs text-[var(--foreground)]">{friend.name}</span>
                                </button>
                              ))}
                            </div>
                            {group.friends.length > 3 && (
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                <button
                                  type="button"
                                  onClick={() => scrollRecommendedFriends(220)}
                                  aria-label={language === 'ko-KR' ? '추천 친구를 더 보기' : '向右查看更多推荐好友'}
                                  className="pointer-events-auto mr-1 flex size-7 items-center justify-center rounded-full border border-white/10 bg-[var(--card)]/90 text-[var(--foreground)] shadow-sm backdrop-blur transition-transform hover:scale-105"
                                >
                                  <ChevronRight className="size-4" />
                                </button>
                              </div>
                            )}
                            {group.friends.length > 3 && (
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                                <button
                                  type="button"
                                  onClick={() => scrollRecommendedFriends(-220)}
                                  aria-label={language === 'ko-KR' ? '추천 친구를 이전으로 보기' : '向左查看更多推荐好友'}
                                  className="pointer-events-auto ml-1 flex size-7 items-center justify-center rounded-full border border-white/10 bg-[var(--card)]/90 text-[var(--foreground)] shadow-sm backdrop-blur transition-transform hover:scale-105"
                                >
                                  <ChevronRight className="size-4 rotate-180" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ml-4 mt-1 space-y-1">
                        {group.friends.length === 0 && (
                          <div className="px-2 py-3 text-xs text-[var(--muted-foreground)]">
                            {t(language, 'noFriends')}
                          </div>
                        )}
                        {group.friends.map((friend) => (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() => onOpenProfile(Number(friend.id), friend)}
                            className="w-full p-2 rounded-xl hover:bg-[var(--chat-hover)] transition-all flex items-center gap-3 group"
                          >
                            <div className="relative overflow-visible">
                              <Avatar className="size-10">
                                <AvatarImage src={friend.avatar} alt={friend.name} />
                                <AvatarFallback>{friend.name[0]}</AvatarFallback>
                              </Avatar>
                              <div className={`avatar-badge avatar-badge-bottom-right size-3.5 ${getStatusColor(friend.status)} rounded-full border-2 border-[var(--card)]`} />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[var(--foreground)] text-sm">{friend.name}</span>
                                {friend.vip && (
                                  <Badge className="px-1 py-0 text-[10px] bg-gradient-to-r from-yellow-400 to-orange-500 border-0">
                                    VIP
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-[var(--muted-foreground)] truncate">
                                {friend.customStatus || getStatusText(friend.status)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="friends" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-2 pb-4 md:pb-2">
              {/* Special Notifications */}
              <div className="mb-2">
                <button
                  type="button"
                  onClick={onOpenNewFriends}
                  aria-label={t(language, 'newFriends')}
                  className="relative z-10 w-full p-3 rounded-2xl hover:bg-[var(--chat-hover)] transition-all flex items-center justify-between group touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${
                      isLuxuryTheme(theme)
                        ? 'bg-[linear-gradient(135deg,rgba(255,232,162,0.18),rgba(212,175,55,0.1),rgba(15,11,7,0.2))]'
                        : 'bg-gradient-to-br from-cyan-400/20 to-blue-500/20'
                    }`}>
                      <UserPlus className="size-5 text-[var(--primary)]" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[var(--foreground)]">{t(language, 'newFriends')}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{friendRequestSummary}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={onOpenNewFriends}
                  aria-label={t(language, 'groupNotices')}
                  className="relative z-10 w-full p-3 rounded-2xl hover:bg-[var(--chat-hover)] transition-all flex items-center justify-between group touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${
                      isLuxuryTheme(theme)
                        ? 'bg-[linear-gradient(135deg,rgba(255,232,162,0.14),rgba(212,175,55,0.08),rgba(15,11,7,0.18))]'
                        : 'bg-gradient-to-br from-purple-400/20 to-pink-500/20'
                    }`}>
                      <UsersIcon className={`size-5 ${isLuxuryTheme(theme) ? 'text-amber-300' : 'text-purple-300'}`} />
                    </div>
                    <span className="text-[var(--foreground)]">{t(language, 'groupNotices')}</span>
                  </div>
                  <ChevronRight className="size-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
                </button>
              </div>

              {/* Alphabetically sorted friends */}
              {(() => {
                const getFirstLetter = (name: string) => {
                  const char = name[0].toUpperCase();
                  if (/[A-Z]/.test(char)) return char;
                  const pinyinMap: Record<string, string> = {
                    '张': 'Z', '王': 'W', '李': 'L', '赵': 'Z', '陈': 'C',
                    '刘': 'L', '周': 'Z', '吴': 'W', '郑': 'Z', '孙': 'S',
                    '小': 'X', '大': 'D', '老': 'L', '林': 'L', '黄': 'H'
                  };
                  return pinyinMap[char] || '#';
                };

                const groupedByLetter: Record<string, User[]> = {};
                allFriends.forEach((friend) => {
                  const letter = getFirstLetter(friend.name);
                  if (!groupedByLetter[letter]) {
                    groupedByLetter[letter] = [];
                  }
                  groupedByLetter[letter].push(friend);
                });

                const sortedLetters = Object.keys(groupedByLetter).sort();

                return sortedLetters.map((letter) => (
                  <div key={letter} className="mb-4">
                    <div className="px-2 py-1 sticky top-0 bg-[var(--card)] z-10">
                      <span className="text-sm font-semibold text-[var(--primary)]">{letter}</span>
                    </div>

                    <div className="space-y-1">
                      {groupedByLetter[letter].map((friend) => (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() => onOpenProfile(Number(friend.id), friend)}
                          className="w-full p-2 rounded-xl hover:bg-[var(--chat-hover)] transition-all flex items-center gap-3 group"
                        >
                          <div className="relative overflow-visible">
                            <Avatar className="size-10">
                              <AvatarImage src={friend.avatar} alt={friend.name} />
                              <AvatarFallback>{friend.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className={`avatar-badge avatar-badge-bottom-right size-3.5 ${getStatusColor(friend.status)} rounded-full border-2 border-[var(--card)]`} />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[var(--foreground)] text-sm">{friend.name}</span>
                              {friend.vip && (
                                <Badge className="px-1 py-0 text-[10px] bg-gradient-to-r from-yellow-400 to-orange-500 border-0">
                                  VIP
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] truncate">
                              {friend.customStatus || getStatusText(friend.status)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
