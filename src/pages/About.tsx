import { Award, Users, Target, Heart, Trophy, Globe, Sparkles, Quote, ArrowRight, CheckCircle2, Edit2, Trash2, Upload, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import coach1Image from "@/assets/coach-1.jpg";
import coach2Image from "@/assets/coach-2.jpg";
import lineageBanner from "@/assets/lineage-banner.jpg";

// Default timeline and gallery images
import img13 from "@/assets/IMG-20260126-WA0017.jpg";
import img14 from "@/assets/IMG-20260126-WA0018.jpg";
import img15 from "@/assets/IMG-20260126-WA0020.jpg";
import img16 from "@/assets/IMG-20260126-WA0022.jpg";
import img17 from "@/assets/IMG-20260126-WA0023.jpg";
import img18 from "@/assets/IMG-20260126-WA0024.jpg";
import img19 from "@/assets/IMG-20260126-WA0025.jpg";
import img20 from "@/assets/IMG-20260126-WA0026.jpg";
import img21 from "@/assets/IMG-20260126-WA0027.jpg";
import img22 from "@/assets/IMG-20260126-WA0028.jpg";
import img23 from "@/assets/IMG-20260126-WA0029.jpg";
import img24 from "@/assets/IMG-20260126-WA0030.jpg";
import img25 from "@/assets/IMG-20260126-WA0031.jpg";
import img26 from "@/assets/IMG-20260126-WA0033.jpg";
import img27 from "@/assets/IMG-20260126-WA0034.jpg";
import img28 from "@/assets/IMG-20260126-WA0035.jpg";

interface TimelineItem {
  id: string;
  year: string;
  title: string;
  description: string;
  image: string;
}

interface GalleryImage {
  id: string;
  image: string;
  span: { col: string; row: string };
}

const About = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  
  // Default values
  const defaultTimelineRef = useRef<TimelineItem[]>([
    {
      id: "1",
      year: "2009",
      title: "Les Débuts",
      description: "Fondation de l'Académie Aranha avec une vision claire : transmettre l'authentique Jiu-Jitsu brésilien au Maroc.",
      image: img13,
    },
    {
      id: "2",
      year: "2012",
      title: "Première Génération",
      description: "Nos premiers ceintures noires formés localement, marquant le début d'une tradition d'excellence.",
      image: img14,
    },
    {
      id: "3",
      year: "2015",
      title: "Reconnaissance Internationale",
      description: "Participation aux compétitions internationales et reconnaissance par la communauté mondiale du Jiu-Jitsu.",
      image: img15,
    },
    {
      id: "4",
      year: "2020",
      title: "Expansion",
      description: "Ouverture de nouveaux programmes et expansion de notre communauté à travers le Maroc.",
      image: img16,
    },
    {
      id: "5",
      year: "2024",
      title: "Aujourd'hui",
      description: "Plus de 500 étudiants formés, des champions internationaux, et une communauté unie par la passion du Jiu-Jitsu.",
      image: img17,
    },
  ]);

  const defaultGalleryRef = useRef<GalleryImage[]>([
    { id: "g1", image: img18, span: { col: "col-span-1", row: "row-span-1" } },
    { id: "g2", image: img19, span: { col: "col-span-1", row: "row-span-2" } },
    { id: "g3", image: img20, span: { col: "col-span-2", row: "row-span-1" } },
    { id: "g4", image: img21, span: { col: "col-span-1", row: "row-span-1" } },
    { id: "g5", image: img22, span: { col: "col-span-1", row: "row-span-2" } },
    { id: "g6", image: img23, span: { col: "col-span-2", row: "row-span-1" } },
    { id: "g7", image: img24, span: { col: "col-span-1", row: "row-span-1" } },
    { id: "g8", image: img25, span: { col: "col-span-1", row: "row-span-1" } },
    { id: "g9", image: img26, span: { col: "col-span-2", row: "row-span-1" } },
    { id: "g10", image: img27, span: { col: "col-span-1", row: "row-span-1" } },
    { id: "g11", image: img28, span: { col: "col-span-1", row: "row-span-1" } },
  ]);
  
  // State for editable content
  const [timeline, setTimeline] = useState<TimelineItem[]>(defaultTimelineRef.current);
  const [gallery, setGallery] = useState<GalleryImage[]>(defaultGalleryRef.current);
  const [coachImages, setCoachImages] = useState([coach1Image, coach2Image]);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newTimelineItem, setNewTimelineItem] = useState<TimelineItem>({
    id: "",
    year: "",
    title: "",
    description: "",
    image: "",
  });
  const [addTimelineDialogOpen, setAddTimelineDialogOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Load saved coach images
    const savedCoaches = localStorage.getItem("about_coaches_images");
    if (savedCoaches) {
      setCoachImages(JSON.parse(savedCoaches));
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const handleScroll = () => setScrollY(window.scrollY);

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    window.addEventListener("scroll", handleScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const coaches = [
    {
      name: "Imad Bourziz",
      title: "Maître Fondateur",
      belt: "Ceinture Noire",
      image: coach1Image,
      quote: "Le Jiu-Jitsu n'est pas seulement un sport, c'est une philosophie de vie qui transforme l'individu de l'intérieur.",
      achievements: ["15+ ans d'expérience", "Fondateur Aranha Maroc", "Lignée Gracie directe"],
    },
    {
      name: "Their Cleveland",
      title: "Maître Instructeur",
      belt: "Ceinture Noire",
      image: coach2Image,
      quote: "Chaque technique enseignée porte l'héritage des maîtres. Nous transmettons plus que des mouvements, nous transmettons une tradition.",
      achievements: ["Élève direct Pederneiras", "Champion international", "Formateur certifié"],
    },
  ];

  // Load data from localStorage or use defaults
  useEffect(() => {
    const savedTimeline = localStorage.getItem("about_timeline");
    const savedGallery = localStorage.getItem("about_gallery");
    
    setTimeline(savedTimeline ? JSON.parse(savedTimeline) : defaultTimelineRef.current);
    setGallery(savedGallery ? JSON.parse(savedGallery) : defaultGalleryRef.current);
  }, []);

  // Handle image upload to Base64
  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle timeline image edit
  const handleEditTimeline = async (item: TimelineItem, file?: File) => {
    if (file) {
      const base64 = await handleImageUpload(file);
      item.image = base64;
    }
    
    const updated = timeline.map(t => t.id === item.id ? item : t);
    setTimeline(updated);
    localStorage.setItem("about_timeline", JSON.stringify(updated));
    setEditDialogOpen(false);
    setEditingItem(null);
  };

  // Handle timeline image delete
  const handleDeleteTimelineItem = (id: string) => {
    const updated = timeline.filter(t => t.id !== id);
    setTimeline(updated);
    localStorage.setItem("about_timeline", JSON.stringify(updated));
  };

  // Handle gallery image edit
  const handleEditGalleryImage = async (id: string, file?: File) => {
    if (!file) return;
    const base64 = await handleImageUpload(file);
    const updated = gallery.map(g => g.id === id ? { ...g, image: base64 } : g);
    setGallery(updated);
    localStorage.setItem("about_gallery", JSON.stringify(updated));
  };

  // Handle gallery image delete
  const handleDeleteGalleryItem = (id: string) => {
    const updated = gallery.filter(g => g.id !== id);
    setGallery(updated);
    localStorage.setItem("about_gallery", JSON.stringify(updated));
  };

  // Handle add new timeline item
  const handleAddTimelineItem = async () => {
    if (!newTimelineItem.year || !newTimelineItem.title || !newTimelineItem.image) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const item: TimelineItem = {
      ...newTimelineItem,
      id: Date.now().toString(),
    };

    const updated = [...timeline, item];
    setTimeline(updated);
    localStorage.setItem("about_timeline", JSON.stringify(updated));
    
    setNewTimelineItem({ id: "", year: "", title: "", description: "", image: "" });
    setAddTimelineDialogOpen(false);
  };

  // Handle add new gallery item
  const handleAddGalleryItem = async (file: File) => {
    const base64 = await handleImageUpload(file);
    const newGallery: GalleryImage = {
      id: Date.now().toString(),
      image: base64,
      span: { col: "col-span-1", row: "row-span-1" },
    };

    const updated = [...gallery, newGallery];
    setGallery(updated);
    localStorage.setItem("about_gallery", JSON.stringify(updated));
  };

  const philosophy = [
    {
      icon: Target,
      title: "Excellence Technique",
      description: "Chaque technique est enseignée avec précision, respectant les principes fondamentaux du Jiu-Jitsu brésilien.",
      color: "from-primary/20 to-primary/5",
    },
    {
      icon: Heart,
      title: "Passion Authentique",
      description: "Notre passion se transmet naturellement, créant un environnement où chaque étudiant peut s'épanouir.",
      color: "from-accent/20 to-accent/5",
    },
    {
      icon: Users,
      title: "Communauté Solidaire",
      description: "Une famille où chacun s'entraide, progresse ensemble et célèbre les succès de tous.",
      color: "from-success/20 to-success/5",
    },
    {
      icon: Trophy,
      title: "Esprit de Compétition",
      description: "Nous formons des champions, mais surtout des individus avec des valeurs fortes et un mental d'acier.",
      color: "from-warning/20 to-warning/5",
    },
  ];

  const stats = [
    { number: "15+", label: "Années d'excellence", icon: Award, delay: "0ms" },
    { number: "500+", label: "Étudiants formés", icon: Users, delay: "100ms" },
    { number: "50+", label: "Compétitions remportées", icon: Trophy, delay: "200ms" },
    { number: "3", label: "Pays représentés", icon: Globe, delay: "300ms" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section with Coaches */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(circle at ${50 + scrollY * 0.02}% ${50 + scrollY * 0.01}%, hsl(45 90% 55% / 0.3), transparent 70%)`,
            }}
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background via-background/95 to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">Notre Histoire</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground mb-6 leading-tight">
              L'ART DU{" "}
              <span className="text-gradient-gold">COMBAT</span>
              <br />
              COMME <span className="text-gradient-gold">PHILOSOPHIE</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Depuis 15 ans, nous transmettons l'héritage des Gracie avec passion, 
              formant non seulement des combattants, mais des individus accomplis.
            </p>
          </div>

          {/* Coaches Hero Section */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            {coaches.map((coach, index) => (
              <div
                key={index}
                className="group relative"
                style={{
                  animationDelay: `${index * 200}ms`,
                }}
              >
                <div className="relative overflow-hidden rounded-3xl border-2 border-primary/30 shadow-2xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                  {/* Coach Image */}
                  <div className="relative h-96 overflow-hidden">
                    <img
                      src={coachImages[index] || coach.image}
                      alt={coach.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    
                    {/* Admin Replace Coach Image Button */}
                    {isAdmin && (
                      <label className="absolute top-6 left-6 p-2 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const base64 = reader.result as string;
                                const updated = [...coachImages];
                                updated[index] = base64;
                                setCoachImages(updated);
                                localStorage.setItem("about_coaches_images", JSON.stringify(updated));
                              };
                              reader.readAsDataURL(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    )}
                    
                    {/* Belt Badge */}
                    <div className="absolute top-6 right-6">
                      <div className="bg-gradient-gold px-4 py-2 rounded-full shadow-xl">
                        <span className="text-primary-foreground font-display text-sm font-bold">
                          {coach.belt}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <div className="mb-4">
                      <h3 className="font-display text-3xl text-foreground mb-1 group-hover:text-gradient-gold transition-colors">
                        {coach.name}
                      </h3>
                      <p className="text-primary text-lg font-medium">{coach.title}</p>
                    </div>

                    {/* Quote */}
                    <div className="relative mb-6">
                      <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/20" />
                      <p className="text-muted-foreground italic text-lg leading-relaxed pl-6">
                        "{coach.quote}"
                      </p>
                    </div>

                    {/* Achievements */}
                    <div className="space-y-2">
                      {coach.achievements.map((achievement, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </section>

      {/* Lineage Banner */}
      <section className="py-16 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                Notre <span className="text-gradient-gold">Lignée</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Une connexion directe avec les maîtres fondateurs du Jiu-Jitsu brésilien
              </p>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/20">
              <img
                src={lineageBanner}
                alt="Lignée Gracie - Carlos Gracie → Carlson Gracie → Andre Pederneiras → Their Cleveland → Imad Bourziz"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Story Timeline */}
      <section ref={sectionRef} className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Notre Parcours
            </span>
            <h2 className="font-display text-4xl md:text-6xl text-foreground mt-4 mb-6">
              Une <span className="text-gradient-gold">Histoire</span> d'Excellence
            </h2>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary transform md:-translate-x-1/2" />

            <div className="space-y-24">
              {timeline.map((item, index) => (
                <div
                  key={index}
                  className={`relative flex flex-col md:flex-row items-center gap-8 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-8 md:left-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background shadow-xl transform md:-translate-x-1/2 z-10" />

                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12 md:text-left"}`}>
                    <div className="glass-card p-8 rounded-2xl">
                      <div className="inline-block bg-gradient-gold px-4 py-1 rounded-full mb-4">
                        <span className="font-display text-2xl text-primary-foreground font-bold">
                          {item.year}
                        </span>
                      </div>
                      <h3 className="font-display text-2xl text-foreground mb-4">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="flex-1">
                    <div className="relative group overflow-hidden rounded-2xl border-2 border-primary/20 shadow-xl">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Admin Edit/Delete Buttons */}
                      {isAdmin && (
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {/* Edit Button */}
                          <Dialog open={editDialogOpen && editingItem?.id === item.id} onOpenChange={setEditDialogOpen}>
                            <DialogTrigger asChild>
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-2 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Modifier Image Timeline</DialogTitle>
                                <DialogDescription>Modifiez les détails ou remplacez l'image</DialogDescription>
                              </DialogHeader>
                              {editingItem && (
                                <div className="space-y-4">
                                  <div>
                                    <Label>Année</Label>
                                    <Input
                                      value={editingItem.year}
                                      onChange={(e) => setEditingItem({ ...editingItem, year: e.target.value })}
                                      placeholder="2024"
                                    />
                                  </div>
                                  <div>
                                    <Label>Titre</Label>
                                    <Input
                                      value={editingItem.title}
                                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Description</Label>
                                    <Textarea
                                      value={editingItem.description}
                                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Remplacer l'image</Label>
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        if (e.target.files?.[0] && editingItem) {
                                          handleEditTimeline(editingItem, e.target.files[0]);
                                        }
                                      }}
                                    />
                                  </div>
                                  <Button onClick={() => handleEditTimeline(editingItem)}>Sauvegarder</Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* Delete Button */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="p-2 rounded-lg bg-destructive/90 hover:bg-destructive text-destructive-foreground transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer cette image?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex gap-3">
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTimelineItem(item.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Timeline Item Button */}
              {isAdmin && (
                <div className="relative flex justify-center">
                  <Dialog open={addTimelineDialogOpen} onOpenChange={setAddTimelineDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-2 px-6 py-4 rounded-2xl border-2 border-dashed border-primary/50 hover:border-primary/80 hover:bg-primary/5 transition-all">
                        <Plus className="w-5 h-5 text-primary" />
                        <span className="text-primary font-medium">Ajouter une année</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Ajouter un événement timeline</DialogTitle>
                        <DialogDescription>Ajoutez une nouvelle année à la timeline</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Année *</Label>
                          <Input
                            value={newTimelineItem.year}
                            onChange={(e) => setNewTimelineItem({ ...newTimelineItem, year: e.target.value })}
                            placeholder="2025"
                          />
                        </div>
                        <div>
                          <Label>Titre *</Label>
                          <Input
                            value={newTimelineItem.title}
                            onChange={(e) => setNewTimelineItem({ ...newTimelineItem, title: e.target.value })}
                            placeholder="Titre de l'événement"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newTimelineItem.description}
                            onChange={(e) => setNewTimelineItem({ ...newTimelineItem, description: e.target.value })}
                            placeholder="Description détaillée"
                          />
                        </div>
                        <div>
                          <Label>Image *</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleImageUpload(e.target.files[0]).then(base64 => {
                                  setNewTimelineItem({ ...newTimelineItem, image: base64 });
                                });
                              }
                            }}
                          />
                        </div>
                        <Button onClick={handleAddTimelineItem} className="w-full">Ajouter</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 bg-gradient-hero relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Notre Philosophie
            </span>
            <h2 className="font-display text-4xl md:text-6xl text-foreground mt-4 mb-6">
              Plus qu'un <span className="text-gradient-gold">Sport</span>
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              Le Jiu-Jitsu brésilien est une voie de transformation personnelle, 
              où chaque entraînement forge le caractère autant que la technique.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {philosophy.map((item, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm p-8 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl text-foreground mb-4 group-hover:text-gradient-gold transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center glass-card p-8 rounded-2xl group hover:border-primary/50 transition-all duration-300"
                style={{
                  animationDelay: stat.delay,
                }}
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="font-display text-4xl md:text-5xl text-gradient-gold mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rich Image Gallery - Different from Home */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Moments Capturés
            </span>
            <h2 className="font-display text-4xl md:text-6xl text-foreground mt-4 mb-6">
              Notre <span className="text-gradient-gold">Académie</span> en Images
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Chaque image raconte une histoire de dépassement, de camaraderie et de passion
            </p>
          </div>

          {/* Creative Masonry Layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {gallery.map((galleryItem, index) => (
              <div
                key={galleryItem.id}
                className={`${galleryItem.span.col} ${galleryItem.span.row} relative group overflow-hidden rounded-xl border-2 border-primary/20 shadow-lg image-glow`}
              >
                <img
                  src={galleryItem.image}
                  alt={`Académie Aranha - Moment ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Admin Edit/Delete Buttons */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Edit Button */}
                    <label className="p-2 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleEditGalleryImage(galleryItem.id, e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {/* Delete Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-2 rounded-lg bg-destructive/90 hover:bg-destructive text-destructive-foreground transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette image?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3">
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteGalleryItem(galleryItem.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}

            {/* Add New Gallery Item Button */}
            {isAdmin && (
              <label className="col-span-1 row-span-1 relative group overflow-hidden rounded-xl border-2 border-dashed border-primary/50 hover:border-primary/80 bg-primary/5 hover:bg-primary/10 flex items-center justify-center cursor-pointer transition-all">
                <div className="flex flex-col items-center gap-2">
                  <Plus className="w-8 h-8 text-primary" />
                  <span className="text-primary font-medium text-sm">Ajouter image</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleAddGalleryItem(e.target.files[0]);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="glass-card p-12 md:p-16 rounded-3xl max-w-4xl mx-auto text-center border-2 border-primary/20">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-6">
              Rejoignez Notre <span className="text-gradient-gold">Communauté</span>
            </h2>
            <p className="text-muted-foreground text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Découvrez votre potentiel et faites partie d'une tradition d'excellence 
              qui transforme des vies depuis plus de 15 ans.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button variant="hero" size="xl" className="group">
                  COMMENCER MAINTENANT
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/schedule">
                <Button variant="goldOutline" size="xl">
                  VOIR LES HORAIRES
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
