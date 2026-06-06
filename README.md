# 留学生社区平台

本项目是面向留学生的社区与社交平台。当前一切前端开发、对接和验收均以 `new_fronted` 为准。

## 目录结构

```text
backend/        Kotlin + Spring Boot 后端服务
new_fronted/    当前唯一基准前端，Vite + React + TypeScript
database/       MySQL 建表脚本
doc/            策划案与对接文档
frontend/       历史前端目录，当前不作为对接基准
adminFrontend/  历史管理端原型，当前不作为对接基准
```

## 当前实现范围

当前后端已包含账号登录、用户资料、学生认证、匹配推荐、社区帖子、圈子、消息会话、攻略文章等模块。`new_fronted` 已开始接入后端接口，消息、联系人、用户资料和部分圈子数据已从接口读取，其余页面仍保留部分 mock 数据。

## 项目启动

### 1. 启动后端

默认配置连接本地 MySQL 数据库 `student_community`：

```bash
cd backend
./gradlew bootRun
```

如需启用真实邮箱验证码，请先配置 SMTP 环境变量后再启动后端：

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

`new_fronted/vite.config.ts` 已配置代理，前端请求 `/api/*` 会转发到：

```text
http://localhost:8080
```

### 3. 构建前端

```bash
cd new_fronted
npm run build
```

构建产物位于：

```text
new_fronted/dist/
```

## 本地登录说明

`new_fronted` 启动后默认进入登录页，需要手动登录。

当前可用于本地联调的测试账号：

```text
demo@student.app / 123456
```

如需测试其他账号，可直接在登录页输入对应邮箱和密码。

认证相关验证码场景已经复用到 3 条链路：

- 注册：`POST /api/v1/auth/send-code` with `scene=REGISTER`，随后 `POST /api/v1/auth/register`
- 验证码登录：`POST /api/v1/auth/send-code` with `scene=LOGIN`，随后 `POST /api/v1/auth/login/code`
- 重置密码：`POST /api/v1/auth/send-code` with `scene=RESET_PASSWORD`，随后 `POST /api/v1/auth/reset-password`

## 注意事项

- 一切前端工作以 `new_fronted` 为准。
- 后端默认端口是 `8080`，前端开发服务器默认端口是 `5173`。
- 前端接口基础路径默认是 `/api/v1`。
- `frontend` 和 `adminFrontend` 仍在仓库中，但当前不作为实现、对接或验收基准。
