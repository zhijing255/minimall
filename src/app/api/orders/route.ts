import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseImages, formatPrice } from "@/lib/utils";

// 从购物车创建订单 POST /api/orders
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { address, phone, recipientName, note } = await request.json();

    // 验证必填字段
    if (!address || !phone || !recipientName) {
      return NextResponse.json(
        { error: "请填写收货地址、电话和收货人姓名" },
        { status: 400 }
      );
    }

    // 获取购物车商品
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "购物车为空" }, { status: 400 });
    }

    // 检查库存并计算价格
    const orderItems: Array<{
      productId: string;
      quantity: number;
      price: number;
    }> = [];
    let originalTotal = 0;
    const outOfStock: Array<{ name: string; requested: number; available: number }> = [];

    for (const item of cartItems) {
      if (!item.product.active) {
        outOfStock.push({
          name: item.product.name,
          requested: item.quantity,
          available: 0,
        });
        continue;
      }

      if (item.product.stock < item.quantity) {
        outOfStock.push({
          name: item.product.name,
          requested: item.quantity,
          available: item.product.stock,
        });
        continue;
      }

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      });
      originalTotal += item.product.price * item.quantity;
    }

    // 如果有缺货商品，返回错误
    if (outOfStock.length > 0) {
      const message = outOfStock
        .map((item) => {
          if (item.available === 0) {
            return `「${item.name}」已售罄`;
          }
          return `「${item.name}」库存不足（需要 ${item.requested} 件，仅剩 ${item.available} 件）`;
        })
        .join("；");
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // 获取用户 VIP 等级计算折扣
    const vipDiscount = getVipDiscount(user.vipLevel);
    const total = Math.round(originalTotal * vipDiscount * 100) / 100;

    // 使用事务创建订单
    const order = await prisma.$transaction(async (tx) => {
      // 1. 创建订单
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          originalTotal,
          vipDiscount,
          total,
          status: "PENDING",
          address,
          phone,
          recipientName,
          note: note || null,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
        },
      });

      // 2. 扣减库存
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 3. 清空购物车
      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      });

      return newOrder;
    });

    // 解析图片
    const result = {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          images: parseImages(item.product.images),
        },
      })),
    };

    return NextResponse.json({ order: result }, { status: 201 });
  } catch (error) {
    console.error("创建订单错误:", error);
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
  }
}

// 获取订单列表 GET /api/orders
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 解析图片
    const result = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          images: parseImages(item.product.images),
        },
      })),
    }));

    return NextResponse.json({ orders: result });
  } catch (error) {
    console.error("获取订单列表错误:", error);
    return NextResponse.json({ error: "获取订单列表失败" }, { status: 500 });
  }
}

// VIP 折扣计算
function getVipDiscount(vipLevel: number): number {
  switch (vipLevel) {
    case 3:
      return 0.9; // VIP3: 9折
    case 2:
      return 0.95; // VIP2: 95折
    case 1:
      return 0.98; // VIP1: 98折
    default:
      return 1; // 普通用户无折扣
  }
}
