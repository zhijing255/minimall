import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parsePage } from "@/lib/utils";

const ORDER_PAGE_SIZE = 20;

// 获取所有订单列表 GET /api/admin/orders
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parsePage(searchParams.get("page"));
    const search = searchParams.get("search") || "";

    // 构建查询条件
    const where: Record<string, unknown> = {};

    if (status && ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"].includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { recipientName: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // 获取总数
    const total = await prisma.order.count({ where });

    // 获取订单列表
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    return NextResponse.json({
      orders,
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
