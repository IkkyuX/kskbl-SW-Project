"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  AlertTriangle,
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  User,
  FileText,
  ArrowLeft,
  Ban,
  Clock,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

const reports = [
  {
    id: 1,
    type: "post",
    reason: "虚假信息",
    description: "该帖子发布的租房信息是虚假的，实际地址不存在",
    target: { title: "超低价整租！弘大地铁站旁单间", type: "帖子" },
    reporter: { name: "小明", avatar: "xiaoming" },
    reported: { name: "黑心房东", avatar: "landlord" },
    status: "pending",
    priority: "high",
    createdAt: "2024-03-15 14:30",
  },
  {
    id: 2,
    type: "user",
    reason: "骚扰行为",
    description: "该用户多次发送骚扰私信，态度恶劣",
    target: { title: "用户: 陌生人A", type: "用户" },
    reporter: { name: "受害者小红", avatar: "xiaohong" },
    reported: { name: "陌生人A", avatar: "stranger" },
    status: "pending",
    priority: "high",
    createdAt: "2024-03-15 12:00",
  },
  {
    id: 3,
    type: "comment",
    reason: "恶意攻击",
    description: "评论中包含人身攻击和侮辱性言论",
    target: { title: "评论: 你这个...", type: "评论" },
    reporter: { name: "路人甲", avatar: "passerby" },
    reported: { name: "键盘侠", avatar: "keyboard" },
    status: "resolved",
    priority: "medium",
    createdAt: "2024-03-14 18:45",
    resolution: "已删除评论并警告用户",
  },
  {
    id: 4,
    type: "post",
    reason: "广告内容",
    description: "纯广告贴，没有任何实际内容",
    target: { title: "最新代购渠道，超低价！", type: "帖子" },
    reporter: { name: "正义使者", avatar: "justice" },
    reported: { name: "代购小王", avatar: "daigou" },
    status: "dismissed",
    priority: "low",
    createdAt: "2024-03-13 09:20",
    resolution: "内容符合规定，举报不成立",
  },
  {
    id: 5,
    type: "circle",
    reason: "违规内容",
    description: "圈子内存在大量违规内容，疑似传销",
    target: { title: "圈子: 财富自由俱乐部", type: "圈子" },
    reporter: { name: "警惕网友", avatar: "alert" },
    reported: { name: "财富导师", avatar: "wealth" },
    status: "pending",
    priority: "critical",
    createdAt: "2024-03-15 16:00",
  },
]

const filters = ["全部", "待处理", "已处理", "已驳回"]
const priorities = ["全部优先级", "紧急", "高", "中", "低"]

