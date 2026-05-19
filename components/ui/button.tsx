import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold text-sm transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "rounded-full text-white bg-gradient-to-r from-[#E040A0] to-[#FF6B35] hover:opacity-90 shadow-lg",
        secondary:
          "rounded-full text-white/80 border border-white/10 bg-white/5 hover:bg-white/10",
        ghost:
          "rounded-[10px] text-white/55 hover:bg-white/5 hover:text-white/85",
        destructive:
          "rounded-full text-white bg-red-500/80 hover:bg-red-500",
        outline:
          "rounded-[12px] border border-white/10 bg-transparent text-white/80 hover:bg-white/5",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-xs",
        lg: "px-8 py-4 text-base",
        icon: "w-9 h-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
