"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings,
  Bell,
  Shield,
  Globe,
  Palette,
  Database,
  Mail,
  Smartphone,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Key,
  Users,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

const settingsSections = [
  { id: "general", label: "基本设置", icon: Settings },
  { id: "notification", label: "通知设置", icon: Bell },
  { id: "security", label: "安全设置", icon: Shield },
  { id: "content", label: "内容规则", icon: FileText },
  { id: "admin", label: "管理员", icon: Users },
]

export function AdminSettings() {
  const [activeSection, setActiveSection] = useState("general")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">系统设置</h1>
          <p className="text-muted-foreground mt-1">管理平台的全局配置和规则</p>
        </div>
        <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90" disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="size-4" />
              保存设置
            </>
          )}
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <Card className="w-64 p-3 bg-card/80 backdrop-blur-sm border-border/50 h-fit">
          <nav className="space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {section.label}
                </button>
              )
            })}
          </nav>
        </Card>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeSection === "general" && (
            <>
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Globe className="size-5" />
                  平台信息
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">平台名称</label>
                    <Input defaultValue="留圈 UniLink" className="bg-secondary/50 border-border/50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">平台描述</label>
                    <Textarea
                      defaultValue="为在韩留学生打造的轻社交 + 圈子社区 + 实用信息平台"
                      className="bg-secondary/50 border-border/50"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">联系邮箱</label>
                    <Input defaultValue="support@unilink.com" className="bg-secondary/50 border-border/50" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Palette className="size-5" />
                  外观设置
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">主题色</label>
                    <div className="flex gap-3">
                      {["#8fd3c7", "#86c8f0", "#f0a6c2", "#ffd93d", "#a388f0"].map((color) => (
                        <button
                          key={color}
                          className={cn(
                            "size-10 rounded-xl border-2 transition-all",
                            color === "#8fd3c7" ? "border-primary scale-110 shadow-lg" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">深色模式</p>
                      <p className="text-xs text-muted-foreground">启用深色主题</p>
                    </div>
                    <div className="w-12 h-6 bg-secondary rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeSection === "notification" && (
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="size-5" />
                通知设置
              </h3>
              <div className="space-y-4">
                {[
                  { title: "新用户注册通知", desc: "有新用户注册时通知管理员", enabled: true },
                  { title: "举报通知", desc: "收到新举报时立即通知", enabled: true },
                  { title: "内容待审核通知", desc: "有新内容需要审核时通知", enabled: false },
                  { title: "系统异常通知", desc: "系统出现异常时通知", enabled: true },
                  { title: "每日报告", desc: "每天发送平台数据报告", enabled: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <div className={cn(
                      "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                      item.enabled ? "bg-primary" : "bg-secondary"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all",
                        item.enabled ? "right-1" : "left-1"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === "security" && (
            <>
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="size-5" />
                  安全策略
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">强制双因素认证</p>
                      <p className="text-xs text-muted-foreground">管理员登录需要双因素认证</p>
                    </div>
                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">登录IP限制</p>
                      <p className="text-xs text-muted-foreground">限制管理员只能从指定IP登录</p>
                    </div>
                    <div className="w-12 h-6 bg-secondary rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">会话超时时间（分钟）</label>
                    <Input type="number" defaultValue="30" className="bg-secondary/50 border-border/50 w-32" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Key className="size-5" />
                  API密钥管理
                </h3>
                <div className="space-y-3">
                  {[
                    { name: "主API密钥", status: "active", created: "2024-01-01" },
                    { name: "备用API密钥", status: "inactive", created: "2024-02-15" },
                  ].map((key, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Key className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{key.name}</p>
                          <p className="text-xs text-muted-foreground">创建于 {key.created}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={key.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                          {key.status === "active" ? "活跃" : "未激活"}
                        </Badge>
                        <Button variant="outline" size="sm">重新生成</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {activeSection === "content" && (
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="size-5" />
                内容审核规则
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">新帖子自动审核</p>
                    <p className="text-xs text-muted-foreground">新发布的帖子需要人工审核</p>
                  </div>
                  <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">敏感词过滤</p>
                    <p className="text-xs text-muted-foreground">自动过滤包含敏感词的内容</p>
                  </div>
                  <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">敏感词列表</label>
                  <Textarea
                    placeholder="每行一个敏感词..."
                    className="bg-secondary/50 border-border/50"
                    rows={5}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">举报阈值（自动隐藏）</label>
                  <Input type="number" defaultValue="5" className="bg-secondary/50 border-border/50 w-32" />
                  <p className="text-xs text-muted-foreground mt-1">内容被举报次数达到此值时自动隐藏</p>
                </div>
              </div>
            </Card>
          )}

          {activeSection === "admin" && (
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="size-5" />
                  管理员列表
                </h3>
                <Button size="sm" className="gap-2">
                  <Users className="size-4" />
                  添加管理员
                </Button>
              </div>
              <div className="space-y-3">
                {[
                  { name: "超级管理员", email: "admin@unilink.com", role: "超级管理员", status: "在线" },
                  { name: "内容审核员", email: "content@unilink.com", role: "内容管理", status: "离线" },
                  { name: "用户管理员", email: "user@unilink.com", role: "用户管理", status: "在线" },
                ].map((admin, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-medium">
                        {admin.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{admin.name}</p>
                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{admin.role}</Badge>
                      <Badge className={admin.status === "在线" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {admin.status}
                      </Badge>
                      <Button variant="ghost" size="sm" disabled={i === 0}>编辑</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
