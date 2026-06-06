# 留学生社区平台 V0 UI 生成策划书

说明：本文档用于投喂 V0 / v0.dev 这类 UI 生成工具，不是产品版本策划。目标是让工具生成一套可落地到当前项目的用户端 UI，风格年轻化、简约大气，参考 QQ 的轻社交关系链、状态表达、消息中心和圈子氛围。

当前项目基线：

1. 用户端前端：Next.js + React + TypeScript。
2. UI 基础：Tailwind CSS、shadcn/ui、lucide-react。
3. 后端：Kotlin + Spring Boot。
4. API Base URL：`http://localhost:8080/api/v1`，前端通过 `NEXT_PUBLIC_API_BASE_URL` 配置。
5. 鉴权：登录后本地保存 token，请求带 `Authorization: Bearer <token>` 与 `X-User-Id`。

## 一、给 V0 的总提示词

请生成一个移动端优先的留学生轻社交社区 App UI，产品名为「留圈 UniLink」。目标用户是在韩国的中国留学生。整体风格年轻化、简约大气，参考 QQ 的轻社交体验：头像、昵称、状态、会话、未读数、圈子、打招呼都要有明显存在感。不要做营销落地页，不要做传统论坛，不要做厚重商务后台风。

技术要求：

1. 使用 React + TypeScript。
2. 使用 Tailwind CSS。
3. 使用 shadcn/ui 组件。
4. 使用 lucide-react 图标。
5. 生成移动端 App 壳，最大宽度 `max-w-md`，居中显示。
6. 底部固定 5 个 Tab：首页、社区、圈子、消息、我的。
7. 需要支持真实接口字段，先用 mock 数据占位，但组件字段必须能直接对接接口 DTO。
8. 页面不要写大段功能说明文案，直接做可用界面。

核心体验：

1. 首页第一屏展示当前用户状态、推荐用户、快捷场景入口。
2. 推荐用户卡片支持打招呼、跳过、查看详情。
3. 消息页像 QQ 会话列表，展示头像、昵称、最近消息、时间、未读数、在线状态、置顶。
4. 聊天页支持文本输入、快捷问候语、消息气泡、发送失败状态。
5. 社区页展示板块 Tab、搜索、帖子流、点赞/评论/收藏。
6. 圈子页展示我加入的圈子、热门圈子、圈子详情。
7. 我的页展示资料卡、认证状态、标签、收藏、设置入口。

## 二、UI 风格规范

### 2.1 视觉关键词

年轻、清爽、轻关系、校园感、即时消息感、简洁、有呼吸感。

### 2.2 参考 QQ 的点

1. 状态表达：在线、想聊天、找饭搭子、期末自救中。
2. 资料卡：大头像、昵称、学校、个性签名、标签。
3. 会话中心：置顶、未读数、最近一条消息、在线状态。
4. 轻互动：打招呼、点赞、评论、收藏。
5. 圈层归属：学校圈、兴趣圈、生活圈。

### 2.3 色彩

主色不要沿用当前偏绿色方案，改成清爽蓝白体系。

推荐色值：

1. 主蓝：`#2F80ED`
2. 浅蓝背景：`#EAF3FF`
3. 青绿色：`#20C997`
4. 活力黄：`#FFD166`
5. 页面背景：`#F6F8FB`
6. 卡片白：`#FFFFFF`
7. 主文字：`#1F2937`
8. 次文字：`#6B7280`
9. 分割线：`#E5E7EB`
10. 危险红：`#EF4444`

### 2.4 字体与排版

1. 字体使用系统无衬线，中文优先 `Noto Sans SC`。
2. 不使用负字距。
3. 页面标题 20-24px。
4. 卡片标题 15-17px。
5. 正文 13-15px。
6. 辅助信息 11-12px。
7. 文案要短，按钮不要超过 6 个汉字。

### 2.5 组件风格

1. 页面背景浅灰白，内容卡片白色。
2. 卡片圆角 12-16px，避免过度圆润。
3. 底部导航使用白色毛玻璃或纯白浮层，图标+短文字。
4. 主按钮蓝底白字，次按钮浅蓝底蓝字。
5. 标签使用浅色底，不同类型可用蓝、绿、黄、粉的低饱和版本。
6. 头像使用圆形，在线状态用小绿点。
7. 未读数使用红色小圆角徽标。
8. 页面不要出现大面积紫色渐变、装饰光斑、复杂背景图。

## 三、信息架构

### 3.1 底部导航

固定 5 个 Tab：

1. 首页：`home`
2. 社区：`community`
3. 圈子：`circle`
4. 消息：`message`
5. 我的：`profile`

