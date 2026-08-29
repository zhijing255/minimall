"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function SearchBarInner({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(defaultValue);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.delete("page"); // 搜索时重置到第一页
    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="mb-8">
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索商品..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          搜索
        </button>
      </div>
    </form>
  );
}

export default function SearchBar({ defaultValue }: { defaultValue: string }) {
  return (
    <Suspense fallback={<div className="mb-8 h-14 bg-gray-100 rounded-lg animate-pulse" />}>
      <SearchBarInner defaultValue={defaultValue} />
    </Suspense>
  );
}
