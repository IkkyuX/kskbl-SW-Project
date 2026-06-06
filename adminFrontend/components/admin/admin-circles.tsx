"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Users, MessageSquare, TrendingUp, Settings, Shield, Crown, Calendar, Activity } from "lucide-react"
import { getAdminCircles, type AdminCircleItem } from "@/lib/admin-api"

export function AdminCircles() {
  const [circles, setCircles] = useState<AdminCircleItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCircle, setSelectedCircle] = useState<AdminCircleItem | null>(null)

  useEffect(() => {
    void getAdminCircles().then(setCircles)
  }, [])

  const filteredCircles = circles.filter((circle) =>
    circle.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (selectedCircle) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedCircle(null)} className="gap-2">
          <ArrowLeft className="size-4" />
          返回圈子列表
        </Button>
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-start gap-6">
            <div className="size-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl">
              {selectedCircle.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{selectedCircle.name}</h2>
              <p className="text-muted-foreground mt-2">{selectedCircle.description}</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">圈子管理</h1>
          <p className="text-muted-foreground mt-1">来自真实圈子接口</p>
        </div>
      </div>

      <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索圈子名称..." />

      <div className="grid gap-4 md:grid-cols-2">
        {filteredCircles.map((circle) => (
          <Card key={circle.id} className="p-5 bg-card/80 backdrop-blur-sm border-border/50">
            <button onClick={() => setSelectedCircle(circle)} className="w-full text-left">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl">{circle.icon}</div>
                  <div>
                    <p className="font-semibold text-foreground">{circle.name}</p>
                    <p className="text-xs text-muted-foreground">{circle.description}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700">{circle.joined ? "已加入" : "公开"}</Badge>
              </div>
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}
