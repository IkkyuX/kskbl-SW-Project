"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  MessageSquare,
  CircleDot,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Clock,
} from "lucide-react"
import { getAdminArticles, getAdminCircles, getAdminUsers, type AdminArticleItem, type AdminCircleItem, type AdminUserItem } from "@/lib/admin-api"

const statsCards = [
  {
    title: "总用户数",
    value: "12,847",
    change: "+12.5%",
    trend: "up",
    icon: Users,
    color: "primary",
  },
  {
    title: "今日发帖",
    value: "1,284",
    change: "+8.2%",
    trend: "up",
    icon: MessageSquare,
    color: "accent",
  },
  {
    title: "活跃圈子",
    value: "156",
    change: "+3.1%",
    trend: "up",
    icon: CircleDot,
    color: "primary",
  },
  {
    title: "待处理举报",
    value: "23",
    change: "-15.4%",
    trend: "down",
    icon: AlertTriangle,
    color: "destructive",
  },
]

const activityData = [
  { hour: "00:00", users: 120 },
  { hour: "04:00", users: 45 },
  { hour: "08:00", users: 380 },
  { hour: "12:00", users: 890 },
  { hour: "16:00", users: 1200 },
  { hour: "20:00", users: 1560 },
  { hour: "24:00", users: 890 },
]

export function AdminDashboard() {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [articles, setArticles] = useState<AdminArticleItem[]>([])
  const [circles, setCircles] = useState<AdminCircleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [nextUsers, nextArticles, nextCircles] = await Promise.all([
          getAdminUsers(),
          getAdminArticles(),
          getAdminCircles(),
        ])
        if (cancelled) return
        setUsers(nextUsers)
        setArticles(nextArticles)
        setCircles(nextCircles)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const maxUsers = Math.max(...activityData.map((d) => d.users))
  const stats = [
    { ...statsCards[0], value: String(users.length || 0) },
    { ...statsCards[1], value: String(articles.length || 0) },
    { ...statsCards[2], value: String(circles.length || 0) },
    { ...statsCards[3], value: "23" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">数据概览</h1>
          <p className="text-muted-foreground mt-1">欢迎回来，这是今日平台运营数据</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="size-4" />
            今日
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <ArrowUpRight className="size-4" />
            导出报告
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className="p-5 bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`size-12 rounded-xl flex items-center justify-center ${
                    stat.color === "primary"
                      ? "bg-primary/10"
                      : stat.color === "accent"
                        ? "bg-accent/10"
                        : "bg-destructive/10"
                  }`}
                >
                  <Icon
                    className={`size-6 ${
                      stat.color === "primary"
                        ? "text-primary"
                        : stat.color === "accent"
                          ? "text-accent-foreground"
                          : "text-destructive"
                    }`}
                  />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {stat.trend === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">{loading ? "..." : stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Activity Chart */}
        <Card className="col-span-2 p-5 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">用户活跃度</h3>
              <p className="text-sm text-muted-foreground">24小时在线用户趋势</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">在线用户</span>
              </div>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {activityData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-lg transition-all hover:from-accent hover:to-accent/50"
                  style={{ height: `${(data.users / maxUsers) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{data.hour}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card className="p-5 bg-card/80 backdrop-blur-sm border-border/50">
          <h3 className="font-semibold text-foreground mb-4">今日数据</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">页面浏览</p>
                  <p className="text-xs text-muted-foreground">总浏览量</p>
                </div>
              </div>
              <p className="text-lg font-bold text-foreground">89.2K</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Heart className="size-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">互动数</p>
                  <p className="text-xs text-muted-foreground">点赞+评论</p>
                </div>
              </div>
              <p className="text-lg font-bold text-foreground">12.8K</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">平均时长</p>
                  <p className="text-xs text-muted-foreground">用户停留</p>
                </div>
              </div>
              <p className="text-lg font-bold text-foreground">8.5分</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Users */}
        <Card className="p-5 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">新注册用户</h3>
            <Button variant="ghost" size="sm" className="text-primary">
              查看全部
            </Button>
          </div>
          <div className="space-y-3">
            {users.slice(0, 5).map((user) => (
              <div key={user.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <Avatar className="size-10">
                  <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`} />
                  <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.nickname}</p>
                  <p className="text-xs text-muted-foreground">{user.school}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-700">已认证</Badge>
                  <p className="text-xs text-muted-foreground mt-1">uNumber {user.uNumber}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Posts */}
        <Card className="p-5 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">最新帖子</h3>
            <Button variant="ghost" size="sm" className="text-primary">
              查看全部
            </Button>
          </div>
          <div className="space-y-3">
            {articles.slice(0, 4).map((post) => (
              <div key={post.id} className="p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">来源: {post.sourceName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">{post.updatedAt.slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
