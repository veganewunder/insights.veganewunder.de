import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  }
>;

export function Button({ className, asChild, ...props }: ButtonProps) {
  const styles =
    "inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90";

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
