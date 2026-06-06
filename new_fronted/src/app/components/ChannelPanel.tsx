import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Crown,
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Heart,
  LifeBuoy,
  Loader2,
  Megaphone,
  MessageCircle,
  Search,
  Plus,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Shield,
  Trash2,
  Users as UsersIcon,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { UnifiedHeader } from './UnifiedHeader';
import { useTheme } from '../context/ThemeContext';
import { canGoBackInApp, pushHistoryState, readHistoryState } from '../lib/history';
import { isLuxuryTheme } from '../lib/themeStyles';
import type { User as AppUser } from '../types';
import {
  addCircleAdmin,
  buildAvatarUrl,
  createCircle,
  createPost,
  createPostComment,
  deleteCircle,
  deleteCirclePost,
  uploadCircleIcon,
  getCircleActivities,
  getCircleDetail,
  getCircleMembers,
  getPostDetail,
  getCirclePosts,
  getCircles,
  joinCircle,
  leaveCircle,
  removeCircleAdmin,
  updateCircleAnnouncement,
  updatePostFavorite,
  updatePostLike,
  type CircleActivityDto,
  type CircleDetailDto,
  type CircleMemberDto,
  type CircleSummaryDto,
  type PostDetailDto,
  type PostSummaryDto,
  type BoardSummaryDto,
  getBoards,
} from '../lib/backend';
import { useAppLanguage } from '../lib/i18n';

interface Channel {
  id: number;
  name: string;
  icon: string;
  category: string;
  members: number;
  description: string;
  joined: boolean;
  tags: string[];
  hot: boolean;
}

const channelTones = [
  'border-cyan-400/20 bg-cyan-500/10 text-cyan-300',
  'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
  'border-amber-400/20 bg-amber-500/10 text-amber-300',
  'border-pink-400/20 bg-pink-500/10 text-pink-300',
  'border-violet-400/20 bg-violet-500/10 text-violet-300',
];

const tabItems = [
  { value: 'overview', label: '概览' },
  { value: 'activity', label: '活动' },
  { value: 'members', label: '成员' },
  { value: 'posts', label: '帖子' },
] as const;

const channelFilterItems = [
  { value: 'all', label: '全部' },
  { value: 'joined', label: '已加入' },
  { value: 'hot', label: '热门' },
  { value: 'discover', label: '可发现' },
] as const;

const officialSections = [
  {
    id: 'announcement',
    title: '官方公告',
    description: '查看版本更新、平台规则与频道调整通知。',
    icon: Megaphone,
  },
  {
    id: 'events',
    title: '官方活动',
    description: '集中发布校园活动、合作企划和限时报名。',
    icon: Sparkles,
  },
  {
    id: 'support',
    title: '帮助支持',
    description: '遇到账号、举报或使用问题时优先从这里进入。',
    icon: LifeBuoy,
  },
] as const;

const CHANNEL_DETAIL_HISTORY_KEY = 'swChannelCircleId';

function getChannelTone(name: string, luxuryTheme = false) {
  if (luxuryTheme) {
    return 'border-amber-300/15 bg-[linear-gradient(135deg,rgba(255,232,162,0.16),rgba(212,175,55,0.08),rgba(15,11,7,0.32))] text-amber-200';
  }

  const score = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return channelTones[score % channelTones.length];
}

function isImageIcon(icon: string) {
  return /^https?:\/\//.test(icon) || icon.startsWith('/') || icon.startsWith('data:');
}

function mapCircle(circle: CircleSummaryDto): Channel {
  return {
    id: circle.id,
    name: circle.name,
    icon: circle.icon,
    category: circle.tags[0] || '交流',
    members: circle.members,
    description: circle.description,
    joined: circle.joined,
    tags: circle.tags,
    hot: circle.hot,
  };
}

function formatListTime(value: string) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

interface ChannelPanelProps {
  onOpenUserPanel: () => void;
  onOpenStatusPanel?: () => void;
  onOpenProfile?: (userId: number, fallbackUser?: AppUser) => void;
}

