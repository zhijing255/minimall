import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("开始播种数据...");

  // 清空现有数据
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // 创建用户（密码与 CLAUDE.md 文档一致）
  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);
  const vipPassword = await bcrypt.hash("vip123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "管理员",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "普通用户",
      email: "user@example.com",
      password: userPassword,
      role: "USER",
    },
  });

  const vipUser = await prisma.user.create({
    data: {
      name: "VIP 用户",
      email: "vip@example.com",
      password: vipPassword,
      role: "USER",
      vipLevel: 2,
      totalSpent: 15000,
    },
  });

  console.log("创建用户:", {
    admin: { id: admin.id, name: admin.name },
    user: { id: user.id, name: user.name },
    vipUser: { id: vipUser.id, name: vipUser.name },
  });

  // 创建分类
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "手机数码", slug: "phones", image: "https://via.placeholder.com/400x300/3498db/ffffff?text=手机数码" },
    }),
    prisma.category.create({
      data: { name: "电脑办公", slug: "computers", image: "https://via.placeholder.com/400x300/2ecc71/ffffff?text=电脑办公" },
    }),
    prisma.category.create({
      data: { name: "家用电器", slug: "appliances", image: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=家用电器" },
    }),
    prisma.category.create({
      data: { name: "服饰鞋包", slug: "clothing", image: "https://via.placeholder.com/400x300/9b59b6/ffffff?text=服饰鞋包" },
    }),
    prisma.category.create({
      data: { name: "食品生鲜", slug: "food", image: "https://via.placeholder.com/400x300/f39c12/ffffff?text=食品生鲜" },
    }),
    prisma.category.create({
      data: { name: "图书文具", slug: "books", image: "https://via.placeholder.com/400x300/1abc9c/ffffff?text=图书文具" },
    }),
  ]);

  console.log("创建分类:", categories);

  // 创建商品
  const products = await Promise.all([
    // 手机数码
    prisma.product.create({
      data: {
        name: "iPhone 15 Pro",
        description: "苹果最新旗舰手机，A17 Pro 芯片，钛金属设计，4800 万像素主摄",
        price: 8999,
        stock: 100,
        images: JSON.stringify(["https://via.placeholder.com/400x400/3498db/ffffff?text=iPhone+15+Pro"]),
        featured: true,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "小米 14",
        description: "骁龙 8 Gen 3，徕卡光学镜头，1.5K 中国屏",
        price: 3999,
        stock: 200,
        images: JSON.stringify(["https://via.placeholder.com/400x400/e74c3c/ffffff?text=小米14"]),
        featured: true,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "华为 Mate 60 Pro",
        description: "麒麟 9000S，卫星通话，昆仑玻璃",
        price: 6999,
        stock: 150,
        images: JSON.stringify(["https://via.placeholder.com/400x400/2ecc71/ffffff?text=华为Mate60"]),
        featured: true,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "AirPods Pro 2",
        description: "主动降噪，自适应音频，USB-C 充电",
        price: 1899,
        stock: 300,
        images: JSON.stringify(["https://via.placeholder.com/400x400/9b59b6/ffffff?text=AirPods+Pro"]),
        featured: false,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "三星 Galaxy S24 Ultra",
        description: "骁龙 8 Gen 3，2 亿像素，S Pen",
        price: 9999,
        stock: 80,
        images: JSON.stringify(["https://via.placeholder.com/400x400/f39c12/ffffff?text=三星S24"]),
        featured: false,
        categoryId: categories[0].id,
      },
    }),

    // 电脑办公
    prisma.product.create({
      data: {
        name: "MacBook Pro 14",
        description: "M3 Pro 芯片，14 英寸 Liquid Retina XDR 显示屏",
        price: 14999,
        stock: 50,
        images: JSON.stringify(["https://via.placeholder.com/400x400/1abc9c/ffffff?text=MacBook+Pro"]),
        featured: true,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "戴尔 XPS 15",
        description: "15.6 英寸 OLED 屏，i9 处理器，32GB 内存",
        price: 12999,
        stock: 30,
        images: JSON.stringify(["https://via.placeholder.com/400x400/e74c3c/ffffff?text=戴尔XPS"]),
        featured: false,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "ThinkPad X1 Carbon",
        description: "14 英寸 2.8K OLED，Intel Ultra 7，商务轻薄本",
        price: 9999,
        stock: 60,
        images: JSON.stringify(["https://via.placeholder.com/400x400/34495e/ffffff?text=ThinkPad"]),
        featured: false,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "罗技 MX Master 3S",
        description: "无线办公鼠标，静音点击，8000 DPI",
        price: 799,
        stock: 500,
        images: JSON.stringify(["https://via.placeholder.com/400x400/2ecc71/ffffff?text=罗技鼠标"]),
        featured: false,
        categoryId: categories[1].id,
      },
    }),

    // 家用电器
    prisma.product.create({
      data: {
        name: "戴森 V15 吸尘器",
        description: "激光检测灰尘，60 分钟续航，智能吸力调节",
        price: 4990,
        stock: 100,
        images: JSON.stringify(["https://via.placeholder.com/400x400/9b59b6/ffffff?text=戴森吸尘器"]),
        featured: true,
        categoryId: categories[2].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "索尼 WH-1000XM5",
        description: "头戴式降噪耳机，30 小时续航，LDAC 高解析度",
        price: 2499,
        stock: 200,
        images: JSON.stringify(["https://via.placeholder.com/400x400/f39c12/ffffff?text=索尼耳机"]),
        featured: false,
        categoryId: categories[2].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "小米扫地机器人 X20 Pro",
        description: "自动集尘， LDS 激光导航，5000Pa 大吸力",
        price: 2999,
        stock: 150,
        images: JSON.stringify(["https://via.placeholder.com/400x400/1abc9c/ffffff?text=扫地机器人"]),
        featured: false,
        categoryId: categories[2].id,
      },
    }),

    // 服饰鞋包
    prisma.product.create({
      data: {
        name: "Nike Air Max 270",
        description: "经典气垫跑鞋，舒适缓震，多色可选",
        price: 899,
        stock: 500,
        images: JSON.stringify(["https://via.placeholder.com/400x400/e74c3c/ffffff?text=Nike+Air"]),
        featured: true,
        categoryId: categories[3].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "优衣库羽绒服",
        description: "轻薄保暖，90% 白鸭绒，可收纳设计",
        price: 499,
        stock: 800,
        images: JSON.stringify(["https://via.placeholder.com/400x400/3498db/ffffff?text=优衣库羽绒服"]),
        featured: false,
        categoryId: categories[3].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Coach 经典托特包",
        description: "真皮材质，大容量，商务休闲两用",
        price: 2999,
        stock: 100,
        images: JSON.stringify(["https://via.placeholder.com/400x400/9b59b6/ffffff?text=Coach包"]),
        featured: false,
        categoryId: categories[3].id,
      },
    }),

    // 食品生鲜
    prisma.product.create({
      data: {
        name: "三顿半咖啡",
        description: "超即溶冷萃咖啡，12 颗装，3 种烘焙度",
        price: 189,
        stock: 1000,
        images: JSON.stringify(["https://via.placeholder.com/400x400/f39c12/ffffff?text=三顿半咖啡"]),
        featured: false,
        categoryId: categories[4].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "智利车厘子 5kg",
        description: "JJ 级大果，甜度高，新鲜直邮",
        price: 299,
        stock: 200,
        images: JSON.stringify(["https://via.placeholder.com/400x400/e74c3c/ffffff?text=车厘子"]),
        featured: true,
        categoryId: categories[4].id,
      },
    }),

    // 图书文具
    prisma.product.create({
      data: {
        name: "《深入理解 TypeScript》",
        description: "TypeScript 高级编程，从基础到实战",
        price: 89,
        stock: 500,
        images: JSON.stringify(["https://via.placeholder.com/400x400/2ecc71/ffffff?text=TypeScript书"]),
        featured: false,
        categoryId: categories[5].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "LAMY 钢笔",
        description: "德国品牌，狩猎系列，0.5mm 笔尖",
        price: 199,
        stock: 300,
        images: JSON.stringify(["https://via.placeholder.com/400x400/1abc9c/ffffff?text=LAMY钢笔"]),
        featured: false,
        categoryId: categories[5].id,
      },
    }),
  ]);

  console.log(`创建 ${products.length} 个商品`);

  console.log("播种完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
