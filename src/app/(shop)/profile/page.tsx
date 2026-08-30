"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { VIP_THRESHOLDS, VIP_DISCOUNTS } from "@/lib/vip";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  vipLevel: number;
  totalSpent: number;
  createdAt: string;
  _count: {
    orders: number;
  };
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?from=/profile");
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
      }
    } catch (error) {
      console.error("获取用户信息失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const nextVipLevel = profile.vipLevel < 3 ? profile.vipLevel + 1 : null;
  const nextThreshold = nextVipLevel
    ? VIP_THRESHOLDS.find((t) => t.level === nextVipLevel)?.threshold
    : null;
  const progress = nextThreshold
    ? Math.min((profile.totalSpent / nextThreshold) * 100, 100)
    : 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">个人中心</h1>

      {/* 用户信息卡片 */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        {/* 顶部背景 */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

        {/* 用户信息 */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 mb-6">
            {/* 头像 */}
            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl font-bold text-indigo-600 border-4 border-white">
              {profile.name ? profile.name[0].toUpperCase() : profile.email[0].toUpperCase()}
            </div>

            <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.name || "未设置昵称"}
                </h2>
                {profile.vipLevel > 0 && (
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      profile.vipLevel === 1
                        ? "bg-yellow-100 text-yellow-800"
                        : profile.vipLevel === 2
                        ? "bg-gray-100 text-gray-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    VIP{profile.vipLevel}
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-1">{profile.email}</p>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {profile._count.orders}
              </p>
              <p className="text-sm text-gray-500">订单数</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">
                ¥{profile.totalSpent.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">累计消费</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {profile.vipLevel > 0
                  ? `${((1 - (VIP_DISCOUNTS[profile.vipLevel] ?? 1)) * 100).toFixed(0)}%`
                  : "无"}
              </p>
              <p className="text-sm text-gray-500">当前折扣</p>
            </div>
          </div>

          {/* VIP 进度 */}
          {nextVipLevel && nextThreshold && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-amber-800">
                  距离 VIP{nextVipLevel}
                </span>
                <span className="text-sm text-amber-600">
                  ¥{profile.totalSpent.toLocaleString()} / ¥{nextThreshold.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                再消费 ¥{(nextThreshold - profile.totalSpent).toLocaleString()} 即可升级
              </p>
            </div>
          )}

          {profile.vipLevel >= 3 && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200 text-center">
              <span className="text-amber-800 font-medium">
                🎉 您已是最高等级 VIP3 会员，享受 9 折优惠
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/orders"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex items-center space-x-4"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">我的订单</h3>
            <p className="text-sm text-gray-500">查看订单状态和历史</p>
          </div>
        </Link>

        <Link
          href="/cart"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex items-center space-x-4"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">购物车</h3>
            <p className="text-sm text-gray-500">查看购物车商品</p>
          </div>
        </Link>
      </div>

      {/* VIP 等级说明 */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">VIP 等级说明</h3>
        <div className="space-y-3">
          {VIP_THRESHOLDS.slice()
            .sort((a, b) => a.threshold - b.threshold)
            .map((t) => (
              <div
                key={t.level}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  profile.vipLevel >= t.level
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      profile.vipLevel >= t.level
                        ? "bg-amber-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {t.level}
                  </span>
                  <span className="font-medium text-gray-700">VIP{t.level}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    累计消费 ≥ ¥{t.threshold.toLocaleString()}
                  </p>
                  <p className="text-sm font-medium text-indigo-600">
                    {((1 - VIP_DISCOUNTS[t.level]) * 100).toFixed(0)}% 折扣
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
