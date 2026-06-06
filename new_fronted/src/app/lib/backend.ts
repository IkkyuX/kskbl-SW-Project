function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function resolveDefaultApiOrigin() {
  const explicitOrigin = import.meta.env.VITE_API_ORIGIN;
  if (explicitOrigin) {
    return trimTrailingSlash(explicitOrigin);
  }

  if (typeof window !== 'undefined') {
    const { protocol, origin } = window.location;
    if (protocol === 'http:' || protocol === 'https:') {
      return trimTrailingSlash(origin);
    }
  }

  return 'http://localhost:8080';
}

const API_ORIGIN = resolveDefaultApiOrigin();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `${API_ORIGIN}/api/v1`;

export function getApiOrigin() {
  return API_ORIGIN;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

function withNetworkDiagnostics(error: unknown, path: string) {
  if (error instanceof TypeError) {
    return new Error(
      `网络请求失败，请确认手机可访问 ${API_ORIGIN}，并重新安装最新 APK。请求地址：${API_BASE_URL}${path}`,
    );
  }
  return error instanceof Error ? error : new Error('网络请求失败');
}

const TOKEN_KEY = 'sw_auth_token';
const USER_ID_KEY = 'sw_auth_user_id';
const U_NUMBER_KEY = 'sw_auth_u_number';
const NICKNAME_KEY = 'sw_auth_nickname';
const LEGACY_TOKEN_KEY = 'sw_demo_token';
const LEGACY_USER_ID_KEY = 'sw_demo_user_id';
const LEGACY_NICKNAME_KEY = 'sw_demo_nickname';
const TEMP_CONVERSATION_IDS_KEY = 'sw_temp_conversation_ids';
const HIDDEN_CONVERSATION_IDS_KEY = 'sw_hidden_conversation_ids';
const CURRENT_USER_CACHE_KEY = 'sw_current_user_cache_v2';
const LOGGED_IN_ACCOUNTS_KEY = 'sw_logged_in_accounts_v1';

export interface BackendEnvelope<T> {
  code?: number;
  message?: string;
  data: T;
}

async function readBackendEnvelope<T>(response: Response, fallbackMessage: string): Promise<BackendEnvelope<T>> {
  const text = await response.text();
  if (!text.trim()) {
    return {
      message: response.ok ? undefined : `${fallbackMessage} (HTTP ${response.status})`,
      data: undefined as T,
    };
  }

  try {
    return JSON.parse(text) as BackendEnvelope<T>;
  } catch {
    return {
      message: response.ok ? fallbackMessage : `${fallbackMessage} (HTTP ${response.status})`,
      data: undefined as T,
    };
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export interface AuthSession {
  token: string;
  userId: number;
  uNumber: number;
  nickname: string;
}

export interface AuthUserDto {
  userId: number;
  unumber: number;
  email: string | null;
  nickname: string;
  status: string;
}

export interface UserProfileDto {
  id: number;
  unumber: number;
  nickname: string;
  avatarUrl?: string | null;
  level: number;
  experience: number;
  school: string;
  major: string;
  languages: string[];
  bio: string;
  tags: string[];
  status: string;
  privacyLevel: string;
}

export interface LevelRuleDto {
  key: string;
  label: string;
  description: string;
  expPerUnit: number;
  count: number;
  earnedExp: number;
}

export interface LevelSummaryDto {
  level: number;
  experience: number;
  currentLevelExp: number;
  nextLevelExp: number;
  expIntoLevel: number;
  expNeededForNextLevel: number;
  progressPercent: number;
  rules: LevelRuleDto[];
}

export interface TagOptionDto {
  id: number;
  name: string;
  type: string;
}

export interface TagCatalogDto {
  interestTags: TagOptionDto[];
  sceneTags: TagOptionDto[];
  statusTags: TagOptionDto[];
}

export interface BoardSummaryDto {
  id: number;
  nameZh: string;
  nameKo: string;
  nameEn: string;
  sortOrder: number;
}

export interface ConversationSummaryDto {
  id: number;
  participantUserId: number;
  groupNumber?: number | null;
  name: string;
  avatarSeed: string;
  avatarUrl?: string | null;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  pinned: boolean;
  status: string;
  nickname: string;
  isFriend: boolean;
  temporary: boolean;
  requestStatus: string | null;
  requestStatusLabel: string | null;
  requestDirection: string | null;
  requestId: number | null;
}

export interface ChatMessageDto {
  id: number;
  content: string;
  time: string;
  isMine: boolean;
  messageType: string;
  mediaUrl?: string | null;
}

export interface ConversationDetailDto {
  id: number;
  participantUserId: number;
  groupNumber?: number | null;
  groupName?: string | null;
  groupDescription?: string | null;
  name: string;
  avatarSeed: string;
  avatarUrl?: string | null;
  online: boolean;
  nickname: string;
  isFriend: boolean;
  temporary: boolean;
  requestStatus: string | null;
  requestStatusLabel: string | null;
  requestDirection: string | null;
  requestId: number | null;
  messages: ChatMessageDto[];
}

export interface FriendDto {
  userId: number;
  unumber: number;
  nickname: string;
  originalNickname: string;
  remarkName: string | null;
  avatarUrl?: string | null;
  school: string;
  major: string;
  bio: string;
  status: string;
}

export interface AddFriendDto {
  userId: number;
  friendUserId: number;
  status: string;
}

export interface FriendRequestDto {
  id: number;
  requesterUserId: number;
  receiverUserId: number;
  targetUserId: number;
  targetUNumber: number;
  targetNickname: string;
  targetAvatarUrl: string | null;
  direction: "INCOMING" | "OUTGOING";
  status: string;
  statusLabel: string;
  canRespond: boolean;
  updatedAt: string;
}

export interface GroupConversationRequestDto {
  groupNumber: number;
}

export interface GroupMemberDto {
  userId: number;
  uNumber: number;
  nickname: string;
  avatarUrl?: string | null;
  isAdmin: boolean;
}

export async function uploadGroupAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return backendRequest<{ iconUrl: string }>('/circles/icon', {
    method: 'POST',
    body: formData,
  });
}

export async function uploadVoiceMessage(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return backendRequest<{ mediaUrl: string }>('/messages/media/voice', {
    method: 'POST',
    body: formData,
  });
}

export interface NotificationDto {
  id: number;
  type: string;
  icon: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
}

export interface VerificationRecordDto {
  id: number;
  verifyType: string;
  fileUrl: string;
  status: string;
  rejectReason: string | null;
}

export interface BlockedUserDto {
  userId: number;
  targetUserId: number;
  targetUNumber: number;
  targetNickname: string;
  targetAvatarUrl: string | null;
  createdAt: string;
}

export interface UNumberLookupDto {
  userId: number;
  unumber: number;
  nickname: string;
  avatarUrl: string | null;
}

export interface MatchRecommendationDto {
  id: number;
  userId: number;
  nickname: string;
  avatarUrl?: string | null;
  school: string;
  major: string;
  languages: string[];
  tags: string[];
  matchReason: string;
  matchScore: number;
}

export interface PublicUserSummaryDto {
  userId: number;
  unumber: number;
  email: string | null;
  nickname: string;
  originalNickname: string;
  remarkName: string | null;
  isFriend: boolean;
  avatarUrl?: string | null;
  school: string;
  major: string;
  languages: string[];
  bio: string;
}

function normalizeLoggedInAccount(account: Partial<PublicUserSummaryDto>): PublicUserSummaryDto | null {
  if (!Number.isFinite(account.userId) || !Number.isFinite(account.unumber) || !account.nickname?.trim()) {
    return null;
  }

  return {
    userId: Number(account.userId),
    unumber: Number(account.unumber),
    email: account.email ?? null,
    nickname: account.nickname.trim(),
    originalNickname: account.originalNickname?.trim() || account.nickname.trim(),
    remarkName: account.remarkName ?? null,
    isFriend: Boolean(account.isFriend),
    avatarUrl: account.avatarUrl ?? null,
    school: account.school ?? '',
    major: account.major ?? '',
    languages: Array.isArray(account.languages) ? account.languages.filter((item): item is string => typeof item === 'string') : [],
    bio: account.bio ?? '',
  };
}

export interface CircleSummaryDto {
  id: number;
  name: string;
  icon: string;
  members: number;
  posts: number;
  description: string;
  tags: string[];
  hot: boolean;
  joined: boolean;
}

export interface JoinedCircleDto {
  id: number;
  name: string;
  icon: string;
  members: number;
  unread: number;
  lastMessage: string;
  lastTime: string;
  isAdmin: boolean;
  isOwner: boolean;
}

export interface CircleDetailDto {
  id: number;
  name: string;
  icon: string;
  members: number;
  posts: number;
  description: string;
  tags: string[];
  hot: boolean;
  joined: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  canManageAdmins: boolean;
  canDeleteCircle: boolean;
  canManageContent: boolean;
  announcement: string;
}

export interface CircleActivityDto {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface CircleMemberDto {
  id: number;
  userId: number;
  nickname: string;
  school: string;
  major: string;
  bio: string;
  avatarUrl?: string | null;
  isAdmin: boolean;
  isOwner: boolean;
  joinedAt: string;
}

export interface ArticleSummaryDto {
  id: number;
  category: string;
  title: string;
  summary: string;
  updatedAt: string;
  sourceName: string;
}

export interface ArticleDetailDto {
  id: number;
  category: string;
  title: string;
  content: string;
  updatedAt: string;
  sourceName: string;
  sourceUrl: string | null;
}

export interface PostSummaryDto {
  id: number;
  authorUserId: number | null;
  authorName: string;
  authorAvatarUrl?: string | null;
  boardName: string;
  title: string;
  summary: string;
  imageUrls: string[];
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  createdAt: string;
}

export interface PostCommentDto {
  id: number;
  authorName: string;
  authorAvatarUrl?: string | null;
  content: string;
  createdAt: string;
}

export interface PostDetailDto {
  id: number;
  authorUserId: number | null;
  authorName: string;
  authorAvatarUrl?: string | null;
  boardName: string;
  title: string;
  content: string;
  imageUrls: string[];
  anonymous: boolean;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  createdAt: string;
  comments: PostCommentDto[];
}

export interface PostReactionDto {
  postId: number;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
}

function readStorage(key: string) {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(key);
}

function writeStorage(key: string, value: string) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(key, value);
}

function removeStorage(key: string) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(key);
}

function readLoggedInAccountsStorage() {
  const raw = readStorage(LOGGED_IN_ACCOUNTS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => normalizeLoggedInAccount(item as Partial<PublicUserSummaryDto>))
      .filter((item): item is PublicUserSummaryDto => item !== null);
  } catch {
    return [];
  }
}

