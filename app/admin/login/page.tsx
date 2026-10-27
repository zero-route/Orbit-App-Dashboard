import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/guard";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  pass: "Password salah.",
  limit: "Terlalu banyak percobaan. Coba lagi 10 menit lagi.",
  config: "ADMIN_PASSWORD belum diisi di environment.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await isAdmin()) {
    redirect("/admin");
  }

  const params = await searchParams;
  const code = Array.isArray(params.e) ? params.e[0] : params.e;
  const message = code ? MESSAGES[code] : undefined;

  return (
    <main className="login">
      <h1>Orbit Admin</h1>
      {message ? <p className="err">{message}</p> : null}
      <form action={loginAction} className="inline">
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoComplete="current-password"
          required
        />
        <button type="submit" className="primary">
          Masuk
        </button>
      </form>
    </main>
  );
}
