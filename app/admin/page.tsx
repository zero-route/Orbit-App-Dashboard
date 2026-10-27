import Link from "next/link";
import type { ReactNode } from "react";
import { AppError } from "@/lib/errors";
import {
  PLATFORM_LIST,
  listBlockedIds,
  listDevices,
  listKeys,
  listRequests,
  loadStats,
  platformFilter,
} from "@/lib/admin/data";
import { shortId, when } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/guard";
import {
  addKeyAction,
  blockAction,
  deleteKeyAction,
  keyStatusAction,
  logoutAction,
  unblockAction,
} from "./actions";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

const TABS = [
  { id: "requests", label: "Request" },
  { id: "devices", label: "Perangkat" },
  { id: "keys", label: "API Key" },
];

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function failure(error: unknown) {
  return error instanceof AppError ? error.message : "Gagal memuat data.";
}

async function requestsView(platform: string | undefined) {
  const [items, blocked] = await Promise.all([
    listRequests(platform),
    listBlockedIds(),
  ]);

  return (
    <>
      <div className="chips">
        <Link href="/admin?tab=requests" className={platform ? "chip" : "chip on"}>
          semua
        </Link>
        {PLATFORM_LIST.map((name) => (
          <Link
            key={name}
            href={`/admin?tab=requests&p=${name}`}
            className={platform === name ? "chip on" : "chip"}
          >
            {name}
          </Link>
        ))}
      </div>
      <p className="note">URL yang diunduh dalam 24 jam terakhir (maks. 200 terbaru).</p>
      {items.length === 0 ? <div className="empty">Belum ada request.</div> : null}
      {items.map((item) => (
        <div className="card" key={item.id}>
          <div className="row">
            <span className="badge">{item.platform || "-"}</span>
            <span>{when(item.createdAt)}</span>
          </div>
          <div className="url">{item.url}</div>
          <div className="row">
            <span className="mono">{shortId(item.deviceId)}</span>
            {blocked.has(item.deviceId) ? (
              <span className="bad">diblokir</span>
            ) : null}
          </div>
          {blocked.has(item.deviceId) ? null : (
            <form action={blockAction} className="inline">
              <input type="hidden" name="id" value={item.deviceId} />
              <input type="hidden" name="tab" value="requests" />
              <input type="text" name="reason" placeholder="Alasan (opsional)" />
              <button type="submit" className="danger">
                Blokir perangkat
              </button>
            </form>
          )}
        </div>
      ))}
    </>
  );
}

async function devicesView() {
  const items = await listDevices();

  return (
    <>
      <p className="note">200 perangkat terakhir aktif.</p>
      {items.length === 0 ? <div className="empty">Belum ada perangkat.</div> : null}
      {items.map((item) => (
        <div className="card" key={item.id}>
          <div className="row">
            <span className="badge">{item.plan}</span>
            <span className={item.blocked ? "bad" : "ok"}>
              {item.blocked ? "diblokir" : "aktif"}
            </span>
          </div>
          <div className="mono url">{item.id}</div>
          <div className="row">
            <span>
              {item.platform || "-"} {item.appVersion}
            </span>
            <span>terakhir {when(item.lastSeen)}</span>
          </div>
          {item.blocked && item.blockedReason ? (
            <div className="row bad">Alasan: {item.blockedReason}</div>
          ) : null}
          {item.blocked ? (
            <form action={unblockAction} className="inline">
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="tab" value="devices" />
              <button type="submit">Buka blokir</button>
            </form>
          ) : (
            <form action={blockAction} className="inline">
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="tab" value="devices" />
              <input type="text" name="reason" placeholder="Alasan (opsional)" />
              <button type="submit" className="danger">
                Blokir
              </button>
            </form>
          )}
        </div>
      ))}
    </>
  );
}

async function keysView() {
  const items = await listKeys();

  return (
    <>
      <form action={addKeyAction} className="card inline">
        <input type="text" name="label" placeholder="Label (mis. akun-2)" />
        <input type="password" name="key" placeholder="RapidAPI key" required />
        <button type="submit" className="primary">
          Tambah
        </button>
      </form>
      <p className="note">
        Key di environment Vercel (RAPIDAPI_KEYS) tidak tampil di sini dan tetap dipakai sebagai cadangan.
      </p>
      {items.length === 0 ? <div className="empty">Belum ada key di database.</div> : null}
      {items.map((item) => (
        <div className="card" key={item.id}>
          <div className="row">
            <span className="badge">{item.label || `key #${item.id}`}</span>
            <span className={item.status === "active" ? "ok" : "bad"}>{item.status}</span>
          </div>
          <div className="mono url">{item.masked}</div>
          <div className="row">
            <span>gagal: {item.failCount}</span>
            <span>dipakai {when(item.lastUsed)}</span>
          </div>
          {item.lastError ? <div className="row bad">{item.lastError}</div> : null}
          <form action={keyStatusAction} className="inline">
            <input type="hidden" name="id" value={String(item.id)} />
            <input
              type="hidden"
              name="status"
              value={item.status === "active" ? "disabled" : "active"}
            />
            <button type="submit">
              {item.status === "active" ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </form>
          <form action={deleteKeyAction} className="inline">
            <input type="hidden" name="id" value={String(item.id)} />
            <label>
              <input type="checkbox" name="confirm" value="yes" /> yakin
            </label>
            <button type="submit" className="danger">
              Hapus
            </button>
          </form>
        </div>
      ))}
    </>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin();

  const params = await searchParams;
  const tab = TABS.some((item) => item.id === one(params.tab)) ? one(params.tab)! : "requests";
  const platform = platformFilter(one(params.p));
  const notice = one(params.e);

  let stats = { devices: 0, blocked: 0, requests: 0, activeKeys: 0 };
  let content: ReactNode = null;
  let problem: string | undefined;

  try {
    stats = await loadStats();

    content =
      tab === "devices"
        ? await devicesView()
        : tab === "keys"
          ? await keysView()
          : await requestsView(platform);
  } catch (error) {
    problem = failure(error);
  }

  return (
    <main className="wrap">
      <div className="top">
        <h1>Orbit Admin</h1>
        <form action={logoutAction}>
          <button type="submit">Keluar</button>
        </form>
      </div>
      <div className="stats">
        <div className="stat">
          <b>{stats.devices}</b>
          <span>Perangkat</span>
        </div>
        <div className="stat">
          <b>{stats.blocked}</b>
          <span>Diblokir</span>
        </div>
        <div className="stat">
          <b>{stats.requests}</b>
          <span>Request 24 jam</span>
        </div>
        <div className="stat">
          <b>{stats.activeKeys}</b>
          <span>Key aktif (database)</span>
        </div>
      </div>
      <nav className="tabs">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`/admin?tab=${item.id}`}
            className={item.id === tab ? "tab on" : "tab"}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {notice ? <p className="err">{notice}</p> : null}
      {problem ? <p className="err">{problem}</p> : content}
    </main>
  );
}
