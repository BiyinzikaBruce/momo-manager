import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full rounded-[12px] border border-white/10 bg-white/5",
        "px-4 py-3 text-sm text-white placeholder:text-white/30",
        "focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-150",
        className
      )}
      {...props}
    />
  );
}

export { Input };
