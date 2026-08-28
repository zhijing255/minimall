// 此文件已弃用，改用自定义认证方案
// 新的 API 路由：
// - POST /api/auth/register - 注册
// - POST /api/auth/login - 登录
// - GET /api/auth/me - 获取当前用户
// - POST /api/auth/logout - 退出登录
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "请使用新的认证 API" },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "请使用新的认证 API" },
    { status: 410 }
  );
}
