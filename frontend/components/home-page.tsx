"use client"

import { useState, useEffect } from "react"
import { Search, Bell, MapPin, ChevronRight, Utensils, Home as HomeIcon, Briefcase, BookOpen, ShoppingBag, AlertTriangle, Users, Sparkles, ArrowLeft, Send, Heart, MessageCircle, Clock, Calendar, X, UserPlus, Check, Edit3 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArticleDetailDto, ArticleSummaryDto, backendRequest, buildAvatarUrl, getPostInteraction, MatchRecommendationDto, PostDetailDto, PostSummaryDto, UserProfileDto } from "@/lib/backend"
import { useLanguage } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { PostDetailView } from "@/components/post-detail-view"

interface Comment {
  id: number
  author: { name: string; avatar: string }
  content: string
  time: string
  likes: number
  liked: boolean
}

interface PostItem {
  id: number
  author: { name: string; avatar: string }
  content: string
  time: string
  location: string
  likes: number
  comments: Comment[]
  liked: boolean
}

const initialMealBuddyPosts: PostItem[] = [
  {
    id: 1,
    author: { name: "吃货小王", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=wang" },
    content: "周五晚上有人想一起去新村吃烤肉吗？AA制，最好3-4人",
    time: "2小时前",
    location: "新村站",
    likes: 12,
    comments: [
      { id: 1, author: { name: "火锅控", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hg" }, content: "我想去！几点？", time: "1小时前", likes: 2, liked: false },
    ],
    liked: false,
  },
  {
    id: 2,
    author: { name: "火锅爱好者", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=huoguo" },
    content: "求组火锅局！本周末有空的小伙伴私信我～",
    time: "4小时前",
    location: "弘大",
    likes: 23,
    comments: [],
    liked: false,
  },
  {
    id: 3,
    author: { name: "麻辣控", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mala" },
    content: "找到一家超正宗的川菜馆，有人想一起去吗？",
    time: "6小时前",
    location: "江南区",
    likes: 45,
    comments: [
      { id: 1, author: { name: "川菜粉", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=cc" }, content: "求地址！", time: "5小时前", likes: 5, liked: false },
      { id: 2, author: { name: "辣椒选手", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lj" }, content: "我也想去", time: "4小时前", likes: 3, liked: false },
    ],
    liked: true,
  },
]

const initialRoommatePosts: PostItem[] = [
  {
    id: 1,
    author: { name: "小美", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mei" },
    content: "新村站附近合租，单间50万韩元/月，限女生，即日起可入住",
    time: "3小时前",
    location: "新村站",
    likes: 8,
    comments: [],
    liked: false,
  },
  {
    id: 2,
    author: { name: "学长", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=xuez" },
    content: "弘大2号线 oneroom转让，65万韩元/月，下月1号可入住",
    time: "5小时前",
    location: "弘大",
    likes: 15,
    comments: [
      { id: 1, author: { name: "找房中", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zf" }, content: "有图片吗？", time: "4小时前", likes: 1, liked: false },
    ],
    liked: false,
  },
]

interface UserDetail {
  id: number
  name: string
  avatar: string
  school: string
  tags: string[]
  matchReason: string
  status: string
  online: boolean
  followed: boolean
  nickname: string
}

const initialRecommendedUsers: UserDetail[] = [
  {
    id: 1,
    name: "小雨",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rain",
    school: "首尔大学",
    tags: ["找饭搭子", "中国菜"],
    matchReason: "同在首尔 · 都喜欢中餐",
    status: "想吃火锅",
    online: true,
    followed: false,
    nickname: "",
  },
  {
    id: 2,
    name: "Alex",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    school: "延世大学",
    tags: ["学习搭子", "图书馆"],
    matchReason: "都是研究生 · 都在找学习伙伴",
    status: "期末复习中",
    online: true,
    followed: false,
    nickname: "",
  },
  {
    id: 3,
    name: "樱子",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sakura",
    school: "高丽大学",
    tags: ["逛街", "弘大"],
    matchReason: "都喜欢弘大 · 周末都有空",
    status: "想去弘大逛逛",
    online: false,
    followed: true,
    nickname: "樱花妹",
  },
]

const hotActivities = [
  {
    id: 1,
    title: "周末火锅局",
    cover: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop",
    location: "新村站",
    participants: 6,
    maxParticipants: 8,
    tag: "美食",
    time: "本周六 18:00",
  },
  {
    id: 2,
    title: "汉江野餐会",
    cover: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop",
    location: "汝矣岛",
    participants: 12,
    maxParticipants: 20,
    tag: "户外",
    time: "本周日 14:00",
  },
]

const trendingCircles = [
  { id: 1, name: "首尔大学", members: 2340, icon: "🎓", hot: true },
  { id: 2, name: "美食探店", members: 1892, icon: "🍜", hot: true },
  { id: 3, name: "新生报到", members: 856, icon: "👋", hot: false },
  { id: 4, name: "打工交流", members: 1245, icon: "💼", hot: false },
]

const guides = [
  { id: 1, title: "韩国租房避坑指南", views: "3.2k", tag: "租房" },
  { id: 2, title: "留学生打工必看政策", views: "2.8k", tag: "打工" },
  { id: 3, title: "首尔地铁完全攻略", views: "4.1k", tag: "交通" },
]

type SubPage = "meal" | "roommate" | "parttime" | "guide" | "secondhand" | "warning" | "activity" | "user" | null

interface GuideItem {
  id: number
  title: string
  views: string
  tag: string
}

interface GuideDetail {
  id: number
  title: string
  category: string
  content: string
  updatedAt: string
  sourceName: string
  sourceUrl: string | null
}

interface ActivityDetail {
  id: number
  title: string
  cover: string
  location: string
  participants: number
  maxParticipants: number
  tag: string
  time: string
}

interface HomePageProps {
  onOpenMessages?: (userId?: number) => void
  onOpenCircle?: (circleId: number) => void
  onDetailModeChange?: (isDetailMode: boolean) => void
}

export function HomePage({ onOpenMessages, onOpenCircle, onDetailModeChange }: HomePageProps) {
  const { t } = useLanguage()
  const [currentStatus, setCurrentStatus] = useState("chat")
  const [activeSubPage, setActiveSubPage] = useState<SubPage>(null)
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetail | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [selectedGuide, setSelectedGuide] = useState<GuideDetail | null>(null)
  const [users, setUsers] = useState<UserDetail[]>(initialRecommendedUsers)
  const [guideItems, setGuideItems] = useState<GuideItem[]>(guides)
  const [themePosts, setThemePosts] = useState<Record<"parttime" | "secondhand" | "warning", PostSummaryDto[]>>({
    parttime: [],
    secondhand: [],
    warning: [],
  })
  const [themeLoading, setThemeLoading] = useState(false)
  const [selectedThemePost, setSelectedThemePost] = useState<PostDetailDto | null>(null)
  const [homeError, setHomeError] = useState<string | null>(null)
  const [profileInfo, setProfileInfo] = useState({
    nickname: "留学生朋友",
    status: "未设置",
  })

  const statusOptions = [
    { id: "chat", label: t.home.statusChat, icon: "💬" },
    { id: "meal", label: t.home.statusMeal, icon: "🍜" },
    { id: "study", label: t.home.statusStudy, icon: "📚" },
    { id: "explore", label: t.home.statusExplore, icon: "🛍️" },
  ]

  const quickActions = [
    { id: "meal", label: t.home.mealBuddy, icon: Utensils, color: "bg-orange-100 text-orange-600" },
    { id: "roommate", label: t.home.roommate, icon: HomeIcon, color: "bg-blue-100 text-blue-600" },
    { id: "parttime", label: t.home.parttime, icon: Briefcase, color: "bg-emerald-100 text-emerald-600" },
    { id: "guide", label: t.home.guide, icon: BookOpen, color: "bg-purple-100 text-purple-600" },
    { id: "secondhand", label: t.home.secondhand, icon: ShoppingBag, color: "bg-pink-100 text-pink-600" },
    { id: "warning", label: t.home.warning, icon: AlertTriangle, color: "bg-red-100 text-red-600" },
  ]
  
  // Posts state
  const [mealPosts, setMealPosts] = useState<PostItem[]>(initialMealBuddyPosts)
  const [roommatePosts, setRoommatePosts] = useState<PostItem[]>(initialRoommatePosts)
  
  // Comment state
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null)
  const [currentPostType, setCurrentPostType] = useState<"meal" | "roommate">("meal")
  
  // Nickname editing
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState("")

  useEffect(() => {
    onDetailModeChange?.(selectedThemePost !== null || selectedPost !== null)
    return () => onDetailModeChange?.(false)
  }, [onDetailModeChange, selectedThemePost, selectedPost])

  useEffect(() => {
    let cancelled = false

    const loadHomeData = async () => {
      try {
        const [recommendations, articles, profile] = await Promise.all([
          backendRequest<MatchRecommendationDto[]>("/matches/recommendations"),
          backendRequest<ArticleSummaryDto[]>("/articles"),
          backendRequest<UserProfileDto>("/users/profile"),
        ])

        if (cancelled) {
          return
        }

        setUsers(
          recommendations.map((item) => ({
            id: item.userId,
            name: item.nickname,
            avatar: buildAvatarUrl(item.nickname),
            school: item.school,
            tags: item.tags.length > 0 ? item.tags : [item.major],
            matchReason: item.matchReason,
            status: item.languages.length > 0 ? `常用语言：${item.languages.join(" / ")}` : item.major,
            online: false,
            followed: false,
            nickname: "",
          }))
        )

        setGuideItems(
          articles.map((article) => ({
            id: article.id,
            title: article.title,
            views: article.sourceName,
            tag: article.category,
          }))
        )
        setProfileInfo({
          nickname: profile.nickname,
          status: profile.status || "未设置",
        })

        setHomeError(null)
      } catch (error) {
        if (!cancelled) {
          setHomeError(error instanceof Error ? error.message : "首页数据加载失败")
        }
      }
    }

    void loadHomeData()

    return () => {
      cancelled = true
    }
  }, [])

  const openSubPage = (page: SubPage) => {
    setActiveSubPage(page)
    if (page === "parttime" || page === "secondhand" || page === "warning") {
      void loadThemePosts(page)
    }
  }

  const closeSubPage = () => {
    setActiveSubPage(null)
    setSelectedActivity(null)
    setSelectedUser(null)
    setSelectedGuide(null)
    setSelectedThemePost(null)
    setSelectedPost(null)
    setEditingNickname(false)
    setNicknameInput("")
  }

  const openActivityDetail = (activity: ActivityDetail) => {
    setSelectedActivity(activity)
    setActiveSubPage("activity")
  }

  const openUserProfile = (user: UserDetail) => {
    setSelectedUser(user)
    setActiveSubPage("user")
  }

  const openGuideDetail = async (guideId: number) => {
    try {
      const detail = await backendRequest<ArticleDetailDto>(`/articles/${guideId}`)
      setSelectedGuide({
        id: detail.id,
        title: detail.title,
        category: detail.category,
        content: detail.content,
        updatedAt: detail.updatedAt,
        sourceName: detail.sourceName,
        sourceUrl: detail.sourceUrl,
      })
      setActiveSubPage("guide")
    } catch (error) {
      setHomeError(error instanceof Error ? error.message : "攻略详情加载失败")
    }
  }

  const toggleFollow = () => {
    if (!selectedUser) return
    const newFollowed = !selectedUser.followed
    setSelectedUser({ ...selectedUser, followed: newFollowed })
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, followed: newFollowed } : u))
  }

  const saveNickname = () => {
    if (!selectedUser) return
    setSelectedUser({ ...selectedUser, nickname: nicknameInput })
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, nickname: nicknameInput } : u))
    setEditingNickname(false)
  }

  const togglePostLike = (postId: number, type: "meal" | "roommate") => {
    const setPosts = type === "meal" ? setMealPosts : setRoommatePosts
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ))
  }

  const openPostComments = (post: PostItem, type: "meal" | "roommate") => {
    setSelectedPost(post)
    setCurrentPostType(type)
  }

  const loadThemePosts = async (theme: "parttime" | "secondhand" | "warning") => {
    try {
      setThemeLoading(true)
      const posts = await backendRequest<PostSummaryDto[]>(`/posts/discover/${theme}`)
      setThemePosts((prev) => ({ ...prev, [theme]: posts }))
      setHomeError(null)
    } catch (error) {
      setHomeError(error instanceof Error ? error.message : "主题帖子加载失败")
    } finally {
      setThemeLoading(false)
    }
  }

  const openThemePostDetail = async (postId: number) => {
    try {
      const detail = await backendRequest<PostDetailDto>(`/posts/${postId}`)
      setSelectedThemePost(detail)
    } catch (error) {
      setHomeError(error instanceof Error ? error.message : "帖子详情加载失败")
    }
  }

  // Post Comments View
  if (selectedPost && activeSubPage) {
    return (
      <PostDetailView
        post={{
          id: selectedPost.id,
          authorName: selectedPost.author.name,
          boardName: currentPostType === "meal" ? t.home.mealBuddy : t.home.roommate,
          title: selectedPost.content.slice(0, 20) || "帖子详情",
          content: selectedPost.content,
          imageUrls: [],
          anonymous: false,
          likeCount: selectedPost.likes,
          commentCount: selectedPost.comments.length,
          favoriteCount: selectedPost.liked ? 1 : 0,
          createdAt: selectedPost.time,
          comments: selectedPost.comments.map((comment) => ({
            id: comment.id,
            authorName: comment.author.name,
            content: comment.content,
            createdAt: comment.time,
          })),
        }}
        onBack={() => setSelectedPost(null)}
        onUpdated={(updated) => {
          const mappedComments = updated.comments.map((comment) => ({
            id: comment.id,
            author: {
              name: comment.authorName,
              avatar: buildAvatarUrl(comment.authorName),
            },
            content: comment.content,
            time: comment.createdAt,
            likes: 0,
            liked: false,
          }))
          setSelectedPost((prev) => prev ? {
            ...prev,
            content: updated.content,
            likes: updated.likeCount,
            commentCount: updated.commentCount,
            liked: getPostInteraction(updated.id).liked,
            comments: mappedComments,
          } : prev)
          const setPosts = currentPostType === "meal" ? setMealPosts : setRoommatePosts
          setPosts((prev) => prev.map((post) =>
            post.id === updated.id
              ? {
                  ...post,
                  content: updated.content,
                  likes: updated.likeCount,
                  comments: mappedComments,
                }
              : post
          ))
        }}
      />
    )
  }

  // Activity Detail View
  if (activeSubPage === "activity" && selectedActivity) {
    return (
      <div className="bg-transparent min-h-screen">
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" className="size-9" onClick={closeSubPage}>
              <ArrowLeft className="size-5" />
            </Button>
            <span className="font-medium">活动详情</span>
          </div>
        </div>
        <div className="relative h-48">
          <img src={selectedActivity.cover} alt={selectedActivity.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">{selectedActivity.tag}</Badge>
        </div>
        <div className="px-4 -mt-6 relative z-10">
          <Card className="p-4 bg-card/90 backdrop-blur-sm">
            <h1 className="text-xl font-bold mb-2">{selectedActivity.title}</h1>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Calendar className="size-4" /><span>{selectedActivity.time}</span></div>
              <div className="flex items-center gap-2"><MapPin className="size-4" /><span>{selectedActivity.location}</span></div>
              <div className="flex items-center gap-2"><Users className="size-4" /><span>{selectedActivity.participants}/{selectedActivity.maxParticipants} 人已报名</span></div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="w-full bg-secondary rounded-full h-2 mb-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(selectedActivity.participants / selectedActivity.maxParticipants) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">还剩 {selectedActivity.maxParticipants - selectedActivity.participants} 个名额</p>
            </div>
          </Card>
          <Button className="w-full mt-4 h-12 bg-accent text-accent-foreground hover:bg-accent/90 text-base font-medium">立即报名</Button>
        </div>
      </div>
    )
  }

  if (selectedThemePost && activeSubPage) {
    return (
      <PostDetailView
        post={selectedThemePost}
        onBack={() => setSelectedThemePost(null)}
        onUpdated={(updated) => {
          setSelectedThemePost(updated)
          if (activeSubPage === "parttime" || activeSubPage === "secondhand" || activeSubPage === "warning") {
            setThemePosts((prev) => ({
              ...prev,
              [activeSubPage]: prev[activeSubPage].map((post) =>
                post.id === updated.id
                  ? {
                      ...post,
                      likeCount: updated.likeCount,
                      commentCount: updated.commentCount,
                      favoriteCount: updated.favoriteCount,
                    }
                  : post
              ),
            }))
          }
        }}
      />
    )
  }

  if (activeSubPage === "guide" && selectedGuide) {
    return (
      <div className="bg-transparent min-h-screen">
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" className="size-9" onClick={() => setSelectedGuide(null)}>
              <ArrowLeft className="size-5" />
            </Button>
            <span className="font-medium">攻略详情</span>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Card className="p-4 bg-card/85 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">{selectedGuide.category}</Badge>
              <span className="text-xs text-muted-foreground">{selectedGuide.sourceName}</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-3">{selectedGuide.title}</h1>
            <p className="text-xs text-muted-foreground mb-4">更新时间：{selectedGuide.updatedAt}</p>
            <div className="text-sm leading-7 text-foreground whitespace-pre-wrap">{selectedGuide.content}</div>
            {selectedGuide.sourceUrl && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <a href={selectedGuide.sourceUrl} target="_blank" rel="noreferrer" className="text-sm text-primary">
                  查看原始来源
                </a>
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  // User Profile View
  if (activeSubPage === "user" && selectedUser) {
    return (
      <div className="bg-transparent min-h-screen">
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" className="size-9" onClick={closeSubPage}>
              <ArrowLeft className="size-5" />
            </Button>
            <span className="font-medium">用户资料</span>
          </div>
        </div>
        <div className="relative h-32 bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/30 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-primary/20 rounded-full blur-xl" />
        </div>
        <div className="px-4 -mt-12">
          <div className="flex items-end gap-4 mb-4">
            <Avatar className="size-20 ring-4 ring-card">
              <AvatarImage src={selectedUser.avatar} />
              <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{selectedUser.name}</h1>
                {selectedUser.online && <span className="text-xs text-green-500">在线</span>}
              </div>
              <p className="text-sm text-muted-foreground">{selectedUser.school}</p>
            </div>
          </div>
          
          {/* Nickname Setting */}
          <Card className="p-3 mb-3 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">备注</span>
              </div>
              {editingNickname ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder="设置备注..."
                    className="h-7 px-2 bg-secondary rounded text-sm w-24 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="size-7" onClick={saveNickname}>
                    <Check className="size-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditingNickname(false)}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <button 
                  onClick={() => { setEditingNickname(true); setNicknameInput(selectedUser.nickname); }}
                  className="text-sm text-primary"
                >
                  {selectedUser.nickname || "点击设置"}
                </button>
              )}
            </div>
          </Card>
          
          <Card className="p-3 mb-4 bg-card/80 backdrop-blur-sm">
            <p className="text-sm text-primary mb-2">{selectedUser.matchReason}</p>
            <p className="text-sm text-muted-foreground">{selectedUser.status}</p>
            <div className="flex gap-1.5 mt-2">
              {selectedUser.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          </Card>
          <div className="flex gap-3">
            <Button
              className="flex-1 h-11 bg-primary text-primary-foreground"
              onClick={() => {
                closeSubPage()
                onOpenMessages?.(selectedUser.id)
              }}
            >
              <MessageCircle className="size-4 mr-2" />
              去私聊
            </Button>
            <Button 
              variant={selectedUser.followed ? "secondary" : "outline"} 
              className="flex-1 h-11"
              onClick={toggleFollow}
            >
              {selectedUser.followed ? (
                <>
                  <Check className="size-4 mr-2" />
                  已关注
                </>
              ) : (
                <>
                  <UserPlus className="size-4 mr-2" />
                  关注
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Sub Page Views
  if (activeSubPage) {
    const getSubPageTitle = () => {
      switch (activeSubPage) {
        case "meal": return t.home.mealBuddy
        case "roommate": return t.home.roommate
        case "parttime": return t.home.parttime
        case "guide": return t.home.guide
        case "secondhand": return t.home.secondhand
        case "warning": return t.home.warning
        default: return ""
      }
    }

    const renderPostCard = (post: PostItem, type: "meal" | "roommate") => (
      <Card key={post.id} className="p-3 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="size-8">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{post.author.name}</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{post.time}</span>
        </div>
        <p className="text-sm mb-2">{post.content}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            <span>{post.location}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button 
              onClick={() => togglePostLike(post.id, type)}
              className={cn("flex items-center gap-1", post.liked ? "text-red-500" : "hover:text-red-500")}
            >
              <Heart className={cn("size-3", post.liked && "fill-current")} />
              <span>{post.likes}</span>
            </button>
            <button 
              onClick={() => openPostComments(post, type)}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <MessageCircle className="size-3" />
              <span>{post.comments.length}</span>
            </button>
          </div>
        </div>
      </Card>
    )

    return (
      <div className="bg-transparent min-h-screen">
        <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
          <div className="relative flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" className="size-9" onClick={closeSubPage}>
              <ArrowLeft className="size-5" />
            </Button>
            <span className="font-medium">{getSubPageTitle()}</span>
          </div>
        </div>

        {activeSubPage === "meal" && (
          <div className="p-4 space-y-3">
            {mealPosts.map(post => renderPostCard(post, "meal"))}
            <Button className="w-full bg-accent text-accent-foreground">{t.home.publishMealBuddy}</Button>
          </div>
        )}

        {activeSubPage === "roommate" && (
          <div className="p-4 space-y-3">
            {roommatePosts.map(post => renderPostCard(post, "roommate"))}
            <Button className="w-full bg-accent text-accent-foreground">{t.home.publishRoommate}</Button>
          </div>
        )}

        {(activeSubPage === "parttime" || activeSubPage === "secondhand" || activeSubPage === "warning") && (
          <div className="p-4 space-y-3">
            {themeLoading && (
              <Card className="p-4 bg-card/80 backdrop-blur-sm border-dashed border-border/70">
                <p className="text-sm text-muted-foreground">正在加载内容...</p>
              </Card>
            )}

            {!themeLoading && themePosts[activeSubPage].length === 0 && (
              <Card className="p-4 bg-card/80 backdrop-blur-sm border-dashed border-border/70">
                <p className="text-sm text-muted-foreground">暂时还没有内容，稍后再来看看。</p>
              </Card>
            )}

            {!themeLoading && themePosts[activeSubPage].map((post) => (
              <Card
                key={post.id}
                className="p-4 bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer"
                onClick={() => openThemePostDetail(post.id)}
              >
                {post.imageUrls.length > 0 && (
                  <div className="mb-3 overflow-hidden rounded-xl bg-secondary">
                    <img src={post.imageUrls[0]} alt="" className="h-36 w-full object-cover" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px]">{post.boardName}</Badge>
                      <span className="text-xs text-muted-foreground">{post.authorName}</span>
                    </div>
                    <h3 className="font-medium text-foreground line-clamp-2">{post.title}</h3>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{post.summary}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(post.createdAt).toLocaleDateString("zh-CN")}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="size-3" />
                      {post.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="size-3" />
                      {post.commentCount}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeSubPage === "guide" && (
          <div className="p-4 space-y-3">
            {guideItems.map((guide) => (
              <Card
                key={guide.id}
                className="p-4 bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer"
                onClick={() => openGuideDetail(guide.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px]">{guide.tag}</Badge>
                      <span className="text-xs text-muted-foreground">{guide.views}</span>
                    </div>
                    <h3 className="font-medium text-foreground">{guide.title}</h3>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    )
  }

  return (
    <div className="bg-transparent">
      {/* Header */}
      <div className="relative overflow-hidden px-4 pt-3 pb-4">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center shadow-sm">
                <span className="text-lg font-bold text-primary">留</span>
              </div>
              <div>
                <div className="text-sm font-semibold">{profileInfo.nickname}</div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground bg-card/60 backdrop-blur px-2.5 py-1 rounded-full">
                  <MapPin className="size-3.5" />
                  <span>{t.home.citySeoul}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="size-9 rounded-full bg-card/60 backdrop-blur">
                <Search className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-9 rounded-full bg-card/60 backdrop-blur relative">
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />
              </Button>
            </div>
          </div>

          {/* Status Selector */}
          <Card className="p-3 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-medium">{t.home.myStatus}</span>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">{t.home.currentProfileStatus}{profileInfo.status}</p>
            <div className="flex gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.id}
                  onClick={() => setCurrentStatus(status.id)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-medium transition-all",
                    currentStatus === status.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  <span className="mr-1">{status.icon}</span>
                  {status.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative px-4 py-4">
        <div className="relative grid grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => openSubPage(action.id as SubPage)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className={cn(
                  "size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm",
                  action.color
                )}>
                  <Icon className="size-5" />
                </div>
                <span className="text-[10px] font-medium text-foreground">{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recommended Users */}
      <div className="px-4 py-3">
        {homeError && (
          <Card className="mb-3 p-3 border-amber-200 bg-amber-50/80 text-amber-700">
            <p className="text-xs">{homeError}，{t.home.demoFallback}</p>
          </Card>
        )}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <span className="text-sm font-medium">{t.home.recommendPeople}</span>
          </div>
          <button className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{t.home.refresh}</span>
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {users.map((user) => (
            <Card
              key={user.id}
              onClick={() => openUserProfile(user)}
              className="flex-shrink-0 w-36 p-3 bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="relative">
                  <Avatar className="size-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  {user.online && (
                    <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-2 ring-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.nickname || user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.school}</p>
                </div>
              </div>
              <p className="text-[10px] text-primary mb-1.5 line-clamp-1">{user.matchReason}</p>
              <div className="flex gap-1">
                {user.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Hot Activities */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            <span className="text-sm font-medium">{t.home.hotActivities}</span>
          </div>
          <button className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{t.home.more}</span>
            <ChevronRight className="size-3" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {hotActivities.map((activity) => (
            <Card
              key={activity.id}
              onClick={() => openActivityDetail(activity)}
              className="flex-shrink-0 w-52 overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="relative h-24">
                <img src={activity.cover} alt={activity.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
                <Badge className="absolute top-2 left-2 bg-accent/90 text-accent-foreground text-[10px]">
                  {activity.tag}
                </Badge>
              </div>
              <div className="p-2.5">
                <h3 className="text-sm font-medium mb-1 truncate">{activity.title}</h3>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {activity.location}
                  </span>
                  <span>{activity.participants}/{activity.maxParticipants}人</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Trending Circles */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <span className="text-sm font-medium">{t.home.hotCircles}</span>
          </div>
          <button className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{t.home.all}</span>
            <ChevronRight className="size-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {trendingCircles.map((circle) => (
            <Card
              key={circle.id}
              className="p-3 bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onOpenCircle?.(circle.id)}
            >
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-secondary flex items-center justify-center text-lg">
                  {circle.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{circle.name}</span>
                    {circle.hot && (
                      <Badge className="bg-red-500/10 text-red-500 text-[9px] px-1 py-0 h-4">HOT</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{circle.members.toLocaleString()} {t.home.members}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Guides */}
      <div className="px-4 py-3 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            <span className="text-sm font-medium">{t.home.usefulGuides}</span>
          </div>
        </div>
        <div className="space-y-2">
          {guideItems.map((guide) => (
            <Card
              key={guide.id}
              className="p-3 bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer"
              onClick={() => openGuideDetail(guide.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="text-[10px]">{guide.tag}</Badge>
                  <span className="text-sm">{guide.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{guide.views}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
