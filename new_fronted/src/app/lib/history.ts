const HISTORY_DEPTH_KEY = 'swHistoryDepth';

type HistoryStateRecord = Record<string, unknown>;

function cleanupHistoryState(state: HistoryStateRecord) {
  return Object.fromEntries(Object.entries(state).filter(([, value]) => value !== undefined));
}

export function readHistoryState(): HistoryStateRecord {
  if (typeof window === 'undefined') {
    return {};
  }

  const { state } = window.history;
  if (!state || typeof state !== 'object') {
    return {};
  }

  return state as HistoryStateRecord;
}

export function getHistoryDepth(state = readHistoryState()) {
  const depth = state[HISTORY_DEPTH_KEY];
  return typeof depth === 'number' && Number.isFinite(depth) ? depth : 0;
}

export function canGoBackInApp() {
  return getHistoryDepth() > 0;
}

export function pushHistoryState(patch: HistoryStateRecord, url?: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const currentState = readHistoryState();
  const nextState = cleanupHistoryState({
    ...currentState,
    ...patch,
    [HISTORY_DEPTH_KEY]: getHistoryDepth(currentState) + 1,
  });

  window.history.pushState(nextState, '', url ?? window.location.href);
}

export function replaceHistoryState(patch: HistoryStateRecord, url?: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const currentState = readHistoryState();
  const nextState = cleanupHistoryState({
    ...currentState,
    ...patch,
    [HISTORY_DEPTH_KEY]: getHistoryDepth(currentState),
  });

  window.history.replaceState(nextState, '', url ?? window.location.href);
}
