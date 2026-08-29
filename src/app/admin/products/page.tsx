"use client";

import { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string;
  featured: boolean;
  active: boolean;
  categoryId: string;
  category: Category;
  createdAt: string;
}

interface ProductsResponse {
  data: {
    products: Product[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

interface CategoriesResponse {
  data: Category[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    categoryId: "",
    images: "",
    featured: false,
    active: true,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [pagination.page, search, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      if (search) params.append("search", search);
      if (categoryFilter) params.append("categoryId", categoryFilter);

      const response = await fetch(`/api/admin/products?${params}`);
      const data: ProductsResponse = await response.json();

      if (response.ok) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("获取商品列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      const data: CategoriesResponse = await response.json();

      if (response.ok) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("获取分类列表失败:", error);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId: product.categoryId,
        images: product.images,
        featured: product.featured,
        active: product.active,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        categoryId: "",
        images: "",
        featured: false,
        active: true,
      });
    }
    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.description || !formData.categoryId) {
      setError("请填写所有必填字段");
      return;
    }

    if (formData.price <= 0) {
      setError("价格必须大于0");
      return;
    }

    if (formData.stock < 0) {
      setError("库存不能为负数");
      return;
    }

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";

      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        handleCloseModal();
        fetchProducts();
      } else {
        setError(data.error || "操作失败");
      }
    } catch (error) {
      setError("网络错误，请重试");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个商品吗？")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        fetchProducts();
      } else {
        alert(data.error || "删除失败");
      }
    } catch (error) {
      alert("网络错误，请重试");
    }
  };

  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          新增商品
        </button>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="搜索商品名称..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="border rounded px-3 py-2 flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="border rounded px-3 py-2"
        >
          <option value="">全部分类</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          搜索
        </button>
      </div>

      {/* 商品表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                商品名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                价格
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                库存
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                分类
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatPrice(product.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.category.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.active ? "上架" : "下架"}
                    </span>
                    {product.featured && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        推荐
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            disabled={pagination.page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-3 py-1">
            第 {pagination.page} / {pagination.totalPages} 页
          </span>
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? "编辑商品" : "新增商品"}
            </h2>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品描述 *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    价格 *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    库存 *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    分类 *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">请选择分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品图片 (URL)
                  </label>
                  <input
                    type="text"
                    value={formData.images}
                    onChange={(e) =>
                      setFormData({ ...formData, images: e.target.value })
                    }
                    placeholder='["url1", "url2"]'
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) =>
                        setFormData({ ...formData, featured: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">推荐商品</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">上架</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingProduct ? "更新" : "创建"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
