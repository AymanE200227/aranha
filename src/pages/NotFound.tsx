import { Link, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/branding/BrandLogo";
import { useAppContent } from "@/hooks/useAppContent";
import { getResolvedBrandName, getResolvedLogoUrl, subscribeBrandingUpdates } from "@/lib/branding";

const NotFound = () => {
  const location = useLocation();
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

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-8 flex w-fit justify-center">
          <BrandLogo
            logo={logo}
            brandName={brandName}
            imageClassName="h-20 w-auto object-contain"
            fallbackClassName="h-20 w-20"
            initialsClassName="text-3xl"
          />
        </div>

        <h1 className="font-display text-8xl text-gradient-gold mb-4">404</h1>

        <h2 className="font-display text-2xl text-foreground mb-2">{content["not_found.title"]}</h2>
        <p className="text-muted-foreground mb-8">{content["not_found.message"]}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="gold" size="lg" className="gap-2">
              <Home className="w-4 h-4" />
              {content["not_found.back_home"]}
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
            {content["not_found.back_previous"]}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
