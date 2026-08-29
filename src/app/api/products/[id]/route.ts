import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "商品不存在" },
        { status: 404 }
      );
    }

    if (!product.active) {
      return NextResponse.json(
        { error: "商品已下架" },
        { status: 404 }
      );
    }

    // 解析图片 JSON 字符串
    const result = {
      ...product,
      images: parseImages(product.images),
    };

    return NextResponse.json({ product: result });
  } catch (error) {
    console.error("获取商品详情错误:", error);
    return NextResponse.json(
      { error: "获取商品详情失败" },
      { status: 500 }
    );
  }
}
