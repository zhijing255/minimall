"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import { getVipDiscount } from "@/lib/vip";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    recipientName: "",
    phone: "",
    address: "",
    note: "",
  });

  // 获取购物车数据
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login?from=/checkout");
      return;
    }

    const fetchCart = async () => {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const data = await res.json();
          setCartItems(data.items || []);
        }
      } catch {
        console.error("获取购物车失败");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user, authLoading, router]);

  // 计算价格
  const originalTotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const vipDiscount = getVipDiscount(user?.vipLevel ?? 0);
  const discountedTotal = Math.round(originalTotal * vipDiscount * 100) / 100;

  // 提交订单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.recipientName || !formData.phone || !formData.address) {
      setError("请填写完整的收货信息");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "创建订单失败");
        return;
      }

      // 成功后跳转到订单详情
      router.push(`/orders/${data.order.id}`);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
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

  // 空购物车
  if (cartItems.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">确认订单</h1>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 收货信息 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">收货信息</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  收货人姓名 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.recipientName}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="请输入收货人姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话 *
                </label>
                <input
                  type="tel"
                  required
                  pattern="^1[3-9]\d{9}$"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="请输入11位手机号"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  收货地址 *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="请输入详细收货地址"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="选填，如有特殊要求请备注"
                />
              </div>
            </div>
          </div>

          {/* 订单摘要 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">订单摘要</h2>

            {/* 商品列表 */}
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 line-clamp-1">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      ¥{formatPrice(item.product.price)} x {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">商品数量</span>
                <span>
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)} 件
                </span>
              </div>
              {vipDiscount < 1 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">商品总额</span>
                    <span>¥{formatPrice(originalTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">
                      VIP {Math.round(vipDiscount * 10)}折优惠
                    </span>
                    <span className="text-green-600">
                      -¥{formatPrice(originalTotal - discountedTotal)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>应付总额</span>
                <span className="text-red-500">
                  ¥{formatPrice(vipDiscount < 1 ? discountedTotal : originalTotal)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "提交中..." : "提交订单"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
