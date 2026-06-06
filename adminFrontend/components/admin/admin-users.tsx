"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, ArrowLeft, Mail, Calendar, MapPin, GraduationCap, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAdminUsers, type AdminUserItem } from "@/lib/admin-api"

const filters = ["全部", "已认证"]

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("全部")
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)

  useEffect(() => {
    void getAdminUsers().then(setUsers)
  }, [])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    return activeFilter === "全部" || matchesSearch
  })

  if (selectedUser) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedUser(null)} className="gap-2">
          <ArrowLeft className="size-4" />
          返回用户列表
        </Button>
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-start gap-6">
            <Avatar className="size-24 border-4 border-primary/20">
              <AvatarImage src={selectedUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.nickname}`} />
              <AvatarFallback className="text-2xl">{selectedUser.nickname[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">{selectedUser.nickname}</h2>
                <Badge className="bg-primary/10 text-primary">已认证</Badge>
              </div>
              <p className="text-muted-foreground mt-1">{selectedUser.email}</p>
              <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><GraduationCap className="size-4" />{selectedUser.school} · {selectedUser.major}</span>
                <span className="flex items-center gap-1.5"><MapPin className="size-4" />留学生</span>
                <span className="flex items-center gap-1.5"><Calendar className="size-4" />uNumber {selectedUser.uNumber}</span>
              </div>
            </div>
            <Button variant="outline" className="gap-2"><Mail className="size-4" />发送消息</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">用户管理</h1>
          <p className="text-muted-foreground mt-1">来自真实用户资料接口</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索用户名或邮箱..." className="pl-10" />
        </div>
        {filters.map((filter) => (
          <Button key={filter} variant={activeFilter === filter ? "default" : "outline"} onClick={() => setActiveFilter(filter)}>
            {filter}
          </Button>
        ))}
      </div>

      <Card className="p-5 bg-card/80 backdrop-blur-sm border-border/50">
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <button key={user.userId} onClick={() => setSelectedUser(user)} className="flex w-full items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
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
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
