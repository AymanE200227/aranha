import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/branding/BrandLogo";
import {
  getResolvedBrandName,
  getResolvedLogoUrl,
  subscribeBrandingUpdates,
} from "@/lib/branding";
import { cn } from "@/lib/utils";

type AdminSidebarBrandProps = {
  to?: string;
  label?: string;
  className?: string;
  labelClassName?: string;
};

export default function AdminSidebarBrand({
  to = "/",
  label = "ADMIN",
  className,
  labelClassName,
}: AdminSidebarBrandProps) {
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
    <Link to={to} className={cn("mb-8 flex items-center gap-3", className)}>
      <BrandLogo logo={logo} brandName={brandName} />
      <span className={cn("text-lg font-display text-sidebar-foreground", labelClassName)}>{label}</span>
    </Link>
  );
}
