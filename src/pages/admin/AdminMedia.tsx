import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Plus,
  Save,
  RotateCcw,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import {
  getMediaItems,
  saveMedia,
  getAppConfig,
  saveAppConfig,
  type AppConfig,
  type AppContentMap,
  type MediaItem,
} from "@/lib/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import AdminShell from "@/components/admin/AdminShell";
import {
  clearCustomLogo,
  setCustomLogoDataUrl,
  subscribeBrandingUpdates,
} from "@/lib/branding";
import { getResolvedAppContent, resetContentOverrides, saveContentOverrides } from "@/lib/content";

const MEDIA_CATEGORIES = ["gallery", "coaches", "hero", "other"] as const;
const MAX_MEDIA_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_LOGO_UPLOAD_BYTES = 3 * 1024 * 1024;

const QUICK_CONTENT_FIELDS: Array<{ key: string; label: string; multiline?: boolean }> = [
  {
    key: "home.coaches.coach_1_description",
    label: "Description Coach 1 (Fondateur...)",
    multiline: true,
  },
  {
    key: "home.coaches.coach_2_description",
    label: "Description Coach 2",
    multiline: true,
  },
  {
    key: "home.coaches.coach_1_name",
    label: "Nom Coach 1",
  },
  {
    key: "home.coaches.coach_2_name",
    label: "Nom Coach 2",
  },
  {
    key: "home.coaches.coach_1_title",
    label: "Titre Coach 1",
  },
  {
    key: "home.coaches.coach_2_title",
    label: "Titre Coach 2",
  },
  {
    key: "schedule.badge",
    label: "Badge Emploi du Temps",
  },
  {
    key: "schedule.title_prefix",
    label: "Titre Emploi (prefixe)",
  },
  {
    key: "schedule.title_highlight",
    label: "Titre Emploi (highlight)",
  },
  {
    key: "schedule.description",
    label: "Description Emploi du Temps",
    multiline: true,
  },
  {
    key: "stats.badge",
    label: "Badge Statistiques",
  },
  {
    key: "stats.title_prefix",
    label: "Titre Stats (prefixe)",
  },
  {
    key: "stats.title_highlight",
    label: "Titre Stats (highlight)",
  },
  {
    key: "stats.description",
    label: "Description Statistiques",
    multiline: true,
  },
  {
    key: "stats.login.title",
    label: "Bloc connexion Stats (titre)",
  },
  {
    key: "stats.login.description",
    label: "Bloc connexion Stats (description)",
    multiline: true,
  },
];

