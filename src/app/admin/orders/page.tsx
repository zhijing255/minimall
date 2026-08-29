"use client";

import { useState, useEffect } from "react";
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
  user: {
    id: string;
    name: string | null;
    email: string;
  };
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

// 允许的状态流转
const allowedTransitions: Record<string, Array<{ status: string; label: string; color: string }>> = {
  PENDING: [
    { status: "PAID", label: "确认支付", color: "bg-blue-600 hover:bg-blue-700" },
    { status: "CANCELLED", label: "取消订单", color: "bg-gray-600 hover:bg-gray-700" },
  ],
  PAID: [
    { status: "SHIPPED", label: "确认发货", color: "bg-purple-600 hover:bg-purple-700" },
    { status: "CANCELLED", label: "取消订单", color: "bg-gray-600 hover:bg-gray-700" },
  ],
  SHIPPED: [
    { status: "COMPLETED", label: "确认完成", color: "bg-green-600 hover:bg-green-700" },
    { status: "CANCELLED", label: "取消订单", color: "bg-gray-600 hover:bg-gray-700" },
  ],
};

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentStatus, setCurrentStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 获取订单列表
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentStatus) params.set("status", currentStatus);
      if (currentPage > 1) params.set("page", currentPage.toString());
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
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

  useEffect(() => {
    fetchOrders();
  }, [currentStatus, currentPage]);

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  // 更新订单状态
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const action = newStatus === "CANCELLED" ? "取消" : "更新";
    if (!confirm(`确定要${action}订单吗？`)) return;

    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || "操作失败");
      }
    } catch {
      alert("网络错误，请稍后重试");
    } finally {
      setUpdatingId(null);
    }
  };

  // 加载中
  if (loading && orders.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="bg-white rounded-lg p-6 h-12" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 h-20" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">订单管理</h1>

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜索订单号、收货人、手机号"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                搜索
              </button>
            </div>
          </div>

          {/* 状态过滤 */}
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setCurrentStatus(filter.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentStatus === filter.value
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">暂无订单</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50">
                {/* 订单头部 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        setExpandedOrder(
                          expandedOrder === order.id ? null : order.id
                        )
                      }
                      className="text-sm font-mono text-indigo-600 hover:text-indigo-800"
                    >
                      {order.id.slice(0, 12)}...
                    </button>
                    <span className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString("zh-CN")}
                    </span>
                    <span className="text-sm text-gray-500">
                      {order.user.name || order.user.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusConfig[order.status]?.color || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusConfig[order.status]?.label || order.status}
                    </span>
                    <span className="text-lg font-bold text-red-500">
                      ¥{formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                {allowedTransitions[order.status]?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {allowedTransitions[order.status].map((transition) => (
                      <button
                        key={transition.status}
                        onClick={() =>
                          handleStatusUpdate(order.id, transition.status)
                        }
                        disabled={updatingId === order.id}
                        className={`px-3 py-1 text-sm text-white rounded-lg ${transition.color} disabled:opacity-50`}
                      >
                        {updatingId === order.id ? "处理中..." : transition.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* 展开的订单详情 */}
                {expandedOrder === order.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">收货信息</p>
                        <p className="text-sm">
                          {order.recipientName} / {order.phone}
                        </p>
                        <p className="text-sm text-gray-600">{order.address}</p>
                        {order.note && (
                          <p className="text-sm text-gray-500 mt-1">
                            备注: {order.note}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">金额明细</p>
                        <p className="text-sm">
                          商品总额: ¥{formatPrice(order.originalTotal)}
                        </p>
                        {order.vipDiscount < 1 && (
                          <p className="text-sm text-green-600">
                            VIP折扣: {Math.round(order.vipDiscount * 10)}折
                          </p>
                        )}
                        <p className="text-sm font-bold">
                          实付金额: ¥{formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">商品列表</p>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{item.product.name}</span>
                            <span>
                              ¥{formatPrice(item.price)} x {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-sm text-gray-700">
            第 {pagination.page} / {pagination.totalPages} 页 (共 {pagination.total} 条)
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= pagination.totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
