"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, MessageSquare, Heart, Image as ImageIcon, Trash2 } from "lucide-react"
import { getAdminArticles, type AdminArticleItem } from "@/lib/admin-api"

export function AdminContent() {
  const [articles, setArticles] = useState<AdminArticleItem[]>([])
  const [selectedPost, setSelectedPost] = useState<AdminArticleItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    void getAdminArticles().then(setArticles)
  }, [])

  const filteredPosts = articles.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.summary.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (selectedPost) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedPost(null)} className="gap-2">
          <ArrowLeft className="size-4" />
          返回内容列表
        </Button>
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
          <h2 className="text-xl font-bold text-foreground mb-4">{selectedPost.title}</h2>
          <p className="text-muted-foreground">{selectedPost.summary}</p>
          <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{selectedPost.category}</span>
            <span>{selectedPost.sourceName}</span>
            <span>{selectedPost.updatedAt.slice(0, 10)}</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">内容管理</h1>
          <p className="text-muted-foreground mt-1">来自真实文章接口</p>
        </div>
      </div>
      <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索帖子标题或内容..." />
      <Card className="p-5 bg-card/80 backdrop-blur-sm border-border/50">
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <button key={post.id} onClick={() => setSelectedPost(post)} className="w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{post.summary}</p>
                </div>
                <Badge className="bg-green-100 text-green-700">已发布</Badge>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
