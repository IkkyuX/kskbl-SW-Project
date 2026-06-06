import {
  X, Plus, LogIn, Edit3, Circle, Clock, Ban,
  EyeOff, MessageCircle, Battery, Music, Palmtree,
  Briefcase, Coffee, Dumbbell, CloudRain, Heart, Smile,
  MoreHorizontal
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { type PresenceStatusId } from '../lib/presence';
import { isLuxuryTheme } from '../lib/themeStyles';
import { getLoggedInAccounts, login, PublicUserSummaryDto, resolveAvatarUrl } from '../lib/backend';
import { t, useAppLanguage } from '../lib/i18n';

interface StatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatusId: PresenceStatusId;
  onStatusChange: (statusId: PresenceStatusId) => void;
  onAccountSwitched?: () => void;
  onAddAccount?: () => void;
  onLogout?: () => void;
}

interface StatusOption {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  textColor?: string;
}

interface StatusTone {
  backdrop: string;
  panelLight: string;
  panelDark: string;
  headerLight: string;
  headerDark: string;
  pillLight: string;
  pillDark: string;
  activeRing: string;
  dividerLight: string;
  dividerDark: string;
  accountRingLight: string;
  accountRingDark: string;
}

const statusOptions: StatusOption[] = [
  { id: 'custom', label: '自定义', icon: Edit3, color: 'bg-gradient-to-br from-purple-500 to-pink-500', textColor: 'text-white' },
  { id: 'online', label: '在线', icon: Circle, color: 'bg-gradient-to-br from-green-400 to-emerald-500', textColor: 'text-white' },
  { id: 'away', label: '离开', icon: Clock, color: 'bg-gradient-to-br from-amber-400 to-orange-500', textColor: 'text-white' },
  { id: 'busy', label: '忙碌', icon: Ban, color: 'bg-gradient-to-br from-red-500 to-rose-600', textColor: 'text-white' },
];

