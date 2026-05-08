# 留学生社区平台

本项目根据现有策划案启动实现，当前仓库包含三个核心部分：

1. `frontend`：Flutter 移动端，统一支持 Android 与 iOS
2. `backend`：Kotlin + Spring Boot 服务端
3. `database`：MySQL 建表与初始化脚本

## 当前实现范围

当前版本已完成 MVP 基础工程骨架与核心模块结构，覆盖：

1. 账号与资料模块基础结构
2. 匹配推荐模块接口骨架
3. 社区与信息中心接口骨架
4. MySQL 初版表结构
5. Flutter 前端页面、路由与导航骨架

## 目录结构

```text
frontend/
backend/
database/
doc/
```

## 下一步建议

1. 安装 Flutter SDK 后执行前端依赖安装与真机调试
2. 在 `backend` 中执行 `./gradlew bootRun` 启动默认开发环境服务
3. 如需切换到 MySQL，执行 `./gradlew bootRun --args='--spring.profiles.active=mysql'`
4. 按 `database/schema.sql` 初始化 MySQL
5. 继续完成真实鉴权、持久化、WebSocket 聊天与后台管理端
