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

## 项目启动
前端: 
```
corepack pnpm build
corepack pnpm start --hostname 127.0.0.1 --port 3002
```
后端:
```
GRADLE_USER_HOME=/tmp/pupu-gradle ./gradlew bootRun --args="--spring.profiles.active=mysql --server.port=8082"
```
