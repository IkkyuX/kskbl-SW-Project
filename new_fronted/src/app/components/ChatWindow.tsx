import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Ban, Battery, Briefcase, Circle, Clock3, CloudRain, Coffee, Copy, Dumbbell, EyeOff, Heart, Keyboard, Menu, MessageCircleMore, Mic, MoreVertical, Music, Palmtree, Plus, Reply, Search, Send, Smile, Sparkles, SquareCheck, Sticker, Trash2, Users, X, AudioLines } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useTheme } from '../context/ThemeContext';
import { notifyUnreadIndicatorsChanged } from '../hooks/useUnreadMessageCount';
import { getThemePageFooterClass, getThemePageHeaderClass, getThemePageShellClass, isLuxuryTheme } from '../lib/themeStyles';
import { getPresenceMeta, readPresenceStatus, type PresenceStatusId } from '../lib/presence';
import {
  acceptFriendRequest,
  addFriend,
  backendRequest,
  buildAvatarUrl,
  ChatMessageDto,
  ConversationDetailDto,
  FriendDto,
  getFriends,
  getGroupMembers,
  getStoredSession,
  removeTemporaryConversationId,
  rejectFriendRequest,
  resolveAvatarUrl,
  updateGroupConversation,
  uploadGroupAvatar,
  uploadVoiceMessage,
} from '../lib/backend';
import type { User as AppUser } from '../types';
import { useAppLanguage } from '../lib/i18n';

interface ChatWindowProps {
  chatId: string;
  onBack?: () => void;
  onOpenProfile?: (userId: number, fallbackUser?: AppUser) => void;
}

const SEEDED_DIRECT_PRESENCE_STATUSES: PresenceStatusId[] = ['online', 'away', 'busy', 'dnd', 'music', 'sport', 'qme', 'invisible'];

function getSeededPresenceStatus(userId?: number | null): PresenceStatusId {
  if (typeof userId !== 'number' || !Number.isFinite(userId)) {
    return 'online';
  }
  return SEEDED_DIRECT_PRESENCE_STATUSES[Math.abs(userId) % SEEDED_DIRECT_PRESENCE_STATUSES.length];
}

function mapPresenceToUserStatus(status: PresenceStatusId | null): AppUser['status'] {
  switch (status) {
    case 'away':
    case 'out':
    case 'travel':
    case 'tired':
    case 'weather':
      return 'away';
    case 'busy':
    case 'dnd':
      return 'busy';
    case 'invisible':
      return 'offline';
    default:
      return 'online';
  }
}

function getPresenceIndicator(status: PresenceStatusId | null, language: 'zh-CN' | 'ko-KR') {
  switch (status) {
    case 'away':
      return { icon: Clock3, label: language === 'ko-KR' ? '자리 비움' : '离开', iconClass: 'text-amber-400' };
    case 'busy':
      return { icon: Ban, label: language === 'ko-KR' ? '바쁨' : '忙碌', iconClass: 'text-rose-500' };
    case 'dnd':
      return { icon: Ban, label: language === 'ko-KR' ? '방해 금지' : '请勿打扰', iconClass: 'text-rose-500' };
    case 'invisible':
      return { icon: EyeOff, label: language === 'ko-KR' ? '상대가 오프라인입니다' : '对方不在线', iconClass: 'text-slate-400' };
    case 'qme':
      return { icon: MessageCircleMore, label: language === 'ko-KR' ? '말 걸어줘' : 'Q我吧', iconClass: 'text-sky-400' };
    case 'battery':
      return { icon: Battery, label: language === 'ko-KR' ? '배터리 충전 중' : '我的电量', iconClass: 'text-emerald-400' };
    case 'music':
      return { icon: Music, label: language === 'ko-KR' ? '음악 듣는 중' : '听歌中', iconClass: 'text-violet-400' };
    case 'out':
      return { icon: Palmtree, label: language === 'ko-KR' ? '외출 중' : '出去浪', iconClass: 'text-teal-400' };
    case 'travel':
      return { icon: Briefcase, label: language === 'ko-KR' ? '여행 중' : '去旅行', iconClass: 'text-indigo-400' };
    case 'tired':
      return { icon: Coffee, label: language === 'ko-KR' ? '완전 방전' : '被掏空', iconClass: 'text-amber-500' };
    case 'sport':
      return { icon: Dumbbell, label: language === 'ko-KR' ? '운동 중' : '运动中', iconClass: 'text-orange-500' };
    case 'weather':
      return { icon: CloudRain, label: language === 'ko-KR' ? '오늘의 날씨' : '今日天气', iconClass: 'text-sky-400' };
    case 'crush':
      return { icon: Heart, label: language === 'ko-KR' ? '설레는 중' : '我crush了', iconClass: 'text-pink-400' };
    case 'love':
      return { icon: Smile, label: language === 'ko-KR' ? '사랑해' : '爱你', iconClass: 'text-rose-400' };
    case 'custom':
      return { icon: Sparkles, label: language === 'ko-KR' ? '사용자 지정' : '自定义', iconClass: 'text-fuchsia-400' };
    case 'online':
    default:
      return { icon: Circle, label: language === 'ko-KR' ? '온라인' : '在线', iconClass: 'text-emerald-400 fill-current' };
  }
}

