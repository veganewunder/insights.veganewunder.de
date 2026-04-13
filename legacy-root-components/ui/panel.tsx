import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-[2rem] border border-line bg-panel shadow-panel", className)}>
      {children}
    </div>
  );
}
