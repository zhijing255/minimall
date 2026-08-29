"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AddToCartButtonProps {
  productId: string;
  disabled: boolean;
}

export default function AddToCartButton({
  productId,
  disabled,
}: AddToCartButtonProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAddToCart = async () => {
    // 检查登录状态
    if (!user) {
      router.push(`/login?from=/product/${productId}`);
      return;
    }

    setAdding(true);
    setMessage(null);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "添加失败" });
        return;
      }

      setMessage({ type: "success", text: "已添加到购物车" });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: "error", text: "网络错误，请稍后重试" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      {/* 数量选择 */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-gray-700">数量：</span>
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100"
          >
            -
          </button>
          <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      {/* 添加到购物车按钮 */}
      <button
        onClick={handleAddToCart}
        disabled={disabled || adding || loading}
        className="w-full py-3 px-6 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {adding ? "添加中..." : loading ? "加载中..." : "加入购物车"}
      </button>

      {/* 提示消息 */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
