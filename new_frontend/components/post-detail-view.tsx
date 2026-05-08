"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Bookmark, Heart, Loader2, MessageCircle, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { backendRequest, buildAvatarUrl, getPostInteraction, PostCommentDto, PostDetailDto, PostReactionDto, setPostInteraction } from "@/lib/backend"
import { cn } from "@/lib/utils"

interface PostDetailViewProps {
  post: PostDetailDto
  onBack: () => void
  onUpdated?: (post: PostDetailDto) => void
}

function mapComment(comment: PostCommentDto) {
  return {
    id: comment.id,
    authorName: comment.authorName,
    avatar: buildAvatarUrl(comment.authorName),
    content: comment.content,
    createdAt: comment.createdAt,
  }
}

export function PostDetailView({ post, onBack, onUpdated }: PostDetailViewProps) {
  const [detail, setDetail] = useState(post)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDetail(post)
    const interaction = getPostInteraction(post.id)
    setLiked(interaction.liked)
    setFavorited(interaction.favorited)
    setDetailError(null)
  }, [post])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [detail.comments.length])

  const commentCountLabel = useMemo(() => detail.comments.length || detail.commentCount, [detail.comments.length, detail.commentCount])

  const syncDetail = (next: PostDetailDto) => {
    setDetail(next)
    onUpdated?.(next)
  }

  const updateReaction = async (type: "like" | "favorite", nextState: boolean) => {
    if (type === "favorite") {
      const nextDetail = {
        ...detail,
        favoriteCount: nextState ? detail.favoriteCount + 1 : Math.max(0, detail.favoriteCount - 1),
      }
      setFavorited(nextState)
      setPostInteraction(detail.id, { favorited: nextState })
      syncDetail(nextDetail)
      setDetailError(null)
      return
    }

    const setLoading = type === "like" ? setLikeLoading : setFavoriteLoading
    const body = { liked: nextState }
    setLoading(true)
    try {
      const reaction = await backendRequest<PostReactionDto>(`/posts/${detail.id}/${type}`, {
        method: "POST",
        body: JSON.stringify(body),
      })
      const nextDetail = {
        ...detail,
        likeCount: reaction.likeCount,
        commentCount: reaction.commentCount,
        favoriteCount: reaction.favoriteCount,
      }
      if (type === "like") {
        setLiked(nextState)
        setPostInteraction(detail.id, { liked: nextState })
      } else {
        setFavorited(nextState)
        setPostInteraction(detail.id, { favorited: nextState })
      }
      syncDetail(nextDetail)
      setDetailError(null)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "操作失败")
    } finally {
      setLoading(false)
    }
  }

  const submitComment = async () => {
    if (!commentText.trim()) {
      return
    }
    setSubmittingComment(true)
    try {
      const created = await backendRequest<PostCommentDto>(`/posts/${detail.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: commentText.trim() }),
      })
      const nextDetail = {
        ...detail,
        commentCount: detail.commentCount + 1,
        comments: [...detail.comments, created],
      }
      syncDetail(nextDetail)
      setCommentText("")
      setDetailError(null)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "评论发送失败")
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border/50 bg-card/95 px-4 py-3 backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="size-9" onClick={onBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0">
          <p className="text-sm font-medium">帖子详情</p>
          <p className="text-[11px] text-muted-foreground">{detail.boardName} · {detail.authorName}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-36">
        {detailError && (
          <Card className="mb-3 border-amber-200 bg-amber-50/80 p-3 text-amber-700">
            <p className="text-xs">{detailError}</p>
          </Card>
        )}

        <Card className="mb-4 border-border/50 bg-card/90 p-4">
          <div className="mb-3 flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={buildAvatarUrl(detail.authorName)} alt={detail.authorName} />
              <AvatarFallback>{detail.authorName[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{detail.authorName}</span>
                {detail.anonymous && <Badge variant="secondary" className="text-[10px]">匿名</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground">{detail.createdAt}</p>
            </div>
          </div>
          <h2 className="mb-3 text-lg font-semibold">{detail.title}</h2>
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{detail.content}</p>
          {detail.imageUrls.length > 0 && (
            <div className={cn("mt-3 grid gap-2", detail.imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
              {detail.imageUrls.map((imageUrl, index) => (
                <button
                  key={`${detail.id}-${index}`}
                  type="button"
                  className="overflow-hidden rounded-xl bg-secondary"
                  onClick={() => setPreviewImage(imageUrl)}
                >
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span>赞 {detail.likeCount}</span>
            <span>评 {commentCountLabel}</span>
            <span>藏 {detail.favoriteCount}</span>
          </div>
        </Card>

        <Card className="border-border/50 bg-card/90 p-4">
          <h3 className="mb-3 text-sm font-semibold">评论</h3>
          <div className="space-y-3">
            {detail.comments.length === 0 && (
              <p className="text-sm text-muted-foreground">这条帖子暂时还没有评论。</p>
            )}
            {detail.comments.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-border/40 bg-background/60 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarImage src={buildAvatarUrl(comment.authorName)} alt={comment.authorName} />
                    <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{comment.authorName}</p>
                    <p className="text-[11px] text-muted-foreground">{comment.createdAt}</p>
                  </div>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{comment.content}</p>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t border-border/50 bg-card/96 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className={cn("h-10 rounded-full px-3", liked && "border-red-200 text-red-500")}
            onClick={() => void updateReaction("like", !liked)}
            disabled={likeLoading}
          >
            {likeLoading ? <Loader2 className="size-4 animate-spin" /> : <Heart className={cn("size-4", liked && "fill-current")} />}
            <span className="ml-1 text-xs">{detail.likeCount}</span>
          </Button>
          <Button type="button" variant="outline" className="h-10 rounded-full px-3">
            <MessageCircle className="size-4" />
            <span className="ml-1 text-xs">{commentCountLabel}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn("h-10 rounded-full px-3", favorited && "border-primary/30 text-primary")}
            onClick={() => void updateReaction("favorite", !favorited)}
            disabled={favoriteLoading}
          >
            {favoriteLoading ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className={cn("size-4", favorited && "fill-current")} />}
            <span className="ml-1 text-xs">{detail.favoriteCount}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="写评论..."
            className="h-11 flex-1 rounded-full bg-secondary px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={(event) => event.key === "Enter" && void submitComment()}
          />
          <Button
            type="button"
            size="icon"
            className="size-11 rounded-full bg-primary text-primary-foreground"
            onClick={() => void submitComment()}
            disabled={!commentText.trim() || submittingComment}
          >
            {submittingComment ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>

      {previewImage && (
        <button
          type="button"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
        </button>
      )}
    </div>
  )
}
