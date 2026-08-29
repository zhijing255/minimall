// 安全解析商品图片 JSON 字符串
export function parseImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// 安全解析分页参数
export function parsePage(page: string | null | undefined): number {
  const num = parseInt(page || "1", 10);
  return isNaN(num) || num < 1 ? 1 : num;
}

// 安全解析数量参数
export function parseQuantity(quantity: unknown): number {
  const num = Number(quantity);
  if (isNaN(num) || num < 1) return 1;
  return Math.floor(num);
}

// 安全格式化价格（避免浮点精度问题）
export function formatPrice(price: number): string {
  return (Math.round(price * 100) / 100).toFixed(2);
}

// 每页显示数量常量
export const PAGE_SIZE = 9;
