import { cn } from "@/lib/utils";

const badge = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border";

const typeConfig = {
  DEPOSIT:    { label: "Deposit",    cls: "bg-green-500/12 text-green-400 border-green-500/20" },
  WITHDRAWAL: { label: "Withdrawal", cls: "bg-red-500/12 text-red-400 border-red-500/20" },
  TRANSFER:   { label: "Transfer",   cls: "bg-blue-500/12 text-blue-400 border-blue-500/20" },
};

const shiftConfig = {
  OPEN:   { label: "Open",   cls: "bg-green-500/12 text-green-400 border-green-500/20" },
  CLOSED: { label: "Closed", cls: "bg-white/8 text-white/50 border-white/10" },
};

const floatConfig = {
  HEALTHY:  { label: "Healthy",  cls: "bg-green-500/12 text-green-400 border-green-500/20" },
  LOW:      { label: "Low",      cls: "bg-yellow-500/12 text-yellow-400 border-yellow-500/20" },
  CRITICAL: { label: "Critical", cls: "bg-red-500/12 text-red-400 border-red-500/20" },
};

type TransactionType = keyof typeof typeConfig;
type ShiftStatus = keyof typeof shiftConfig;
type FloatHealth = keyof typeof floatConfig;

export function TransactionBadge({ type }: { type: TransactionType }) {
  const config = typeConfig[type];
  return <span className={cn(badge, config.cls)}>{config.label}</span>;
}

export function ShiftBadge({ status }: { status: ShiftStatus }) {
  const config = shiftConfig[status];
  return <span className={cn(badge, config.cls)}>{config.label}</span>;
}

export function FloatBadge({ health }: { health: FloatHealth }) {
  const config = floatConfig[health];
  return <span className={cn(badge, config.cls)}>{config.label}</span>;
}
