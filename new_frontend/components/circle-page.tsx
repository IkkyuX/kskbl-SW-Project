"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, ChevronRight, Crown, Flame, Loader2, Plus, Search, Sparkles, Star, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import {
  backendRequest,
  CircleMemberDto,
  buildAvatarUrl,
  CircleActivityDto,
  CircleDetailDto,
  CircleSummaryDto,
  JoinedCircleDto,
  PostDetailDto,
  PostSummaryDto,
} from "@/lib/backend"
import { cn } from "@/lib/utils"
import { PostDetailView } from "@/components/post-detail-view"

const tabs = [
  { id: "discover", label: "发现" },
  { id: "joined", label: "我加入的" },
]

const circleCategories = [
  { id: "school", label: "学校圈", icon: "🎓" },
  { id: "city", label: "城市圈", icon: "🏙️" },
  { id: "interest", label: "兴趣圈", icon: "⭐" },
  { id: "freshman", label: "新生圈", icon: "👋" },
]

const invitations = [
  {
    id: 1,
    name: "首尔摄影俱乐部",
    icon: "📷",
    inviter: "小明",
    members: 567,
  },
]

interface DiscoverCircle {
  id: number
  name: string
  icon: string
  members: number
  posts: number
  description: string
  tags: string[]
  hot: boolean
  joined: boolean
  recentMembers: string[]
}

interface JoinedCircle {
  id: number
  name: string
  icon: string
  members: number
  unread: number
  lastMessage: string
  lastTime: string
  isAdmin: boolean
}

function hasDescription(circle: DiscoverCircle | JoinedCircle | null): circle is DiscoverCircle {
  return Boolean(circle && "description" in circle)
}

function hasTags(circle: DiscoverCircle | JoinedCircle | null): circle is DiscoverCircle {
  return Boolean(circle && "tags" in circle)
}

function hasLastMessage(circle: DiscoverCircle | JoinedCircle | null): circle is JoinedCircle {
  return Boolean(circle && "lastMessage" in circle)
}

const fallbackDiscoverCircles: DiscoverCircle[] = [
  {
    id: 1,
    name: "首尔大学留学生",
    icon: "🎓",
    members: 2340,
    posts: 156,
    description: "首尔大学在读留学生交流圈",
    tags: ["学习", "生活", "交友"],
    hot: true,
    joined: false,
    recentMembers: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=m1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=m2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=m3",
    ],
  },
  {
    id: 2,
    name: "美食探店小分队",
    icon: "🍜",
    members: 1892,
    posts: 423,
    description: "发现首尔好吃的餐厅和美食",
    tags: ["美食", "探店", "分享"],
    hot: true,
    joined: true,
    recentMembers: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=f1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=f2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=f3",
    ],
  },
]

const fallbackJoinedCircles: JoinedCircle[] = [
  {
    id: 2,
    name: "美食探店小分队",
    icon: "🍜",
    members: 1892,
    unread: 12,
    lastMessage: "刚发现一家超棒的烤肉店...",
    lastTime: "5分钟前",
    isAdmin: false,
  },
]

function mapDiscoverCircle(circle: CircleSummaryDto): DiscoverCircle {
  return {
    id: circle.id,
    name: circle.name,
    icon: circle.icon,
    members: circle.members,
    posts: circle.posts,
    description: circle.description,
    tags: circle.tags,
    hot: circle.hot,
    joined: circle.joined,
    recentMembers: [
      buildAvatarUrl(`${circle.name}-1`),
      buildAvatarUrl(`${circle.name}-2`),
      buildAvatarUrl(`${circle.name}-3`),
    ],
  }
}

function mapJoinedCircle(circle: JoinedCircleDto): JoinedCircle {
  return {
    id: circle.id,
    name: circle.name,
    icon: circle.icon,
    members: circle.members,
    unread: circle.unread,
    lastMessage: circle.lastMessage,
    lastTime: circle.lastTime,
    isAdmin: circle.isAdmin,
  }
}

interface CirclePageProps {
  autoOpenCircleId?: number | null
  onAutoOpenHandled?: () => void
  onDetailModeChange?: (isDetailMode: boolean) => void
}

