import { ArrowLeft, ChevronRight, MessageSquare, MapPin, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import type { User as AppUser } from '../types';
import { addFriend, getMomentPosts, getPublicUser, resolveAvatarUrl, updateFriendRemark, type PostSummaryDto, type PublicUserSummaryDto } from '../lib/backend';
import { useAppLanguage } from '../lib/i18n';
import profileCover from '../../imports/profile/ink-pine-cover.jpg';
import { readStoredProfileCover } from '../lib/profileCover';
import {
  getThemeAvatarRingClass,
  getThemeChipClass,
  getThemeControlClass,
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
} from '../lib/themeStyles';

interface FriendProfilePageProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number | null;
  fallbackUser?: AppUser | null;
  onOpenChat?: (userId: number) => void;
}

export function FriendProfilePage({ isOpen, onClose, userId, fallbackUser, onOpenChat }: FriendProfilePageProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  const [profileTarget, setProfileTarget] = useState<PublicUserSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remarkSaving, setRemarkSaving] = useState(false);
  const [remarkName, setRemarkName] = useState('');
  const [moments, setMoments] = useState<PostSummaryDto[]>([]);
  const [coverImage, setCoverImage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setFriendRequestSent(false);
    if (!userId) {
      setProfileTarget(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    void getPublicUser(userId)
      .then((profile) => {
        if (!cancelled) {
          setProfileTarget(profile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfileTarget(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    void getMomentPosts()
      .then((data) => {
        if (!cancelled) {
          setMoments(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMoments([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setRemarkName(profileTarget?.remarkName ?? '');
  }, [profileTarget]);

  const targetUserId = profileTarget?.userId ?? userId ?? (fallbackUser ? Number(fallbackUser.id) : null);

  useEffect(() => {
    setCoverImage(readStoredProfileCover(targetUserId));
  }, [targetUserId]);

  const fallbackDisplayName = fallbackUser?.name ?? (language === 'ko-KR' ? '해당 사용자' : '该用户');
  const displayName = profileTarget?.nickname ?? fallbackDisplayName;
  const displayAvatar = resolveAvatarUrl(profileTarget?.avatarUrl ?? fallbackUser?.avatar, displayName);
  const displayUNumber = profileTarget?.unumber ?? fallbackUser?.uNumber ?? null;
  const displaySchool = profileTarget?.school ?? fallbackUser?.school ?? '';
  const displayMajor = profileTarget?.major ?? fallbackUser?.major ?? '';
  const displayBio = profileTarget?.bio ?? fallbackUser?.bio ?? fallbackUser?.customStatus ?? '';
  const displayLanguages = profileTarget?.languages ?? fallbackUser?.languages ?? [];
  const isFriend = profileTarget?.isFriend ?? false;
  const displayOriginalName = profileTarget?.originalNickname ?? displayName;
  const displayRemarkLabel = profileTarget?.remarkName?.trim() || (language === 'ko-KR' ? '미설정' : '未设置');
  const displayPosts = useMemo(() => {
    if (!targetUserId) {
      return [];
    }
    return moments.filter((post) => String(post.authorUserId ?? '') === String(targetUserId)).slice(0, 4);
  }, [moments, targetUserId]);

  const profileMissing = Boolean(userId) && !loading && !profileTarget && !fallbackUser;
  const mutedSurfaceClass = getThemeMutedSurfaceClass(theme);
  const panelClass = getThemePanelClass(theme);
  const headerClass = getThemeHeaderClass(theme);
  const readableTextClass = getThemeReadableTextClass(theme);
  const secondaryTextClass = getThemeSecondaryTextClass(theme);
  const shellClass = getThemeShellClass(theme);
  const overlayButtonClass = getThemeOverlayButtonClass(theme);
  const coverBottomFadeClass = getThemeCoverBottomFadeClass(theme);
  const coverTopFadeClass = getThemeCoverTopFadeClass(theme);
  const chipClass = getThemeChipClass(theme);
  const dividerClass = getThemeSectionDividerClass(theme);
  const emptyStateClass = getThemeEmptyStateClass(theme);
  const secondaryButtonClass = getThemeSecondaryButtonClass(theme);
  const primaryButtonClass = getThemePrimaryButtonClass(theme);
  const avatarRingClass = getThemeAvatarRingClass(theme);
  const controlClass = getThemeControlClass(theme);
  const pageFrameClass = 'h-[100dvh] w-full md:h-[calc(100dvh-2rem)] md:w-[min(720px,calc(100vw-2rem))]';
  const bottomBarClass = 'sticky bottom-0 z-20 shrink-0 border-t border-white/35 bg-white/92 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-xl dark:border-white/8 dark:bg-[rgba(15,11,7,0.92)]';
  const actionGridClass = 'grid grid-cols-1 gap-3 min-[380px]:grid-cols-2';

  const handleAddFriend = async () => {
    if (!targetUserId || addingFriend || isFriend) {
      return;
    }
    setAddingFriend(true);
    try {
      await addFriend(targetUserId);
      setFriendRequestSent(true);
    } finally {
      setAddingFriend(false);
    }
  };

  const handleSaveRemark = async () => {
    if (!profileTarget || !isFriend) {
      return;
    }
    setRemarkSaving(true);
    try {
      const updated = await updateFriendRemark(profileTarget.userId, remarkName.trim());
      setProfileTarget((current) =>
        current
          ? {
              ...current,
              nickname: updated.nickname,
              originalNickname: updated.originalNickname,
              remarkName: updated.remarkName,
              isFriend: true,
            }
          : current,
      );
      window.dispatchEvent(new Event('sw-friend-remark-updated'));
      setRemarkOpen(false);
    } finally {
      setRemarkSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`fixed inset-0 z-[60] flex justify-center bg-black/45 md:px-4 md:py-4 ${readableTextClass}`}
        >
          <div className={`relative flex min-h-0 flex-col overflow-y-auto overscroll-y-contain md:rounded-[28px] md:shadow-[0_28px_80px_rgba(15,23,42,0.32)] ${pageFrameClass} ${shellClass}`}>
            <section className="relative shrink-0 overflow-hidden">
              <img src={coverImage || profileCover} alt="" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_58%,rgba(0,0,0,0.08)_100%)]" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-8">
                <button type="button" onClick={onClose} aria-label={language === 'ko-KR' ? '이전 프로필로 돌아가기' : '返回资料页上一层'} title={language === 'ko-KR' ? '返回' : '返回'} className={`flex size-10 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition-transform active:scale-95 ${overlayButtonClass}`}>
                  <ArrowLeft className="size-5" />
                </button>
              </div>
              <div className={`h-[clamp(11rem,26vh,14rem)] ${coverBottomFadeClass}`} />
            </section>

            <section className="relative -mt-16 px-4 pb-5 pt-5 min-[380px]:-mt-20 min-[380px]:pt-6">
              <div className={`pointer-events-none absolute inset-x-0 -top-20 h-40 ${coverTopFadeClass}`} />

              <div className={`relative z-10 rounded-[28px] px-4 pb-6 pt-6 min-[380px]:px-5 min-[380px]:pt-7 ${panelClass}`}>
                {profileMissing && (
                  <div className={`mb-4 rounded-[18px] px-4 py-3 text-sm shadow-sm ${mutedSurfaceClass}`}>
                    {language === 'ko-KR' ? '사용자 프로필을 찾을 수 없습니다' : '未找到该用户资料'}
                  </div>
                )}

                {loading && !fallbackUser && (
                  <div className={`mb-4 rounded-[18px] px-4 py-3 text-sm ${mutedSurfaceClass}`}>
                    {language === 'ko-KR' ? '프로필을 불러오는 중...' : '加载资料中...'}
                  </div>
                )}

                <div className="flex items-start gap-3 min-[380px]:gap-3.5">
                  <Avatar className={`size-20 shadow-lg ${avatarRingClass}`}>
                    <AvatarImage src={displayAvatar} alt={displayName} />
                    <AvatarFallback>{displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className={`min-w-0 break-words text-[1.3rem] font-semibold leading-tight min-[380px]:text-[1.45rem] md:text-[1.65rem] ${readableTextClass}`}>{displayName}</h1>
                    </div>
                    <p className={`mt-1 text-xs leading-5 md:text-sm ${secondaryTextClass}`}>{language === 'ko-KR' ? '계정' : '账号'}：{displayUNumber ?? (language === 'ko-KR' ? '비공개' : '未公开')}</p>
                    <p className={`mt-1 text-xs leading-5 md:text-sm ${readableTextClass}`}>{isFriend ? (language === 'ko-KR' ? '친구 프로필' : '好友资料') : (language === 'ko-KR' ? '공개 프로필' : '公开资料')}</p>
                    {isFriend && (
                      <button
                        type="button"
                        onClick={() => setRemarkOpen(true)}
                        className={`mt-2 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1 text-left text-xs ${mutedSurfaceClass}`}
                      >
                        <span className={secondaryTextClass}>{language === 'ko-KR' ? '메모' : '备注'}</span>
                        <span className={`truncate ${readableTextClass}`}>{displayRemarkLabel}</span>
                        <span className={secondaryTextClass}>·</span>
                        <span className={`truncate ${secondaryTextClass}`}>{displayOriginalName}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className={`mt-5 rounded-[20px] px-4 py-3 ${mutedSurfaceClass}`}>
                  <div className="flex items-center gap-2">
                    <MapPin className={`size-4 ${secondaryTextClass}`} />
                    <span className={`text-xs font-semibold ${secondaryTextClass}`}>{language === 'ko-KR' ? '학교 / 전공' : '学校 / 专业'}</span>
                  </div>
                  <p className={`mt-2 text-sm font-medium ${readableTextClass}`}>{displaySchool || (language === 'ko-KR' ? '학교 정보 없음' : '未填写学校')}</p>
                  <p className={`mt-1 text-sm ${secondaryTextClass}`}>{displayMajor || (language === 'ko-KR' ? '전공 정보 없음' : '未填写专业')}</p>
                </div>

                <div className={`mt-3 rounded-[20px] px-4 py-3 ${mutedSurfaceClass}`}>
                  <p className={`text-xs font-semibold ${secondaryTextClass}`}>{language === 'ko-KR' ? '상태 메시지' : '个性签名'}</p>
                  <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${readableTextClass}`}>{displayBio || (language === 'ko-KR' ? '아직 상태 메시지가 없습니다' : '还没有留下个性签名')}</p>
                </div>

                <div className={`mt-3 rounded-[20px] px-4 py-3 ${mutedSurfaceClass}`}>
                  <p className={`text-xs font-semibold ${secondaryTextClass}`}>{language === 'ko-KR' ? '언어' : '语言'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {displayLanguages.length > 0 ? displayLanguages.map((item) => (
                      <span key={item} className={`rounded-full px-3 py-1 text-xs ${chipClass}`}>
                        {item}
                      </span>
                    )) : <span className={`text-sm ${secondaryTextClass}`}>{language === 'ko-KR' ? '미입력' : '未填写'}</span>}
                  </div>
                </div>

                <div className={`mt-6 border-t pt-5 ${dividerClass}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold md:text-sm ${readableTextClass}`}>{language === 'ko-KR' ? '최근 활동' : '最近动态'}</p>
                    <ChevronRight className={`size-5 ${secondaryTextClass}`} />
                  </div>
                  <div className="mt-4">
                    {displayPosts.length > 0 ? (
                      <div className="space-y-2">
                        {displayPosts.map((post) => (
                          <div key={post.id} className={`rounded-[18px] px-4 py-4 ${mutedSurfaceClass}`}>
                            <p className={`text-xs ${secondaryTextClass}`}>{post.boardName}</p>
                            <p className={`mt-2 line-clamp-3 break-words text-sm leading-6 ${readableTextClass}`}>{post.summary}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`rounded-[22px] border border-dashed px-4 py-6 text-center ${emptyStateClass}`}>
                        <p className={`text-sm font-medium ${readableTextClass}`}>{language === 'ko-KR' ? '아직 활동이 없습니다' : '还没有动态'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className={`${bottomBarClass} ${headerClass}`}>
              {isFriend ? (
                <div className="grid grid-cols-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChat?.(targetUserId ?? 0)}
                    disabled={!targetUserId}
                    className={`h-12 rounded-[18px] px-3 text-sm font-semibold ${secondaryButtonClass}`}
                  >
                    <MessageSquare className="size-4" />
                    {language === 'ko-KR' ? '메시지 보내기' : '发消息'}
                  </Button>
                </div>
              ) : (
                <div className={actionGridClass}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleAddFriend()}
                    disabled={!targetUserId || addingFriend || friendRequestSent}
                    className={`h-12 rounded-[18px] px-3 text-sm font-semibold ${secondaryButtonClass}`}
                  >
                    {friendRequestSent ? (language === 'ko-KR' ? '신청 완료' : '已申请') : addingFriend ? (language === 'ko-KR' ? '신청 중' : '申请中') : (language === 'ko-KR' ? '친구 추가' : '加好友')}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onOpenChat?.(targetUserId ?? 0)}
                    disabled={!targetUserId}
                    className={`h-12 rounded-[18px] px-3 text-sm font-semibold ${primaryButtonClass}`}
                  >
                    <MessageSquare className="size-4" />
                    {language === 'ko-KR' ? '메시지 보내기' : '发消息'}
                  </Button>
                </div>
              )}
            </div>

            <AnimatePresence>
              {remarkOpen && profileTarget && isFriend && (
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
                          <p className={`mt-1 text-sm font-medium ${readableTextClass}`}>{profileTarget.nickname}</p>
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
