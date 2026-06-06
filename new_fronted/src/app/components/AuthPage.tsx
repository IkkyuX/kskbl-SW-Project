import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Loader2, Lock, Mail, Sparkles, UserRound } from 'lucide-react';
import { AuthSession, login, loginWithCode, register, resetPassword, sendEmailCode } from '../lib/backend';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useTheme } from '../context/ThemeContext';
import { getThemeShellClass, isLuxuryTheme } from '../lib/themeStyles';

interface AuthPageProps {
  onAuthenticated: (session: AuthSession) => void;
}

type AuthMode = 'login' | 'register' | 'reset-password';
type LoginMethod = 'password' | 'code';
type EmailCodeScene = 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD';

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const { theme } = useTheme();
  const luxuryTheme = isLuxuryTheme(theme);
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const isRegister = mode === 'register';
  const isReset = mode === 'reset-password';
  const isCodeLogin = mode === 'login' && loginMethod === 'code';

  useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const currentScene = useMemo<EmailCodeScene | null>(() => {
    if (isRegister) {
      return 'REGISTER';
    }
    if (isReset) {
      return 'RESET_PASSWORD';
    }
    if (isCodeLogin) {
      return 'LOGIN';
    }
    return null;
  }, [isCodeLogin, isRegister, isReset]);

  const submitLabel = useMemo(() => {
    if (isRegister) {
      return '创建账号';
    }
    if (isReset) {
      return '重置密码';
    }
    return isCodeLogin ? '验证码登录' : '登录';
  }, [isCodeLogin, isRegister, isReset]);

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setNotice(null);
    setVerificationCode('');
    setPassword('');
    if (nextMode !== 'login') {
      setLoginMethod('password');
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim()) {
      setError('请先填写邮箱');
      return;
    }

    if (isRegister && (!nickname.trim() || !password.trim() || !verificationCode.trim())) {
      setError('请填写完整信息');
      return;
    }

    if (isReset && (!password.trim() || !verificationCode.trim())) {
      setError('请填写完整信息');
      return;
    }

    if (mode === 'login' && loginMethod === 'password' && !password.trim()) {
      setError('请输入密码');
      return;
    }

    if (mode === 'login' && loginMethod === 'code' && !verificationCode.trim()) {
      setError('请输入验证码');
      return;
    }

    if ((isRegister || isReset) && password.length < 6) {
      setError('密码至少需要 6 位');
      return;
    }

    try {
      setSubmitting(true);

      if (isRegister) {
        const session = await register(email.trim(), password, nickname.trim(), verificationCode.trim());
        onAuthenticated(session);
        return;
      }

      if (isReset) {
        const result = await resetPassword(email.trim(), verificationCode.trim(), password);
        setNotice(result.message);
        setMode('login');
        setLoginMethod('password');
        setPassword('');
        setVerificationCode('');
        return;
      }

      const session = loginMethod === 'code'
        ? await loginWithCode(email.trim(), verificationCode.trim())
        : await login(email.trim(), password);
      onAuthenticated(session);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : '认证失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCode = async () => {
    const trimmedEmail = email.trim();
    setError(null);
    setNotice(null);

    if (!trimmedEmail) {
      setError('请先填写邮箱');
      return;
    }

    if (!currentScene) {
      setError('当前模式不需要发送验证码');
      return;
    }

    try {
      setSendingCode(true);
      const result = await sendEmailCode(trimmedEmail, currentScene);
      setCountdown(result.resendIntervalSeconds);
      setNotice(result.message);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : '验证码发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  return (
    <main className={`min-h-dvh w-full ${getThemeShellClass(theme)}`}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-8">
        <div className="mb-7">
          <div className={`mb-5 flex size-13 items-center justify-center rounded-[22px] ${
            luxuryTheme ? 'bg-amber-400/10' : 'bg-[var(--muted)]'
          }`}>
            <Sparkles className="size-7 text-[var(--primary)]" />
          </div>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">留圈 UniLink</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            支持密码登录、邮箱验证码登录，以及邮箱验证码注册和重置密码。
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)] break-all">
            当前为云服务器部署版本。
          </p>
        </div>

        <Card className={`p-4 shadow-2xl ${luxuryTheme ? 'border-white/10 bg-white/5 backdrop-blur-xl' : 'bg-[var(--card)]/95'}`}>
          <div className="grid grid-cols-3 rounded-[18px] bg-[var(--muted)] p-1">
            {([
              ['login', '登录'],
              ['register', '注册'],
              ['reset-password', '重置密码'],
            ] as Array<[AuthMode, string]>).map(([item, label]) => (
              <button
                key={item}
                type="button"
                onClick={() => handleModeChange(item)}
                className={`h-10 rounded-[14px] px-2 text-sm font-medium transition-colors ${
                  mode === item ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'login' && (
            <div className="mt-4 grid grid-cols-2 rounded-[16px] bg-[var(--muted)] p-1">
              {([
                ['password', '密码登录'],
                ['code', '验证码登录'],
              ] as Array<[LoginMethod, string]>).map(([item, label]) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setLoginMethod(item);
                    setError(null);
                    setNotice(null);
                    setVerificationCode('');
                    setPassword('');
                  }}
                  className={`h-9 rounded-[12px] text-sm font-medium transition-colors ${
                    loginMethod === item ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <form className="mt-5 space-y-4" onSubmit={submit}>
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="auth-nickname">昵称</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <Input
                    id="auth-nickname"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    className="h-12 rounded-[18px] pl-10"
                    placeholder="例如 小林同学"
                    autoComplete="nickname"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="auth-email">邮箱</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 rounded-[18px] pl-10"
                  placeholder="name@student.app"
                  autoComplete="email"
                />
              </div>
            </div>

            {(isRegister || isReset || isCodeLogin) && (
              <div className="space-y-2">
                <Label htmlFor="auth-verification-code">邮箱验证码</Label>
                <div className="flex gap-2">
                  <Input
                    id="auth-verification-code"
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-12 rounded-[18px]"
                    placeholder="请输入 6 位验证码"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 min-w-28 rounded-[18px]"
                    onClick={() => void handleSendCode()}
                    disabled={sendingCode || countdown > 0}
                  >
                    {sendingCode ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : countdown > 0 ? (
                      `${countdown}s 后重发`
                    ) : (
                      '发送验证码'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {(isRegister || isReset || loginMethod === 'password') && (
              <div className="space-y-2">
                <Label htmlFor="auth-password">{isReset ? '新密码' : '密码'}</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <Input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-[18px] pl-10"
                    placeholder="至少 6 位"
                    autoComplete={isRegister || isReset ? 'new-password' : 'current-password'}
                  />
                </div>
              </div>
            )}

            {notice && (
              <div className="rounded-[16px] border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                {notice}
              </div>
            )}

            {error && (
              <div className="rounded-[16px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {error}
              </div>
            )}

            <Button type="submit" className="h-12 w-full rounded-[18px]" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
              {submitLabel}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
