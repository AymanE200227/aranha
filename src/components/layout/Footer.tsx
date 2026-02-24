import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/branding/BrandLogo";
import { useAppContent } from "@/hooks/useAppContent";
import { cn } from "@/lib/utils";
import {
  getResolvedBrandName,
  getResolvedLogoUrl,
  subscribeBrandingUpdates,
} from "@/lib/branding";

const Footer = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [logo, setLogo] = useState<string | null>(null);
  const [brandName, setBrandName] = useState(getResolvedBrandName());
  const content = useAppContent();

  const refreshBranding = useCallback(() => {
    setLogo(getResolvedLogoUrl());
    setBrandName(getResolvedBrandName());
  }, []);

  useEffect(() => {
    refreshBranding();
    return subscribeBrandingUpdates(refreshBranding);
  }, [refreshBranding]);

  const quickLinks = useMemo(
    () => [
      { name: content["navbar.link.home"] || "Accueil", path: "/" },
      { name: content["navbar.link.schedule"] || "Schedule", path: "/schedule" },
      { name: content["navbar.link.stats"] || "Statistiques", path: "/stats" },
      ...(isAuthenticated && isAdmin ? [{ name: content["navbar.button.admin_mobile"] || "Admin", path: "/admin" }] : []),
      ...(!isAuthenticated ? [{ name: content["navbar.button.login"] || "Connexion", path: "/auth" }] : []),
    ],
    [content, isAdmin, isAuthenticated]
  );

  const platformHighlights = [
    "UI premium orientee performance",
    "Gestion academy multi-role",
    "Planning jusqu a 22:00 inclus",
  ];

  return (
    <footer className="relative overflow-hidden border-t border-border/50 bg-gradient-to-b from-card to-background py-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-6 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -right-24 bottom-4 h-72 w-72 rounded-full bg-accent/8 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="surface-panel lg:col-span-5 p-6">
            <Link to="/" className="mb-5 flex items-center gap-3">
              <BrandLogo logo={logo} brandName={brandName} imageClassName="h-11 w-auto" />
              <span className="text-2xl font-display text-foreground">{brandName}</span>
            </Link>
            <p className="text-sm text-muted-foreground">{content["footer.description"]}</p>
            <div className="mt-5 space-y-2">
              {platformHighlights.map((item) => (
                <p key={item} className="text-xs uppercase tracking-[0.16em] text-primary/90">
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="surface-panel lg:col-span-3 p-6">
            <h4 className="mb-4 text-lg font-display text-foreground">{content["footer.quick_links"] || "Navigation"}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="inline-flex nav-link-pill px-0 py-1 text-sm text-muted-foreground hover:text-primary">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-panel lg:col-span-4 p-6">
            <h4 className="mb-4 text-lg font-display text-foreground">{content["footer.contact"] || "Contact"}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground/95">
              <li>{brandName}</li>
              <li>{content["footer.location"]}</li>
              <li>{content["footer.email"]}</li>
              <li>{content["footer.phone"]}</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-center text-sm text-muted-foreground md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {brandName}. {content["footer.rights"]}
          </p>
          <div className="flex items-center gap-2">
            {["premium", "secure", "optimized"].map((label) => (
              <span
                key={label}
                className={cn(
                  "rounded-full border border-border/60 px-2.5 py-1 text-[11px] uppercase tracking-wide",
                  label === "premium" && "border-primary/45 text-primary"
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
