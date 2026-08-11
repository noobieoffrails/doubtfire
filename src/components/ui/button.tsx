import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={["button", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export { Button };
