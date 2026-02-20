import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect, useState } from "react";
import BrandLogo from "@/components/branding/BrandLogo";
import { useAppContent } from "@/hooks/useAppContent";
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

  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link to="/" className="mb-4 flex items-center gap-3">
              <BrandLogo logo={logo} brandName={brandName} />
              <span className="text-xl font-display text-foreground">
                {brandName}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {content["footer.description"]}
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-display text-foreground">{content["footer.quick_links"]}</h4>
            <ul className="space-y-2">
              {[
                { name: content["navbar.link.home"], path: "/" },
                { name: content["navbar.link.schedule"], path: "/schedule" },
                { name: content["navbar.link.stats"], path: "/stats" },
                ...(isAuthenticated && isAdmin ? [{ name: content["navbar.button.admin_mobile"], path: "/admin" }] : []),
                ...(!isAuthenticated ? [{ name: content["navbar.button.login"], path: "/auth" }] : []),
              ].map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-display text-foreground">{content["footer.contact"]}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{brandName}</li>
              <li>{content["footer.location"]}</li>
              <li>{content["footer.email"]}</li>
              <li>{content["footer.phone"]}</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {brandName}. {content["footer.rights"]}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
