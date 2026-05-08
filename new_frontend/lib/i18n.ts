"use client"

import { useEffect, useState } from "react"

export type LanguageCode = "zh-CN" | "ko-KR"

const LANGUAGE_KEY = "unilink_language"
const LANGUAGE_EVENT = "unilink-language-change"

export const languageOptions: Array<{ code: LanguageCode; label: string; nativeLabel: string }> = [
  { code: "zh-CN", label: "简体中文", nativeLabel: "简体中文" },
  { code: "ko-KR", label: "韩文", nativeLabel: "한국어" },
]

const translations = {
  "zh-CN": {
    nav: {
      home: "首页",
      community: "社区",
      circle: "圈子",
      message: "消息",
      profile: "我的",
    },
    profile: {
      edit: "编辑",
      posts: "帖子",
      followers: "关注者",
      following: "关注中",
      myPosts: "我的帖子",
      saved: "收藏夹",
      likes: "我的点赞",
      verification: "认证中心",
      language: "语言设置",
      help: "帮助与反馈",
      settings: "设置",
      logout: "退出登录",
      languageTitle: "语言设置",
      languageDescription: "选择应用界面显示语言。",
      cancel: "取消",
      done: "完成",
      currentLanguage: "当前语言",
      editProfile: "编辑资料",
      editProfileDescription: "这里先接入昵称、学校、专业、语言和简介五个核心字段。",
      nickname: "昵称",
      school: "学校",
      major: "专业",
      languages: "语言，用逗号分隔",
      bio: "个人简介",
      statusTags: "状态标签",
      interestScene: "兴趣与场景",
      save: "保存",
      submitVerification: "提交认证",
      verificationDescription: "当前先接入文件链接版认证，后续可以再升级成真实上传。",
      verificationType: "认证类型",
      fileUrl: "资料链接",
      submit: "提交",
      demoFallback: "当前展示的是本地演示资料。",
      emptyBio: "这个同学还没有填写个人简介。",
      emptyTags: "等待完善资料",
      studentStatus: "在读留学生",
    },
    home: {
      statusChat: "想聊天",
      statusMeal: "找饭搭子",
      statusStudy: "想学习",
      statusExplore: "想逛街",
      mealBuddy: "找饭搭子",
      roommate: "找室友",
      parttime: "打工信息",
      guide: "生活攻略",
      secondhand: "二手交易",
      warning: "避雷区",
      myStatus: "我的状态",
      currentProfileStatus: "当前资料状态：",
      recommendPeople: "推荐认识",
      refresh: "换一批",
      hotActivities: "热门活动",
      more: "更多",
      hotCircles: "热门圈子",
      all: "全部",
      members: "成员",
      usefulGuides: "实用攻略",
      publishMealBuddy: "发布找饭搭子",
      publishRoommate: "发布找室友",
      postDetail: "帖子详情",
      citySeoul: "首尔",
      demoFallback: "当前展示的是本地演示数据。",
    },
  },
  "ko-KR": {
    nav: {
      home: "홈",
      community: "커뮤니티",
      circle: "모임",
      message: "메시지",
      profile: "마이",
    },
    profile: {
      edit: "수정",
      posts: "게시글",
      followers: "팔로워",
      following: "팔로잉",
      myPosts: "내 게시글",
      saved: "저장함",
      likes: "좋아요",
      verification: "인증 센터",
      language: "언어 설정",
      help: "도움말 및 피드백",
      settings: "설정",
      logout: "로그아웃",
      languageTitle: "언어 설정",
      languageDescription: "앱 화면에 표시할 언어를 선택하세요.",
      cancel: "취소",
      done: "완료",
      currentLanguage: "현재 언어",
      editProfile: "프로필 수정",
      editProfileDescription: "닉네임, 학교, 전공, 언어, 자기소개를 수정할 수 있습니다.",
      nickname: "닉네임",
      school: "학교",
      major: "전공",
      languages: "언어, 쉼표로 구분",
      bio: "자기소개",
      statusTags: "상태 태그",
      interestScene: "관심사와 상황",
      save: "저장",
      submitVerification: "인증 제출",
      verificationDescription: "현재는 파일 링크 인증을 지원하며, 이후 실제 업로드로 확장할 수 있습니다.",
      verificationType: "인증 유형",
      fileUrl: "자료 링크",
      submit: "제출",
      demoFallback: "현재 로컬 데모 프로필을 표시하고 있습니다.",
      emptyBio: "아직 자기소개가 없습니다.",
      emptyTags: "프로필을 완성해 주세요",
      studentStatus: "재학 중인 유학생",
    },
    home: {
      statusChat: "대화하고 싶어요",
      statusMeal: "밥친구 찾기",
      statusStudy: "공부하고 싶어요",
      statusExplore: "놀러 가고 싶어요",
      mealBuddy: "밥친구",
      roommate: "룸메이트",
      parttime: "알바 정보",
      guide: "생활 가이드",
      secondhand: "중고거래",
      warning: "주의 정보",
      myStatus: "내 상태",
      currentProfileStatus: "현재 프로필 상태: ",
      recommendPeople: "추천 친구",
      refresh: "새로 보기",
      hotActivities: "인기 활동",
      more: "더보기",
      hotCircles: "인기 모임",
      all: "전체",
      members: "명",
      usefulGuides: "유용한 가이드",
      publishMealBuddy: "밥친구 모집하기",
      publishRoommate: "룸메이트 구하기",
      postDetail: "게시글 상세",
      citySeoul: "서울",
      demoFallback: "현재 로컬 데모 데이터를 표시하고 있습니다.",
    },
  },
} as const

function readLanguage(): LanguageCode {
  if (typeof window === "undefined") {
    return "zh-CN"
  }
  const stored = window.localStorage.getItem(LANGUAGE_KEY)
  return stored === "ko-KR" || stored === "zh-CN" ? stored : "zh-CN"
}

export function useLanguage() {
  const [language, setLanguageState] = useState<LanguageCode>("zh-CN")

  useEffect(() => {
    setLanguageState(readLanguage())
    const handleLanguageChange = () => setLanguageState(readLanguage())
    window.addEventListener(LANGUAGE_EVENT, handleLanguageChange)
    window.addEventListener("storage", handleLanguageChange)
    return () => {
      window.removeEventListener(LANGUAGE_EVENT, handleLanguageChange)
      window.removeEventListener("storage", handleLanguageChange)
    }
  }, [])

  const setLanguage = (nextLanguage: LanguageCode) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_KEY, nextLanguage)
      window.dispatchEvent(new Event(LANGUAGE_EVENT))
    }
    setLanguageState(nextLanguage)
  }

  return {
    language,
    setLanguage,
    t: translations[language],
    languageLabel: languageOptions.find((option) => option.code === language)?.nativeLabel ?? "简体中文",
  }
}
