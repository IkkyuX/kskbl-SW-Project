import { useCallback, useEffect, useState } from 'react';
import { backendRequest, ConversationSummaryDto, FriendRequestDto } from '../lib/backend';

const UNREAD_INDICATORS_UPDATED_EVENT = 'sw-unread-indicators-updated';
const UNREAD_REFRESH_INTERVAL_MS = 30_000;

let cachedUnreadMessageCount = 0;
let cachedUnreadContactCount = 0;
let pendingUnreadIndicatorsRequest: Promise<{ unreadMessageCount: number; unreadContactCount: number }> | null = null;

function sumUnreadCount(conversations: ConversationSummaryDto[]) {
  return conversations.reduce((total, conversation) => total + Math.max(0, conversation.unread), 0);
}

function sumPendingContactCount(requests: FriendRequestDto[]) {
  return requests.reduce((total, request) => total + (request.canRespond && request.status === 'PENDING' ? 1 : 0), 0);
}

async function loadUnreadIndicators(force = false) {
  if (pendingUnreadIndicatorsRequest && !force) {
    return pendingUnreadIndicatorsRequest;
  }

  pendingUnreadIndicatorsRequest = Promise.all([
    backendRequest<ConversationSummaryDto[]>('/messages/conversations'),
    backendRequest<FriendRequestDto[]>('/users/friend-requests'),
  ])
    .then(([conversations, requests]) => {
      cachedUnreadMessageCount = sumUnreadCount(conversations);
      cachedUnreadContactCount = sumPendingContactCount(requests);
      return {
        unreadMessageCount: cachedUnreadMessageCount,
        unreadContactCount: cachedUnreadContactCount,
      };
    })
    .finally(() => {
      pendingUnreadIndicatorsRequest = null;
    });

  return pendingUnreadIndicatorsRequest;
}

export function notifyUnreadIndicatorsChanged() {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(UNREAD_INDICATORS_UPDATED_EVENT));
}

export function useUnreadMessageCount() {
  const [unreadMessageCount, setUnreadMessageCount] = useState(cachedUnreadMessageCount);
  const [unreadContactCount, setUnreadContactCount] = useState(cachedUnreadContactCount);
  const [loading, setLoading] = useState(cachedUnreadMessageCount === 0);

  const refreshUnreadIndicators = useCallback(async (force = false, signal?: { cancelled: boolean }) => {
    try {
      const nextCounts = await loadUnreadIndicators(force);
      if (!signal?.cancelled) {
        setUnreadMessageCount(nextCounts.unreadMessageCount);
        setUnreadContactCount(nextCounts.unreadContactCount);
      }
    } catch {
      if (!signal?.cancelled) {
        setUnreadMessageCount(0);
        setUnreadContactCount(0);
      }
    } finally {
      if (!signal?.cancelled) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    void refreshUnreadIndicators(false, signal);

    const handleRefresh = () => {
      void refreshUnreadIndicators(true, { cancelled: false });
    };

    const handleAuthChanged = () => {
      cachedUnreadMessageCount = 0;
      cachedUnreadContactCount = 0;
      setUnreadMessageCount(0);
      setUnreadContactCount(0);
      setLoading(true);
      void refreshUnreadIndicators(true, { cancelled: false });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refreshUnreadIndicators(true, { cancelled: false });
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshUnreadIndicators(true, { cancelled: false });
    }, UNREAD_REFRESH_INTERVAL_MS);

    window.addEventListener(UNREAD_INDICATORS_UPDATED_EVENT, handleRefresh);
    window.addEventListener('sw-auth-changed', handleAuthChanged);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      signal.cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener(UNREAD_INDICATORS_UPDATED_EVENT, handleRefresh);
      window.removeEventListener('sw-auth-changed', handleAuthChanged);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshUnreadIndicators]);

  return { unreadMessageCount, unreadContactCount, loading, refreshUnreadIndicators };
}