导航图标建议：

1. 首页：`Home`
2. 社区：`Compass`
3. 圈子：`Users`
4. 消息：`MessageCircle`
5. 我的：`User`

### 3.2 页面清单

必须生成：

1. 登录/注册页。
2. 首页。
3. 推荐用户详情页。
4. 社区首页。
5. 帖子详情页。
6. 发帖弹窗或发帖页。
7. 圈子首页。
8. 圈子详情页。
9. 消息列表页。
10. 聊天详情页。
11. 我的页面。
12. 编辑资料弹窗或页面。
13. 学生认证卡片/入口。

可用弹窗完成：

1. 打招呼确认。
2. 选择状态。
3. 标签编辑。
4. 加入圈子。
5. 举报/拉黑。

## 四、页面生成要求

## 4.1 登录/注册页

### UI 目标
第一眼年轻、干净、可信，快速进入产品。

### 页面内容

1. App 名称：「留圈 UniLink」。
2. 标语：在韩国，找到同频的人。
3. 登录/注册分段切换。
4. 邮箱输入。
5. 密码输入。
6. 注册时显示昵称输入。
7. 主按钮：登录 / 创建账号。
8. 次按钮：使用演示账号进入。
9. 错误提示区域。

### 接口

`POST /auth/login`

请求：

```ts
{
  email: string
  password: string
}
```

`POST /auth/register`

请求：

```ts
{
  email: string
  password: string
  nickname: string
}
```

响应：

```ts
{
  token: string
  refreshToken: string
  userId: number
  nickname: string
}
```

## 4.2 首页

### UI 目标
像轻社交 App 的今日首页，而不是资讯首页。首屏必须看到“当前状态 + 推荐人 + 快捷入口”。

### 页面结构

1. 顶部栏：问候语、学校/位置、搜索图标、通知图标。
2. 当前状态卡：头像、昵称、当前状态、切换状态按钮。
3. 推荐用户横滑区：3-5 张用户卡。
4. 快捷场景宫格：饭搭子、找室友、兼职、攻略、避坑、二手。
5. 热门圈子横滑。
6. 热门攻略列表。

### 推荐用户卡字段

```ts
{
  id: number
  userId: number
  nickname: string
  school: string
  major: string
  languages: string[]
  tags: string[]
  matchReason: string
  matchScore: number
}
```

### 交互

1. 点击用户卡进入推荐详情。
2. 点击“打招呼”调用 `/matches/{id}/greet`。
3. 点击“跳过”调用 `/matches/{id}/skip`，卡片从列表消失。
4. 点击快捷入口进入对应社区主题或发现列表。

### 接口

`GET /matches/recommendations`

`POST /matches/{id}/greet`

请求：

```ts
{
  action: "GREET"
}
```

`POST /matches/{id}/skip`

请求：

```ts
{
  action: "SKIP"
}
```

`GET /articles`

返回文章列表字段：

```ts
{
  id: number
  category: string
  title: string
  summary: string
  updatedAt: string
  sourceName: string
}
```

## 4.3 推荐用户详情页

### UI 目标
做成 QQ 资料卡感觉：头像、昵称、状态、标签、匹配理由突出，底部固定操作。

### 页面内容

1. 返回按钮。
2. 大头像。
3. 昵称、在线状态。
4. 学校、专业、语言。
5. 当前状态。
6. 标签组。
7. 匹配理由卡片。
8. 自我介绍占位。
9. 底部按钮：打招呼、跳过、举报。

### 生成细节

1. 匹配理由用浅蓝卡片展示。
2. 打招呼是主按钮。
3. 跳过是次按钮。
4. 举报放在更多菜单，不要抢视觉重点。

## 4.4 社区首页

### UI 目标
年轻化校园动态流，信息密度高但不乱。

### 页面结构

1. 顶部搜索框。
2. 板块 Tab：推荐、新生、学习、租房、兼职、交友、避坑。
3. 发帖按钮，使用悬浮按钮或顶部图标按钮。
4. 帖子流卡片。

### 帖子卡字段

```ts
{
  id: number
  authorUserId: number | null
  authorName: string
  boardName: string
  title: string
  summary: string
  imageUrls: string[]
  likeCount: number
  commentCount: number
  favoriteCount: number
  createdAt: string
}
```

### 帖子卡 UI

1. 作者头像和昵称。
2. 板块标签。
3. 标题或摘要。
4. 图片九宫格最多展示 3 张。
5. 底部点赞、评论、收藏。
6. 时间。

### 接口

`GET /posts`

`GET /posts/discover/{theme}`

`GET /posts/{id}`

