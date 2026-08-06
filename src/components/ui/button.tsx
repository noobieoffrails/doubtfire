import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-[var(--cobalt)] px-5 text-base font-bold text-white shadow-[var(--shadow-action)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-[var(--cobalt-deep)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

export { Button };
