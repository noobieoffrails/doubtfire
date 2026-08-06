import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] px-5 text-base font-bold transition-[background-color,box-shadow,transform] duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-100",
  {
    variants: {
      variant: {
        primary: "bg-[var(--cobalt)] text-white shadow-[var(--shadow-action)] hover:bg-[var(--cobalt-deep)] active:translate-y-px",
        quiet: "bg-white text-[var(--ink)]",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ asChild = false, className, variant, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return <Component className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export { Button, buttonVariants };