`POST /posts`

请求：

```ts
{
  boardId: number
  title?: string
  content: string
  imageUrls: string[]
  anonymous: boolean
}
```

`POST /posts/{id}/like`

```ts
{
  liked: boolean
}
```

`POST /posts/{id}/favorite`

```ts
{
  favorited: boolean
}
```

## 4.5 帖子详情页

### 页面内容

1. 返回按钮。
2. 作者信息。
3. 板块标签。
4. 标题。
5. 正文。
6. 图片展示。
7. 点赞、收藏、评论数。
8. 评论列表。
9. 底部评论输入框。

### 接口

`GET /posts/{id}`

返回：

```ts
{
  id: number
  authorUserId: number | null
  authorName: string
  boardName: string
  title: string
  content: string
  imageUrls: string[]
  anonymous: boolean
  likeCount: number
  commentCount: number
  favoriteCount: number
  createdAt: string
  comments: {
    id: number
    authorName: string
    content: string
    createdAt: string
  }[]
}
```

`POST /posts/{id}/comments`

```ts
{
  content: string
}
```

## 4.6 圈子首页

### UI 目标
像 QQ 群/兴趣圈入口，但更轻。突出“我加入的圈子”和“热门圈子”。

### 页面结构

1. 顶部标题：圈子。
2. 搜索框。
3. 我加入的圈子列表。
4. 热门圈子网格。
5. 创建圈子入口，弱化显示。

### 圈子字段

```ts
{
  id: number
  name: string
  icon: string
  members: number
  posts: number
  description: string
  tags: string[]
  hot: boolean
  joined: boolean
}
```

已加入圈子字段：

```ts
{
  id: number
  name: string
  icon: string
  members: number
  unread: number
  lastMessage: string
  lastTime: string
  isAdmin: boolean
}
```

### 接口

`GET /circles`

`GET /circles/joined`

`POST /circles`

```ts
{
  name: string
  icon?: string
  description: string
}
```

## 4.7 圈子详情页

### 页面内容

1. 圈子头图区域或浅色头部。
2. 圈子 icon、名称、成员数、帖子数。
3. 加入/退出按钮。
4. 公告卡片。
5. 圈子标签。
6. 动态列表。
7. 成员预览。
8. 圈内帖子列表。

### 接口

`GET /circles/{id}`

```ts
{
  id: number
  name: string
  icon: string
  members: number
  posts: number
  description: string
  tags: string[]
  hot: boolean
  joined: boolean
  isAdmin: boolean
  announcement: string
}
```

`GET /circles/{id}/activities`

`GET /circles/{id}/members`

`GET /circles/{id}/posts`

`POST /circles/{id}/join`

`POST /circles/{id}/leave`

## 4.8 消息列表页

### UI 目标
最像 QQ 的页面。列表要清晰，未读数要明显，置顶会话要靠前。

### 页面结构

1. 顶部标题：消息。
2. 搜索框。
3. 私聊/通知分段控件。
4. 会话列表。
5. 通知列表。

### 会话字段

```ts
{
  id: number
  participantUserId: number
  name: string
  avatarSeed: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  pinned: boolean
  status: string
  nickname: string
}
```

### 会话列表 UI

1. 左侧圆头像。
2. 头像右下角在线绿点。
3. 昵称优先展示备注昵称，没有备注展示 name。
4. 最近消息单行省略。
5. 时间右上角。
6. 未读数右侧红色徽标。
7. 置顶会话背景使用极浅蓝。

### 通知字段

```ts
{
  id: number
  type: string
  icon: string
  title: string
  content: string
  time: string
  read: boolean
}
```

### 接口

`GET /messages/conversations`

`GET /messages/notifications`

## 4.9 聊天详情页

### 页面内容

1. 顶部返回按钮、昵称、在线状态、更多按钮。
2. 消息气泡列表。
3. 对方消息左侧，自己消息右侧。
4. 自己消息使用主蓝，对方消息使用白色。
5. 快捷问候语横滑。
6. 底部输入框、表情按钮、发送按钮。

### 消息字段

```ts
{
  id: number
  content: string
  time: string
  isMine: boolean
}
```

会话详情字段：

```ts
{
  id: number
  participantUserId: number
  name: string
  avatarSeed: string
  online: boolean
  nickname: string
  messages: ChatMessageDto[]
}
```

### 接口

`GET /messages/conversations/{id}`

`POST /messages/direct`

```ts
{
  targetUserId: number
}
```

`POST /messages/conversations/{id}`

```ts
{
  content: string
}
```

## 4.10 我的页面

