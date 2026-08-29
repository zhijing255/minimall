"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function UserMenu() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/login"
          className="text-gray-600 hover:text-indigo-600"
        >
          登录
        </Link>
        <Link
          href="/register"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          注册
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* 用户名 */}
      <span className="text-gray-700">
        {user.name || user.email}
      </span>

      {/* VIP 徽章 */}
      {user.vipLevel > 0 && (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          user.vipLevel === 1
            ? "bg-yellow-100 text-yellow-800"
            : user.vipLevel === 2
            ? "bg-gray-100 text-gray-800"
            : "bg-amber-100 text-amber-800"
        }`}>
          VIP{user.vipLevel}
        </span>
      )}

      {/* 退出按钮 */}
      <button
        onClick={logout}
        className="text-gray-600 hover:text-red-600"
      >
        退出
      </button>
    </div>
  );
}
