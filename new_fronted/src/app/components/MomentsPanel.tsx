import {
  ArrowLeft,
  Eye,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Send,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useTheme } from '../context/ThemeContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { canGoBackInApp, pushHistoryState, readHistoryState } from '../lib/history';
import { getThemeMomentsLayout, isLuxuryTheme } from '../lib/themeStyles';
import {
  buildAvatarUrl,
  createMomentPost,
  createPostComment,
  getMomentPosts,
  getPostDetail,
  getStoredSession,
  updatePostLike,
  PostDetailDto,
  PostSummaryDto,
} from '../lib/backend';
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useAppLanguage } from '../lib/i18n';

interface MomentsPanelProps {
  onOpenUserPanel: () => void;
}

function formatFeedTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();
  const startOfDay = (input: Date) => new Date(input.getFullYear(), input.getMonth(), input.getDate());
  const dayDiff = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000);
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (dayDiff === 0) {
    return time;
  }
  if (dayDiff === 1) {
    return `昨天 ${time}`;
  }
  if (dayDiff === 2) {
    return `前天 ${time}`;
  }

  return `${date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} ${time}`;
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

const MOMENTS_COVER_STORAGE_KEY = 'sw_moments_cover_v1';
const MOMENTS_COVER_MAX_WIDTH = 1600;
const MOMENTS_COVER_OUTPUT_QUALITY = 0.82;
const MOMENTS_VIEW_HISTORY_KEY = 'swMomentsMyView';

function getMomentsCoverStorageKey() {
  const session = getStoredSession();
  return session ? `${MOMENTS_COVER_STORAGE_KEY}:${session.userId}` : MOMENTS_COVER_STORAGE_KEY;
}

function readStoredMomentsCover() {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.localStorage.getItem(getMomentsCoverStorageKey()) ?? '';
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('封面图片读取失败'));
    image.src = src;
  });
}

async function compressCoverImage(file: File) {
  const source = await readImageFile(file);
  const image = await loadImageElement(source);
  const scale = Math.min(1, MOMENTS_COVER_MAX_WIDTH / image.width);
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    return source;
  }
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL('image/jpeg', MOMENTS_COVER_OUTPUT_QUALITY);
}

