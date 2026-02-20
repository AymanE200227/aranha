import { useMemo, useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppContent } from "@/hooks/useAppContent";
import lineageBanner from "@/assets/lineage-banner.jpg";
import coach1Image from "@/assets/coach-1.jpg";
import coach2Image from "@/assets/coach-2.jpg";

const CoachesSection = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const content = useAppContent();
  const [lineageImage, setLineageImage] = useState<string>(lineageBanner);
  const [coachImages, setCoachImages] = useState<string[]>([coach1Image, coach2Image]);

  useEffect(() => {
    const saved = localStorage.getItem("home_coaches_images");
    if (saved) {
      try {
        setCoachImages(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load coach images", error);
      }
    }

    const savedLineage = localStorage.getItem("home_lineage_image");
    if (savedLineage) {
      try {
        setLineageImage(savedLineage);
      } catch {
        // Keep default.
      }
    }
  }, []);

  const lineage = useMemo(
    () => [
      { name: content["home.coaches.lineage_1_name"] || "Carlos Gracie", initials: content["home.coaches.lineage_1_initials"] || "CG" },
      { name: content["home.coaches.lineage_2_name"] || "Carlson Gracie", initials: content["home.coaches.lineage_2_initials"] || "CG" },
      {
        name: content["home.coaches.lineage_3_name"] || "Andre Pederneiras",
        initials: content["home.coaches.lineage_3_initials"] || "AP",
      },
      {
        name: content["home.coaches.lineage_4_name"] || "Their Cleveland",
        initials: content["home.coaches.lineage_4_initials"] || "TC",
      },
      { name: content["home.coaches.lineage_5_name"] || "Imad Bourziz", initials: content["home.coaches.lineage_5_initials"] || "IB" },
    ],
    [content]
  );

  const coaches = useMemo(
    () => [
      {
        name: content["home.coaches.coach_1_name"] || "Imad Bourziz",
        title: content["home.coaches.coach_1_title"] || "Maitre Principal",
        belt: content["home.coaches.coach_1_belt"] || "Ceinture Noire",
        description:
          content["home.coaches.coach_1_description"] ||
          "Fondateur de l'Academie Aranha Maroc, forme par Their Cleveland dans la lignee Gracie",
      },
      {
        name: content["home.coaches.coach_2_name"] || "Their Cleveland",
        title: content["home.coaches.coach_2_title"] || "Instructeur Senior",
        belt: content["home.coaches.coach_2_belt"] || "Ceinture Noire",
        description:
          content["home.coaches.coach_2_description"] ||
          "Eleve direct d'Andre Pederneiras, representant de l'association Aranha",
      },
    ],
    [content]
  );

  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleReplaceLineageImage = async (file: File) => {
    const base64 = await handleImageUpload(file);
    setLineageImage(base64);
    localStorage.setItem("home_lineage_image", base64);
  };

  const handleReplaceCoachImage = async (index: number, file: File) => {
    const base64 = await handleImageUpload(file);
    const updated = [...coachImages];
    updated[index] = base64;
    setCoachImages(updated);
    localStorage.setItem("home_coaches_images", JSON.stringify(updated));
  };

  return (
    <section className="py-24 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            {content["home.coaches.badge"] || "Aranha Association"}
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mt-2">
            {content["home.coaches.title_prefix"] || "ARANHA BRAZILIAN"}{" "}
            <span className="text-gradient-gold">{content["home.coaches.title_highlight"] || "JIU JITSU"}</span>{" "}
            {content["home.coaches.title_suffix"] || "ACADEMY"}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            {content["home.coaches.description"] ||
              "Apprenez aupres de pratiquants experimentes dans la lignee directe des maitres Gracie"}
          </p>
        </div>

        <div className="mb-12 max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-primary/20 relative group">
            <img src={lineageImage} alt="Aranha Association lineage" className="w-full h-auto" />

            {isAdmin && (
              <label className="absolute top-3 right-3 p-2 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground transition-colors cursor-pointer opacity-0 group-hover:opacity-100 z-10">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files?.[0]) {
                      handleReplaceLineageImage(event.target.files[0]);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-6 mb-12">
          <div className="w-16 h-12 rounded shadow-lg overflow-hidden border border-border/30">
            <div className="w-full h-full bg-white flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-red-600" />
            </div>
          </div>
          <div className="w-16 h-12 rounded shadow-lg overflow-hidden border border-border/30">
            <div className="w-full h-full bg-red-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-700" fill="currentColor">
                <polygon points="12,2 14.5,9 22,9 16,14 18.5,21 12,17 5.5,21 8,14 2,9 9.5,9" />
              </svg>
            </div>
          </div>
          <div className="w-16 h-12 rounded shadow-lg overflow-hidden border border-border/30 bg-green-500 flex items-center justify-center">
            <div className="w-10 h-6 bg-yellow-400 flex items-center justify-center" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}>
              <div className="w-4 h-4 rounded-full bg-blue-800 flex items-center justify-center">
                <div className="w-3 h-0.5 bg-white rounded" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="glass-card p-8 rounded-2xl max-w-5xl mx-auto">
            <h3 className="font-display text-2xl text-center text-foreground mb-8">
              {content["home.coaches.lineage_title_prefix"] || "OUR BLACK BELT"}{" "}
              <span className="text-gradient-gold">{content["home.coaches.lineage_title_highlight"] || "LINEAGE"}</span>
            </h3>

            <div className="flex items-center justify-center gap-2 md:gap-4 overflow-x-auto pb-4">
              {lineage.map((person, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[80px] md:min-w-[100px]">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg border-2 border-primary/50 bg-secondary flex items-center justify-center mb-2 shadow-lg">
                      <span className="font-display text-primary text-base md:text-lg">{person.initials}</span>
                    </div>
                    <span className="text-[10px] md:text-xs text-center text-muted-foreground font-medium">{person.name}</span>
                  </div>
                  {index < lineage.length - 1 && <div className="w-6 md:w-10 h-0.5 bg-primary/50 mx-1" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {coaches.map((coach, index) => (
            <div key={index} className="card-elevated p-6 group hover:border-primary/50 transition-all duration-300">
              <div className="flex gap-6">
                <div className="relative">
                  <img src={coachImages[index]} alt={coach.name} className="w-32 h-40 object-cover rounded-lg" />

                  {isAdmin && (
                    <label className="absolute top-1 right-1 p-2 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground transition-colors cursor-pointer opacity-0 group-hover:opacity-100 z-10">
                      <Upload className="w-3 h-3" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          if (event.target.files?.[0]) {
                            handleReplaceCoachImage(index, event.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  )}

                  <div className="absolute -bottom-2 -right-2 bg-gradient-gold px-3 py-1 rounded text-xs font-semibold text-primary-foreground">
                    {coach.belt}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-2xl text-foreground group-hover:text-gradient-gold transition-colors">
                    {coach.name}
                  </h3>
                  <p className="text-primary text-sm font-medium mt-1">{coach.title}</p>
                  <p className="text-muted-foreground text-sm mt-3">{coach.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoachesSection;
