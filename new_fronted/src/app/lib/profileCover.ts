import { getStoredSession } from './backend';

const PROFILE_COVER_STORAGE_KEY = 'sw_profile_cover_v1';
const PROFILE_COVER_MAX_WIDTH = 1600;
const PROFILE_COVER_OUTPUT_QUALITY = 0.82;

function resolveProfileCoverOwnerId(userId?: number | string | null) {
  if (typeof userId === 'number' && Number.isFinite(userId)) {
    return String(userId);
  }
  if (typeof userId === 'string' && userId.trim()) {
    return userId.trim();
  }
  const session = getStoredSession();
  return session ? String(session.userId) : 'default';
}

function getProfileCoverStorageKey(userId?: number | string | null) {
  return `${PROFILE_COVER_STORAGE_KEY}:${resolveProfileCoverOwnerId(userId)}`;
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('封面图片读取失败'));
    image.src = src;
  });
}

export function readStoredProfileCover(userId?: number | string | null) {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.localStorage.getItem(getProfileCoverStorageKey(userId)) ?? '';
}

export function writeStoredProfileCover(coverImage: string, userId?: number | string | null) {
  if (typeof window === 'undefined') {
    return;
  }
  const storageKey = getProfileCoverStorageKey(userId);
  if (coverImage) {
    window.localStorage.setItem(storageKey, coverImage);
  } else {
    window.localStorage.removeItem(storageKey);
  }
}

export async function compressProfileCoverImage(file: File) {
  const source = await readImageFile(file);
  const image = await loadImageElement(source);
  const scale = Math.min(1, PROFILE_COVER_MAX_WIDTH / image.width);
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    return source;
  }
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL('image/jpeg', PROFILE_COVER_OUTPUT_QUALITY);
}
