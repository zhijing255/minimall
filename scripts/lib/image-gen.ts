import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

/** 12 色渐变调色板（每项为 [起始色, 结束色]） */
const PALETTE: [string, string][] = [
  ["#6366F1", "#8B5CF6"],
  ["#EC4899", "#F97316"],
  ["#06B6D4", "#3B82F6"],
  ["#10B981", "#84CC16"],
  ["#F59E0B", "#EF4444"],
  ["#8B5CF6", "#EC4899"],
  ["#3B82F6", "#06B6D4"],
  ["#F43F5E", "#F97316"],
  ["#14B8A6", "#3B82F6"],
  ["#8B5CF6", "#6366F1"],
  ["#F59E0B", "#EC4899"],
  ["#22C55E", "#06B6D4"],
];

/** 背景装饰变体数量（0=无装饰，1=右上大圆，2=左下斜线，3=圆点） */
const DECO_COUNT = 4;

/** 每分类的配色+装饰组合总数 */
const VARIANT_COUNT = PALETTE.length * DECO_COUNT;

/** 分类简笔图标（24×24 viewBox，stroke 风格），key 为 Category.slug */
const ICONS: Record<string, string> = {
  phones:
    '<rect x="7" y="2.5" width="10" height="19" rx="2"/><line x1="10.5" y1="18.5" x2="13.5" y2="18.5"/>',
  computers:
    '<rect x="3" y="4.5" width="18" height="11" rx="1.5"/><path d="M9 19.5h6"/><path d="M12 15.5v4"/>',
  appliances:
    '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="14" r="4"/><circle cx="8.5" cy="6.5" r="0.8"/><circle cx="11.5" cy="6.5" r="0.8"/>',
  clothing:
    '<path d="M9 3.5 L12 6 L15 3.5 L20 6.5 L17.5 9.5 L16 8.7 L16 20.5 L8 20.5 L8 8.7 L6.5 9.5 L4 6.5 Z"/>',
  food:
    '<path d="M4 11h16c0 4.5-3.5 8-8 8s-8-3.5-8-8z"/><path d="M8 7.5c0-1 .8-1.5.8-2.5"/><path d="M12 7c0-1 .8-1.5.8-2.5"/><path d="M16 7.5c0-1 .8-1.5.8-2.5"/>',
  books:
    '<path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z"/><line x1="12" y1="6.5" x2="12" y2="19.5"/>',
};

/** 无匹配分类时的兜底图标 */
const DEFAULT_ICON = ICONS.books;

/** 仅这两类占位服务的 URL 允许被脚本覆盖（尊重 admin 手工填写的其他图片） */
const PLACEHOLDER_RE = /picsum\.photos|via\.placeholder\.com/;

/** 确定性字符串 hash */
function hashInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** slug 作为文件名消毒：去掉路径分隔符（防穿越）与 Windows 非法字符 */
export function safeSlug(s: string): string {
  return s.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");
}

/** 背景装饰层（白色低透明度几何图形），返回 SVG 片段 */
function decoLayer(deco: number, w: number, h: number): string {
  switch (deco) {
    case 1:
      return `<circle cx="${w}" cy="0" r="${Math.round(w * 0.38)}" fill="#ffffff" opacity="0.10"/>`;
    case 2:
      return `<g stroke="#ffffff" stroke-width="14" opacity="0.10" stroke-linecap="round">
  <line x1="${Math.round(-w * 0.05)}" y1="${Math.round(h * 0.95)}" x2="${Math.round(w * 0.35)}" y2="${Math.round(h * 0.55)}"/>
  <line x1="${Math.round(w * 0.08)}" y1="${Math.round(h * 1.05)}" x2="${Math.round(w * 0.48)}" y2="${Math.round(h * 0.65)}"/>
</g>`;
    case 3:
      return `<g fill="#ffffff" opacity="0.14">
  <circle cx="${Math.round(w * 0.12)}" cy="${Math.round(h * 0.14)}" r="7"/>
  <circle cx="${Math.round(w * 0.88)}" cy="${Math.round(h * 0.16)}" r="5"/>
  <circle cx="${Math.round(w * 0.14)}" cy="${Math.round(h * 0.86)}" r="5"/>
  <circle cx="${Math.round(w * 0.86)}" cy="${Math.round(h * 0.84)}" r="7"/>
  <circle cx="${Math.round(w * 0.5)}" cy="${Math.round(h * 0.08)}" r="4"/>
  <circle cx="${Math.round(w * 0.5)}" cy="${Math.round(h * 0.92)}" r="4"/>
</g>`;
    default:
      return "";
  }
}

/** 将 24×24 图标缩放居中放置到画布 (cx, cy)，白色描边 */
function iconGroup(icon: string, cx: number, cy: number, size: number): string {
  const scale = size / 24;
  const x = cx - size / 2;
  const y = cy - size / 2;
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">${icon}</g>`;
}