const quickStatuses: StatusOption[] = [
  { id: 'dnd', label: '请勿打扰', icon: Ban, color: 'bg-gradient-to-br from-red-500/20 to-pink-500/20', textColor: 'text-red-400' },
  { id: 'invisible', label: '隐身', icon: EyeOff, color: 'bg-gradient-to-br from-slate-500/20 to-gray-500/20', textColor: 'text-gray-400' },
  { id: 'qme', label: 'Q我吧', icon: MessageCircle, color: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20', textColor: 'text-blue-400' },
  { id: 'battery', label: '我的电量', icon: Battery, color: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20', textColor: 'text-green-400' },
  { id: 'music', label: '听歌中', icon: Music, color: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20', textColor: 'text-purple-400' },
  { id: 'out', label: '出去浪', icon: Palmtree, color: 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20', textColor: 'text-teal-400' },
  { id: 'travel', label: '去旅行', icon: Briefcase, color: 'bg-gradient-to-br from-indigo-500/20 to-blue-500/20', textColor: 'text-indigo-400' },
  { id: 'tired', label: '被掏空', icon: Coffee, color: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20', textColor: 'text-amber-400' },
  { id: 'sport', label: '运动中', icon: Dumbbell, color: 'bg-gradient-to-br from-orange-500/20 to-red-500/20', textColor: 'text-orange-400' },
  { id: 'weather', label: '今日天气', icon: CloudRain, color: 'bg-gradient-to-br from-sky-500/20 to-blue-500/20', textColor: 'text-sky-400' },
  { id: 'crush', label: '我crush了', icon: Heart, color: 'bg-gradient-to-br from-pink-500/20 to-rose-500/20', textColor: 'text-pink-400' },
  { id: 'love', label: '爱你', icon: Smile, color: 'bg-gradient-to-br from-rose-500/20 to-pink-500/20', textColor: 'text-rose-400' },
];

const statusTones: Record<string, StatusTone> = {
  custom: {
    backdrop: 'bg-fuchsia-950/45',
    panelLight: 'bg-gradient-to-b from-fuchsia-50/95 via-white/95 to-pink-50/95 border-fuchsia-200/70',
    panelDark: 'bg-gradient-to-b from-fuchsia-950/95 via-slate-900/95 to-slate-950/95 border-fuchsia-400/20',
    headerLight: 'bg-gradient-to-r from-fuchsia-100/90 via-pink-50/90 to-purple-50/90',
    headerDark: 'bg-gradient-to-r from-fuchsia-500/15 via-pink-500/10 to-purple-500/15',
    pillLight: 'bg-white/80 border border-fuchsia-200',
    pillDark: 'bg-fuchsia-400/10 border border-fuchsia-300/25',
    activeRing: 'ring-fuchsia-500',
    dividerLight: 'border-fuchsia-100',
    dividerDark: 'border-fuchsia-300/15',
    accountRingLight: 'ring-fuchsia-300/50 group-hover:ring-fuchsia-500',
    accountRingDark: 'ring-fuchsia-300/30 group-hover:ring-fuchsia-300',
  },
  online: {
    backdrop: 'bg-emerald-950/45',
    panelLight: 'bg-gradient-to-b from-emerald-50/95 via-white/95 to-green-50/95 border-emerald-200/70',
    panelDark: 'bg-gradient-to-b from-emerald-950/95 via-slate-900/95 to-slate-950/95 border-emerald-400/20',
    headerLight: 'bg-gradient-to-r from-emerald-100/90 via-green-50/90 to-cyan-50/90',
    headerDark: 'bg-gradient-to-r from-emerald-500/15 via-green-500/10 to-cyan-500/15',
    pillLight: 'bg-white/80 border border-emerald-200',
    pillDark: 'bg-emerald-400/10 border border-emerald-300/25',
    activeRing: 'ring-emerald-500',
    dividerLight: 'border-emerald-100',
    dividerDark: 'border-emerald-300/15',
    accountRingLight: 'ring-emerald-300/50 group-hover:ring-emerald-500',
    accountRingDark: 'ring-emerald-300/30 group-hover:ring-emerald-300',
  },
  away: {
    backdrop: 'bg-orange-950/45',
    panelLight: 'bg-gradient-to-b from-amber-50/95 via-white/95 to-orange-50/95 border-orange-200/70',
    panelDark: 'bg-gradient-to-b from-orange-950/95 via-slate-900/95 to-slate-950/95 border-orange-400/20',
    headerLight: 'bg-gradient-to-r from-amber-100/90 via-orange-50/90 to-yellow-50/90',
    headerDark: 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/15',
    pillLight: 'bg-white/80 border border-orange-200',
    pillDark: 'bg-orange-400/10 border border-orange-300/25',
    activeRing: 'ring-orange-500',
    dividerLight: 'border-orange-100',
    dividerDark: 'border-orange-300/15',
    accountRingLight: 'ring-orange-300/50 group-hover:ring-orange-500',
    accountRingDark: 'ring-orange-300/30 group-hover:ring-orange-300',
  },
  busy: {
    backdrop: 'bg-rose-950/45',
    panelLight: 'bg-gradient-to-b from-rose-50/95 via-white/95 to-red-50/95 border-rose-200/70',
    panelDark: 'bg-gradient-to-b from-rose-950/95 via-slate-900/95 to-slate-950/95 border-rose-400/20',
    headerLight: 'bg-gradient-to-r from-rose-100/90 via-red-50/90 to-pink-50/90',
    headerDark: 'bg-gradient-to-r from-rose-500/15 via-red-500/10 to-pink-500/15',
    pillLight: 'bg-white/80 border border-rose-200',
    pillDark: 'bg-rose-400/10 border border-rose-300/25',
    activeRing: 'ring-rose-500',
    dividerLight: 'border-rose-100',
    dividerDark: 'border-rose-300/15',
    accountRingLight: 'ring-rose-300/50 group-hover:ring-rose-500',
    accountRingDark: 'ring-rose-300/30 group-hover:ring-rose-300',
  },
  dnd: {
    backdrop: 'bg-pink-950/45',
    panelLight: 'bg-gradient-to-b from-pink-50/95 via-white/95 to-rose-50/95 border-pink-200/70',
    panelDark: 'bg-gradient-to-b from-pink-950/95 via-slate-900/95 to-slate-950/95 border-pink-400/20',
    headerLight: 'bg-gradient-to-r from-pink-100/90 via-rose-50/90 to-red-50/90',
    headerDark: 'bg-gradient-to-r from-pink-500/15 via-rose-500/10 to-red-500/15',
    pillLight: 'bg-white/80 border border-pink-200',
    pillDark: 'bg-pink-400/10 border border-pink-300/25',
    activeRing: 'ring-pink-500',
    dividerLight: 'border-pink-100',
    dividerDark: 'border-pink-300/15',
    accountRingLight: 'ring-pink-300/50 group-hover:ring-pink-500',
    accountRingDark: 'ring-pink-300/30 group-hover:ring-pink-300',
  },
  invisible: {
    backdrop: 'bg-slate-950/50',
    panelLight: 'bg-gradient-to-b from-slate-100/95 via-white/95 to-gray-50/95 border-slate-200/80',
    panelDark: 'bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-gray-950/95 border-slate-400/20',
    headerLight: 'bg-gradient-to-r from-slate-200/90 via-gray-100/90 to-zinc-50/90',
    headerDark: 'bg-gradient-to-r from-slate-500/15 via-gray-500/10 to-zinc-500/15',
    pillLight: 'bg-white/80 border border-slate-200',
    pillDark: 'bg-slate-400/10 border border-slate-300/25',
    activeRing: 'ring-slate-500',
    dividerLight: 'border-slate-200',
    dividerDark: 'border-slate-300/15',
    accountRingLight: 'ring-slate-300/60 group-hover:ring-slate-500',
    accountRingDark: 'ring-slate-300/30 group-hover:ring-slate-300',
  },
  qme: {
    backdrop: 'bg-blue-950/45',
    panelLight: 'bg-gradient-to-b from-blue-50/95 via-white/95 to-cyan-50/95 border-blue-200/70',
    panelDark: 'bg-gradient-to-b from-blue-950/95 via-slate-900/95 to-slate-950/95 border-blue-400/20',
    headerLight: 'bg-gradient-to-r from-blue-100/90 via-cyan-50/90 to-sky-50/90',
    headerDark: 'bg-gradient-to-r from-blue-500/15 via-cyan-500/10 to-sky-500/15',
    pillLight: 'bg-white/80 border border-blue-200',
    pillDark: 'bg-blue-400/10 border border-blue-300/25',
    activeRing: 'ring-blue-500',
    dividerLight: 'border-blue-100',
    dividerDark: 'border-blue-300/15',
    accountRingLight: 'ring-blue-300/50 group-hover:ring-blue-500',
    accountRingDark: 'ring-blue-300/30 group-hover:ring-blue-300',
  },
  battery: {
    backdrop: 'bg-green-950/45',
    panelLight: 'bg-gradient-to-b from-green-50/95 via-white/95 to-emerald-50/95 border-green-200/70',
    panelDark: 'bg-gradient-to-b from-green-950/95 via-slate-900/95 to-slate-950/95 border-green-400/20',
    headerLight: 'bg-gradient-to-r from-green-100/90 via-emerald-50/90 to-lime-50/90',
    headerDark: 'bg-gradient-to-r from-green-500/15 via-emerald-500/10 to-lime-500/15',
    pillLight: 'bg-white/80 border border-green-200',
    pillDark: 'bg-green-400/10 border border-green-300/25',
    activeRing: 'ring-green-500',
    dividerLight: 'border-green-100',
    dividerDark: 'border-green-300/15',
    accountRingLight: 'ring-green-300/50 group-hover:ring-green-500',
    accountRingDark: 'ring-green-300/30 group-hover:ring-green-300',
  },
  music: {
    backdrop: 'bg-purple-950/45',
    panelLight: 'bg-gradient-to-b from-purple-50/95 via-white/95 to-fuchsia-50/95 border-purple-200/70',
    panelDark: 'bg-gradient-to-b from-purple-950/95 via-slate-900/95 to-slate-950/95 border-purple-400/20',
    headerLight: 'bg-gradient-to-r from-purple-100/90 via-fuchsia-50/90 to-pink-50/90',
    headerDark: 'bg-gradient-to-r from-purple-500/15 via-fuchsia-500/10 to-pink-500/15',
    pillLight: 'bg-white/80 border border-purple-200',
    pillDark: 'bg-purple-400/10 border border-purple-300/25',
    activeRing: 'ring-purple-500',
    dividerLight: 'border-purple-100',
    dividerDark: 'border-purple-300/15',
    accountRingLight: 'ring-purple-300/50 group-hover:ring-purple-500',
    accountRingDark: 'ring-purple-300/30 group-hover:ring-purple-300',
  },
  out: {
    backdrop: 'bg-teal-950/45',
    panelLight: 'bg-gradient-to-b from-teal-50/95 via-white/95 to-cyan-50/95 border-teal-200/70',
    panelDark: 'bg-gradient-to-b from-teal-950/95 via-slate-900/95 to-slate-950/95 border-teal-400/20',
    headerLight: 'bg-gradient-to-r from-teal-100/90 via-cyan-50/90 to-sky-50/90',
    headerDark: 'bg-gradient-to-r from-teal-500/15 via-cyan-500/10 to-sky-500/15',
    pillLight: 'bg-white/80 border border-teal-200',
    pillDark: 'bg-teal-400/10 border border-teal-300/25',
    activeRing: 'ring-teal-500',
    dividerLight: 'border-teal-100',
    dividerDark: 'border-teal-300/15',
    accountRingLight: 'ring-teal-300/50 group-hover:ring-teal-500',
    accountRingDark: 'ring-teal-300/30 group-hover:ring-teal-300',
  },
  travel: {
    backdrop: 'bg-indigo-950/45',
    panelLight: 'bg-gradient-to-b from-indigo-50/95 via-white/95 to-blue-50/95 border-indigo-200/70',
    panelDark: 'bg-gradient-to-b from-indigo-950/95 via-slate-900/95 to-slate-950/95 border-indigo-400/20',
    headerLight: 'bg-gradient-to-r from-indigo-100/90 via-blue-50/90 to-sky-50/90',
    headerDark: 'bg-gradient-to-r from-indigo-500/15 via-blue-500/10 to-sky-500/15',
    pillLight: 'bg-white/80 border border-indigo-200',
    pillDark: 'bg-indigo-400/10 border border-indigo-300/25',
    activeRing: 'ring-indigo-500',
    dividerLight: 'border-indigo-100',
    dividerDark: 'border-indigo-300/15',
    accountRingLight: 'ring-indigo-300/50 group-hover:ring-indigo-500',
    accountRingDark: 'ring-indigo-300/30 group-hover:ring-indigo-300',
  },
  tired: {
    backdrop: 'bg-amber-950/45',
    panelLight: 'bg-gradient-to-b from-amber-50/95 via-white/95 to-yellow-50/95 border-amber-200/70',
    panelDark: 'bg-gradient-to-b from-amber-950/95 via-slate-900/95 to-slate-950/95 border-amber-400/20',
    headerLight: 'bg-gradient-to-r from-amber-100/90 via-yellow-50/90 to-orange-50/90',
    headerDark: 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-orange-500/15',
    pillLight: 'bg-white/80 border border-amber-200',
    pillDark: 'bg-amber-400/10 border border-amber-300/25',
    activeRing: 'ring-amber-500',
    dividerLight: 'border-amber-100',
    dividerDark: 'border-amber-300/15',
    accountRingLight: 'ring-amber-300/50 group-hover:ring-amber-500',
    accountRingDark: 'ring-amber-300/30 group-hover:ring-amber-300',
  },
  sport: {
    backdrop: 'bg-orange-950/45',
    panelLight: 'bg-gradient-to-b from-orange-50/95 via-white/95 to-red-50/95 border-orange-200/70',
    panelDark: 'bg-gradient-to-b from-orange-950/95 via-slate-900/95 to-slate-950/95 border-orange-400/20',
    headerLight: 'bg-gradient-to-r from-orange-100/90 via-red-50/90 to-amber-50/90',
    headerDark: 'bg-gradient-to-r from-orange-500/15 via-red-500/10 to-amber-500/15',
    pillLight: 'bg-white/80 border border-orange-200',
    pillDark: 'bg-orange-400/10 border border-orange-300/25',
    activeRing: 'ring-orange-500',
    dividerLight: 'border-orange-100',
    dividerDark: 'border-orange-300/15',
    accountRingLight: 'ring-orange-300/50 group-hover:ring-orange-500',
    accountRingDark: 'ring-orange-300/30 group-hover:ring-orange-300',
  },
  weather: {
    backdrop: 'bg-sky-950/45',
    panelLight: 'bg-gradient-to-b from-sky-50/95 via-white/95 to-blue-50/95 border-sky-200/70',
    panelDark: 'bg-gradient-to-b from-sky-950/95 via-slate-900/95 to-slate-950/95 border-sky-400/20',
    headerLight: 'bg-gradient-to-r from-sky-100/90 via-blue-50/90 to-cyan-50/90',
    headerDark: 'bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-cyan-500/15',
    pillLight: 'bg-white/80 border border-sky-200',
    pillDark: 'bg-sky-400/10 border border-sky-300/25',
    activeRing: 'ring-sky-500',
    dividerLight: 'border-sky-100',
    dividerDark: 'border-sky-300/15',
    accountRingLight: 'ring-sky-300/50 group-hover:ring-sky-500',
    accountRingDark: 'ring-sky-300/30 group-hover:ring-sky-300',
  },
  crush: {
    backdrop: 'bg-pink-950/45',
    panelLight: 'bg-gradient-to-b from-pink-50/95 via-white/95 to-rose-50/95 border-pink-200/70',
    panelDark: 'bg-gradient-to-b from-pink-950/95 via-slate-900/95 to-slate-950/95 border-pink-400/20',
    headerLight: 'bg-gradient-to-r from-pink-100/90 via-rose-50/90 to-fuchsia-50/90',
    headerDark: 'bg-gradient-to-r from-pink-500/15 via-rose-500/10 to-fuchsia-500/15',
    pillLight: 'bg-white/80 border border-pink-200',
    pillDark: 'bg-pink-400/10 border border-pink-300/25',
    activeRing: 'ring-pink-500',
    dividerLight: 'border-pink-100',
    dividerDark: 'border-pink-300/15',
    accountRingLight: 'ring-pink-300/50 group-hover:ring-pink-500',
    accountRingDark: 'ring-pink-300/30 group-hover:ring-pink-300',
  },
  love: {
    backdrop: 'bg-rose-950/45',
    panelLight: 'bg-gradient-to-b from-rose-50/95 via-white/95 to-pink-50/95 border-rose-200/70',
    panelDark: 'bg-gradient-to-b from-rose-950/95 via-slate-900/95 to-slate-950/95 border-rose-400/20',
    headerLight: 'bg-gradient-to-r from-rose-100/90 via-pink-50/90 to-fuchsia-50/90',
    headerDark: 'bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-fuchsia-500/15',
    pillLight: 'bg-white/80 border border-rose-200',
    pillDark: 'bg-rose-400/10 border border-rose-300/25',
    activeRing: 'ring-rose-500',
    dividerLight: 'border-rose-100',
    dividerDark: 'border-rose-300/15',
    accountRingLight: 'ring-rose-300/50 group-hover:ring-rose-500',
    accountRingDark: 'ring-rose-300/30 group-hover:ring-rose-300',
  },
};

export function StatusPanel({
  isOpen,
  onClose,
  currentStatusId,
  onStatusChange,
  onAccountSwitched,
  onAddAccount,
  onLogout,
}: StatusPanelProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  const [currentStatus, setCurrentStatus] = useState<PresenceStatusId>(currentStatusId);
  const [realAccounts, setRealAccounts] = useState<PublicUserSummaryDto[]>([]);
  const [switchingUserId, setSwitchingUserId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStatus(currentStatusId);
    }
  }, [currentStatusId, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled = false;
    try {
      const accounts = getLoggedInAccounts();
      if (!cancelled) {
        setRealAccounts(accounts);
      }
    } catch {
      if (!cancelled) {
        setRealAccounts([]);
      }
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const currentStatusData = [...statusOptions, ...quickStatuses].find(s => s.id === currentStatus);
  const statusTone = statusTones[currentStatus] ?? statusTones.online;
  const isTintedDark = isLuxuryTheme(theme);
  const panelToneClass = isTintedDark ? statusTone.panelDark : statusTone.panelLight;
  const headerToneClass = isTintedDark ? statusTone.headerDark : statusTone.headerLight;
  const pillToneClass = isTintedDark ? statusTone.pillDark : statusTone.pillLight;
  const dividerToneClass = isTintedDark ? statusTone.dividerDark : statusTone.dividerLight;
  const accountRingClass = isTintedDark ? statusTone.accountRingDark : statusTone.accountRingLight;

  const getStatusLabel = (statusId: string) => {
    switch (statusId) {
      case 'custom':
        return t(language, 'statusCustom');
      case 'online':
        return t(language, 'statusOnline');
      case 'away':
        return t(language, 'statusAway');
      case 'busy':
        return t(language, 'statusBusy');
      case 'dnd':
        return t(language, 'statusDnd');
      case 'invisible':
        return t(language, 'statusInvisible');
      case 'qme':
        return t(language, 'statusQme');
      case 'battery':
        return t(language, 'statusBattery');
      case 'music':
        return t(language, 'statusMusic');
      case 'out':
        return t(language, 'statusOut');
      case 'travel':
        return t(language, 'statusTravel');
      case 'tired':
        return t(language, 'statusTired');
      case 'sport':
        return t(language, 'statusSport');
      case 'weather':
        return t(language, 'statusWeather');
      case 'crush':
        return t(language, 'statusCrush');
      case 'love':
        return t(language, 'statusLove');
      default:
        return statusId;
    }
  };

  const handleSwitchAccount = async (account: PublicUserSummaryDto) => {
    if (!account.email || switchingUserId === account.userId) {
      return;
    }

    const password = window.prompt(`${t(language, 'statusPasswordPromptPrefix')}${account.nickname}${t(language, 'statusPasswordPromptSuffix')}`);
    if (!password) {
      return;
    }

    try {
      setSwitchingUserId(account.userId);
      await login(account.email, password);
      onAccountSwitched?.();
      onClose();
    } finally {
      setSwitchingUserId(null);
    }
  };

  const handleAddAccount = () => {
    if (typeof window !== 'undefined' && !window.confirm(t(language, 'addAccountConfirm'))) {
      return;
    }
    onAddAccount?.();
    onClose();
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined' && !window.confirm(t(language, 'logoutConfirm'))) {
      return;
    }
    onLogout?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 ${statusTone.backdrop} backdrop-blur-md z-50 transition-colors duration-300`}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] max-w-md z-50 rounded-[28px] overflow-hidden shadow-2xl border backdrop-blur-2xl transition-colors duration-300 ${panelToneClass}`}
          >
            {/* Header with Gradient */}
            <div className={`relative px-5 py-3 transition-colors duration-300 ${headerToneClass}`}>
              <div className="flex items-center justify-between">
                <button
                  onClick={onClose}
                    className={`size-8 flex items-center justify-center rounded-xl transition-all ${
                    isTintedDark
                      ? 'text-amber-100/75 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                  }`}
                >
                  <X className="size-4" />
                </button>

                {/* Current Status Display */}
                <motion.div
                  layout
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl shadow-lg transition-colors duration-300 ${pillToneClass}`}
                >
                  {currentStatusData && (
                    <>
                      <div className={`p-1 rounded-lg ${currentStatusData.color}`}>
                        <currentStatusData.icon className={`size-3.5 ${currentStatusData.textColor || 'text-white'}`} />
                      </div>
                      <span className={`text-xs font-medium ${isTintedDark ? 'text-white' : 'text-gray-900'}`}>
                        {getStatusLabel(currentStatusData.id)}
                      </span>
                    </>
                  )}
                </motion.div>

                <button className={`size-8 flex items-center justify-center rounded-xl transition-all ${
                    isTintedDark
                      ? 'text-amber-100/75 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                }`}>
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
            </div>

            {/* Main Status Options */}
            <div className="px-5 py-4">
              <h3 className={`text-sm font-semibold mb-3 ${isTintedDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t(language, 'statusBasic')}
              </h3>
              <div className="grid grid-cols-4 gap-2.5 mb-5">
                {statusOptions.map((status) => {
                  const Icon = status.icon;
                  const isActive = currentStatus === status.id;
                  return (
                    <motion.button
                      key={status.id}
                      onClick={() => {
                        setCurrentStatus(status.id as PresenceStatusId);
                        onStatusChange(status.id as PresenceStatusId);
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className={`relative size-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                        status.color
                      } ${
                        isActive ? 'ring-2 ring-offset-2 ring-offset-transparent' : ''
                      } ${
                        isActive ? statusTone.activeRing : ''
                      }`}>
                        <Icon className={`size-6 ${status.textColor || 'text-white'}`} />
                        {isActive && (
                          <motion.div
                            layoutId="statusActive"
                            className="absolute inset-0 rounded-2xl"
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          />
                        )}
                      </div>
                      <span className={`text-[11px] leading-tight font-medium transition-colors ${
                        isActive ? (isTintedDark ? 'text-white' : 'text-gray-900') : (isTintedDark ? 'text-gray-400' : 'text-gray-600')
                      }`}>
                        {getStatusLabel(status.id)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Quick Status Grid */}
              <h3 className={`text-sm font-semibold mb-3 ${isTintedDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t(language, 'statusPersonal')}
              </h3>
              <div className="grid grid-cols-4 gap-2.5 mb-4">
                {quickStatuses.map((status) => {
                  const Icon = status.icon;
                  const isActive = currentStatus === status.id;
                  return (
                    <motion.button
                      key={status.id}
                      onClick={() => {
                        setCurrentStatus(status.id as PresenceStatusId);
                        onStatusChange(status.id as PresenceStatusId);
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className={`relative size-14 rounded-2xl flex items-center justify-center transition-all border ${
                        isLuxuryTheme(theme)
                          ? 'border-white/10'
                          : isLuxuryTheme(theme)
                          ? 'border-white/10'
                          : 'border-gray-200'
                      } ${status.color} ${
                        isActive ? 'ring-2 ring-offset-2 ring-offset-transparent' : ''
                      } ${
                        isActive ? statusTone.activeRing : ''
                      }`}>
                        <Icon className={`size-5 ${status.textColor}`} />
                        {isActive && (
                          <motion.div
                            layoutId="quickStatusActive"
                            className="absolute inset-0 rounded-2xl"
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          />
                        )}
                      </div>
                      <span className={`text-[11px] leading-tight font-medium transition-colors ${
                        isActive ? (isTintedDark ? 'text-white' : 'text-gray-900') : (isTintedDark ? 'text-gray-400' : 'text-gray-600')
                      }`}>
                        {getStatusLabel(status.id)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Pagination Dots */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                <div className={`size-2 rounded-full transition-all ${isTintedDark ? 'bg-white/50' : 'bg-gray-400'}`} />
                <div className={`size-1.5 rounded-full ${isTintedDark ? 'bg-white/20' : 'bg-gray-300'}`} />
                <div className={`size-1.5 rounded-full ${isTintedDark ? 'bg-white/20' : 'bg-gray-300'}`} />
              </div>

              {/* Account Switcher */}
              <div className={`pt-4 border-t transition-colors duration-300 ${dividerToneClass}`}>
                <p className={`text-sm font-semibold mb-3 text-center ${isTintedDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {t(language, 'statusSwitchAccount')}
                </p>
                <div className="flex items-center justify-center gap-2.5">
                  {realAccounts.map((account) => (
                    <motion.button
                      key={account.userId}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative group"
                      onClick={() => void handleSwitchAccount(account)}
                      disabled={switchingUserId === account.userId || !account.email}
                    >
                      <Avatar className={`size-11 ring-2 transition-all shadow-lg ${accountRingClass}`}>
                        <AvatarImage src={resolveAvatarUrl(account.avatarUrl, account.nickname)} alt={account.nickname} />
                        <AvatarFallback>{account.nickname[0]}</AvatarFallback>
                      </Avatar>
                    </motion.button>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`size-11 rounded-full flex items-center justify-center transition-all shadow-lg border ${
                      isTintedDark
                        ? 'bg-white/5 hover:bg-white/10 border-white/10'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                    type="button"
                    aria-label={t(language, 'statusAddAccount')}
                    title={t(language, 'statusAddAccount')}
                    onClick={handleAddAccount}
                  >
                    <Plus className="size-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`size-11 rounded-full flex items-center justify-center transition-all shadow-lg border ${
                      isTintedDark
                        ? 'bg-white/5 hover:bg-white/10 border-white/10'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                    type="button"
                    aria-label={t(language, 'statusLogoutAccount')}
                    title={t(language, 'statusLogoutAccount')}
                    onClick={handleLogout}
                  >
                    <LogIn className="size-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
