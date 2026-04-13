import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/constants";

function getAdminEnv() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;

  if (!email) {
    throw new Error("ADMIN_EMAIL fehlt");
  }

  if (!password) {
    throw new Error("ADMIN_PASSWORD fehlt");
  }

  if (!sessionSecret) {
    throw new Error("ADMIN_SESSION_SECRET fehlt");
  }

  return {
    email,
    password,
    sessionSecret,
  };
}

function signSessionValue(value: string, secret: string) {
  const signature = createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${signature}`;
}

function verifySessionValue(rawValue: string, secret: string) {
  const [value, signature] = rawValue.split(".");

  if (!value || !signature) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(value).digest("hex");

  if (signature.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function createAdminSession(email: string) {
  const { sessionSecret } = getAdminEnv();
  const cookieStore = await cookies();
  const payload = `${email}:${Date.now()}`;
  const signed = signSessionValue(payload, sessionSecret);

  cookieStore.set(ADMIN_SESSION_COOKIE, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function isAdminAuthenticated() {
  try {
    const { sessionSecret } = getAdminEnv();
    const cookieStore = await cookies();
    const raw = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (!raw) {
      return false;
    }

    return verifySessionValue(raw, sessionSecret);
  } catch {
    return false;
  }
}

export function validateAdminCredentials(email: string, password: string) {
  const env = getAdminEnv();
  return email === env.email && password === env.password;
}
