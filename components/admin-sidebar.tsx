"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notification-bell";

const navItems = [
  { href: "/dashboard",              label: "Dashboard",     icon: "ti-layout-dashboard" },
  { href: "/dashboard/float",        label: "Float",         icon: "ti-coin" },
  { href: "/dashboard/transactions", label: "Transactions",  icon: "ti-arrows-exchange" },
  { href: "/dashboard/shifts",       label: "Shifts",        icon: "ti-clock" },
  { href: "/dashboard/branches",     label: "Branches",      icon: "ti-building-store" },
  { href: "/dashboard/users",        label: "Users",         icon: "ti-users" },
  { href: "/dashboard/mobile-lines", label: "Mobile Lines",  icon: "ti-device-mobile" },
  { href: "/dashboard/reports",      label: "Reports",       icon: "ti-chart-bar" },
  { href: "/dashboard/settings",     label: "Settings",      icon: "ti-settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside
      className="flex flex-col h-full w-[240px] flex-shrink-0 border-r"
      style={{
        background: "#13131A",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Tech Power Africa"
            className="w-8 h-8 rounded-xl flex-shrink-0 object-cover"
          />
          <div>
            <p className="text-sm font-bold text-white leading-tight">MoMo Manager</p>
            <p className="text-[10px] text-white/40">Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
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
              <i
                className={cn(`ti ${item.icon} text-[18px]`, isActive ? "text-[#E040A0]" : "")}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t space-y-0.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1 px-1 pb-1">
          <NotificationBell />
        </div>
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
