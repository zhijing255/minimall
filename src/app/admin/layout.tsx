import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireAdmin();

  if (!auth.success) {
    redirect(`/login?from=/admin`);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link
                href="/admin"
                className="text-xl font-bold text-indigo-600"
              >
                管理后台
              </Link>
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/admin/products"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
                >
                  商品管理
                </Link>
                <Link
                  href="/admin/orders"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
                >
                  订单管理
                </Link>
                <Link
                  href="/admin/categories"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
                >
                  分类管理
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {auth.user.name || auth.user.email}
              </span>
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-indigo-600"
              >
                返回前台
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
