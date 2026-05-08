"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8082/api/v1"
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@student.app"
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "123456"
const TOKEN_KEY = "unilink_demo_token"
const USER_ID_KEY = "unilink_demo_user_id"
const NICKNAME_KEY = "unilink_demo_nickname"
const POST_INTERACTION_KEY = "unilink_post_interactions"

export interface AuthSession {
  token: string
  userId: number
  nickname: string
}

export interface BackendEnvelope<T> {
  code?: number
  message?: string
  data: T
}

export interface MatchRecommendationDto {
  id: number
  userId: number
  nickname: string
  school: string
  major: string
  languages: string[]
  tags: string[]
  matchReason: string
  matchScore: number
}

export interface ArticleSummaryDto {
  id: number
  category: string
  title: string
  summary: string
  updatedAt: string
  sourceName: string
}

export interface ArticleDetailDto {
  id: number
  category: string
  title: string
  content: string
  updatedAt: string
  sourceName: string
  sourceUrl: string | null
}

export interface UserProfileDto {
  id: number
  nickname: string
  school: string
  major: string
  languages: string[]
  bio: string
  tags: string[]
  status: string
}

export interface TagOptionDto {
  id: number
  name: string
  type: string
}

export interface TagCatalogDto {
  interestTags: TagOptionDto[]
  sceneTags: TagOptionDto[]
  statusTags: TagOptionDto[]
}

export interface ConversationSummaryDto {
  id: number
  participantUserId: number
  name: string
  avatarSeed: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  pinned: boolean
  status: string
  nickname: string
}

export interface ChatMessageDto {
  id: number
  content: string
  time: string
  isMine: boolean
}

export interface ConversationDetailDto {
  id: number
  participantUserId: number
  name: string
  avatarSeed: string
  online: boolean
  nickname: string
  messages: ChatMessageDto[]
}

export interface NotificationDto {
  id: number
  type: string
  icon: string
  title: string
  content: string
  time: string
  read: boolean
}

export interface CircleSummaryDto {
  id: number
  name: string
  icon: string
  members: number
  posts: number
  description: string
  tags: string[]
  hot: boolean
  joined: boolean
}

export interface JoinedCircleDto {
  id: number
  name: string
  icon: string
  members: number
  unread: number
  lastMessage: string
  lastTime: string
  isAdmin: boolean
}

export interface CircleDetailDto {
  id: number
  name: string
  icon: string
  members: number
  posts: number
  description: string
  tags: string[]
  hot: boolean
  joined: boolean
  isAdmin: boolean
  announcement: string
}

export interface CircleActivityDto {
  id: string
  type: string
  title: string
  content: string
  createdAt: string
}

export interface CircleMemberDto {
  id: number
  userId: number
  nickname: string
  school: string
  major: string
  bio: string
  avatarUrl: string | null
  isAdmin: boolean
  joinedAt: string
}

export interface VerificationRecordDto {
  id: number
  verifyType: string
  fileUrl: string
  status: string
  rejectReason: string | null
}

export interface PostSummaryDto {
  id: number
  authorName: string
  boardName: string
  title: string
  summary: string
  imageUrls: string[]
  likeCount: number
  commentCount: number
  favoriteCount: number
  createdAt: string
}

export interface PostCommentDto {
  id: number
  authorName: string
  content: string
  createdAt: string
}

export interface PostDetailDto {
  id: number
  authorName: string
  boardName: string
  title: string
  content: string
  imageUrls: string[]
  anonymous: boolean
  likeCount: number
  commentCount: number
  favoriteCount: number
  createdAt: string
  comments: PostCommentDto[]
}

export interface PostReactionDto {
  postId: number
  liked: boolean
  likeCount: number
  commentCount: number
  favoriteCount: number
}

export interface PostInteractionState {
  liked: boolean
  favorited: boolean
}

let sessionPromise: Promise<AuthSession> | null = null

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null
  }
  const token = window.localStorage.getItem(TOKEN_KEY)
  const userId = window.localStorage.getItem(USER_ID_KEY)
  const nickname = window.localStorage.getItem(NICKNAME_KEY)
  if (!token || !userId || !nickname) {
    return null
  }
  return {
    token,
    userId: Number(userId),
    nickname,
  }
}

function saveSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(TOKEN_KEY, session.token)
  window.localStorage.setItem(USER_ID_KEY, String(session.userId))
  window.localStorage.setItem(NICKNAME_KEY, session.nickname)
}

export function clearSession() {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_ID_KEY)
  window.localStorage.removeItem(NICKNAME_KEY)
  sessionPromise = null
}

function readPostInteractions(): Record<string, PostInteractionState> {
  if (typeof window === "undefined") {
    return {}
  }
  const raw = window.localStorage.getItem(POST_INTERACTION_KEY)
  if (!raw) {
    return {}
  }
  try {
    return JSON.parse(raw) as Record<string, PostInteractionState>
  } catch {
    return {}
  }
}

function writePostInteractions(value: Record<string, PostInteractionState>) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(POST_INTERACTION_KEY, JSON.stringify(value))
}

export function getPostInteraction(postId: number): PostInteractionState {
  const interactions = readPostInteractions()
  return interactions[String(postId)] ?? { liked: false, favorited: false }
}

export function setPostInteraction(postId: number, next: Partial<PostInteractionState>) {
  const interactions = readPostInteractions()
  const key = String(postId)
  const current = interactions[key] ?? { liked: false, favorited: false }
  interactions[key] = {
    ...current,
    ...next,
  }
  writePostInteractions(interactions)
}

export async function ensureDemoSession(): Promise<AuthSession> {
  const stored = readStoredSession()
  if (stored) {
    return stored
  }
  if (!sessionPromise) {
    sessionPromise = fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as BackendEnvelope<AuthSession>
        if (!response.ok) {
          throw new Error(payload.message ?? "登录失败")
        }
        const session = payload.data
        saveSession(session)
        return session
      })
      .catch((error) => {
        sessionPromise = null
        throw error
      })
  }
  return sessionPromise
}

export async function backendRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await ensureDemoSession()
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  headers.set("Authorization", `Bearer ${session.token}`)
  headers.set("X-User-Id", String(session.userId))
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })
  const payload = (await response.json()) as BackendEnvelope<T>
  if (!response.ok) {
    throw new Error(payload.message ?? "请求失败")
  }
  return payload.data
}

export function buildAvatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
}

export function formatVerificationLabel(status: string) {
  switch (status) {
    case "APPROVED":
      return "认证已通过"
    case "PENDING":
      return "认证审核中"
    case "REJECTED":
      return "认证被驳回"
    default:
      return "未认证"
  }
}
