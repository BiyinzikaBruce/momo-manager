import { cn } from "@/lib/utils";

interface PageHeaderProps {
  breadcrumb?: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ breadcrumb, title, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div>
        {breadcrumb && (
          <p className="text-xs text-white/40 mb-1">{breadcrumb}</p>
        )}
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>
      {children && (
        <div className="flex items-center gap-3">{children}</div>
      )}
    </div>
  );
}