export function MomentsPanel({ onOpenUserPanel }: MomentsPanelProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  const luxuryTheme = isLuxuryTheme(theme);
  const momentsLayout = getThemeMomentsLayout(theme);
  const { currentUser } = useCurrentUser();
  const user = currentUser ?? { id: '1', name: language === 'ko-KR' ? '불러오는 중' : '加载中', avatar: '', vip: false, customStatus: '' };
  const formatMomentsTime = (value: string) => {
    const raw = formatFeedTime(value);
    if (language !== 'ko-KR') {
      return raw;
    }
    return raw.replace('昨天 ', '어제 ').replace('前天 ', '그저께 ');
  };

  const [posts, setPosts] = useState<PostSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [postDetails, setPostDetails] = useState<Record<number, PostDetailDto>>({});
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [showMyMoments, setShowMyMoments] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [sendingCommentIds, setSendingCommentIds] = useState<Set<number>>(new Set());
  const [coverImage, setCoverImage] = useState<string>(readStoredMomentsCover);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const postData = await getMomentPosts();
        if (cancelled) {
          return;
        }
        setPosts(postData);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '피드를 불러오지 못했습니다' : '动态加载失败'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const key = getMomentsCoverStorageKey();
      if (coverImage) {
        window.localStorage.setItem(key, coverImage);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch {
      setError((current) => current ?? (language === 'ko-KR' ? '커버 저장에 실패했습니다. 더 작은 이미지를 다시 시도해 주세요.' : '封面保存失败，请换一张更小的图片重试'));
    }
  }, [coverImage, language]);

  useEffect(() => {
    const currentView = readHistoryState()[MOMENTS_VIEW_HISTORY_KEY];
    if (currentView === true) {
      setShowMyMoments(true);
    }

    const handlePopState = (event: PopStateEvent) => {
      setShowMyMoments(event.state?.[MOMENTS_VIEW_HISTORY_KEY] === true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const currentAvatar = user.avatar || buildAvatarUrl(user.name);
  const totalLikes = posts.reduce((sum, post) => sum + post.likeCount, 0);
  const totalComments = posts.reduce((sum, post) => sum + post.commentCount, 0);
  const totalPosts = posts.length;

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const openCoverPicker = () => {
    coverInputRef.current?.click();
  };

  const handleImageFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) {
      return;
    }
    const availableSlots = Math.max(0, 3 - draftImages.length);
    const selectedFiles = files.slice(0, availableSlots);
    const imageData = await Promise.all(selectedFiles.map((file) => readImageFile(file)));
    setDraftImages((prev) => [...prev, ...imageData].slice(0, 3));
  };

  const removeDraftImage = (index: number) => {
    setDraftImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCoverFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      const image = await compressCoverImage(file);
      setCoverImage(image);
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '커버 설정에 실패했습니다' : '封面设置失败'));
    }
  };

  const handlePublish = async () => {
    if (!draftContent.trim() || publishing) {
      return;
    }
    setPublishing(true);
    try {
      const created = await createMomentPost({
        content: draftContent.trim(),
        imageUrls: draftImages,
      });
      setPosts((prev) => [created, ...prev]);
      setDraftContent('');
      setDraftImages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '게시에 실패했습니다' : '发布失败'));
    } finally {
      setPublishing(false);
    }
  };

  const toggleComments = async (postId: number) => {
    setExpandedPostId((current) => (current === postId ? null : postId));
    if (!postDetails[postId]) {
      try {
        const detail = await getPostDetail(postId);
        setPostDetails((prev) => ({ ...prev, [postId]: detail }));
      } catch {
        // Keep the feed usable even if detail loading fails.
      }
    }
  };

  const syncPostCount = (postId: number, updater: (post: PostSummaryDto) => PostSummaryDto) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? updater(post) : post)));
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
      setError(err instanceof Error ? err.message : (language === 'ko-KR' ? '댓글 전송에 실패했습니다' : '评论发送失败'));
    } finally {
      setSendingCommentIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const onCommentKeyDown = async (event: KeyboardEvent<HTMLInputElement>, postId: number) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await sendComment(postId);
    }
  };

  const isOwnPost = (post: PostSummaryDto) => String(post.authorUserId ?? '') === String(user.id);
  const visiblePosts = showMyMoments ? posts.filter(isOwnPost) : posts;
  const showEmpty = !loading && !error && visiblePosts.length === 0;
  const toggleMyMomentsView = () => {
    if (showMyMoments) {
      if (canGoBackInApp()) {
        window.history.back();
        return;
      }

      setShowMyMoments(false);
      return;
    }

    pushHistoryState({ [MOMENTS_VIEW_HISTORY_KEY]: true });
    setShowMyMoments(true);
  };

  return (
    <div
      className={`flex h-full flex-1 flex-col overflow-hidden ${momentsLayout.momentsShellClass}`}
    >
      <ScrollArea className="flex-1">
        <div className={`relative mx-auto max-w-2xl pb-20 md:pb-0 ${momentsLayout.momentsFeedClass}`}>
          <div
            className={`pointer-events-none absolute inset-x-0 top-40 h-72 ${
              luxuryTheme
                ? 'bg-[linear-gradient(180deg,rgba(145,112,255,0.28)_0%,rgba(145,112,255,0.16)_22%,rgba(15,11,7,0.08)_56%,rgba(15,11,7,0)_100%)]'
                : 'bg-[linear-gradient(180deg,rgba(160,122,255,0.22)_0%,rgba(160,122,255,0.14)_24%,rgba(244,248,255,0.72)_62%,rgba(244,248,255,0)_100%)]'
            }`}
          />
          <div className="relative z-10">
            <div
              className={`relative h-48 overflow-hidden md:h-56 bg-cover bg-center ${momentsLayout.momentsHeroClass}`}
              style={
                coverImage
                  ? {
                      backgroundImage: `linear-gradient(180deg,rgba(3,8,20,0.08)_0%,rgba(3,8,20,0.34)_62%,rgba(3,8,20,0.82)_100%), url("${coverImage}")`,
                    }
                  : undefined
              }
            >
              <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-white/10 blur-3xl" />
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 h-24 ${
                  luxuryTheme
                    ? 'bg-[linear-gradient(180deg,rgba(9,14,28,0)_0%,rgba(9,14,28,0.22)_40%,rgba(9,14,28,0.78)_100%)]'
                    : 'bg-[linear-gradient(180deg,rgba(244,248,255,0)_0%,rgba(244,248,255,0.14)_40%,rgba(244,248,255,0.92)_100%)]'
                }`}
              />
              <div className="absolute right-4 top-4 z-10">
                <button
                  type="button"
                  onClick={openCoverPicker}
                  aria-label={language === 'ko-KR' ? '커버 변경' : '更换封面'}
                  className="rounded-full bg-[rgba(0,0,0,0.3)] px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
                >
                  {language === 'ko-KR' ? '커버 변경' : '更换封面'}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverFile}
                />
              </div>
              {showMyMoments && (
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-5">
                  <button
                    type="button"
                    onClick={toggleMyMomentsView}
                    className="flex size-10 items-center justify-center rounded-full bg-[rgba(0,0,0,0.25)] text-white backdrop-blur-md transition-transform active:scale-95"
                    aria-label={language === 'ko-KR' ? '전체 소식으로 돌아가기' : '返回全部动态'}
                  >
                    <ArrowLeft className="size-5" />
                  </button>
                  <div className="rounded-full bg-[rgba(0,0,0,0.25)] px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                    {language === 'ko-KR' ? '내 소식' : '我的动态'}
                  </div>
                </div>
              )}
            </div>

            <div
              className={`relative z-10 -mt-16 mx-3 rounded-2xl border p-4 shadow-lg sm:mx-4 sm:p-6 ${momentsLayout.momentsComposerClass}`}
            >
                <div className="mb-5 flex items-start gap-3 sm:mb-6 sm:gap-4">
                <button
                  type="button"
                  onClick={toggleMyMomentsView}
                  className="relative overflow-visible transition-transform hover:scale-105"
                  aria-label={showMyMoments ? (language === 'ko-KR' ? '전체 소식으로 돌아가기' : '返回全部动态') : (language === 'ko-KR' ? '내 소식 보기' : '进入我的动态')}
                >
                  <Avatar
                    className={`size-16 shadow-xl ring-4 sm:size-20 ${momentsLayout.momentsProfileAvatarClass}`}
                  >
                    <AvatarImage src={currentAvatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  {user.vip && (
                    <Badge className="avatar-badge avatar-badge-bottom-right border-0 bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-0.5 text-[10px]">
                      VIP
                    </Badge>
                  )}
                </button>

                <div className="min-w-0 flex-1 pt-1 sm:pt-2">
                  <div className="mb-1.5 min-w-0 sm:mb-2">
                    <h2 className={`truncate text-lg font-bold leading-tight sm:text-xl ${momentsLayout.momentsProfileNameClass}`}>
                      {user.name}
                    </h2>
                  </div>
                  <p className={`mb-2 text-xs sm:mb-3 sm:text-sm ${momentsLayout.momentsProfileStatusClass}`}>
                    {user.customStatus || (language === 'ko-KR' ? '지금 이 순간을 가볍게 기록해 보세요.' : '新鲜动态，随手记录。')}
                  </p>
                  <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm ${momentsLayout.momentsProfileMetricClass}`}>
                    <div className="flex items-center gap-1.5">
                      <Eye className="size-4" />
                      <span>{totalPosts}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="size-4" />
                      <span>{totalComments}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Heart className="size-4" />
                      <span>{totalLikes}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-2 rounded-xl border p-3 transition-all sm:gap-3 ${momentsLayout.momentsComposerClass}`}
              >
                <Avatar className="size-8 flex-shrink-0">
                  <AvatarImage src={currentAvatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <Input
                  value={draftContent}
                  onChange={(event) => setDraftContent(event.target.value)}
                  onKeyDown={async (event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      await handlePublish();
                    }
                  }}
                  placeholder={language === 'ko-KR' ? '새로운 이야기를 공유해 보세요...' : '分享新鲜事...'}
                  className={`flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${momentsLayout.momentsComposerInputClass}`}
                />
                <button
                  type="button"
                  onClick={openImagePicker}
                  aria-label={language === 'ko-KR' ? '이미지 추가' : '添加图片'}
                  className={`rounded-lg p-1.5 transition-colors ${momentsLayout.momentsComposerIconClass}`}
                >
                  <ImageIcon className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing || !draftContent.trim()}
                  aria-label={language === 'ko-KR' ? '소식 게시' : '发布动态'}
                  className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${momentsLayout.momentsComposerIconClass}`}
                >
                  {publishing ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageFiles}
                />
              </div>

              {draftImages.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {draftImages.map((src, index) => (
                    <div key={`${src}-${index}`} className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--border)]">
                      <img src={src} alt="" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeDraftImage(index)}
                        aria-label={language === 'ko-KR' ? '이미지 제거' : '移除图片'}
                        className="absolute right-1 top-1 rounded-full bg-[rgba(0,0,0,0.5)] p-0.5 text-white backdrop-blur-sm"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-20" />
          </div>

          <div className="relative z-10 -mt-12 space-y-3">
            {loading && (
              <div className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
                {language === 'ko-KR' ? '소식을 불러오는 중...' : '正在加载动态...'}
              </div>
            )}

            {!loading && error && (
              <div className={`mx-4 rounded-2xl border px-4 py-5 text-sm ${
                luxuryTheme
                  ? 'border-red-400/20 bg-red-500/10 text-red-200'
                  : 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
              }`}>
                {error}
              </div>
            )}

            {showEmpty && (
              <div className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
                {showMyMoments ? (language === 'ko-KR' ? '아직 게시한 소식이 없습니다' : '还没有发布过动态') : (language === 'ko-KR' ? '친구 소식이 아직 없습니다' : '暂无好友动态')}
              </div>
            )}

            {visiblePosts.map((post) => {
              const detail = postDetails[post.id];
              const isLiked = likedPostIds.has(post.id);
              const avatar = post.authorAvatarUrl || buildAvatarUrl(post.authorName);
              const isMine = String(post.authorUserId ?? '') === String(user.id);

              return (
                <div
                  key={post.id}
                  className={`mx-4 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${momentsLayout.momentsCardClass}`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11 ring-2 ring-[var(--primary)]/10">
                        <AvatarImage src={avatar} alt={post.authorName} />
                        <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-base font-medium text-[var(--foreground)]">{post.authorName}</h3>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {formatMomentsTime(post.createdAt)}
                          {isMine ? (language === 'ko-KR' ? ' · 나' : ' · 我') : ''}
                        </p>
                      </div>
                    </div>
                    <button type="button" aria-label={language === 'ko-KR' ? '더 많은 작업(준비 중)' : '更多操作（暂未开放）'} disabled className="rounded-xl p-2 transition-colors hover:bg-[var(--chat-hover)] disabled:cursor-not-allowed disabled:opacity-70">
                      <MoreHorizontal className="size-5 text-[var(--muted-foreground)]" />
                    </button>
                  </div>

                  <p className="mb-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--foreground)]">
                    {post.title ? `${post.title}\n\n${post.summary}` : post.summary}
                  </p>

                  {post.imageUrls.length > 0 && (
                    <div
                      className={`mb-4 grid gap-2.5 ${
                        post.imageUrls.length === 1
                          ? 'grid-cols-1'
                          : post.imageUrls.length === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-3'
                      }`}
                    >
                      {post.imageUrls.map((imageUrl, index) => (
                        <img
                          key={`${post.id}-${index}`}
                          src={imageUrl}
                          alt=""
                          className={`w-full rounded-xl object-cover shadow-sm ${
                            post.imageUrls.length === 1 ? 'h-72' : 'h-36'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        onClick={() => toggleLike(post.id)}
                        aria-label={isLiked ? (language === 'ko-KR' ? '좋아요 취소' : '取消点赞') : (language === 'ko-KR' ? '좋아요' : '点赞')}
                        className={`flex items-center gap-2 text-sm transition-colors ${
                          isLiked ? 'text-red-500' : 'text-[var(--muted-foreground)] hover:text-red-500'
                        }`}
                      >
                        <Heart className={`size-5 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="font-medium">{post.likeCount > 0 ? post.likeCount : (language === 'ko-KR' ? '좋아요' : '赞')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleComments(post.id)}
                        aria-label={language === 'ko-KR' ? '댓글 보기' : '查看评论'}
                        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
                      >
                        <MessageCircle className="size-5" />
                        <span className="font-medium">{post.commentCount > 0 ? post.commentCount : (language === 'ko-KR' ? '댓글' : '评论')}</span>
                      </button>
                    </div>
                  </div>

                  {expandedPostId === post.id && (
                  <div
                    className={`mt-3 rounded-xl p-4 ${
                        luxuryTheme
                          ? 'border border-white/10 bg-white/5'
                          : 'border border-[var(--border)] bg-[var(--muted)]'
                      }`}
                  >
                      {!detail && (
                        <div className="py-2 text-sm text-[var(--muted-foreground)]">
                          {language === 'ko-KR' ? '댓글을 불러오는 중...' : '评论加载中...'}
                        </div>
                      )}

                      {detail && (
                        <>
                          {detail.comments.length === 0 ? (
                            <div className="py-2 text-sm text-[var(--muted-foreground)]">
                              {language === 'ko-KR' ? '아직 댓글이 없습니다. 먼저 남겨보세요.' : '暂无评论，先说点什么吧。'}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {detail.comments.map((comment) => (
                                <div key={comment.id} className="flex items-start gap-3">
                                  <Avatar className="size-8 flex-shrink-0">
                                    <AvatarImage src={comment.authorAvatarUrl || buildAvatarUrl(comment.authorName)} alt={comment.authorName} />
                                    <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-sm font-medium text-[var(--foreground)]">{comment.authorName}</span>
                                      <span className="text-[11px] text-[var(--muted-foreground)]">{formatMomentsTime(comment.createdAt)}</span>
                                    </div>
                                    <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)]">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-3 flex items-start gap-3">
                            <Avatar className="size-8 flex-shrink-0">
                              <AvatarImage src={currentAvatar} alt={user.name} />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <Input
                              value={commentDrafts[post.id] ?? ''}
                              onChange={(event) => handleCommentChange(post.id, event.target.value)}
                              onKeyDown={async (event) => onCommentKeyDown(event, post.id)}
                              placeholder={language === 'ko-KR' ? '댓글을 입력해 보세요...' : '写下评论...'}
                              className="h-9 flex-1 border-0 bg-transparent px-0 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:ring-0"
                            />
            <Button
              type="button"
              onClick={() => sendComment(post.id)}
              disabled={sendingCommentIds.has(post.id)}
              aria-label={language === 'ko-KR' ? '댓글 보내기' : '发送评论'}
              className="h-9 rounded-xl px-4 text-sm font-medium"
            >
                              {sendingCommentIds.has(post.id) ? <Loader2 className="size-4 animate-spin" /> : (language === 'ko-KR' ? '보내기' : '发送')}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mx-4 mb-8 mt-4 text-center">
              <button
                type="button"
                aria-label={language === 'ko-KR' ? '소식 더 보기' : '查看更多动态'}
                className={`w-full rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                  luxuryTheme
                    ? 'border border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10'
                    : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]'
                }`}
              >
                {language === 'ko-KR' ? '소식 더 보기' : '查看更多动态'}
            </button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
