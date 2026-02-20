import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AdminSidebarBrand from "@/components/admin/AdminSidebarBrand";
import { ADMIN_NAV_LINKS } from "@/lib/adminNav";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: ReactNode;
  onLogout: () => void;
  mainClassName?: string;
};

export default function AdminShell({ children, onLogout, mainClassName }: AdminShellProps) {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="fixed hidden h-full w-64 border-r border-sidebar-border bg-sidebar md:block">
        <div className="p-6">
          <AdminSidebarBrand label="ADMIN" />

          <nav className="space-y-2">
            {ADMIN_NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  <span className="font-medium">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <Button variant="outline" className="w-full justify-start gap-3" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            Deconnexion
          </Button>
        </div>
      </aside>

      <div className="md:ml-64 md:flex-1">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <AdminSidebarBrand to="/admin" label="ADMIN" className="mb-0" />
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar px-0">
                <SheetHeader className="px-6 pb-2 text-left">
                  <SheetTitle className="text-sidebar-foreground">Navigation Admin</SheetTitle>
                  <SheetDescription className="text-sidebar-foreground/70">
                    Gestion rapide depuis mobile.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-6">
                  <nav className="space-y-2">
                    {ADMIN_NAV_LINKS.map((link) => {
                      const isActive = location.pathname === link.path;
                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setMobileNavOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-primary"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                        >
                          <link.icon className="h-5 w-5" />
                          <span className="font-medium">{link.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                  <Button
                    variant="outline"
                    className="mt-6 w-full justify-start gap-3"
                    onClick={() => {
                      setMobileNavOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Deconnexion
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className={cn("p-4 sm:p-6 md:p-8", mainClassName)}>{children}</main>
      </div>
    </div>
  );
}
