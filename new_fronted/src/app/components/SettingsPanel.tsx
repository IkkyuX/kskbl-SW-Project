import {
  ArrowLeft,
  Bell,
  BookOpen,
  ChevronRight,
  Globe,
  HelpCircle,
  Info,
  Laptop,
  Lock,
  LogOut,
  MessageSquare,
  Shield,
  Smartphone,
  Sparkles,
  User,
  UserMinus,
  UserPlus,
  Volume2,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { useTheme, type ThemeType } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import {
  BlockedUserDto,
  NotificationDto,
  VerificationRecordDto,
  blockUser,
  buildAvatarUrl,
  formatVerificationLabel,
  getBlockedUsers,
  getLatestVerification,
  getNotifications,
  submitVerification,
  unblockUser,
  updateProfile,
} from '../lib/backend';
import {
  type LanguageCode,
  type SettingsPreferences,
  readSettingsPreferences,
  writeSettingsPreferences,
} from '../lib/settings';
import { t, useAppLanguage } from '../lib/i18n';
import { canGoBackInApp, pushHistoryState, readHistoryState } from '../lib/history';
import { isLuxuryTheme } from '../lib/themeStyles';
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { getPresenceMeta, type PresenceStatusId } from '../lib/presence';

interface SettingsPanelProps {
  onOpenUserPanel: () => void;
  onOpenProfileDetail: () => void;
  onOpenPersonalization?: () => void;
  onClose?: () => void;
  onLogout?: () => void;
  currentStatusId: PresenceStatusId;
}

type SettingsSection =
  | 'notifications'
  | 'chat'
  | 'sound'
  | 'privacy'
  | 'security'
  | 'devices'
  | 'blacklist'
  | 'language'
  | 'help'
  | 'about';

const SETTINGS_SECTION_HISTORY_KEY = 'swSettingsSection';

const BUBBLE_LABELS: Record<string, string> = {
  qq: '基础气泡',
  ios: 'iOS风格',
  simple: '简约方块',
  rounded: '萌萌圆形',
};

const PRIVACY_OPTIONS = [
  { value: 'PUBLIC', label: '公开', description: '所有人都可以查看你的资料' },
  { value: 'FRIENDS_ONLY', label: '仅好友', description: '只有好友能查看你的资料' },
  { value: 'PRIVATE', label: '私密', description: '只有你自己能查看你的资料' },
];

const VERIFICATION_TYPES = [
  { value: 'STUDENT_ID', label: '学生证' },
  { value: 'PASSPORT', label: '护照' },
  { value: 'RESIDENCE_PERMIT', label: '居留证' },
];

function getVerificationTypeLabel(value: string) {
  return VERIFICATION_TYPES.find((item) => item.value === value)?.label ?? value;
}

function playTone() {
  if (typeof window === 'undefined') {
    return;
  }
  const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  try {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 784;
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
    oscillator.stop(context.currentTime + 0.2);
  } catch {
    // Ignore audio failures in browsers that block playback.
  }
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '未记录';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getDeviceSummary() {
  if (typeof window === 'undefined') {
    return '当前设备';
  }
  const ua = window.navigator.userAgent;
  const platform = window.navigator.platform || '桌面';
  const browser =
    ua.includes('Chrome') && !ua.includes('Edg')
      ? 'Chrome'
      : ua.includes('Safari') && !ua.includes('Chrome')
      ? 'Safari'
      : ua.includes('Edg')
      ? 'Edge'
      : ua.includes('Firefox')
      ? 'Firefox'
      : '浏览器';
  return `${browser} · ${platform}`;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'verification':
      return Shield;
    case 'community':
      return MessageSquare;
    case 'match':
      return Sparkles;
    default:
      return Bell;
  }
}

function SectionShell({
  title,
  subtitle,
  onBack,
  onClose,
  theme,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onClose?: () => void;
  theme: ThemeType;
  children: ReactNode;
}) {
  const luxuryTheme = isLuxuryTheme(theme);
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`absolute inset-0 flex h-full flex-col overflow-hidden ${
        luxuryTheme ? 'bg-slate-950' : 'bg-[var(--background)]'
      }`}
    >
      <div
        className={`shrink-0 min-h-[80px] border-b border-[var(--border)] px-4 py-3 ${
          luxuryTheme
            ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-xl'
            : 'bg-[var(--card)]'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex size-10 items-center justify-center rounded-xl text-[var(--foreground)] transition-transform active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-lg font-semibold text-[var(--foreground)]">{title}</h1>
            {subtitle && <p className="truncate text-xs text-[var(--muted-foreground)]">{subtitle}</p>}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-xl text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              <X className="size-5" />
            </button>
          ) : (
            <div className="size-10" />
          )}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-[calc(100%-32px)] max-w-[320px] py-4 pb-24">{children}</div>
      </ScrollArea>
    </motion.div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  description,
  summary,
  onClick,
  theme,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  description: string;
  summary?: string;
  onClick: () => void;
  theme: ThemeType;
}) {
  const luxuryTheme = isLuxuryTheme(theme);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`w-full rounded-xl px-3 py-3 transition-all ${
        luxuryTheme ? 'hover:bg-white/5' : 'hover:bg-[var(--chat-hover)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${
            luxuryTheme ? 'bg-white/5' : 'bg-[var(--muted)]'
          }`}
        >
          <Icon className="size-5 text-[var(--primary)]" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-medium text-[var(--foreground)]">{label}</span>
            {summary && <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{summary}</span>}
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{description}</p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-[var(--muted-foreground)]" />
      </div>
    </motion.button>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--background)] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function SettingsPanel({
  onOpenUserPanel,
  onOpenProfileDetail,
  onOpenPersonalization,
  onClose,
  onLogout,
  currentStatusId,
}: SettingsPanelProps) {
  const { theme, bubbleStyle, chatFontSize, setChatFontSize } = useTheme();
  const language = useAppLanguage();
  const luxuryTheme = isLuxuryTheme(theme);
  const { currentUser } = useCurrentUser();
  const presenceMeta = getPresenceMeta(currentStatusId);
  const user = currentUser ?? {
    id: '1',
    name: t(language, 'commonLoading'),
    avatar: '',
    vip: false,
    customStatus: '',
    school: '',
    major: '',
    languages: [],
    bio: '',
    privacyLevel: 'PUBLIC',
  };
  const LANGUAGE_OPTIONS: Array<{ value: LanguageCode; label: string; description: string }> = [
    { value: 'zh-CN', label: t(language, 'languageZhLabel'), description: t(language, 'languageZhDesc') },
    { value: 'ko-KR', label: t(language, 'languageKoLabel'), description: t(language, 'languageKoDesc') },
  ];
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);
  const [prefs, setPrefs] = useState<SettingsPreferences>(() => readSettingsPreferences());
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [latestVerification, setLatestVerification] = useState<VerificationRecordDto | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const [verificationType, setVerificationType] = useState('STUDENT_ID');
  const [verificationFileUrl, setVerificationFileUrl] = useState('');
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserDto[]>([]);
  const [blockedUserInput, setBlockedUserInput] = useState('');
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState(user.privacyLevel ?? 'PUBLIC');
  const [privacySaving, setPrivacySaving] = useState(false);
  const deviceSummary = useMemo(() => getDeviceSummary(), []);
  const unreadNotificationCount = notifications.filter((item) => !item.read).length;
  const skipSectionHistoryRef = useRef(false);

  useEffect(() => {
    writeSettingsPreferences(prefs);
  }, [prefs]);

  useEffect(() => {
    setPrivacyLevel(user.privacyLevel ?? 'PUBLIC');
  }, [user.privacyLevel]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setNotificationsLoading(true);
      setVerificationLoading(true);
      setBlockedLoading(true);
      try {
        const [notificationData, verificationData, blockedData] = await Promise.all([
          getNotifications().catch(() => []),
          getLatestVerification().catch(() => null),
          getBlockedUsers().catch(() => []),
        ]);

        if (cancelled) {
          return;
        }

        setNotifications(notificationData);
        setLatestVerification(verificationData);
        setBlockedUsers(blockedData);
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
          setVerificationLoading(false);
          setBlockedLoading(false);
        }
      }
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const currentSection = readHistoryState()[SETTINGS_SECTION_HISTORY_KEY];
    if (typeof currentSection === 'string') {
      setActiveSection(currentSection as SettingsSection);
    }

    const handlePopState = (event: PopStateEvent) => {
      const nextSection = event.state?.[SETTINGS_SECTION_HISTORY_KEY];
      skipSectionHistoryRef.current = true;
      setActiveSection(typeof nextSection === 'string' ? nextSection as SettingsSection : null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (skipSectionHistoryRef.current) {
      skipSectionHistoryRef.current = false;
      return;
    }

    if (activeSection === null) {
      return;
    }

    pushHistoryState({ [SETTINGS_SECTION_HISTORY_KEY]: activeSection });
  }, [activeSection]);

  const bubbleLabel = BUBBLE_LABELS[bubbleStyle] ?? '基础气泡';
  const privacyLabel = PRIVACY_OPTIONS.find((option) => option.value === privacyLevel)?.label ?? '公开';
  const languageLabel = LANGUAGE_OPTIONS.find((option) => option.value === prefs.language)?.label ?? t(language, 'languageZhLabel');
  const verificationLabel = latestVerification ? formatVerificationLabel(latestVerification.status) : '未认证';

  const savePrivacy = async () => {
    setPrivacySaving(true);
    try {
      await updateProfile({
        nickname: user.name,
        school: user.school ?? '',
        major: user.major ?? '',
        languages: user.languages ?? [],
        bio: user.bio ?? '',
        privacyLevel,
      });
      window.dispatchEvent(new Event('sw-user-profile-updated'));
    } finally {
      setPrivacySaving(false);
    }
  };

  const submitVerificationForm = async () => {
    if (!verificationFileUrl.trim()) {
      return;
    }
    setVerificationSubmitting(true);
    try {
      const saved = await submitVerification({
        verifyType: verificationType,
        fileUrl: verificationFileUrl.trim(),
      });
      setLatestVerification(saved);
      setVerificationFileUrl('');
    } finally {
      setVerificationSubmitting(false);
    }
  };

  const addBlockedUser = async () => {
    const targetUserId = Number(blockedUserInput);
    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
      return;
    }
    setBlockedLoading(true);
    try {
      const saved = await blockUser(targetUserId);
      setBlockedUsers((prev) => [saved, ...prev.filter((item) => item.targetUserId !== saved.targetUserId)]);
      setBlockedUserInput('');
    } finally {
      setBlockedLoading(false);
    }
  };

  const removeBlockedUser = async (targetUserId: number) => {
    setBlockedLoading(true);
    try {
      await unblockUser(targetUserId);
      setBlockedUsers((prev) => prev.filter((item) => item.targetUserId !== targetUserId));
    } finally {
      setBlockedLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined' && !window.confirm('确定要退出当前账号吗？')) {
      return;
    }
    onLogout?.();
  };

  const handleSectionBack = () => {
    if (activeSection !== null && canGoBackInApp()) {
      window.history.back();
      return;
    }

    setActiveSection(null);
  };

  const renderMain = () => {
    const sections = [
      {
        title: language === 'ko-KR' ? '계정' : '账号',
        items: [
          {
            icon: User,
            label: language === 'ko-KR' ? '프로필' : '个人资料',
            description: language === 'ko-KR' ? '아바타, 닉네임, 소개 문구' : '头像、昵称、个性签名',
            summary: user.name,
            onClick: onOpenProfileDetail,
          },
          {
            icon: Smartphone,
            label: language === 'ko-KR' ? '기기 관리' : '设备管理',
            description: language === 'ko-KR' ? '현재 기기와 로그인 정보' : '当前设备与登录信息',
            summary: deviceSummary,
            onClick: () => setActiveSection('devices'),
          },
        ],
      },
      {
        title: language === 'ko-KR' ? '일반' : '通用',
        items: [
          {
            icon: Bell,
            label: t(language, 'settingsNotifications'),
            description: language === 'ko-KR' ? '메시지 알림과 수신 설정' : '消息通知与提醒偏好',
            summary: unreadNotificationCount > 0 ? (language === 'ko-KR' ? `읽지 않음 ${unreadNotificationCount}개` : `${unreadNotificationCount} 条未读`) : (language === 'ko-KR' ? '동기화됨' : '已同步'),
            onClick: () => setActiveSection('notifications'),
          },
          {
            icon: MessageSquare,
            label: t(language, 'settingsChat'),
            description: language === 'ko-KR' ? '말풍선 스타일과 메시지 글자 크기' : '气泡样式与消息字号',
            summary: `${bubbleLabel} · ${chatFontSize}px`,
            onClick: () => setActiveSection('chat'),
          },
          {
            icon: Volume2,
            label: t(language, 'settingsSound'),
            description: t(language, 'settingsSoundDesc'),
            summary: prefs.soundEnabled ? (language === 'ko-KR' ? '켜짐' : '已开启') : (language === 'ko-KR' ? '꺼짐' : '已关闭'),
            onClick: () => setActiveSection('sound'),
          },
        ],
      },
      {
        title: t(language, 'settingsSectionPrivacy'),
        items: [
          {
            icon: Lock,
            label: t(language, 'settingsPrivacy'),
            description: t(language, 'settingsPrivacyDesc'),
            summary: privacyLabel,
            onClick: () => setActiveSection('privacy'),
          },
          {
            icon: Shield,
            label: t(language, 'settingsSecurity'),
            description: t(language, 'settingsSecurityDesc'),
            summary: verificationLabel,
            onClick: () => setActiveSection('security'),
          },
          {
            icon: UserMinus,
            label: t(language, 'settingsBlacklist'),
            description: t(language, 'settingsBlacklistDesc'),
            summary: `${blockedUsers.length} 人`,
            onClick: () => setActiveSection('blacklist'),
          },
        ],
      },
      {
        title: t(language, 'settingsSectionOther'),
        items: [
          {
            icon: Globe,
            label: t(language, 'settingsLanguage'),
            description: t(language, 'settingsLanguageDesc'),
            summary: languageLabel,
            onClick: () => setActiveSection('language'),
          },
          {
            icon: HelpCircle,
            label: t(language, 'settingsHelp'),
            description: t(language, 'settingsHelpDesc'),
            summary: t(language, 'settingsSendFeedback'),
            onClick: () => setActiveSection('help'),
          },
          {
            icon: Info,
            label: t(language, 'settingsAbout'),
            description: t(language, 'settingsAboutDesc'),
            summary: '1.0.0',
            onClick: () => setActiveSection('about'),
          },
        ],
      },
    ] as const;

    return (
      <motion.div
        key="main"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`absolute inset-0 flex h-full flex-col overflow-hidden ${
        luxuryTheme ? 'bg-slate-950' : 'bg-[var(--background)]'
      }`}
    >
        <div
          className={`shrink-0 min-h-[80px] border-b border-[var(--border)] px-4 py-3 ${
            luxuryTheme
              ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-xl'
              : 'bg-[var(--card)]'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              <X className="size-5" />
            </button>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">{t(language, 'settingsTitle')}</h1>
            <button
              type="button"
              onClick={onOpenUserPanel}
              className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              <User className="size-5" />
            </button>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto w-[calc(100%-32px)] max-w-[320px] pb-24 pt-4">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4"
              onClick={onOpenUserPanel}
            >
              <div className="flex items-center gap-4">
                <Avatar className="size-16 ring-2 ring-[var(--primary)]/30">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-lg font-semibold text-[var(--foreground)]">{user.name}</h3>
                    {user.vip && (
                      <Badge className="border-0 bg-gradient-to-r from-yellow-400 to-orange-500 px-1.5 py-0 text-[10px]">
                        VIP
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-[var(--muted-foreground)]">
                    {presenceMeta.label}
                  </p>
                </div>
                <ChevronRight className="size-5 text-[var(--muted-foreground)]" />
              </div>
            </motion.div>

            {sections.map((section) => (
              <div key={section.title} className="mb-6">
                <h2 className="mb-2 px-1 text-sm font-medium text-[var(--muted-foreground)]">{section.title}</h2>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <MenuRow
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      description={item.description}
                      summary={item.summary}
                      onClick={item.onClick}
                      theme={theme}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className={`h-12 w-full rounded-[18px] border-red-200 text-red-600 hover:bg-red-50 ${
                  luxuryTheme ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20' : ''
                }`}
              >
                <LogOut className="mr-2 size-4" />
                {t(language, 'settingsLogout')}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </motion.div>
    );
  };

  const renderNotifications = () => (
    <SectionShell
      key="notifications"
      title="通知"
      subtitle="通知中心与消息提醒偏好"
      onBack={handleSectionBack}
      onClose={onClose}
      theme={theme}
    >
      <div className="space-y-4">
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <PreferenceRow
            title="消息提醒"
            description="新消息到达时保留提醒"
            checked={prefs.messageAlerts}
            onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, messageAlerts: checked }))}
          />
          <div className="mt-3">
            <PreferenceRow
              title="好友申请提醒"
              description="新朋友申请单独提醒"
              checked={prefs.friendRequestAlerts}
              onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, friendRequestAlerts: checked }))}
            />
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">真实通知</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {notificationsLoading ? '正在加载通知' : `${notifications.length} 条通知`}
              </p>
            </div>
            <Bell className="size-5 text-[var(--muted-foreground)]" />
          </div>
          <div className="space-y-3">
            {notifications.length === 0 && !notificationsLoading && (
              <div className="rounded-[18px] bg-[var(--background)] px-4 py-5 text-sm text-[var(--muted-foreground)]">
                暂时没有通知，后端推送会在这里显示。
              </div>
            )}
            {notifications.map((item) => {
              const Icon = getNotificationIcon(item.type);
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--background)] px-4 py-3"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--muted)]">
                    <Icon className="size-5 text-[var(--primary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">{item.title}</p>
                      {!item.read && (
                        <Badge className="border-0 bg-[var(--primary)] px-1.5 py-0 text-[10px] text-white">
                          未读
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.content}</p>
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SectionShell>
  );

  const renderChat = () => (
    <SectionShell
      key="chat"
      title="聊天"
      subtitle="气泡和字号会直接影响聊天窗口"
      onBack={handleSectionBack}
      onClose={onClose}
      theme={theme}
    >
      <div className="space-y-4">
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">消息字号</p>
              <p className="text-xs text-[var(--muted-foreground)]">{chatFontSize}px</p>
            </div>
            <MessageSquare className="size-5 text-[var(--muted-foreground)]" />
          </div>
          <Slider
            value={[chatFontSize]}
            min={14}
            max={20}
            step={1}
            onValueChange={(value) => setChatFontSize(value[0] ?? 16)}
          />
          <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>14px</span>
            <span>20px</span>
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">当前气泡</p>
              <p className="text-xs text-[var(--muted-foreground)]">{bubbleLabel}</p>
            </div>
            <Sparkles className="size-5 text-[var(--muted-foreground)]" />
          </div>
          <div className="rounded-[18px] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)]">
            这个气泡样式会在所有主题中生效。
          </div>
          {onOpenPersonalization && (
            <Button
              type="button"
              variant="outline"
              onClick={onOpenPersonalization}
              className="mt-3 h-11 w-full rounded-[16px]"
            >
              打开个性装扮
            </Button>
          )}
        </div>

        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">消息提示音</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {prefs.soundEnabled ? '已开启' : '已关闭'}
              </p>
            </div>
            <Switch
              checked={prefs.soundEnabled}
              onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, soundEnabled: checked }))}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (prefs.soundEnabled) {
                playTone();
              }
            }}
            className="mt-3 h-11 w-full rounded-[16px]"
          >
            播放提示音
          </Button>
        </div>
      </div>
    </SectionShell>
  );

  const renderSound = () => (
    <SectionShell
      key="sound"
      title="声音"
      subtitle="消息提示音和预览"
      onBack={handleSectionBack}
      onClose={onClose}
      theme={theme}
    >
      <div className="space-y-4">
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">消息提示音</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {prefs.soundEnabled ? '收到消息时会播放提示音' : '当前已关闭提示音'}
              </p>
            </div>
            <Switch
              checked={prefs.soundEnabled}
              onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, soundEnabled: checked }))}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (prefs.soundEnabled) {
                playTone();
              }
            }}
            className="mt-4 h-11 w-full rounded-[16px]"
          >
            播放提示音
          </Button>
        </div>
      </div>
    </SectionShell>
  );

  const renderPrivacy = () => (
    <SectionShell
      key="privacy"
      title="隐私设置"
      subtitle="控制谁能看到你的资料和动态"
      onBack={handleSectionBack}
      onClose={onClose}
      theme={theme}
    >
      <div className="space-y-4">
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">资料可见范围</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            当前设为 {privacyLabel}，保存后会同步到后端。
          </p>
          <div className="mt-4 space-y-2">
            {PRIVACY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPrivacyLevel(option.value)}
                className={`w-full rounded-[18px] border px-4 py-3 text-left transition-all ${
                  privacyLevel === option.value
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--chat-hover)]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{option.label}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{option.description}</p>
                  </div>
                  {privacyLevel === option.value && (
                    <Badge className="border-0 bg-[var(--primary)] px-2 py-0 text-[10px] text-white">
                      使用中
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
          <Button
            type="button"
            onClick={() => void savePrivacy()}
            disabled={privacySaving}
            className="mt-4 h-11 w-full rounded-[16px]"
          >
            {privacySaving ? '保存中' : '保存隐私设置'}
          </Button>
        </div>
      </div>
    </SectionShell>
  );

  const renderSecurity = () => (
    <SectionShell
      key="security"
      title="安全"
      subtitle="认证状态和资料安全"
      onBack={handleSectionBack}
      onClose={onClose}
      theme={theme}
    >
      <div className="space-y-4">
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">认证状态</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {verificationLoading ? '正在加载认证信息' : verificationLabel}
              </p>
            </div>
            <Shield className="size-5 text-[var(--muted-foreground)]" />
          </div>
          {latestVerification && (
            <div className="mt-4 rounded-[18px] bg-[var(--background)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {getVerificationTypeLabel(latestVerification.verifyType)}
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                文件地址：{latestVerification.fileUrl}
              </p>
              {latestVerification.rejectReason && (
                <p className="mt-1 text-xs text-red-500">{latestVerification.rejectReason}</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">提交新的认证</p>
          <div className="mt-3 space-y-3">
            <Select value={verificationType} onValueChange={setVerificationType}>
              <SelectTrigger className="h-11 rounded-[16px] bg-[var(--background)]">
                <SelectValue placeholder="选择认证类型" />
              </SelectTrigger>
              <SelectContent>
                {VERIFICATION_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={verificationFileUrl}
              onChange={(event) => setVerificationFileUrl(event.target.value)}
              placeholder="填写证明文件 URL"
              className="h-11 rounded-[16px] bg-[var(--background)]"
            />
            <Button
              type="button"
              onClick={() => void submitVerificationForm()}
              disabled={verificationSubmitting || !verificationFileUrl.trim()}
              className="h-11 w-full rounded-[16px]"
            >
              {verificationSubmitting ? '提交中' : '提交认证'}
            </Button>
          </div>
        </div>
      </div>
    </SectionShell>
  );

  const renderDevices = () => {
    const sessionToken = typeof window !== 'undefined' ? window.localStorage.getItem('sw_auth_token') : null;
    const maskedToken = sessionToken ? `${sessionToken.slice(0, 6)}...${sessionToken.slice(-4)}` : '未登录';

    return (
    <SectionShell
      key="devices"
      title="设备管理"
        subtitle="当前登录状态与本机信息"
        onBack={handleSectionBack}
        onClose={onClose}
        theme={theme}
      >
        <div className="space-y-4">
          <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">当前设备</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{deviceSummary}</p>
              </div>
              <Laptop className="size-5 text-[var(--muted-foreground)]" />
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-[16px] bg-[var(--background)] px-4 py-3">
                <span className="text-[var(--muted-foreground)]">登录账号</span>
                <span className="text-[var(--foreground)]">{user.name}</span>
              </div>
              <div className="flex items-center justify-between rounded-[16px] bg-[var(--background)] px-4 py-3">
                <span className="text-[var(--muted-foreground)]">用户ID</span>
                <span className="text-[var(--foreground)]">{user.id}</span>
              </div>
              <div className="flex items-center justify-between rounded-[16px] bg-[var(--background)] px-4 py-3">
                <span className="text-[var(--muted-foreground)]">会话令牌</span>
                <span className="font-mono text-[var(--foreground)]">{maskedToken}</span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            className="h-11 w-full rounded-[16px] border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="mr-2 size-4" />
            退出当前账号
          </Button>
        </div>
      </SectionShell>
    );
  };

  const renderBlacklist = () => (
    <SectionShell
      key="blacklist"
      title="黑名单"
      subtitle="被屏蔽的用户不会出现在推荐和私聊里"
      onBack={handleSectionBack}
      onClose={onClose}
      theme={theme}
    >
      <div className="space-y-4">
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">添加屏蔽用户</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">输入用户 ID 即可拉入黑名单。</p>
          <div className="mt-3 flex gap-2">
            <Input
              value={blockedUserInput}
              onChange={(event) => setBlockedUserInput(event.target.value)}
              placeholder="用户 ID"
              className="h-11 rounded-[16px] bg-[var(--background)]"
            />
            <Button
              type="button"
              onClick={() => void addBlockedUser()}
              disabled={blockedLoading}
              className="h-11 rounded-[16px] px-4"
            >
              <UserPlus className="size-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">当前屏蔽列表</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {blockedLoading ? '正在加载' : `${blockedUsers.length} 人`}
              </p>
            </div>
            <UserMinus className="size-5 text-[var(--muted-foreground)]" />
          </div>
          <div className="space-y-3">
            {blockedUsers.length === 0 && !blockedLoading && (
              <div className="rounded-[18px] bg-[var(--background)] px-4 py-5 text-sm text-[var(--muted-foreground)]">
                还没有被屏蔽的用户。
              </div>
            )}
            {blockedUsers.map((item) => (
              <div
                key={`${item.userId}-${item.targetUserId}`}
                className="flex items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--background)] px-4 py-3"
              >
                <Avatar className="size-10">
                  <AvatarImage src={item.targetAvatarUrl || buildAvatarUrl(item.targetNickname)} alt={item.targetNickname} />
                  <AvatarFallback>{item.targetNickname[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{item.targetNickname}</p>
                    <Badge variant="secondary" className="border-0 px-1.5 py-0 text-[10px]">
                      {item.targetUserId}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    屏蔽于 {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void removeBlockedUser(item.targetUserId)}
                  className="h-9 rounded-[14px] px-3 text-xs"
                >
                  解除
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );

  const renderLanguage = () => (
    <SectionShell
      key="language"
      title={t(language, 'settingsLanguageTitle')}
      subtitle={t(language, 'settingsLanguageSubtitle')}
      onBack={handleSectionBack}
      onClose={onClose}
      theme={theme}
    >
      <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{t(language, 'settingsUiLanguage')}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{t(language, 'settingsUiLanguageDesc')}</p>
          </div>
          <Globe className="size-5 text-[var(--muted-foreground)]" />
        </div>
        <div className="space-y-2">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPrefs((prev) => ({ ...prev, language: option.value }))}
              className={`w-full rounded-[18px] border px-4 py-3 text-left transition-all ${
                prefs.language === option.value
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                  : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--chat-hover)]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{option.label}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{option.description}</p>
                </div>
                {prefs.language === option.value && (
                  <Badge className="border-0 bg-[var(--primary)] px-2 py-0 text-[10px] text-white">
                    {t(language, 'settingsInUse')}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </SectionShell>
  );

  const renderHelp = () => (
    <SectionShell
      key="help"
      title="帮助与反馈"
      subtitle="常见问题和反馈入口"
      onBack={handleSectionBack}
      onClose={onClose}
      theme={theme}
    >
      <div className="space-y-4">
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">快捷反馈</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            可以直接把问题发到 support@student.app。
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-[16px]"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = 'mailto:support@student.app?subject=Student%20Community%20Feedback';
                }
              }}
            >
              <MailButtonLabel />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-[16px] px-4"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  void navigator.clipboard.writeText('support@student.app');
                }
              }}
            >
              复制邮箱
            </Button>
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">常见问题</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-[18px] bg-[var(--background)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--foreground)]">消息字号会同步吗</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">会，本地会保留你的设置。</p>
            </div>
            <div className="rounded-[18px] bg-[var(--background)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--foreground)]">黑名单会影响什么</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">会影响推荐、好友列表和私聊入口。</p>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );

  const renderAbout = () => (
    <SectionShell
      key="about"
      title="关于"
      subtitle="版本与应用信息"
      onBack={handleSectionBack}
      onClose={onClose}
      theme={theme}
    >
      <div className="space-y-4">
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">留圈 UniLink</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">版本 1.0.0</p>
            </div>
            <BookOpen className="size-5 text-[var(--muted-foreground)]" />
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-[16px] bg-[var(--background)] px-4 py-3">
              <span className="text-[var(--muted-foreground)]">当前账号</span>
              <span className="text-[var(--foreground)]">{user.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-[16px] bg-[var(--background)] px-4 py-3">
              <span className="text-[var(--muted-foreground)]">当前主题</span>
              <span className="text-[var(--foreground)]">{theme}</span>
            </div>
            <div className="flex items-center justify-between rounded-[16px] bg-[var(--background)] px-4 py-3">
              <span className="text-[var(--muted-foreground)]">当前气泡</span>
              <span className="text-[var(--foreground)]">{bubbleLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );

  return (
    <div
      className={`relative min-h-0 h-dvh w-full flex-1 overflow-hidden ${
        luxuryTheme
          ? 'bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50'
          : 'bg-[var(--background)]'
      }`}
    >
      <AnimatePresence mode="wait">
        {activeSection === null && renderMain()}
        {activeSection === 'notifications' && renderNotifications()}
        {activeSection === 'chat' && renderChat()}
        {activeSection === 'sound' && renderSound()}
        {activeSection === 'privacy' && renderPrivacy()}
        {activeSection === 'security' && renderSecurity()}
        {activeSection === 'devices' && renderDevices()}
        {activeSection === 'blacklist' && renderBlacklist()}
        {activeSection === 'language' && renderLanguage()}
        {activeSection === 'help' && renderHelp()}
        {activeSection === 'about' && renderAbout()}
      </AnimatePresence>
    </div>
  );
}

function MailButtonLabel() {
  return <span>发送邮件</span>;
}
