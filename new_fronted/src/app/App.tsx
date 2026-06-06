import { useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { CreateGroupPage } from './components/CreateGroupPage';
import { FriendList } from './components/FriendList';
import { NewFriendsPanel } from './components/NewFriendsPanel';
import { MomentsPanel } from './components/MomentsPanel';
import { ChannelPanel } from './components/ChannelPanel';
import { EmptyState } from './components/EmptyState';
import { MobileNav } from './components/MobileNav';
import { UserProfilePanel } from './components/UserProfilePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { PersonalizationPanel } from './components/PersonalizationPanel';
import { StatusPanel } from './components/StatusPanel';
import { FriendProfilePage } from './components/FriendProfilePage';
import { ProfileDetailPage } from './components/ProfileDetailPage';
import { LevelCenterPage } from './components/LevelCenterPage';
import { AuthPage } from './components/AuthPage';
import type { User as AppUser } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ThemeBackdrop } from './components/ThemeBackdrop';
import {
  AuthSession,
  clearSession,
  openDirectConversation,
  validateStoredSession,
} from './lib/backend';
import {
  applySettingsPreferences,
  readSettingsPreferences,
  subscribeSettingsPreferences,
} from './lib/settings';
import { readPresenceStatus, writePresenceStatus, type PresenceStatusId } from './lib/presence';
import { getThemeShellClass } from './lib/themeStyles';
import { canGoBackInApp, pushHistoryState, replaceHistoryState, readHistoryState } from './lib/history';
import { startLiveUpdateWatcher } from './lib/liveUpdate';
import { Toaster } from './components/ui/sonner';

type UiSnapshot = {
  activeView: string;
  selectedChatId?: string;
  showMobileChat: boolean;
  showUserPanel: boolean;
  showNewFriendsPanel: boolean;
  showSettings: boolean;
  showPersonalization: boolean;
  showStatusPanel: boolean;
  showOwnProfileDetail?: boolean;
  showProfileDetail: boolean;
  showLevelCenter: boolean;
  profileDetailUserId?: number;
};

const HISTORY_STATE_KEY = 'swUiSnapshot';
const DEFAULT_VIEW = 'messages';
const NAV_VIEWS = new Set(['messages', 'contacts', 'channels', 'moments', 'create-group']);

function buildUrlForSnapshot(snapshot: UiSnapshot) {
  const view = NAV_VIEWS.has(snapshot.activeView) ? snapshot.activeView : DEFAULT_VIEW;
  const params = new URLSearchParams();
  if (view === 'messages' && snapshot.selectedChatId) {
    params.set('chat', snapshot.selectedChatId);
  }
  const query = params.toString();
  return `${window.location.pathname}${window.location.search}#${view}${query ? `?${query}` : ''}`;
}

function readSnapshotFromLocation(): Partial<UiSnapshot> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawHash = window.location.hash.slice(1).trim();
  if (!rawHash) {
    return null;
  }

  const [rawView, query = ''] = rawHash.split('?');
  const activeView = NAV_VIEWS.has(rawView) ? rawView : DEFAULT_VIEW;
  const params = new URLSearchParams(query);
  const selectedChatId = activeView === 'messages' ? params.get('chat') ?? undefined : undefined;

  return {
    activeView,
    selectedChatId,
    showMobileChat: Boolean(selectedChatId),
    showUserPanel: false,
    showNewFriendsPanel: false,
    showSettings: false,
    showPersonalization: false,
    showStatusPanel: false,
    showOwnProfileDetail: false,
    showProfileDetail: false,
    showLevelCenter: false,
  };
}