export default function AdminMedia() {
  const navigate = useNavigate();
  const { logout, isAdmin, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig>({});
  const [contentDraft, setContentDraft] = useState<AppContentMap>({});
  const [contentJson, setContentJson] = useState("");
  const [contentError, setContentError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  const loadMedia = useCallback(() => {
    setMediaItems(getMediaItems());
  }, []);

  const loadAppConfig = useCallback(() => {
    setAppConfig(getAppConfig() || {});
    const resolvedContent = getResolvedAppContent();
    setContentDraft(resolvedContent);
    setContentJson(JSON.stringify(resolvedContent, null, 2));
    setContentError(null);
  }, []);

  const filterMedia = useCallback(() => {
    const loweredSearch = searchTerm.trim().toLowerCase();
    const filtered = mediaItems.filter((media) => {
      if (selectedCategory !== "all" && media.category !== selectedCategory) return false;
      if (!loweredSearch) return true;
      return (
        media.name.toLowerCase().includes(loweredSearch) ||
        (media.description || "").toLowerCase().includes(loweredSearch)
      );
    });
    setFilteredMedia(filtered);
  }, [mediaItems, searchTerm, selectedCategory]);

  useEffect(() => {
    loadMedia();
    loadAppConfig();
  }, [loadMedia, loadAppConfig]);

  useEffect(() => {
    filterMedia();
  }, [filterMedia]);

  useEffect(() => subscribeBrandingUpdates(loadAppConfig), [loadAppConfig]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast({
          title: "Format non supporte",
          description: `${file.name} doit etre une image ou une video`,
        });
        return;
      }

      if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} depasse 8 MB`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (readEvent) => {
        const newMedia: MediaItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          name: file.name,
          category,
          url: readEvent.target?.result as string,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          description: "",
        };

        setMediaItems((previous) => {
          const updated = [...previous, newMedia];
          saveMedia(updated);
          return updated;
        });

        toast({
          title: "Upload reussi",
          description: `${file.name} a ete ajoute`,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpdateMedia = (media: MediaItem) => {
    setMediaItems((previous) => {
      const updated = previous.map((item) => (item.id === media.id ? media : item));
      saveMedia(updated);
      return updated;
    });
    setEditingMedia(null);
    toast({
      title: "Mise a jour reussie",
      description: "Le media a ete modifie",
    });
  };

  const handleDeleteMedia = (id: string) => {
    setMediaItems((previous) => {
      const updated = previous.filter((item) => item.id !== id);
      saveMedia(updated);
      return updated;
    });
    setIsDeleteDialogOpen(false);
    setMediaToDelete(null);
    toast({
      title: "Suppression reussie",
      description: "Le media a ete supprime",
    });
  };

  const handleSetLogo = (mediaId: string) => {
    saveAppConfig({ ...appConfig, logo: mediaId, logoDataUrl: undefined });
    loadAppConfig();
    toast({
      title: "Logo mis a jour",
      description: "Le logo de l'application a ete modifie",
    });
  };

  const handleSetFavicon = (mediaId: string) => {
    saveAppConfig({ ...appConfig, favicon: mediaId });
    loadAppConfig();
    toast({
      title: "Favicon mise a jour",
      description: "La favicon de l'application a ete modifiee",
    });
  };

  const handleDirectLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Format non supporte",
        description: "Le logo doit etre une image",
      });
      return;
    }
    if (file.size > MAX_LOGO_UPLOAD_BYTES) {
      toast({
        title: "Logo trop volumineux",
        description: "Le logo ne doit pas depasser 3 MB",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCustomLogoDataUrl(reader.result as string);
      loadAppConfig();
      toast({
        title: "Logo importe",
        description: "Le logo est maintenant partage sur toute l'application",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    clearCustomLogo();
    loadAppConfig();
    toast({
      title: "Logo reinitialise",
      description: "Le logo est revenu au style par defaut",
    });
  };

  const handleSaveContent = () => {
    try {
      const parsed = JSON.parse(contentJson) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setContentError("Le contenu doit etre un objet JSON cle/valeur.");
        return;
      }

      const parsedObject = parsed as Record<string, unknown>;
      const invalidKey = Object.entries(parsedObject).find(([, value]) => typeof value !== "string");
      if (invalidKey) {
        setContentError(`La cle "${invalidKey[0]}" doit contenir une valeur texte.`);
        return;
      }

      saveContentOverrides(parsedObject as Record<string, string>);
      const resolvedContent = getResolvedAppContent();
      setContentDraft(resolvedContent);
      setContentJson(JSON.stringify(resolvedContent, null, 2));
      setContentError(null);
      toast({
        title: "Contenu sauvegarde",
        description: "Les textes de l'application ont ete mis a jour.",
      });
    } catch (error) {
      setContentError("JSON invalide. Verifiez le format avant d'enregistrer.");
      console.error("Invalid content JSON:", error);
    }
  };

  const handleResetContent = () => {
    resetContentOverrides();
    const resolvedContent = getResolvedAppContent();
    setContentDraft(resolvedContent);
    setContentJson(JSON.stringify(resolvedContent, null, 2));
    setContentError(null);
    toast({
      title: "Contenu reinitialise",
      description: "Les textes sont revenus a leur version par defaut.",
    });
  };

  const handleQuickContentChange = (key: string, value: string) => {
    setContentDraft((previous) => {
      const next = { ...previous, [key]: value };
      setContentJson(JSON.stringify(next, null, 2));
      return next;
    });
    if (contentError) setContentError(null);
  };

  const categories = useMemo(
    () => ["all", ...new Set(mediaItems.map((media) => media.category))],
    [mediaItems]
  );

  const currentLogo = appConfig.logoDataUrl
    ? { url: appConfig.logoDataUrl, name: "Logo upload direct" }
    : appConfig.logo
      ? mediaItems.find((media) => media.id === appConfig.logo)
      : null;

  const currentFavicon = appConfig.favicon
    ? mediaItems.find((media) => media.id === appConfig.favicon)
    : null;

  if (isLoading) return null;

  return (
    <AdminShell onLogout={() => {
      logout();
      navigate("/");
    }}>
      <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">Gestion des Medias</h1>
            <p className="text-muted-foreground">
              Gere les medias, le logo, la favicon et les elements de branding de l'application.
            </p>
          </div>

          <Tabs defaultValue="media" className="space-y-6">
            <TabsList>
              <TabsTrigger value="media">Medias</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="content">Contenu</TabsTrigger>
            </TabsList>

            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Importer des Medias
                  </CardTitle>
                  <CardDescription>Ajoute des images et des videos par categorie.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {MEDIA_CATEGORIES.map((category) => (
                      <div key={category}>
                        <Label htmlFor={`upload-${category}`} className="mb-2 flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Ajouter a {category}
                        </Label>
                        <Input
                          id={`upload-${category}`}
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={(event) => handleFileUpload(event, category)}
                          className="cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Filtrer les Medias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Rechercher par nom ou description..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category === "all" ? "Tous" : category}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMedia.map((media) => (
                  <Card key={media.id} className="overflow-hidden">
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img src={media.url} alt={media.name} className="h-full w-full object-cover" />
                    </div>
                    <CardContent className="pb-4 pt-4">
                      <h3 className="mb-2 truncate font-semibold">{media.name}</h3>
                      <p className="mb-2 text-sm text-muted-foreground">
                        {media.category} - {(media.size / 1024).toFixed(2)} KB
                      </p>
                      {media.description && (
                        <p className="mb-4 text-sm text-muted-foreground">{media.description}</p>
                      )}
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setEditingMedia(media)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editer le Media</DialogTitle>
                            </DialogHeader>
                            {editingMedia && editingMedia.id === media.id && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Nom</Label>
                                  <Input
                                    value={editingMedia.name}
                                    onChange={(event) =>
                                      setEditingMedia({ ...editingMedia, name: event.target.value })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <Input
                                    value={editingMedia.description || ""}
                                    onChange={(event) =>
                                      setEditingMedia({
                                        ...editingMedia,
                                        description: event.target.value,
                                      })
                                    }
                                    placeholder="Optionnel"
                                  />
                                </div>
                                <div>
                                  <Label>Categorie</Label>
                                  <select
                                    value={editingMedia.category}
                                    onChange={(event) =>
                                      setEditingMedia({
                                        ...editingMedia,
                                        category: event.target.value,
                                      })
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                                  >
                                    {MEDIA_CATEGORIES.map((category) => (
                                      <option key={category} value={category}>
                                        {category}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <Button onClick={() => handleUpdateMedia(editingMedia)} className="w-full">
                                  <Save className="mr-2 h-4 w-4" />
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
                            setMediaToDelete(media.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredMedia.length === 0 && (
                <div className="py-12 text-center">
                  <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucun media trouve</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration du Branding</CardTitle>
                  <CardDescription>Gere logo, favicon et nom de marque.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="border-b pb-8">
                    <h3 className="mb-4 text-lg font-semibold">Logo Principal</h3>
                    {currentLogo && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm text-muted-foreground">Logo actuel:</p>
                        <img src={currentLogo.url} alt="Current Logo" className="mb-2 h-20 w-auto" />
                        <p className="text-xs text-muted-foreground">{currentLogo.name}</p>
                      </div>
                    )}
                    <div className="mb-4 space-y-2">
                      <Label htmlFor="direct-logo-upload">Upload direct du logo</Label>
                      <Input
                        id="direct-logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleDirectLogoUpload}
                      />
                      <Button type="button" variant="outline" onClick={handleResetLogo}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reinitialiser le logo
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {mediaItems.map((media) => (
                        <Button
                          key={media.id}
                          variant={appConfig.logo === media.id ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => handleSetLogo(media.id)}
                        >
                          <img src={media.url} alt={media.name} className="mr-3 h-8 w-8 rounded object-cover" />
                          {media.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="border-b pb-8">
                    <h3 className="mb-4 text-lg font-semibold">Favicon</h3>
                    {currentFavicon && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm text-muted-foreground">Favicon actuelle:</p>
                        <img src={currentFavicon.url} alt="Current Favicon" className="mb-2 h-8 w-8" />
                      </div>
                    )}
                    <div className="space-y-2">
                      {mediaItems.map((media) => (
                        <Button
                          key={media.id}
                          variant={appConfig.favicon === media.id ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => handleSetFavicon(media.id)}
                        >
                          <img src={media.url} alt={media.name} className="mr-3 h-6 w-6 rounded object-cover" />
                          {media.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Informations de l'Application</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Nom de la Marque</Label>
                        <Input
                          value={appConfig.brandName || ""}
                          onChange={(event) => setAppConfig({ ...appConfig, brandName: event.target.value })}
                          placeholder="Dojo Academy"
                        />
                      </div>
                      <div>
                        <Label>Couleur Primaire</Label>
                        <Input
                          type="color"
                          value={appConfig.primaryColor || "#000000"}
                          onChange={(event) => setAppConfig({ ...appConfig, primaryColor: event.target.value })}
                        />
                      </div>
                      <Button
                        onClick={() => {
                          saveAppConfig(appConfig);
                          loadAppConfig();
                          toast({
                            title: "Configuration sauvegardee",
                            description: "Les parametres de branding sont a jour",
                          });
                        }}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Enregistrer la Configuration
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contenu Editable de l'Application</CardTitle>
                  <CardDescription>
                    Modifie tous les textes via JSON. Chaque cle represente un texte de l'interface.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 rounded-lg border border-border/60 bg-secondary/20 p-4">
                    <p className="text-sm font-medium text-foreground">Edition rapide (Coach, Emploi, Stats)</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {QUICK_CONTENT_FIELDS.map((field) => (
                        <div key={field.key} className={field.multiline ? "md:col-span-2" : ""}>
                          <Label className="mb-1 block">{field.label}</Label>
                          {field.multiline ? (
                            <textarea
                              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={contentDraft[field.key] || ""}
                              onChange={(event) => handleQuickContentChange(field.key, event.target.value)}
                            />
                          ) : (
                            <Input
                              value={contentDraft[field.key] || ""}
                              onChange={(event) => handleQuickContentChange(field.key, event.target.value)}
                            />
                          )}
                          <p className="mt-1 text-[11px] text-muted-foreground">{field.key}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <textarea
                    className="min-h-[420px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                    value={contentJson}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setContentJson(nextValue);
                      try {
                        const parsed = JSON.parse(nextValue) as unknown;
                        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                          const validDraft = Object.entries(parsed as Record<string, unknown>).reduce<AppContentMap>(
                            (accumulator, [key, value]) => {
                              if (typeof value === "string") {
                                accumulator[key] = value;
                              }
                              return accumulator;
                            },
                            {}
                          );
                          setContentDraft(validDraft);
                        }
                      } catch {
                        // Keep draft unchanged until JSON becomes valid again.
                      }
                      if (contentError) setContentError(null);
                    }}
                  />
                  {contentError && (
                    <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {contentError}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={handleSaveContent}>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer le contenu
                    </Button>
                    <Button type="button" variant="outline" onClick={handleResetContent}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reinitialiser le contenu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le Media ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas etre annulee. Le media sera supprime definitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mediaToDelete && handleDeleteMedia(mediaToDelete)}
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

