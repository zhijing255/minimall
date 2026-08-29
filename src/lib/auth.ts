import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SESSION_COOKIE = "session";

// JWT Secret - 生产环境必须配置
function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("生产环境必须配置 JWT_SECRET 环境变量");
    }
    console.warn("⚠️ 警告: 使用默认 JWT_SECRET，仅限开发环境");
    return "dev-secret-key-not-for-production";
  }
  return secret;
}

function getJWTSecretKey() {
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
