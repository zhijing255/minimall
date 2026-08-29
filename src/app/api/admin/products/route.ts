import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
  const categoryId = searchParams.get('categoryId') || '';

  try {
    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data: {
        products,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    return NextResponse.json({ error: '获取商品列表失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { name, description, price, stock, categoryId, images, featured, active } = body;

    // 验证必填字段
    if (!name || !description || price === undefined || stock === undefined || !categoryId) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    if (price <= 0) {
      return NextResponse.json({ error: '价格必须大于0' }, { status: 400 });
    }

    if (stock < 0) {
      return NextResponse.json({ error: '库存不能为负数' }, { status: 400 });
    }

    // 验证分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: '分类不存在' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        images: images || '[]',
        featured: featured || false,
        active: active !== false,
      },
      include: { category: true },
    });

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error('创建商品失败:', error);
    return NextResponse.json({ error: '创建商品失败' }, { status: 500 });
  }
}
