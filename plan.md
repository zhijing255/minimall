# Mini Mall 电商项目实现计划

## Context
在 d:\AICoding\minimall 创建一个微型电商项目，技术栈：Next.js 16 + TypeScript + Prisma 5 + SQLite + TailwindCSS 4。

## 技术决策
- **项目目录**: d:\AICoding\minimall（当前目录直接初始化）
- **认证方案**: NextAuth.js v5（支持 Credentials + GitHub 登录）
- **后台布局**: /admin 路由下独立布局

---

## Phase 1: 项目初始化与基础架构

### 1.1 初始化 Next.js 项目
```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
```

### 1.2 安装核心依赖
```bash
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter
npm install bcryptjs jsonwebtoken zod
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### 1.3 初始化 Prisma
```bash
npx prisma init --datasource-provider sqlite
```

### 1.4 项目目录结构
```
src/
├── app/
│   ├── (shop)/              # 前台商店布局组
│   │   ├── layout.tsx       # 商店通用布局（Header + Footer）
│   │   ├── page.tsx         # 首页（商品列表）
│   │   ├── product/
│   │   │   └── [id]/
│   │   │       └── page.tsx # 商品详情
│   │   ├── cart/
│   │   │   └── page.tsx     # 购物车
│   │   ├── checkout/
│   │   │   └── page.tsx     # 结算页
│   │   ├── orders/
│   │   │   └── page.tsx     # 我的订单
│   │   └── category/
│   │       └── [slug]/
│   │           └── page.tsx # 分类页
│   ├── (auth)/              # 认证布局组
│   │   ├── layout.tsx       # 认证页面布局
│   │   ├── login/
│   │   │   └── page.tsx     # 登录
│   │   └── register/
│   │       └── page.tsx     # 注册
│   ├── admin/               # 后台管理（独立布局）
│   │   ├── layout.tsx       # 后台布局（侧边栏）
│   │   ├── page.tsx         # 后台首页/仪表盘
│   │   ├── products/
│   │   │   ├── page.tsx     # 商品列表
│   │   │   ├── new/
│   │   │   │   └── page.tsx # 新增商品
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx # 编辑商品
│   │   ├── orders/
│   │   │   └── page.tsx     # 订单管理
│   │   └── categories/
│   │       └── page.tsx     # 分类管理
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts # NextAuth 路由
│   │   ├── products/
│   │   │   └── route.ts     # 商品 API
│   │   ├── cart/
│   │   │   └── route.ts     # 购物车 API
│   │   ├── orders/
│   │   │   └── route.ts     # 订单 API
│   │   └── categories/
│   │       └── route.ts     # 分类 API
│   ├── layout.tsx           # 根布局
│   └── globals.css          # 全局样式
├── components/
│   ├── ui/                  # 通用 UI 组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Loading.tsx
│   ├── shop/                # 商店组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── SearchBar.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── CartIcon.tsx
│   │   └── VipBadge.tsx    # VIP 等级徽章组件
│   └── admin/               # 后台组件
│       ├── Sidebar.tsx
│       ├── ProductForm.tsx
│       ├── OrderTable.tsx
│       └── CategoryForm.tsx
├── lib/
│   ├── prisma.ts            # Prisma 客户端单例
│   ├── auth.ts              # NextAuth 配置
│   ├── utils.ts             # 工具函数
│   ├── vip.ts               # VIP 等级计算、折扣率查询
│   └── validations.ts       # Zod 验证 schema
├── hooks/
│   ├── useCart.ts           # 购物车 hook
│   └── useSearch.ts         # 搜索 hook
└── types/
    └── index.ts             # 类型定义
```

---

## Phase 2: 数据库设计 (Prisma Schema)

### prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// 用户
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  password      String?
  role          String    @default("USER") // USER | ADMIN
  image         String?
  vipLevel      Int       @default(0) // 0=普通用户, 1=VIP1, 2=VIP2, 3=VIP3
  totalSpent    Float     @default(0) // 累计消费金额（仅已完成订单）
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
  orders   Order[]
  cart     CartItem[]
}

// VIP 等级规则常量（代码中使用）
// VIP1: 累计消费 ≥ 5000 元, 9.8 折 (0.98)
// VIP2: 累计消费 ≥ 10000 元, 9.5 折 (0.95)
// VIP3: 累计消费 ≥ 80000 元, 9 折 (0.90)

// NextAuth 相关
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// 商品分类
model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  image     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  products Product[]
}

// 商品
model Product {
  id          String   @id @default(cuid())
  name        String
  description String
  price       Float
  stock       Int      @default(0)
  images      String   // JSON 数组字符串
  featured    Boolean  @default(false)
  active      Boolean  @default(true)
  categoryId  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category Category  @relation(fields: [categoryId], references: [id])
  cartItems CartItem[]
  orderItems OrderItem[]

  @@index([categoryId])
  @@index([featured])
}

// 购物车项
model CartItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  quantity  Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
}

// 订单
model Order {
  id            String      @id @default(cuid())
  userId        String
  originalTotal Float       // 原始总价（折扣前）
  vipDiscount   Float       @default(1) // VIP 折扣率 (1=无折扣, 0.98=98折, 0.95=95折, 0.9=9折)
  total         Float       // 实际支付金额（折扣后）
  status        String      @default("PENDING") // PENDING | PAID | SHIPPED | COMPLETED | CANCELLED
  address       String
  phone         String
  recipientName String
  note          String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user  User        @relation(fields: [userId], references: [id])
  items OrderItem[]

  @@index([userId])
  @@index([status])
}

// 订单项
model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Float  // 下单时的价格

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
}
```

