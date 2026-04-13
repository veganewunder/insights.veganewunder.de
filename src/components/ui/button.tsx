import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    variant?: "primary" | "secondary";
  }
>;

export function Button({
  className,
  asChild,
  variant = "primary",
  ...props
}: ButtonProps) {
  const styles = cn(
    "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
    variant === "primary"
      ? "bg-ink text-white hover:opacity-90"
      : "border border-line bg-white/70 text-ink hover:border-ink",
  );

  if (asChild) {
    const child = React.Children.only(props.children) as React.ReactElement<
      React.ComponentProps<typeof Link>
    >;

    return React.cloneElement(child, {
      className: cn(styles, child.props.className, className),
    });
  }

  return <button className={cn(styles, className)} {...props} />;
}
