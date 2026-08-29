import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseImages } from "@/lib/utils";

// 获取订单详情 GET /api/orders/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 检查订单归属
    if (order.userId !== user.id) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

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

    return NextResponse.json({ order: result });
  } catch (error) {
    console.error("获取订单详情错误:", error);
    return NextResponse.json({ error: "获取订单详情失败" }, { status: 500 });
  }
}

// 模拟支付 PUT /api/orders/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 检查订单归属
    if (order.userId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 模拟支付：PENDING → PAID
    if (action === "pay") {
      if (order.status !== "PENDING") {
        return NextResponse.json(
          { error: "只有待付款订单才能支付" },
          { status: 400 }
        );
      }

      // 使用事务：更新订单状态 + 累计用户消费 + 检查VIP升级
      await prisma.$transaction(async (tx) => {
        // 1. 更新订单状态为 PAID
        await tx.order.update({
          where: { id },
          data: { status: "PAID" },
        });

        // 2. 累计用户消费金额
        await tx.user.update({
          where: { id: user.id },
          data: {
            totalSpent: {
              increment: order.total,
            },
          },
        });

        // 3. 获取最新用户信息，检查VIP升级
        const updatedUser = await tx.user.findUnique({
          where: { id: user.id },
          select: { totalSpent: true, vipLevel: true },
        });

        if (updatedUser) {
          const newVipLevel = calculateVipLevel(updatedUser.totalSpent);
          if (newVipLevel > updatedUser.vipLevel) {
            await tx.user.update({
              where: { id: user.id },
              data: { vipLevel: newVipLevel },
            });
          }
        }
      });

      return NextResponse.json({ message: "支付成功" });
    }

    // 取消订单
    if (action === "cancel") {
      if (order.status === "COMPLETED" || order.status === "CANCELLED") {
        return NextResponse.json(
          { error: "已完成或已取消的订单不能取消" },
          { status: 400 }
        );
      }

      // 使用事务：更新订单状态 + 恢复库存
      await prisma.$transaction(async (tx) => {
        // 1. 更新订单状态为 CANCELLED
        await tx.order.update({
          where: { id },
          data: { status: "CANCELLED" },
        });

        // 2. 恢复库存
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: id },
        });

        for (const item of orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      });

      return NextResponse.json({ message: "取消成功" });
    }

    return NextResponse.json({ error: "无效操作" }, { status: 400 });
  } catch (error) {
    console.error("操作订单错误:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

// 计算 VIP 等级
function calculateVipLevel(totalSpent: number): number {
  if (totalSpent >= 80000) return 3; // VIP3: ≥80000
  if (totalSpent >= 10000) return 2; // VIP2: ≥10000
  if (totalSpent >= 5000) return 1;  // VIP1: ≥5000
  return 0; // 普通用户
}