export function AdminReports() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("全部")
  const [selectedReport, setSelectedReport] = useState<typeof reports[0] | null>(null)
  const [resolution, setResolution] = useState("")

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      activeFilter === "全部" ||
      (activeFilter === "待处理" && report.status === "pending") ||
      (activeFilter === "已处理" && report.status === "resolved") ||
      (activeFilter === "已驳回" && report.status === "dismissed")
    return matchesSearch && matchesFilter
  })

  const handleResolve = () => {
    console.log("Resolved:", selectedReport?.id, resolution)
    setResolution("")
    setSelectedReport(null)
  }

  const handleDismiss = () => {
    console.log("Dismissed:", selectedReport?.id)
    setSelectedReport(null)
  }

  // Report Detail View
  if (selectedReport) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedReport(null)} className="gap-2">
          <ArrowLeft className="size-4" />
          返回举报列表
        </Button>

        <div className="grid grid-cols-3 gap-6">
          {/* Report Details */}
          <Card className="col-span-2 p-6 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Badge
                  className={cn(
                    selectedReport.priority === "critical" ? "bg-red-500 text-white" :
                    selectedReport.priority === "high" ? "bg-orange-100 text-orange-700" :
                    selectedReport.priority === "medium" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-700"
                  )}
                >
                  {selectedReport.priority === "critical" ? "紧急" :
                   selectedReport.priority === "high" ? "高优先级" :
                   selectedReport.priority === "medium" ? "中优先级" : "低优先级"}
                </Badge>
                <Badge
                  className={cn(
                    selectedReport.status === "pending" ? "bg-amber-100 text-amber-700" :
                    selectedReport.status === "resolved" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-700"
                  )}
                >
                  {selectedReport.status === "pending" ? "待处理" :
                   selectedReport.status === "resolved" ? "已处理" : "已驳回"}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="size-4" />
                {selectedReport.createdAt}
              </span>
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">举报原因: {selectedReport.reason}</h2>
            <p className="text-muted-foreground mb-6">{selectedReport.description}</p>

            {/* Target */}
            <div className="p-4 rounded-xl bg-secondary/30 mb-6">
              <p className="text-sm text-muted-foreground mb-2">被举报内容</p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {selectedReport.type === "post" ? <FileText className="size-5 text-primary" /> :
                   selectedReport.type === "user" ? <User className="size-5 text-primary" /> :
                   selectedReport.type === "comment" ? <MessageSquare className="size-5 text-primary" /> :
                   <Flag className="size-5 text-primary" />}
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedReport.target.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.target.type}</p>
                </div>
              </div>
            </div>

            {/* People Involved */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-muted-foreground mb-3">举报人</p>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedReport.reporter.avatar}`} />
                    <AvatarFallback>{selectedReport.reporter.name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-foreground">{selectedReport.reporter.name}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="text-sm text-muted-foreground mb-3">被举报人</p>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedReport.reported.avatar}`} />
                    <AvatarFallback>{selectedReport.reported.name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-foreground">{selectedReport.reported.name}</p>
                </div>
              </div>
            </div>

            {selectedReport.resolution && (
              <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-1">处理结果</p>
                <p className="text-green-600">{selectedReport.resolution}</p>
              </div>
            )}
          </Card>

          {/* Actions Panel */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 h-fit space-y-6">
            {selectedReport.status === "pending" ? (
              <>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">处理举报</h3>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="处理说明..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="bg-secondary/50 border-border/50"
                      rows={3}
                    />
                    <Button
                      onClick={handleResolve}
                      className="w-full gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="size-4" />
                      确认处理
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDismiss}
                      className="w-full gap-2"
                    >
                      <XCircle className="size-4" />
                      驳回举报
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-6">
                  <h3 className="font-semibold text-foreground mb-3">快速操作</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full gap-2">
                      <Eye className="size-4" />
                      查看原内容
                    </Button>
                    <Button variant="outline" className="w-full gap-2 text-amber-600 hover:text-amber-700">
                      <AlertTriangle className="size-4" />
                      警告被举报人
                    </Button>
                    <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive">
                      <Ban className="size-4" />
                      封禁被举报人
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="size-8 text-green-600" />
                </div>
                <p className="font-medium text-foreground">
                  {selectedReport.status === "resolved" ? "已处理" : "已驳回"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  该举报已于 {selectedReport.createdAt} 处理完成
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">举报处理</h1>
          <p className="text-muted-foreground mt-1">处理用户提交的举报和投诉</p>
        </div>
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertTriangle className="size-3 mr-1" />
          待处理: {reports.filter(r => r.status === "pending").length}
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索举报内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50"
            />
          </div>
          <div className="flex items-center gap-2">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={activeFilter === filter ? "bg-primary" : ""}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <Card
            key={report.id}
            className={cn(
              "p-5 bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer",
              report.priority === "critical" && "border-l-4 border-l-red-500",
              report.priority === "high" && "border-l-4 border-l-orange-500"
            )}
            onClick={() => setSelectedReport(report)}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "size-12 rounded-xl flex items-center justify-center",
                report.type === "post" ? "bg-blue-100" :
                report.type === "user" ? "bg-purple-100" :
                report.type === "comment" ? "bg-green-100" : "bg-amber-100"
              )}>
                {report.type === "post" ? <FileText className="size-6 text-blue-600" /> :
                 report.type === "user" ? <User className="size-6 text-purple-600" /> :
                 report.type === "comment" ? <MessageSquare className="size-6 text-green-600" /> :
                 <Flag className="size-6 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{report.reason}</h3>
                  <Badge
                    className={cn(
                      "text-xs",
                      report.status === "pending" ? "bg-amber-100 text-amber-700" :
                      report.status === "resolved" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                    )}
                  >
                    {report.status === "pending" ? "待处理" :
                     report.status === "resolved" ? "已处理" : "已驳回"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      report.priority === "critical" ? "border-red-300 text-red-600" :
                      report.priority === "high" ? "border-orange-300 text-orange-600" :
                      report.priority === "medium" ? "border-amber-300 text-amber-600" :
                      "border-gray-300 text-gray-600"
                    )}
                  >
                    {report.priority === "critical" ? "紧急" :
                     report.priority === "high" ? "高" :
                     report.priority === "medium" ? "中" : "低"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{report.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Flag className="size-3" /> {report.target.type}: {report.target.title.slice(0, 20)}...
                  </span>
                  <span>举报人: {report.reporter.name}</span>
                  <span>{report.createdAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {report.status === "pending" && (
                  <>
                    <Button variant="ghost" size="icon" className="size-9 text-green-600 hover:text-green-700 hover:bg-green-50">
                      <CheckCircle className="size-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-9 text-destructive hover:bg-destructive/10">
                      <XCircle className="size-5" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="size-9">
                  <Eye className="size-5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
