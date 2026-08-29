import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseImages, parseQuantity } from "@/lib/utils";

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
        images: parseImages(item.product.images),
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

    const { productId, quantity: rawQuantity = 1 } = await request.json();
    const quantity = parseQuantity(rawQuantity);

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

// 注意：PUT 和 DELETE 操作请使用 /api/cart/[id] 路由
