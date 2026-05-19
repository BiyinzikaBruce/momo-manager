"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { SortableColumn } from "@/components/column-helpers";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "CASHIER";
  isActive: boolean;
  createdAt: string;
  branch: { name: string; country: string } | null;
};

const roleBadge = {
  ADMIN:   "bg-purple-500/15 text-purple-400 border-purple-500/20",
  MANAGER: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  CASHIER: "bg-green-500/15 text-green-400 border-green-500/20",
};

const columns: ColumnDef<User, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableColumn column={column} title="Name" />,
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-white">{row.getValue("name")}</p>
        <p className="text-xs text-white/40">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as keyof typeof roleBadge;
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleBadge[role] ?? ""}`}>
          {role}
        </span>
      );
    },
  },
  {
    accessorKey: "branch",
    header: "Branch",
    cell: ({ row }) => (
      <span className="text-white/60 text-sm">
        {row.original.branch?.name ?? <span className="text-white/25 italic">No branch</span>}
      </span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) =>
      row.getValue("isActive") ? (
        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-500/12 text-green-400 border border-green-500/20">
          Active
        </span>
      ) : (
        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/8 text-white/40 border border-white/10">
          Inactive
        </span>
      ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/dashboard/users/${row.original.id}`}>
        <Button variant="ghost" size="sm" className="text-xs">
          <i className="ti ti-pencil text-[14px]" /> Edit
        </Button>
      </Link>
    ),
  },
];

export default function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users?limit=100").then((r) => r.json()),
  });

  const users: User[] = data?.users ?? [];

  return (
    <>
      <PageHeader title="Users" breadcrumb="Admin">
        <Link href="/dashboard/users/new">
          <Button size="sm">
            <i className="ti ti-plus text-[14px]" /> New User
          </Button>
        </Link>
      </PageHeader>

      <GlassCard>
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-white/4 rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            searchPlaceholder="Search users..."
          />
        )}
      </GlassCard>
    </>
  );
}
