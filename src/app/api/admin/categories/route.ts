import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return NextResponse.json({ error: '获取分类列表失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { name, slug, image } = body;

    // 验证必填字段
    if (!name || !slug) {
      return NextResponse.json(
        { error: '请填写分类名称和slug' },
        { status: 400 }
      );
    }

    // 检查名称唯一性
    const existingName = await prisma.category.findUnique({
      where: { name },
    });

    if (existingName) {
      return NextResponse.json(
        { error: '分类名称已存在' },
        { status: 400 }
      );
    }

    // 检查slug唯一性
    const existingSlug = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: '分类slug已存在' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        image: image || null,
      },
    });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    console.error('创建分类失败:', error);
    return NextResponse.json({ error: '创建分类失败' }, { status: 500 });
  }
}
