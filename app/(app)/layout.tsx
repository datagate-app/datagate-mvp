import Sidebar from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { AppTopbar } from "@/components/app-topbar";

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
      <div className="dg-app flex min-h-screen flex-col md:flex-row">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />

          <main className="dg-content flex-1 p-4 md:p-6">{children}</main>

          <footer className="border-t border-[var(--dg-gray-200)] bg-white px-6 py-4">
            <div className="flex flex-col gap-3 text-sm text-[var(--dg-gray-500)] md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>© {currentYear}</span>
                <span>DataGate</span>
                <span className="text-[var(--dg-gray-400)]">•</span>
                <span>Wersja 0.4.1 MVP</span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <a href="#" className="transition hover:text-[var(--dg-navy)]">
                  Regulamin
                </a>

                <a href="#" className="transition hover:text-[var(--dg-navy)]">
                  Polityka prywatności
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </AuthGuard>
  );
}
