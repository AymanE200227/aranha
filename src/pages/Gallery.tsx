import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAlbums, createAlbum, updateAlbum, deleteAlbum, getMediaByAlbumId, createMediaFile, deleteMediaFile } from "@/lib/storage";
import { initializeIndexedDB, storeMediaBlobInIndexedDB, getMediaBlobUrl, deleteMediaFromIndexedDB, deleteAlbumMediaFromIndexedDB, getIndexedDBUsage } from "@/lib/indexeddb";
import { Album, MediaFile } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Image as ImageIcon, Video, X, ChevronLeft, Play, Upload, HardDrive } from "lucide-react";
import { toast } from "sonner";

const Gallery = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [showNewAlbumDialog, setShowNewAlbumDialog] = useState(false);
  const [showEditAlbumDialog, setShowEditAlbumDialog] = useState(false);
  const [showAddMediaDialog, setShowAddMediaDialog] = useState(false);
  const [newMediaTitle, setNewMediaTitle] = useState("");
  const [newMediaDesc, setNewMediaDesc] = useState("");
  const [newMediaType, setNewMediaType] = useState<"image" | "video">("image");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaThumbnail, setNewMediaThumbnail] = useState("");
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [newMediaThumbnailFile, setNewMediaThumbnailFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ used: number; available: number }>({ used: 0, available: 0 });
  const [resolvedMediaUrls, setResolvedMediaUrls] = useState<Record<string, string>>({}); // For IndexedDB URLs

  // Resolve IndexedDB URLs when media loads
  useEffect(() => {
    const resolveIndexedDBUrls = async () => {
      const urlMap: Record<string, string> = {};
      
      for (const mediaItem of media) {
        if (mediaItem.url.startsWith("indexeddb://")) {
          const idbId = mediaItem.url.replace("indexeddb://", "");
          const blobUrl = await getMediaBlobUrl(idbId);
          if (blobUrl) {
            urlMap[mediaItem.id] = blobUrl;
          }
        }
        
        if (mediaItem.thumbnail?.startsWith("indexeddb://")) {
          const thumbId = mediaItem.thumbnail.replace("indexeddb://", "");
          const blobUrl = await getMediaBlobUrl(thumbId);
          if (blobUrl) {
            urlMap[`${mediaItem.id}_thumb`] = blobUrl;
          }
        }
      }
      
      if (Object.keys(urlMap).length > 0) {
        setResolvedMediaUrls(urlMap);
      }
    };
    
    if (media.length > 0) {
      resolveIndexedDBUrls();
    }
  }, [media]);

  // Helper to get the actual URL for display
  const getMediaDisplayUrl = (mediaItem: MediaFile): string => {
    if (mediaItem.url.startsWith("indexeddb://")) {
      return resolvedMediaUrls[mediaItem.id] || "";
    }
    return mediaItem.url;
  };

  const getMediaThumbnailUrl = (mediaItem: MediaFile): string | undefined => {
    if (mediaItem.thumbnail?.startsWith("indexeddb://")) {
      return resolvedMediaUrls[`${mediaItem.id}_thumb`];
    }
    return mediaItem.thumbnail;
  };

  // File size limits
  const FILE_SIZES = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }
    
    // Initialize IndexedDB and load data
    const initDB = async () => {
      try {
        await initializeIndexedDB();
        loadAlbums();
        updateStorageInfo();
      } catch (error) {
        console.error("Failed to initialize IndexedDB:", error);
        toast.error("Erreur lors de l'initialisation de la base de données");
      }
    };
    
    initDB();
  }, [isAuthenticated, isLoading, navigate]);

  const updateStorageInfo = async () => {
    try {
      const usage = await getIndexedDBUsage();
      setStorageUsage({
        used: usage.usage,
        available: usage.quota,
      });
    } catch (error) {
      console.error("Failed to get storage info:", error);
    }
  };

  const loadAlbums = () => {
    const allAlbums = getAlbums();
    setAlbums(allAlbums);
  };

  // Simulate file encoding progress for large files
  const fileToBase64WithProgress = (file: File, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      reader.onload = () => {
        onProgress(100);
        resolve(reader.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error("Erreur lors de la lecture du fichier"));
      };

      reader.readAsDataURL(file);
    });
  };

  // Handle file selection for media
  const handleMediaFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      if (newMediaType === "image" && !file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner une image valide (JPG, PNG, GIF, WebP)");
        return;
      }

      if (newMediaType === "video" && !file.type.startsWith("video/")) {
        toast.error("Veuillez sélectionner une vidéo valide (MP4, WebM, Ogg)");
        return;
      }

      // Validate file size
      const maxSize = newMediaType === "image" ? FILE_SIZES.image : FILE_SIZES.video;
      if (file.size > maxSize) {
        const maxMB = maxSize / (1024 * 1024);
        toast.error(`Le fichier dépasse ${maxMB}MB. Veuillez sélectionner un fichier plus petit.`);
        return;
      }

      setNewMediaFile(file);
      if (!newMediaTitle) {
        setNewMediaTitle(file.name.replace(/\.[^/.]+$/, ""));
      }

      // For videos, only get duration and show placeholder
      if (newMediaType === "video") {
        // Create a blob URL for video preview (doesn't use localStorage)
        const blobUrl = URL.createObjectURL(file);
        setMediaPreview(blobUrl);
        toast.success("Vidéo sélectionnée. Une miniature est recommandée.");
      } else {
        // For images, convert to base64
        setIsUploading(true);
        setUploadProgress(0);
        const preview = await fileToBase64WithProgress(file, setUploadProgress);
        setMediaPreview(preview);
        setUploadProgress(0);
        setIsUploading(false);
      }
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      toast.error("Erreur lors de la sélection du fichier: " + (error instanceof Error ? error.message : "Erreur inconnue"));
    }
  };

  // Handle thumbnail file selection for video
  const handleThumbnailFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner une image valide pour la miniature");
        return;
      }

      if (file.size > FILE_SIZES.image) {
        toast.error("La miniature dépasse 10MB. Veuillez sélectionner une image plus petite.");
        return;
      }

      setNewMediaThumbnailFile(file);
      setIsUploading(true);
      setUploadProgress(0);
      const preview = await fileToBase64WithProgress(file, setUploadProgress);
      setThumbnailPreview(preview);
      setUploadProgress(0);
      setIsUploading(false);
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      toast.error("Erreur lors de la sélection de la miniature: " + (error instanceof Error ? error.message : "Erreur inconnue"));
    }
  };

  const handleCreateAlbum = () => {
    if (!newAlbumName.trim()) {
      toast.error("Le nom de l'album est requis");
      return;
    }

    const album = createAlbum({
      name: newAlbumName,
      description: newAlbumDesc,
    });

    setAlbums([...albums, album]);
    setNewAlbumName("");
    setNewAlbumDesc("");
    setShowNewAlbumDialog(false);
    toast.success("Album créé avec succès");
  };

  const handleUpdateAlbum = () => {
    if (!editingAlbum || !newAlbumName.trim()) {
      toast.error("Les données sont invalides");
      return;
    }

    const updated = updateAlbum(editingAlbum.id, {
      name: newAlbumName,
      description: newAlbumDesc,
    });

    if (updated) {
      setAlbums(albums.map((a) => (a.id === updated.id ? updated : a)));
      if (selectedAlbum?.id === updated.id) {
        setSelectedAlbum(updated);
      }
      setEditingAlbum(null);
      setNewAlbumName("");
      setNewAlbumDesc("");
      setShowEditAlbumDialog(false);
      toast.success("Album mis à jour");
    }
  };

  const handleDeleteAlbum = (albumId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet album et tous ses médias ?")) {
      if (deleteAlbum(albumId)) {
        // Also delete all media from IndexedDB
        deleteAlbumMediaFromIndexedDB(albumId).catch(console.error);
        
        setAlbums(albums.filter((a) => a.id !== albumId));
        if (selectedAlbum?.id === albumId) {
          setSelectedAlbum(null);
        }
        updateStorageInfo();
        toast.success("Album supprimé");
      }
    }
  };

  const handleOpenAlbum = (album: Album) => {
    setSelectedAlbum(album);
    const albumMedia = getMediaByAlbumId(album.id);
    setMedia(albumMedia);
  };

  const handleAddMedia = async () => {
    if (!selectedAlbum || !newMediaTitle.trim()) {
      toast.error("Veuillez remplir le titre du média");
      return;
    }

    // Check if either file or URL is provided
    if (!newMediaFile && !newMediaUrl.trim()) {
      toast.error("Veuillez sélectionner un fichier ou entrer une URL");
      return;
    }

    // If video without thumbnail
    if (newMediaType === "video" && !newMediaFile && !newMediaThumbnail.trim()) {
      toast.error("Veuillez fournir une miniature pour la vidéo");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      let finalUrl = newMediaUrl;
      let finalThumbnail = newMediaThumbnail;
      const mediaId = generateId();

      // If file is selected, store it in IndexedDB
      if (newMediaFile) {
        try {
          // Show progress
          setUploadProgress(50);
          
          // Store the blob in IndexedDB instead of base64
          await storeMediaBlobInIndexedDB(
            mediaId,
            selectedAlbum.id,
            newMediaType,
            newMediaFile,
            newMediaTitle,
            newMediaDesc,
            newMediaFile.type
          );

          // Use a special prefix to indicate IndexedDB storage
          finalUrl = `indexeddb://${mediaId}`;
          
          setUploadProgress(75);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          toast.error("Erreur IndexedDB: " + errorMsg);
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }
      }

      // Store thumbnail if provided
      if (newMediaThumbnailFile) {
        try {
          const thumbId = `thumb_${mediaId}`;
          await storeMediaBlobInIndexedDB(
            thumbId,
            selectedAlbum.id,
            "image",
            newMediaThumbnailFile,
            `${newMediaTitle} - Thumbnail`,
            newMediaDesc,
            newMediaThumbnailFile.type
          );
          finalThumbnail = `indexeddb://${thumbId}`;
        } catch (error) {
          console.warn("Failed to store thumbnail:", error);
          // Don't fail the entire operation if thumbnail fails
        }
      }

      // Create metadata record in localStorage
      const mediaFile = createMediaFile({
        albumId: selectedAlbum.id,
        type: newMediaType,
        url: finalUrl,
        thumbnail: finalThumbnail,
        title: newMediaTitle,
        description: newMediaDesc,
        size: newMediaFile ? newMediaFile.size : 0,
      });

      setMedia([...media, mediaFile]);
      resetMediaForm();
      setShowAddMediaDialog(false);
      setIsUploading(false);
      setUploadProgress(0);
      updateStorageInfo();
      toast.success("Média ajouté avec succès");
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error("Erreur lors de l'ajout du média: " + errorMsg);
    }
  };

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const resetMediaForm = () => {
    setNewMediaTitle("");
    setNewMediaDesc("");
    setNewMediaUrl("");
    setNewMediaThumbnail("");
    setNewMediaFile(null);
    setNewMediaThumbnailFile(null);
    setMediaPreview("");
    setThumbnailPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce média ?")) {
      const mediaItem = media.find((m) => m.id === mediaId);
      
      if (deleteMediaFile(mediaId)) {
        // Also delete from IndexedDB if stored there
        if (mediaItem?.url.startsWith("indexeddb://")) {
          const idbId = mediaItem.url.replace("indexeddb://", "");
          try {
            await deleteMediaFromIndexedDB(idbId);
          } catch (error) {
            console.error("Failed to delete from IndexedDB:", error);
          }
        }
        
        // Delete thumbnail from IndexedDB if exists
        if (mediaItem?.thumbnail?.startsWith("indexeddb://")) {
          const thumbId = mediaItem.thumbnail.replace("indexeddb://", "");
          try {
            await deleteMediaFromIndexedDB(thumbId);
          } catch (error) {
            console.error("Failed to delete thumbnail from IndexedDB:", error);
          }
        }
        
        setMedia(media.filter((m) => m.id !== mediaId));
        updateStorageInfo();
        toast.success("Média supprimé");
      }
    }
  };

  const openEditAlbumDialog = (album: Album) => {
    setEditingAlbum(album);
    setNewAlbumName(album.name);
    setNewAlbumDesc(album.description);
    setShowEditAlbumDialog(true);
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {!selectedAlbum ? (
            <>
              {/* Albums View */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-display text-4xl md:text-5xl text-foreground">
                    GALERIE <span className="text-gradient-gold">PHOTOS</span>
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Organisez vos photos et vidéos en albums
                  </p>
                </div>
                <Dialog open={showNewAlbumDialog} onOpenChange={setShowNewAlbumDialog}>
                  <DialogTrigger asChild>
                    {isAdmin ? (
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nouvel Album
                      </Button>
                    ) : (
                      <div />
                    )}
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Créer un nouvel album</DialogTitle>
                      <DialogDescription>
                        Donnez un nom et une description à votre nouvel album
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Nom de l'album *
                        </label>
                        <Input
                          placeholder="Ex: Événement du 15 février"
                          value={newAlbumName}
                          onChange={(e) => setNewAlbumName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Description
                        </label>
                        <Textarea
                          placeholder="Décrivez le contenu de cet album..."
                          value={newAlbumDesc}
                          onChange={(e) => setNewAlbumDesc(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setShowNewAlbumDialog(false)}
                        >
                          Annuler
                        </Button>
                        <Button onClick={handleCreateAlbum}>
                          Créer l'album
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Albums Grid */}
              {albums.length === 0 ? (
                <div className="pt-12 text-center">
                  <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground text-lg mb-4">
                    Aucun album pour le moment
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Créez votre premier album pour commencer
                  </p>
                  {isAdmin && (
                    <Button
                      onClick={() => setShowNewAlbumDialog(true)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Créer un album
                    </Button>
                  )}
                  {!isAdmin && (
                    <p className="text-sm text-muted-foreground italic">
                      Accès en lecture seule - Contactez un administrateur pour ajouter des albums
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {albums.map((album) => (
                    <div
                      key={album.id}
                      className="group cursor-pointer relative overflow-hidden rounded-xl border border-border/50 bg-secondary/30 transition-all hover:border-primary/50"
                      onClick={() => handleOpenAlbum(album)}
                    >
                      {/* Album Thumbnail */}
                      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
                        {album.thumbnail ? (
                          <img
                            src={album.thumbnail}
                            alt={album.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>

                      {/* Album Info */}
                      <div className="p-4">
                        <h3 className="font-display text-lg text-foreground line-clamp-2 mb-1">
                          {album.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {album.description || "Pas de description"}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs text-muted-foreground">
                            {album.mediaCount} élément{album.mediaCount !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xs text-primary">
                            {new Date(album.updatedAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>

                        {/* Album Actions */}
                        {isAdmin && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditAlbumDialog(album);
                              }}
                              className="flex-1 gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Éditer
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAlbum(album.id);
                              }}
                              className="gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Album Dialog */}
              <Dialog open={showEditAlbumDialog} onOpenChange={setShowEditAlbumDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Modifier l'album</DialogTitle>
                    <DialogDescription>
                      Mettez à jour les informations de votre album
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Nom de l'album
                      </label>
                      <Input
                        placeholder="Nom de l'album"
                        value={newAlbumName}
                        onChange={(e) => setNewAlbumName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Description
                      </label>
                      <Textarea
                        placeholder="Description..."
                        value={newAlbumDesc}
                        onChange={(e) => setNewAlbumDesc(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowEditAlbumDialog(false)}
                      >
                        Annuler
                      </Button>
                      <Button onClick={handleUpdateAlbum}>
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <>
              {/* Media View */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedAlbum(null)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <h1 className="font-display text-3xl text-foreground">
                      {selectedAlbum.name}
                    </h1>
                    {selectedAlbum.description && (
                      <p className="text-muted-foreground text-sm">
                        {selectedAlbum.description}
                      </p>
                    )}
                  </div>
                </div>
                <Dialog
                  open={showAddMediaDialog}
                  onOpenChange={(open) => {
                    setShowAddMediaDialog(open);
                    if (!open) {
                      resetMediaForm();
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    {isAdmin ? (
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Ajouter un média
                      </Button>
                    ) : (
                      <div />
                    )}
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Ajouter un nouveau média</DialogTitle>
                      <DialogDescription>
                        Ajoutez une photo ou une vidéo à cet album
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Type de média
                        </label>
                        <div className="flex gap-2">
                          <Button
                            variant={newMediaType === "image" ? "default" : "outline"}
                            className="flex-1 gap-2"
                            onClick={() => {
                              setNewMediaType("image");
                              setMediaPreview("");
                              setNewMediaFile(null);
                            }}
                          >
                            <ImageIcon className="w-4 h-4" />
                            Photo
                          </Button>
                          <Button
                            variant={newMediaType === "video" ? "default" : "outline"}
                            className="flex-1 gap-2"
                            onClick={() => {
                              setNewMediaType("video");
                              setMediaPreview("");
                              setNewMediaFile(null);
                            }}
                          >
                            <Video className="w-4 h-4" />
                            Vidéo
                          </Button>
                        </div>
                      </div>

                      {/* File Upload Section */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-3 block">
                          {newMediaType === "image" ? "Sélectionner une photo" : "Sélectionner une vidéo"}
                        </label>
                        <div className="space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={newMediaType === "image" ? "image/*" : "video/*"}
                            onChange={handleMediaFileSelect}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="w-4 h-4" />
                            Parcourir le disque
                          </Button>

                          {/* Media Preview */}
                          {mediaPreview && (
                            <div className="relative w-full rounded-lg bg-secondary/30 flex items-center justify-center overflow-hidden border border-border/50">
                              {newMediaType === "image" ? (
                                <div className="relative w-full h-40">
                                  <img
                                    src={mediaPreview}
                                    alt="preview"
                                    className="w-full h-full object-cover"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-2 right-2 hover:bg-black/50"
                                    onClick={() => {
                                      setMediaPreview("");
                                      setNewMediaFile(null);
                                      if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                  >
                                    <X className="w-4 h-4 text-white" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="w-full p-4 space-y-2">
                                  <div className="flex items-center gap-3">
                                    <Video className="w-6 h-6 text-primary flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">
                                        {newMediaFile?.name || "Vidéo sélectionnée"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {newMediaFile ? (newMediaFile.size / (1024 * 1024)).toFixed(2) : 0} MB
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setMediaPreview("");
                                        setNewMediaFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-amber-600 bg-amber-500/10 p-2 rounded">
                                    💡 Une miniature est recommandée pour les vidéos
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            ou entrez une URL ci-dessous
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Titre *
                        </label>
                        <Input
                          placeholder="Ex: Photo de groupe"
                          value={newMediaTitle}
                          onChange={(e) => setNewMediaTitle(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Description
                        </label>
                        <Textarea
                          placeholder="Décrivez le média..."
                          value={newMediaDesc}
                          onChange={(e) => setNewMediaDesc(e.target.value)}
                          rows={2}
                        />
                      </div>

                      {!newMediaFile && (
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            URL du média (optionnel si fichier sélectionné)
                          </label>
                          <Input
                            placeholder="https://exemple.com/image.jpg"
                            value={newMediaUrl}
                            onChange={(e) => setNewMediaUrl(e.target.value)}
                          />
                        </div>
                      )}

                      {newMediaType === "video" && !newMediaFile && (
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            URL de la miniature (optionnel)
                          </label>
                          <Input
                            placeholder="https://exemple.com/thumbnail.jpg"
                            value={newMediaThumbnail}
                            onChange={(e) => setNewMediaThumbnail(e.target.value)}
                          />
                        </div>
                      )}

                      {newMediaType === "video" && newMediaFile && !thumbnailPreview && (
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Miniature (optionnel pour les vidéos)
                          </label>
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/*";
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  const preview = await fileToBase64WithProgress(file, setUploadProgress);
                                  setThumbnailPreview(preview);
                                  setNewMediaThumbnailFile(file);
                                }
                              };
                              input.click();
                            }}
                          >
                            <Upload className="w-4 h-4" />
                            Ajouter une miniature
                          </Button>
                        </div>
                      )}

                      {thumbnailPreview && (
                        <div className="relative w-full h-24 rounded-lg bg-secondary/30 flex items-center justify-center overflow-hidden border border-border/50">
                          <img
                            src={thumbnailPreview}
                            alt="thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-1 right-1 hover:bg-black/50 h-6 w-6"
                            onClick={() => {
                              setThumbnailPreview("");
                              setNewMediaThumbnailFile(null);
                            }}
                          >
                            <X className="w-3 h-3 text-white" />
                          </Button>
                        </div>
                      )}

                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              {newMediaType === "video" ? "Encodage en cours" : "Chargement"}
                            </span>
                            <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden border border-border/50">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          disabled={isUploading}
                          onClick={() => {
                            resetMediaForm();
                            setShowAddMediaDialog(false);
                          }}
                        >
                          Annuler
                        </Button>
                        <Button 
                          onClick={handleAddMedia}
                          disabled={isUploading}
                        >
                          {isUploading ? `${uploadProgress}%` : "Ajouter"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Storage Info */}
              {storageUsage.available > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <HardDrive className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Espace de stockage</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {(storageUsage.used / (1024 * 1024)).toFixed(1)} MB / {(storageUsage.available / (1024 * 1024)).toFixed(0)} MB
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((storageUsage.used / storageUsage.available) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden border border-border/30">
                      <div
                        className={`h-full transition-all ${
                          storageUsage.used / storageUsage.available > 0.8
                            ? "bg-destructive"
                            : "bg-gradient-to-r from-primary to-accent"
                        }`}
                        style={{ width: `${Math.round((storageUsage.used / storageUsage.available) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Media Grid */}
              {media.length === 0 ? (
                <div className="pt-12 text-center">
                  <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground text-lg mb-4">
                    Cet album est vide
                  </p>
                  {isAdmin && (
                    <Button
                      onClick={() => setShowAddMediaDialog(true)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un média
                    </Button>
                  )}
                  {!isAdmin && (
                    <p className="text-sm text-muted-foreground italic">
                      Accès en lecture seule
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className="group relative h-48 rounded-lg overflow-hidden bg-secondary/30 border border-border/50 hover:border-primary/50 transition-all"
                    >
                      {/* Media Content */}
                      <div
                        className="w-full h-full cursor-pointer relative"
                        onClick={() => {
                          setSelectedMedia(item);
                          setShowMediaViewer(true);
                        }}
                      >
                      {item.type === "image" ? (
                          <img
                            src={getMediaDisplayUrl(item)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <>
                            <img
                              src={getMediaThumbnailUrl(item) || "https://via.placeholder.com/300x200"}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                              <Play className="w-12 h-12 text-white fill-white" />
                            </div>
                          </>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                          {isAdmin && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity space-y-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMedia(item.id);
                                }}
                                className="gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Media Info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium line-clamp-2">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Media Viewer Modal */}
              {showMediaViewer && selectedMedia && (
                <div
                  className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                  onClick={() => setShowMediaViewer(false)}
                >
                  <div className="max-w-4xl max-h-[90vh] relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
                      onClick={() => setShowMediaViewer(false)}
                    >
                      <X className="w-6 h-6" />
                    </Button>

                    {selectedMedia.type === "image" ? (
                      <img
                        src={getMediaDisplayUrl(selectedMedia)}
                        alt={selectedMedia.title}
                        className="max-h-[80vh] max-w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <video
                        src={getMediaDisplayUrl(selectedMedia)}
                        controls
                        className="max-h-[80vh] max-w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}

                    <div className="mt-4 text-white">
                      <h3 className="text-lg font-medium">{selectedMedia.title}</h3>
                      {selectedMedia.description && (
                        <p className="text-gray-300 text-sm mt-2">
                          {selectedMedia.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Gallery;