export function ChatWindow({ chatId, onBack, onOpenProfile }: ChatWindowProps) {
  const { theme, bubbleStyle, chatFontSize } = useTheme();
  const language = useAppLanguage();
  const session = getStoredSession();
  const [conversation, setConversation] = useState<ConversationDetailDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupMembers, setGroupMembers] = useState<{ userId: number; uNumber: number; nickname: string; avatarUrl?: string | null; isAdmin: boolean }[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupAvatarFile, setGroupAvatarFile] = useState<File | null>(null);
  const [groupAvatarPreview, setGroupAvatarPreview] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordPreviewAction, setRecordPreviewAction] = useState<'send' | 'cancel' | 'text'>('send');
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<'recent' | 'smile' | 'mood' | 'love' | 'fun' | 'ai'>('recent');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(['😌', '🤣', '😭', '😋', '🥹', '😷', '😍']);
  const recordCancelRef = useRef<HTMLButtonElement | null>(null);
  const recordTextRef = useRef<HTMLButtonElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const pendingRecordActionRef = useRef<'send' | 'cancel' | 'text' | null>(null);

  const messageFontSize = Math.min(20, Math.max(14, chatFontSize));
  const isGroupChat = Boolean(conversation?.groupNumber);
  const bubbleClass = useMemo(() => {
    const map = {
      qq: 'rounded-[18px] bg-[#202616] text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)]',
      ios: 'rounded-[20px]',
      simple: 'rounded-lg',
      rounded: 'rounded-full',
    } as const;
    return map[bubbleStyle];
  }, [bubbleStyle]);
  const isDarkChatTheme = isLuxuryTheme(theme);
  const emojiCategories = useMemo(() => ({
    recent: recentEmojis,
    smile: ['🙂', '😊', '😁', '😄', '🥰', '😎', '😉', '😛', '🤗', '🤩', '🥳', '😺'],
    mood: ['😭', '🥹', '😵', '😴', '😤', '🤯', '😶', '🫠', '🤔', '😮', '🙄', '😬'],
    love: ['❤️', '💕', '💗', '💞', '💘', '💓', '😘', '😍', '🥰', '🫶', '🌹', '💌'],
    fun: ['🤣', '😹', '👀', '🙌', '🔥', '🎉', '✨', '🌈', '🍀', '🫡', '💣', '🎈'],
    ai: ['🤖', '🧠', '💡', '🚀', '🛰️', '📡', '⚡', '🪄', '🌟', '🔮', '🎯', '🛸'],
  }), [recentEmojis]);
  const emojiCategoryMeta = [
    { id: 'recent', label: language === 'ko-KR' ? '최근 사용' : '最近使用', icon: Search },
    { id: 'smile', label: language === 'ko-KR' ? '미소 이모지' : '微笑表情', icon: Smile },
    { id: 'mood', label: language === 'ko-KR' ? '감정 이모지' : '心情表情', icon: Sparkles },
    { id: 'love', label: language === 'ko-KR' ? '좋아요 이모지' : '喜欢表情', icon: Heart },
    { id: 'fun', label: language === 'ko-KR' ? '재미 이모지' : '趣味表情', icon: Sticker },
    { id: 'ai', label: language === 'ko-KR' ? 'AI 이모지' : 'AI 表情', icon: MessageCircleMore },
  ] as const;
  const activeEmojiList = emojiCategories[activeEmojiCategory];
  const recordBars = Array.from({ length: 18 }, (_, index) => 10 + Math.abs(8 - index) * 1.8);
  const recordDurationLabel = `${String(Math.floor(recordDuration / 60)).padStart(2, '0')} : ${String(recordDuration % 60).padStart(2, '0')}`;
  const directPresenceStatus = useMemo<PresenceStatusId | null>(() => {
    if (!conversation || isGroupChat) {
      return null;
    }
    return readPresenceStatus(
      conversation.participantUserId,
      getSeededPresenceStatus(conversation.participantUserId),
    );
  }, [conversation, isGroupChat]);
  const directPresenceLabel = useMemo(() => {
    if (!directPresenceStatus) {
      return '';
    }
    return directPresenceStatus === 'invisible'
      ? (language === 'ko-KR' ? '상대가 오프라인입니다' : '对方不在线')
      : getPresenceMeta(directPresenceStatus).label;
  }, [directPresenceStatus, language]);
  const directPresenceIndicator = useMemo(() => getPresenceIndicator(directPresenceStatus, language), [directPresenceStatus, language]);

  const loadConversation = async () => {
    const detail = await backendRequest<ConversationDetailDto>(`/messages/conversations/${chatId}`);
    setConversation(detail);
    setMessages(detail.messages);
    notifyUnreadIndicatorsChanged();
    if (detail.groupNumber) {
      const [members, allFriends] = await Promise.all([
        getGroupMembers(detail.id),
        getFriends(),
      ]);
      setGroupMembers(members);
      setFriends(allFriends);
      setGroupName(detail.groupName ?? detail.name);
      setGroupDescription(detail.groupDescription ?? '');
      setSelectedMemberIds(members.map((member) => member.userId));
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (!cancelled) await loadConversation();
      } catch {
        if (!cancelled) {
          setConversation(null);
          setMessages([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  useEffect(() => {
    if (!isRecording) {
      setRecordDuration(0);
      recordingStartedAtRef.current = null;
      return;
    }
    recordingStartedAtRef.current = Date.now();
    const timer = window.setInterval(() => {
      const startedAt = recordingStartedAtRef.current ?? Date.now();
      setRecordDuration(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 100);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  const stopRecordStream = useCallback(() => {
    recordStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordStreamRef.current = null;
  }, []);

  const sendVoiceBlob = useCallback(async (blob: Blob, action: 'send' | 'text') => {
    setSending(true);
    try {
      const seconds = Math.max(recordDuration, 1);
      const extension = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm';
      const voiceFile = new File([blob], `voice-message.${extension}`, { type: blob.type || 'audio/webm' });
      const uploaded = await uploadVoiceMessage(voiceFile);
      const voiceLabel = action === 'text'
        ? (language === 'ko-KR' ? `[음성 ${seconds}" · 음성을 텍스트로 바꾸는 기능은 준비 중이며 음성 메시지로 전송되었습니다]` : `[语音 ${seconds}"，转文字功能开发中，已按语音发送]`)
        : (language === 'ko-KR' ? `[음성 ${seconds}"]` : `[语音 ${seconds}"]`);
      const sent = await backendRequest<ChatMessageDto>(`/messages/conversations/${chatId}`, {
        method: 'POST',
        body: JSON.stringify({
          content: voiceLabel,
          messageType: 'VOICE',
          mediaUrl: uploaded.mediaUrl,
        }),
      });
      setMessages((prev) => [...prev, sent]);
      if (action === 'text') {
        setError(language === 'ko-KR' ? '음성을 텍스트로 변환하는 기능은 아직 준비 중이며 우선 음성 메시지로 전송했습니다.' : '转文字功能暂未开通，已先按语音消息发送。');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : (language === 'ko-KR' ? '음성 메시지 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.' : '语音消息发送失败，请稍后再试。'));
    } finally {
      setSending(false);
    }
  }, [chatId, language, recordDuration]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;
    setSending(true);
    try {
      const sent = await backendRequest<ChatMessageDto>(`/messages/conversations/${chatId}`, {
        method: 'POST',
        body: JSON.stringify({ content: inputValue.trim() }),
      });
      setMessages((prev) => [...prev, sent]);
      setInputValue('');
    } finally {
      setSending(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setInputValue((prev) => `${prev}${emoji}`);
    setRecentEmojis((prev) => [emoji, ...prev.filter((item) => item !== emoji)].slice(0, 12));
  };

  const resolveRecordActionByPoint = (clientX: number, clientY: number) => {
    const hitTest = (element: HTMLElement | null, action: 'cancel' | 'text') => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    };

    if (hitTest(recordCancelRef.current, 'cancel')) return 'cancel';
    if (hitTest(recordTextRef.current, 'text')) return 'text';
    return 'send';
  };

  const finishRecording = useCallback((action: 'send' | 'cancel' | 'text') => {
    pendingRecordActionRef.current = action;
    setIsRecording(false);
    setRecordPreviewAction('send');
    pointerIdRef.current = null;

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      return;
    }

    stopRecordStream();
    if (action === 'cancel') {
      recordChunksRef.current = [];
    }
  }, [stopRecordStream]);

  const cancelRecording = useCallback(() => {
    finishRecording('cancel');
  }, [finishRecording]);

  const handleRecordPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (isRecording || sending) return;
    pointerIdRef.current = event.pointerId;
    const target = event.currentTarget;
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
            ? 'audio/ogg;codecs=opus'
            : '';
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        recordStreamRef.current = stream;
        mediaRecorderRef.current = recorder;
        recordChunksRef.current = [];
        pendingRecordActionRef.current = null;
        recorder.ondataavailable = (mediaEvent) => {
          if (mediaEvent.data.size > 0) {
            recordChunksRef.current.push(mediaEvent.data);
          }
        };
        recorder.onstop = () => {
          const action = pendingRecordActionRef.current ?? 'cancel';
          const blobType = recorder.mimeType || recordChunksRef.current[0]?.type || 'audio/webm';
          const blob = new Blob(recordChunksRef.current, { type: blobType });
          mediaRecorderRef.current = null;
          recordChunksRef.current = [];
          pendingRecordActionRef.current = null;
          stopRecordStream();
          if (action === 'cancel' || blob.size === 0) {
            return;
          }
          void sendVoiceBlob(blob, action);
        };
        try {
          target.setPointerCapture(event.pointerId);
        } catch {
          // Ignore pointer capture failures and keep the recording state usable.
        }
        setError(null);
        setShowEmojiPanel(false);
        setRecordPreviewAction('send');
        setIsRecording(true);
        recorder.start();
      } catch (error) {
        pointerIdRef.current = null;
        stopRecordStream();
        setIsRecording(false);
        setRecordPreviewAction('send');
        setError(error instanceof Error ? error.message : (language === 'ko-KR' ? '마이크를 사용할 수 없습니다. 녹음 권한을 확인해 주세요.' : '无法使用麦克风，请检查录音权限。'));
      }
    })();
  };

  const handleRecordPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isRecording || pointerIdRef.current !== event.pointerId) return;
    setRecordPreviewAction(resolveRecordActionByPoint(event.clientX, event.clientY));
  };

  const handleRecordPointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore release failures when the browser already dropped the capture.
    }
    finishRecording(resolveRecordActionByPoint(event.clientX, event.clientY));
  };

  const handleRecordPointerCancel = () => {
    cancelRecording();
  };

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const handleWindowBlur = () => cancelRecording();
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        cancelRecording();
      }
    };
    const handlePageHide = () => cancelRecording();

    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isRecording, cancelRecording]);

  useEffect(() => () => {
    cancelRecording();
    stopRecordStream();
  }, [chatId, cancelRecording, stopRecordStream]);

  const toggleVoiceMode = () => {
    setIsVoiceMode((prev) => !prev);
    setShowEmojiPanel(false);
  };

  const toggleEmojiPanel = () => {
    setShowEmojiPanel((prev) => !prev);
    setIsVoiceMode(false);
  };

  const handleAddFriend = async () => {
    if (!conversation?.participantUserId || addingFriend) return;
    setAddingFriend(true);
    try {
      const request = await addFriend(conversation.participantUserId);
      setConversation((prev) => prev ? { ...prev, requestStatus: request.status, requestStatusLabel: request.statusLabel, requestDirection: request.direction, requestId: request.id } : prev);
    } finally {
      setAddingFriend(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!conversation?.requestId || addingFriend) return;
    setAddingFriend(true);
    try {
      const request = await acceptFriendRequest(conversation.requestId);
      removeTemporaryConversationId(conversation.id);
      setConversation((prev) => prev ? { ...prev, isFriend: true, temporary: false, requestStatus: request.status, requestStatusLabel: request.statusLabel, requestDirection: request.direction, requestId: request.id } : prev);
    } finally {
      setAddingFriend(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!conversation?.requestId || addingFriend) return;
    setAddingFriend(true);
    try {
      const request = await rejectFriendRequest(conversation.requestId);
      setConversation((prev) => prev ? { ...prev, requestStatus: request.status, requestStatusLabel: request.statusLabel, requestDirection: request.direction, requestId: request.id } : prev);
    } finally {
      setAddingFriend(false);
    }
  };

  const handleOpenProfile = () => {
    if (!conversation?.participantUserId || !onOpenProfile || isGroupChat) return;
    onOpenProfile(conversation.participantUserId, {
      id: String(conversation.participantUserId),
      name: conversation.name,
      avatar: conversation.avatarUrl ?? buildAvatarUrl(conversation.avatarSeed ?? conversation.name),
      status: mapPresenceToUserStatus(directPresenceStatus),
      customStatus: directPresenceLabel,
      uNumber: friends.find((friend) => friend.userId === conversation.participantUserId)?.unumber,
    });
  };

  const toggleMember = (userId: number) => {
    setSelectedMemberIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };

  const handleSaveGroup = async () => {
    if (!conversation?.groupNumber) return;
    let groupAvatarUrl = conversation.avatarUrl ?? null;
    if (groupAvatarFile) {
      const uploaded = await uploadGroupAvatar(groupAvatarFile);
      groupAvatarUrl = uploaded.iconUrl;
    }
    const updated = await updateGroupConversation(conversation.id, {
      groupName,
      groupDescription,
      groupAvatarUrl,
      memberUserIds: selectedMemberIds.filter((id) => !groupMembers.some((member) => member.userId === id)),
    });
    setConversation(updated);
    setMessages(updated.messages);
    setShowGroupSettings(false);
    await loadConversation();
  };

  const renderMessage = (message: ChatMessageDto, index: number) => {
    const isMine = message.isMine;
    const showTimestamp = index === 0 || messages[index - 1]?.time !== message.time;
    const trimmedContent = message.content.trim();
    const plainTextContent = trimmedContent.replace(/\uFE0F/g, '');
    const nonEmojiContent = plainTextContent
      .replace(/[\p{Extended_Pictographic}\u200D]/gu, '')
      .replace(/\s+/g, '');
    const isEmojiOnlyMessage = trimmedContent.length > 0 && nonEmojiContent.length === 0;
    return (
      <div key={message.id}>
        {showTimestamp && (
          <div className="flex justify-center my-4">
            <span className="inline-flex items-center justify-center min-w-[4.5rem] px-3 py-1 rounded-full text-xs font-medium text-[var(--foreground)] bg-white/18 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/10">
              {message.time}
            </span>
          </div>
        )}
        <div className={`group flex gap-3 mb-4 ${isMine ? 'flex-row-reverse' : ''}`}>
          <Avatar className="size-11 flex-shrink-0">
            <AvatarImage src={isMine ? buildAvatarUrl(session?.nickname ?? 'current-user') : conversation?.avatarUrl || buildAvatarUrl(conversation?.avatarSeed ?? 'friend')} alt={isMine ? (language === 'ko-KR' ? '나' : '我') : conversation?.name ?? (language === 'ko-KR' ? '상대방' : '对方')} />
            <AvatarFallback>{(isMine ? session?.nickname ?? (language === 'ko-KR' ? '나' : '我') : conversation?.name ?? (language === 'ko-KR' ? '상대방' : '对方'))[0]}</AvatarFallback>
          </Avatar>
          <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
            {!isMine && <span className="text-sm text-[var(--muted-foreground)] mb-1 px-1">{conversation?.name ?? (language === 'ko-KR' ? '상대방' : '对方')}</span>}
            <div className={`${isEmojiOnlyMessage ? 'px-4 py-3' : 'px-4 py-2.5'} ${bubbleClass} ${isMine ? 'text-white' : 'text-[var(--chat-bubble-received-text)]'}`}>
              {message.messageType === 'VOICE' && message.mediaUrl ? (
                <div className="flex min-w-[220px] max-w-[320px] flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AudioLines className="size-4.5 shrink-0" />
                    <span>{message.content || (language === 'ko-KR' ? '음성 메시지' : '语音消息')}</span>
                  </div>
                  <audio
                    controls
                    preload="metadata"
                    className="h-10 w-full"
                    src={resolveAvatarUrl(message.mediaUrl, 'voice')}
                  />
                </div>
              ) : (
                <p
                  className={`break-words ${isEmojiOnlyMessage ? 'leading-none tracking-[0.08em]' : 'leading-relaxed'}`}
                  style={{ fontSize: `${isEmojiOnlyMessage ? Math.max(26, messageFontSize + 10) : messageFontSize}px` }}
                >
                  {message.content}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-0 flex-1 flex flex-col h-full overflow-hidden ${getThemePageShellClass(theme)}`}>
      <div className={`shrink-0 min-h-[80px] px-4 py-3 flex items-center justify-between border-b border-[var(--border)] ${getThemePageHeaderClass(theme)}`}>
        <div className="flex items-center gap-2 min-w-[70px]">
          {onBack && (
            <button onClick={onBack} aria-label={language === 'ko-KR' ? '대화 목록으로 돌아가기' : '返回会话列表'} title={language === 'ko-KR' ? '대화 목록으로 돌아가기' : '返回会话列表'} className="flex items-center gap-2 active:scale-95 transition-transform text-[var(--foreground)] md:hidden">
              <ArrowLeft className="size-6" />
            </button>
          )}
        </div>
        <div className="flex-1 text-center overflow-hidden">
          <h3 className="font-medium text-lg truncate text-[var(--foreground)]">{conversation?.name ?? (language === 'ko-KR' ? '불러오는 중...' : '正在加载...')}</h3>
          {isGroupChat ? (
            <p className="text-xs text-[var(--muted-foreground)] truncate">{conversation?.groupDescription ?? (language === 'ko-KR' ? '그룹 채팅' : '群聊')}</p>
          ) : (
            directPresenceLabel && (
              <p className="inline-flex items-center justify-center gap-1.5 text-xs text-[var(--muted-foreground)] truncate">
                <directPresenceIndicator.icon className={`size-3.5 shrink-0 ${directPresenceIndicator.iconClass}`} />
                <span className="truncate">{directPresenceLabel}</span>
              </p>
            )
          )}
        </div>
        <div className="min-w-[70px] flex justify-end">
          {isGroupChat ? (
            <button onClick={() => setShowGroupSettings(true)} aria-label={language === 'ko-KR' ? '그룹 채팅 설정 열기' : '打开群聊设置'} title={language === 'ko-KR' ? '그룹 채팅 설정' : '群聊设置'} className="active:scale-95 transition-transform text-[var(--foreground)]">
              <MoreVertical className="size-7" />
            </button>
          ) : conversation && !conversation.isFriend ? (
            conversation.requestDirection === 'INCOMING' && conversation.requestStatus === 'PENDING' ? (
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => void handleRejectRequest()} disabled={addingFriend} className="h-8 rounded-lg px-3 text-xs">{language === 'ko-KR' ? '거절' : '拒绝'}</Button>
                <Button type="button" size="sm" onClick={() => void handleAcceptRequest()} disabled={addingFriend} className="h-8 rounded-lg px-3 text-xs">{language === 'ko-KR' ? '수락' : '同意'}</Button>
              </div>
            ) : (
              <Button type="button" size="sm" onClick={() => void handleAddFriend()} disabled={addingFriend} className="h-8 rounded-lg px-3 text-xs">
                {conversation.requestStatus === 'PENDING' ? (language === 'ko-KR' ? '대기 중' : '待同意') : conversation.requestStatus === 'REJECTED' ? (language === 'ko-KR' ? '다시 신청' : '重新申请') : (language === 'ko-KR' ? '친구 신청' : '申请好友')}
              </Button>
            )
          ) : (
            <button
              type="button"
              onClick={handleOpenProfile}
              aria-label={language === 'ko-KR' ? '대화 상대 프로필 열기' : '打开聊天对象个人信息'}
              title={language === 'ko-KR' ? '대화 상대 프로필' : '聊天对象资料'}
              className="active:scale-95 transition-transform text-[var(--foreground)]"
            >
              <Menu className="size-7" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 py-4 md:px-6">
        <div className="mx-auto max-w-4xl pb-4">
          {!conversation && <div className="text-sm text-[var(--muted-foreground)] px-2 py-6">{language === 'ko-KR' ? '대화 내용을 불러오는 중...' : '聊天记录加载中...'}</div>}
          {messages.map((message, index) => renderMessage(message, index))}
          <div />
        </div>
      </ScrollArea>

      <div className={`relative shrink-0 border-t border-[var(--border)] ${getThemePageFooterClass(theme)}`}>
        {error && (
          <div className="px-4 pt-3 text-sm text-rose-500">{error}</div>
        )}
        {isRecording && (
          <div className="absolute inset-0 z-20 bg-black/55 backdrop-blur-[2px]">
            <div className="flex h-full flex-col justify-end px-8 pb-8 pt-10">
              <div className="mx-auto mb-12 flex w-[220px] flex-col items-center rounded-[28px] bg-[#4a94ef] px-6 py-8 text-white shadow-[0_22px_60px_rgba(43,106,194,0.45)]">
                <div className="text-[18px] tracking-[0.3em]">{recordDurationLabel}</div>
                <div className="mt-8 flex items-end gap-2">
                  {recordBars.map((height, index) => (
                    <span
                      key={height + index}
                      className={`w-1.5 rounded-full bg-white/95 transition-all duration-150 ${recordPreviewAction === 'cancel' ? 'opacity-45' : 'opacity-100'}`}
                      style={{ height: `${recordDuration % 2 === index % 2 ? height : Math.max(8, height - 7)}px` }}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-8 flex items-center justify-between">
                <button
                  ref={recordCancelRef}
                  type="button"
                  className={`flex size-28 items-center justify-center rounded-full text-white transition-all ${recordPreviewAction === 'cancel' ? 'scale-110 bg-white/28 shadow-[0_16px_40px_rgba(255,255,255,0.16)]' : 'bg-white/16'}`}
                >
                  <X className="size-10" />
                </button>
                <button
                  ref={recordTextRef}
                  type="button"
                  className={`flex size-28 items-center justify-center rounded-full text-white transition-all ${recordPreviewAction === 'text' ? 'scale-110 bg-white/28 shadow-[0_16px_40px_rgba(255,255,255,0.16)]' : 'bg-white/16'}`}
                >
                  <span className="text-4xl font-semibold">{language === 'ko-KR' ? '글' : '文'}</span>
                </button>
              </div>

              <div className="mb-4 text-center text-[15px] text-white/90">
                {recordPreviewAction === 'cancel' ? (language === 'ko-KR' ? '손을 떼면 취소' : '松手取消') : recordPreviewAction === 'text' ? (language === 'ko-KR' ? '손을 떼면 텍스트 변환' : '松手转文字') : (language === 'ko-KR' ? '손을 떼면 전송' : '松手发送')}
              </div>
              <div className="relative -mx-8 mb-[-32px] h-48 overflow-hidden">
                <div className="absolute inset-x-[-8%] bottom-0 h-56 rounded-t-[999px] bg-[#4591f0] shadow-[0_-10px_30px_rgba(52,123,227,0.45)]" />
                <div className="absolute inset-x-0 top-8 flex justify-center">
                  <div className={`flex size-24 items-center justify-center rounded-full border-2 border-white/25 bg-[#3f8cf1] text-white transition-transform ${recordPreviewAction === 'send' ? 'scale-110' : ''}`}>
                    <Mic className="size-11" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            onClick={toggleVoiceMode}
            aria-label={isVoiceMode ? (language === 'ko-KR' ? '키보드 입력으로 전환' : '切换到键盘输入') : (language === 'ko-KR' ? '음성 입력으로 전환' : '切换到语音输入')}
            title={isVoiceMode ? (language === 'ko-KR' ? '키보드 입력' : '键盘输入') : (language === 'ko-KR' ? '음성 입력' : '语音输入')}
            className={`flex size-9 items-center justify-center rounded-full transition-all active:scale-95 ${isVoiceMode ? 'bg-[var(--primary)] text-white shadow-lg' : isDarkChatTheme ? 'text-[#f6e7c4] hover:bg-white/8' : 'text-[var(--muted-foreground)] hover:bg-[var(--chat-hover)]'}`}
          >
            {isVoiceMode ? <Keyboard className="size-5" /> : <Mic className="size-5.5" />}
          </button>
          <div className="flex-1">
            {isVoiceMode ? (
              <button
                type="button"
                onPointerDown={handleRecordPointerDown}
                onPointerMove={handleRecordPointerMove}
                onPointerUp={handleRecordPointerEnd}
                onPointerCancel={handleRecordPointerCancel}
                onLostPointerCapture={handleRecordPointerCancel}
                className={`flex h-10 w-full items-center justify-center rounded-[18px] border text-[18px] font-semibold tracking-[0.16em] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${isDarkChatTheme ? 'border-white/10 bg-white/7 text-[#f7e9c7]' : 'border-[var(--border)] bg-white text-[var(--foreground)] shadow-[0_6px_16px_rgba(15,23,42,0.05)]'} ${isRecording ? 'scale-[0.985] shadow-[0_0_0_3px_rgba(74,148,239,0.2)]' : ''}`}
                disabled={sending}
              >
                {sending ? (language === 'ko-KR' ? '전송 중...' : '发送中...') : isRecording ? (language === 'ko-KR' ? '손을 떼면 전송' : '松开 发送') : (language === 'ko-KR' ? '길게 눌러 말하기' : '按住 说话')}
              </button>
            ) : (
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setShowEmojiPanel(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={language === 'ko-KR' ? '메시지 입력' : '输入消息'}
                aria-label={language === 'ko-KR' ? '메시지 입력' : '输入消息'}
                className={`h-10 rounded-[18px] border px-4 text-[14px] ${isDarkChatTheme ? 'bg-white/5 border-white/10 text-white placeholder:text-amber-100/45' : 'bg-gray-100 dark:bg-[var(--input-background)] border-[var(--border)]'} text-[var(--foreground)]`}
                style={{ fontSize: `${Math.max(13, messageFontSize - 3)}px` }}
              />
            )}
          </div>
          <button
            type="button"
            onClick={toggleEmojiPanel}
            aria-label={showEmojiPanel ? (language === 'ko-KR' ? '이모지 패널 닫기' : '关闭表情面板') : (language === 'ko-KR' ? '이모지 패널 열기' : '打开表情面板')}
            title={showEmojiPanel ? (language === 'ko-KR' ? '이모지 패널 닫기' : '关闭表情面板') : (language === 'ko-KR' ? '이모지 패널 열기' : '打开表情面板')}
            className={`flex size-9 items-center justify-center rounded-full transition-all active:scale-95 ${showEmojiPanel ? 'bg-[var(--primary)] text-white shadow-lg' : isDarkChatTheme ? 'text-[#f6e7c4] hover:bg-white/8' : 'text-[var(--muted-foreground)] hover:bg-[var(--chat-hover)]'}`}
          >
            <Smile className="size-5.5" />
          </button>
          {inputValue.trim() ? (
            <Button type="button" onClick={() => void handleSend()} disabled={sending} aria-label={language === 'ko-KR' ? '메시지 보내기' : '发送消息'} title={language === 'ko-KR' ? '메시지 보내기' : '发送消息'} className="size-9 rounded-full p-0">
              <Send className="size-4" />
            </Button>
          ) : (
            <button
              type="button"
              aria-label={language === 'ko-KR' ? '추가 메시지 작업' : '更多消息操作'}
              title={language === 'ko-KR' ? '추가 메시지 작업' : '更多消息操作'}
              className={`flex size-9 items-center justify-center rounded-full border transition-all active:scale-95 ${isDarkChatTheme ? 'border-white/10 text-[#f6e7c4] hover:bg-white/8' : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--chat-hover)]'}`}
            >
              <Plus className="size-5.5" />
            </button>
          )}
        </div>

        {showEmojiPanel && (
          <div className={`border-t px-4 pb-5 pt-3 ${isDarkChatTheme ? 'border-white/10 bg-[rgba(24,19,14,0.98)]' : 'border-[var(--border)] bg-[#fafafa]'}`}>
            <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
              {emojiCategoryMeta.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveEmojiCategory(id)}
                  className={`flex h-11 min-w-11 items-center justify-center rounded-2xl px-3 transition-all ${activeEmojiCategory === id ? 'bg-[var(--primary)] text-white shadow-lg' : isDarkChatTheme ? 'bg-white/6 text-[#f6e7c4] hover:bg-white/10' : 'bg-white text-[var(--muted-foreground)] shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:text-[var(--foreground)]'}`}
                  aria-label={label}
                  title={label}
                >
                  <Icon className="size-5" />
                </button>
              ))}
            </div>

            <div className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
              {emojiCategoryMeta.find((item) => item.id === activeEmojiCategory)?.label}
            </div>

            <div className="grid grid-cols-7 gap-3">
              {activeEmojiList.map((emoji) => (
                <button
                  key={`${activeEmojiCategory}-${emoji}`}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className={`flex aspect-square items-center justify-center rounded-2xl text-[30px] transition-all active:scale-95 ${isDarkChatTheme ? 'bg-white/6 hover:bg-white/10' : 'bg-white shadow-[0_8px_22px_rgba(15,23,42,0.05)] hover:-translate-y-0.5'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showGroupSettings} onOpenChange={setShowGroupSettings}>
        <DialogContent className="max-h-[88vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{language === 'ko-KR' ? '그룹 채팅 설정' : '群聊设置'}</DialogTitle>
            <DialogDescription>{language === 'ko-KR' ? '그룹 이름, 아바타, 소개를 수정하고 친구를 계속 초대할 수 있습니다.' : '可修改群名称、群头像、群简介，并继续邀请好友。'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto">
            <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder={language === 'ko-KR' ? '그룹 이름' : '群名称'} />
            <Input value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} placeholder={language === 'ko-KR' ? '그룹 소개' : '群简介'} />
            <Input type="file" accept="image/*" onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setGroupAvatarFile(file);
              setGroupAvatarPreview(file ? URL.createObjectURL(file) : '');
            }} />
            {groupAvatarPreview && <img src={groupAvatarPreview} alt={language === 'ko-KR' ? '그룹 아바타 미리보기' : '群头像预览'} className="h-28 w-full rounded-xl object-cover" />}
            <div className="text-sm font-medium text-[var(--foreground)]">{language === 'ko-KR' ? '친구 초대' : '邀请好友'}</div>
            <div className="grid max-h-60 gap-2 overflow-y-auto">
              {friends.map((friend) => (
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
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">{language === 'ko-KR' ? `${selectedMemberIds.length}명의 멤버 선택됨(현재 멤버 포함)` : `已选 ${selectedMemberIds.length} 位成员（含当前成员）`}</div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowGroupSettings(false)}>{language === 'ko-KR' ? '취소' : '取消'}</Button>
            <Button onClick={() => void handleSaveGroup()}>{language === 'ko-KR' ? '저장' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
