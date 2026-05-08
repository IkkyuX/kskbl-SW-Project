"use client"

import { useState, useRef, useEffect } from "react"
import { Search, MoreHorizontal, Bell, Users, Pin, Check, CheckCheck, ArrowLeft, Send, Smile, Edit3, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { backendRequest, buildAvatarUrl, ChatMessageDto, ConversationDetailDto, ConversationSummaryDto, NotificationDto } from "@/lib/backend"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "chat", label: "私聊" },
  { id: "notification", label: "通知" },
]

interface Message {
  id: number
  content: string
  time: string
  isMine: boolean
}

interface Conversation {
  id: number
  participantUserId: number
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  pinned: boolean
  status?: string
  isGroup?: boolean
  icon?: string
  messages: Message[]
  nickname: string
}

const initialConversations: Conversation[] = [
  {
    id: 1,
    participantUserId: 2,
    name: "小雨",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rain",
    lastMessage: "好的呀！那我们约周六下午怎么样？",
    time: "刚刚",
    unread: 2,
    online: true,
    pinned: true,
    status: "sent",
    nickname: "",
    messages: [
      { id: 1, content: "你好！看到你也喜欢吃火锅", time: "昨天 14:30", isMine: true },
      { id: 2, content: "对呀！新村那家超好吃", time: "昨天 14:32", isMine: false },
      { id: 3, content: "有机会一起去吃呀", time: "昨天 14:35", isMine: true },
      { id: 4, content: "好呀好呀！", time: "昨天 14:36", isMine: false },
      { id: 5, content: "这周末有空吗？", time: "10:00", isMine: true },
      { id: 6, content: "好的呀！那我们约周六下午怎么样？", time: "刚刚", isMine: false },
    ],
  },
  {
    id: 2,
    participantUserId: 3,
    name: "Alex",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    lastMessage: "图书馆见！",
    time: "10分钟前",
    unread: 0,
    online: true,
    pinned: false,
    status: "read",
    nickname: "学习搭子",
    messages: [
      { id: 1, content: "明天去图书馆学习吗", time: "昨天 20:00", isMine: true },
      { id: 2, content: "可以呀，几点？", time: "昨天 20:05", isMine: false },
      { id: 3, content: "下午2点？", time: "昨天 20:06", isMine: true },
      { id: 4, content: "图书馆见！", time: "10分钟前", isMine: false },
    ],
  },
  {
    id: 3,
    participantUserId: 4,
    name: "樱子",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sakura",
    lastMessage: "那家店真的超好吃！下次再一起去",
    time: "1小时前",
    unread: 0,
    online: false,
    pinned: false,
    status: "read",
    nickname: "",
    messages: [
      { id: 1, content: "上次你推荐的那家拉面店太棒了", time: "昨天 18:00", isMine: true },
      { id: 2, content: "那家店真的超好吃！下次再一起去", time: "1小时前", isMine: false },
    ],
  },
  {
    id: 4,
    participantUserId: 0,
    name: "打工情报站",
    avatar: "",
    icon: "💼",
    lastMessage: "[系统通知] 有3个新的打工信息",
    time: "2小时前",
    unread: 3,
    online: false,
    pinned: false,
    isGroup: true,
    nickname: "",
    messages: [
      { id: 1, content: "[系统通知] 有3个新的打工信息", time: "2小时前", isMine: false },
    ],
  },
  {
    id: 5,
    participantUserId: 0,
    name: "韩语学习小组",
    avatar: "",
    icon: "📚",
    lastMessage: "明天的学习任务已发布",
    time: "3小时前",
    unread: 0,
    online: false,
    pinned: false,
    isGroup: true,
    nickname: "",
    messages: [
      { id: 1, content: "明天的学习任务已发布", time: "3小时前", isMine: false },
    ],
  },
]

