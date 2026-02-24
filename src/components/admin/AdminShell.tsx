import { ReactNode, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, LogOut, Menu } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";

type AdminShellProps = {
  children: ReactNode;
  onLogout: () => void;
  mainClassName?: string;
};

export default function AdminShell({ children, onLogout, mainClassName }: AdminShellProps) {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { hasPrivilege } = useAuth();

  const allowedNavLinks = useMemo(() => {
    return ADMIN_NAV_LINKS.filter(
      (link) => !link.requiredPrivilege || hasPrivilege(link.requiredPrivilege)
    );
  }, [hasPrivilege]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1800px] items-center gap-3 px-3 py-3 sm:px-4 lg:px-6">
          <AdminSidebarBrand to="/admin" label="ADMIN" className="mb-0 shrink-0" labelClassName="text-foreground" />

          <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
            {allowedNavLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm transition-all",
                    isActive
                      ? "border-primary/45 bg-primary/15 text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Retour Accueil
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Deconnexion
            </Button>
          </div>

          <div className="ml-auto lg:hidden">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 px-0">
                <SheetHeader className="px-6 pb-2 text-left">
                  <SheetTitle>Navigation Admin</SheetTitle>
                  <SheetDescription>Acces rapide aux sections d'administration.</SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-6">
                  <nav className="space-y-2">
                    {allowedNavLinks.map((link) => {
                      const isActive = location.pathname === link.path;
                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setMobileNavOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                            isActive
                              ? "bg-primary/15 text-primary"
                              : "text-foreground hover:bg-secondary/60"
                          )}
                        >
                          <link.icon className="h-5 w-5" />
                          <span className="font-medium">{link.name}</span>
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="mt-6 space-y-2">
                    <Button asChild variant="outline" className="w-full justify-start gap-3">
                      <Link to="/" onClick={() => setMobileNavOpen(false)}>
                        <ArrowLeft className="h-4 w-4" />
                        Retour Accueil
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setMobileNavOpen(false);
                        onLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Deconnexion
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className={cn("mx-auto w-full max-w-[1800px] p-3 sm:p-4 lg:p-6", mainClassName)}>{children}</main>
    </div>
  );
}