### UI 目标
像个人资料卡+设置中心。头像、昵称、学校、状态、认证要突出。

### 页面结构

1. 顶部资料卡。
2. 头像、昵称、学校专业。
3. 当前状态。
4. 认证状态。
5. 标签组。
6. 编辑资料按钮。
7. 我的帖子、我的收藏、我的圈子、学生认证、语言设置、退出登录。

### 用户资料字段

```ts
{
  id: number
  nickname: string
  school: string
  major: string
  languages: string[]
  bio: string
  tags: string[]
  status: string
}
```

### 接口

`GET /users/profile`

`PUT /users/profile`

```ts
{
  nickname: string
  school: string
  major: string
  languages: string[]
  bio: string
}
```

`GET /users/tags`

`GET /users/tag-options`

返回：

```ts
{
  interestTags: { id: number; name: string; type: string }[]
  sceneTags: { id: number; name: string; type: string }[]
  statusTags: { id: number; name: string; type: string }[]
}
```

`PUT /users/tags`

```ts
{
  tagIds: number[]
}
```

## 4.11 学生认证

### UI 要求
在我的页面中做认证卡片，也可以弹出认证提交页。

### 字段

```ts
{
  id: number
  verifyType: string
  fileUrl: string
  status: string
  rejectReason: string | null
}
```

状态展示：

1. `APPROVED`：认证已通过，绿色。
2. `PENDING`：认证审核中，黄色。
3. `REJECTED`：认证被驳回，红色。
4. 无记录：未认证，灰色。

### 接口

`GET /verifications/latest`

`POST /verifications`

```ts
{
  verifyType: string
  fileUrl: string
}
```

## 五、统一接口响应格式

所有接口外层响应：

```ts
{
  code?: number
  message?: string
  data: T
}
```

前端 UI 生成时可以先 mock `data`，但字段名必须和上面 DTO 一致。

请求 headers：

```ts
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>",
  "X-User-Id": "<userId>"
}
```

## 六、状态与空态

每个列表页必须考虑：

1. loading：骨架屏。
2. empty：简短空态，不写大段说明。
3. error：错误提示 + 重试按钮。
4. success：正常内容。

空态文案建议：

1. 推荐为空：今天暂时没有新推荐。
2. 消息为空：还没有聊天，去首页打个招呼吧。
3. 社区为空：还没有帖子，发第一条动态。
4. 圈子为空：先加入一个同校圈子。

## 七、V0 生成时不要做

1. 不要生成营销落地页。
2. 不要生成 PC 大屏后台布局。
3. 不要使用大量渐变光斑和装饰背景。
4. 不要把功能说明写成大段文字放在页面里。
5. 不要做音视频、支付、会员、群聊、复杂地图。
6. 不要使用随机字段名，接口字段必须匹配本文档。
7. 不要让底部导航遮挡聊天输入框或页面按钮。

## 八、推荐生成顺序

如果 V0 一次生成不了完整项目，按这个顺序分批生成：

1. App 壳 + 底部导航 + 全局主题。
2. 登录/注册页。
3. 首页 + 推荐用户卡片 + 状态卡。
4. 消息列表 + 聊天详情。
5. 社区首页 + 帖子详情 + 发帖弹窗。
6. 圈子首页 + 圈子详情。
7. 我的页面 + 编辑资料 + 学生认证。

## 九、当前项目可直接对接的前端类型名

如果生成代码要复用当前项目，可以直接使用这些类型名：

1. `AuthSession`
2. `MatchRecommendationDto`
3. `ArticleSummaryDto`
4. `ArticleDetailDto`
5. `UserProfileDto`
6. `TagOptionDto`
7. `TagCatalogDto`
8. `ConversationSummaryDto`
9. `ConversationDetailDto`
10. `ChatMessageDto`
11. `NotificationDto`
12. `CircleSummaryDto`
13. `JoinedCircleDto`
14. `CircleDetailDto`
15. `CircleActivityDto`
16. `CircleMemberDto`
17. `VerificationRecordDto`
18. `PostSummaryDto`
19. `PostDetailDto`
20. `PostCommentDto`
21. `PostReactionDto`

## 十、最终 UI 成品标准

生成出来的 UI 应该像一个已经可以试用的移动端轻社交 App：

1. 视觉清爽，有 QQ 式的状态、会话和关系链感觉。
2. 首页能一眼看出“找人、找圈子、找信息”。
3. 消息页有真实会话中心质感。
4. 社区页能浏览、互动、发帖。
5. 圈子页能建立学校和兴趣归属。
6. 我的页能管理资料、标签和认证。
7. 所有关键组件字段都能直接接入当前后端接口。
