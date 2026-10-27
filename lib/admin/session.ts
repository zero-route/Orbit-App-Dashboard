import { createHash, createHmac, timingSafeEqual } from "crypto";
import { AppError } from "../errors";

export const ADMIN_COOKIE = "orbit_admin";
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

const LOGIN_WINDOW_MS = 10 * 60_000;
const LOGIN_MAX_FAILS = 5;

const fails = new Map<string, number[]>();

function secret() {
  const value =
    process.env.ADMIN_SESSION_SECRET?.trim() || process.env.SIGNING_SECRET?.trim();

  if (!value) {
    throw new AppError("ADMIN_SESSION_SECRET belum dikonfigurasi di environment.", 500);
  }

  return value;
}

function sign(expires: number) {
  return createHmac("sha256", secret())
    .update(`admin\n${expires}`)
    .digest("base64url");
}

function fingerprint(value: string) {
  return createHash("sha256").update(value).digest();
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

export function passwordOk(input: string) {
  const expected = process.env.ADMIN_PASSWORD?.trim();

  if (!expected || !input) {
    return false;
  }

  return timingSafeEqual(fingerprint(input), fingerprint(expected));
}

export function createSession(now = Date.now()) {
  const expires = Math.floor(now / 1000) + SESSION_TTL_SECONDS;

  return { value: `${expires}.${sign(expires)}`, maxAge: SESSION_TTL_SECONDS };
}

export function verifySession(value: string | undefined, now = Date.now()) {
  if (!value) {
    return false;
  }

  const [issued, signature] = value.split(".");
  const expires = Number(issued);

  if (!Number.isFinite(expires) || !signature) {
    return false;
  }

  if (expires * 1000 < now) {
    return false;
  }

  try {
    const expected = Buffer.from(sign(expires));
    const received = Buffer.from(signature);

    return expected.length === received.length && timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

export function loginAllowed(ip: string, now = Date.now()) {
  const recent = (fails.get(ip) ?? []).filter((time) => now - time < LOGIN_WINDOW_MS);

  fails.set(ip, recent);

  return recent.length < LOGIN_MAX_FAILS;
}

export function registerLoginFailure(ip: string, now = Date.now()) {
  const recent = (fails.get(ip) ?? []).filter((time) => now - time < LOGIN_WINDOW_MS);

  recent.push(now);

  if (fails.size > 2_000) {
    fails.clear();
  }

  fails.set(ip, recent);
}

export function clearLoginFailures(ip: string) {
  fails.delete(ip);
}
