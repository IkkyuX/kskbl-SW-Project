const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1';

type ApiEnvelope<T> = {
  code?: number;
  message?: string;
  data: T;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
  });
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload.message ?? '请求失败');
  }
  return payload.data;
}

export interface AdminUserItem {
  userId: number;
  uNumber: number;
  email: string | null;
  nickname: string;
  avatarUrl: string | null;
  school: string;
  major: string;
  languages: string[];
  bio: string;
}

export interface AdminCircleItem {
  id: number;
  name: string;
  icon: string;
  members: number;
  posts: number;
  description: string;
  tags: string[];
  hot: boolean;
  joined: boolean;
}

export interface AdminArticleItem {
  id: number;
  category: string;
  title: string;
  summary: string;
  updatedAt: string;
  sourceName: string;
}

export async function getAdminUsers() {
  return request<AdminUserItem[]>('/users/public');
}

export async function getAdminCircles() {
  return request<AdminCircleItem[]>('/circles');
}

export async function getAdminArticles() {
  return request<AdminArticleItem[]>('/articles');
}
