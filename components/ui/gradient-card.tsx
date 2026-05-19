import { cn } from "@/lib/utils";

interface GradientCardProps {
  label: string;
  value: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function GradientCard({ label, value, subtitle, className, children }: GradientCardProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-[20px] p-6", className)}
      style={{ background: "linear-gradient(135deg, #E040A0 0%, #FF6B35 100%)" }}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">{label}</p>
      <p className="text-4xl font-extrabold text-white tracking-tight">{value}</p>
      {subtitle && <p className="text-xs text-white/60 mt-2">{subtitle}</p>}
      {children}
      {/* Glow overlay */}
      <div
        className="absolute inset-0 rounded-[20px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(255,255,255,0.12) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-white/8 bg-white/4 backdrop-blur-md p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, trend, trendUp, icon, className }: StatCardProps) {
  return (
    <div className={cn("rounded-[16px] border border-white/8 bg-[#13131A] p-5", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-white/50">{label}</span>
        {icon && (
          <div className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <p className="text-3xl font-extrabold text-white">{value}</p>
      {trend && (
        <p className={cn("text-xs mt-1", trendUp ? "text-green-400" : "text-red-400")}>
          {trend}
        </p>
      )}
    </div>
  );
}
