import type { ReactNode } from "react";

export const ShowField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1 py-1">
    <span className="text-sm font-semibold">{label}</span>
    <span className="text-sm">{children}</span>
  </div>
);
