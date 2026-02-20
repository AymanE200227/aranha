import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppContent } from "@/hooks/useAppContent";
import heroImage from "@/assets/hero-academy.jpg";

const HeroSection = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [heroImageSrc, setHeroImageSrc] = useState<string>(heroImage);
  const content = useAppContent();

  useEffect(() => {
    const saved = localStorage.getItem("home_hero_image");
    if (saved) {
      try {
        setHeroImageSrc(saved);
      } catch (error) {
        console.error("Failed to load hero image", error);
      }
    }
  }, []);

  const handleImageUpload = async (file: File) => {
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setHeroImageSrc(base64);
        localStorage.setItem("home_hero_image", base64);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImageSrc} alt="Jujutsu Academy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />

        {isAdmin && (
          <label className="absolute top-6 left-6 p-3 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground transition-colors cursor-pointer z-20">
            <Upload className="w-5 h-5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.[0]) {
                  handleImageUpload(event.target.files[0]);
                }
              }}
            />
          </label>
        )}
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center pt-20">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-sm font-medium">{content["home.hero.badge"] || "Ecole de Jujutsu Bresilien"}</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground mb-6 leading-tight">
            {content["home.hero.title_prefix"] || "MAITRISEZ L'ART DU"}{" "}
            <span className="text-gradient-gold">{content["home.hero.title_highlight"] || "COMBAT"}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {content["home.hero.description"] ||
              "Rejoignez notre academie et apprenez aupres des meilleurs maitres. Discipline, respect et excellence sont nos valeurs fondamentales."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button variant="hero" size="xl">
                {content["home.hero.cta_primary"] || "COMMENCER MAINTENANT"}
              </Button>
            </Link>
            <Link to="/schedule">
              <Button variant="goldOutline" size="xl">
                {content["home.hero.cta_secondary"] || "VOIR LES HORAIRES"}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
          {[
            {
              number: content["home.hero.stat_1_value"] || "15+",
              label: content["home.hero.stat_1_label"] || "Annees d'experience",
            },
            {
              number: content["home.hero.stat_2_value"] || "500+",
              label: content["home.hero.stat_2_label"] || "Etudiants formes",
            },
            {
              number: content["home.hero.stat_3_value"] || "10+",
              label: content["home.hero.stat_3_label"] || "Champions",
            },
          ].map((stat, index) => (
            <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
              <div className="font-display text-4xl md:text-5xl text-gradient-gold">{stat.number}</div>
              <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
