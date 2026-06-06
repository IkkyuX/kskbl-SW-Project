export type UserStatus = 'online' | 'offline' | 'busy' | 'away';

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: UserStatus;
  customStatus?: string;
  vip?: boolean;
  level?: number;
  uNumber?: number;
  school?: string;
  major?: string;
  languages?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'voice' | 'sticker';
  reactions?: { emoji: string; count: number }[];
  replyTo?: string;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  members?: User[];
  pinned?: boolean;
  muted?: boolean;
}

export interface FriendGroup {
  id: string;
  name: string;
  count: number;
  expanded?: boolean;
  friends: User[];
}
