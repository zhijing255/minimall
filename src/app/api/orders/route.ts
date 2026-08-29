import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseImages, parsePage } from "@/lib/utils";
import { getVipDiscount } from "@/lib/vip";

const ORDER_PAGE_SIZE = 10;

// 从购物车创建订单 POST /api/orders
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { address, phone, recipientName, note, cartItemIds } = await request.json();

    // 验证必填字段
    if (!address || !phone || !recipientName) {
      return NextResponse.json(
        { error: "请填写收货地址、电话和收货人姓名" },
        { status: 400 }
      );
    }

    // 手机号格式校验
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "请输入正确的11位手机号" },
        { status: 400 }
      );
    }

    // 获取购物车商品（支持选择性下单）
    const cartWhere: Record<string, unknown> = { userId: user.id };
    if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
      cartWhere.id = { in: cartItemIds };
    }

    const cartItems = await prisma.cartItem.findMany({
      where: cartWhere,
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

      // 3. 清空购物车（选择性下单时只删除已下单的商品）
      if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
        await tx.cartItem.deleteMany({
          where: { id: { in: cartItemIds } },
        });
      } else {
        await tx.cartItem.deleteMany({
          where: { userId: user.id },
        });
      }

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

// 获取订单列表 GET /api/orders?status=&page=
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parsePage(searchParams.get("page"));

    // 构建查询条件
    const where: Record<string, unknown> = { userId: user.id };
    if (status && ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"].includes(status)) {
      where.status = status;
    }

    // 获取总数
    const total = await prisma.order.count({ where });

    // 获取订单列表
    const orders = await prisma.order.findMany({
      where,
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
      skip: (page - 1) * ORDER_PAGE_SIZE,
      take: ORDER_PAGE_SIZE,
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

    return NextResponse.json({
      orders: result,
      pagination: {
        page,
        pageSize: ORDER_PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / ORDER_PAGE_SIZE),
      },
    });
  } catch (error) {
    console.error("获取订单列表错误:", error);
    return NextResponse.json({ error: "获取订单列表失败" }, { status: 500 });
  }
}
