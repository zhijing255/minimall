import { ReactNode } from "react";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import CartIcon from "@/components/shop/CartIcon";
import UserMenu from "@/components/shop/UserMenu";

// 导航分类几乎不变；跨请求缓存 60s，避免每次跳转都打一轮海外数据库往返
const getNavCategories = unstable_cache(
  () =>
    prisma.category.findMany({
      select: {
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    }),
  ["shop-nav-categories"],
  { revalidate: 60 }
);

export default async function ShopLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 获取分类用于导航（60s 缓存）
  const categories = await getNavCategories();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">
                Mini Mall
              </span>
            </Link>

            {/* 导航链接 */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                首页
              </Link>
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/?category=${cat.slug}`}
                  className="text-gray-600 hover:text-indigo-600"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>

            {/* 右侧操作 */}
            <div className="flex items-center space-x-4">
              <CartIcon />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1">{children}</main>

      {/* 底部 */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Mini Mall. 保留所有权利。
          </p>
        </div>
      </footer>
    </div>
  );
}
