import type { PropsWithChildren } from "react";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const AppLayout = ({ children }: PropsWithChildren) => (
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">{children}</main>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        Glomgold ©{new Date().getFullYear()} Created by pintowar
      </footer>
    </SidebarInset>
  </SidebarProvider>
);
