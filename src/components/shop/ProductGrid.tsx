import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/product/${product.id}`}
          className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          {/* 商品图片 */}
          <div className="aspect-square bg-gray-100 relative overflow-hidden">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg
                  className="w-12 h-12"
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

            {/* 库存提示 */}
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white font-medium">已售罄</span>
              </div>
            )}
          </div>

          {/* 商品信息 */}
          <div className="p-4">
            {/* 分类标签 */}
            <span className="text-xs text-indigo-600 font-medium">
              {product.category.name}
            </span>

            {/* 商品名称 */}
            <h3 className="mt-1 text-gray-900 font-medium line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {product.name}
            </h3>

            {/* 价格 */}
            <div className="mt-2 flex items-baseline">
              <span className="text-xl font-bold text-red-500">
                ¥{formatPrice(product.price)}
              </span>
            </div>

            {/* 库存 */}
            <p className="mt-2 text-sm text-gray-500">
              {product.stock > 0 ? `库存 ${product.stock} 件` : "暂时缺货"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
