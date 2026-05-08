"use client"

import { useState, useRef, useEffect, type ChangeEvent } from "react"
import { Search, MessageCircle, Heart, Bookmark, MoreHorizontal, TrendingUp, ArrowLeft, Send, X, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { backendRequest, buildAvatarUrl, CircleSummaryDto, getPostInteraction, PostCommentDto, PostDetailDto, PostReactionDto, PostSummaryDto, setPostInteraction } from "@/lib/backend"
import { cn } from "@/lib/utils"
import { PostDetailView } from "@/components/post-detail-view"

const categories = [
  { id: "all", label: "全部" },
  { id: "campus", label: "校园" },
  { id: "rent", label: "租房" },
  { id: "food", label: "美食" },
  { id: "job", label: "打工" },
  { id: "secondhand", label: "二手" },
  { id: "warning", label: "避雷" },
]

const hotTopics = [
  { id: 1, title: "首尔租房攻略", count: "2.3k讨论" },
  { id: 2, title: "韩国打工时薪", count: "1.8k讨论" },
  { id: 3, title: "新生报到指南", count: "956讨论" },
]

const categoryThemeMap: Partial<Record<string, string>> = {
  job: "parttime",
  secondhand: "secondhand",
  warning: "warning",
}

const boardOptions = [
  { id: 1, label: "新生报到" },
  { id: 2, label: "学习选课" },
  { id: 3, label: "交友活动" },
]

interface Comment {
  id: number
  author: {
    name: string
    avatar: string
  }
  content: string
  time: string
  likes: number
  liked: boolean
}

interface Post {
  id: number
  author: {
    name: string
    avatar: string
    school: string
    verified: boolean
  }
  content: string
  images: string[]
  category: string
  likes: number
  commentCount: number
  comments: Comment[]
  time: string
  liked: boolean
  saved: boolean
}

const initialPosts: Post[] = [
  {
    id: 1,
    author: {
      name: "饭团小姐",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=fante",
      school: "首尔大学",
      verified: true,
    },
    content: "分享一家超棒的中餐馆！位置在新村站3号出口，老板是东北人，地道的东北菜，价格也很实惠～强烈推荐他家的锅包肉和酸菜炖粉条！",
    images: [
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&h=200&fit=crop",
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=300&h=200&fit=crop",
    ],
    category: "美食",
    likes: 234,
    commentCount: 3,
    comments: [
      { id: 1, author: { name: "吃货小王", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=wang" }, content: "这家我也去过！锅包肉真的绝了", time: "1小时前", likes: 12, liked: false },
      { id: 2, author: { name: "美食探店", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=meishi" }, content: "求地址！想去试试", time: "2小时前", likes: 5, liked: false },
      { id: 3, author: { name: "新生小明", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ming" }, content: "人均大概多少呀？", time: "2小时前", likes: 3, liked: false },
    ],
    time: "2小时前",
    liked: false,
    saved: false,
  },
  {
    id: 2,
    author: {
      name: "租房小能手",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rent",
      school: "延世大学",
      verified: true,
    },
    content: "弘大附近XX不动产，态度超差而且乱收中介费，大家小心避坑！租房一定要签合同前仔细看清楚所有条款。",
    images: [],
    category: "避雷",
    likes: 567,
    commentCount: 2,
    comments: [
      { id: 1, author: { name: "被坑过", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=keng" }, content: "我也被坑过！大家千万别去", time: "30分钟前", likes: 45, liked: true },
      { id: 2, author: { name: "新租客", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=xinzu" }, content: "谢谢提醒！差点就去了", time: "1小时前", likes: 8, liked: false },
    ],
    time: "4小时前",
    liked: true,
    saved: true,
  },
  {
    id: 3,
    author: {
      name: "学长来了",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=senior",
      school: "高丽大学",
      verified: false,
    },
    content: "新生们！分享一下我当年的选课经验：通识课建议选XXX教授的，给分很好而且讲得有趣。专业课的话建议避开周一早八，除非你真的能起得来",
    images: [
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&h=200&fit=crop",
    ],
    category: "校园",
    likes: 189,
    commentCount: 1,
    comments: [
      { id: 1, author: { name: "大一新生", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=fresh" }, content: "太有用了！收藏！", time: "3小时前", likes: 20, liked: false },
    ],
    time: "6小时前",
    liked: false,
    saved: false,
  },
  {
    id: 4,
    author: {
      name: "打工达人",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=worker",
      school: "成均馆大学",
      verified: true,
    },
    content: "江南区有家咖啡店招中文店员，时薪12000韩元，工作时间灵活可以配合课表。老板人很好，有兴趣的可以私信我要联系方式~",
    images: [],
    category: "打工",
    likes: 423,
    commentCount: 3,
    comments: [
      { id: 1, author: { name: "找工作", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=job" }, content: "已私信！", time: "1小时前", likes: 2, liked: false },
      { id: 2, author: { name: "咖啡爱好者", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=coffee" }, content: "请问需要韩语几级呀", time: "2小时前", likes: 5, liked: false },
      { id: 3, author: { name: "学生党", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=student" }, content: "周末可以工作吗", time: "3小时前", likes: 3, liked: false },
    ],
    time: "8小时前",
    liked: false,
    saved: true,
  },
]

function mapComment(comment: PostCommentDto): Comment {
  return {
    id: comment.id,
    author: {
      name: comment.authorName,
      avatar: buildAvatarUrl(comment.authorName),
    },
    content: comment.content,
    time: comment.createdAt,
    likes: 0,
    liked: false,
  }
}

function mapPostSummary(post: PostSummaryDto): Post {
  const interaction = getPostInteraction(post.id)
  return {
    id: post.id,
    author: {
      name: post.authorName,
      avatar: buildAvatarUrl(post.authorName),
      school: post.boardName,
      verified: false,
    },
    content: post.summary,
    images: post.imageUrls,
    category: post.boardName,
    likes: post.likeCount,
    commentCount: post.commentCount,
    comments: [],
    time: post.createdAt,
    liked: interaction.liked,
    saved: interaction.favorited,
  }
}

function mapPostDetail(detail: PostDetailDto, base?: Post): Post {
  const interaction = getPostInteraction(detail.id)
  return {
    id: detail.id,
    author: {
      name: detail.authorName,
      avatar: buildAvatarUrl(detail.authorName),
      school: detail.boardName,
      verified: false,
    },
    content: detail.content,
    images: detail.imageUrls.length > 0 ? detail.imageUrls : (base?.images ?? []),
    category: detail.boardName,
    likes: detail.likeCount,
    commentCount: detail.commentCount,
    comments: detail.comments.map(mapComment),
    time: detail.createdAt,
    liked: interaction.liked ?? base?.liked ?? false,
    saved: interaction.favorited ?? base?.saved ?? false,
  }
}

interface CommunityPageProps {
  onDetailModeChange?: (isDetailMode: boolean) => void
}

export function CommunityPage({ onDetailModeChange }: CommunityPageProps) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [circleFilters, setCircleFilters] = useState<CircleSummaryDto[]>([])
  const [activeCircleId, setActiveCircleId] = useState<number | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [commentText, setCommentText] = useState("")
  const [quickCommentPostId, setQuickCommentPostId] = useState<number | null>(null)
  const [quickCommentText, setQuickCommentText] = useState("")
  const [communityError, setCommunityError] = useState<string | null>(null)
  const [postLoading, setPostLoading] = useState(false)
  const [likeLoadingIds, setLikeLoadingIds] = useState<number[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState("")
  const [createContent, setCreateContent] = useState("")
  const [createImages, setCreateImages] = useState<string[]>([])
  const [createBoardId, setCreateBoardId] = useState(1)
  const [createAnonymous, setCreateAnonymous] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const quickCommentInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (quickCommentPostId !== null && quickCommentInputRef.current) {
      quickCommentInputRef.current.focus()
    }
  }, [quickCommentPostId])

  useEffect(() => {
    onDetailModeChange?.(selectedPost !== null)
    return () => onDetailModeChange?.(false)
  }, [onDetailModeChange, selectedPost])

  const matchesCategory = (post: Post, category: string) => {
    if (category === "all") {
      return true
    }
    const searchable = `${post.author.school} ${post.category} ${post.content}`.toLowerCase()
    const keywords: Record<string, string[]> = {
      campus: ["新生", "学校", "校园", "选课", "课程", "留学生"],
      rent: ["租房", "中介", "入住", "合同", "房", "不动产"],
      food: ["美食", "吃", "餐", "烤肉", "火锅", "咖啡", "探店"],
    }
    return (keywords[category] ?? []).some((keyword) => searchable.includes(keyword))
  }

  const loadPosts = async (category: string, circleId: number | null) => {
    setPostLoading(true)
    try {
      let summaries: PostSummaryDto[]
      if (circleId) {
        summaries = await backendRequest<PostSummaryDto[]>(`/circles/${circleId}/posts`)
      } else if (categoryThemeMap[category]) {
        summaries = await backendRequest<PostSummaryDto[]>(`/posts/discover/${categoryThemeMap[category]}`)
      } else {
        summaries = await backendRequest<PostSummaryDto[]>("/posts")
      }

      let mapped = summaries.map(mapPostSummary)
      if (!circleId && !categoryThemeMap[category] && category !== "all") {
        mapped = mapped.filter((post) => matchesCategory(post, category))
      }
      if (circleId && category !== "all") {
        mapped = mapped.filter((post) => matchesCategory(post, category))
      }

      setPosts(mapped)
      setCommunityError(null)
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "社区数据加载失败")
    } finally {
      setPostLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        const circles = await backendRequest<CircleSummaryDto[]>("/circles")
        if (!cancelled) {
          setCircleFilters(circles)
        }
      } catch {
        if (!cancelled) {
          setCircleFilters([])
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void loadPosts(activeCategory, activeCircleId)
  }, [activeCategory, activeCircleId])

  const toggleLike = async (postId: number) => {
    const target = posts.find((post) => post.id === postId)
    if (!target) {
      return
    }
    const nextLiked = !target.liked
    setLikeLoadingIds((prev) => [...prev, postId])
    try {
      const reaction = await backendRequest<PostReactionDto>(`/posts/${postId}/like`, {
        method: "POST",
        body: JSON.stringify({ liked: nextLiked }),
      })
      setPostInteraction(postId, { liked: reaction.liked })
      setPosts((prev) => prev.map((post) =>
        post.id === postId
          ? { ...post, liked: reaction.liked, likes: reaction.likeCount, commentCount: reaction.commentCount }
          : post
      ))
      setSelectedPost((prev) =>
        prev && prev.id === postId
          ? { ...prev, liked: reaction.liked, likes: reaction.likeCount, commentCount: reaction.commentCount }
          : prev
      )
      setCommunityError(null)
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "点赞操作失败")
    } finally {
      setLikeLoadingIds((prev) => prev.filter((id) => id !== postId))
    }
  }

  const toggleSave = (postId: number) => {
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) {
        return post
      }
      const nextSaved = !post.saved
      setPostInteraction(postId, { favorited: nextSaved })
      return { ...post, saved: nextSaved }
    }))
  }

  const toggleCommentLike = (postId: number, commentId: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? {
            ...post,
            comments: post.comments.map(c => 
              c.id === commentId 
                ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
                : c
            )
          }
        : post
    ))
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? {
        ...prev,
        comments: prev.comments.map(c => 
          c.id === commentId 
            ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
            : c
        )
      } : null)
    }
  }

  const openComments = async (post: Post) => {
    try {
      const detail = await backendRequest<PostDetailDto>(`/posts/${post.id}`)
      const mapped = mapPostDetail(detail, post)
      setPosts(prev => prev.map(item => item.id === post.id ? mapped : item))
      setSelectedPost(mapped)
      setCommunityError(null)
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "帖子详情加载失败")
    }
  }

  const closeComments = () => {
    setSelectedPost(null)
    setCommentText("")
  }

  const addComment = async () => {
    if (!commentText.trim() || !selectedPost) return

    try {
      const created = await backendRequest<PostCommentDto>(`/posts/${selectedPost.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: commentText }),
      })
      const newComment = mapComment(created)
      setPosts(prev => prev.map(post =>
        post.id === selectedPost.id
          ? { ...post, comments: [...post.comments, newComment], commentCount: post.commentCount + 1 }
          : post
      ))
      setSelectedPost(prev => prev ? {
        ...prev,
        comments: [...prev.comments, newComment],
        commentCount: prev.commentCount + 1,
      } : null)
      setCommentText("")
      setCommunityError(null)
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "评论发送失败")
    }
  }

  const addQuickComment = async (postId: number) => {
    if (!quickCommentText.trim()) return

    try {
      const created = await backendRequest<PostCommentDto>(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: quickCommentText }),
      })
      const newComment = mapComment(created)
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment], commentCount: post.commentCount + 1 }
          : post
      ))
      setQuickCommentText("")
      setQuickCommentPostId(null)
      setCommunityError(null)
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "快捷评论失败")
    }
  }

  const createPost = async () => {
    if (!createContent.trim() && createImages.length === 0) {
      setCommunityError("发帖内容不能为空")
      return
    }
    try {
      const created = await backendRequest<PostSummaryDto>("/posts", {
        method: "POST",
        body: JSON.stringify({
          boardId: createBoardId,
          title: createTitle.trim() || null,
          content: createContent.trim(),
          imageUrls: createImages,
          anonymous: createAnonymous,
        }),
      })
      setActiveCircleId(null)
      setActiveCategory("all")
      const createdDetail = await backendRequest<PostDetailDto>(`/posts/${created.id}`)
      const createdPost = mapPostDetail(createdDetail, mapPostSummary(created))
      setPosts(prev => [createdPost, ...prev])
      setSelectedPost(createdPost)
      setCreateOpen(false)
      setCreateTitle("")
      setCreateContent("")
      setCreateImages([])
      setCreateBoardId(1)
      setCreateAnonymous(false)
      setCommunityError(null)
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "发帖失败")
    }
  }

  const handleCreateImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 4)
    if (files.length === 0) {
      return
    }
    const dataUrls = await Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(file)
          })
      )
    )
    setCreateImages((prev) => [...prev, ...dataUrls].slice(0, 4))
    event.target.value = ""
  }

  if (selectedPost) {
    return (
      <PostDetailView
        post={{
          id: selectedPost.id,
          authorName: selectedPost.author.name,
          boardName: selectedPost.category,
          title: selectedPost.content.slice(0, 20) || "帖子详情",
          content: selectedPost.content,
          imageUrls: selectedPost.images,
          anonymous: false,
          likeCount: selectedPost.likes,
          commentCount: selectedPost.commentCount,
          favoriteCount: selectedPost.saved ? 1 : 0,
          createdAt: selectedPost.time,
          comments: selectedPost.comments.map((comment) => ({
            id: comment.id,
            authorName: comment.author.name,
            content: comment.content,
            createdAt: comment.time,
          })),
        }}
        onBack={closeComments}
        onUpdated={(updated) => {
          setSelectedPost((prev) => prev ? {
            ...prev,
            content: updated.content,
            likes: updated.likeCount,
            commentCount: updated.commentCount,
            saved: getPostInteraction(updated.id).favorited,
            comments: updated.comments.map((comment) => ({
              id: comment.id,
              author: {
                name: comment.authorName,
                avatar: buildAvatarUrl(comment.authorName),
              },
              content: comment.content,
              time: comment.createdAt,
              likes: 0,
              liked: false,
            })),
          } : prev)
          setPosts((prev) => prev.map((post) =>
            post.id === updated.id
              ? {
                  ...post,
                  content: updated.content,
                  likes: updated.likeCount,
                  commentCount: updated.commentCount,
                  saved: getPostInteraction(updated.id).favorited,
                  comments: updated.comments.map((comment) => ({
                    id: comment.id,
                    author: {
                      name: comment.authorName,
                      avatar: buildAvatarUrl(comment.authorName),
                    },
                    content: comment.content,
                    time: comment.createdAt,
                    likes: 0,
                    liked: false,
                  })),
                }
              : post
          ))
        }}
      />
    )
  }

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-card/80 backdrop-blur-sm z-40 border-b border-border/50">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索帖子、话题..."
                className="w-full h-9 pl-9 pr-4 bg-secondary rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCircleId(null)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
              activeCircleId === null
                ? "bg-accent text-accent-foreground"
                : "bg-card text-muted-foreground hover:bg-card/80"
            )}
          >
            全部圈子
          </button>
          {circleFilters.map((circle) => (
            <button
              key={circle.id}
              onClick={() => setActiveCircleId(circle.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
                activeCircleId === circle.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-muted-foreground hover:bg-card/80"
              )}
            >
              {circle.icon} {circle.name}
            </button>
          ))}
        </div>
      </div>

      {/* Hot Topics */}
      <div className="px-4 py-3 bg-accent/10">
        {communityError && (
          <Card className="mb-3 p-3 border-amber-200 bg-amber-50/80 text-amber-700">
            <p className="text-xs">{communityError}，当前部分内容可能仍在使用演示数据。</p>
          </Card>
        )}
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="size-4 text-accent" />
          <span className="text-xs font-medium text-accent-foreground">热门话题</span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {hotTopics.map((topic) => (
            <Badge
              key={topic.id}
              variant="secondary"
              className="flex-shrink-0 px-2.5 py-1 text-xs bg-card hover:bg-card/80 cursor-pointer"
            >
              #{topic.title}
              <span className="ml-1.5 text-muted-foreground">{topic.count}</span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="px-4 py-3 space-y-3">
        {postLoading && (
          <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              正在加载帖子...
            </div>
          </Card>
        )}
        {!postLoading && posts.length === 0 && (
          <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">这个筛选条件下暂时还没有帖子。</p>
          </Card>
        )}
        {!postLoading && posts.map((post) => (
          <Card key={post.id} className="p-3 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer" onClick={() => openComments(post)}>
            {/* Author */}
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="size-9">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">{post.author.name}</span>
                  {post.author.verified && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-primary/10 text-primary">
                      已认证
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span>{post.author.school}</span>
                  <span>·</span>
                  <span>{post.time}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={(event) => event.stopPropagation()}>
                <MoreHorizontal className="size-4" />
              </Button>
            </div>

            {/* Content */}
            <p className="text-sm text-foreground leading-relaxed mb-2">{post.content}</p>

            {/* Images */}
            {post.images.length > 0 && (
              <div className={cn(
                "grid gap-1.5 mb-2",
                post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
              )}>
                {post.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-secondary">
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Category & Actions */}
            <div className="flex items-center justify-between pt-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {post.category}
              </Badge>
              <div className="flex items-center gap-4">
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    void toggleLike(post.id)
                  }}
                  disabled={likeLoadingIds.includes(post.id)}
                  className={cn(
                    "flex items-center gap-1 text-xs transition-colors disabled:opacity-60",
                    post.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                  )}
                >
                  {likeLoadingIds.includes(post.id) ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Heart className={cn("size-4", post.liked && "fill-current")} />
                  )}
                  <span>{post.likes}</span>
                </button>
                <button 
                  onClick={(event) => {
                    event.stopPropagation()
                    void openComments(post)
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="size-4" />
                  <span>{post.commentCount}</span>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleSave(post.id)
                  }}
                  className={cn(
                    "text-muted-foreground hover:text-primary transition-colors",
                    post.saved && "text-primary"
                  )}
                >
                  <Bookmark className={cn("size-4", post.saved && "fill-current")} />
                </button>
              </div>
            </div>

            {/* Quick Comment Section */}
            {quickCommentPostId === post.id ? (
              <div className="mt-3 pt-3 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <input
                    ref={quickCommentInputRef}
                    type="text"
                    value={quickCommentText}
                    onChange={(e) => setQuickCommentText(e.target.value)}
                    placeholder="写评论..."
                    className="flex-1 h-8 px-3 bg-secondary rounded-full text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onKeyDown={(e) => e.key === 'Enter' && addQuickComment(post.id)}
                  />
                  <Button 
                    size="icon" 
                    className="size-8 rounded-full bg-primary text-primary-foreground"
                    onClick={(event) => {
                      event.stopPropagation()
                      void addQuickComment(post.id)
                    }}
                    disabled={!quickCommentText.trim()}
                  >
                    <Send className="size-3" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    className="size-8 rounded-full"
                    onClick={(event) => {
                      event.stopPropagation()
                      setQuickCommentPostId(null)
                      setQuickCommentText("")
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <button 
                onClick={(event) => {
                  event.stopPropagation()
                  setQuickCommentPostId(post.id)
                }}
                className="mt-3 pt-3 border-t border-border/30 w-full text-left"
              >
                <p className="text-xs text-muted-foreground">写评论...</p>
              </button>
            )}
          </Card>
        ))}
      </div>

      {/* Floating Action Button */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-24 right-4 size-12 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90 z-30"
          >
            <span className="text-xl">+</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>发布帖子</DialogTitle>
            <DialogDescription>先接入最小可用发帖流程，直接提交到现有后端。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">板块</label>
              <select
                value={createBoardId}
                onChange={(event) => setCreateBoardId(Number(event.target.value))}
                className="border-input bg-transparent h-9 w-full rounded-md border px-3 text-sm"
              >
                {boardOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">标题</label>
              <Input value={createTitle} onChange={(event) => setCreateTitle(event.target.value)} placeholder="可选，建议一句话概括" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">内容</label>
              <Textarea value={createContent} onChange={(event) => setCreateContent(event.target.value)} placeholder="写下你想分享或求助的内容" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">图片</label>
              <input type="file" accept="image/*" multiple onChange={handleCreateImages} className="block w-full text-sm" />
              {createImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {createImages.map((imageUrl, index) => (
                    <div key={`preview-${index}`} className="relative overflow-hidden rounded-xl border border-border/50">
                      <img src={imageUrl} alt="" className="h-28 w-full object-cover" />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute right-2 top-2 size-7 rounded-full"
                        onClick={() => setCreateImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {activeCircleId && (
              <Card className="p-3 bg-accent/10 border-accent/20">
                <p className="text-xs text-accent-foreground">
                  当前你正在浏览圈子筛选内容。帖子会先发布到社区总版块里，圈子相关筛选会根据帖子内容自动归类展示。
                </p>
              </Card>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createAnonymous}
                onChange={(event) => setCreateAnonymous(event.target.checked)}
              />
              匿名发布
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={createPost}>发布</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