function writeLoggedInAccountsStorage(accounts: PublicUserSummaryDto[]) {
  writeStorage(LOGGED_IN_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function upsertLoggedInAccount(account: Partial<PublicUserSummaryDto>) {
  const normalized = normalizeLoggedInAccount(account);
  if (!normalized) {
    return;
  }

  const existingAccounts = readLoggedInAccountsStorage();
  const nextAccounts = [
    normalized,
    ...existingAccounts.filter((item) => item.userId !== normalized.userId),
  ].map((item, index) => {
    if (index !== 0 || item.userId !== normalized.userId) {
      return item;
    }
    const previous = existingAccounts.find((candidate) => candidate.userId === normalized.userId);
    if (!previous) {
      return normalized;
    }
    return {
      ...previous,
      ...normalized,
      email: normalized.email ?? previous.email,
      avatarUrl: normalized.avatarUrl ?? previous.avatarUrl,
      school: normalized.school || previous.school,
      major: normalized.major || previous.major,
      languages: normalized.languages.length > 0 ? normalized.languages : previous.languages,
      bio: normalized.bio || previous.bio,
    };
  });

  writeLoggedInAccountsStorage(nextAccounts);
}

export function getLoggedInAccounts() {
  return readLoggedInAccountsStorage();
}

export function syncLoggedInAccountProfile(profile: UserProfileDto) {
  upsertLoggedInAccount({
    userId: profile.id,
    unumber: profile.unumber,
    nickname: profile.nickname,
    originalNickname: profile.nickname,
    avatarUrl: profile.avatarUrl ?? null,
    school: profile.school,
    major: profile.major,
    languages: profile.languages,
    bio: profile.bio,
  });
}

function saveSession(session: AuthSession, email?: string | null) {
  writeStorage(TOKEN_KEY, session.token);
  writeStorage(USER_ID_KEY, String(session.userId));
  writeStorage(U_NUMBER_KEY, String(session.uNumber));
  writeStorage(NICKNAME_KEY, session.nickname);
  upsertLoggedInAccount({
    userId: session.userId,
    unumber: session.uNumber,
    email,
    nickname: session.nickname,
    originalNickname: session.nickname,
  });
  removeStorage(LEGACY_TOKEN_KEY);
  removeStorage(LEGACY_USER_ID_KEY);
  removeStorage(LEGACY_NICKNAME_KEY);
  removeStorage(CURRENT_USER_CACHE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sw-auth-changed'));
  }
}

function getTempConversationStorageKey() {
  const session = getStoredSession();
  return session ? `${TEMP_CONVERSATION_IDS_KEY}:${session.userId}` : TEMP_CONVERSATION_IDS_KEY;
}

function getHiddenConversationStorageKey() {
  const session = getStoredSession();
  return session ? `${HIDDEN_CONVERSATION_IDS_KEY}:${session.userId}` : HIDDEN_CONVERSATION_IDS_KEY;
}

export function getTemporaryConversationIds() {
  const raw = readStorage(getTempConversationStorageKey());
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.map(Number).filter((id) => Number.isFinite(id))
      : [];
  } catch {
    return [];
  }
}

export function saveTemporaryConversationId(conversationId: number) {
  const ids = new Set(getTemporaryConversationIds());
  ids.add(conversationId);
  writeStorage(getTempConversationStorageKey(), JSON.stringify(Array.from(ids)));
}

export function removeTemporaryConversationId(conversationId: number) {
  const ids = getTemporaryConversationIds().filter((id) => id !== conversationId);
  writeStorage(getTempConversationStorageKey(), JSON.stringify(ids));
}

export function getHiddenConversationIds() {
  const raw = readStorage(getHiddenConversationStorageKey());
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.map(Number).filter((id) => Number.isFinite(id))
      : [];
  } catch {
    return [];
  }
}

