import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[1.4rem] font-semibold tracking-[-0.01em] transition-all duration-200 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[var(--button-active-scale)]",
  {
    variants: {
      variant: {
        default:
          "bg-green-accent text-white border border-green-accent hover:opacity-90",
        outline:
          "bg-transparent text-green-accent border border-green-accent hover:bg-green-accent/5",
        secondary:
          "bg-white text-green-accent border border-white hover:bg-white/90",
        dark: "bg-black text-white border border-black hover:opacity-90",
        "dark-outline":
          "bg-transparent text-[var(--text-black)] border border-[var(--text-black)] hover:bg-black/5",
        "on-dark":
          "bg-transparent text-white border border-white hover:bg-white/10",
        destructive:
          "bg-destructive text-white border border-destructive hover:opacity-90",
        ghost: "hover:bg-accent hover:text-accent-foreground border-transparent",
        link: "text-green-accent underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default: "h-auto px-4 py-[7px] rounded-[50px]",
        sm: "h-auto px-3 py-1.5 text-[1.3rem] rounded-[50px]",
        lg: "h-auto px-10 py-[14px] text-[1.6rem] rounded-[50px]",
        icon: "size-14 rounded-full",
        frap: "size-14 rounded-full shadow-[var(--frap-shadow)]",
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
