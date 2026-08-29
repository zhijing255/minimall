import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    return NextResponse.json({ error: '获取商品详情失败' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

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

    // 验证商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    // 验证分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: '分类不存在' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
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

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error('更新商品失败:', error);
    return NextResponse.json({ error: '更新商品失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    // 检查是否有关联的订单项
    const orderItems = await prisma.orderItem.findMany({
      where: { productId: id },
    });

    if (orderItems.length > 0) {
      return NextResponse.json(
        { error: '该商品有关联的订单，无法删除' },
        { status: 400 }
      );
    }

    // 同时删除关联的购物车项
    await prisma.cartItem.deleteMany({
      where: { productId: id },
    });

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ data: { message: '删除成功' } });
  } catch (error) {
    console.error('删除商品失败:', error);
    return NextResponse.json({ error: '删除商品失败' }, { status: 500 });
  }
}
