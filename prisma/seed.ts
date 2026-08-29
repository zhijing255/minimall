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

  // 创建用户
  const password = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "管理员",
      email: "admin@example.com",
      password: password,
      role: "ADMIN",
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "普通用户",
      email: "user@example.com",
      password: password,
      role: "USER",
    },
  });

  const vipUser = await prisma.user.create({
    data: {
      name: "VIP 用户",
      email: "vip@example.com",
      password: password,
      role: "USER",
      vipLevel: 2,
      totalSpent: 15000,
    },
  });

  console.log("创建用户:", { admin, user, vipUser });

  // 创建分类
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "手机数码", slug: "phones" },
    }),
    prisma.category.create({
      data: { name: "电脑办公", slug: "computers" },
    }),
    prisma.category.create({
      data: { name: "家用电器", slug: "appliances" },
    }),
  ]);

  console.log("创建分类:", categories);

  // 创建商品
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "iPhone 15 Pro",
        description: "苹果最新旗舰手机，A17 Pro 芯片，钛金属设计",
        price: 8999,
        stock: 100,
        images: JSON.stringify(["/images/iphone15.jpg"]),
        featured: true,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "MacBook Pro 14",
        description: "M3 Pro 芯片，14 英寸 Liquid Retina XDR 显示屏",
        price: 14999,
        stock: 50,
        images: JSON.stringify(["/images/macbook.jpg"]),
        featured: true,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "小米 14",
        description: "骁龙 8 Gen 3，徕卡光学镜头",
        price: 3999,
        stock: 200,
        images: JSON.stringify(["/images/xiaomi14.jpg"]),
        featured: true,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "戴尔 XPS 15",
        description: "15.6 英寸 OLED 屏，i9 处理器",
        price: 12999,
        stock: 30,
        images: JSON.stringify(["/images/dell-xps.jpg"]),
        featured: false,
        categoryId: categories[1].id,
      },
    }),
  ]);

  console.log("创建商品:", products);

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
