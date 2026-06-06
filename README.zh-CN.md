# 留学生社区平台

[한국어 README](./README.md)

本项目是面向留学生的社区与社交平台。当前前端开发、接口对接、测试与验收统一以 `new_fronted` 目录为准。

## 目录结构

```text
backend/        Kotlin + Spring Boot 后端服务
new_fronted/    当前唯一基准前端，Vite + React + TypeScript
database/       MySQL 建表脚本
doc/            策划文档与协作文档
frontend/       历史前端目录，当前不作为基准
```

## 当前实现范围

后端目前已包含登录、用户资料、学生认证、匹配推荐、社区帖子、圈子、消息会话、攻略/指南等模块。  
`new_fronted` 已接入部分后端接口，消息、联系人、用户资料以及部分圈子数据已从实际 API 读取，其余部分页面仍保留一定的 mock 数据。

## 启动方式

### 1. 启动后端

默认配置连接本地 MySQL 数据库 `student_community`。

```bash
cd backend
./gradlew bootRun
```

如果需要启用真实邮箱验证码，请先配置 SMTP 环境变量，再启动后端。

```bash
export MAIL_HOST=smtp.qq.com
export MAIL_PORT=587
export MAIL_USERNAME=your_account@qq.com
export MAIL_PASSWORD=your_smtp_auth_code
export MAIL_FROM=your_account@qq.com
```

后端默认地址：

```text
http://localhost:8080
```

Swagger 地址：

```text
http://localhost:8080/swagger-ui.html
```

### 2. 启动前端 `new_fronted`

```bash
cd new_fronted
npm install
npm run dev
```

Vite 默认地址：

```text
http://localhost:5173
```

`new_fronted/vite.config.ts` 已配置代理，因此 `/api/*` 请求会转发到以下后端地址：

```text
http://localhost:8080
```

### 3. 构建前端

```bash
cd new_fronted
npm run build
```

构建产物输出目录：

```text
new_fronted/dist/
```

## 本地登录说明

`new_fronted` 启动后默认会进入登录页。

当前可用于本地联调的测试账号：

```text
demo@student.app / 123456
```

如果需要测试其他账号，可直接在登录页面输入对应邮箱和密码。

验证码逻辑目前复用在以下 3 条链路中：

- 注册：`POST /api/v1/auth/send-code` with `scene=REGISTER`，随后 `POST /api/v1/auth/register`
- 验证码登录：`POST /api/v1/auth/send-code` with `scene=LOGIN`，随后 `POST /api/v1/auth/login/code`
- 重置密码：`POST /api/v1/auth/send-code` with `scene=RESET_PASSWORD`，随后 `POST /api/v1/auth/reset-password`

## 注意事项

- 当前前端开发基准目录是 `new_fronted`。
- 后端默认端口为 `8080`，前端开发服务器默认端口为 `5173`。
- 前端接口基础路径默认为 `/api/v1`。
- `frontend` 仍保留在仓库内，但当前不是实现、联调或验收基准。
- `new_fronted/dist/`、`new_fronted/mobile-builds/`、`backend/bin/`、`backend/uploads/` 属于构建产物或运行时文件，已从 Git 跟踪中排除。
