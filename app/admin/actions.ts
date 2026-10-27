"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";
import {
  addKey,
  removeKey,
  setBlocked,
  setKeyStatus,
} from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import {
  ADMIN_COOKIE,
  adminConfigured,
  clearLoginFailures,
  createSession,
  loginAllowed,
  passwordOk,
  registerLoginFailure,
} from "@/lib/admin/session";

function field(form: FormData, name: string) {
  const value = form.get(name);

  return typeof value === "string" ? value : "";
}

async function clientIp() {
  const list = await headers();

  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function back(tab: string, error?: string): never {
  revalidatePath("/admin");

  return redirect(`/admin?tab=${tab}${error ? `&e=${encodeURIComponent(error)}` : ""}`);
}

function messageOf(error: unknown) {
  return error instanceof AppError ? error.message : "Aksi gagal, coba lagi.";
}

export async function loginAction(form: FormData): Promise<void> {
  if (!adminConfigured()) {
    redirect("/admin/login?e=config");
  }

  const ip = await clientIp();

  if (!loginAllowed(ip)) {
    redirect("/admin/login?e=limit");
  }

  if (!passwordOk(field(form, "password"))) {
    registerLoginFailure(ip);
    redirect("/admin/login?e=pass");
  }

  clearLoginFailures(ip);

  const session = createSession();
  const jar = await cookies();

  jar.set(ADMIN_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: session.maxAge,
  });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();

  jar.delete({ name: ADMIN_COOKIE, path: "/admin" });

  redirect("/admin/login");
}

export async function blockAction(form: FormData): Promise<void> {
  await requireAdmin();

  const tab = field(form, "tab") || "requests";

  try {
    await setBlocked(field(form, "id"), true, field(form, "reason"));
  } catch (error) {
    back(tab, messageOf(error));
  }

  back(tab);
}

export async function unblockAction(form: FormData): Promise<void> {
  await requireAdmin();

  const tab = field(form, "tab") || "devices";

  try {
    await setBlocked(field(form, "id"), false, "");
  } catch (error) {
    back(tab, messageOf(error));
  }

  back(tab);
}

export async function addKeyAction(form: FormData): Promise<void> {
  await requireAdmin();

  try {
    await addKey(field(form, "label"), field(form, "key"));
  } catch (error) {
    back("keys", messageOf(error));
  }

  back("keys");
}

export async function keyStatusAction(form: FormData): Promise<void> {
  await requireAdmin();

  const next = field(form, "status") === "active" ? "active" : "disabled";

  try {
    await setKeyStatus(field(form, "id"), next);
  } catch (error) {
    back("keys", messageOf(error));
  }

  back("keys");
}

export async function deleteKeyAction(form: FormData): Promise<void> {
  await requireAdmin();

  if (field(form, "confirm") !== "yes") {
    back("keys", "Centang konfirmasi dulu sebelum menghapus.");
  }

  try {
    await removeKey(field(form, "id"));
  } catch (error) {
    back("keys", messageOf(error));
  }

  back("keys");
}
