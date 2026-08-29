import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

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
    // 检查是否有关联商品
    const products = await prisma.product.findMany({
      where: { categoryId: id },
    });

    if (products.length > 0) {
      return NextResponse.json(
        { error: '该分类下还有商品，无法删除' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ data: { message: '删除成功' } });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json({ error: '删除分类失败' }, { status: 500 });
  }
}