export function CirclePage({ autoOpenCircleId, onAutoOpenHandled, onDetailModeChange }: CirclePageProps) {
  const [activeTab, setActiveTab] = useState("discover")
  const [detailTab, setDetailTab] = useState<"overview" | "activity" | "members">("overview")
  const [discoverCircles, setDiscoverCircles] = useState<DiscoverCircle[]>(fallbackDiscoverCircles)
  const [joinedCircles, setJoinedCircles] = useState<JoinedCircle[]>(fallbackJoinedCircles)
  const [circleError, setCircleError] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [circleDetail, setCircleDetail] = useState<CircleDetailDto | null>(null)
  const [circleActivities, setCircleActivities] = useState<CircleActivityDto[]>([])
  const [circleMembers, setCircleMembers] = useState<CircleMemberDto[]>([])
  const [circlePosts, setCirclePosts] = useState<PostSummaryDto[]>([])
  const [selectedPostDetail, setSelectedPostDetail] = useState<PostDetailDto | null>(null)
  const [postDetailLoading, setPostDetailLoading] = useState(false)
  const [postDetailError, setPostDetailError] = useState<string | null>(null)

  const currentJoined = useMemo(() => {
    if (!selectedCircleId) {
      return false
    }
    return discoverCircles.find((circle) => circle.id === selectedCircleId)?.joined ?? false
  }, [discoverCircles, selectedCircleId])

  const currentCirclePreview = useMemo(() => {
    if (!selectedCircleId) {
      return null
    }
    return discoverCircles.find((circle) => circle.id === selectedCircleId)
      ?? joinedCircles.find((circle) => circle.id === selectedCircleId)
      ?? null
  }, [discoverCircles, joinedCircles, selectedCircleId])

  const loadCircles = async () => {
    const [discoverResponse, joinedResponse] = await Promise.all([
      backendRequest<CircleSummaryDto[]>("/circles"),
      backendRequest<JoinedCircleDto[]>("/circles/joined"),
    ])
    setDiscoverCircles(discoverResponse.map(mapDiscoverCircle))
    setJoinedCircles(joinedResponse.map(mapJoinedCircle))
    setCircleError(null)
  }

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        const [discoverResponse, joinedResponse] = await Promise.all([
          backendRequest<CircleSummaryDto[]>("/circles"),
          backendRequest<JoinedCircleDto[]>("/circles/joined"),
        ])
        if (cancelled) {
          return
        }
        setDiscoverCircles(discoverResponse.map(mapDiscoverCircle))
        setJoinedCircles(joinedResponse.map(mapJoinedCircle))
        setCircleError(null)
      } catch (error) {
        if (!cancelled) {
          setCircleError(error instanceof Error ? error.message : "圈子加载失败")
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!autoOpenCircleId) {
      return
    }
    void openCircleDetail(autoOpenCircleId).finally(() => onAutoOpenHandled?.())
  }, [autoOpenCircleId, onAutoOpenHandled])

  useEffect(() => {
    onDetailModeChange?.(selectedPostDetail !== null)
    return () => onDetailModeChange?.(false)
  }, [onDetailModeChange, selectedPostDetail])

  const openCircleDetail = async (circleId: number) => {
    setSelectedCircleId(circleId)
    setDetailOpen(true)
    setDetailTab("overview")
    setDetailLoading(true)
    setDetailError(null)

    try {
      const [detailResponse, activitiesResponse, membersResponse, postsResponse] = await Promise.all([
        backendRequest<CircleDetailDto>(`/circles/${circleId}`),
        backendRequest<CircleActivityDto[]>(`/circles/${circleId}/activities`),
        backendRequest<CircleMemberDto[]>(`/circles/${circleId}/members`),
        backendRequest<PostSummaryDto[]>(`/circles/${circleId}/posts`),
      ])
      setCircleDetail(detailResponse)
      setCircleActivities(activitiesResponse)
      setCircleMembers(membersResponse)
      setCirclePosts(postsResponse)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "圈子详情加载失败")
      setCircleDetail(null)
      setCircleActivities([])
      setCircleMembers([])
      setCirclePosts([])
    } finally {
      setDetailLoading(false)
    }
  }

  const toggleJoin = async (circleId: number, joined: boolean) => {
    try {
      await backendRequest(`/circles/${circleId}/${joined ? "leave" : "join"}`, {
        method: "POST",
      })
      await loadCircles()
      if (selectedCircleId === circleId) {
        await openCircleDetail(circleId)
      }
    } catch (error) {
      setCircleError(error instanceof Error ? error.message : "圈子操作失败")
    }
  }

  const openPostDetail = async (postId: number) => {
    setPostDetailLoading(true)
    setPostDetailError(null)
    try {
      const detail = await backendRequest<PostDetailDto>(`/posts/${postId}`)
      setSelectedPostDetail(detail)
    } catch (error) {
      setPostDetailError(error instanceof Error ? error.message : "帖子详情加载失败")
      setSelectedPostDetail(null)
    } finally {
      setPostDetailLoading(false)
    }
  }

  return (
    <div className="bg-transparent min-h-screen">
      <div className="sticky top-0 bg-card/80 backdrop-blur-sm z-40 border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10" />
        <div className="relative px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-foreground">圈子</h1>
            <Button variant="ghost" size="icon" className="size-9 rounded-full">
              <Search className="size-4" />
            </Button>
          </div>

          <div className="flex gap-1 bg-secondary rounded-full p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-1.5 rounded-full text-sm font-medium transition-all",
                  activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {circleError && (
        <div className="px-4 pt-3">
          <Card className="p-3 border-amber-200 bg-amber-50/80 text-amber-700">
            <p className="text-xs">{circleError}，当前部分圈子内容可能仍在使用演示数据。</p>
          </Card>
        </div>
      )}

      {activeTab === "discover" ? (
        <>
          <div className="relative px-4 py-3">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-transparent" />
            <div className="relative grid grid-cols-4 gap-3">
              {circleCategories.map((cat, idx) => (
                <button
                  key={cat.id}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-105",
                    idx === 0 ? "bg-primary/10 border-primary/30" :
                    idx === 1 ? "bg-accent/10 border-accent/30" :
                    "bg-card border-border/50"
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-foreground">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {invitations.length > 0 && (
            <div className="px-4 pb-3">
              <Card className="p-3 bg-accent/10 border-accent/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-accent/20 flex items-center justify-center text-lg">
                    {invitations[0].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">{invitations[0].name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {invitations[0].inviter} 邀请你加入 · {invitations[0].members}成员
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      忽略
                    </Button>
                    <Button size="sm" className="h-7 px-3 text-xs bg-accent text-accent-foreground">
                      加入
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="size-4 text-primary" />
                <h2 className="font-semibold text-foreground">推荐圈子</h2>
              </div>
            </div>
            <div className="space-y-3">
              {discoverCircles.map((circle) => (
                <Card key={circle.id} className="p-3 border-border/50 bg-card/80 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => openCircleDetail(circle.id)}
                      className="flex flex-1 items-start gap-3 min-w-0 text-left"
                    >
                      <div className="size-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">
                        {circle.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-medium text-foreground">{circle.name}</span>
                          {circle.hot && <span className="text-[10px]">🔥</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">{circle.description}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {circle.recentMembers.map((avatar, idx) => (
                              <Avatar key={idx} className="size-5 ring-2 ring-card">
                                <AvatarImage src={avatar} />
                                <AvatarFallback>U</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{circle.members}成员</span>
                          <span className="text-[10px] text-muted-foreground">{circle.posts}帖子</span>
                        </div>
                      </div>
                    </button>
                    <Button
                      size="sm"
                      onClick={() => toggleJoin(circle.id, circle.joined)}
                      className={cn(
                        "h-8 px-3 rounded-full text-xs shrink-0",
                        circle.joined
                          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      {circle.joined ? "已加入" : "加入"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/30">
                    <div className="flex gap-1.5 flex-wrap">
                      {circle.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCircleDetail(circle.id)}
                      className="h-7 px-2 text-xs text-muted-foreground"
                    >
                      查看
                      <ChevronRight className="size-3.5 ml-0.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="px-4 py-3 space-y-2">
            {joinedCircles.map((circle) => (
              <Card
                key={circle.id}
                className="p-3 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer"
                onClick={() => openCircleDetail(circle.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="size-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                      {circle.icon}
                    </div>
                    {circle.unread > 0 && (
                      <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {circle.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-medium text-foreground">{circle.name}</span>
                      {circle.isAdmin && <Crown className="size-3.5 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{circle.lastMessage}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-muted-foreground">{circle.lastTime}</span>
                    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Users className="size-3" />
                      <span>{circle.members}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="px-4 py-2">
            <Button variant="outline" className="w-full h-12 border-dashed border-border text-muted-foreground">
              <Plus className="size-4 mr-2" />
              创建新圈子
            </Button>
          </div>
        </>
      )}

      <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
        <DrawerContent className="max-h-[88vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <span className="text-2xl">{circleDetail?.icon ?? currentCirclePreview?.icon ?? "⭐"}</span>
              <span>{circleDetail?.name ?? currentCirclePreview?.name ?? "圈子详情"}</span>
            </DrawerTitle>
            <DrawerDescription>
              {circleDetail?.description
                ?? (hasLastMessage(currentCirclePreview) ? currentCirclePreview.lastMessage : undefined)
                ?? (hasDescription(currentCirclePreview) ? currentCirclePreview.description : undefined)
                ?? "查看圈子公告、成员规模和最近动态。"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 overflow-y-auto">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDetailTab("overview")}
                className={cn(
                  "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  detailTab === "overview" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
              >
                圈子概览
              </button>
              <button
                onClick={() => setDetailTab("activity")}
                className={cn(
                  "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  detailTab === "activity" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
              >
                最新动态
              </button>
              <button
                onClick={() => setDetailTab("members")}
                className={cn(
                  "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  detailTab === "members" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
              >
                成员
              </button>
            </div>

            {detailLoading ? (
              <Card className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                正在加载圈子详情...
              </Card>
            ) : detailError ? (
              <Card className="p-4 border-amber-200 bg-amber-50/80 text-amber-700">
                <p className="text-sm">{detailError}</p>
              </Card>
            ) : detailTab === "overview" ? (
              <div className="space-y-3">
                <Card className="p-4 border-border/50 bg-card/90">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          <Users className="size-3 mr-1" />
                          {circleDetail?.members ?? currentCirclePreview?.members ?? 0} 成员
                        </Badge>
                        <Badge variant="secondary" className="bg-accent/10 text-accent-foreground">
                          <Sparkles className="size-3 mr-1" />
                          {circleDetail?.posts ?? 0} 帖子
                        </Badge>
                        {(circleDetail?.hot ?? false) && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            <Flame className="size-3 mr-1" />
                            热门
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-6">
                        {circleDetail?.description
                          ?? (hasDescription(currentCirclePreview) ? currentCirclePreview.description : undefined)
                          ?? "这里会展示圈子简介。"}
                      </p>
                    </div>
                    {circleDetail?.isAdmin && <Crown className="size-5 text-yellow-500 fill-yellow-500 shrink-0" />}
                  </div>
                </Card>

                <Card className="p-4 border-border/50 bg-card/90">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">圈子公告</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-6">
                    {circleDetail?.announcement ?? "当前还没有公告。"}
                  </p>
                </Card>

                <Card className="p-4 border-border/50 bg-card/90">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">圈子标签</h3>
                    <span className="text-xs text-muted-foreground">更方便发现同类社群</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(circleDetail?.tags ?? (hasTags(currentCirclePreview) ? currentCirclePreview.tags : [])).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="px-2 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 border-border/50 bg-card/90">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">圈内热帖</h3>
                    <span className="text-xs text-muted-foreground">和这个圈子最相关的最近讨论</span>
                  </div>
                  <div className="space-y-3">
                    {circlePosts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => openPostDetail(post.id)}
                        className="w-full text-left rounded-xl border border-border/50 p-3 bg-background/60"
                      >
                        {post.imageUrls.length > 0 && (
                          <div className="mb-3 overflow-hidden rounded-xl bg-secondary">
                            <img src={post.imageUrls[0]} alt="" className="h-32 w-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground line-clamp-1">{post.title}</span>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {post.boardName}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-5">{post.summary}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                          <span>{post.authorName}</span>
                          <span>赞 {post.likeCount}</span>
                          <span>评 {post.commentCount}</span>
                        </div>
                      </button>
                    ))}
                    {circlePosts.length === 0 && (
                      <p className="text-sm text-muted-foreground">这个圈子暂时还没有可展示的相关帖子。</p>
                    )}
                  </div>
                </Card>
              </div>
            ) : detailTab === "activity" ? (
              <div className="space-y-3">
                {circleActivities.map((activity) => (
                  <Card key={activity.id} className="p-4 border-border/50 bg-card/90">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                            {activity.type}
                          </Badge>
                          <h3 className="text-sm font-semibold text-foreground">{activity.title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{activity.createdAt}</p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-6">{activity.content}</p>
                  </Card>
                ))}
                {circleActivities.length === 0 && (
                  <Card className="p-4 border-border/50 bg-card/90">
                    <p className="text-sm text-muted-foreground">这个圈子暂时还没有动态，等有人发起活动或公告后会显示在这里。</p>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {circleMembers.map((member) => (
                  <Card key={member.id} className="p-4 border-border/50 bg-card/90">
                    <div className="flex items-start gap-3">
                      <Avatar className="size-11 ring-2 ring-primary/10">
                        <AvatarImage src={member.avatarUrl ?? buildAvatarUrl(member.nickname)} />
                        <AvatarFallback>{member.nickname.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">{member.nickname}</span>
                          {member.isAdmin && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                              <Crown className="size-3 mr-1 fill-yellow-500" />
                              管理员
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.school} · {member.major}</p>
                        <p className="text-sm text-muted-foreground mt-2 leading-6">{member.bio}</p>
                        <p className="text-[11px] text-muted-foreground mt-2">加入时间：{member.joinedAt}</p>
                      </div>
                    </div>
                  </Card>
                ))}
                {circleMembers.length === 0 && (
                  <Card className="p-4 border-border/50 bg-card/90">
                    <p className="text-sm text-muted-foreground">这个圈子暂时还没有可展示的成员资料。</p>
                  </Card>
                )}
              </div>
            )}
          </div>

          <DrawerFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => selectedCircleId && openCircleDetail(selectedCircleId)}
                disabled={!selectedCircleId || detailLoading}
              >
                刷新详情
              </Button>
              <Button
                className="flex-1"
                onClick={() => selectedCircleId && toggleJoin(selectedCircleId, currentJoined)}
                disabled={!selectedCircleId || detailLoading}
              >
                {currentJoined ? "退出圈子" : "加入圈子"}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {postDetailLoading && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-md items-center justify-center bg-background/95 px-4">
          <Card className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            正在加载帖子详情...
          </Card>
        </div>
      )}
      {postDetailError && !selectedPostDetail && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-md items-center justify-center bg-background/95 px-4">
          <Card className="border-amber-200 bg-amber-50/80 p-4 text-amber-700">
            <p className="text-sm">{postDetailError}</p>
            <Button variant="outline" className="mt-3 w-full" onClick={() => setPostDetailError(null)}>
              返回
            </Button>
          </Card>
        </div>
      )}
      {selectedPostDetail && (
        <PostDetailView
          post={selectedPostDetail}
          onBack={() => {
            setSelectedPostDetail(null)
            setPostDetailError(null)
            setPostDetailLoading(false)
          }}
          onUpdated={(updated) => {
            setSelectedPostDetail(updated)
            setCirclePosts((prev) => prev.map((post) =>
              post.id === updated.id
                ? {
                    ...post,
                    likeCount: updated.likeCount,
                    commentCount: updated.commentCount,
                    favoriteCount: updated.favoriteCount,
                  }
                : post
            ))
          }}
        />
      )}
    </div>
  )
}
