"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

function CategoryFilterInner({
  categories,
  selectedCategory,
}: {
  categories: Category[];
  selectedCategory: string;
}) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2">
        {/* 全部分类 */}
        <Link
          href={search ? `/?search=${search}` : "/"}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !selectedCategory
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          全部
        </Link>

        {/* 各分类 */}
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={
              search
                ? `/?category=${cat.slug}&search=${search}`
                : `/?category=${cat.slug}`
            }
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.slug
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.name}
            <span className="ml-1 text-xs opacity-70">({cat.productCount})</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function CategoryFilter({
  categories,
  selectedCategory,
}: {
  categories: Category[];
  selectedCategory: string;
}) {
  return (
    <Suspense fallback={<div className="mb-8 h-10 bg-gray-100 rounded-lg animate-pulse" />}>
      <CategoryFilterInner
        categories={categories}
        selectedCategory={selectedCategory}
      />
    </Suspense>
  );
}
