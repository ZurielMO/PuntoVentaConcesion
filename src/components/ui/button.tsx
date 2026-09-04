import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[1.55rem] font-semibold tracking-[-0.01em] transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-green-accent text-white border border-green-accent shadow-sm hover:bg-[var(--green-secondary)] hover:border-[var(--green-secondary)]",
        outline:
          "bg-transparent text-green-accent border-[1.5px] border-green-accent hover:bg-green-soft/60",
        secondary:
          "bg-[var(--brand-yellow)] text-[var(--leon-black)] border border-[var(--brand-yellow)] hover:brightness-95",
        dark: "bg-[var(--green-dark)] text-white border border-[var(--green-dark)] hover:opacity-90",
        "dark-outline":
          "bg-transparent text-[var(--text-black)] border border-[var(--text-black)] hover:bg-black/5",
        "on-dark":
          "bg-white/15 text-white border border-white/80 hover:bg-white/25",
        destructive:
          "bg-destructive text-white border border-destructive hover:opacity-90",
        ghost: "hover:bg-accent hover:text-accent-foreground border-transparent",
        link: "text-green-accent underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default: "h-[5.2rem] min-h-[52px] px-5 rounded-[12px]",
        sm: "h-[4.4rem] min-h-[44px] px-4 text-[1.4rem] rounded-[10px]",
        lg: "h-[5.8rem] min-h-[56px] px-8 text-[1.7rem] rounded-[12px]",
        icon: "size-[5.2rem] min-h-[52px] min-w-[52px] rounded-[12px]",
        frap: "size-[6.4rem] rounded-full shadow-[var(--frap-shadow)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
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