export function hideConversationId(conversationId: number) {
  const ids = new Set(getHiddenConversationIds());
  ids.add(conversationId);
  writeStorage(getHiddenConversationStorageKey(), JSON.stringify(Array.from(ids)));
}

export function unhideConversationId(conversationId: number) {
  const ids = getHiddenConversationIds().filter((id) => id !== conversationId);
  writeStorage(getHiddenConversationStorageKey(), JSON.stringify(ids));
}

export function getStoredSession(): AuthSession | null {
  const token = readStorage(TOKEN_KEY);
  const userId = readStorage(USER_ID_KEY);
  const uNumber = readStorage(U_NUMBER_KEY);
  const nickname = readStorage(NICKNAME_KEY);
  if (!token || !userId || !uNumber || !nickname) {
    return null;
  }
  return { token, userId: Number(userId), uNumber: Number(uNumber), nickname };
}

async function requestAuth(path: '/auth/login' | '/auth/register', body: Record<string, string>) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw withNetworkDiagnostics(error, path);
  }
  const payload = await readBackendEnvelope<AuthSession>(response, '认证失败');
  if (!response.ok) {
    throw new Error(payload.message ?? '认证失败');
  }
  if (!payload.data) {
    throw new Error('认证失败：服务器返回了空数据');
  }
  saveSession(payload.data, body.email ?? null);
  return payload.data;
}

