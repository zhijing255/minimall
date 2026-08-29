"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    images: string[];
  };
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 获取购物车数据
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login?from=/cart");
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

  // 显示错误（3秒后自动消失）
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  };

  // 更新数量
  const updateQuantity = async (id: string, newQuantity: number) => {
    setError(null);
    setUpdating(id);

    try {
      // 数量 <= 0 时调用删除 API
      if (newQuantity <= 0) {
        const res = await fetch(`/api/cart/${id}`, { method: "DELETE" });
        if (res.ok) {
          setCartItems((items) => items.filter((item) => item.id !== id));
        } else {
          const data = await res.json();
          showError(data.error || "删除失败");
        }
      } else {
        const res = await fetch(`/api/cart/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQuantity }),
        });

        if (res.ok) {
          setCartItems((items) =>
            items.map((item) =>
              item.id === id ? { ...item, quantity: newQuantity } : item
            )
          );
        } else {
          const data = await res.json();
          showError(data.error || "更新失败");
        }
      }
    } catch {
      showError("网络错误，请稍后重试");
    } finally {
      setUpdating(null);
    }
  };

  // 删除项
  const removeItem = async (id: string) => {
    setError(null);
    setUpdating(id);

    try {
      const res = await fetch(`/api/cart/${id}`, { method: "DELETE" });

      if (res.ok) {
        setCartItems((items) => items.filter((item) => item.id !== id));
      } else {
        const data = await res.json();
        showError(data.error || "删除失败");
      }
    } catch {
      showError("网络错误，请稍后重试");
    } finally {
      setUpdating(null);
    }
  };

  // 计算总价
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // 加载中
  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 h-24" />
          ))}
        </div>
      </div>
    );
  }

  // 未登录
  if (!user) {
    return null;
  }

  // 空购物车
  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-medium text-gray-900">购物车为空</h2>
          <p className="mt-2 text-gray-500">快去挑选心仪的商品吧</p>
          <Link
            href="/"
            className="mt-6 inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            去购物
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">购物车</h1>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 购物车列表 */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg p-4 flex gap-4 shadow-sm"
            >
              {/* 商品图片 */}
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                {item.product.images[0] ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-8 h-8"
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
              <div className="flex-1 min-w-0">
                <Link
                  href={`/product/${item.product.id}`}
                  className="text-gray-900 font-medium hover:text-indigo-600 line-clamp-1"
                >
                  {item.product.name}
                </Link>
                <p className="text-red-500 font-bold mt-1">
                  ¥{formatPrice(item.product.price)}
                </p>

                {/* 数量控制 */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      disabled={updating === item.id}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 border-x border-gray-300">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      disabled={
                        updating === item.id ||
                        item.quantity >= item.product.stock
                      }
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={updating === item.id}
                    className="text-gray-500 hover:text-red-500 text-sm"
                  >
                    删除
                  </button>
                </div>
              </div>

              {/* 小计 */}
              <div className="text-right">
                <p className="text-red-500 font-bold">
                  ¥{formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 结算区域 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">订单摘要</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>商品数量</span>
                <span>
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)} 件
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>商品总价</span>
                <span>¥{formatPrice(totalPrice)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>应付总额</span>
                <span className="text-red-500">¥{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/checkout")}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              去结算
            </button>

            <Link
              href="/"
              className="block text-center text-indigo-600 mt-4 hover:text-indigo-700"
            >
              继续购物
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
