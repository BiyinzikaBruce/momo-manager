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
  country:  z.string().min(1),
  city:     z.string().min(1),
  address:  z.string().max(200).optional(),
  currency: z.enum(["UGX", "KES", "TZS", "CDF"]),
  isActive: z.boolean(),
});
type FormData = z.infer<typeof Schema>;

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all";
const labelCls = "block text-xs font-medium text-white/60 mb-1.5";
const errorCls = "text-xs text-red-400 mt-1";

export default function EditBranchPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: branch, isLoading } = useQuery({
    queryKey: ["branch", id],
    queryFn: () => fetch(`/api/branches/${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(Schema),
  });

  useEffect(() => {
    if (branch && !branch.error) {
      reset({
        name:     branch.name,
        country:  branch.country,
        city:     branch.city,
        address:  branch.address ?? "",
        currency: branch.currency,
        isActive: branch.isActive,
      });
    }
  }, [branch, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/branches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Branch updated");
      qc.invalidateQueries({ queryKey: ["branches"] });
      qc.invalidateQueries({ queryKey: ["branch", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <>
        <PageHeader title="Edit Branch" breadcrumb="Branches" />
        <GlassCard className="max-w-lg">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-white/4 rounded-[10px] animate-pulse" />
            ))}
          </div>
        </GlassCard>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Edit Branch" breadcrumb="Branches">
        <Link href="/dashboard/branches">
          <Button variant="secondary" size="sm">← Back</Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div>
              <label className={labelCls}>Branch Name</label>
              <input {...register("name")} className={inputCls} />
              {errors.name && <p className={errorCls}>{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Country</label>
                <select {...register("country")} className={inputCls + " appearance-none"}>
                  <option value="Uganda">Uganda</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Congo DRC">Congo DRC</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <select {...register("currency")} className={inputCls + " appearance-none"}>
                  <option value="UGX">UGX</option>
                  <option value="KES">KES</option>
                  <option value="TZS">TZS</option>
                  <option value="CDF">CDF</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>City</label>
              <input {...register("city")} className={inputCls} />
              {errors.city && <p className={errorCls}>{errors.city.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Address</label>
              <input {...register("address")} className={inputCls} />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="w-4 h-4 accent-[#E040A0]"
              />
              <label htmlFor="isActive" className="text-sm text-white/70">
                Branch is active
              </label>
            </div>

            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </GlassCard>

        {branch && !branch.error && (
          <GlassCard>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Stats</h3>
            <div className="space-y-3">
              {[
                { label: "Users", value: branch._count?.users ?? 0, icon: "ti-users" },
                { label: "Shifts", value: branch._count?.shifts ?? 0, icon: "ti-clock" },
                { label: "Transactions", value: branch._count?.transactions ?? 0, icon: "ti-arrows-exchange" },
                { label: "Mobile Lines", value: branch.mobileLines?.length ?? 0, icon: "ti-device-mobile" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <i className={`ti ${stat.icon} text-[#E040A0] text-[15px]`} />
                    <span className="text-sm text-white/60">{stat.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </>
  );
}
