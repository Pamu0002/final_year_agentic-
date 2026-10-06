// UI-only redesign: Restyled page header with serif display font and uppercase brand badge
import { ReactNode } from "react";
import { Sparkles } from "lucide-react";

interface PortalPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PortalPageHeader({ title, description, actions }: PortalPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/50 pb-6 mb-2">
      <div className="max-w-3xl">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 dark:bg-primary/20 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-800 dark:text-[#D4B57D]">
          <Sparkles className="size-3 text-primary dark:text-[#D4B57D]" />
          Restaurant Workspace
        </div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground sm:text-base leading-relaxed">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3 pt-2 sm:pt-0">{actions}</div>
      )}
    </div>
  );
}
