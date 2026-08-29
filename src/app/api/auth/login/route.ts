import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 速率限制
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimitResult = loginRateLimit(ip);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "登录尝试次数过多，请稍后再试" },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: "请填写邮箱和密码" },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 统一错误提示（不暴露用户是否存在）
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 设置 Session
    await setSession(user.id, user.role);

    return NextResponse.json({
      message: "登录成功",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        vipLevel: user.vipLevel,
      },
    });
  } catch (error) {
    console.error("登录错误:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
