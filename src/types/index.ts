// 用户类型
export interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  vipLevel: number;
  image: string | null;
  totalSpent: number;
}

// 商品类型
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string;
  featured: boolean;
  active: boolean;
  categoryId: string;
  category?: Category;
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

// 购物车项类型
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product?: Product;
}

// 订单类型
export interface Order {
  id: string;
  userId: string;
  originalTotal: number;
  vipDiscount: number;
  total: number;
  status: string;
  address: string;
  phone: string;
  recipientName: string;
  note: string | null;
  items?: OrderItem[];
}

// 订单项类型
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}
