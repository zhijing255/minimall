import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 公开页面
  const publicPages = ["/", "/login", "/register"];
  const isPublicPage = publicPages.some(
    (page) => pathname === page || pathname.startsWith("/product/")
  );

  // API 公开接口
  const publicApis = ["/api/auth", "/api/products"];
  const isPublicApi = publicApis.some((api) => pathname.startsWith(api));

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  // 未登录用户重定向到登录页
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 后台管理需要管理员权限
  if (pathname.startsWith("/admin") && req.auth.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
