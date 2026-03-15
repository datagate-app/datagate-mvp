import Link from "next/link";
import Sidebar from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { UserMenu } from "@/components/user-menu";

export const metadata = {
  title: "DataGate",
  icons: {
    icon: "/favicon.svg",
  },
};

type Props = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: Props) {
  const currentYear = new Date().getFullYear();

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b bg-white px-6">
            <h1 className="text-lg font-semibold">DataGate</h1>

            <div className="flex items-center gap-4">
              <a
                href="/upload"
                className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
              >
                + Nowy raport
              </a>

              <UserMenu />
            </div>
          </header>

          <main className="flex-1 bg-gray-100 p-8">{children}</main>

          <footer className="border-t bg-white px-6 py-4">
            <div className="flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>© {currentYear}</span>
                <span>DataGate</span>
                <span className="text-gray-400">•</span>
                <span>Wersja 0.4.1 MVP</span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="#"
                  className="transition hover:text-gray-900"
                >
                  Regulamin
                </Link>

                <Link
                  href="#"
                  className="transition hover:text-gray-900"
                >
                  Polityka prywatności
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </AuthGuard>
  );
}