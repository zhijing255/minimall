import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST() {
  try {
    await clearSession();

    return NextResponse.json({ message: "退出成功" });
  } catch (error) {
    console.error("退出登录错误:", error);
    return NextResponse.json(
      { error: "退出失败" },
      { status: 500 }
    );
  }
}
