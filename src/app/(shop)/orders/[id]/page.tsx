"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  address: string;
  phone: string;
  recipientName: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// 状态标签样式
const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待付款", color: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "已支付", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "已发货", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "已完成", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "已取消", color: "bg-gray-100 text-gray-800" },
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/login?from=/orders/${id}`);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        } else {
          setError("订单不存在或无权访问");
        }
      } catch {
        console.error("获取订单失败");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [user, authLoading, router, id]);

  // 模拟支付
  const handlePay = async () => {
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay" }),
      });

      if (res.ok) {
        setOrder((prev) => (prev ? { ...prev, status: "PAID" } : null));
        // 刷新用户信息（VIP等级可能已升级）
        await refreshUser();
      } else {
        const data = await res.json();
        setError(data.error || "支付失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setActionLoading(false);
    }
  };

  // 取消订单
  const handleCancel = async () => {
    if (!confirm("确定要取消订单吗？")) return;

    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      if (res.ok) {
        setOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
        // 刷新用户信息（VIP等级可能已回退）
        await refreshUser();
      } else {
        const data = await res.json();
        setError(data.error || "取消失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setActionLoading(false);
    }
  };

  // 加载中
  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="bg-white rounded-lg p-6 h-64" />
          <div className="bg-white rounded-lg p-6 h-48" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <p className="text-gray-500">{error || "订单不存在"}</p>
          <Link
            href="/orders"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
          >
            返回订单列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 面包屑 */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/orders" className="hover:text-indigo-600">
              我的订单
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900">订单详情</li>
        </ol>
      </nav>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 订单状态 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">订单详情</h1>
            <p className="text-sm text-gray-500 mt-1">
              订单号: {order.id}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              statusConfig[order.status]?.color || "bg-gray-100 text-gray-800"
            }`}
          >
            {statusConfig[order.status]?.label || order.status}
          </span>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 mt-6">
          {order.status === "PENDING" && (
            <>
              <button
                onClick={handlePay}
                disabled={actionLoading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {actionLoading ? "处理中..." : "立即支付"}
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                取消订单
              </button>
            </>
          )}
          {["PAID", "SHIPPED"].includes(order.status) && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              取消订单
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 商品明细 */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">商品明细</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      sizes="64px"
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
                <div className="flex-1">
                  <Link
                    href={`/product/${item.product.id}`}
                    className="text-gray-900 font-medium hover:text-indigo-600"
                  >
                    {item.product.name}
                  </Link>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-500">
                      ¥{formatPrice(item.price)} x {item.quantity}
                    </span>
                    <span className="text-gray-900 font-medium">
                      ¥{formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 合计 */}
          <div className="mt-6 pt-4 border-t space-y-2">
            {order.vipDiscount < 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">商品原价</span>
                <span className="text-gray-500 line-through">
                  ¥{formatPrice(order.originalTotal)}
                </span>
              </div>
            )}
            {order.vipDiscount < 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">
                  VIP {Math.round(order.vipDiscount * 10)}折优惠
                </span>
                <span className="text-green-600">
                  -¥{formatPrice(order.originalTotal - order.total)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>实付金额</span>
              <span className="text-red-500">¥{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* 收货信息 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">收货信息</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500">收货人: </span>
              <span className="text-gray-900">{order.recipientName}</span>
            </div>
            <div>
              <span className="text-gray-500">电话: </span>
              <span className="text-gray-900">{order.phone}</span>
            </div>
            <div>
              <span className="text-gray-500">地址: </span>
              <span className="text-gray-900">{order.address}</span>
            </div>
            {order.note && (
              <div>
                <span className="text-gray-500">备注: </span>
                <span className="text-gray-900">{order.note}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="text-sm text-gray-500">
              <p>下单时间: {new Date(order.createdAt).toLocaleString("zh-CN")}</p>
              <p className="mt-1">
                更新时间: {new Date(order.updatedAt).toLocaleString("zh-CN")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
