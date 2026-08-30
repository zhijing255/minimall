# Vercel 部署指南（使用 Vercel Postgres）

## 前提条件
- GitHub 账号
- Vercel 账号（可用 GitHub 登录）

---

## 步骤 1：创建 Vercel Postgres 数据库

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目（或先导入 GitHub 仓库创建项目）
3. 点击 **Storage** 标签
4. 点击 **Create Database** → 选择 **Postgres**
5. 选择区域（推荐 `Hong Kong` 或 `Singapore`）
6. 输入数据库名称（如 `minimall-db`）
7. 点击 **Create**

创建完成后，Vercel 会自动注入以下环境变量：
- `POSTGRES_PRISMA_URL` - 用于 Prisma Client 连接
- `POSTGRES_URL_NON_POOLING` - 用于 Prisma Migrate

---

## 步骤 2：Prisma 配置已更新

`prisma/schema.prisma` 已修改为 PostgreSQL：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // 用于 prisma migrate
}
```

在 Vercel 项目设置中添加环境变量映射：
- `DATABASE_URL` = `POSTGRES_PRISMA_URL`
- `DIRECT_URL` = `POSTGRES_URL_NON_POOLING`

---

## 步骤 3：配置其他环境变量

在 Vercel 项目设置中添加：

```env
# JWT 密钥（生成方式：openssl rand -base64 32）
JWT_SECRET="your-jwt-secret"

# NextAuth（如果使用 OAuth 登录）
NEXTAUTH_URL="https://your-project.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret"
```

---

## 步骤 4：部署到 Vercel

### 方式一：通过 GitHub 集成（推荐）

1. 将代码推送到 GitHub
2. 在 Vercel Dashboard 点击 **Deployments** → **Redeploy**
3. 或者重新导入 GitHub 仓库自动部署

### 方式二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署到生产环境
vercel --prod
```

---

## 步骤 5：运行数据库迁移

部署后需要创建数据库表结构：

### 方法一：通过 Vercel Dashboard

1. 进入项目 → **Settings** → **General**
2. 找到 **Build & Development Settings**
3. 修改 **Build Command** 为：
   ```
   prisma generate && prisma migrate deploy && next build
   ```

### 方法二：通过 Vercel CLI

```bash
# 拉取环境变量到本地
vercel env pull .env.production.local

# 运行迁移
npx prisma migrate deploy
```

---

## 步骤 6：初始化数据

数据库表创建后，运行 seed 脚本填充测试数据：

```bash
# 使用本地 CLI 连接生产数据库
vercel env pull .env.production.local
npx prisma db seed
```

或在 Vercel Dashboard 的 **Functions** 标签中查看日志确认部署状态。

---

## 常见问题

### Q: 部署后图片无法加载？
A: 检查 `next.config.ts` 中的 `remotePatterns` 配置，确保允许了需要的图片域名。

### Q: 数据库连接失败？
A: 确保在 Vercel 项目设置中正确映射了环境变量：
- `DATABASE_URL` → `POSTGRES_PRISMA_URL`
- `DIRECT_URL` → `POSTGRES_URL_NON_POOLING`

### Q: 如何查看部署日志？
A: Vercel Dashboard → 项目 → Deployments → 点击具体部署 → View Function Logs

### Q: 如何设置自定义域名？
A: Vercel Dashboard → 项目 → Settings → Domains → 添加域名

### Q: Prisma 迁移失败？
A: 确保 `DIRECT_URL` 环境变量已配置，Prisma Migrate 需要直接连接（非池化）

---

## 本地开发配置

创建 `.env` 文件用于本地开发：

```env
# 本地开发可以继续使用 SQLite
DATABASE_URL="file:./dev.db"

# 或连接远程数据库进行调试
# DATABASE_URL="postgresql://..."
# DIRECT_URL="postgresql://..."

JWT_SECRET="dev-secret-key"
```

---

## 安全检查清单

- [x] Prisma 已配置为 PostgreSQL
- [x] `.env.example` 已创建
- [ ] Vercel Postgres 数据库已创建
- [ ] 环境变量已映射（DATABASE_URL, DIRECT_URL）
- [ ] `JWT_SECRET` 已设置为强随机字符串
- [ ] `.env` 文件未提交到 Git（已在 .gitignore 中）
