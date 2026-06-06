# Agent 项目摘要

## 当前基准项目

用户已明确：一切以 `new_fronted` 为准。后续 Agent 接手时，所有前端实现、接口对接、问题排查和验收都应围绕：

```text
new_fronted/
backend/
```

根目录下的 `frontend/` 是历史前端目录，`adminFrontend/` 是历史管理端原型。除非用户明确点名，否则不要以它们为准，不要把它们的实现状态当作当前进度。

## 技术栈

- 后端：Kotlin + Spring Boot + JPA
- 默认数据库：H2 内存数据库
- 可选数据库：MySQL，配置在 `backend/src/main/resources/application-mysql.yml`
- 基准前端：`new_fronted`，Vite + React + TypeScript + Tailwind
- 前端请求代理：`new_fronted/vite.config.ts` 将 `/api` 转发到 `http://localhost:8080`

## 启动命令

后端：

```bash
cd backend
./gradlew bootRun
```

前端：

```bash
cd new_fronted
npm install
npm run dev
```

前端构建：

```bash
cd new_fronted
npm run build
```

## 后端接口概览

主要接口前缀为 `/api/v1`：

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /users/profile`
- `PUT /users/profile`
- `GET /users/tags`
- `GET /users/tag-options`
- `PUT /users/tags`
- `POST /verifications`
- `GET /verifications/latest`
- `GET /matches/recommendations`
- `POST /matches/{id}/greet`
- `POST /matches/{id}/skip`
- `GET /posts`
- `GET /posts/discover/{theme}`
- `GET /posts/{id}`
- `POST /posts`
- `POST /posts/{id}/like`
- `POST /posts/{id}/favorite`
- `POST /posts/{id}/comments`
- `GET /circles`
- `POST /circles`
- `GET /circles/joined`
- `GET /circles/{id}`
- `GET /circles/{id}/activities`
- `GET /circles/{id}/members`
- `GET /circles/{id}/posts`
- `POST /circles/{id}/join`
- `POST /circles/{id}/leave`
- `GET /messages/conversations`
- `GET /messages/conversations/{id}`
- `POST /messages/direct`
- `POST /messages/conversations/{id}`
- `GET /messages/notifications`
- `GET /articles`
- `GET /articles/{id}`

## `new_fronted` 对接状态

统一请求层：

```text
new_fronted/src/app/lib/backend.ts
```

已对接：

- 自动 demo 登录：`App.tsx`
- 当前用户资料：`useCurrentUser.ts`
- 消息列表：`ChatList.tsx`
- 聊天详情与发送：`ChatWindow.tsx`
- 推荐联系人：`FriendList.tsx`
- 圈子列表请求：`ChannelPanel.tsx`

仍保留 mock 或本地状态：

- 动态 / 空间流：`MomentsPanel.tsx`
- 状态账号切换：`StatusPanel.tsx`
- 个性化、设置、部分按钮交互
- 文章、帖子、认证、标签编辑、圈子加入/退出等完整页面流程

## 已知注意点

- `new_fronted/src/app/components/ChannelPanel.tsx` 已请求 `/circles`，但渲染处仍应确认是否使用真实 `channels` 数据。
- `new_fronted` 的 `npm run build` 只执行 Vite 构建，不等价于完整 TypeScript 类型检查。
- `new_fronted` 默认自动登录 `demo@student.app / 123456`，可通过 `VITE_DEMO_EMAIL`、`VITE_DEMO_PASSWORD` 覆盖。
- 代码改动前先检查 `git status`，仓库内已有未提交变更，不要回滚用户已有修改。

## 推荐后续工作顺序

1. 修复 `ChannelPanel` 渲染真实圈子数据。
2. 补充登录失败状态和重试入口。
3. 将动态、通知、帖子、文章、认证逐步替换为真实接口。
4. 给关键前端接口调用增加错误态和空态。
5. 后端接口稳定后，再按用户指示决定是否清理历史 `frontend` 与 `adminFrontend`。