const notifications = [
  {
    id: 1,
    type: "like",
    icon: "❤️",
    title: "获得点赞",
    content: "小明等3人赞了你的帖子",
    time: "5分钟前",
    read: false,
  },
  {
    id: 2,
    type: "comment",
    icon: "💬",
    title: "新评论",
    content: "学长来了 评论了你的帖子：很有用的信息！",
    time: "30分钟前",
    read: false,
  },
  {
    id: 3,
    type: "system",
    icon: "🔔",
    title: "系统通知",
    content: "你的认证申请已通过审核",
    time: "1小时前",
    read: true,
  },
  {
    id: 4,
    type: "circle",
    icon: "👥",
    title: "圈子动态",
    content: "「美食探店小分队」有12条新消息",
    time: "2小时前",
    read: true,
  },
  {
    id: 5,
    type: "follow",
    icon: "➕",
    title: "新关注",
    content: "饭团小姐 关注了你",
    time: "昨天",
    read: true,
  },
]

interface MessagePageContentProps {
  onChatModeChange?: (isChatMode: boolean) => void
  autoOpenUserId?: number | null
  onAutoOpenHandled?: () => void
}

export function MessagePage({ onChatModeChange, autoOpenUserId, onAutoOpenHandled }: MessagePageContentProps) {
  return <MessagePageContent onChatModeChange={onChatModeChange} autoOpenUserId={autoOpenUserId} onAutoOpenHandled={onAutoOpenHandled} />
}

