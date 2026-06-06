"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "./utils";

const AVATAR_CACHE_PREFIX = "sw-avatar-cache-v1:";
const AVATAR_CACHE_MAX_BYTES = 220 * 1024;
const avatarMemoryCache = new Map<string, string>();
const avatarLoadedSources = new Set<string>();
const avatarPendingCache = new Map<string, Promise<string | null>>();

function getAvatarCacheKey(src: string) {
  try {
    return `${AVATAR_CACHE_PREFIX}${btoa(encodeURIComponent(src))}`;
  } catch {
    return `${AVATAR_CACHE_PREFIX}${src}`;
  }
}

function readCachedAvatar(src?: string) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }
  const memoryValue = avatarMemoryCache.get(src);
  if (memoryValue) {
    return memoryValue;
  }
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    const cached = window.localStorage.getItem(getAvatarCacheKey(src));
    if (cached) {
      avatarMemoryCache.set(src, cached);
      avatarLoadedSources.add(src);
      avatarLoadedSources.add(cached);
      return cached;
    }
  } catch {
    // Local storage can be unavailable in private mode; memory cache still works.
  }
  return undefined;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("avatar cache read failed"));
    reader.readAsDataURL(blob);
  });
}

async function warmAvatarCache(src: string) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
    return src || null;
  }
  const cached = readCachedAvatar(src);
  if (cached && cached !== src) {
    return cached;
  }
  const pending = avatarPendingCache.get(src);
  if (pending) {
    return pending;
  }

  const task = (async () => {
    try {
      const response = await fetch(src, {
        cache: "force-cache",
        credentials: src.startsWith(window.location.origin) ? "same-origin" : "omit",
        mode: "cors",
      });
      if (!response.ok) {
        return null;
      }
      const blob = await response.blob();
      if (!blob.type.startsWith("image/") || blob.size > AVATAR_CACHE_MAX_BYTES) {
        avatarLoadedSources.add(src);
        return null;
      }
      const dataUrl = await blobToDataUrl(blob);
      avatarMemoryCache.set(src, dataUrl);
      avatarLoadedSources.add(src);
      avatarLoadedSources.add(dataUrl);
      try {
        window.localStorage.setItem(getAvatarCacheKey(src), dataUrl);
      } catch {
        // Ignore quota failures; the in-memory cache still prevents page-switch flashes.
      }
      return dataUrl;
    } catch {
      return null;
    } finally {
      avatarPendingCache.delete(src);
    }
  })();

  avatarPendingCache.set(src, task);
  return task;
}

function useCachedAvatarSrc(src?: string) {
  const [displaySrc, setDisplaySrc] = React.useState(() => readCachedAvatar(src) ?? src);
  const [loaded, setLoaded] = React.useState(() => {
    const cached = readCachedAvatar(src);
    return Boolean(src && (cached || avatarLoadedSources.has(src)));
  });
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!src) {
      setDisplaySrc(undefined);
      setLoaded(false);
      setFailed(false);
      return;
    }

    let cancelled = false;
    const cached = readCachedAvatar(src);
    setDisplaySrc(cached ?? src);
    setLoaded(Boolean(cached || avatarLoadedSources.has(src)));
    setFailed(false);

    void warmAvatarCache(src).then((cachedSrc) => {
      if (cancelled || !cachedSrc) {
        return;
      }
      setDisplaySrc(cachedSrc);
      setLoaded(true);
      setFailed(false);
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return {
    displaySrc,
    loaded,
    failed,
    markLoaded: () => {
      if (src) {
        avatarLoadedSources.add(src);
      }
      if (displaySrc) {
        avatarLoadedSources.add(displaySrc);
      }
      setLoaded(true);
      setFailed(false);
    },
    markFailed: () => {
      setFailed(true);
      setLoaded(false);
    },
  };
}

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  src,
  onLoad,
  onError,
  ...props
}: React.ComponentProps<"img">) {
  const { displaySrc, loaded, failed, markLoaded, markFailed } = useCachedAvatarSrc(src);

  if (!displaySrc || failed) {
    return null;
  }

  return (
    <img
      data-slot="avatar-image"
      src={displaySrc}
      decoding="async"
      loading="eager"
      className={cn(
        "absolute inset-0 z-10 aspect-square size-full object-cover transition-opacity duration-100",
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
      onLoad={(event) => {
        markLoaded();
        onLoad?.(event);
      }}
      onError={(event) => {
        markFailed();
        onError?.(event);
      }}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
