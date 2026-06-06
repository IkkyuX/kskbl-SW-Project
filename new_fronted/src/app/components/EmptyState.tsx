import { MessageSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAppLanguage } from '../lib/i18n';
import { getThemePageShellClass, getThemePageSoftSurfaceClass, isLuxuryTheme } from '../lib/themeStyles';

interface EmptyStateProps {
  isMobile?: boolean;
  onGoToContacts?: () => void;
}

export function EmptyState({ isMobile = false, onGoToContacts }: EmptyStateProps) {
  const { theme } = useTheme();
  const language = useAppLanguage();
  return (
    <div className={`flex-1 flex items-center justify-center ${getThemePageShellClass(theme)} ${
      isLuxuryTheme(theme)
        ? 'bg-[radial-gradient(circle_at_top,rgba(255,232,162,0.08),transparent_50%),linear-gradient(180deg,rgba(5,5,5,0.18),rgba(5,5,5,0.42))] backdrop-blur-xl'
        : ''
    }`}>
      <div className="max-w-xs px-6 text-center">
        <div className={`size-20 mx-auto mb-4 rounded-3xl flex items-center justify-center ${getThemePageSoftSurfaceClass(theme)} ${
          isLuxuryTheme(theme)
            ? 'bg-[linear-gradient(135deg,rgba(255,232,162,0.18),rgba(212,175,55,0.1),rgba(15,11,7,0.2))]'
            : 'bg-[var(--muted)]'
        }`}>
          <MessageSquare className={`size-10 ${
            isLuxuryTheme(theme) ? 'text-amber-200/60' : 'text-[var(--muted-foreground)]'
          }`} />
        </div>
        <h3 className="mb-2 text-xl text-[var(--muted-foreground)]">
          {isMobile ? (language === 'ko-KR' ? '아직 대화가 없어요' : '还没有会话') : (language === 'ko-KR' ? '대화를 선택해 주세요' : '选择一个对话')}
        </h3>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">
          {isMobile ? (language === 'ko-KR' ? '연락처 페이지에서 대화를 시작하면 새 대화가 여기에 표시됩니다.' : '去联系人页发起聊天，新的会话会出现在这里。') : (language === 'ko-KR' ? '왼쪽에서 친구나 그룹을 골라 채팅을 시작해 보세요.' : '从左侧选择好友或群组开始聊天。')}
        </p>
        {isMobile && onGoToContacts && (
          <button
            type="button"
            onClick={onGoToContacts}
            className={`mt-5 inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors ${
              isLuxuryTheme(theme)
                ? 'bg-amber-300/15 text-amber-100 hover:bg-amber-300/20'
                : 'bg-[var(--card)] text-[var(--foreground)] shadow-sm hover:bg-[var(--chat-hover)]'
            }`}
          >
            {language === 'ko-KR' ? '연락처로 이동' : '去联系人页'}
          </button>
        )}
      </div>
    </div>
  );
}
