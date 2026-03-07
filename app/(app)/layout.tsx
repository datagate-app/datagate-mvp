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
        </div>
      </div>
    </AuthGuard>
  );
}