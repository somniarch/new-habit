import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
};

export function Button({ children, variant = "default", ...props }: ButtonProps) {
  const baseClasses = "px-4 py-2 rounded transition";
  const variantClasses =
    variant === "outline"
      ? "border border-black text-black hover:bg-gray-200"
      : "bg-black text-white hover:bg-gray-800";

  return (
    <button className={`${baseClasses} ${variantClasses}`} {...props}>
      {children}
    </button>
  );
}
