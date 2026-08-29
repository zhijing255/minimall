// VIP 等级和折扣计算（集中管理）

// VIP 等级阈值
export const VIP_THRESHOLDS = [
  { level: 3, threshold: 80000 }, // VIP3: >=80000
  { level: 2, threshold: 10000 }, // VIP2: >=10000
  { level: 1, threshold: 5000 },  // VIP1: >=5000
] as const;

// VIP 折扣率
export const VIP_DISCOUNTS: Record<number, number> = {
  3: 0.9,  // VIP3: 9折
  2: 0.95, // VIP2: 95折
  1: 0.98, // VIP1: 98折
  0: 1,    // 普通用户无折扣
};

// 根据累计消费计算 VIP 等级
export function calculateVipLevel(totalSpent: number): number {
  for (const { level, threshold } of VIP_THRESHOLDS) {
    if (totalSpent >= threshold) return level;
  }
  return 0;
}

// 根据 VIP 等级获取折扣率
export function getVipDiscount(vipLevel: number): number {
  return VIP_DISCOUNTS[vipLevel] ?? 1;
}

// 计算折扣后价格
export function calculateDiscountedPrice(originalTotal: number, vipLevel: number): number {
  const discount = getVipDiscount(vipLevel);
  return Math.round(originalTotal * discount * 100) / 100;
}
