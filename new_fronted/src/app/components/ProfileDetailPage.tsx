import { ArrowLeft, ChevronRight, Crown, Edit3, Moon, Star, SunMedium, ThumbsUp, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { User as AppUser } from '../types';
import { backendRequest, getMomentPosts, getPublicUser, resolveAvatarUrl, updateFriendRemark, updateProfile, type PostSummaryDto, type PublicUserSummaryDto, type UserProfileDto } from '../lib/backend';
import profileCover from '../../imports/profile/ink-pine-cover.jpg';
import { getPresenceMeta, type PresenceStatusId } from '../lib/presence';
import { compressProfileCoverImage, readStoredProfileCover, writeStoredProfileCover } from '../lib/profileCover';
import {
  getThemeAvatarRingClass,
  getThemeChipClass,
  getThemeCoverBottomFadeClass,
  getThemeCoverTopFadeClass,
  getThemeEmptyStateClass,
  getThemeHeaderClass,
  getThemeMutedSurfaceClass,
  getThemeOverlayButtonClass,
  getThemePanelClass,
  getThemePrimaryButtonClass,
  getThemeReadableTextClass,
  getThemeSecondaryButtonClass,
  getThemeSecondaryTextClass,
  getThemeSectionDividerClass,
  getThemeShellClass,
  getThemeSoftCardClass,
  getThemeControlClass,
  getThemePillClass,
  getThemeVipBadgeClass,
} from '../lib/themeStyles';
import { useAppLanguage } from '../lib/i18n';

interface ProfileDetailPageProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPersonalization?: () => void;
  onOpenMoments?: () => void;
  onOpenLevelCenter?: () => void;
  currentStatusId: PresenceStatusId;
  userId?: number | null;
  fallbackUser?: AppUser | null;
  onOpenChat?: (userId: number) => void;
}

