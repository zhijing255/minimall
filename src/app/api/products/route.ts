import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseImages, parsePage, PAGE_SIZE } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = (searchParams.get("search") || "").slice(0, 100); // 限制搜索长度
    const category = searchParams.get("category") || "";
    const page = parsePage(searchParams.get("page"));

    // 构建查询条件
    const where: Record<string, unknown> = {
      active: true,
    };

    // 搜索条件（模糊匹配名称或描述）
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // 分类筛选
    if (category) {
      where.category = { slug: category };
    }

    // 查询总数
    const total = await prisma.product.count({ where });

    // 查询商品列表
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    // 解析图片 JSON 字符串
    const productsWithImages = products.map((product) => ({
      ...product,
      images: parseImages(product.images),
    }));

    return NextResponse.json({
      products: productsWithImages,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (error) {
    console.error("获取商品列表错误:", error);
    return NextResponse.json(
      { error: "获取商品列表失败" },
      { status: 500 }
    );
  }
}