/** 渐变背景 + 装饰 + 居中分类图标（400×400，无文字）；variant 决定配色与装饰 */
export function productSvg(
  name: string,
  categorySlug: string | null,
  variant: number
): string {
  const [c1, c2] = PALETTE[variant % PALETTE.length];
  const deco = Math.floor(variant / PALETTE.length) % DECO_COUNT;
  const icon = (categorySlug && ICONS[categorySlug]) || DEFAULT_ICON;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  ${decoLayer(deco, 400, 400)}
  ${iconGroup(icon, 200, 200, 128)}
</svg>
`;
}

/** 渐变背景 + 装饰 + 居中分类图标（400×300，无文字） */
export function categorySvg(slug: string): string {
  const idx = hashInt(slug) % PALETTE.length;
  const [c1, c2] = PALETTE[idx];
  const deco = hashInt("deco:" + slug) % DECO_COUNT;
  const icon = ICONS[slug] || DEFAULT_ICON;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  ${decoLayer(deco, 400, 300)}
  ${iconGroup(icon, 200, 150, 112)}
</svg>
`;
}

/** 商品 images 是否应被覆盖：空、损坏，或全部为占位服务 URL */
function shouldReplaceImages(imagesJson: string): boolean {
  try {
    const arr = JSON.parse(imagesJson);
    if (!Array.isArray(arr) || arr.length === 0) return true;
    return arr.every(
      (u): u is string => typeof u === "string" && PLACEHOLDER_RE.test(u)
    );
  } catch {
    return true;
  }
}

/** 分类 image 是否应被覆盖：空或占位服务 URL */
function shouldReplaceImage(image: string | null): boolean {
  return !image || PLACEHOLDER_RE.test(image);
}

/** 清理不再对应任何记录的旧 SVG（只删指定目录下第一层 .svg，不递归） */
function pruneSvg(dir: string, keep: Set<string>): void {
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith(".svg") && !keep.has(f)) {
      fs.unlinkSync(path.join(dir, f));
    }
  }
}

export interface SyncResult {
  products: number;
  categories: number;
  placeholderLeft: number;
}

/**
 * 为全部 Product/Category 生成本地 SVG 并把占位服务 URL 更新为本地路径。
 * - 幂等：重复执行结果一致；同分类内保证图片两两不同（配色+装饰变体分配）
 * - 只覆盖 picsum/via.placeholder 占位 URL 或空值，尊重 admin 手工填写的图片
 * - 清理不再对应记录的旧 SVG 文件
 */
export async function syncAllImages(db: PrismaClient): Promise<SyncResult> {
  const publicDir = path.join(process.cwd(), "public");
  const productDir = path.join(publicDir, "products");
  const categoryDir = path.join(publicDir, "categories");
  fs.mkdirSync(productDir, { recursive: true });
  fs.mkdirSync(categoryDir, { recursive: true });

  const products = await db.product.findMany({
    include: { category: true },
    orderBy: { id: "asc" },
  });

  // 同分类内分配互不重复的 variant（配色 × 装饰），按 id 排序保证确定性
  const usedPerCategory = new Map<string, Set<number>>();
  const keepProductFiles = new Set<string>();
  for (const p of products) {
    const catKey = p.category?.slug ?? "__none__";
    const used = usedPerCategory.get(catKey) ?? new Set<number>();
    let variant = hashInt(p.id + p.name) % VARIANT_COUNT;
    let attempts = 0;
    while (used.has(variant) && attempts < VARIANT_COUNT) {
      variant = (variant + 1) % VARIANT_COUNT;
      attempts++;
    }
    used.add(variant);
    usedPerCategory.set(catKey, used);

    const fileName = `${p.id}.svg`;
    keepProductFiles.add(fileName);
    fs.writeFileSync(
      path.join(productDir, fileName),
      productSvg(p.name, p.category?.slug ?? null, variant)
    );
    if (shouldReplaceImages(p.images)) {
      await db.product.update({
        where: { id: p.id },
        data: { images: JSON.stringify([`/products/${fileName}`]) },
      });
    }
  }

  const categories = await db.category.findMany({ orderBy: { id: "asc" } });
  const keepCategoryFiles = new Set<string>();
  for (const c of categories) {
    const slug = safeSlug(c.slug);
    const fileName = `${slug}.svg`;
    keepCategoryFiles.add(fileName);
    fs.writeFileSync(
      path.join(categoryDir, fileName),
      categorySvg(slug)
    );
    if (shouldReplaceImage(c.image)) {
      await db.category.update({
        where: { id: c.id },
        data: { image: `/categories/${fileName}` },
      });
    }
  }

  pruneSvg(productDir, keepProductFiles);
  pruneSvg(categoryDir, keepCategoryFiles);

  // 自检：占位服务 URL 残留数（admin 手工填写的其他图片不算）
  const placeholderLeft =
    products.filter((p) => PLACEHOLDER_RE.test(p.images)).length +
    categories.filter((c) => c.image && PLACEHOLDER_RE.test(c.image)).length;

  return {
    products: products.length,
    categories: categories.length,
    placeholderLeft,
  };
}