export function ProfileDetailPage({ isOpen, onClose, onOpenPersonalization, onOpenMoments, onOpenLevelCenter, currentStatusId, userId, fallbackUser, onOpenChat }: ProfileDetailPageProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  const { currentUser } = useCurrentUser();
  const [profileTarget, setProfileTarget] = useState<PublicUserSummaryDto | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const user = currentUser ?? { id: '1', uNumber: 0, name: language === 'ko-KR' ? '불러오는 중' : '加载中', avatar: '', customStatus: '', level: 0, vip: false };
  const presenceMeta = getPresenceMeta(currentStatusId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarPressTimerRef = useRef<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);
  const [coverImage, setCoverImage] = useState('');
  const [moments, setMoments] = useState<PostSummaryDto[]>([]);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [avatarActionsOpen, setAvatarActionsOpen] = useState(false);
  const [avatarHistoryOpen, setAvatarHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [remarkSaving, setRemarkSaving] = useState(false);
  const [avatarHistory, setAvatarHistory] = useState<string[]>([]);
  const [nickname, setNickname] = useState(user.name);
  const [school, setSchool] = useState(user.school ?? '');
  const [major, setMajor] = useState(user.major ?? '');
  const [bio, setBio] = useState(user.bio ?? user.customStatus ?? '');
  const [languages, setLanguages] = useState((user.languages ?? []).join(', '));
  const [privacyLevel, setPrivacyLevel] = useState(user.privacyLevel ?? 'PUBLIC');
  const [remarkName, setRemarkName] = useState('');
  const activeProfileTarget = profileTarget?.userId === userId ? profileTarget : null;
  const isViewingOtherUser = userId != null && userId !== Number(user.id);
  const normalizeAvatarSrc = (src?: string | null, fallbackName?: string) => resolveAvatarUrl(src, fallbackName ?? user.name);

  useEffect(() => {
    let cancelled = false;
    if (!userId || userId === Number(user.id)) {
      setProfileTarget(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    void getPublicUser(userId).then((userProfile) => {
      if (!cancelled) {
        setProfileTarget(userProfile);
      }
    }).catch(() => {
      if (!cancelled) {
        setProfileTarget(null);
      }
    }).finally(() => {
      if (!cancelled) {
        setProfileLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId, user.uNumber]);

  useEffect(() => {
    setAvatarUrl(normalizeAvatarSrc(user.avatar, user.name));
    setAvatarHistory([]);
    setNickname(user.name);
    setSchool(user.school ?? '');
    setMajor(user.major ?? '');
    setBio(user.bio ?? user.customStatus ?? '');
    setLanguages((user.languages ?? []).join(', '));
    setPrivacyLevel(user.privacyLevel ?? 'PUBLIC');
  }, [user.avatar, user.name, user.school, user.major, user.bio, user.customStatus, user.languages, user.privacyLevel]);

  useEffect(() => {
    if (isViewingOtherUser) {
      setCoverImage(readStoredProfileCover(userId));
      return;
    }
    setCoverImage(readStoredProfileCover(user.id));
  }, [isViewingOtherUser, user.id, userId]);

  useEffect(() => {
    const ownerId = isViewingOtherUser ? userId : user.id;
    writeStoredProfileCover(coverImage, ownerId);
  }, [coverImage, isViewingOtherUser, user.id, userId]);

  useEffect(() => {
    if (!activeProfileTarget) {
      setRemarkName('');
      return;
    }
    setRemarkName(activeProfileTarget.remarkName ?? '');
  }, [activeProfileTarget]);

  useEffect(() => {
    let cancelled = false;
    void getMomentPosts().then((data) => {
      if (!cancelled) {
        setMoments(data);
      }
    }).catch(() => {
      if (!cancelled) {
        setMoments([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { scrollYProgress } = useScroll({ container: scrollContainerRef });
  const coverHeight = useTransform(scrollYProgress, [0, 0.28], ['clamp(12rem, 28vh, 15.5rem)', 'clamp(6.75rem, 16vh, 8.5rem)']);
  const coverOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0.14]);
  const coverY = useTransform(scrollYProgress, [0, 0.25], [0, -14]);
  const coverScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.97]);
  const introOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0.66]);

  const level = Math.max(0, user.level ?? 0);
  const icons: Array<{ key: string; icon: typeof Crown; className: string; title: string }> = [];
  const pushIcons = (count: number, prefix: string, icon: typeof Crown, className: string, title: string) => {
    for (let i = 0; i < count; i += 1) icons.push({ key: `${prefix}-${i}`, icon, className, title });
  };
  let remaining = level;
  pushIcons(Math.floor(remaining / 50), 'crown', Crown, 'text-[#d4a017]', language === 'ko-KR' ? '50레벨' : '50级');
  remaining %= 50;
  pushIcons(Math.floor(remaining / 30), 'sun', SunMedium, 'text-[#e5a800]', language === 'ko-KR' ? '30레벨' : '30级');
  remaining %= 30;
  pushIcons(Math.floor(remaining / 10), 'moon', Moon, 'text-[#7c9cff]', language === 'ko-KR' ? '10레벨' : '10级');
  remaining %= 10;
  pushIcons(remaining, 'star', Star, 'text-[#f0c24b]', language === 'ko-KR' ? '1레벨' : '1级');

  const ownMoments = useMemo(() => moments.filter((post) => String(post.authorUserId ?? '') === user.id), [moments, user.id]);
  const feedPosts = useMemo(() => (ownMoments.length > 0 ? ownMoments : moments).slice(0, 4), [moments, ownMoments]);
  const recentImages = useMemo(() => feedPosts.flatMap((post) => post.imageUrls.map((url) => ({ id: `${post.id}-${url}`, url }))).slice(0, 4), [feedPosts]);
  const latestTextPost = useMemo(() => feedPosts.find((post) => post.summary.trim().length > 0) ?? null, [feedPosts]);
  const totalReactions = useMemo(() => feedPosts.reduce((sum, post) => sum + post.likeCount + post.favoriteCount, 0), [feedPosts]);
  const locationText = school ? `${language === 'ko-KR' ? '거주지' : '现居'} ${school}` : (language === 'ko-KR' ? '거주지 한국·서울' : '现居 韩国·首尔');
  const statusText = presenceMeta.label;
  const fallbackDisplayName = fallbackUser?.name ?? user.name;
  const fallbackDisplayAvatar = fallbackUser?.avatar ?? user.avatar;
  const fallbackDisplayUNumber = fallbackUser?.uNumber ?? user.uNumber;
  const fallbackDisplaySchool = fallbackUser?.school ?? school;
  const fallbackDisplayMajor = fallbackUser?.major ?? major;
  const fallbackDisplayBio = fallbackUser?.bio ?? bio;
  const fallbackDisplayLanguages = fallbackUser?.languages ?? (user.languages ?? []);
  const displayName = activeProfileTarget?.nickname ?? (isViewingOtherUser ? fallbackDisplayName : user.name);
  const displayAvatar = resolveAvatarUrl(activeProfileTarget?.avatarUrl ?? fallbackDisplayAvatar, displayName || fallbackDisplayName);
  const displayUNumber = activeProfileTarget?.unumber ?? (isViewingOtherUser ? fallbackDisplayUNumber : user.uNumber);
  const displaySchool = activeProfileTarget?.school ?? (isViewingOtherUser ? fallbackDisplaySchool : school);
  const displayMajor = activeProfileTarget?.major ?? (isViewingOtherUser ? fallbackDisplayMajor : major);
  const displayBio = activeProfileTarget?.bio ?? (isViewingOtherUser ? fallbackDisplayBio : bio);
  const displayLanguages = activeProfileTarget?.languages ?? (isViewingOtherUser ? fallbackDisplayLanguages : (user.languages ?? []));
  const displayOriginalName = activeProfileTarget?.originalNickname ?? displayName;
  const displayRemarkLabel = activeProfileTarget?.remarkName?.trim() || (language === 'ko-KR' ? '미설정' : '未设置');
  const hasFallbackProfile = Boolean(fallbackUser);
  const isLoadingOtherUser = isViewingOtherUser && !activeProfileTarget && profileLoading;
  const profileLoadFailed = isViewingOtherUser && !profileLoading && !activeProfileTarget && !hasFallbackProfile;

  const openAvatarPicker = () => avatarInputRef.current?.click();
  const openCoverPicker = () => coverInputRef.current?.click();
  const startAvatarPress = () => {
    if (avatarPressTimerRef.current !== null) window.clearTimeout(avatarPressTimerRef.current);
    avatarPressTimerRef.current = window.setTimeout(() => {
      setAvatarActionsOpen(true);
      avatarPressTimerRef.current = null;
    }, 550);
  };
  const stopAvatarPress = () => {
    if (avatarPressTimerRef.current !== null) {
      window.clearTimeout(avatarPressTimerRef.current);
      avatarPressTimerRef.current = null;
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const updated = await backendRequest<UserProfileDto>('/users/profile/avatar', { method: 'PUT', body: formData });
    if (updated.avatarUrl) {
      const nextAvatarUrl = normalizeAvatarSrc(updated.avatarUrl, updated.nickname);
      setAvatarHistory((current) => {
        const previous = avatarUrl?.trim();
        const next = current.filter((item) => item !== nextAvatarUrl && item !== previous);
        return previous ? [previous, ...next].slice(0, 5) : next.slice(0, 5);
      });
      setAvatarUrl(nextAvatarUrl);
    }
    window.dispatchEvent(new Event('sw-user-profile-updated'));
  };

  const handleCoverChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const nextCover = await compressProfileCoverImage(file);
    setCoverImage(nextCover);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        nickname: nickname.trim() || user.name,
        school: school.trim(),
        major: major.trim(),
        languages: languages.split(/[,\n]/).map((item) => item.trim()).filter(Boolean),
        bio: bio.trim(),
        privacyLevel,
      });
      window.dispatchEvent(new Event('sw-user-profile-updated'));
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBio = async () => {
    await handleSaveProfile();
  };

  const handleSaveRemark = async () => {
    if (!activeProfileTarget) return;
    setRemarkSaving(true);
    try {
      const updated = await updateFriendRemark(activeProfileTarget.userId, remarkName.trim());
      setProfileTarget((current) => current ? { ...current, nickname: updated.nickname, originalNickname: updated.originalNickname, remarkName: updated.remarkName, isFriend: true } : current);
      window.dispatchEvent(new Event('sw-friend-remark-updated'));
      setRemarkOpen(false);
    } finally {
      setRemarkSaving(false);
    }
  };

  const formatFeedTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const now = new Date();
    const startOfDay = (input: Date) => new Date(input.getFullYear(), input.getMonth(), input.getDate());
    const dayDiff = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000);
    const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (dayDiff === 0) return time;
    if (dayDiff === 1) return language === 'ko-KR' ? `어제 ${time}` : `昨天 ${time}`;
    if (dayDiff === 2) return language === 'ko-KR' ? `그저께 ${time}` : `前天 ${time}`;
    return `${date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} ${time}`;
  };

  const shellClass = getThemeShellClass(theme);
  const panelClass = getThemePanelClass(theme);
  const headerClass = getThemeHeaderClass(theme);
  const mutedSurfaceClass = getThemeMutedSurfaceClass(theme);
  const pillClass = getThemePillClass(theme);
  const readableTextClass = getThemeReadableTextClass(theme);
  const secondaryTextClass = getThemeSecondaryTextClass(theme);
  const controlClass = getThemeControlClass(theme);
  const overlayButtonClass = getThemeOverlayButtonClass(theme);
  const coverBottomFadeClass = getThemeCoverBottomFadeClass(theme);
  const coverTopFadeClass = getThemeCoverTopFadeClass(theme);
  const chipClass = getThemeChipClass(theme);
  const dividerClass = getThemeSectionDividerClass(theme);
  const emptyStateClass = getThemeEmptyStateClass(theme);
  const secondaryButtonClass = getThemeSecondaryButtonClass(theme);
  const primaryButtonClass = getThemePrimaryButtonClass(theme);
  const vipBadgeClass = getThemeVipBadgeClass(theme);
  const avatarRingClass = getThemeAvatarRingClass(theme);
  const pageFrameClass = 'h-[100dvh] w-full md:h-[calc(100dvh-2rem)] md:w-[min(720px,calc(100vw-2rem))]';
  const bottomBarClass = 'sticky bottom-0 z-20 shrink-0 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]';
  const actionGridClass = 'grid grid-cols-1 gap-3 min-[380px]:grid-cols-2';

  return (
    <AnimatePresence>
      {isOpen && (
        isLoadingOtherUser ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/25 ${readableTextClass}`}
          >
            <div className={`rounded-[24px] px-5 py-4 ${panelClass}`}>{language === 'ko-KR' ? '프로필을 불러오는 중...' : '加载资料中...'}</div>
          </motion.div>
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`fixed inset-0 z-[60] flex justify-center bg-black/25 md:px-4 md:py-4 ${readableTextClass}`}
        >
          <div ref={scrollContainerRef} className={`relative flex min-h-0 flex-col overflow-y-auto overscroll-y-contain md:rounded-[28px] md:shadow-2xl ${pageFrameClass} ${shellClass}`}>
            <motion.section style={{ height: coverHeight, opacity: coverOpacity, y: coverY, scale: coverScale }} className="relative shrink-0 origin-top overflow-hidden">
              <img src={coverImage || profileCover} alt="" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_58%,rgba(0,0,0,0.08)_100%)]" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-8">
                <button type="button" onClick={onClose} className={`flex size-10 items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-95 ${overlayButtonClass}`}>
                  <ArrowLeft className="size-5" />
                </button>
                {!isViewingOtherUser && (
                  <button type="button" onClick={openCoverPicker} className={`rounded-full px-3 py-2 text-xs font-medium backdrop-blur-md transition-transform active:scale-95 ${overlayButtonClass}`}>
                    {language === 'ko-KR' ? '배경 변경' : '更换背景'}
                  </button>
                )}
              </div>
              <div className={`absolute inset-x-0 bottom-0 h-24 ${coverBottomFadeClass}`} />
            </motion.section>

            <section className="relative -mt-16 px-4 pb-5 pt-5 min-[380px]:-mt-20 min-[380px]:pt-6">
              <div className={`pointer-events-none absolute inset-x-0 -top-20 h-40 ${coverTopFadeClass}`} />
              <motion.div style={{ opacity: coverOpacity }} className="absolute -top-6 right-6 z-30">
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-md ${chipClass}`}>
                  <ThumbsUp className="size-4" />
                  <span className="text-xs font-semibold leading-none">{totalReactions}</span>
                </div>
              </motion.div>

              <div className={`relative z-10 min-h-[270px] rounded-[28px] px-4 pb-6 pt-6 min-[380px]:px-5 min-[380px]:pt-7 ${panelClass}`}>
                {profileLoadFailed && (
                  <div className={`mb-4 rounded-[18px] px-4 py-3 text-sm ${mutedSurfaceClass}`}>
                    {language === 'ko-KR' ? '사용자 프로필을 찾을 수 없습니다' : '未找到该用户资料'}
                  </div>
                )}
                <motion.div style={{ opacity: introOpacity }} className="flex items-start gap-3 min-[380px]:gap-3.5">
                  <button type="button" onClick={() => setAvatarPreviewOpen(true)} className="group shrink-0">
                    <Avatar className={`size-20 shadow-lg transition-transform duration-200 group-active:scale-95 ${avatarRingClass}`}>
                      <AvatarImage src={displayAvatar} alt={displayName} />
                      <AvatarFallback>{displayName[0]}</AvatarFallback>
                    </Avatar>
                  </button>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className={`min-w-0 break-words text-[1.3rem] font-semibold leading-tight min-[380px]:text-[1.45rem] md:text-[1.65rem] ${readableTextClass}`}>{displayName}</h1>
                      {(activeProfileTarget ? Boolean(activeProfileTarget.email) : user.vip) && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${vipBadgeClass}`}><Crown className="size-3" />VIP</span>}
                    </div>
                    <p className={`mt-1 text-xs leading-5 md:text-sm ${secondaryTextClass}`}>{language === 'ko-KR' ? '계정' : '账号'}：{displayUNumber || '-'}</p>
                    <p className={`mt-1 text-xs leading-5 md:text-sm ${readableTextClass}`}>{activeProfileTarget ? (language === 'ko-KR' ? '친구 프로필' : '好友资料') : statusText}</p>
                    {activeProfileTarget && (
                      <button
                        type="button"
                        onClick={() => setRemarkOpen(true)}
                        className={`mt-2 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1 text-left text-xs ${mutedSurfaceClass}`}
                      >
                        <span className={`${secondaryTextClass}`}>{language === 'ko-KR' ? '메모' : '备注'}</span>
                        <span className={`truncate ${readableTextClass}`}>{displayRemarkLabel}</span>
                        <span className={secondaryTextClass}>·</span>
                        <span className={`truncate ${secondaryTextClass}`}>{displayOriginalName}</span>
                      </button>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-0.5">
                      {icons.map((item) => {
                        const Icon = item.icon;
                        return <span key={item.key} title={item.title} className={`inline-flex items-center justify-center ${item.className}`}><Icon className="size-4" strokeWidth={2} /></span>;
                      })}
                    </div>
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </motion.div>

                <button type="button" onClick={() => onOpenLevelCenter?.()} className={`mt-5 flex w-full items-center justify-between rounded-[20px] px-4 py-3 text-left ${mutedSurfaceClass}`}>
                  <div>
                    <span className={`text-xs font-semibold md:text-sm ${secondaryTextClass}`}>{displaySchool ? `${language === 'ko-KR' ? '거주지' : '现居'} ${displaySchool}` : locationText}</span>
                    <p className={`mt-1 text-sm font-medium ${readableTextClass}`}>{language === 'ko-KR' ? '현재 경험치' : '当前经验'} {currentUser?.experience ?? 0} EXP</p>
                  </div>
                  <ChevronRight className={`size-5 ${secondaryTextClass}`} />
                </button>

                <div className={`mt-3 rounded-[20px] px-4 py-3 ${mutedSurfaceClass}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-xs font-semibold ${secondaryTextClass}`}>{language === 'ko-KR' ? '상태 메시지' : '个性签名'}</span>
                    <Edit3 className={`size-4.5 ${secondaryTextClass}`} />
                  </div>
                  {isViewingOtherUser ? (
                    <p className={`whitespace-pre-wrap text-sm leading-6 ${readableTextClass}`}>{displayBio || (language === 'ko-KR' ? '아직 상태 메시지가 없습니다' : '还没有留下个性签名')}</p>
                  ) : (
                    <textarea
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      onBlur={() => void handleSaveBio()}
                      placeholder={language === 'ko-KR' ? '여기에 상태 메시지를 입력해 주세요' : '在这里写下你的个性签名'}
                      className={`min-h-20 w-full resize-none rounded-[14px] border-0 bg-transparent p-0 text-sm leading-6 outline-none ${readableTextClass}`}
                    />
                  )}
                </div>

                <button type="button" onClick={() => onOpenMoments?.()} className={`mt-6 w-full border-t pt-5 text-left ${dividerClass}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold md:text-sm ${readableTextClass}`}>{language === 'ko-KR' ? '최근 활동' : '最近动态'}</p>
                    <ChevronRight className={`size-5 ${secondaryTextClass}`} />
                  </div>
                  <div className="mt-4">
                    {recentImages.length > 0 ? (
                      <div className={`grid gap-2 ${recentImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {recentImages.map((image) => (
                          <div key={image.id} className={`overflow-hidden rounded-[18px] ${mutedSurfaceClass}`}>
                            <img src={image.url} alt="" className="aspect-square size-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : latestTextPost ? (
                      <div className={`rounded-[18px] px-4 py-4 ${mutedSurfaceClass}`}>
                        <p className={`text-xs ${secondaryTextClass}`}>{formatFeedTime(latestTextPost.createdAt)} · {latestTextPost.boardName}</p>
                        <p className={`mt-2 line-clamp-3 break-words text-sm leading-6 ${readableTextClass}`}>{latestTextPost.summary}</p>
                      </div>
                    ) : (
                      <div className={`rounded-[22px] border border-dashed px-4 py-6 text-center ${emptyStateClass}`}>
                        <p className={`text-sm font-medium ${readableTextClass}`}>{language === 'ko-KR' ? '아직 활동이 없습니다' : '还没有动态'}</p>
                        <p className={`mt-1 text-xs ${secondaryTextClass}`}>{language === 'ko-KR' ? '첫 게시물을 올리면 홈이 더 생동감 있게 보여요.' : '发一条内容，主页就会活起来。'}</p>
                      </div>
                    )}
                  </div>
                </button>
              </div>
              <div className="h-8" />
            </section>

            <div className={`${bottomBarClass} ${headerClass}`}>
              <div className={actionGridClass}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (isViewingOtherUser && profileTarget) {
                      onOpenChat?.(profileTarget.userId);
                    } else {
                      setEditOpen(true);
                    }
                  }}
                  className={`h-12 rounded-[18px] px-3 text-sm font-semibold ${secondaryButtonClass}`}
                >
                  {isViewingOtherUser ? (language === 'ko-KR' ? '메시지 보내기' : '发消息') : (language === 'ko-KR' ? '프로필 편집' : '编辑资料')}
                </Button>
                <Button type="button" onClick={() => (isViewingOtherUser ? setRemarkOpen(true) : onOpenMoments?.())} className={`h-12 rounded-[18px] px-3 text-sm font-semibold ${primaryButtonClass}`}>
                  {isViewingOtherUser ? (language === 'ko-KR' ? '메모 설정' : '设置备注') : (language === 'ko-KR' ? '메시지' : '发消息')}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {editOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[85] bg-black/35 px-4 py-6" onClick={() => setEditOpen(false)}>
                  <motion.div initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 22, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="mx-auto flex h-full w-full max-w-[min(720px,100%)] items-end" onClick={(event) => event.stopPropagation()}>
                    <div className={`w-full rounded-[28px] p-4 shadow-2xl ${panelClass}`}>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold">{language === 'ko-KR' ? '프로필 편집' : '编辑资料'}</h3>
                        <button type="button" onClick={() => setEditOpen(false)} className={secondaryTextClass}><X className="size-5" /></button>
                      </div>
                      <div className="space-y-3">
                        <button type="button" onClick={() => setAvatarPreviewOpen(true)} className={`flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left ${mutedSurfaceClass}`}>
                          <Avatar className="size-12"><AvatarImage src={displayAvatar} alt={displayName} /><AvatarFallback>{displayName[0]}</AvatarFallback></Avatar>
                          <div className="min-w-0 flex-1"><p className={`text-sm font-medium ${readableTextClass}`}>{language === 'ko-KR' ? '프로필 사진' : '头像'}</p><p className={`text-xs ${secondaryTextClass}`}>{language === 'ko-KR' ? '미리보기에서 길게 누르면 바꿀 수 있어요' : '点击预览后长按可更换'}</p></div>
                          <ChevronRight className={`size-5 ${secondaryTextClass}`} />
                        </button>
                        <button type="button" onClick={openCoverPicker} className={`flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left ${mutedSurfaceClass}`}>
                          <div className="size-12 overflow-hidden rounded-[14px]">
                            <img src={coverImage || profileCover} alt="" className="size-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1"><p className={`text-sm font-medium ${readableTextClass}`}>{language === 'ko-KR' ? '배경 이미지' : '背景图片'}</p><p className={`text-xs ${secondaryTextClass}`}>{language === 'ko-KR' ? '눌러서 프로필 배경을 변경하세요' : '点击更换个人主页背景'}</p></div>
                          <ChevronRight className={`size-5 ${secondaryTextClass}`} />
                        </button>
                        <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder={language === 'ko-KR' ? '닉네임' : '昵称'} className={`h-12 w-full rounded-[16px] px-4 outline-none ${controlClass}`} />
                        <textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder={language === 'ko-KR' ? '상태 메시지 / 소개' : '状态签名 / 个性签名'} className={`min-h-24 w-full rounded-[16px] px-4 py-3 outline-none ${controlClass}`} />
                        <input value={school} onChange={(event) => setSchool(event.target.value)} placeholder={language === 'ko-KR' ? '학교' : '学校'} className={`h-12 w-full rounded-[16px] px-4 outline-none ${controlClass}`} />
                        <input value={isViewingOtherUser ? displayMajor : major} onChange={(event) => setMajor(event.target.value)} placeholder={language === 'ko-KR' ? '전공' : '专业'} className={`h-12 w-full rounded-[16px] px-4 outline-none ${controlClass}`} />
                        <input value={isViewingOtherUser ? displayLanguages.join(', ') : languages} onChange={(event) => setLanguages(event.target.value)} placeholder={language === 'ko-KR' ? '언어, 쉼표로 구분' : '语言，逗号分隔'} className={`h-12 w-full rounded-[16px] px-4 outline-none ${controlClass}`} />
                        <select value={privacyLevel} onChange={(event) => setPrivacyLevel(event.target.value)} className={`h-12 w-full rounded-[16px] px-4 outline-none ${controlClass}`}>
                          <option value="PUBLIC">{language === 'ko-KR' ? '공개' : '公开'}</option>
                          <option value="FRIENDS">{language === 'ko-KR' ? '친구만' : '仅好友'}</option>
                          <option value="PRIVATE">{language === 'ko-KR' ? '비공개' : '私密'}</option>
                        </select>
                      </div>
                      <Button type="button" onClick={() => void handleSaveProfile()} disabled={saving} className={`mt-4 h-12 w-full rounded-[18px] ${primaryButtonClass}`}>
                        {saving ? (language === 'ko-KR' ? '저장 중' : '保存中') : (language === 'ko-KR' ? '저장' : '保存')}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {remarkOpen && activeProfileTarget && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[88] bg-black/35 px-4 py-6" onClick={() => setRemarkOpen(false)}>
                  <motion.div initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 22, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="mx-auto flex h-full w-full max-w-[min(720px,100%)] items-end" onClick={(event) => event.stopPropagation()}>
                    <div className={`w-full rounded-[28px] p-4 shadow-2xl ${panelClass}`}>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold">{language === 'ko-KR' ? '메모 설정' : '设置备注'}</h3>
                        <button type="button" onClick={() => setRemarkOpen(false)} className={secondaryTextClass}><X className="size-5" /></button>
                      </div>
                      <div className="space-y-3">
                        <div className={`rounded-[18px] px-4 py-3 ${mutedSurfaceClass}`}>
                          <p className={`text-xs ${secondaryTextClass}`}>{language === 'ko-KR' ? '현재 친구' : '当前好友'}</p>
                          <p className={`mt-1 text-sm font-medium ${readableTextClass}`}>{activeProfileTarget.nickname}</p>
                          <p className={`mt-1 text-xs ${secondaryTextClass}`}>{language === 'ko-KR' ? '원래 닉네임' : '原昵称'}：{displayOriginalName}</p>
                        </div>
                        <input
                          value={remarkName}
                          onChange={(event) => setRemarkName(event.target.value)}
                          placeholder={language === 'ko-KR' ? '메모를 입력해 주세요. 비워 두면 삭제됩니다' : '请输入备注名，留空可清除'}
                          className={`h-12 w-full rounded-[16px] px-4 outline-none ${controlClass}`}
                        />
                      </div>
                      <Button type="button" onClick={() => void handleSaveRemark()} disabled={remarkSaving} className={`mt-4 h-12 w-full rounded-[18px] ${primaryButtonClass}`}>
                        {remarkSaving ? (language === 'ko-KR' ? '저장 중' : '保存中') : (language === 'ko-KR' ? '메모 저장' : '保存备注')}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {avatarPreviewOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/35 px-4 py-6" onClick={() => setAvatarPreviewOpen(false)}>
                  <div className="mx-auto flex h-full max-w-[460px] items-center justify-center">
                    <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="relative w-full" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => setAvatarPreviewOpen(false)} className={`absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full backdrop-blur-md ${overlayButtonClass}`}><X className="size-5" /></button>
                      <div className={`overflow-hidden rounded-[28px] shadow-2xl ${getThemeSoftCardClass(theme)}`} onPointerDown={startAvatarPress} onPointerUp={stopAvatarPress} onPointerLeave={stopAvatarPress} onPointerCancel={stopAvatarPress} onContextMenu={(event) => { event.preventDefault(); setAvatarActionsOpen(true); }}>
                        <img src={avatarUrl} alt={user.name} className="block aspect-square w-full object-cover" />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {avatarActionsOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-black/30 px-4 pb-4 pt-10" onClick={() => setAvatarActionsOpen(false)}>
                  <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="mx-auto mt-auto max-w-[460px]" onClick={(event) => event.stopPropagation()}>
                    <div className={`rounded-[24px] p-3 shadow-2xl ${panelClass}`}>
                      <button type="button" className={`flex w-full items-center justify-between rounded-[18px] px-4 py-4 text-left ${mutedSurfaceClass}`} onClick={() => { setAvatarActionsOpen(false); openAvatarPicker(); }}>
                        <span className={`text-sm font-semibold ${readableTextClass}`}>{language === 'ko-KR' ? '프로필 사진 변경' : '换头像'}</span>
                        <ChevronRight className={`size-5 ${secondaryTextClass}`} />
                      </button>
                      <button type="button" className={`mt-1 flex w-full items-center justify-between rounded-[18px] px-4 py-4 text-left ${mutedSurfaceClass}`} onClick={() => { setAvatarActionsOpen(false); setAvatarHistoryOpen(true); }}>
                        <span className={`text-sm font-semibold ${readableTextClass}`}>{language === 'ko-KR' ? '최근 프로필 사진 보기' : '查看最近头像'}</span>
                        <ChevronRight className={`size-5 ${secondaryTextClass}`} />
                      </button>
                    </div>
                    <button type="button" className={`mt-3 flex h-12 w-full items-center justify-center rounded-[18px] text-sm font-semibold shadow-2xl ${secondaryButtonClass}`} onClick={() => setAvatarActionsOpen(false)}>
                      {language === 'ko-KR' ? '취소' : '取消'}
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {avatarHistoryOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] bg-black/35 px-4 py-6" onClick={() => setAvatarHistoryOpen(false)}>
                  <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="mx-auto flex h-full max-w-[460px] items-center" onClick={(event) => event.stopPropagation()}>
                    <div className={`w-full rounded-[28px] p-4 shadow-2xl ${panelClass}`}>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${readableTextClass}`}>{language === 'ko-KR' ? '최근 프로필 사진' : '最近头像'}</p>
                        <button type="button" onClick={() => setAvatarHistoryOpen(false)} className={`text-sm ${secondaryTextClass}`}>{language === 'ko-KR' ? '닫기' : '关闭'}</button>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {[avatarUrl, ...avatarHistory].slice(0, 6).map((src, index) => (
                          <button key={`${src}-${index}`} type="button" className={`overflow-hidden rounded-[18px] ${mutedSurfaceClass}`} onClick={() => { setAvatarUrl(src); setAvatarHistoryOpen(false); }}>
                            <img src={src} alt="" className="aspect-square size-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        )
      )}
    </AnimatePresence>
  );
}
