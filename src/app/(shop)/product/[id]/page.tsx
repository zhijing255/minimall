import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddToCartButton from "@/components/shop/AddToCartButton";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
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

  if (!product || !product.active) {
    notFound();
  }

  const images = JSON.parse(product.images) as string[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 面包屑导航 */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-indigo-600">
              首页
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href={`/?category=${product.category.slug}`}
              className="hover:text-indigo-600"
            >
              {product.category.name}
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* 商品图片 */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {images[0] ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-24 h-24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-24 h-24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* 商品信息 */}
        <div className="flex flex-col">
          {/* 分类标签 */}
          <span className="text-sm text-indigo-600 font-medium mb-2">
            {product.category.name}
          </span>

          {/* 商品名称 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          {/* 价格 */}
          <div className="mb-6">
            <span className="text-4xl font-bold text-red-500">
              ¥{product.price.toFixed(2)}
            </span>
          </div>

          {/* 库存状态 */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <span className="text-green-600">
                有货 · 库存 {product.stock} 件
              </span>
            ) : (
              <span className="text-red-500">暂时缺货</span>
            )}
          </div>

          {/* 商品描述 */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-2">商品描述</h2>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* 加入购物车按钮 */}
          <div className="mt-auto">
            <AddToCartButton
              productId={product.id}
              disabled={product.stock <= 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
