"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";

const Schema = z.object({
  name:     z.string().min(1).max(100),
  role:     z.enum(["ADMIN", "MANAGER", "CASHIER"]),
  branchId: z.string().optional().nullable(),
  isActive: z.boolean(),
});
type FormData = z.infer<typeof Schema>;

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all";
const labelCls = "block text-xs font-medium text-white/60 mb-1.5";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users?limit=100").then((r) => r.json()),
  });
  const user = usersData?.users?.find((u: { id: string }) => u.id === id);

  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => fetch("/api/branches?limit=100").then((r) => r.json()),
  });
  const branches = branchesData?.branches ?? [];

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(Schema),
  });

  const role = watch("role");

  useEffect(() => {
    if (user) {
      reset({
        name:     user.name,
        role:     user.role,
        branchId: user.branchId ?? "",
        isActive: user.isActive,
      });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, branchId: data.branchId || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("User updated");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="Edit User" breadcrumb="Users">
        <Link href="/dashboard/users">
          <Button variant="secondary" size="sm">← Back</Button>
        </Link>
      </PageHeader>

      <GlassCard className="max-w-lg">
        {!user ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-white/4 rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="mb-4 p-3 bg-white/4 rounded-[10px]">
              <p className="text-xs text-white/40 mb-0.5">Email (read-only)</p>
              <p className="text-sm text-white">{user.email}</p>
            </div>

            <div>
              <label className={labelCls}>Full Name</label>
              <input {...register("name")} className={inputCls} />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Role</label>
              <select {...register("role")} style={{ colorScheme: "dark" }} className={inputCls + " appearance-none bg-[#1c1c28]"}>
                <option value="CASHIER">Cashier</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {role !== "ADMIN" && (
              <div>
                <label className={labelCls}>Branch</label>
                <select {...register("branchId")} style={{ colorScheme: "dark" }} className={inputCls + " appearance-none bg-[#1c1c28]"}>
                  <option value="">No branch assigned</option>
                  {branches.map((b: { id: string; name: string; country: string }) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.country})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="w-4 h-4 accent-[#E040A0]"
              />
              <label htmlFor="isActive" className="text-sm text-white/70">
                Account is active
              </label>
            </div>

            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        )}
      </GlassCard>
    </>
  );
}
