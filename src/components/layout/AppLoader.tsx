import { useCallback, useEffect, useState } from "react";
import BrandLogo from "@/components/branding/BrandLogo";
import {
  getResolvedBrandName,
  getResolvedLogoUrl,
  subscribeBrandingUpdates,
} from "@/lib/branding";

type AppLoaderProps = {
  message?: string;
};

const DEFAULT_MESSAGE = "Chargement...";

export default function AppLoader({ message = DEFAULT_MESSAGE }: AppLoaderProps) {
  const [logo, setLogo] = useState<string | null>(null);
  const [brandName, setBrandName] = useState(getResolvedBrandName());

  const refreshBranding = useCallback(() => {
    setLogo(getResolvedLogoUrl());
    setBrandName(getResolvedBrandName());
  }, []);

  useEffect(() => {
    refreshBranding();
    return subscribeBrandingUpdates(refreshBranding);
  }, [refreshBranding]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-hero px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-8 left-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-16 top-1/3 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/60 bg-card/80 p-7 text-center shadow-[0_20px_48px_-26px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="mx-auto mb-4 flex w-fit items-center justify-center rounded-xl border border-primary/30 bg-primary/10 p-3">
          <BrandLogo logo={logo} brandName={brandName} imageClassName="h-12 w-auto" />
        </div>
        <h1 className="text-2xl font-display tracking-wide text-foreground">{brandName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-secondary/70">
          <div className="h-full w-1/2 animate-loader-sweep rounded-full bg-gradient-to-r from-primary to-accent" />
        </div>
      </div>
    </div>
  );
}
