import { AppError } from "../errors";
import { forgetDevice } from "../device/guard";
import { isDeviceId } from "../device/token";
import {
  sbCount,
  sbDelete,
  sbInsert,
  sbPatch,
  sbSelect,
} from "../supabase/rest";

export type RequestItem = {
  id: number;
  deviceId: string;
  url: string;
  platform: string;
  createdAt: string;
};

export type DeviceItem = {
  id: string;
  createdAt: string;
  lastSeen: string;
  platform: string;
  appVersion: string;
  blocked: boolean;
  blockedReason: string;
  plan: string;
};

export type KeyItem = {
  id: number;
  label: string;
  masked: string;
  status: string;
  failCount: number;
  lastError: string;
  lastUsed: string;
  createdAt: string;
};

export type Stats = {
  devices: number;
  blocked: number;
  requests: number;
  activeKeys: number;
};

const PLATFORMS = ["tiktok", "instagram", "pinterest", "x", "youtube", "threads", "spotify"];

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function whole(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function maskKey(value: string) {
  return value.length <= 10 ? "••••" : `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function platformFilter(value: string | undefined) {
  return value && PLATFORMS.includes(value) ? value : undefined;
}

export const PLATFORM_LIST = PLATFORMS;

export async function listRequests(platform?: string): Promise<RequestItem[]> {
  const filter = platformFilter(platform);

  const rows = await sbSelect(
    "requests",
    `?select=id,device_id,url,platform,created_at&order=created_at.desc&limit=200${
      filter ? `&platform=eq.${filter}` : ""
    }`
  );

  return rows.map((row) => ({
    id: whole(row.id),
    deviceId: text(row.device_id),
    url: text(row.url),
    platform: text(row.platform),
    createdAt: text(row.created_at),
  }));
}

export async function listDevices(): Promise<DeviceItem[]> {
  const rows = await sbSelect(
    "devices",
    "?select=id,created_at,last_seen,platform,app_version,blocked,blocked_reason,plan&order=last_seen.desc&limit=200"
  );

  return rows.map((row) => ({
    id: text(row.id),
    createdAt: text(row.created_at),
    lastSeen: text(row.last_seen),
    platform: text(row.platform),
    appVersion: text(row.app_version),
    blocked: row.blocked === true,
    blockedReason: text(row.blocked_reason),
    plan: text(row.plan) || "free",
  }));
}

export async function listBlockedIds(): Promise<Set<string>> {
  const rows = await sbSelect("devices", "?select=id&blocked=eq.true&limit=500");

  return new Set(rows.map((row) => text(row.id)));
}

export async function listKeys(): Promise<KeyItem[]> {
  const rows = await sbSelect(
    "api_keys",
    "?select=id,label,key,status,fail_count,last_error,last_used,created_at&order=id.asc&limit=200"
  );

  return rows.map((row) => ({
    id: whole(row.id),
    label: text(row.label),
    masked: maskKey(text(row.key)),
    status: text(row.status) || "active",
    failCount: whole(row.fail_count),
    lastError: text(row.last_error),
    lastUsed: text(row.last_used),
    createdAt: text(row.created_at),
  }));
}

export async function loadStats(): Promise<Stats> {
  const [devices, blocked, requests, activeKeys] = await Promise.all([
    sbCount("devices", "?select=id"),
    sbCount("devices", "?select=id&blocked=eq.true"),
    sbCount("requests", "?select=id"),
    sbCount("api_keys", "?select=id&status=eq.active"),
  ]);

  return { devices, blocked, requests, activeKeys };
}

export async function setBlocked(id: string, blocked: boolean, reason: string) {
  if (!isDeviceId(id)) {
    throw new AppError("ID perangkat tidak valid.", 400);
  }

  await sbPatch("devices", `?id=eq.${id}`, {
    blocked,
    blocked_reason: blocked ? reason.trim().slice(0, 200) || null : null,
  });

  forgetDevice(id);
}

export async function addKey(label: string, key: string) {
  const cleanKey = key.trim();

  if (cleanKey.length < 16 || /\s/.test(cleanKey)) {
    throw new AppError("Format key tidak valid.", 400);
  }

  await sbInsert("api_keys", {
    label: label.trim().slice(0, 60) || null,
    key: cleanKey,
    status: "active",
  });
}

function keyId(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError("ID key tidak valid.", 400);
  }

  return parsed;
}

export async function setKeyStatus(id: string, status: "active" | "disabled") {
  await sbPatch("api_keys", `?id=eq.${keyId(id)}`, {
    status,
    fail_count: 0,
    last_error: null,
  });
}

export async function removeKey(id: string) {
  await sbDelete("api_keys", `?id=eq.${keyId(id)}`);
}
