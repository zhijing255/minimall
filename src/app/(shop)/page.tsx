import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SearchBar from "@/components/shop/SearchBar";
import CategoryFilter from "@/components/shop/CategoryFilter";
import ProductGrid from "@/components/shop/ProductGrid";
import Pagination from "@/components/shop/Pagination";

interface HomeProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams;
  const search = params.search || "";
  const category = params.category || "";
  const page = parseInt(params.page || "1", 10);
  const pageSize = 9;

  // 构建查询条件
  const where: Record<string, unknown> = {
    active: true,
  };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  // 并行获取数据
  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: { active: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // 解析图片
  const productsWithImages = products.map((product) => ({
    ...product,
    images: JSON.parse(product.images) as string[],
  }));

  const categoriesWithCount = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    productCount: cat._count.products,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 搜索栏 */}
      <SearchBar defaultValue={search} />

      {/* 分类筛选 */}
      <CategoryFilter
        categories={categoriesWithCount}
        selectedCategory={category}
      />

      {/* 商品数量提示 */}
      <div className="mb-6">
        <p className="text-gray-600">
          共找到 <span className="font-semibold text-indigo-600">{total}</span> 件商品
        </p>
      </div>

      {/* 商品网格 */}
      <ProductGrid products={productsWithImages} />

      {/* 空状态 */}
      {productsWithImages.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">暂无商品</p>
          {(search || category) && (
            <Link
              href="/"
              className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
            >
              清除筛选条件
            </Link>
          )}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          search={search}
          category={category}
        />
      )}
    </div>
  );
}