function AppContent() {
  const { theme } = useTheme();
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeView, setActiveView] = useState('messages');
  const [selectedChatId, setSelectedChatId] = useState<string>();
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showNewFriendsPanel, setShowNewFriendsPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [showOwnProfileDetail, setShowOwnProfileDetail] = useState(false);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showLevelCenter, setShowLevelCenter] = useState(false);
  const [profileDetailUserId, setProfileDetailUserId] = useState<number | null>(null);
  const [profileDetailFallbackUser, setProfileDetailFallbackUser] = useState<AppUser | null>(null);
  const [currentStatusId, setCurrentStatusId] = useState<PresenceStatusId>(() => readPresenceStatus());
  const [friendListRefreshKey, setFriendListRefreshKey] = useState(0);
  const [conversationIds, setConversationIds] = useState<string[]>([]);
  const historyInitializedRef = useRef(false);

  const shouldUseMobileChatView = () => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(max-width: 767px)').matches;
  };

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const storedSession = await validateStoredSession();
        if (!cancelled) {
          setSession(storedSession);
        }
      } finally {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => startLiveUpdateWatcher(), []);

  useEffect(() => {
    const syncDocumentLanguage = (prefs = readSettingsPreferences()) => {
      applySettingsPreferences(prefs);
    };

    syncDocumentLanguage();
    return subscribeSettingsPreferences(syncDocumentLanguage);
  }, []);

  useEffect(() => {
    setCurrentStatusId(readPresenceStatus(session?.userId ?? null));
  }, [session?.userId]);

  useEffect(() => {
    writePresenceStatus(currentStatusId, session?.userId ?? null);
  }, [currentStatusId, session?.userId]);

  const captureUiSnapshot = (): UiSnapshot => ({
    activeView,
    selectedChatId,
    showMobileChat,
    showUserPanel,
    showNewFriendsPanel,
    showSettings,
    showPersonalization,
    showStatusPanel,
    showOwnProfileDetail,
    showProfileDetail,
    showLevelCenter,
    profileDetailUserId: profileDetailUserId ?? undefined,
  });

  const restoreUiSnapshot = (snapshot: UiSnapshot) => {
    setActiveView(snapshot.activeView);
    setSelectedChatId(snapshot.selectedChatId);
    setShowMobileChat(snapshot.showMobileChat);
    setShowUserPanel(snapshot.showUserPanel);
    setShowNewFriendsPanel(snapshot.showNewFriendsPanel);
    setShowSettings(snapshot.showSettings);
    setShowPersonalization(snapshot.showPersonalization);
    setShowStatusPanel(snapshot.showStatusPanel);
    setShowOwnProfileDetail(snapshot.showOwnProfileDetail ?? false);
    setShowProfileDetail(snapshot.showProfileDetail);
    setShowLevelCenter(snapshot.showLevelCenter);
    setProfileDetailUserId(snapshot.profileDetailUserId ?? null);
    if (!snapshot.showProfileDetail) {
      setProfileDetailFallbackUser(null);
    }
  };

  const navigateToSnapshot = (patch: Partial<UiSnapshot>) => {
    const nextSnapshot = { ...captureUiSnapshot(), ...patch };
    if (typeof window !== 'undefined') {
      pushHistoryState({ [HISTORY_STATE_KEY]: nextSnapshot }, buildUrlForSnapshot(nextSnapshot));
    }
    restoreUiSnapshot(nextSnapshot);
  };

  const goBack = () => {
    if (typeof window === 'undefined') {
      return;
    }
    if (canGoBackInApp()) {
      window.history.back();
    }
  };

  const resetUiState = (replaceHistory = false) => {
    const nextSnapshot: UiSnapshot = {
      activeView: 'messages',
      selectedChatId: undefined,
      showMobileChat: false,
      showUserPanel: false,
      showNewFriendsPanel: false,
      showSettings: false,
      showPersonalization: false,
      showStatusPanel: false,
      showOwnProfileDetail: false,
      showProfileDetail: false,
      showLevelCenter: false,
      profileDetailUserId: undefined,
    };

    restoreUiSnapshot(nextSnapshot);

    if (replaceHistory && typeof window !== 'undefined') {
      replaceHistoryState({ [HISTORY_STATE_KEY]: nextSnapshot }, buildUrlForSnapshot(nextSnapshot));
    }
  };

  useEffect(() => {
    if (!authReady || typeof window === 'undefined') {
      return;
    }

    if (!historyInitializedRef.current) {
      const initialSnapshot = {
        ...captureUiSnapshot(),
        ...readSnapshotFromLocation(),
      };
      restoreUiSnapshot(initialSnapshot);
      replaceHistoryState({ [HISTORY_STATE_KEY]: initialSnapshot }, buildUrlForSnapshot(initialSnapshot));
      historyInitializedRef.current = true;
    }

    const handlePopState = (event: PopStateEvent) => {
      const snapshot = event.state?.[HISTORY_STATE_KEY] as UiSnapshot | undefined;
      if (snapshot) {
        restoreUiSnapshot(snapshot);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [authReady]);

  useEffect(() => {
    if (!authReady || !Capacitor.isNativePlatform()) {
      return;
    }

    let disposed = false;
    const listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBackInApp() || canGoBack) {
        window.history.back();
        return;
      }

      if (Capacitor.getPlatform() === 'android') {
        void CapacitorApp.exitApp();
      }
    });

    return () => {
      disposed = true;
      void listener.then((handle) => {
        if (!disposed) {
          return;
        }
        handle.remove();
      });
    };
  }, [authReady]);

  useEffect(() => {
    if (!selectedChatId) {
      return;
    }
    if (conversationIds.length === 0 || conversationIds.includes(selectedChatId)) {
      return;
    }
    const nextSnapshot = {
      ...captureUiSnapshot(),
      selectedChatId: undefined,
      showMobileChat: false,
    };
    restoreUiSnapshot(nextSnapshot);
    if (typeof window !== 'undefined') {
      replaceHistoryState({
        [HISTORY_STATE_KEY]: nextSnapshot,
      }, buildUrlForSnapshot(nextSnapshot));
    }
  }, [selectedChatId, conversationIds]);

  if (!authReady) {
    return (
      <div className={`flex min-h-dvh w-full items-center justify-center ${getThemeShellClass(theme)}`}>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 px-5 py-4 shadow-xl backdrop-blur-xl">
          <Loader2 className="size-5 animate-spin text-[var(--primary)]" />
          <span className="text-sm text-[var(--muted-foreground)]">正在加载界面...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <AuthPage
        onAuthenticated={(nextSession) => {
          setSession(nextSession);
          resetUiState(true);
        }}
      />
    );
  }

  const handleSelectChat = (chatId: string) => {
    navigateToSnapshot({
      selectedChatId: chatId,
      showMobileChat: shouldUseMobileChatView(),
    });
  };

  const handleBackToList = () => {
    goBack();
  };

  const handleOpenDirectChat = async (targetUserId: number) => {
    try {
      const detail = await openDirectConversation(targetUserId);
      navigateToSnapshot({
        activeView: 'messages',
        selectedChatId: String(detail.id),
        showMobileChat: shouldUseMobileChatView(),
        showUserPanel: false,
        showNewFriendsPanel: false,
        showSettings: false,
        showPersonalization: false,
        showStatusPanel: false,
        showOwnProfileDetail: false,
        showProfileDetail: false,
        showLevelCenter: false,
      });
    } catch {
      // Keep the current screen if the direct chat fails to open.
    }
  };

  const handleGroupCreated = (chatId: string) => {
    navigateToSnapshot({
      activeView: 'messages',
      selectedChatId: chatId,
      showMobileChat: shouldUseMobileChatView(),
      showUserPanel: false,
      showNewFriendsPanel: false,
      showSettings: false,
      showPersonalization: false,
      showStatusPanel: false,
      showOwnProfileDetail: false,
      showProfileDetail: false,
      showLevelCenter: false,
    });
  };

  const handleOpenProfile = (userId: number, fallbackUser?: AppUser) => {
    navigateToSnapshot({
      showProfileDetail: true,
      showUserPanel: false,
      showSettings: false,
      showPersonalization: false,
      showStatusPanel: false,
      showOwnProfileDetail: false,
      showLevelCenter: false,
      profileDetailUserId: userId,
    });
    setProfileDetailFallbackUser(fallbackUser ?? null);
  };

  const handleCloseFriendProfile = () => {
    if (typeof window !== 'undefined') {
      const state = readHistoryState() as { [HISTORY_STATE_KEY]?: UiSnapshot };
      if (state?.[HISTORY_STATE_KEY] && canGoBackInApp()) {
        window.history.back();
        return;
      }
    }

    restoreUiSnapshot({
      ...captureUiSnapshot(),
      showProfileDetail: false,
      profileDetailUserId: undefined,
    });
    setProfileDetailFallbackUser(null);
  };

  const handleViewChange = (view: string) => {
    if (view === activeView) {
      return;
    }
    navigateToSnapshot({
      activeView: view,
      showMobileChat: false,
      showUserPanel: false,
      showNewFriendsPanel: false,
      showSettings: false,
      showPersonalization: false,
      showStatusPanel: false,
      showOwnProfileDetail: false,
      showProfileDetail: false,
      showLevelCenter: false,
    });
    setProfileDetailFallbackUser(null);
  };

  const handleOpenMoments = () => {
    navigateToSnapshot({
      activeView: 'moments',
      showUserPanel: false,
      showMobileChat: false,
      showSettings: false,
      showPersonalization: false,
      showStatusPanel: false,
      showOwnProfileDetail: false,
      showProfileDetail: false,
      showNewFriendsPanel: false,
      showLevelCenter: false,
    });
    setProfileDetailFallbackUser(null);
  };

  const handleOpenNewFriends = () => {
    navigateToSnapshot({
      showNewFriendsPanel: true,
      showStatusPanel: false,
      showSettings: false,
      showPersonalization: false,
      showOwnProfileDetail: false,
      showProfileDetail: false,
      showUserPanel: false,
      showLevelCenter: false,
    });
    setProfileDetailFallbackUser(null);
  };

  const handleOpenUserPanel = () => {
    if (showUserPanel) {
      return;
    }
    navigateToSnapshot({
      showMobileChat: false,
      showNewFriendsPanel: false,
      showSettings: false,
      showPersonalization: false,
      showOwnProfileDetail: false,
      showProfileDetail: false,
      showStatusPanel: false,
      showUserPanel: true,
      showLevelCenter: false,
    });
    setProfileDetailFallbackUser(null);
  };

  const handleOpenSettingsFromUserPanel = () => {
    navigateToSnapshot({
      showUserPanel: false,
      showSettings: true,
      showPersonalization: false,
      showOwnProfileDetail: false,
      showProfileDetail: false,
      showLevelCenter: false,
    });
    setProfileDetailFallbackUser(null);
  };

  const handleOpenProfileDetail = () => {
    navigateToSnapshot({
      showMobileChat: false,
      showNewFriendsPanel: false,
      showSettings: false,
      showPersonalization: false,
      showOwnProfileDetail: true,
      showProfileDetail: false,
      showStatusPanel: false,
      showLevelCenter: false,
      showUserPanel: false,
    });
    setProfileDetailFallbackUser(null);
  };

  const handleOpenPersonalization = () => {
    if (showPersonalization) {
      return;
    }
    navigateToSnapshot({
      showUserPanel: false,
      showSettings: false,
      showOwnProfileDetail: false,
      showProfileDetail: false,
      showPersonalization: true,
      showLevelCenter: false,
    });
    setProfileDetailFallbackUser(null);
  };

  const handleOpenStatusPanel = () => {
    if (showStatusPanel) {
      return;
    }
    navigateToSnapshot({
      showStatusPanel: true,
      showOwnProfileDetail: false,
      showLevelCenter: false,
    });
    setProfileDetailFallbackUser(null);
  };

  const handleOpenLevelCenter = () => {
    navigateToSnapshot({
      showUserPanel: false,
      showSettings: false,
      showOwnProfileDetail: false,
      showProfileDetail: false,
      showPersonalization: false,
      showStatusPanel: false,
      showLevelCenter: true,
    });
    setProfileDetailFallbackUser(null);
  };

  const handleLogout = () => {
    clearSession();
    resetUiState(true);
    setSession(null);
  };

  const handleAddAccount = () => {
    clearSession();
    resetUiState(true);
    setSession(null);
  };

  const handleDeleteChat = (chatId: string) => {
    if (selectedChatId !== chatId) {
      return;
    }
    navigateToSnapshot({
      activeView: 'messages',
      selectedChatId: undefined,
      showMobileChat: false,
      showUserPanel: false,
      showNewFriendsPanel: false,
      showSettings: false,
      showPersonalization: false,
      showStatusPanel: false,
      showOwnProfileDetail: false,
      showProfileDetail: false,
      showLevelCenter: false,
      profileDetailUserId: undefined,
    });
    setProfileDetailFallbackUser(null);
  };

  return (
    <div className={`relative min-h-dvh w-full flex overflow-hidden ${activeView === 'messages' ? 'h-dvh' : ''} ${showUserPanel || showMobileChat || showSettings || showPersonalization || showOwnProfileDetail || showProfileDetail || showLevelCenter ? '' : 'pb-16'} md:pb-0 ${getThemeShellClass(theme)}`}>
      <ThemeBackdrop />

      {/* Desktop: Left Sidebar - Navigation */}
      <div className="hidden md:block">
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          onOpenUserPanel={handleOpenUserPanel}
          onOpenProfileDetail={handleOpenProfileDetail}
          currentStatusId={currentStatusId}
        />
      </div>

      {/* Desktop & Mobile: Secondary Panel - Contextual based on active view */}
      {!showSettings && activeView === 'messages' && (
        <div className={`min-w-0 ${showMobileChat ? 'hidden md:block' : 'flex flex-1 md:flex-none'}`}>
          <ChatList
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onConversationsChange={setConversationIds}
            onOpenUserPanel={handleOpenUserPanel}
            onOpenStatusPanel={handleOpenStatusPanel}
            onOpenAddFriend={handleOpenNewFriends}
            onOpenAddGroup={() => handleViewChange('create-group')}
          />
        </div>
      )}

      {!showSettings && activeView === 'create-group' && (
        <CreateGroupPage
          onBack={handleBackToList}
          onCreated={handleGroupCreated}
        />
      )}

      {/* Contacts - Full width panel */}
      {!showSettings && activeView === 'contacts' && (
        <FriendList
          onOpenUserPanel={handleOpenUserPanel}
          onOpenStatusPanel={handleOpenStatusPanel}
          onOpenChat={handleOpenDirectChat}
          onOpenProfile={handleOpenProfile}
          onOpenNewFriends={handleOpenNewFriends}
          refreshKey={friendListRefreshKey}
        />
      )}

      {/* Channels - Full width panel */}
      {!showSettings && activeView === 'channels' && (
        <ChannelPanel
          onOpenUserPanel={handleOpenUserPanel}
          onOpenStatusPanel={handleOpenStatusPanel}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {/* Moments - Full width panel */}
      {!showSettings && activeView === 'moments' && (
        <MomentsPanel
          onOpenUserPanel={handleOpenUserPanel}
        />
      )}

      {/* Settings Panel */}
      {showSettings && (
      <SettingsPanel
        onOpenUserPanel={handleOpenUserPanel}
        onOpenProfileDetail={handleOpenProfileDetail}
        onOpenPersonalization={handleOpenPersonalization}
        onClose={goBack}
        onLogout={handleLogout}
        currentStatusId={currentStatusId}
      />
      )}

      {/* Desktop & Mobile: Main Content Area - Only for messages view */}
      {!showSettings && activeView === 'messages' && (
        <div className={`min-h-0 flex-1 ${showMobileChat ? 'flex' : 'hidden md:flex'} flex-col`}>
          {selectedChatId ? (
            <ChatWindow
              chatId={selectedChatId}
              onBack={showMobileChat ? handleBackToList : undefined}
              onOpenProfile={handleOpenProfile}
            />
          ) : (
            <EmptyState isMobile={activeView === 'messages' && typeof window !== 'undefined' ? shouldUseMobileChatView() : false} onGoToContacts={() => handleViewChange('contacts')} />
          )}
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className={`${showUserPanel || showMobileChat || showSettings || showPersonalization || showOwnProfileDetail || showLevelCenter ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
        <MobileNav activeView={activeView} onViewChange={handleViewChange} />
      </div>

      {/* User Profile Panel */}
      <UserProfilePanel
        isOpen={showUserPanel}
        onClose={goBack}
        onOpenProfileDetail={handleOpenProfileDetail}
        onOpenPersonalization={handleOpenPersonalization}
        onOpenSettings={handleOpenSettingsFromUserPanel}
        onOpenLevelCenter={handleOpenLevelCenter}
        onLogout={handleLogout}
        currentStatusId={currentStatusId}
      />

      {/* Personalization Panel */}
      <PersonalizationPanel
        isOpen={showPersonalization}
        onClose={goBack}
        onOpenUserPanel={handleOpenUserPanel}
      />

      {/* Status Panel */}
      <StatusPanel
        isOpen={showStatusPanel}
        onClose={goBack}
        currentStatusId={currentStatusId}
        onStatusChange={setCurrentStatusId}
        onAccountSwitched={() => {
          void validateStoredSession().then((nextSession) => {
            setSession(nextSession);
            setFriendListRefreshKey((value) => value + 1);
          });
        }}
        onAddAccount={handleAddAccount}
        onLogout={handleLogout}
      />

      {/* New Friends Panel */}
      <NewFriendsPanel
        isOpen={showNewFriendsPanel}
        onClose={goBack}
        onUpdated={() => setFriendListRefreshKey((value) => value + 1)}
      />

      {/* Profile Detail Page */}
      <ProfileDetailPage
        isOpen={showOwnProfileDetail}
        onClose={goBack}
        onOpenPersonalization={handleOpenPersonalization}
        onOpenMoments={handleOpenMoments}
        onOpenLevelCenter={handleOpenLevelCenter}
        currentStatusId={currentStatusId}
        onOpenChat={handleOpenDirectChat}
      />

      {/* Friend Profile Detail Page */}
      <FriendProfilePage
        isOpen={showProfileDetail}
        onClose={handleCloseFriendProfile}
        userId={profileDetailUserId}
        fallbackUser={profileDetailFallbackUser}
        onOpenChat={handleOpenDirectChat}
      />

      <LevelCenterPage
        isOpen={showLevelCenter}
        onClose={goBack}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
