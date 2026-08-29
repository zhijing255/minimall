import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "./prisma";

const SESSION_COOKIE = "session";

// JWT Secret - 生产环境必须配置，开发环境自动生成
let devSecret: string | null = null;

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("生产环境必须配置 JWT_SECRET 环境变量");
  }

  // 开发环境：生成并缓存随机密钥（重启后失效，Session 也会失效）
  if (!devSecret) {
    devSecret = crypto.randomBytes(32).toString("hex");
    console.warn("⚠️ 未配置 JWT_SECRET，已自动生成随机密钥（仅限开发环境）");
  }
  return devSecret;
}

export function getJWTSecretKey() {
  return new TextEncoder().encode(getJWTSecret());
}

// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// 验证密码
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 设置 Session（写入 httpOnly Cookie）
export async function setSession(userId: string, role: string) {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJWTSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 天
    path: "/",
  });
}

// 获取 Session（从 Cookie 读取）
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJWTSecretKey());
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}

// 获取当前用户完整信息
export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      vipLevel: true,
      totalSpent: true,
      createdAt: true,
    },
  });

  return user;
}

// 清除 Session（退出登录）
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// 要求管理员权限
export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "请先登录", status: 401 };
  }

  if (user.role !== "ADMIN") {
    return { error: "无管理员权限", status: 403 };
  }

  return { user };
}
