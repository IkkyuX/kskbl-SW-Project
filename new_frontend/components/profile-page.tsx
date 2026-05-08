"use client"

import { useEffect, useState } from "react"
import { Settings, ChevronRight, Shield, Heart, Bookmark, FileText, HelpCircle, Globe, LogOut, Camera, BadgeCheck, Edit2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { backendRequest, buildAvatarUrl, clearSession, formatVerificationLabel, TagCatalogDto, TagOptionDto, UserProfileDto, VerificationRecordDto } from "@/lib/backend"
import { languageOptions, useLanguage } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const userProfile = {
  name: "小林同学",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=xiaolin",
  school: "首尔大学",
  major: "计算机科学",
  year: "硕士2年级",
  verified: true,
  verifiedItems: ["学校认证", "实名认证"],
  bio: "热爱美食和旅行的留学生 🍜✈️ 周末喜欢探店和拍照～",
  tags: ["找饭搭子", "周末探店", "摄影爱好者", "学习搭子"],
  stats: {
    posts: 23,
    followers: 156,
    following: 89,
  },
}

const menuItems = [
  {
    id: "posts",
    icon: FileText,
    label: "我的帖子",
    badge: "23",
  },
  {
    id: "saved",
    icon: Bookmark,
    label: "收藏夹",
    badge: "12",
  },
  {
    id: "likes",
    icon: Heart,
    label: "我的点赞",
    badge: "",
  },
  {
    id: "verification",
    icon: Shield,
    label: "认证中心",
    badge: "",
    highlight: true,
  },
]

const settingsItems = [
  {
    id: "language",
    icon: Globe,
    label: "语言设置",
    value: "简体中文",
  },
  {
    id: "help",
    icon: HelpCircle,
    label: "帮助与反馈",
    value: "",
  },
  {
    id: "settings",
    icon: Settings,
    label: "设置",
    value: "",
  },
]

export function ProfilePage() {
  const { language, setLanguage, t, languageLabel } = useLanguage()
  const [profile, setProfile] = useState(userProfile)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [tagCatalog, setTagCatalog] = useState<TagCatalogDto | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    nickname: userProfile.name,
    school: userProfile.school,
    major: userProfile.major,
    languages: "Chinese,Korean,English",
    bio: userProfile.bio,
  })
  const [verificationForm, setVerificationForm] = useState({
    verifyType: "STUDENT_CARD",
    fileUrl: "https://example.com/student-card.jpg",
  })
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      try {
        const [profileData, verification] = await Promise.all([
          backendRequest<UserProfileDto>("/users/profile"),
          backendRequest<VerificationRecordDto | null>("/verifications/latest"),
        ])
        const catalog = await backendRequest<TagCatalogDto>("/users/tag-options")

        if (cancelled) {
          return
        }

        const verified = verification?.status === "APPROVED"
        const verificationItems = verification
          ? [formatVerificationLabel(verification.status), verification.verifyType]
          : []

        setProfile({
          name: profileData.nickname,
          avatar: buildAvatarUrl(profileData.nickname),
          school: profileData.school,
          major: profileData.major,
          year: profileData.status || t.profile.studentStatus,
          verified,
          verifiedItems: verificationItems,
          bio: profileData.bio || t.profile.emptyBio,
          tags: profileData.tags.length > 0 ? profileData.tags : [t.profile.emptyTags],
          stats: userProfile.stats,
        })
        setEditForm({
          nickname: profileData.nickname,
          school: profileData.school,
          major: profileData.major,
          languages: profileData.languages.join(","),
          bio: profileData.bio || "",
        })
        setTagCatalog(catalog)
        const nameToId = new Map<string, number>()
        ;[...catalog.interestTags, ...catalog.sceneTags, ...catalog.statusTags].forEach((tag) => {
          nameToId.set(tag.name, tag.id)
        })
        setSelectedTagIds(profileData.tags.map((tagName) => nameToId.get(tagName)).filter((value): value is number => typeof value === "number"))
        setProfileError(null)
      } catch (error) {
        if (!cancelled) {
        setProfileError(error instanceof Error ? error.message : "资料加载失败")
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [])

  const saveProfile = async () => {
    try {
      const [updated] = await Promise.all([
        backendRequest<UserProfileDto>("/users/profile", {
          method: "PUT",
          body: JSON.stringify({
            nickname: editForm.nickname,
            school: editForm.school,
            major: editForm.major,
            languages: editForm.languages
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            bio: editForm.bio,
          }),
        }),
        backendRequest("/users/tags", {
          method: "PUT",
          body: JSON.stringify({
            tagIds: selectedTagIds,
          }),
        }),
      ])
      const refreshedProfile = await backendRequest<UserProfileDto>("/users/profile")
      setProfile(prev => ({
        ...prev,
        name: refreshedProfile.nickname,
        avatar: buildAvatarUrl(refreshedProfile.nickname),
        school: refreshedProfile.school,
        major: refreshedProfile.major,
        bio: refreshedProfile.bio || t.profile.emptyBio,
        tags: refreshedProfile.tags.length > 0 ? refreshedProfile.tags : prev.tags,
        year: refreshedProfile.status || prev.year,
      }))
      setEditOpen(false)
      setProfileError(null)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "资料保存失败")
    }
  }

  const toggleTag = (tag: TagOptionDto) => {
    setSelectedTagIds((prev) =>
      prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
    )
  }

  const menuItems = [
    {
      id: "posts",
      icon: FileText,
      label: t.profile.myPosts,
      badge: "23",
    },
    {
      id: "saved",
      icon: Bookmark,
      label: t.profile.saved,
      badge: "12",
    },
    {
      id: "likes",
      icon: Heart,
      label: t.profile.likes,
      badge: "",
    },
    {
      id: "verification",
      icon: Shield,
      label: t.profile.verification,
      badge: "",
      highlight: true,
    },
  ]

  const settingsItems = [
    {
      id: "language",
      icon: Globe,
      label: t.profile.language,
      value: languageLabel,
    },
    {
      id: "help",
      icon: HelpCircle,
      label: t.profile.help,
      value: "",
    },
    {
      id: "settings",
      icon: Settings,
      label: t.profile.settings,
      value: "",
    },
  ]

  const submitVerification = async () => {
    try {
      const verification = await backendRequest<VerificationRecordDto>("/verifications", {
        method: "POST",
        body: JSON.stringify(verificationForm),
      })
      setProfile(prev => ({
        ...prev,
        verified: verification.status === "APPROVED",
        verifiedItems: [formatVerificationLabel(verification.status), verification.verifyType],
      }))
      setVerificationOpen(false)
      setProfileError(null)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "认证提交失败")
    }
  }

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header Background */}
      <div className="h-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/20 to-accent/30" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/30 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 size-9 rounded-full bg-card/60 backdrop-blur-sm z-10"
        >
          <Settings className="size-4" />
        </Button>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-12 pb-4">
        {profileError && (
          <Card className="mb-4 p-3 border-amber-200 bg-amber-50/80 text-amber-700">
            <p className="text-xs">{profileError}，{t.profile.demoFallback}</p>
          </Card>
        )}
        <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="size-16 ring-4 ring-card">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback>{profile.name[0]}</AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 size-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-sm">
                <Camera className="size-3" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h1 className="text-lg font-semibold text-foreground">{profile.name}</h1>
                {profile.verified && (
                  <BadgeCheck className="size-4 text-primary fill-primary/20" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {profile.school} · {profile.major} · {profile.year}
              </p>
              <div className="flex gap-1.5">
                {profile.verifiedItems.map((item) => (
                  <Badge key={item} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setEditOpen(true)}>
              <Edit2 className="size-3 mr-1" />
              {t.profile.edit}
            </Button>
          </div>

          {/* Bio */}
          <p className="text-sm text-foreground mt-3 leading-relaxed">{profile.bio}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5 h-5 bg-accent/30 text-accent-foreground">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-around mt-4 pt-4 border-t border-border/50">
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-foreground">{profile.stats.posts}</span>
              <span className="text-[10px] text-muted-foreground">{t.profile.posts}</span>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-foreground">{profile.stats.followers}</span>
              <span className="text-[10px] text-muted-foreground">{t.profile.followers}</span>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-foreground">{profile.stats.following}</span>
              <span className="text-[10px] text-muted-foreground">{t.profile.following}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="px-4 pb-4">
        <Card className="divide-y divide-border/30 border-border/50 bg-card/80 backdrop-blur-sm">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "verification") {
                    setVerificationOpen(true)
                  }
                }}
                className={cn(
                  "flex items-center gap-3 w-full p-3 hover:bg-secondary/50 transition-colors",
                  item.highlight && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "size-9 rounded-lg flex items-center justify-center",
                  item.highlight ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                )}>
                  <Icon className="size-4" />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                    {item.badge}
                  </Badge>
                )}
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            )
          })}
        </Card>
      </div>

      {/* Settings Items */}
      <div className="px-4 pb-4">
        <Card className="divide-y divide-border/30 border-border/50 bg-card/80 backdrop-blur-sm">
          {settingsItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "language") {
                    setLanguageOpen(true)
                  }
                }}
                className="flex items-center gap-3 w-full p-3 hover:bg-secondary/50 transition-colors"
              >
                <div className="size-9 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground">
                  <Icon className="size-4" />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
                {item.value && (
                  <span className="text-xs text-muted-foreground">{item.value}</span>
                )}
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            )
          })}
        </Card>
      </div>

      {/* Logout */}
      <div className="px-4 pb-8">
        <Button
          variant="ghost"
          className="w-full h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            clearSession()
            window.location.reload()
          }}
        >
          <LogOut className="size-4 mr-2" />
          {t.profile.logout}
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.profile.editProfile}</DialogTitle>
            <DialogDescription>{t.profile.editProfileDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={editForm.nickname} onChange={(event) => setEditForm(prev => ({ ...prev, nickname: event.target.value }))} placeholder={t.profile.nickname} />
            <Input value={editForm.school} onChange={(event) => setEditForm(prev => ({ ...prev, school: event.target.value }))} placeholder={t.profile.school} />
            <Input value={editForm.major} onChange={(event) => setEditForm(prev => ({ ...prev, major: event.target.value }))} placeholder={t.profile.major} />
            <Input value={editForm.languages} onChange={(event) => setEditForm(prev => ({ ...prev, languages: event.target.value }))} placeholder={t.profile.languages} />
            <Textarea value={editForm.bio} onChange={(event) => setEditForm(prev => ({ ...prev, bio: event.target.value }))} placeholder={t.profile.bio} />
            {tagCatalog && (
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-sm font-medium">{t.profile.statusTags}</p>
                  <div className="flex flex-wrap gap-2">
                    {tagCatalog.statusTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          selectedTagIds.includes(tag.id)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-secondary/50"
                        )}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">{t.profile.interestScene}</p>
                  <div className="flex flex-wrap gap-2">
                    {[...tagCatalog.interestTags, ...tagCatalog.sceneTags].map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          selectedTagIds.includes(tag.id)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-secondary/50"
                        )}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t.profile.cancel}</Button>
            <Button onClick={saveProfile}>{t.profile.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.profile.languageTitle}</DialogTitle>
            <DialogDescription>{t.profile.languageDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {languageOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => setLanguage(option.code)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                  language === option.code
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:bg-secondary/60"
                )}
              >
                <div>
                  <p className="text-sm font-medium">{option.nativeLabel}</p>
                  <p className="text-xs text-muted-foreground">{option.label}</p>
                </div>
                {language === option.code && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {t.profile.currentLanguage}
                  </Badge>
                )}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setLanguageOpen(false)}>{t.profile.done}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={verificationOpen} onOpenChange={setVerificationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.profile.submitVerification}</DialogTitle>
            <DialogDescription>{t.profile.verificationDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={verificationForm.verifyType}
              onChange={(event) => setVerificationForm(prev => ({ ...prev, verifyType: event.target.value }))}
              placeholder={t.profile.verificationType}
            />
            <Input
              value={verificationForm.fileUrl}
              onChange={(event) => setVerificationForm(prev => ({ ...prev, fileUrl: event.target.value }))}
              placeholder={t.profile.fileUrl}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationOpen(false)}>{t.profile.cancel}</Button>
            <Button onClick={submitVerification}>{t.profile.submit}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