export function MessagePageContent({ onChatModeChange, autoOpenUserId, onAutoOpenHandled }: MessagePageContentProps) {
  const [activeTab, setActiveTab] = useState("chat")
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageText, setMessageText] = useState("")
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState("")
  const [notificationsData, setNotificationsData] = useState(notifications)
  const [messageError, setMessageError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom()
    }
  }, [selectedConversation?.messages.length])

  useEffect(() => {
    onChatModeChange?.(selectedConversation !== null)
    return () => onChatModeChange?.(false)
  }, [onChatModeChange, selectedConversation])

  useEffect(() => {
    let cancelled = false

    const loadMessageData = async () => {
      try {
        const [conversationResponse, notificationResponse] = await Promise.all([
          backendRequest<ConversationSummaryDto[]>("/messages/conversations"),
          backendRequest<NotificationDto[]>("/messages/notifications"),
        ])
        if (cancelled) {
          return
        }
        setConversations(conversationResponse.map(mapConversationSummary))
        setNotificationsData(notificationResponse.map(mapNotification))
        setMessageError(null)
      } catch (error) {
        if (!cancelled) {
          setMessageError(error instanceof Error ? error.message : "消息加载失败")
        }
      }
    }

    void loadMessageData()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!autoOpenUserId) {
      return
    }

    let cancelled = false

    const openDirectConversation = async () => {
      try {
        const detail = await backendRequest<ConversationDetailDto>("/messages/direct", {
          method: "POST",
          body: JSON.stringify({ targetUserId: autoOpenUserId }),
        })
        if (cancelled) {
          return
        }
        const baseConversation: Conversation = {
          id: detail.id,
          participantUserId: detail.participantUserId,
          name: detail.name,
          avatar: buildAvatarUrl(detail.avatarSeed),
          lastMessage: detail.messages.at(-1)?.content ?? "",
          time: detail.messages.at(-1)?.time ?? "刚刚",
          unread: 0,
          online: detail.online,
          pinned: false,
          status: "read",
          nickname: detail.nickname,
          messages: detail.messages.map(mapChatMessage),
        }
        setConversations((prev) => {
          const existing = prev.some((conversation) => conversation.id === detail.id)
          if (existing) {
            return prev.map((conversation) => conversation.id === detail.id ? baseConversation : conversation)
          }
          return [baseConversation, ...prev]
        })
        setSelectedConversation(baseConversation)
        setActiveTab("chat")
        setMessageError(null)
      } catch (error) {
        if (!cancelled) {
          setMessageError(error instanceof Error ? error.message : "打开私聊失败")
        }
      } finally {
        if (!cancelled) {
          onAutoOpenHandled?.()
        }
      }
    }

    void openDirectConversation()

    return () => {
      cancelled = true
    }
  }, [autoOpenUserId, onAutoOpenHandled])

  const openChat = async (conv: Conversation) => {
    try {
      const detail = await backendRequest<ConversationDetailDto>(`/messages/conversations/${conv.id}`)
      const mapped = mapConversationDetail(detail, conv)
      setConversations(prev => prev.map(c =>
        c.id === conv.id ? { ...mapped, lastMessage: c.lastMessage, time: c.time, unread: 0, status: c.status } : c
      ))
      setSelectedConversation({ ...mapped, lastMessage: conv.lastMessage, time: conv.time, unread: 0, status: conv.status })
      setMessageError(null)
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : "会话详情加载失败")
    }
  }

  const closeChat = () => {
    setSelectedConversation(null)
    setMessageText("")
    setEditingNickname(false)
    setNicknameInput("")
  }

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return
    try {
      const created = await backendRequest<ChatMessageDto>(`/messages/conversations/${selectedConversation.id}`, {
        method: "POST",
        body: JSON.stringify({ content: messageText }),
      })
      const newMessage = mapChatMessage(created)
      setConversations(prev => prev.map(c =>
        c.id === selectedConversation.id
          ? { ...c, messages: [...c.messages, newMessage], lastMessage: newMessage.content, time: newMessage.time, status: "sent" }
          : c
      ))
      setSelectedConversation(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null)
      setMessageText("")
      setMessageError(null)
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : "消息发送失败")
    }
  }

  const saveNickname = () => {
    if (!selectedConversation) return
    setConversations(prev => prev.map(c => 
      c.id === selectedConversation.id ? { ...c, nickname: nicknameInput } : c
    ))
    setSelectedConversation(prev => prev ? { ...prev, nickname: nicknameInput } : null)
    setEditingNickname(false)
  }

  const mapChatMessage = (message: ChatMessageDto): Message => ({
    id: message.id,
    content: message.content,
    time: message.time,
    isMine: message.isMine,
  })

  const mapConversationSummary = (conversation: ConversationSummaryDto): Conversation => ({
    id: conversation.id,
    participantUserId: conversation.participantUserId,
    name: conversation.name,
    avatar: buildAvatarUrl(conversation.avatarSeed),
    lastMessage: conversation.lastMessage,
    time: conversation.time,
    unread: conversation.unread,
    online: conversation.online,
    pinned: conversation.pinned,
    status: conversation.status,
    nickname: conversation.nickname,
    messages: [],
  })

  const mapConversationDetail = (detail: ConversationDetailDto, base: Conversation): Conversation => ({
    ...base,
    participantUserId: detail.participantUserId,
    name: detail.name,
    avatar: buildAvatarUrl(detail.avatarSeed),
    online: detail.online,
    nickname: detail.nickname,
    messages: detail.messages.map(mapChatMessage),
  })

  const mapNotification = (notification: NotificationDto) => ({
    id: notification.id,
    type: notification.type,
    icon: notification.icon,
    title: notification.title,
    content: notification.content,
    time: notification.time,
    read: notification.read,
  })

  // Chat Detail View
  if (selectedConversation) {
    const displayName = selectedConversation.nickname || selectedConversation.name

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col max-w-md mx-auto">
        {/* Fixed Chat Header */}
        <div className="flex-shrink-0 border-b border-border/50 bg-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
          <div className="relative flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" className="size-9 flex-shrink-0" onClick={closeChat}>
              <ArrowLeft className="size-5" />
            </Button>
            {selectedConversation.isGroup ? (
              <div className="size-10 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                {selectedConversation.icon}
              </div>
            ) : (
              <div className="relative flex-shrink-0">
                <Avatar className="size-10">
                  <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                  <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
                </Avatar>
                {selectedConversation.online && (
                  <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-2 ring-card" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="font-medium truncate block">{displayName}</span>
              {selectedConversation.online && !selectedConversation.isGroup && (
                <p className="text-[10px] text-green-500">在线</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!selectedConversation.isGroup && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-9 rounded-full"
                  onClick={() => { setEditingNickname(true); setNicknameInput(selectedConversation.nickname); }}
                >
                  <Edit3 className="size-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="size-9 rounded-full">
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          </div>
          
          {/* Nickname Edit Bar */}
          {editingNickname && (
            <div className="px-4 pb-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex-shrink-0">备注:</span>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="设置备注名..."
                className="flex-1 h-8 px-3 bg-secondary rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                autoFocus
              />
              <Button size="sm" className="h-8 px-3" onClick={saveNickname}>
                <Check className="size-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingNickname(false)}>
                <X className="size-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-secondary/30 to-background">
          {selectedConversation.messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex items-end gap-2",
                msg.isMine ? "flex-row-reverse" : "flex-row"
              )}
            >
              {!msg.isMine && (
                selectedConversation.isGroup ? (
                  <div className="size-8 rounded-full bg-secondary flex items-center justify-center text-sm flex-shrink-0">
                    {selectedConversation.icon}
                  </div>
                ) : (
                  <Avatar className="size-8 flex-shrink-0">
                    <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                    <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
                  </Avatar>
                )
              )}
              <div className={cn(
                "max-w-[70%] px-3 py-2 rounded-2xl text-sm",
                msg.isMine 
                  ? "bg-primary text-primary-foreground rounded-br-sm" 
                  : "bg-card border border-border/50 rounded-bl-sm"
              )}>
                <p>{msg.content}</p>
              </div>
              <span className="text-[9px] text-muted-foreground flex-shrink-0">{msg.time}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Message Input */}
        <div className="flex-shrink-0 border-t border-border/50 p-3 bg-card">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-10 rounded-full flex-shrink-0">
              <Smile className="size-5" />
            </Button>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="输入消息..."
              className="flex-1 h-10 px-4 bg-secondary rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button 
              size="icon" 
              className="size-10 rounded-full bg-primary text-primary-foreground flex-shrink-0"
              onClick={sendMessage}
              disabled={!messageText.trim()}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-card/80 backdrop-blur-sm z-40 border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        
        <div className="relative px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-foreground">消息</h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-9 rounded-full">
                <Search className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-9 rounded-full">
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-secondary rounded-full p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-1.5 rounded-full text-sm font-medium transition-all relative",
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {tab.label}
                {tab.id === "notification" && (
                  <span className="absolute top-1 right-4 size-2 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {messageError && (
        <div className="px-4 py-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-700">
            {messageError}，当前部分消息内容可能仍在使用演示数据。
          </div>
        </div>
      )}

      {activeTab === "chat" ? (
        <div className="divide-y divide-border/30">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => openChat(conv)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer",
                conv.pinned && "bg-primary/5"
              )}
            >
              <div className="relative flex-shrink-0">
                {conv.isGroup ? (
                  <div className="size-12 rounded-full bg-secondary flex items-center justify-center text-xl">
                    {conv.icon}
                  </div>
                ) : (
                  <Avatar className="size-12">
                    <AvatarImage src={conv.avatar} alt={conv.name} />
                    <AvatarFallback>{conv.name[0]}</AvatarFallback>
                  </Avatar>
                )}
                {conv.online && !conv.isGroup && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {conv.pinned && <Pin className="size-3 text-primary rotate-45 flex-shrink-0" />}
                  <span className="text-sm font-medium text-foreground truncate">{conv.nickname || conv.name}</span>
                  {conv.isGroup && (
                    <Users className="size-3 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {conv.status === "sent" && !conv.isGroup && (
                    <Check className="size-3 text-muted-foreground flex-shrink-0" />
                  )}
                  {conv.status === "read" && !conv.isGroup && (
                    <CheckCheck className="size-3 text-primary flex-shrink-0" />
                  )}
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] text-muted-foreground">{conv.time}</span>
                {conv.unread > 0 && (
                  <Badge className="size-5 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white">
                    {conv.unread}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {notificationsData.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer",
                !notif.read ? "bg-primary/5" : "hover:bg-secondary/50"
              )}
            >
              <div className="size-10 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                {notif.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-medium text-foreground">{notif.title}</span>
                  {!notif.read && (
                    <span className="size-2 bg-primary rounded-full flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{notif.content}</p>
              </div>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">{notif.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty State Hint */}
      {activeTab === "chat" && conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="size-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Bell className="size-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            还没有消息？
          </p>
          <p className="text-xs text-muted-foreground text-center mt-1">
            去首页认识新朋友吧！
          </p>
          <Button className="mt-4 bg-primary text-primary-foreground">
            去认识新朋友
          </Button>
        </div>
      )}
    </div>
  )
}
