import { cn } from "@/lib/utils";
import { mobileLineLabel } from "@/lib/utils";

type MobileOperator =
  | "MTN_UG" | "AIRTEL_UG"
  | "VODACOM_TZ" | "TIGO_TZ"
  | "SAFARICOM_KE" | "AIRTEL_KE"
  | "ORANGE_CD" | "VODACOM_CD" | "AIRTEL_CD";

const lineColors: Record<MobileOperator, { bg: string; text: string; dot: string }> = {
  MTN_UG:      { bg: "bg-yellow-400/15", text: "text-yellow-400", dot: "#FFCC00" },
  AIRTEL_UG:   { bg: "bg-red-500/15",    text: "text-red-400",    dot: "#FF0000" },
  VODACOM_TZ:  { bg: "bg-red-600/15",    text: "text-red-400",    dot: "#E60026" },
  TIGO_TZ:     { bg: "bg-blue-600/15",   text: "text-blue-400",   dot: "#003DA5" },
  SAFARICOM_KE:{ bg: "bg-green-500/15",  text: "text-green-400",  dot: "#4CAF50" },
  AIRTEL_KE:   { bg: "bg-red-500/15",    text: "text-red-400",    dot: "#FF0000" },
  ORANGE_CD:   { bg: "bg-orange-500/15", text: "text-orange-400", dot: "#FF6600" },
  VODACOM_CD:  { bg: "bg-red-600/15",    text: "text-red-400",    dot: "#E60026" },
  AIRTEL_CD:   { bg: "bg-red-500/15",    text: "text-red-400",    dot: "#FF0000" },
};

interface MobileLineBadgeProps {
  operator: MobileOperator;
  className?: string;
}

export function MobileLineBadge({ operator, className }: MobileLineBadgeProps) {
  const colors = lineColors[operator];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        colors.bg,
        colors.text,
        className
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: colors.dot }}
      />
      {mobileLineLabel[operator] ?? operator}
    </span>
  );
}
