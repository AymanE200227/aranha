import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import BrandLogo from "@/components/branding/BrandLogo";
import { useAppContent } from "@/hooks/useAppContent";
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
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const content = useAppContent();

  const refreshBranding = useCallback(() => {
    setLogo(getResolvedLogoUrl());
    setBrandName(getResolvedBrandName());
  }, []);

  useEffect(() => {
    refreshBranding();
    return subscribeBrandingUpdates(refreshBranding);
  }, [refreshBranding]);

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCustomLogoDataUrl(base64);
      refreshBranding();
    };
    reader.readAsDataURL(file);
  };

  const navLinks = [
    { name: content["navbar.link.home"], path: "/" },
    { name: content["navbar.link.about"], path: "/about" },
    { name: content["navbar.link.schedule"], path: "/schedule" },
    { name: content["navbar.link.stats"], path: "/stats" },
    { name: content["navbar.link.gallery"], path: "/gallery" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  const brandChunks = useMemo(() => brandName.split(" "), [brandName]);
  const brandFirst = brandChunks[0] || "ARANHA";
  const brandRest = brandChunks.slice(1).join(" ") || "BJJ";

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/30 glass-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="group relative flex items-center gap-3">
            <div className="relative">
              <BrandLogo logo={logo} brandName={brandName} />
              {isAdmin && (
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
              <span className="text-2xl font-display tracking-wide text-foreground">
                {brandFirst} <span className="text-primary">{brandRest}</span>
              </span>
            )}
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors duration-200 ${
                  isActive(link.path) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="goldOutline" size="sm">
                      {content["navbar.button.admin"]}
                    </Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    {user?.profilePicture && (
                      <img src={user.profilePicture} alt={user.name} className="h-6 w-6 rounded-full object-cover" />
                    )}
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm">{user?.name?.split(" ")[0]}</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
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

          <button className="text-foreground md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="border-t border-border/30 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`py-2 font-medium transition-colors ${
                    isActive(link.path) ? "text-primary" : "text-muted-foreground"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  {isAdmin && (
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
