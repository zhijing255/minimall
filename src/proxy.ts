import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJWTSecretKey } from "@/lib/auth";

// 需要登录的路由
const protectedRoutes = ["/admin"];
// 已登录不能访问的路由（登录/注册页）
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 获取 session cookie
  const token = request.cookies.get("session")?.value;

  // 验证 token
  let isAuthenticated = false;
  let userRole = "";

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJWTSecretKey());
      isAuthenticated = true;
      userRole = (payload.role as string) || "";
    } catch {
      // token 无效
    }
  }

  // 保护需要登录的路由
  for (const route of protectedRoutes) {
    if (pathname.startsWith(route)) {
      if (!isAuthenticated) {
        const url = new URL("/login", request.url);
        url.searchParams.set("from", pathname);
        return NextResponse.redirect(url);
      }

      // 检查管理员权限
      if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  // 已登录用户不能访问登录/注册页
  for (const route of authRoutes) {
    if (pathname === route && isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 匹配所有路由，排除静态文件和 API
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
