"use client";

import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Crown, Moon, Sparkles, Star, SunMedium } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Progress } from './ui/progress';
import { useTheme } from '../context/ThemeContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getLevelSummary, type LevelSummaryDto } from '../lib/backend';
import {
  getThemeHeaderClass,
  getThemeMutedSurfaceClass,
  getThemePanelClass,
  getThemeReadableTextClass,
  getThemeSecondaryTextClass,
  getThemeSoftCardClass,
  isLuxuryTheme,
} from '../lib/themeStyles';

interface LevelCenterPageProps {
  isOpen: boolean;
  onClose: () => void;
}

function buildLevelIcons(level: number) {
  const icons: Array<{ key: string; icon: typeof Crown; className: string; title: string }> = [];
  const add = (count: number, keyPrefix: string, icon: typeof Crown, className: string, title: string) => {
    for (let i = 0; i < count; i += 1) {
      icons.push({ key: `${keyPrefix}-${i}`, icon, className, title });
    }
  };

  let remaining = Math.max(0, level);
  const crownCount = Math.floor(remaining / 50);
  remaining %= 50;
  const sunCount = Math.floor(remaining / 30);
  remaining %= 30;
  const moonCount = Math.floor(remaining / 10);
  remaining %= 10;
  const starCount = remaining;

  add(crownCount, 'crown', Crown, 'text-[#d4a017]', '50级');
  add(sunCount, 'sun', SunMedium, 'text-[#e5a800]', '30级');
  add(moonCount, 'moon', Moon, 'text-[#7c9cff]', '10级');
  add(starCount, 'star', Star, 'text-[#f0c24b]', '1级');

  return icons;
}

export function LevelCenterPage({ isOpen, onClose }: LevelCenterPageProps) {
  const { theme } = useTheme();
  const { currentUser } = useCurrentUser();
  const [summary, setSummary] = useState<LevelSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const response = await getLevelSummary();
        if (!cancelled) {
          setSummary(response);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '等级数据加载失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const luxuryTheme = isLuxuryTheme(theme);
  const level = summary?.level ?? currentUser?.level ?? 1;
  const experience = summary?.experience ?? currentUser?.experience ?? 0;
  const progressPercent = summary?.progressPercent ?? 0;
  const currentLevelExp = summary?.currentLevelExp ?? 0;
  const nextLevelExp = summary?.nextLevelExp ?? 100;
  const expNeededForNextLevel = summary?.expNeededForNextLevel ?? 100;
  const levelIcons = useMemo(() => buildLevelIcons(level), [level]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`fixed inset-0 z-[70] flex justify-center bg-black/35 md:py-4 ${getThemeReadableTextClass(theme)}`}
        >
          <div className={`flex h-full w-full max-w-[480px] flex-col overflow-y-auto md:rounded-[28px] md:shadow-2xl ${getThemePanelClass(theme)} ${getThemeReadableTextClass(theme)}`}>
            <div className={`sticky top-0 z-10 px-4 pb-4 pt-7 ${getThemeHeaderClass(theme)}`}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex size-10 items-center justify-center rounded-full transition-colors ${luxuryTheme ? 'bg-white/8 text-white hover:bg-white/12' : `${getThemeMutedSurfaceClass(theme)} ${getThemeReadableTextClass(theme)} hover:bg-[var(--accent)]`}`}
                >
                  <ArrowLeft className="size-5" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold">等级中心</h1>
                  <p className={`text-xs ${getThemeSecondaryTextClass(theme)}`}>经验、升级进度与成长规则</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-4 pb-8 pt-4">
              <section className={`rounded-[28px] p-5 ${luxuryTheme ? 'border border-white/10 bg-[linear-gradient(135deg,rgba(255,232,162,0.18),rgba(212,175,55,0.1),rgba(15,11,7,0.22))]' : `${getThemeSoftCardClass(theme)} shadow-sm`}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-xs uppercase tracking-[0.24em] ${getThemeSecondaryTextClass(theme)}`}>Level</p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-4xl font-semibold leading-none">Lv.{level}</span>
                      <span className={`pb-1 text-sm ${getThemeSecondaryTextClass(theme)}`}>{currentUser?.name ?? '加载中'}</span>
                    </div>
                    <p className={`mt-3 text-sm ${getThemeReadableTextClass(theme)}`}>当前经验 {experience} EXP</p>
                  </div>
                  <div className="flex max-w-[120px] flex-wrap justify-end gap-0.5">
                    {levelIcons.map((item) => {
                      const Icon = item.icon;
                      return (
                        <span key={item.key} title={item.title} className={`inline-flex items-center justify-center ${item.className}`}>
                          <Icon className="size-4" strokeWidth={2} />
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className={getThemeSecondaryTextClass(theme)}>距离下一等级还需 {expNeededForNextLevel} EXP</span>
                    <span className={`font-semibold ${getThemeReadableTextClass(theme)}`}>{progressPercent}%</span>
                  </div>
                  <Progress
                    value={progressPercent}
                    className={`h-3 ${luxuryTheme ? 'bg-white/10 [&_[data-slot=progress-indicator]]:bg-[linear-gradient(90deg,#ffe8a2,#d4af37)]' : '[&_[data-slot=progress-indicator]]:bg-[var(--primary)]'} ${getThemeMutedSurfaceClass(theme)}`}
                  />
                  <div className={`mt-2 flex items-center justify-between text-xs ${getThemeSecondaryTextClass(theme)}`}>
                    <span>{currentLevelExp} EXP</span>
                    <span>{nextLevelExp} EXP</span>
                  </div>
                </div>
              </section>

              <section className={`rounded-[24px] p-5 ${luxuryTheme ? 'border border-white/10 bg-white/[0.06]' : `${getThemeSoftCardClass(theme)} shadow-sm`}`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4.5 text-[var(--primary)]" />
                  <h2 className="text-sm font-semibold">经验获取规则</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {(summary?.rules ?? []).map((rule) => (
                    <div key={rule.key} className={`rounded-[20px] px-4 py-3 ${luxuryTheme ? 'bg-white/5' : getThemeMutedSurfaceClass(theme)}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{rule.label}</p>
                          <p className={`mt-1 text-xs leading-5 ${getThemeSecondaryTextClass(theme)}`}>{rule.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[var(--primary)]">+{rule.earnedExp}</p>
                          <p className={`mt-1 text-xs ${getThemeSecondaryTextClass(theme)}`}>{rule.count} x {rule.expPerUnit}EXP</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={`rounded-[24px] p-5 ${luxuryTheme ? 'border border-white/10 bg-white/[0.04]' : `${getThemeSoftCardClass(theme)} shadow-sm`}`}>
                <h2 className="text-sm font-semibold">成长说明</h2>
                <div className={`mt-3 space-y-2 text-sm leading-6 ${getThemeSecondaryTextClass(theme)}`}>
                  <p>等级由真实行为累计经验实时换算，不再使用固定演示等级。</p>
                  <p>当前经验项包括资料完善、发帖、评论、消息互动、好友数量、获得点赞与收藏。</p>
                  <p>{loading ? '正在刷新等级数据…' : error ? error : '等级信息已同步到当前账号最新状态。'}</p>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
