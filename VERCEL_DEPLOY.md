# Vercel 部署指南

## 前提条件
- GitHub 账号
- Vercel 账号（可用 GitHub 登录）
- 数据库（推荐 Vercel Postgres 或 Neon）

---

## 步骤 1：迁移到 PostgreSQL

SQLite 无法在 Vercel Serverless 环境运行，需要迁移到云数据库。

### 方案 A：使用 Neon（推荐，免费 512MB）

1. 访问 [neon.tech](https://neon.tech) 注册账号
2. 创建项目，获取连接字符串
3. 连接字符串格式：`postgresql://user:password@host/database?sslmode=require`

### 方案 B：使用 Vercel Postgres

1. 在 Vercel 项目中创建 Postgres 数据库
2. 自动配置环境变量

---

## 步骤 2：修改 Prisma 配置

### 2.1 修改 `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2.2 修改 `src/lib/prisma.ts`（如需要）

确保 Prisma Client 在 Serverless 环境中正确初始化：

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## 步骤 3：配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```env
# 数据库
DATABASE_URL="postgresql://..."

# JWT 密钥（生成方式：openssl rand -base64 32）
JWT_SECRET="your-secret-key"

# NextAuth（如果使用 OAuth）
NEXTAUTH_URL="https://your-project.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret"
```

---

## 步骤 4：部署到 Vercel

### 方式一：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 部署到生产环境
vercel --prod
```

### 方式二：通过 GitHub 集成（推荐）

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 点击 "New Project"
4. 导入 GitHub 仓库
5. Vercel 会自动检测 Next.js 并配置构建设置
6. 点击 "Deploy"

---

## 步骤 5：运行数据库迁移

部署成功后，需要运行数据库迁移：

```bash
# 本地运行（连接生产数据库）
npx prisma migrate deploy

# 或通过 Vercel 的 Build Command
# 在 package.json 中修改 build 脚本：
"build": "prisma generate && prisma migrate deploy && next build"
```

---

## 步骤 6：初始化数据

连接生产数据库运行 seed 脚本：

```bash
# 设置环境变量指向生产数据库
export DATABASE_URL="your-production-db-url"

# 运行 seed
npx prisma db seed
```

---

## 常见问题

### Q: 部署后图片无法加载？
A: 检查 `next.config.ts` 中的 `remotePatterns` 配置，确保允许了需要的图片域名。

### Q: 数据库连接失败？
A: 确保 `DATABASE_URL` 环境变量正确配置，且数据库允许外部连接。

### Q: 如何查看部署日志？
A: 在 Vercel Dashboard → 项目 → Deployments → 点击具体部署 → View Function Logs

### Q: 如何设置自定义域名？
A: Vercel Dashboard → 项目 → Settings → Domains → 添加域名

---

## 推荐的 `package.json` build 脚本

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

---

## 安全检查清单

- [ ] `JWT_SECRET` 已设置为强随机字符串
- [ ] 数据库连接使用 SSL
- [ ] 不再使用 SQLite（已迁移到 PostgreSQL）
- [ ] `.env` 文件未提交到 Git
- [ ] 生产环境 `NODE_ENV=production`
