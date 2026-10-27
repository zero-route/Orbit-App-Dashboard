import type { ReactNode } from "react";
import { adminCss } from "@/lib/admin/style";

export const metadata = {
  title: "Orbit Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: adminCss }} />
      {children}
    </>
  );
}
