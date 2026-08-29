import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  search: string;
  category: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  search,
  category,
}: PaginationProps) {
  // 构建分页链接
  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (page > 1) params.set("page", page.toString());
    return `/?${params.toString()}`;
  };

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <nav className="mt-12 flex justify-center">
      <ul className="flex items-center space-x-2">
        {/* 上一页 */}
        {currentPage > 1 && (
          <li>
            <Link
              href={buildHref(currentPage - 1)}
              className="px-3 py-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              上一页
            </Link>
          </li>
        )}

        {/* 页码 */}
        {getPageNumbers().map((pageNum, index) => (
          <li key={index}>
            {pageNum === "..." ? (
              <span className="px-3 py-2 text-gray-400">...</span>
            ) : (
              <Link
                href={buildHref(pageNum as number)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === pageNum
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:text-indigo-600 hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </Link>
            )}
          </li>
        ))}

        {/* 下一页 */}
        {currentPage < totalPages && (
          <li>
            <Link
              href={buildHref(currentPage + 1)}
              className="px-3 py-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              下一页
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
