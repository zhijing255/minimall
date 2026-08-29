import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseImages } from "@/lib/utils";

// 获取订单详情 GET /api/admin/orders/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            vipLevel: true,
          },
        },
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

// 更新订单状态 PUT /api/admin/orders/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const { status: newStatus } = await request.json();

    // 验证状态值
    const validStatuses = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];
    if (!newStatus || !validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: "无效的订单状态" }, { status: 400 });
    }

    // 获取当前订单
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 验证状态流转合法性
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ["PAID", "CANCELLED"],
      PAID: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[order.status]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `订单状态不能从 ${order.status} 变更为 ${newStatus}` },
        { status: 400 }
      );
    }

    // 如果取消已支付/已发货的订单，需要恢复库存
    if (newStatus === "CANCELLED" && (order.status === "PAID" || order.status === "SHIPPED")) {
      await prisma.$transaction(async (tx) => {
        // 更新订单状态
        await tx.order.update({
          where: { id },
          data: { status: newStatus },
        });

        // 恢复库存
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        // 回退消费额
        await tx.user.update({
          where: { id: order.userId },
          data: {
            totalSpent: {
              decrement: order.total,
            },
          },
        });
      });
    } else {
      // 普通状态更新
      await prisma.order.update({
        where: { id },
        data: { status: newStatus },
      });
    }

    return NextResponse.json({ message: "状态更新成功" });
  } catch (error) {
    console.error("更新订单状态错误:", error);
    return NextResponse.json({ error: "更新订单状态失败" }, { status: 500 });
  }
}