export function ChannelPanel({ onOpenUserPanel, onOpenStatusPanel, onOpenProfile }: ChannelPanelProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<(typeof channelFilterItems)[number]['value']>('all');
  const [loading, setLoading] = useState(true);
  const [pendingCircleId, setPendingCircleId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CircleDetailDto | null>(null);
  const [activities, setActivities] = useState<CircleActivityDto[]>([]);
  const [members, setMembers] = useState<CircleMemberDto[]>([]);
  const [posts, setPosts] = useState<PostSummaryDto[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [managingMemberId, setManagingMemberId] = useState<number | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [deletingCircle, setDeletingCircle] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'members' | 'posts'>('overview');
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  const [showCreateCircleDialog, setShowCreateCircleDialog] = useState(false);
  const [boards, setBoards] = useState<BoardSummaryDto[]>([]);
  const [postDetails, setPostDetails] = useState<Record<number, PostDetailDto>>({});
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [favoritedPostIds, setFavoritedPostIds] = useState<Set<number>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [sendingCommentIds, setSendingCommentIds] = useState<Set<number>>(new Set());
  const [createPostBoardId, setCreatePostBoardId] = useState<number | ''>('');
  const [createPostTitle, setCreatePostTitle] = useState('');
  const [createPostContent, setCreatePostContent] = useState('');
  const [createPostAnonymous, setCreatePostAnonymous] = useState(false);
  const [createCircleName, setCreateCircleName] = useState('');
  const [createCircleDescription, setCreateCircleDescription] = useState('');
  const [createCircleIconFile, setCreateCircleIconFile] = useState<File | null>(null);
  const [createCircleIconPreview, setCreateCircleIconPreview] = useState<string>('');
  const [creatingPost, setCreatingPost] = useState(false);
  const [creatingCircle, setCreatingCircle] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false,
  );
  const detailRequestIdRef = useRef(0);
  const createCircleIconInputRef = useRef<HTMLInputElement>(null);
  const effectiveJoined = Boolean(detail?.joined || detail?.isOwner);
  const localizedTabItems = [
    { value: 'overview', label: language === 'ko-KR' ? '개요' : '概览' },
    { value: 'activity', label: language === 'ko-KR' ? '활동' : '活动' },
    { value: 'members', label: language === 'ko-KR' ? '멤버' : '成员' },
    { value: 'posts', label: language === 'ko-KR' ? '게시물' : '帖子' },
  ] as const;
  const localizedChannelFilterItems = [
    { value: 'all', label: language === 'ko-KR' ? '전체' : '全部' },
    { value: 'joined', label: language === 'ko-KR' ? '참여 중' : '已加入' },
    { value: 'hot', label: language === 'ko-KR' ? '인기' : '热门' },
    { value: 'discover', label: language === 'ko-KR' ? '발견 가능' : '可发现' },
  ] as const;
  const localizedOfficialSections = [
    {
      id: 'announcement',
      title: language === 'ko-KR' ? '공지사항' : '官方公告',
      description: language === 'ko-KR' ? '버전 업데이트, 플랫폼 규칙, 채널 조정 공지를 확인하세요.' : '查看版本更新、平台规则与频道调整通知。',
      icon: Megaphone,
    },
    {
      id: 'events',
      title: language === 'ko-KR' ? '공식 이벤트' : '官方活动',
      description: language === 'ko-KR' ? '캠퍼스 이벤트와 협업 프로젝트, 한정 모집 정보를 모아 보여줍니다.' : '集中发布校园活动、合作企划和限时报名。',
      icon: Sparkles,
    },
    {
      id: 'support',
      title: language === 'ko-KR' ? '도움말 지원' : '帮助支持',
      description: language === 'ko-KR' ? '계정, 신고, 사용 중 문제를 우선 처리합니다.' : '遇到账号、举报或使用问题时优先从这里进入。',
      icon: LifeBuoy,
    },
  ] as const;

  const resetCircleDetail = useCallback(() => {
    detailRequestIdRef.current += 1;
    setSelectedCircleId(null);
    setDetail(null);
    setActivities([]);
    setMembers([]);
    setPosts([]);
    setPostDetails({});
    setExpandedPostId(null);
    setAnnouncementDraft('');
    setLikedPostIds(new Set());
    setFavoritedPostIds(new Set());
    setCommentDrafts({});
    setSendingCommentIds(new Set());
    setDetailError(null);
    setDetailLoading(false);
  }, []);

  const loadCircles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCircles();
      setChannels(data.map(mapCircle));
      setError(null);
    } catch {
      setChannels([]);
      setError(language === 'ko-KR' ? '채널을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' : '频道加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [language]);

  const loadBoards = useCallback(async () => {
    try {
      const data = await getBoards();
      setBoards(data);
      setCreatePostBoardId((current) => current || data[0]?.id || '');
    } catch {
      setBoards([]);
    }
  }, []);

  const loadCircleDetail = useCallback(async (circleId: number) => {
    const requestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = requestId;
    setDetailLoading(true);
    setDetailError(null);

    try {
      const [detailData, activityData, memberData, postData] = await Promise.all([
        getCircleDetail(circleId),
        getCircleActivities(circleId),
        getCircleMembers(circleId),
        getCirclePosts(circleId),
      ]);

      if (detailRequestIdRef.current !== requestId) {
        return;
      }

      setDetail(detailData);
      setAnnouncementDraft(detailData.announcement);
      setActivities(activityData);
      setMembers(memberData);
      setPosts(postData);
    } catch {
      if (detailRequestIdRef.current === requestId) {
        setDetailError(language === 'ko-KR' ? '채널 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' : '圈子详情加载失败，请稍后重试');
      }
    } finally {
      if (detailRequestIdRef.current === requestId) {
        setDetailLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadCircles();
    void loadBoards();
  }, [loadCircles, loadBoards]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncLayout = () => setIsDesktopLayout(mediaQuery.matches);
    syncLayout();
    mediaQuery.addEventListener('change', syncLayout);
    return () => mediaQuery.removeEventListener('change', syncLayout);
  }, []);

  useEffect(() => {
    const currentCircleId = readHistoryState()[CHANNEL_DETAIL_HISTORY_KEY];
    if (typeof currentCircleId === 'number' && Number.isFinite(currentCircleId)) {
      setSelectedCircleId(currentCircleId);
      setActiveTab('overview');
      void loadCircleDetail(currentCircleId);
    }

    const handlePopState = (event: PopStateEvent) => {
      const nextCircleId = event.state?.[CHANNEL_DETAIL_HISTORY_KEY];
      if (typeof nextCircleId === 'number' && Number.isFinite(nextCircleId)) {
        setSelectedCircleId(nextCircleId);
        setActiveTab('overview');
        void loadCircleDetail(nextCircleId);
        return;
      }

      resetCircleDetail();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [loadCircleDetail, resetCircleDetail]);

  const openCircleDetail = useCallback(async (circleId: number) => {
    pushHistoryState({ [CHANNEL_DETAIL_HISTORY_KEY]: circleId });
    setSelectedCircleId(circleId);
    setActiveTab('overview');
    await loadCircleDetail(circleId);
  }, [loadCircleDetail]);

  const closeCircleDetail = useCallback(() => {
    if (selectedCircleId !== null && canGoBackInApp()) {
      window.history.back();
      return;
    }

    resetCircleDetail();
  }, [resetCircleDetail, selectedCircleId]);

  const handleToggleJoin = async (circleId: number, joined: boolean) => {
    if (pendingCircleId !== null) {
      return;
    }

    setPendingCircleId(circleId);
    try {
      if (joined) {
        await leaveCircle(circleId);
      } else {
        await joinCircle(circleId);
      }
      await loadCircles();
      if (selectedCircleId === circleId) {
        await loadCircleDetail(circleId);
      }
    } catch {
      setError(language === 'ko-KR' ? '채널 상태를 업데이트하지 못했습니다. 잠시 후 다시 시도해 주세요.' : '频道状态更新失败，请稍后重试');
      if (selectedCircleId === circleId) {
        setDetailError(language === 'ko-KR' ? '채널 상태를 업데이트하지 못했습니다. 잠시 후 다시 시도해 주세요.' : '频道状态更新失败，请稍后重试');
      }
    } finally {
      setPendingCircleId(null);
    }
  };

  const handleAnnouncementSave = async () => {
    if (!detail || !detail.canManageContent || savingAnnouncement) {
      return;
    }
    const nextAnnouncement = announcementDraft.trim();
    if (!nextAnnouncement) {
      setDetailError(language === 'ko-KR' ? '공지 내용은 비워둘 수 없습니다.' : '公告内容不能为空');
      return;
    }

    setSavingAnnouncement(true);
    try {
      const nextDetail = await updateCircleAnnouncement(detail.id, nextAnnouncement);
      setDetail(nextDetail);
      setAnnouncementDraft(nextDetail.announcement);
      setDetailError(null);
      setActivities((prev) => prev.map((item) => (
        item.type === 'NOTICE' ? { ...item, content: nextDetail.announcement } : item
      )));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : (language === 'ko-KR' ? '공지 업데이트에 실패했습니다.' : '公告更新失败'));
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleAdminToggle = async (member: CircleMemberDto) => {
    if (!detail?.canManageAdmins || managingMemberId !== null || member.isOwner) {
      return;
    }

    setManagingMemberId(member.userId);
    try {
      const nextMembers = member.isAdmin
        ? await removeCircleAdmin(detail.id, member.userId)
        : await addCircleAdmin(detail.id, member.userId);
      setMembers(nextMembers);
      await loadCircleDetail(detail.id);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : (language === 'ko-KR' ? '관리자 권한 업데이트에 실패했습니다.' : '管理员权限更新失败'));
    } finally {
      setManagingMemberId(null);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!detail?.canManageContent || deletingPostId !== null) {
      return;
    }
    if (!window.confirm(language === 'ko-KR' ? '이 채널 게시물을 삭제할까요? 삭제 후에는 복구할 수 없습니다.' : '确定删除这条频道帖子吗？删除后将无法恢复。')) {
      return;
    }

    setDeletingPostId(postId);
    try {
      await deleteCirclePost(detail.id, postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setPostDetails((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      if (expandedPostId === postId) {
        setExpandedPostId(null);
      }
      await loadCircleDetail(detail.id);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : (language === 'ko-KR' ? '게시물 삭제에 실패했습니다.' : '帖子删除失败'));
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleDeleteCircle = async () => {
    if (!detail?.canDeleteCircle || deletingCircle) {
      return;
    }
    if (!window.confirm(language === 'ko-KR' ? `채널 "${detail.name}"을(를) 삭제할까요? 채널 멤버와 관리자 관계도 함께 제거됩니다.` : `确定删除频道“${detail.name}”吗？频道成员和管理员关系会一并清除。`)) {
      return;
    }

    setDeletingCircle(true);
    try {
      await deleteCircle(detail.id);
      closeCircleDetail();
      await loadCircles();
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : (language === 'ko-KR' ? '채널 삭제에 실패했습니다.' : '频道删除失败'));
    } finally {
      setDeletingCircle(false);
    }
  };

  const filteredChannels = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const nextChannels = channels
      .filter((channel) => {
        if (!keyword) {
          return true;
        }
        return [channel.name, channel.description, channel.category, channel.tags.join(' ')].join(' ')
          .toLowerCase()
          .includes(keyword);
      })
      .filter((channel) => {
        if (channelFilter === 'joined') {
          return channel.joined;
        }
        if (channelFilter === 'hot') {
          return channel.hot;
        }
        if (channelFilter === 'discover') {
          return !channel.joined;
        }
        return true;
      })
      .sort((left, right) => {
        if (selectedCircleId === left.id) return -1;
        if (selectedCircleId === right.id) return 1;
        if (left.joined !== right.joined) return Number(right.joined) - Number(left.joined);
        if (left.hot !== right.hot) return Number(right.hot) - Number(left.hot);
        if (left.members !== right.members) return right.members - left.members;
        return left.name.localeCompare(right.name, 'zh-CN');
      });

    return nextChannels;
  }, [channelFilter, channels, searchTerm, selectedCircleId]);

  const selectedChannel = selectedCircleId === null
    ? null
    : channels.find((channel) => channel.id === selectedCircleId) ?? null;

  const selectedIcon = detail?.icon ?? selectedChannel?.icon ?? '';
  const selectedName = detail?.name ?? selectedChannel?.name ?? '';
  const luxuryTheme = isLuxuryTheme(theme);
  const selectedTone = getChannelTone(selectedName, luxuryTheme);
  const detailSurfaceClass = luxuryTheme
    ? 'border-white/10 bg-white/5 text-[var(--foreground)]'
    : 'border-[var(--border)] bg-[var(--card)]';
  const overviewActivities = activities.slice(0, 2);
  const overviewPosts = posts.slice(0, 2);
  const overviewMembers = members.slice(0, 3);
  const canCreatePostInDetail = Boolean(detail?.joined);
  const openCreatePostDialog = () => {
    if (!canCreatePostInDetail) {
      return;
    }
    setShowCreatePostDialog(true);
  };
  const openMemberProfile = (userId?: number | null, fallbackUser?: AppUser) => {
    if (!onOpenProfile || typeof userId !== 'number' || !Number.isFinite(userId)) {
      return;
    }
    onOpenProfile(userId, fallbackUser);
  };
  const detailTabsContent = (
    <div className="flex min-h-0 flex-1 flex-col">
      {detailLoading && !detail && (
        <div className="flex min-h-[320px] items-center justify-center text-sm text-[var(--muted-foreground)]">
          <Loader2 className="mr-2 size-4 animate-spin" />
          {language === 'ko-KR' ? '상세 정보를 불러오는 중...' : '正在加载详情...'}
        </div>
      )}

      {detailError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {detailError}
        </div>
      )}

      {!detailLoading && detail && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="w-full justify-start rounded-2xl bg-[var(--muted)] p-1">
            {localizedTabItems.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="mt-4 min-h-0 flex-1 pr-2">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="mx-auto w-full max-w-[320px] space-y-4 sm:max-w-[420px] md:max-w-[520px] lg:max-w-none">
                <div className={`rounded-2xl border p-4 ${detailSurfaceClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                      <Sparkles className="size-4 text-[var(--primary)]" />
                      {language === 'ko-KR' ? '채널 공지' : '圈子公告'}
                    </div>
                    {detail.canManageContent && (
                      <Badge variant="secondary" className="rounded-full">
                        {language === 'ko-KR' ? '편집 가능' : '可编辑'}
                      </Badge>
                    )}
                  </div>
                  {detail.canManageContent ? (
                    <div className="mt-3 space-y-3">
                      <Textarea
                        value={announcementDraft}
                        onChange={(event) => setAnnouncementDraft(event.target.value)}
                        placeholder={language === 'ko-KR' ? '채널 공지 수정' : '更新频道公告'}
                        className="min-h-[96px] rounded-2xl"
                      />
                      <button
                        type="button"
                        onClick={() => void handleAnnouncementSave()}
                        disabled={savingAnnouncement}
                        className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors ${
                          luxuryTheme
                            ? 'bg-amber-300/12 text-amber-100 hover:bg-amber-300/18 disabled:opacity-60'
                            : 'bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--chat-hover)] disabled:opacity-60'
                        }`}
                      >
                        {savingAnnouncement ? <Loader2 className="size-4 animate-spin" /> : (language === 'ko-KR' ? '공지 업데이트' : '更新公告')}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                      {detail.announcement}
                    </p>
                  )}
                </div>

                <div className={`rounded-2xl border p-4 ${detailSurfaceClass}`}>
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                    <CalendarDays className="size-4 text-[var(--primary)]" />
                    {language === 'ko-KR' ? '채널 소개' : '圈子简介'}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                    {detail.description}
                  </p>
                </div>

                <div className={`rounded-2xl border p-4 ${detailSurfaceClass}`}>
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                    <ShieldCheck className="size-4 text-[var(--primary)]" />
                    {language === 'ko-KR' ? '현재 상태' : '当前状态'}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      {effectiveJoined ? (language === 'ko-KR' ? '참여 중' : '已加入') : (language === 'ko-KR' ? '미참여' : '未加入')}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {detail.isOwner ? (language === 'ko-KR' ? '채널 소유자' : '你是频道主') : detail.isAdmin ? (language === 'ko-KR' ? '관리자' : '你是管理员') : (language === 'ko-KR' ? '일반 멤버' : '普通成员')}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {detail.hot ? (language === 'ko-KR' ? '인기 채널' : '热门圈子') : (language === 'ko-KR' ? '일반 채널' : '常规圈子')}
                    </Badge>
                    {detail.canManageAdmins && (
                      <Badge variant="secondary" className="rounded-full">
                        {language === 'ko-KR' ? '관리자 관리 가능' : '可管理管理员'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 ${detailSurfaceClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                      <Sparkles className="size-4 text-[var(--primary)]" />
                      {language === 'ko-KR' ? '최근 활동' : '近期活动'}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {overviewActivities.length} {language === 'ko-KR' ? '건' : '条'}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {overviewActivities.length === 0 ? (
                      <p className="text-sm text-[var(--muted-foreground)]">{language === 'ko-KR' ? '최근 활동이 없습니다' : '暂无近期活动'}</p>
                    ) : (
                      overviewActivities.map((item) => (
                        <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="rounded-full">
                              {item.type}
                            </Badge>
                            <p className="truncate text-sm font-medium text-[var(--foreground)]">{item.title}</p>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-[var(--muted-foreground)]">
                            {item.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {detail.canDeleteCircle && (
                  <div className={`rounded-2xl border p-4 ${detailSurfaceClass}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                          <Trash2 className="size-4 text-red-500" />
                          {language === 'ko-KR' ? '채널 소유자 작업' : '频道主操作'}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                          {language === 'ko-KR' ? '채널 소유자는 채널 삭제와 관리자 관리를 할 수 있으며, 그 외 권한은 관리자와 동일합니다.' : '频道主可以删除频道和管理频道管理员，其他内容权限与管理员相同。'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCircle()}
                        disabled={deletingCircle}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                      >
                        {deletingCircle ? <Loader2 className="size-4 animate-spin" /> : (language === 'ko-KR' ? '채널 삭제' : '删除频道')}
                      </button>
                    </div>
                  </div>
                )}

                <div className={`rounded-2xl border p-4 ${detailSurfaceClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                      <Users className="size-4 text-[var(--primary)]" />
                      {language === 'ko-KR' ? '멤버 미리보기' : '成员预览'}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {overviewMembers.length} {language === 'ko-KR' ? '명' : '位'}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {overviewMembers.length === 0 ? (
                      <p className="text-sm text-[var(--muted-foreground)]">{language === 'ko-KR' ? '멤버 미리보기가 없습니다' : '暂无成员预览'}</p>
                    ) : (
                      overviewMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                          <button
                            type="button"
                            onClick={() => openMemberProfile(member.userId, {
                              id: String(member.userId),
                              name: member.nickname,
                              avatar: member.avatarUrl ?? buildAvatarUrl(member.nickname),
                              status: 'online',
                              customStatus: member.bio,
                            })}
                            className="shrink-0 rounded-full transition-transform hover:scale-[1.03] active:scale-[0.98]"
                            aria-label={`打开 ${member.nickname} 的个人信息`}
                          >
                            <Avatar className="size-8 shrink-0">
                              <AvatarImage src={member.avatarUrl ?? buildAvatarUrl(member.nickname)} alt={member.nickname} />
                              <AvatarFallback>{member.nickname.slice(0, 1)}</AvatarFallback>
                            </Avatar>
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--foreground)]">
                              {member.nickname}
                            </p>
                            <p className="truncate text-xs text-[var(--muted-foreground)]">
                              {member.school} · {member.major}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 ${detailSurfaceClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                      <CalendarDays className="size-4 text-[var(--primary)]" />
                      {language === 'ko-KR' ? '추천 게시물' : '精选帖子'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {overviewPosts.length} {language === 'ko-KR' ? '개' : '条'}
                      </span>
                      {canCreatePostInDetail && (
                        <button
                          type="button"
                          onClick={openCreatePostDialog}
                          className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                            luxuryTheme
                              ? 'bg-amber-300/10 text-amber-100 hover:bg-amber-300/16'
                              : 'bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--chat-hover)]'
                          }`}
                        >
                          <Plus className="size-3.5" />
                          {language === 'ko-KR' ? '게시' : '发帖'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {overviewPosts.length === 0 ? (
                      <p className="text-sm text-[var(--muted-foreground)]">{language === 'ko-KR' ? '추천 게시물이 없습니다' : '暂无精选帖子'}</p>
                    ) : (
                      overviewPosts.map((post) => (
                        <div key={post.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="rounded-full">
                              {post.boardName}
                            </Badge>
                            <p className="truncate text-sm font-medium text-[var(--foreground)]">{post.title}</p>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-[var(--muted-foreground)]">
                            {post.summary}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {detail.joined && (
                <div className="mx-auto mt-2 flex w-full max-w-[320px] justify-center sm:max-w-[420px] md:max-w-[520px] lg:max-w-none lg:justify-end">
                  <button
                    type="button"
                    onClick={() => void handleToggleJoin(detail.id, true)}
                    disabled={pendingCircleId === detail.id}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 text-base font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-52 dark:border-red-900 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900/50"
                  >
                    {pendingCircleId === detail.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    {language === 'ko-KR' ? '참여 취소' : '取消关注'}
                  </button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-0 space-y-3">
              {activities.length === 0 ? (
                <div className={`rounded-2xl border px-4 py-8 text-center text-sm text-[var(--muted-foreground)] ${detailSurfaceClass}`}>
                  {language === 'ko-KR' ? '활동이 없습니다' : '暂无活动'}
                </div>
              ) : (
                activities.map((item) => (
                  <div key={item.id} className={`rounded-2xl border p-4 ${detailSurfaceClass}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="rounded-full">
                            {item.type}
                          </Badge>
                          <h4 className="truncate text-sm font-medium text-[var(--foreground)]">
                            {item.title}
                          </h4>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                          {item.content}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                        {item.createdAt}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="members" className="mt-0 space-y-3">
              {members.length === 0 ? (
                <div className={`rounded-2xl border px-4 py-8 text-center text-sm text-[var(--muted-foreground)] ${detailSurfaceClass}`}>
                  {language === 'ko-KR' ? '멤버가 없습니다' : '暂无成员'}
                </div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className={`rounded-2xl border p-4 ${detailSurfaceClass}`}>
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => openMemberProfile(member.userId, {
                          id: String(member.userId),
                          name: member.nickname,
                          avatar: member.avatarUrl ?? buildAvatarUrl(member.nickname),
                          status: 'online',
                          customStatus: member.bio,
                        })}
                        className="shrink-0 rounded-full transition-transform hover:scale-[1.03] active:scale-[0.98]"
                        aria-label={`打开 ${member.nickname} 的个人信息`}
                      >
                        <Avatar className="size-11">
                          <AvatarImage src={member.avatarUrl ?? buildAvatarUrl(member.nickname)} alt={member.nickname} />
                          <AvatarFallback>{member.nickname.slice(0, 1)}</AvatarFallback>
                        </Avatar>
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-[var(--foreground)]">
                            {member.nickname}
                          </p>
                          {member.isOwner ? (
                            <Badge className="h-5 rounded-full bg-amber-500/15 text-amber-500 border-amber-500/20">
                              <Crown className="mr-1 size-3" />
                              {language === 'ko-KR' ? '채널 소유자' : '频道主'}
                            </Badge>
                          ) : member.isAdmin ? (
                            <Badge className="h-5 rounded-full bg-amber-500/15 text-amber-500 border-amber-500/20">
                              <Shield className="mr-1 size-3" />
                              {language === 'ko-KR' ? '관리자' : '管理员'}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {member.school} · {member.major}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                          {member.bio}
                        </p>
                        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                          {language === 'ko-KR' ? '참여 시각' : '加入时间'} {member.joinedAt}
                        </p>
                        {detail?.canManageAdmins && !member.isOwner && (
                          <button
                            type="button"
                            onClick={() => void handleAdminToggle(member)}
                            disabled={managingMemberId === member.userId}
                            className={`mt-3 inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium transition-colors ${
                              luxuryTheme
                                ? 'bg-amber-300/10 text-amber-100 hover:bg-amber-300/16 disabled:opacity-60'
                                : 'bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--chat-hover)] disabled:opacity-60'
                            }`}
                          >
                            {managingMemberId === member.userId ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : member.isAdmin ? (language === 'ko-KR' ? '관리자 해제' : '撤销管理员') : (language === 'ko-KR' ? '관리자 지정' : '设为管理员')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="posts" className="mt-0 space-y-3">
              <div className={`rounded-2xl border p-4 ${detailSurfaceClass}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-medium text-[var(--foreground)]">{language === 'ko-KR' ? '채널 게시물' : '频道帖子'}</h4>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {detail?.name ? (language === 'ko-KR' ? `${detail.name} 채널에서 글을 올리고 토론을 둘러볼 수 있습니다` : `在 ${detail.name} 里发布和浏览讨论`) : (language === 'ko-KR' ? '현재 채널에서 글을 올리고 토론을 둘러볼 수 있습니다' : '在当前频道里发布和浏览讨论')}
                    </p>
                  </div>
                  {canCreatePostInDetail && (
                    <button
                      type="button"
                      onClick={openCreatePostDialog}
                      className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                        luxuryTheme
                          ? 'bg-amber-300/10 text-amber-100 hover:bg-amber-300/16'
                          : 'bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--chat-hover)]'
                      }`}
                    >
                      <Plus className="size-4" />
                      {language === 'ko-KR' ? '게시물 작성' : '发帖子'}
                    </button>
                  )}
                </div>
              </div>
              {posts.length === 0 ? (
                <div className={`rounded-2xl border px-4 py-8 text-center text-sm text-[var(--muted-foreground)] ${detailSurfaceClass}`}>
                  {language === 'ko-KR' ? '게시물이 없습니다' : '暂无帖子'}
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className={`rounded-2xl border p-4 ${detailSurfaceClass}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          {post.authorUserId ? (
                            <button
                              type="button"
                              onClick={() => openMemberProfile(post.authorUserId, {
                                id: String(post.authorUserId),
                                name: post.authorName,
                                avatar: post.authorAvatarUrl ?? buildAvatarUrl(post.authorName),
                                status: 'online',
                              })}
                              className="shrink-0 rounded-full transition-transform hover:scale-[1.03] active:scale-[0.98]"
                              aria-label={`打开 ${post.authorName} 的个人信息`}
                            >
                              <Avatar className="size-10">
                                <AvatarImage src={post.authorAvatarUrl ?? buildAvatarUrl(post.authorName)} alt={post.authorName} />
                                <AvatarFallback>{post.authorName.slice(0, 1)}</AvatarFallback>
                              </Avatar>
                            </button>
                          ) : (
                            <Avatar className="size-10 shrink-0">
                              <AvatarImage src={post.authorAvatarUrl ?? buildAvatarUrl(post.authorName)} alt={post.authorName} />
                              <AvatarFallback>{post.authorName.slice(0, 1)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                                {post.authorName}
                              </p>
                              <Badge variant="secondary" className="rounded-full">
                                {post.boardName}
                              </Badge>
                              {detail?.canManageContent && (
                                <button
                                  type="button"
                                  onClick={() => void handleDeletePost(post.id)}
                                  disabled={deletingPostId === post.id}
                                  className="inline-flex h-7 items-center justify-center rounded-full border border-red-200 px-2.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                                >
                                  {deletingPostId === post.id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <Trash2 className="mr-1 size-3.5" />
                                      {language === 'ko-KR' ? '삭제' : '删帖'}
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <h4 className="mt-1 truncate text-sm font-medium text-[var(--foreground)]">
                              {post.title}
                            </h4>
                          </div>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                          {post.summary}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => void toggleLike(post.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors ${
                              likedPostIds.has(post.id)
                                ? 'bg-rose-500/12 text-rose-500'
                                : 'text-[var(--muted-foreground)] hover:bg-[var(--chat-hover)] hover:text-[var(--foreground)]'
                            }`}
                          >
                            <Heart className={`size-3.5 ${likedPostIds.has(post.id) ? 'fill-current' : ''}`} />
                            <span>{post.likeCount > 0 ? post.likeCount : (language === 'ko-KR' ? '좋아요' : '点赞')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleComments(post.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors ${
                              expandedPostId === post.id
                                ? 'bg-sky-500/12 text-sky-500'
                                : 'text-[var(--muted-foreground)] hover:bg-[var(--chat-hover)] hover:text-[var(--foreground)]'
                            }`}
                          >
                            <MessageCircle className="size-3.5" />
                            <span>{post.commentCount > 0 ? post.commentCount : (language === 'ko-KR' ? '댓글' : '评论')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleFavorite(post.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors ${
                              favoritedPostIds.has(post.id)
                                ? 'bg-amber-500/12 text-amber-500'
                                : 'text-[var(--muted-foreground)] hover:bg-[var(--chat-hover)] hover:text-[var(--foreground)]'
                            }`}
                          >
                            <Bookmark className={`size-3.5 ${favoritedPostIds.has(post.id) ? 'fill-current' : ''}`} />
                            <span>{post.favoriteCount > 0 ? post.favoriteCount : (language === 'ko-KR' ? '저장' : '收藏')}</span>
                          </button>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                        {formatListTime(post.createdAt)}
                      </span>
                    </div>
                    {expandedPostId === post.id && (
                      <div className={`mt-4 rounded-2xl border p-3 ${luxuryTheme ? 'border-white/10 bg-white/5' : 'border-[var(--border)] bg-[var(--background)]'}`}>
                        <div className="space-y-3">
                          {postDetails[post.id]?.comments?.length ? (
                            postDetails[post.id].comments.map((comment) => (
                              <div key={comment.id} className="flex items-start gap-3">
                                <Avatar className="size-8 shrink-0">
                                  <AvatarImage src={comment.authorAvatarUrl ?? buildAvatarUrl(comment.authorName)} alt={comment.authorName} />
                                  <AvatarFallback>{comment.authorName.slice(0, 1)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{comment.authorName}</p>
                                    <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{formatListTime(comment.createdAt)}</span>
                                  </div>
                                  <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{comment.content}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-[var(--muted-foreground)]">{language === 'ko-KR' ? '아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.' : '还没有评论，来留下第一条吧。'}</p>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Input
                            value={commentDrafts[post.id] ?? ''}
                            onChange={(event) => handleCommentChange(post.id, event.target.value)}
                            onKeyDown={async (event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                await sendComment(post.id);
                              }
                            }}
                            placeholder={language === 'ko-KR' ? '댓글을 입력해 주세요...' : '写下你的评论...'}
                            className="h-10 rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => void sendComment(post.id)}
                            disabled={sendingCommentIds.has(post.id)}
                            className={`inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors ${
                              luxuryTheme
                                ? 'bg-amber-300/12 text-amber-100 hover:bg-amber-300/18 disabled:opacity-60'
                                : 'bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--chat-hover)] disabled:opacity-60'
                            }`}
                          >
                            {sendingCommentIds.has(post.id) ? <Loader2 className="size-4 animate-spin" /> : (language === 'ko-KR' ? '보내기' : '发送')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      )}
    </div>
  );
  const actionMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={language === 'ko-KR' ? '추가' : '添加'}
          className={`size-9 flex items-center justify-center rounded-xl transition-all ${
            luxuryTheme
              ? 'text-amber-300 hover:bg-amber-400/10'
              : 'text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--chat-hover)]'
          }`}
        >
          <Plus className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={`w-44 rounded-2xl border p-1.5 shadow-2xl ${
          luxuryTheme
            ? 'border-white/10 bg-[#120e08]/95 text-[var(--foreground)] shadow-black/40 backdrop-blur-2xl'
            : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-slate-900/12'
        }`}
      >
        <DropdownMenuItem
          onSelect={() => setShowCreateCircleDialog(true)}
          className="h-11 cursor-pointer rounded-xl px-3 text-sm focus:bg-[var(--chat-hover)] focus:text-[var(--foreground)]"
        >
          <UsersIcon className="size-4 text-[var(--primary)]" />
          <span>{language === 'ko-KR' ? '채널 만들기' : '创建频道'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const submitCreatePost = async () => {
    if (!createPostContent.trim() || createPostBoardId === '' || creatingPost) {
      return;
    }
    setCreatingPost(true);
    try {
      const created = await createPost({
        boardId: createPostBoardId,
        title: createPostTitle.trim() || undefined,
        content: createPostContent.trim(),
        anonymous: createPostAnonymous,
      });
      setPosts((prev) => [created, ...prev]);
      setCreatePostTitle('');
      setCreatePostContent('');
      setCreatePostAnonymous(false);
      setShowCreatePostDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '게시물 작성에 실패했습니다.' : '发帖失败'));
    } finally {
      setCreatingPost(false);
    }
  };

  const syncPostCount = (postId: number, updater: (post: PostSummaryDto) => PostSummaryDto) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? updater(post) : post)));
  };

  const toggleComments = async (postId: number) => {
    setExpandedPostId((current) => (current === postId ? null : postId));
    if (!postDetails[postId]) {
      try {
        const detailData = await getPostDetail(postId);
        setPostDetails((prev) => ({ ...prev, [postId]: detailData }));
      } catch (err) {
        setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '게시물 상세 정보를 불러오지 못했습니다.' : '帖子详情加载失败'));
      }
    }
  };

  const toggleLike = async (postId: number) => {
    const nextLiked = !likedPostIds.has(postId);
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (nextLiked) next.add(postId);
      else next.delete(postId);
      return next;
    });
    syncPostCount(postId, (post) => ({
      ...post,
      likeCount: Math.max(0, post.likeCount + (nextLiked ? 1 : -1)),
    }));

    try {
      const reaction = await updatePostLike(postId, nextLiked);
      syncPostCount(postId, (post) => ({
        ...post,
        likeCount: reaction.likeCount,
        commentCount: reaction.commentCount,
        favoriteCount: reaction.favoriteCount,
      }));
      setPostDetails((prev) => {
        const current = prev[postId];
        if (!current) {
          return prev;
        }
        return {
          ...prev,
          [postId]: {
            ...current,
            likeCount: reaction.likeCount,
            commentCount: reaction.commentCount,
            favoriteCount: reaction.favoriteCount,
          },
        };
      });
    } catch {
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (nextLiked) next.delete(postId);
        else next.add(postId);
        return next;
      });
      syncPostCount(postId, (post) => ({
        ...post,
        likeCount: Math.max(0, post.likeCount + (nextLiked ? -1 : 1)),
      }));
    }
  };

  const toggleFavorite = async (postId: number) => {
    const nextFavorited = !favoritedPostIds.has(postId);
    setFavoritedPostIds((prev) => {
      const next = new Set(prev);
      if (nextFavorited) next.add(postId);
      else next.delete(postId);
      return next;
    });
    syncPostCount(postId, (post) => ({
      ...post,
      favoriteCount: Math.max(0, post.favoriteCount + (nextFavorited ? 1 : -1)),
    }));

    try {
      const reaction = await updatePostFavorite(postId, nextFavorited);
      syncPostCount(postId, (post) => ({
        ...post,
        likeCount: reaction.likeCount,
        commentCount: reaction.commentCount,
        favoriteCount: reaction.favoriteCount,
      }));
      setPostDetails((prev) => {
        const current = prev[postId];
        if (!current) {
          return prev;
        }
        return {
          ...prev,
          [postId]: {
            ...current,
            likeCount: reaction.likeCount,
            commentCount: reaction.commentCount,
            favoriteCount: reaction.favoriteCount,
          },
        };
      });
    } catch {
      setFavoritedPostIds((prev) => {
        const next = new Set(prev);
        if (nextFavorited) next.delete(postId);
        else next.add(postId);
        return next;
      });
      syncPostCount(postId, (post) => ({
        ...post,
        favoriteCount: Math.max(0, post.favoriteCount + (nextFavorited ? -1 : 1)),
      }));
    }
  };

  const handleCommentChange = (postId: number, value: string) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
  };

  const sendComment = async (postId: number) => {
    const content = (commentDrafts[postId] ?? '').trim();
    if (!content || sendingCommentIds.has(postId)) {
      return;
    }

    setSendingCommentIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });

    try {
      const created = await createPostComment(postId, content);
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      setPostDetails((prev) => {
        const current = prev[postId];
        if (!current) {
          return prev;
        }
        return {
          ...prev,
          [postId]: {
            ...current,
            comments: [...current.comments, created],
            commentCount: current.commentCount + 1,
          },
        };
      });
      syncPostCount(postId, (post) => ({
        ...post,
        commentCount: post.commentCount + 1,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '댓글 전송에 실패했습니다.' : '评论发送失败'));
    } finally {
      setSendingCommentIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const submitCreateCircle = async () => {
    if (!createCircleName.trim() || !createCircleDescription.trim() || creatingCircle) {
      return;
    }
    setCreatingCircle(true);
    try {
      let iconUrl: string | undefined;
      if (createCircleIconFile) {
        const uploaded = await uploadCircleIcon(createCircleIconFile);
        iconUrl = uploaded.iconUrl;
      }
      await createCircle({
        name: createCircleName.trim(),
        description: createCircleDescription.trim(),
        icon: iconUrl,
      });
      setCreateCircleName('');
      setCreateCircleDescription('');
      setCreateCircleIconFile(null);
      setCreateCircleIconPreview('');
      setShowCreateCircleDialog(false);
      await loadCircles();
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '채널 생성에 실패했습니다' : '创建频道失败'));
    } finally {
      setCreatingCircle(false);
    }
  };

  const handleCircleIconFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    setCreateCircleIconFile(file);
    if (!file) {
      setCreateCircleIconPreview('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCreateCircleIconPreview(String(reader.result ?? ''));
    };
    reader.readAsDataURL(file);
  };

  const openCircleIconPicker = () => {
    createCircleIconInputRef.current?.click();
  };

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden ${
      luxuryTheme
        ? 'bg-white/5 backdrop-blur-xl'
        : 'bg-[var(--chat-panel)]'
    }`}>
      <UnifiedHeader
        title={language === 'ko-KR' ? '채널' : '频道'}
        onOpenUserPanel={onOpenUserPanel}
        onOpenStatusPanel={onOpenStatusPanel}
        actionButton={actionMenu}
      />

      <div className={`px-4 py-3 ${luxuryTheme ? 'bg-white/5' : 'bg-[var(--card)]'}`}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
            <Input
              placeholder={language === 'ko-KR' ? '채널 검색' : '搜索频道'}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`pl-10 h-9 rounded-xl transition-all ${
                luxuryTheme
                  ? 'bg-white/5 border-white/10 text-white placeholder:text-amber-100/45 focus:border-amber-400/45 focus:bg-white/10'
                  : 'bg-[var(--input-background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {localizedChannelFilterItems.map((item) => {
              const active = channelFilter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setChannelFilter(item.value)}
                  className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition-all ${
                    active
                      ? luxuryTheme
                        ? 'bg-amber-300/14 text-amber-100 shadow-[0_10px_24px_rgba(212,175,55,0.14)]'
                        : 'bg-[var(--primary)] text-white shadow-[0_12px_24px_rgba(37,99,235,0.2)]'
                      : luxuryTheme
                        ? 'bg-white/5 text-amber-100/80 hover:bg-white/10'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 pb-24 md:pb-6">
          {loading && (
            <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
              {language === 'ko-KR' ? '채널을 불러오는 중...' : '正在加载频道...'}
            </div>
          )}

          {!loading && error && (
            <div className={`rounded-2xl border px-4 py-5 text-sm ${
              luxuryTheme
                ? 'border-red-400/20 bg-red-500/10 text-red-200'
                : 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
            }`}>
              <div>{error}</div>
              <button
                type="button"
                onClick={() => void loadCircles()}
                className={`mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  luxuryTheme
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]'
                }`}
              >
                <RefreshCw className="size-3.5" />
                {language === 'ko-KR' ? '다시 시도' : '重试加载'}
              </button>
            </div>
          )}

          {!loading && !error && filteredChannels.length === 0 && (
            <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
              {searchTerm.trim() ? (language === 'ko-KR' ? '일치하는 채널이 없습니다' : '没有找到匹配的频道') : (language === 'ko-KR' ? '채널이 없습니다' : '暂无频道')}
            </div>
          )}

          <div className={`mb-4 rounded-[28px] border p-4 ${luxuryTheme ? 'border-white/10 bg-white/[0.04]' : 'border-[var(--border)] bg-[var(--card)]'}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{language === 'ko-KR' ? '공식 섹션' : '官方板块'}</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                  {language === 'ko-KR' ? '플랫폼 차원의 내용을 따로 모아 일반 채널과 섞이지 않도록 했습니다.' : '把平台级内容单独收拢，避免和普通频道混在一起。'}
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {language === 'ko-KR' ? '공식' : '官方'}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {localizedOfficialSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    type="button"
                    className={`rounded-[24px] border p-4 text-left transition-all ${
                      luxuryTheme
                        ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                        : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--chat-hover)]'
                    }`}
                  >
                    <div className={`mb-3 flex size-11 items-center justify-center rounded-2xl ${
                      luxuryTheme
                        ? 'bg-amber-300/10 text-amber-100'
                        : 'bg-[var(--muted)] text-[var(--primary)]'
                    }`}>
                      <Icon className="size-5" />
                    </div>
                    <h4 className="text-sm font-semibold text-[var(--foreground)]">{section.title}</h4>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      {section.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
            <div className={`rounded-[28px] border p-3 ${luxuryTheme ? 'border-white/10 bg-white/[0.04]' : 'border-[var(--border)] bg-[var(--card)]'}`}>
              <div className="mb-3 flex items-center justify-between gap-3 px-2">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">{language === 'ko-KR' ? '채널 목록' : '频道目录'}</h3>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {language === 'ko-KR' ? '인기도와 참여 상태 기준으로 정렬해 채널이 많아도 빠르게 찾을 수 있습니다.' : '按热度与加入状态排序，方便在频道很多时快速定位。'}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {filteredChannels.length} {language === 'ko-KR' ? '개 결과' : '个结果'}
                </Badge>
              </div>

              <div className="space-y-3">
                {filteredChannels.map((channel) => {
                  const isPending = pendingCircleId === channel.id;
                  const isSelected = channel.id === selectedCircleId;

                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => void openCircleDetail(channel.id)}
                      className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                        isSelected
                          ? luxuryTheme
                            ? 'border-amber-300/25 bg-[linear-gradient(135deg,rgba(255,232,162,0.12),rgba(255,255,255,0.04),rgba(15,11,7,0.35))] shadow-[0_18px_36px_rgba(0,0,0,0.18)]'
                            : 'border-[var(--primary)] bg-[linear-gradient(135deg,rgba(37,99,235,0.08),rgba(255,255,255,0.96))] shadow-[0_18px_34px_rgba(37,99,235,0.12)]'
                          : luxuryTheme
                            ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                            : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--chat-hover)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`size-14 shrink-0 rounded-2xl border flex items-center justify-center overflow-hidden ${getChannelTone(channel.name, luxuryTheme)}`}>
                          {isImageIcon(channel.icon) ? (
                            <img
                              src={channel.icon}
                              alt={channel.name}
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-xl leading-none">
                              {channel.icon || '✦'}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-sm font-semibold text-[var(--foreground)] sm:text-base">
                                  {channel.name}
                                </h3>
                                {channel.hot && (
                                  <Badge className="h-5 rounded-full bg-amber-500/15 text-amber-500 border-amber-500/20">
                                    {language === 'ko-KR' ? '인기' : '热门'}
                                  </Badge>
                                )}
                                {channel.joined && (
                                  <Badge variant="secondary" className="h-5 rounded-full px-2.5 text-xs">
                                    {language === 'ko-KR' ? '참여 중' : '已加入'}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                                {channel.description}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleToggleJoin(channel.id, channel.joined);
                              }}
                              disabled={isPending}
                              className={`inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-medium transition-all sm:min-w-24 ${
                                channel.joined
                                  ? 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                                  : luxuryTheme
                                    ? 'bg-[linear-gradient(135deg,#ffe8a2_0%,#d4af37_48%,#8f6916_100%)] text-[#120d06] shadow-[0_12px_28px_rgba(212,175,55,0.18)] hover:opacity-90'
                                    : 'bg-[var(--primary)] text-white hover:opacity-90'
                              } ${isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isPending ? (
                                <span className="inline-flex items-center justify-center gap-2">
                                  <Loader2 className="size-4 animate-spin" />
                                  {language === 'ko-KR' ? '처리 중' : '处理中'}
                                </span>
                              ) : channel.joined ? (language === 'ko-KR' ? '참여 중' : '已加入') : (language === 'ko-KR' ? '참여' : '加入')}
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2.5 py-1">
                              <Users className="size-3" />
                              {channel.members.toLocaleString()} {language === 'ko-KR' ? '멤버' : '成员'}
                            </span>
                            <span className="rounded-full bg-[var(--muted)] px-2.5 py-1">
                              {channel.category}
                            </span>
                            {channel.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="rounded-full border border-[var(--border)] px-2.5 py-1">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className={`sticky top-6 flex h-[calc(100dvh-11rem)] flex-col overflow-hidden rounded-[28px] border ${
                luxuryTheme
                  ? 'border-white/10 bg-[rgba(15,11,7,0.9)] shadow-[0_30px_80px_rgba(0,0,0,0.35)]'
                  : 'border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.98))] shadow-[0_26px_70px_rgba(37,99,235,0.12)]'
              }`}>
                {selectedCircleId === null ? (
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                    <div className={`mb-4 flex size-16 items-center justify-center rounded-3xl ${
                      luxuryTheme ? 'bg-white/6 text-amber-100' : 'bg-[var(--muted)] text-[var(--primary)]'
                    }`}>
                      <Users className="size-7" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">{language === 'ko-KR' ? '채널을 선택해 자세히 보기' : '选择一个频道查看详情'}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">
                      {language === 'ko-KR' ? '왼쪽 목록은 참여 상태와 인기도 순으로 정렬되어 있습니다. 채널을 선택하면 여기서 멤버, 활동, 게시물을 안정적으로 볼 수 있습니다.' : '左侧列表已经按加入状态和热度排好顺序，点开任意频道就能在这里固定查看成员、活动和帖子，不会再因为频道变多而来回跳动。'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={`border-b px-5 py-5 ${
                      luxuryTheme
                        ? 'border-white/10 bg-white/5 backdrop-blur-xl'
                        : 'border-[var(--border)] bg-[var(--card)]'
                    }`}>
                      <div className="flex min-w-0 gap-3">
                        <div className={`size-16 shrink-0 rounded-3xl border flex items-center justify-center overflow-hidden ${selectedTone}`}>
                          {isImageIcon(selectedIcon) ? (
                            <img src={selectedIcon} alt={selectedName} className="size-full object-cover" />
                          ) : (
                            <span className="text-2xl leading-none">{selectedIcon || '✦'}</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-[var(--foreground)]">
                              {selectedName || (language === 'ko-KR' ? '불러오는 중' : '加载中')}
                            </h3>
                            {detail?.hot && (
                              <Badge className="h-5 rounded-full px-2.5 text-xs bg-amber-500/15 text-amber-500 border-amber-500/20">
                                {language === 'ko-KR' ? '인기' : '热门'}
                              </Badge>
                            )}
                            {detail?.joined && (
                              <Badge className="h-5 rounded-full px-2.5 text-xs bg-emerald-500/15 text-emerald-500 border-emerald-500/20">
                                {language === 'ko-KR' ? '참여 중' : '已加入'}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                            {detail?.description ?? selectedChannel?.description ?? (language === 'ko-KR' ? '채널 정보를 불러오는 중...' : '正在加载圈子信息...')}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {(detail?.tags ?? selectedChannel?.tags ?? []).map((tag) => (
                              <Badge key={tag} variant="secondary" className="h-6 rounded-full px-2.5 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 px-5 py-5">
                      {detailTabsContent}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <Dialog open={selectedCircleId !== null && !isDesktopLayout} onOpenChange={(open) => { if (!open) closeCircleDetail(); }}>
        <DialogContent hideCloseButton className={`!fixed !left-0 !top-0 !h-[100dvh] !w-[100vw] !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !bg-[var(--background)] !p-0 !shadow-none !flex !flex-col !gap-0 !overflow-hidden md:!left-1/2 md:!top-1/2 md:!h-[calc(100dvh-1rem)] md:!w-[min(960px,calc(100vw-1rem))] md:!translate-x-[-50%] md:!translate-y-[-50%] md:!rounded-3xl md:!border md:!shadow-2xl`}>
          <div className={`border-b px-5 py-4 md:px-6 md:py-5 ${
            luxuryTheme
              ? 'border-white/10 bg-white/5 backdrop-blur-xl'
              : 'border-[var(--border)] bg-[var(--card)]'
          }`}>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeCircleDetail}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
                >
                  <ArrowLeft className="size-5" />
                  <span className="sr-only">{language === 'ko-KR' ? '뒤로' : '返回'}</span>
                </button>
                <DialogTitle className="text-xl font-semibold text-[var(--foreground)]">
                  {language === 'ko-KR' ? '채널 상세' : '圈子详情'}
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className={`size-16 shrink-0 rounded-3xl border flex items-center justify-center overflow-hidden ${selectedTone}`}>
                  {isImageIcon(selectedIcon) ? (
                    <img src={selectedIcon} alt={selectedName} className="size-full object-cover" />
                  ) : (
                    <span className="text-2xl leading-none">{selectedIcon || '✦'}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-[var(--foreground)] md:text-lg">
                      {selectedName || (language === 'ko-KR' ? '불러오는 중' : '加载中')}
                    </h3>
                    {detail?.hot && (
                      <Badge className="h-5 rounded-full px-2.5 text-xs bg-amber-500/15 text-amber-500 border-amber-500/20">
                        {language === 'ko-KR' ? '인기' : '热门'}
                      </Badge>
                    )}
                    {detail?.joined && (
                      <Badge className="h-5 rounded-full px-2.5 text-xs bg-emerald-500/15 text-emerald-500 border-emerald-500/20">
                        {language === 'ko-KR' ? '참여 중' : '已加入'}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)] md:text-sm">
                    {detail?.description ?? selectedChannel?.description ?? (language === 'ko-KR' ? '채널 정보를 불러오는 중...' : '正在加载圈子信息...')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {(detail?.tags ?? selectedChannel?.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="h-6 rounded-full px-2.5 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

          <div className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6">
            {detailTabsContent}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreatePostDialog} onOpenChange={setShowCreatePostDialog}>
        <DialogContent className="max-w-[min(92vw,520px)] rounded-3xl">
          <DialogHeader>
            <DialogTitle>{language === 'ko-KR' ? '게시물 작성' : '发帖子'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'ko-KR' ? '게시판' : '板块'}</label>
              <select
                value={createPostBoardId}
                onChange={(event) => setCreatePostBoardId(Number(event.target.value))}
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
              >
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.nameZh}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'ko-KR' ? '제목' : '标题'}</label>
              <Input value={createPostTitle} onChange={(e) => setCreatePostTitle(e.target.value)} placeholder={language === 'ko-KR' ? '선택 사항' : '可选'} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'ko-KR' ? '내용' : '内容'}</label>
              <Textarea value={createPostContent} onChange={(e) => setCreatePostContent(e.target.value)} placeholder={language === 'ko-KR' ? '내용을 입력해 보세요...' : '说点什么...'} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={createPostAnonymous} onChange={(e) => setCreatePostAnonymous(e.target.checked)} />
              {language === 'ko-KR' ? '익명으로 게시' : '匿名发布'}
            </label>
            <button
              type="button"
              onClick={() => void submitCreatePost()}
              disabled={creatingPost}
              className="h-11 w-full rounded-xl bg-[var(--primary)] text-white disabled:opacity-60"
            >
              {creatingPost ? (language === 'ko-KR' ? '게시 중...' : '发布中...') : (language === 'ko-KR' ? '게시' : '发布')}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateCircleDialog} onOpenChange={setShowCreateCircleDialog}>
        <DialogContent className="max-w-[min(92vw,520px)] rounded-3xl">
          <DialogHeader>
            <DialogTitle>{language === 'ko-KR' ? '채널 만들기' : '创建频道'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'ko-KR' ? '이름' : '名称'}</label>
              <Input value={createCircleName} onChange={(e) => setCreateCircleName(e.target.value)} placeholder={language === 'ko-KR' ? '채널 이름' : '频道名称'} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'ko-KR' ? '소개' : '简介'}</label>
              <Textarea value={createCircleDescription} onChange={(e) => setCreateCircleDescription(e.target.value)} placeholder={language === 'ko-KR' ? '채널 소개' : '频道介绍'} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'ko-KR' ? '아바타' : '头像'}</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openCircleIconPicker}
                  className={`size-14 shrink-0 rounded-2xl border flex items-center justify-center overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98] ${getChannelTone(createCircleName || (language === 'ko-KR' ? '채널' : '频道'), luxuryTheme)}`}
                  aria-label={language === 'ko-KR' ? '채널 아바타 선택' : '选择频道头像'}
                >
                  {createCircleIconPreview ? (
                    <img src={createCircleIconPreview} alt={language === 'ko-KR' ? '채널 아바타 미리보기' : '频道头像预览'} className="size-full object-cover" />
                  ) : (
                    <Plus className="size-5" />
                  )}
                </button>
                <div className="flex-1">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {language === 'ko-KR' ? '아바타를 눌러 채널 이미지를 업로드하세요' : '点击头像上传频道图片'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {language === 'ko-KR' ? '일반적인 이미지 형식을 지원합니다' : '支持常见图片格式'}
                  </p>
                </div>
                <input
                  ref={createCircleIconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleCircleIconFileChange(e)}
                  className="hidden"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => void submitCreateCircle()}
              disabled={creatingCircle}
              className="h-11 w-full rounded-xl bg-[var(--primary)] text-white disabled:opacity-60"
            >
              {creatingCircle ? (language === 'ko-KR' ? '생성 중...' : '创建中...') : (language === 'ko-KR' ? '생성' : '创建')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
