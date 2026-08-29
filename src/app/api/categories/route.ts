import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: {
              where: { active: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: cat.image,
      productCount: cat._count.products,
    }));

    return NextResponse.json({ categories: result });
  } catch (error) {
    console.error("获取分类列表错误:", error);
    return NextResponse.json(
      { error: "获取分类失败" },
      { status: 500 }
    );
  }
}
