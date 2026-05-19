"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/manager/dashboard",     label: "Dashboard",    icon: "ti-layout-dashboard" },
  { href: "/manager/float",         label: "Float",        icon: "ti-coin" },
  { href: "/manager/transactions",  label: "Transactions", icon: "ti-arrows-exchange" },
  { href: "/manager/shifts",        label: "Shifts",       icon: "ti-clock" },
  { href: "/manager/reports",       label: "Reports",      icon: "ti-chart-bar" },
];

export function ManagerSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside
      className="flex flex-col h-full w-[240px] flex-shrink-0 border-r"
      style={{ background: "#13131A", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #E040A0 0%, #FF6B35 100%)" }}
          >
            <span className="text-white font-extrabold text-sm">M</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">MoMo Manager</p>
            <p className="text-[10px] text-white/40">Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/manager/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "text-white border border-pink-500/20"
                  : "text-white/55 hover:bg-white/5 hover:text-white/85 border border-transparent"
              )}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(224,64,160,0.15), rgba(255,107,53,0.10))",
                    }
                  : {}
              }
            >
              <i className={cn(`ti ${item.icon} text-[18px]`, isActive ? "text-[#E040A0]" : "")} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-[13px] font-medium text-white/55 hover:bg-white/5 hover:text-white/85 transition-all duration-150"
        >
          <i className="ti ti-logout text-[18px]" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
