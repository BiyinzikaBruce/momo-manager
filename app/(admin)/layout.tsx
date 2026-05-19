import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0D0D12]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-screen-xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
