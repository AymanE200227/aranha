import { useMemo } from "react";
import { Calendar, Users, BarChart3, Shield } from "lucide-react";
import { useAppContent } from "@/hooks/useAppContent";

const FeaturesSection = () => {
  const content = useAppContent();

  const features = useMemo(
    () => [
      {
        icon: Calendar,
        title: content["home.features.item_1_title"] || "Emploi du Temps Flexible",
        description:
          content["home.features.item_1_description"] ||
          "Choisissez parmi nos groupes du matin et du soir selon votre disponibilite",
      },
      {
        icon: Users,
        title: content["home.features.item_2_title"] || "Groupes Personnalises",
        description:
          content["home.features.item_2_description"] ||
          "Entrainez-vous avec des pratiquants de votre niveau dans des groupes adaptes",
      },
      {
        icon: BarChart3,
        title: content["home.features.item_3_title"] || "Suivi de Progression",
        description:
          content["home.features.item_3_description"] ||
          "Visualisez vos statistiques de presence et suivez votre evolution",
      },
      {
        icon: Shield,
        title: content["home.features.item_4_title"] || "Encadrement Expert",
        description:
          content["home.features.item_4_description"] ||
          "Beneficiez de l'expertise de nos maitres ceintures noires certifies",
      },
    ],
    [content]
  );

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            {content["home.features.badge"] || "Nos Services"}
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mt-2">
            {content["home.features.title_prefix"] || "POURQUOI NOUS"}{" "}
            <span className="text-gradient-gold">{content["home.features.title_highlight"] || "CHOISIR"}</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="stat-card group hover:border-primary/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
