"use client"

import { useState } from "react"
import { MobileNav } from "@/components/mobile-nav"
import { HomePage } from "@/components/home-page"
import { CommunityPage } from "@/components/community-page"
import { CirclePage } from "@/components/circle-page"
import { MessagePage } from "@/components/message-page"
import { ProfilePage } from "@/components/profile-page"

export default function App() {
  const [activeTab, setActiveTab] = useState("home")
  const [messageChatMode, setMessageChatMode] = useState(false)
  const [postDetailMode, setPostDetailMode] = useState(false)
  const [pendingMessageUserId, setPendingMessageUserId] = useState<number | null>(null)
  const [pendingCircleId, setPendingCircleId] = useState<number | null>(null)

  return (
    <div className="min-h-dvh bg-background relative">
      {/* Fixed Full-Screen Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl -translate-x-1/3" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-2xl translate-y-1/3" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-accent/15 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-28">
          {activeTab === "home" && (
            <HomePage
              onDetailModeChange={setPostDetailMode}
              onOpenMessages={(userId) => {
                setPendingMessageUserId(userId ?? null)
                setActiveTab("message")
              }}
              onOpenCircle={(circleId) => {
                setPendingCircleId(circleId)
                setActiveTab("circle")
              }}
            />
          )}
          {activeTab === "community" && <CommunityPage onDetailModeChange={setPostDetailMode} />}
          {activeTab === "circle" && (
            <CirclePage
              onDetailModeChange={setPostDetailMode}
              autoOpenCircleId={pendingCircleId}
              onAutoOpenHandled={() => setPendingCircleId(null)}
            />
          )}
          {activeTab === "message" && (
            <MessagePage
              onChatModeChange={setMessageChatMode}
              autoOpenUserId={pendingMessageUserId}
              onAutoOpenHandled={() => setPendingMessageUserId(null)}
            />
          )}
          {activeTab === "profile" && <ProfilePage />}
        </main>
      </div>

      {!messageChatMode && !postDetailMode && <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  )
}
