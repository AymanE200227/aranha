import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import BrandLogo from "@/components/branding/BrandLogo";
import { useAppContent } from "@/hooks/useAppContent";
import { cn } from "@/lib/utils";
import {
  getResolvedBrandName,
  getResolvedLogoUrl,
  setCustomLogoDataUrl,
  subscribeBrandingUpdates,
} from "@/lib/branding";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [brandName, setBrandName] = useState(getResolvedBrandName());
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, canAccessAdmin, hasPrivilege, user, logout } = useAuth();
  const canManageMedia = hasPrivilege("manage_media");
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
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogoUpload = (file: File): void => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCustomLogoDataUrl(base64);
      refreshBranding();
    };
    reader.readAsDataURL(file);
  };

  const navLinks = useMemo(
    () => [
      { name: content["navbar.link.home"] || "Accueil", path: "/" },
      { name: content["navbar.link.about"] || "A propos", path: "/about" },
      { name: content["navbar.link.schedule"] || "Schedule", path: "/schedule" },
      { name: content["navbar.link.stats"] || "Statistiques", path: "/stats" },
      { name: content["navbar.link.gallery"] || "Galerie", path: "/gallery" },
    ],
    [content]
  );

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = (): void => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  const brandChunks = useMemo(() => brandName.split(" "), [brandName]);
  const brandFirst = brandChunks[0] || "ARANHA";
  const brandRest = brandChunks.slice(1).join(" ") || "BJJ";

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 border-b transition-all duration-300",
        isScrolled
          ? "border-border/60 bg-card/92 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          : "border-border/30 bg-card/65 backdrop-blur-xl"
      )}
    >
      <div className="container mx-auto px-4">
        <div className={cn("flex items-center justify-between transition-all duration-300", isScrolled ? "h-14" : "h-16")}>
          <Link to="/" className="group relative flex items-center gap-3">
            <div className="relative">
              <BrandLogo logo={logo} brandName={brandName} imageClassName={cn("w-auto transition-all duration-300", isScrolled ? "h-9" : "h-10")} />
              {canManageMedia && (
                <label className="absolute -right-2 -top-2 z-10 cursor-pointer rounded-lg bg-primary/90 p-1.5 text-primary-foreground opacity-0 transition-colors hover:bg-primary group-hover:opacity-100">
                  <Upload className="h-3 w-3" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files?.[0]) {
                        handleLogoUpload(event.target.files[0]);
                      }
                    }}
                  />
                </label>
              )}
            </div>
            {!logo && (
              <span className={cn("font-display tracking-wide text-foreground transition-all duration-300", isScrolled ? "text-xl" : "text-2xl")}>
                {brandFirst} <span className="text-primary">{brandRest}</span>
              </span>
            )}
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                aria-current={isActive(link.path) ? "page" : undefined}
                className={cn(
                  "nav-link-pill",
                  isActive(link.path)
                    ? "active bg-primary/14 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.25)]"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}

            <div className="ml-3 flex items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                {canAccessAdmin && (
                  <Link to="/admin">
                    <Button variant="goldOutline" size="sm">
                      {content["navbar.button.admin"]}
                    </Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button variant="outline" size="sm" className="h-9 rounded-full border-border/60 bg-secondary/35 px-3 hover:bg-secondary/60">
                    {user?.profilePicture && (
                      <img src={user.profilePicture} alt={user.name} className="h-6 w-6 rounded-full object-cover" />
                    )}
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm">{user?.name?.split(" ")[0] || "Profil"}</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              ) : (
                <Link to="/auth">
                  <Button variant="gold" size="sm">
                    {content["navbar.button.login"]}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <button
            className={cn(
              "rounded-lg border border-border/60 bg-secondary/35 p-2 text-foreground transition-colors hover:bg-secondary/60 md:hidden",
              isOpen && "border-primary/45"
            )}
            onClick={() => setIsOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="animate-fade-in border-t border-border/40 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`py-2 font-medium transition-colors ${
                    isActive(link.path) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  {canAccessAdmin && (
                    <Link to="/admin" onClick={() => setIsOpen(false)}>
                      <Button variant="goldOutline" className="w-full">
                        {content["navbar.button.admin_mobile"]}
                      </Button>
                    </Link>
                  )}
                  <Link to="/profile" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      {user?.profilePicture && (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="mr-2 h-6 w-6 rounded-full object-cover"
                        />
                      )}
                      <User className="mr-2 h-4 w-4" />
                      {user?.name}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    {content["navbar.button.logout"]}
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="gold" className="w-full">
                    {content["navbar.button.login"]}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
