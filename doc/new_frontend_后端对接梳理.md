# `new_frontend` 与后端项目对接梳理

## 1. 当前结论

`new_frontend` 是一套独立的 `Next.js 16 + React 19 + TypeScript + Tailwind` 前端原型工程，入口在 [app/page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/app/page.tsx)。

它目前的特点是：

- 已有较完整的移动端 UI 原型
- 主要页面已经齐全：首页、社区、圈子、消息、我的
- 交互大多基于组件内部 `useState`
- 数据几乎全部写死在组件文件内
- 还没有统一 API 层、鉴权层、状态管理层

现有后端是 `Kotlin + Spring Boot + JPA + MySQL`，接口主干已经可用，代码位于 [backend/src/main/kotlin/com/ikkyux/swproject](/Users/ikkyux/forDev/IkkyuX/SW项目/backend/src/main/kotlin/com/ikkyux/swproject)。

因此，这一套前端不是“重做后端”，而是“把静态高保真原型逐步替换成真实接口驱动页面”。

## 2. `new_frontend` 页面结构

主入口：

- [app/page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/app/page.tsx)

底部导航：

- [components/mobile-nav.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/mobile-nav.tsx)

核心页面：

- 首页：[components/home-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/home-page.tsx)
- 社区：[components/community-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/community-page.tsx)
- 圈子：[components/circle-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/circle-page.tsx)
- 消息：[components/message-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/message-page.tsx)
- 我的：[components/profile-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/profile-page.tsx)

## 3. 各页面数据来源现状

### 3.1 首页

首页当前包含以下模块：

- 状态切换
- 快捷入口：找饭搭子、找室友、打工信息、生活攻略、二手交易、避雷区
- 推荐用户
- 热门活动
- 热门圈子
- 攻略列表
- 子页和弹层聊天交互

目前这些数据都写死在 [components/home-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/home-page.tsx) 内部，例如：

- `initialRecommendedUsers`
- `guides`
- `hotActivities`
- `trendingCircles`
- `initialMealBuddyPosts`
- `initialRoommatePosts`

### 3.2 社区页

社区页当前包含：

- 分类筛选
- 热门话题
- 帖子流
- 帖子点赞
- 收藏
- 评论抽屉
- 快捷评论

数据也全部写死在 [components/community-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/community-page.tsx) 的 `initialPosts` 中。

### 3.3 圈子页

圈子页当前包含：

- 发现 / 我加入的
- 圈子分类
- 邀请卡片
- 推荐圈子
- 我的圈子

数据写死在 [components/circle-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/circle-page.tsx) 中：

- `recommendedCircles`
- `myCircles`
- `invitations`

### 3.4 消息页

消息页当前包含：

- 私聊列表
- 通知列表
- 单聊详情
- 昵称备注
- 本地发送消息

数据写死在 [components/message-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/message-page.tsx) 中：

- `initialConversations`
- `notifications`

### 3.5 我的页

我的页当前包含：

- 用户资料卡
- 认证徽章
- 标签
- 统计数据
- 功能菜单
- 设置项

数据写死在 [components/profile-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/profile-page.tsx) 的 `userProfile` 中。

## 4. 现有后端已具备的能力

### 4.1 认证

控制器：

- [auth/AuthController.kt](/Users/ikkyux/forDev/IkkyuX/SW项目/backend/src/main/kotlin/com/ikkyux/swproject/auth/AuthController.kt)

可用接口：

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

核心返回：

- `token`
- `refreshToken`
- `userId`
- `nickname`

### 4.2 用户资料

控制器：

- [user/UserController.kt](/Users/ikkyux/forDev/IkkyuX/SW项目/backend/src/main/kotlin/com/ikkyux/swproject/user/UserController.kt)

可用接口：

- `GET /api/v1/users/profile`
- `PUT /api/v1/users/profile`
- `GET /api/v1/users/tags`
- `PUT /api/v1/users/tags`

资料字段：

- `nickname`
- `school`
- `major`
- `languages`
- `bio`
- `tags`
- `status`

### 4.3 学生认证

控制器：

- [user/VerificationController.kt](/Users/ikkyux/forDev/IkkyuX/SW项目/backend/src/main/kotlin/com/ikkyux/swproject/user/VerificationController.kt)

可用接口：

- `POST /api/v1/verifications`
- `GET /api/v1/verifications/latest`

字段：

- `verifyType`
- `fileUrl`
- `status`
- `rejectReason`

### 4.4 匹配推荐

控制器：

- [match/MatchController.kt](/Users/ikkyux/forDev/IkkyuX/SW项目/backend/src/main/kotlin/com/ikkyux/swproject/match/MatchController.kt)

可用接口：

- `GET /api/v1/matches/recommendations`
- `POST /api/v1/matches/{id}/greet`
- `POST /api/v1/matches/{id}/skip`

字段：

- `nickname`
- `school`
- `major`
- `languages`
- `tags`
- `matchReason`
- `matchScore`

### 4.5 社区帖子

控制器：

- [community/CommunityController.kt](/Users/ikkyux/forDev/IkkyuX/SW项目/backend/src/main/kotlin/com/ikkyux/swproject/community/CommunityController.kt)

可用接口：

- `GET /api/v1/posts`
- `GET /api/v1/posts/{id}`
- `POST /api/v1/posts`
- `POST /api/v1/posts/{id}/comments`

字段覆盖：

- 帖子列表：`boardName`、`title`、`summary`、`likeCount`、`commentCount`、`favoriteCount`
- 帖子详情：`content`、`authorName`、`comments`

### 4.6 攻略文章

控制器：

- [content/ContentController.kt](/Users/ikkyux/forDev/IkkyuX/SW项目/backend/src/main/kotlin/com/ikkyux/swproject/content/ContentController.kt)

