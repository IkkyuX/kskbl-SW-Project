"use client"

import { Home, Users, MessageCircle, User, Compass } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  className?: string
}

export function MobileNav({ activeTab, onTabChange, className }: MobileNavProps) {
  const { t } = useLanguage()
  const navItems = [
    { id: "home", icon: Home, label: t.nav.home },
    { id: "community", icon: Compass, label: t.nav.community },
    { id: "circle", icon: Users, label: t.nav.circle },
    { id: "message", icon: MessageCircle, label: t.nav.message },
    { id: "profile", icon: User, label: t.nav.profile },
  ]

  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pointer-events-none", className)}>
      <nav className="pointer-events-auto w-full max-w-md rounded-[1.5rem] border border-border/60 bg-card/92 px-2 py-2 shadow-xl shadow-primary/10 backdrop-blur-xl">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 transition-all duration-200",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("size-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
