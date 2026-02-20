import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  Edit2,
  Image as ImageIcon,
  Plus,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { getAboutContent, saveAboutContent, deleteAboutItem } from "@/lib/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import AdminShell from "@/components/admin/AdminShell";

interface AboutImage {
  id: string;
  title: string;
  image: string;
  section: "timeline" | "gallery" | "team";
  year?: string;
  description?: string;
  uploadedAt: string;
}

type AboutSection = AboutImage["section"];
const MAX_ABOUT_IMAGE_BYTES = 8 * 1024 * 1024;

export default function AdminAbout() {
  const navigate = useNavigate();
  const { logout, isAdmin, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [aboutItems, setAboutItems] = useState<AboutImage[]>([]);
  const [filteredItems, setFilteredItems] = useState<AboutImage[]>([]);
  const [selectedSection, setSelectedSection] = useState("timeline");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<AboutImage | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  const loadAboutContent = useCallback(() => {
    const stored = getAboutContent();
    setAboutItems(stored);
  }, []);

  const filterItems = useCallback(() => {
    let filtered = aboutItems;

    if (selectedSection !== "all") {
      filtered = filtered.filter((item) => item.section === selectedSection);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [aboutItems, searchTerm, selectedSection]);

  useEffect(() => {
    loadAboutContent();
  }, [loadAboutContent]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, section: AboutSection) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Format non supporte",
          description: `${file.name} doit etre une image`,
        });
        return;
      }

      if (file.size > MAX_ABOUT_IMAGE_BYTES) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} depasse 8 MB`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newItem: AboutImage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          image: event.target?.result as string,
          section,
          description: "",
          uploadedAt: new Date().toISOString(),
        };

        const updated = [...aboutItems, newItem];
        saveAboutContent(updated);
        setAboutItems(updated);
        toast({
          title: "Success",
          description: `${file.name} added successfully`,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpdateItem = (item: AboutImage) => {
    const updated = aboutItems.map((i) => (i.id === item.id ? item : i));
    saveAboutContent(updated);
    setAboutItems(updated);
    setEditingItem(null);
    toast({
      title: "Success",
      description: "Item updated successfully",
    });
  };

  const handleDeleteItem = (id: string) => {
    const updated = aboutItems.filter((i) => i.id !== id);
    saveAboutContent(updated);
    setAboutItems(updated);
    deleteAboutItem(id);
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
    toast({
      title: "Success",
      description: "Item deleted successfully",
    });
  };

  if (isLoading) return null;

  return (
    <AdminShell onLogout={() => {
      logout();
      navigate("/");
    }}>
      <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Gestion A Propos</h1>
            <p className="text-muted-foreground">
              Gerez toutes les images et contenus de la page A Propos
            </p>
          </div>

          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Ajouter du Contenu
              </CardTitle>
              <CardDescription>Uploadez des images pour differentes sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {( ["timeline", "gallery", "team"] as AboutSection[]).map((section) => (
                <div key={section}>
                  <Label htmlFor={`upload-${section}`} className="flex items-center gap-2 mb-2">
                    <Plus className="w-4 h-4" />
                    Ajouter a {section === "timeline" ? "Timeline" : section === "gallery" ? "Galerie" : "Equipe"}
                  </Label>
                  <Input
                    id={`upload-${section}`}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, section)}
                    className="cursor-pointer"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Filtrer le Contenu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Rechercher par titre ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex gap-2 flex-wrap">
                {["all", "timeline", "gallery", "team"].map((section) => (
                  <Button
                    key={section}
                    variant={selectedSection === section ? "default" : "outline"}
                    onClick={() => setSelectedSection(section)}
                  >
                    {section === "all" ? "Toutes" : section === "timeline" ? "Timeline" : section === "gallery" ? "Galerie" : "Equipe"}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative bg-slate-100 h-48 overflow-hidden group">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Inline Action Buttons */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editer le Contenu</DialogTitle>
                        </DialogHeader>
                        {editingItem && editingItem.id === item.id && (
                          <div className="space-y-4">
                            <div>
                              <Label>Titre</Label>
                              <Input
                                value={editingItem.title}
                                onChange={(e) =>
                                  setEditingItem({
                                    ...editingItem,
                                    title: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label>Annee (pour Timeline)</Label>
                              <Input
                                value={editingItem.year || ""}
                                onChange={(e) =>
                                  setEditingItem({
                                    ...editingItem,
                                    year: e.target.value,
                                  })
                                }
                                placeholder="ex: 2020"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <textarea
                                value={editingItem.description || ""}
                                onChange={(e) =>
                                  setEditingItem({
                                    ...editingItem,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Description optionnelle"
                                className="w-full px-3 py-2 border rounded-md"
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label>Section</Label>
                              <select
                                value={editingItem.section}
                                onChange={(e) =>
                                  setEditingItem({
                                    ...editingItem,
                                    section: e.target.value as AboutSection,
                                  })
                                }
                                className="w-full px-3 py-2 border rounded-md"
                              >
                                <option value="timeline">Timeline</option>
                                <option value="gallery">Galerie</option>
                                <option value="team">Equipe</option>
                              </select>
                            </div>
                            <Button
                              onClick={() => handleUpdateItem(editingItem)}
                              className="w-full"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Enregistrer
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setItemToDelete(item.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="pt-4 pb-4">
                  <h3 className="font-semibold truncate mb-2">{item.title}</h3>
                  {item.year && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Annee: {item.year}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.section === "timeline" ? "Timeline" : item.section === "gallery" ? "Galerie" : "Equipe"}
                  </p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun contenu trouve</p>
            </div>
          )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le Contenu?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas etre annulee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && handleDeleteItem(itemToDelete)}
              className="bg-destructive"
            >
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}


