import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  // 获取统计数据
  const [productCount, orderCount, userCount, categoryCount] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.category.count(),
  ]);

  const stats = [
    { label: "商品总数", value: productCount, href: "/admin/products", color: "bg-blue-500" },
    { label: "订单总数", value: orderCount, href: "/admin/orders", color: "bg-green-500" },
    { label: "用户总数", value: userCount, href: "/admin", color: "bg-purple-500" },
    { label: "分类总数", value: categoryCount, href: "/admin/categories", color: "bg-orange-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">控制面板</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-xl font-bold">
                  {stat.value}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/products"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-2">商品管理</h2>
          <p className="text-gray-500 text-sm">管理商品信息、库存、价格</p>
        </Link>
        <Link
          href="/admin/orders"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-2">订单管理</h2>
          <p className="text-gray-500 text-sm">查看订单、更新发货状态</p>
        </Link>
        <Link
          href="/admin/categories"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-2">分类管理</h2>
          <p className="text-gray-500 text-sm">管理商品分类</p>
        </Link>
      </div>
    </div>
  );
}
