"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";

const Schema = z.object({
  name:     z.string().min(1, "Name is required").max(100),
  email:    z.string().email("Valid email required"),
  password: z.string().min(8, "Minimum 8 characters"),
  role:     z.enum(["ADMIN", "MANAGER", "CASHIER"]),
  branchId: z.string().optional().nullable(),
});
type FormData = z.infer<typeof Schema>;

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all";
const labelCls = "block text-xs font-medium text-white/60 mb-1.5";
const errorCls = "text-xs text-red-400 mt-1";

export default function NewUserPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => fetch("/api/branches?limit=100").then((r) => r.json()),
  });
  const branches = branchesData?.branches ?? [];

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: { role: "CASHIER" },
  });

  const role = watch("role");

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, branchId: data.branchId || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create user");
      return res.json();
    },
    onSuccess: () => {
      toast.success("User created");
      qc.invalidateQueries({ queryKey: ["users"] });
      router.push("/dashboard/users");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="New User" breadcrumb="Users">
        <Link href="/dashboard/users">
          <Button variant="secondary" size="sm">Cancel</Button>
        </Link>
      </PageHeader>

      <GlassCard className="max-w-lg">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input {...register("name")} placeholder="e.g. Jane Akello" className={inputCls} />
            {errors.name && <p className={errorCls}>{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Email</label>
            <input {...register("email")} type="email" placeholder="jane@example.com" className={inputCls} />
            {errors.email && <p className={errorCls}>{errors.email.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Password</label>
            <input {...register("password")} type="password" placeholder="Min 8 characters" className={inputCls} />
            {errors.password && <p className={errorCls}>{errors.password.message}</p>}
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

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Creating…" : "Create User"}
          </Button>
        </form>
      </GlassCard>
    </>
  );
}