export function authHeaders(session: AuthSession) {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${session.token}`);
  return headers;
}

export function login(email: string, password: string) {
  return requestAuth('/auth/login', { email, password });
}

export async function sendEmailCode(email: string, scene: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD') {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, scene }),
    });
  } catch (error) {
    throw withNetworkDiagnostics(error, '/auth/send-code');
  }
  const payload = await readBackendEnvelope<{ message: string; expiresInSeconds: number; resendIntervalSeconds: number }>(response, '验证码发送失败');
  if (!response.ok || !payload.data) {
    throw new Error(payload.message ?? '验证码发送失败');
  }
  return payload.data;
}

export function register(email: string, password: string, nickname: string, verificationCode: string) {
  return requestAuth('/auth/register', { email, password, nickname, verificationCode });
}

export function loginWithCode(email: string, verificationCode: string) {
  return requestAuth('/auth/login/code', { email, verificationCode });
}

export async function resetPassword(email: string, verificationCode: string, newPassword: string) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, verificationCode, newPassword }),
    });
  } catch (error) {
    throw withNetworkDiagnostics(error, '/auth/reset-password');
  }
  const payload = await readBackendEnvelope<{ message: string }>(response, '重置密码失败');
  if (!response.ok || !payload.data) {
    throw new Error(payload.message ?? '重置密码失败');
  }
  return payload.data;
}

export async function validateStoredSession(): Promise<AuthSession | null> {
  const session = getStoredSession();
  if (!session) {
    clearSession();
    return null;
  }

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
      headers: authHeaders(session),
    }, 4000);
    const payload = await readBackendEnvelope<AuthUserDto>(response, '登录状态校验失败');
    if (!response.ok || !payload.data) {
      clearSession();
      return null;
    }
    const refreshedSession = {
      token: session.token,
      userId: payload.data.userId,
      uNumber: payload.data.unumber,
      nickname: payload.data.nickname,
    };
    saveSession(refreshedSession);
    return refreshedSession;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  removeStorage(TOKEN_KEY);
  removeStorage(USER_ID_KEY);
  removeStorage(U_NUMBER_KEY);
  removeStorage(NICKNAME_KEY);
  removeStorage(LEGACY_TOKEN_KEY);
  removeStorage(LEGACY_USER_ID_KEY);
  removeStorage(LEGACY_NICKNAME_KEY);
  removeStorage(CURRENT_USER_CACHE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sw-auth-changed'));
  }
}

export async function backendRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getStoredSession();
  if (!session) {
    throw new Error('请先登录');
  }
  const headers = new Headers(init?.headers);
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${session.token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    throw withNetworkDiagnostics(error, path);
  }
  const payload = await readBackendEnvelope<T>(response, '请求失败');
  if (!response.ok) {
    throw new Error(payload.message ?? '请求失败');
  }
  if (payload.data === undefined) {
    throw new Error('请求失败：服务器返回了空数据');
  }
  return payload.data;
}

export async function getBoards() {
  return backendRequest<BoardSummaryDto[]>('/posts/boards');
}

export async function getPosts() {
  return backendRequest<PostSummaryDto[]>('/posts');
}

export async function getMomentPosts() {
  return backendRequest<PostSummaryDto[]>('/posts/moments');
}

export async function getThemePosts(theme: string) {
  return backendRequest<PostSummaryDto[]>(`/posts/discover/${encodeURIComponent(theme)}`);
}

export async function getPostDetail(postId: number) {
  return backendRequest<PostDetailDto>(`/posts/${postId}`);
}

export async function createPost(payload: {
  boardId: number;
  title?: string;
  content: string;
  imageUrls?: string[];
  anonymous?: boolean;
}) {
  return backendRequest<PostSummaryDto>('/posts', {
    method: 'POST',
    body: JSON.stringify({
      boardId: payload.boardId,
      title: payload.title ?? null,
      content: payload.content,
      imageUrls: payload.imageUrls ?? [],
      anonymous: payload.anonymous ?? false,
    }),
  });
}

export async function createCircle(payload: {
  name: string;
  description: string;
  icon?: string;
}) {
  return backendRequest<CircleDetailDto>('/circles', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      icon: payload.icon ?? null,
    }),
  });
}

export async function uploadCircleIcon(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return backendRequest<{ iconUrl: string }>('/circles/icon', {
    method: 'POST',
    body: formData,
  });
}

export async function createMomentPost(payload: {
  title?: string;
  content: string;
  imageUrls?: string[];
}) {
  return backendRequest<PostSummaryDto>('/posts/moments', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title ?? null,
      content: payload.content,
      imageUrls: payload.imageUrls ?? [],
    }),
  });
}

export async function updatePostLike(postId: number, liked: boolean) {
  return backendRequest<PostReactionDto>(`/posts/${postId}/like`, {
    method: 'POST',
    body: JSON.stringify({ liked }),
  });
}

export async function updatePostFavorite(postId: number, favorited: boolean) {
  return backendRequest<PostReactionDto>(`/posts/${postId}/favorite`, {
    method: 'POST',
    body: JSON.stringify({ favorited }),
  });
}

export async function createPostComment(postId: number, content: string) {
  return backendRequest<PostCommentDto>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function getCircles() {
  return backendRequest<CircleSummaryDto[]>('/circles');
}

export async function getCircleDetail(circleId: number) {
  return backendRequest<CircleDetailDto>(`/circles/${circleId}`);
}

export async function getCircleActivities(circleId: number) {
  return backendRequest<CircleActivityDto[]>(`/circles/${circleId}/activities`);
}

export async function getCircleMembers(circleId: number) {
  return backendRequest<CircleMemberDto[]>(`/circles/${circleId}/members`);
}

export async function getCirclePosts(circleId: number) {
  return backendRequest<PostSummaryDto[]>(`/circles/${circleId}/posts`);
}

export async function updateCircleAnnouncement(circleId: number, announcement: string) {
  return backendRequest<CircleDetailDto>(`/circles/${circleId}/announcement`, {
    method: 'PATCH',
    body: JSON.stringify({ announcement }),
  });
}

export async function addCircleAdmin(circleId: number, targetUserId: number) {
  return backendRequest<CircleMemberDto[]>(`/circles/${circleId}/admins`, {
    method: 'POST',
    body: JSON.stringify({ targetUserId }),
  });
}

export async function removeCircleAdmin(circleId: number, targetUserId: number) {
  return backendRequest<CircleMemberDto[]>(`/circles/${circleId}/admins/${targetUserId}`, {
    method: 'DELETE',
  });
}

export async function deleteCirclePost(circleId: number, postId: number) {
  return backendRequest<{ circleId: number; postId: number; status: string }>(`/circles/${circleId}/posts/${postId}`, {
    method: 'DELETE',
  });
}

export async function deleteCircle(circleId: number) {
  return backendRequest<{ circleId: number; status: string }>(`/circles/${circleId}`, {
    method: 'DELETE',
  });
}

export async function joinCircle(circleId: number) {
  return backendRequest<{ circleId: number; status: string }>(`/circles/${circleId}/join`, {
    method: 'POST',
  });
}

export async function leaveCircle(circleId: number) {
  return backendRequest<{ circleId: number; status: string }>(`/circles/${circleId}/leave`, {
    method: 'POST',
  });
}

export async function openDirectConversation(targetUserId: number) {
  const detail = await backendRequest<ConversationDetailDto>('/messages/direct', {
    method: 'POST',
    body: JSON.stringify({ targetUserId }),
  });
  if (!detail.isFriend) {
    saveTemporaryConversationId(detail.id);
  }
  unhideConversationId(detail.id);
  return detail;
}

export async function openGroupConversation(groupNumber: number) {
  return backendRequest<ConversationDetailDto>('/messages/groups', {
    method: 'POST',
    body: JSON.stringify({
      groupNumber,
      memberUserIds: [],
    } satisfies GroupConversationRequestDto & { memberUserIds: number[] }),
  });
}

export async function createGroupConversation(memberUserIds: number[]) {
  return backendRequest<ConversationDetailDto>('/messages/groups', {
    method: 'POST',
    body: JSON.stringify({
      memberUserIds,
      groupNumber: null,
    } satisfies GroupConversationRequestDto & { memberUserIds: number[] }),
  });
}

export async function createDetailedGroupConversation(payload: {
  memberUserIds: number[];
  groupName: string;
  groupDescription: string;
  groupAvatarUrl?: string | null;
}) {
  const body: Record<string, unknown> = {
    memberUserIds: payload.memberUserIds,
    groupName: payload.groupName,
    groupDescription: payload.groupDescription,
    groupAvatarUrl: payload.groupAvatarUrl ?? null,
  };
  return backendRequest<ConversationDetailDto>('/messages/groups', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getGroupMembers(conversationId: number) {
  return backendRequest<GroupMemberDto[]>(`/messages/groups/${conversationId}/members`);
}

export async function updateGroupConversation(
  conversationId: number,
  payload: {
    groupName?: string | null;
    groupDescription?: string | null;
    groupAvatarUrl?: string | null;
    memberUserIds?: number[];
  },
) {
  return backendRequest<ConversationDetailDto>(`/messages/groups/${conversationId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getFriends() {
  return backendRequest<FriendDto[]>('/users/friends');
}

export async function getPublicUsers() {
  return backendRequest<PublicUserSummaryDto[]>('/users/public');
}

export async function getPublicUser(userId: number) {
  return backendRequest<PublicUserSummaryDto>(`/users/public/${userId}`);
}

export async function getLevelSummary() {
  return backendRequest<LevelSummaryDto>('/users/level-summary');
}

export async function updateProfile(payload: {
  nickname: string;
  school: string;
  major: string;
  languages: string[];
  bio: string;
  privacyLevel?: string;
}) {
  return backendRequest<UserProfileDto>('/users/profile', {
    method: 'PUT',
    body: JSON.stringify({
      nickname: payload.nickname,
      school: payload.school,
      major: payload.major,
      languages: payload.languages,
      bio: payload.bio,
      privacyLevel: payload.privacyLevel ?? 'PUBLIC',
    }),
  });
}

export async function addFriend(targetUserId: number) {
  return backendRequest<FriendRequestDto>('/users/friend-requests', {
    method: 'POST',
    body: JSON.stringify({ targetUserId }),
  });
}

export async function addFriendByUNumber(targetUNumber: number) {
  return backendRequest<FriendRequestDto>('/users/friend-requests', {
    method: 'POST',
    body: JSON.stringify({ targetUNumber }),
  });
}

export async function lookupUserByUNumber(uNumber: number) {
  return backendRequest<UNumberLookupDto>(`/users/lookup?uNumber=${encodeURIComponent(String(uNumber))}`);
}

export async function getFriendRequests() {
  return backendRequest<FriendRequestDto[]>('/users/friend-requests');
}

export async function acceptFriendRequest(requestId: number) {
  return backendRequest<FriendRequestDto>(`/users/friend-requests/${requestId}/accept`, {
    method: 'POST',
  });
}

export async function rejectFriendRequest(requestId: number) {
  return backendRequest<FriendRequestDto>(`/users/friend-requests/${requestId}/reject`, {
    method: 'POST',
  });
}

export async function getNotifications() {
  return backendRequest<NotificationDto[]>('/messages/notifications');
}

export async function getLatestVerification() {
  return backendRequest<VerificationRecordDto | null>('/verifications/latest');
}

export async function submitVerification(payload: {
  verifyType: string;
  fileUrl: string;
}) {
  return backendRequest<VerificationRecordDto>('/verifications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getBlockedUsers() {
  return backendRequest<BlockedUserDto[]>('/users/blocks');
}

export async function blockUser(targetUserId: number) {
  return backendRequest<BlockedUserDto>('/users/blocks', {
    method: 'POST',
    body: JSON.stringify({ targetUserId }),
  });
}

export async function unblockUser(targetUserId: number) {
  return backendRequest<{ status: string; targetUserId: number }>(`/users/blocks/${targetUserId}`, {
    method: 'DELETE',
  });
}

export async function updateFriendRemark(friendUserId: number, remarkName: string) {
  return backendRequest<FriendDto>(`/users/friends/${friendUserId}/remark`, {
    method: 'PUT',
    body: JSON.stringify({ remarkName }),
  });
}

export function buildAvatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export function resolveAvatarUrl(avatarUrl?: string | null, fallbackSeed?: string) {
  if (avatarUrl) {
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:')) {
      return avatarUrl;
    }
    if (avatarUrl.startsWith('/')) {
      return `${API_ORIGIN}${avatarUrl}`;
    }
  }
  return buildAvatarUrl(fallbackSeed ?? 'user');
}

export function formatVerificationLabel(status: string) {
  switch (status) {
    case 'APPROVED':
      return '认证已通过';
    case 'PENDING':
      return '认证审核中';
    case 'REJECTED':
      return '认证被驳回';
    default:
      return '未认证';
  }
}
