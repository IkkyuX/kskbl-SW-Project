"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FileText,
  CircleDot,
  AlertTriangle,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const menuItems = [
  { id: "dashboard", label: "数据概览", icon: LayoutDashboard },
  { id: "users", label: "用户管理", icon: Users, badge: 12 },
  { id: "content", label: "内容审核", icon: FileText, badge: 28 },
  { id: "circles", label: "圈子管理", icon: CircleDot },
  { id: "reports", label: "举报处理", icon: AlertTriangle, badge: 5 },
  { id: "settings", label: "系统设置", icon: Settings },
]

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 z-50 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-lg font-bold text-primary-foreground">留</span>
          </div>
          <div>
            <h1 className="font-semibold text-foreground">留圈管理后台</h1>
            <p className="text-xs text-muted-foreground">UniLink Admin</p>
          </div>
        </div>
      </div>

      {/* Admin Profile */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
          <Avatar className="size-10 border-2 border-primary/30">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">管理员</p>
            <p className="text-xs text-muted-foreground">超级管理员</p>
          </div>
          <Button variant="ghost" size="icon" className="size-8 relative">
            <Bell className="size-4" />
            <span className="absolute top-1 right-1 size-2 bg-destructive rounded-full" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge
                  variant={isActive ? "secondary" : "default"}
                  className={cn(
                    "text-xs",
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive/10 text-destructive"
                  )}
                >
                  {item.badge}
                </Badge>
              )}
              {isActive && <ChevronRight className="size-4" />}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border/50">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive">
          <LogOut className="size-5" />
          退出登录
        </Button>
      </div>
    </aside>
  )
}