---

## Phase 3: 核心功能实现顺序

### 3.1 认证系统（第1-2天）
1. 配置 NextAuth.js（Credentials Provider + Prisma Adapter）
2. 注册页面（表单验证、密码加密）
3. 登录页面
4. Session 管理和中间件保护路由

### 3.2 商品模块（第3-4天）
1. Prisma Client 单例
2. 商品 API（CRUD + 搜索 + 分页）
3. 首页商品列表（带搜索和分类筛选）
4. 商品详情页
5. Seed 脚本填充测试数据

### 3.3 购物车（第5天）
1. 购物车 API（添加、删除、更新数量、获取）
2. 购物车页面
3. Header 购物车图标和数量徽章

### 3.4 订单系统 + VIP 会员（第6天）
1. 结算页面（填写收货信息、显示 VIP 折扣信息）
2. 创建订单 API：
   - 库存校验、清空购物车
   - 计算原始总价 originalTotal
   - 根据用户 vipLevel 计算折扣 vipDiscount
   - 计算实际支付金额 total = originalTotal * vipDiscount
3. 订单支付完成后（状态变为 COMPLETED）：
   - 更新用户 totalSpent += total
   - 检查是否满足 VIP 升级条件并自动升级
4. 订单列表页（显示原价、折扣、实付金额）
5. 订单详情页
6. 模拟支付（点击"支付"按钮直接变更状态为 PAID → COMPLETED）

**VIP 升级规则：**
| 等级 | 累计消费门槛 | 折扣率 |
|------|-------------|--------|
| 普通用户 | < 5000 | 无折扣 (1.0) |
| VIP1 | ≥ 5000 | 9.8 折 (0.98) |
| VIP2 | ≥ 10000 | 9.5 折 (0.95) |
| VIP3 | ≥ 80000 | 9 折 (0.90) |

### 3.5 后台管理（第7-8天）
1. 后台布局（侧边栏导航）
2. 商品管理（列表、新增、编辑、上下架）
3. 订单管理（列表、状态变更）
4. 分类管理（CRUD）
5. 管理员权限中间件

---

## Phase 4: UI/UX 设计要点

### 颜色方案
- 主色: Indigo-600 (#4F46E5)
- 背景: White/Gray-50
- 文本: Gray-900/Gray-600
- 强调: Amber-500 (促销)
- VIP1 徽章: Yellow-500 (#EAB308) - 金色
- VIP2 徽章: Gray-300 (#D1D5DB) - 银色
- VIP3 徽章: Amber-600 (#D97706) - 铂金/琥珀色

### 关键页面布局
- **首页**: 顶部导航（含用户VIP徽章）+ 分类横栏 + 搜索框 + 商品网格（4列）+ 底部
- **商品详情**: 图片轮播 + 价格信息（原价 + VIP折后价）+ 加入购物车按钮 + 商品描述
- **购物车**: 商品列表 + 数量调整 + 价格汇总（显示VIP折扣）+ 结算按钮
- **订单列表**: 订单卡片显示原价、折扣率、实付金额
- **后台**: 左侧固定侧边栏 + 右侧内容区

---

## Phase 5: 测试数据 Seed

创建 `prisma/seed.ts`：
- 6 个分类（数码、服饰、家居、食品、图书、运动）
- 20+ 商品（含图片URL、价格、库存）
- 1 个管理员账号 (admin@example.com / admin123)
- 1 个测试用户 (user@example.com / user123)
- 1 个 VIP 测试用户 (vip@example.com / vip123, totalSpent: 12000, vipLevel: 2)

---

## 执行顺序

1. ✅ 初始化 Next.js 项目
2. ✅ 安装依赖 + Prisma 初始化
3. ✅ 编写 Schema + 迁移
4. ✅ 配置 NextAuth + Prisma Client
5. ✅ 实现认证页面（登录/注册）
6. ✅ 实现商品 API + 页面
7. ✅ 实现购物车
8. ✅ 实现订单系统
9. ✅ 实现后台管理
10. ✅ Seed 数据 + 最终测试

## 验证方式
- `npm run dev` 启动开发服务器
- 访问 http://localhost:3000 测试前台功能
- 访问 http://localhost:3000/admin 测试后台功能
- 测试完整流程：注册 → 浏览商品 → 加购物车 → 下单 → 模拟支付
