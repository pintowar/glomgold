import type { ReactNode } from "react";

export const PageHeader = ({ title, actions }: { title: string; actions?: ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <h2 className="text-2xl font-bold">{title}</h2>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
