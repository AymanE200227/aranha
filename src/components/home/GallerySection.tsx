import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Upload, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppContent } from "@/hooks/useAppContent";

import img5 from "@/assets/IMG-20260126-WA0046.jpg";
import img6 from "@/assets/IMG-20260126-WA0048.jpg";
import img7 from "@/assets/IMG-20260126-WA0050.jpg";
import img8 from "@/assets/IMG-20260126-WA0060.jpg";
import img9 from "@/assets/IMG-20260126-WA0066.jpg";
import img10 from "@/assets/IMG-20260126-WA0072.jpg";
import img11 from "@/assets/IMG-20260126-WA0076.jpg";
import img12 from "@/assets/IMG-20260126-WA0083.jpg";

const defaultGalleryImages = [img5, img6, img7, img8, img9, img10, img11, img12];

const GallerySection = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const content = useAppContent();
  const [isVisible, setIsVisible] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>(defaultGalleryImages);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("home_gallery_images");
    if (saved) {
      try {
        setGalleryImages(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load gallery images", error);
        setGalleryImages(defaultGalleryImages);
      }
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleReplaceGalleryImage = async (index: number, file: File) => {
    const base64 = await handleImageUpload(file);
    const updated = [...galleryImages];
    updated[index] = base64;
    setGalleryImages(updated);
    localStorage.setItem("home_gallery_images", JSON.stringify(updated));
  };

  const handleDeleteGalleryImage = (index: number) => {
    const updated = galleryImages.filter((_, imageIndex) => imageIndex !== index);
    setGalleryImages(updated);
    localStorage.setItem("home_gallery_images", JSON.stringify(updated));
  };

  const handleAddGalleryImage = async (file: File) => {
    const base64 = await handleImageUpload(file);
    const updated = [...galleryImages, base64];
    setGalleryImages(updated);
    localStorage.setItem("home_gallery_images", JSON.stringify(updated));
  };

  return (
    <section ref={sectionRef} className="relative py-24 bg-gradient-hero overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            {content["home.gallery.badge"] || "Nos Moments"}
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mt-4 mb-6">
            {content["home.gallery.title_prefix"] || "Galerie"}{" "}
            <span className="text-gradient-gold">{content["home.gallery.title_highlight"] || "Photos"}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {content["home.gallery.description"] ||
              "Decouvrez nos moments d'entrainement, competitions et evenements"}
          </p>
        </div>

        <div
          className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12 transition-all duration-1000 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="relative group overflow-hidden rounded-xl border border-primary/20 shadow-lg image-glow aspect-square"
              style={{ transitionDelay: `${300 + index * 50}ms` }}
            >
              <img
                src={image}
                alt={`${content["home.gallery.image_alt_prefix"] || "Galerie photo"} ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <label className="p-2 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        if (event.target.files?.[0]) {
                          handleReplaceGalleryImage(index, event.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-2 rounded-lg bg-destructive/90 hover:bg-destructive text-destructive-foreground transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{content["home.gallery.delete_title"] || "Supprimer cette image?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {content["home.gallery.delete_description"] || "Cette action est irreversible"}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex gap-3">
                        <AlertDialogCancel>{content["home.gallery.delete_cancel"] || "Annuler"}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteGalleryImage(index)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {content["home.gallery.delete_confirm"] || "Supprimer"}
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}

          {isAdmin && (
            <label className="relative group overflow-hidden rounded-xl border-2 border-dashed border-primary/50 hover:border-primary/80 bg-primary/5 hover:bg-primary/10 aspect-square flex items-center justify-center cursor-pointer transition-all">
              <div className="flex flex-col items-center gap-2">
                <Plus className="w-8 h-8 text-primary" />
                <span className="text-primary font-medium text-sm">{content["home.gallery.add_label"] || "Ajouter"}</span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  if (event.target.files?.[0]) {
                    handleAddGalleryImage(event.target.files[0]);
                  }
                }}
              />
            </label>
          )}
        </div>

        <div className={`text-center transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <Link to="/about">
            <Button variant="goldOutline" size="lg">
              {content["home.gallery.view_more"] || "VOIR PLUS DE PHOTOS"}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
