import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// 获取购物车
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 解析图片
    const items = cartItems.map((item) => ({
      ...item,
      product: {
        ...item.product,
        images: JSON.parse(item.product.images) as string[],
      },
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("获取购物车错误:", error);
    return NextResponse.json({ error: "获取购物车失败" }, { status: 500 });
  }
}

// 添加到购物车
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { productId, quantity = 1 } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "商品ID不能为空" }, { status: 400 });
    }

    // 检查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.active) {
      return NextResponse.json({ error: "商品不存在或已下架" }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: "库存不足" }, { status: 400 });
    }

    // 检查购物车是否已有该商品
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // 更新数量
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        return NextResponse.json({ error: "库存不足" }, { status: 400 });
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // 新增
      await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId,
          quantity,
        },
      });
    }

    return NextResponse.json({ message: "已添加到购物车" });
  } catch (error) {
    console.error("添加购物车错误:", error);
    return NextResponse.json({ error: "添加失败" }, { status: 500 });
  }
}

// 更新购物车数量
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id, quantity } = await request.json();

    if (!id || quantity === undefined) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

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

// 删除购物车项
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

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
