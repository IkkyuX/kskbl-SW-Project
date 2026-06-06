# Live Update 发布说明

## 当前线上配置

- 更新接口：`http://43.108.10.167/api/v1/app-updates/live/latest`
- 更新包目录：`/www/wwwroot/ulink/uploads/app-updates/live/android/production`
- 当前原生版本：`versionName=1.0`，`versionCode=1`
- App 渠道：`production`

## 一键发布命令

在 [new_fronted](/Users/ikkyux/forDev/IkkyuX/SW项目/new_fronted) 目录执行：

```bash
npm run live:update:publish
```

这条命令会自动完成：

1. 重新构建前端 `dist`
2. 把 `dist` 打成 live update `zip`
3. 生成 `latest.json`
4. 通过 SSH 上传到服务器
5. 回读线上接口，确认更新已经发布成功

## 可选环境变量

默认值已经适配当前服务器；只有在你换机器、换 IP、换密钥时才需要改：

```bash
LIVE_UPDATE_HOST=43.108.10.167
LIVE_UPDATE_USER=root
LIVE_UPDATE_SSH_KEY=~/Downloads/SSH.pem
LIVE_UPDATE_REMOTE_ROOT=/www/wwwroot/ulink/uploads/app-updates/live
LIVE_UPDATE_CHANNEL=production
LIVE_UPDATE_PLATFORM=android
LIVE_UPDATE_PUBLIC_BASE_URL=http://43.108.10.167
LIVE_UPDATE_NOTES=本次更新说明
```

示例：

```bash
LIVE_UPDATE_NOTES="修复消息页刷新问题" npm run live:update:publish
```

## 兼容性规则

- 只有同一个签名的 APK 才能长期覆盖安装。
- 只有相同原生版本的 App 会收到对应的 live update。
- 如果你改了 Android 原生插件、权限、Capacitor 原生层代码，不能只发 live update，必须重新发新的 APK。
- 如果只是改前端页面、样式、交互、接口调用逻辑，这条 live update 流程就可以直接用。
