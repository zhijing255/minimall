import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseQuantity } from "@/lib/utils";

// 更新购物车数量 PUT /api/cart/[id]
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
    const { quantity: rawQuantity } = await request.json();
    const quantity = parseQuantity(rawQuantity);

    // 检查购物车项是否属于当前用户
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!cartItem || cartItem.userId !== user.id) {
      return NextResponse.json({ error: "购物车项不存在" }, { status: 404 });
    }

    if (quantity <= 0) {
      // 删除
      await prisma.cartItem.delete({ where: { id } });
    } else {
      if (quantity > cartItem.product.stock) {
        return NextResponse.json({ error: "库存不足" }, { status: 400 });
      }
      await prisma.cartItem.update({
        where: { id },
        data: { quantity },
      });
    }

    return NextResponse.json({ message: "更新成功" });
  } catch (error) {
    console.error("更新购物车错误:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 删除购物车项 DELETE /api/cart/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;

    // 检查购物车项是否属于当前用户
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
    });

    if (!cartItem || cartItem.userId !== user.id) {
      return NextResponse.json({ error: "购物车项不存在" }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id } });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除购物车项错误:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
