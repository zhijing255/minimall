"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  originalTotal: number;
  vipDiscount: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 状态标签样式
const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待付款", color: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "已支付", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "已发货", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "已完成", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "已取消", color: "bg-gray-100 text-gray-800" },
};

// 状态过滤选项
const statusFilters = [
  { value: "", label: "全部" },
  { value: "PENDING", label: "待付款" },
  { value: "PAID", label: "已支付" },
  { value: "SHIPPED", label: "已发货" },
  { value: "COMPLETED", label: "已完成" },
  { value: "CANCELLED", label: "已取消" },
];

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const currentStatus = searchParams.get("status") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login?from=/orders");
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (currentStatus) params.set("status", currentStatus);
        if (currentPage > 1) params.set("page", currentPage.toString());

        const res = await fetch(`/api/orders?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
          setPagination(data.pagination || null);
        }
      } catch {
        console.error("获取订单失败");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, authLoading, router, currentStatus, currentPage]);

  // 切换状态过滤
  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    router.push(`/orders?${params.toString()}`);
  };

  // 切换页码
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (currentStatus) params.set("status", currentStatus);
    if (page > 1) params.set("page", page.toString());
    router.push(`/orders?${params.toString()}`);
  };

  // 加载中
  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">我的订单</h1>

      {/* 状态过滤 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleStatusChange(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentStatus === filter.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h2 className="mt-4 text-lg font-medium text-gray-900">暂无订单</h2>
          <p className="mt-2 text-gray-500">
            {currentStatus ? "该状态下暂无订单" : "快去下单吧"}
          </p>
          <Link
            href="/"
            className="mt-6 inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            去购物
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
              >
                {/* 订单头部 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      订单号: {order.id.slice(0, 8)}...
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      statusConfig[order.status]?.color || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusConfig[order.status]?.label || order.status}
                  </span>
                </div>

                {/* 商品列表（最多显示3个） */}
                <div className="flex gap-4 mb-4">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden relative">
                        {item.product.images[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg
                              className="w-6 h-6"
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
                      <div className="text-sm">
                        <p className="text-gray-900 line-clamp-1">
                          {item.product.name}
                        </p>
                        <p className="text-gray-500">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <span className="text-gray-500 text-sm self-center">
                      等 {order.items.length} 件商品
                    </span>
                  )}
                </div>

                {/* 订单底部 */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    共 {order.items.reduce((sum, item) => sum + item.quantity, 0)} 件商品
                  </div>
                  <div className="flex items-center gap-4">
                    {order.vipDiscount < 1 && (
                      <span className="text-sm text-green-600">
                        VIP {Math.round(order.vipDiscount * 10)}折
                      </span>
                    )}
                    <div className="text-right">
                      <span className="text-sm text-gray-500">实付: </span>
                      <span className="text-lg font-bold text-red-500">
                        ¥{formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 分页 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-sm text-gray-700">
                第 {pagination.page} / {pagination.totalPages} 页
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-32" />
            ))}
          </div>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
