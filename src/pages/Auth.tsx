import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import BrandLogo from "@/components/branding/BrandLogo";
import { useAppContent } from "@/hooks/useAppContent";
import { getResolvedBrandName, getResolvedLogoUrl, subscribeBrandingUpdates } from "@/lib/branding";

const Auth = () => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, isAdmin, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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
    if (!isLoading && isAuthenticated) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/stats");
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (isLogin) {
      const result = login(email, password);
      if (result.success) {
        toast.success("Connexion reussie!");
      } else {
        toast.error(result.error || "Erreur de connexion");
      }
      return;
    }

    if (!name.trim()) {
      toast.error("Veuillez entrer votre nom");
      return;
    }

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caracteres");
      return;
    }

    const result = register(email, password, name);
    if (result.success) {
      toast.success("Inscription reussie!");
    } else {
      toast.error(result.error || "Erreur d'inscription");
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{content["auth.back_home"]}</span>
        </Link>

        <div className="glass-card p-8 rounded-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex w-fit justify-center">
              <BrandLogo
                logo={logo}
                brandName={brandName}
                imageClassName="h-16 w-auto object-contain"
                fallbackClassName="h-16 w-16"
                initialsClassName="text-2xl"
              />
            </div>
            <h1 className="font-display text-3xl text-foreground">
              {isLogin ? content["auth.title_login"] : content["auth.title_register"]}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {isLogin ? content["auth.subtitle_login"] : content["auth.subtitle_register"]}
            </p>
          </div>

          {isLogin && (
            <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{content["auth.admin_access"]}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {content["auth.admin_email_label"]}: ******@***
                <br />
                {content["auth.admin_password_label"]}: *******
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-foreground">
                  {content["auth.name_label"]}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={content["auth.name_placeholder"]}
                  className="mt-1 bg-secondary border-border"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-foreground">
                {content["auth.email_label"]}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={content["auth.email_placeholder"]}
                className="mt-1 bg-secondary border-border"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground">
                {content["auth.password_label"]}
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  className="bg-secondary border-border pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="gold" className="w-full mt-6">
              {isLogin ? content["auth.button_login"] : content["auth.button_register"]}
            </Button>
          </form>

          <div className="text-center mt-6">
            <span className="text-muted-foreground text-sm">
              {isLogin ? `${content["auth.toggle_login_prompt"]} ` : `${content["auth.toggle_register_prompt"]} `}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline text-sm font-medium"
            >
              {isLogin ? content["auth.toggle_login_action"] : content["auth.toggle_register_action"]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
