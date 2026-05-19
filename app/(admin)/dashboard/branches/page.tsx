"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { SortableColumn } from "@/components/column-helpers";

type Branch = {
  id: string;
  name: string;
  country: string;
  city: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
};

const columns: ColumnDef<Branch, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableColumn column={column} title="Name" />,
    cell: ({ row }) => (
      <span className="font-medium text-white">{row.getValue("name")}</span>
    ),
  },
  {
    id: "location",
    header: "Location",
    cell: ({ row }) => (
      <span className="text-white/60">
        {row.original.city}, {row.original.country}
      </span>
    ),
  },
  {
    accessorKey: "currency",
    header: "Currency",
    cell: ({ row }) => (
      <span className="font-mono text-xs bg-white/8 px-2 py-0.5 rounded text-white/80">
        {row.getValue("currency")}
      </span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) =>
      row.getValue("isActive") ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-500/12 text-green-400 border border-green-500/20">
          Active
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/8 text-white/40 border border-white/10">
          Inactive
        </span>
      ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/dashboard/branches/${row.original.id}`}>
        <Button variant="ghost" size="sm" className="text-xs">
          <i className="ti ti-pencil text-[14px]" />
          Edit
        </Button>
      </Link>
    ),
  },
];

export default function BranchesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => fetch("/api/branches?limit=100").then((r) => r.json()),
  });

  const branches: Branch[] = data?.branches ?? [];

  return (
    <>
      <PageHeader title="Branches" breadcrumb="Admin">
        <Link href="/dashboard/branches/new">
          <Button size="sm">
            <i className="ti ti-plus text-[14px]" />
            New Branch
          </Button>
        </Link>
      </PageHeader>

      <GlassCard>
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-white/4 rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={branches}
            searchPlaceholder="Search branches..."
          />
        )}
      </GlassCard>
    </>
  );
}