可用接口：

- `GET /api/v1/articles`
- `GET /api/v1/articles/{id}`

字段：

- `category`
- `title`
- `summary`
- `content`
- `updatedAt`
- `sourceName`
- `sourceUrl`

## 5. 前后端可直接对上的部分

### 5.1 首页推荐用户

前端来源：

- [components/home-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/home-page.tsx) 的 `initialRecommendedUsers`

后端可对接接口：

- `GET /api/v1/matches/recommendations`

映射关系：

- 前端 `name` <- 后端 `nickname`
- 前端 `school` <- 后端 `school`
- 前端 `tags` <- 后端 `tags`
- 前端 `matchReason` <- 后端 `matchReason`

注意：

- 前端当前有 `avatar`、`online`、`followed`、`nickname` 这些字段，后端目前没有对应真实字段

### 5.2 首页攻略列表

前端来源：

- [components/home-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/home-page.tsx) 的 `guides`

后端可对接接口：

- `GET /api/v1/articles`
- `GET /api/v1/articles/{id}`

映射关系：

- 前端 `title` <- `title`
- 前端 `tag` <- `category`
- 前端 `views` 目前后端没有

### 5.3 社区帖子流

前端来源：

- [components/community-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/community-page.tsx) 的 `initialPosts`

后端可对接接口：

- `GET /api/v1/posts`
- `GET /api/v1/posts/{id}`
- `POST /api/v1/posts/{id}/comments`

已能覆盖：

- 帖子标题或摘要
- 作者名
- 评论列表
- 评论提交
- 点进详情

暂时不匹配：

- 前端 `images`
- 前端 `author.school`
- 前端 `author.verified`
- 前端帖子级 `liked`
- 前端帖子级 `saved`
- 前端评论级 `liked`

### 5.4 我的页资料

前端来源：

- [components/profile-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/profile-page.tsx) 的 `userProfile`

后端可对接接口：

- `GET /api/v1/users/profile`
- `PUT /api/v1/users/profile`
- `GET /api/v1/verifications/latest`

已能覆盖：

- 用户名
- 学校
- 专业
- 语言
- bio
- tags
- 认证状态

暂时不匹配：

- `year`
- `verifiedItems`
- `stats.posts`
- `stats.followers`
- `stats.following`
- 头像上传

## 6. 当前明显缺失的后端能力

下面这些页面还没有真正的后端支撑，前端现在只能做静态展示或本地模拟：

### 6.1 消息系统

前端页面：

- [components/message-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/message-page.tsx)

后端当前缺失：

- 会话列表接口
- 单聊消息列表接口
- 发送消息接口
- 未读数接口
- 通知列表接口
- WebSocket 实时推送

这是当前最大缺口之一。

### 6.2 圈子系统

前端页面：

- [components/circle-page.tsx](/Users/ikkyux/forDev/IkkyuX/SW项目/new_frontend/components/circle-page.tsx)

后端当前缺失：

- 圈子列表
- 圈子详情
- 入圈/退圈
- 我加入的圈子
- 圈子邀请
- 圈子动态消息

### 6.3 首页快捷业务

前端首页里这些入口目前都没有独立后端域模型：

- 找室友
- 打工信息
- 二手交易
- 避雷区
- 活动报名

它们现在更像“产品概念入口”，还没有形成现有后端中的正式模块。

### 6.4 社区互动增强

当前社区前端有，但后端缺：

- 帖子点赞
- 帖子收藏
- 评论点赞
- 帖子分类筛选
- 图片上传
- 举报接口

## 7. 适合的对接顺序

推荐按下面顺序推进，不建议先碰消息和圈子，因为那两块后端缺口最大。

### 第一阶段：先把已有接口全部接上

1. 接登录与鉴权
2. 接首页推荐用户
3. 接首页攻略列表与攻略详情
4. 接社区帖子列表、帖子详情、评论提交
5. 接我的页资料与认证状态

### 第二阶段：补最小可用发帖与资料编辑

1. 社区发帖
2. 我的页资料编辑
3. 标签选择
4. 认证提交流程

### 第三阶段：扩后端能力再接前端

1. 会话/消息系统
2. 圈子系统
3. 收藏/点赞
4. 图片上传
5. 通知系统

## 8. 如果要把 `new_frontend` 真正并到现有后端，建议这样改

### 8.1 前端需要新增

- 统一 `api client`
- 登录态管理
- `Bearer Token` 注入
- 页面级数据获取层
- 将组件内硬编码数据替换为接口请求
- 将本地 `useState` 业务状态拆成“服务端状态 + UI 状态”

### 8.2 后端需要新增

- 消息模块
- 圈子模块
- 点赞收藏模块
- 文件上传模块
- 通知模块

## 9. 综合判断

`new_frontend` 的 UI 完成度已经很高，适合作为“最终 Web 前端壳”。  
但它现在本质上还是原型工程，不是已联调工程。

和当前后端的真实契合度大致可以这样看：

- 可直接接入：`40% - 50%`
- 需要补字段或改展示逻辑：`20% - 30%`
- 需要新增后端模块后才能接：`30% - 40%`

最适合立即推进的部分是：

- 登录
- 首页推荐
- 攻略
- 社区
- 我的资料与认证

最不适合立刻联调的部分是：

- 消息
- 圈子
- 活动
- 二手 / 打工 / 房源这些垂直子模块

## 10. 下一步建议

如果继续开发，建议下一步直接做：

1. 在 `new_frontend` 新建 API 层并接入后端登录
2. 先打通首页推荐、攻略、社区、我的页
3. 再决定是“补后端消息模块”还是“先把社区发帖/资料编辑做完整”

