import { Capacitor } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { toast } from 'sonner';
import { getApiBaseUrl, getApiOrigin } from './backend';

export interface LiveUpdateManifestDto {
  bundleId: string;
  artifactType?: 'zip' | 'manifest';
  downloadUrl: string;
  checksum?: string | null;
  signature?: string | null;
  versionName?: string | null;
  versionCode?: number | null;
  notes?: string | null;
  platform?: string | null;
  channel?: string | null;
}

function isNativeLiveUpdateSupported() {
  return Capacitor.isNativePlatform();
}

async function readActiveChannel() {
  try {
    const result = await LiveUpdate.getChannel();
    return result.channel || 'production';
  } catch {
    return 'production';
  }
}

async function readCurrentBundleId() {
  try {
    const result = await LiveUpdate.getCurrentBundle();
    return result.bundleId || null;
  } catch {
    return null;
  }
}

async function readNextBundleId() {
  try {
    const result = await LiveUpdate.getNextBundle();
    return result.bundleId || null;
  } catch {
    return null;
  }
}

async function readVersionName() {
  try {
    const result = await LiveUpdate.getVersionName();
    return result.versionName || undefined;
  } catch {
    return undefined;
  }
}

async function readVersionCode() {
  try {
    const result = await LiveUpdate.getVersionCode();
    return typeof result.versionCode === 'number' ? result.versionCode : undefined;
  } catch {
    return undefined;
  }
}

async function callReady() {
  try {
    await LiveUpdate.ready();
  } catch (error) {
    console.warn('[LiveUpdate] ready failed', error);
  }
}

async function fetchLatestManifest(platform: string, channel: string, versionName?: string, versionCode?: number) {
  const params = new URLSearchParams({
    platform,
    channel,
  });
  if (versionName) {
    params.set('versionName', versionName);
  }
  if (typeof versionCode === 'number') {
    params.set('versionCode', String(versionCode));
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${getApiBaseUrl()}/app-updates/live/latest?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { data?: LiveUpdateManifestDto | null };
    return payload.data ?? null;
  } catch (error) {
    console.warn('[LiveUpdate] manifest fetch failed', error);
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function checkAndApplyLiveUpdate() {
  if (!isNativeLiveUpdateSupported()) {
    return;
  }

  await callReady();

  const [channel, currentBundleId, nextBundleId] = await Promise.all([
    readActiveChannel(),
    readCurrentBundleId(),
    readNextBundleId(),
  ]);
  const [versionName, versionCode] = await Promise.all([
    readVersionName(),
    readVersionCode(),
  ]);

  const platform = Capacitor.getPlatform();
  const manifest = await fetchLatestManifest(platform, channel, versionName, versionCode);
  if (!manifest?.bundleId || !manifest.downloadUrl) {
    return;
  }

  if (manifest.bundleId === currentBundleId || manifest.bundleId === nextBundleId) {
    return;
  }

  toast.message('检测到新版本，正在自动更新');

  const downloadUrl = manifest.downloadUrl.startsWith('http')
    ? manifest.downloadUrl
    : `${getApiOrigin()}${manifest.downloadUrl.startsWith('/') ? '' : '/'}${manifest.downloadUrl}`;

  try {
    await LiveUpdate.downloadBundle({
      bundleId: manifest.bundleId,
      url: downloadUrl,
      checksum: manifest.checksum ?? undefined,
      signature: manifest.signature ?? undefined,
    });
    await LiveUpdate.setNextBundle({ bundleId: manifest.bundleId });
    toast.success('新版本已下载，正在重启应用');
    await LiveUpdate.reload();
  } catch (error) {
    console.warn('[LiveUpdate] update apply failed', error);
    toast.error('自动更新失败，已继续使用当前版本');
  }
}

export function startLiveUpdateWatcher() {
  if (!isNativeLiveUpdateSupported()) {
    return () => undefined;
  }

  let disposed = false;
  let pending = false;

  const run = async () => {
    if (disposed || pending) {
      return;
    }
    pending = true;
    try {
      await checkAndApplyLiveUpdate();
    } finally {
      pending = false;
    }
  };

  void run();

  const handleVisibilityChange = () => {
    if (!document.hidden) {
      void run();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  const intervalId = window.setInterval(() => {
    void run();
  }, 10 * 60 * 1000);

  return () => {
    disposed = true;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.clearInterval(intervalId);
  };
}
