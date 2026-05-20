"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";

const Schema = z.object({
  name:     z.string().min(1, "Name is required").max(100),
  country:  z.string().min(1, "Country is required"),
  city:     z.string().min(1, "City is required"),
  address:  z.string().max(200).optional(),
  currency: z.enum(["UGX", "KES", "TZS", "CDF"], { required_error: "Select a currency" }),
});
type FormData = z.infer<typeof Schema>;

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all";
const labelCls = "block text-xs font-medium text-white/60 mb-1.5";
const errorCls = "text-xs text-red-400 mt-1";

export default function NewBranchPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(Schema),
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create branch");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Branch created");
      qc.invalidateQueries({ queryKey: ["branches"] });
      router.push("/dashboard/branches");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="New Branch" breadcrumb="Branches">
        <Link href="/dashboard/branches">
          <Button variant="secondary" size="sm">Cancel</Button>
        </Link>
      </PageHeader>

      <GlassCard className="max-w-lg">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className={labelCls}>Branch Name</label>
            <input {...register("name")} placeholder="e.g. Kampala HQ" className={inputCls} />
            {errors.name && <p className={errorCls}>{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Country</label>
              <select {...register("country")} style={{ colorScheme: "dark" }} className={inputCls + " appearance-none bg-[#1c1c28]"}>
                <option value="">Select country</option>
                <option value="Uganda">Uganda</option>
                <option value="Kenya">Kenya</option>
                <option value="Tanzania">Tanzania</option>
                <option value="Congo DRC">Congo DRC</option>
              </select>
              {errors.country && <p className={errorCls}>{errors.country.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select {...register("currency")} style={{ colorScheme: "dark" }} className={inputCls + " appearance-none bg-[#1c1c28]"}>
                <option value="">Select currency</option>
                <option value="UGX">UGX — Ugandan Shilling</option>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="TZS">TZS — Tanzanian Shilling</option>
                <option value="CDF">CDF — Congolese Franc</option>
              </select>
              {errors.currency && <p className={errorCls}>{errors.currency.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>City</label>
            <input {...register("city")} placeholder="e.g. Kampala" className={inputCls} />
            {errors.city && <p className={errorCls}>{errors.city.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Address (optional)</label>
            <input {...register("address")} placeholder="Street address" className={inputCls} />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Creating…" : "Create Branch"}
          </Button>
        </form>
      </GlassCard>
    </>
  );
}
