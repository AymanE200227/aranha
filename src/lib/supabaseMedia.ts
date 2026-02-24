import { supabase } from "@/integrations/supabase/client";

export const MEDIA_BUCKET = "aranha-media";

const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
};

export const uploadMediaFile = async (
  file: File,
  albumId: string,
  mediaId: string
): Promise<{ publicUrl: string; path: string }> => {
  const safeName = sanitizeFilename(file.name);
  const path = `${albumId}/${mediaId}-${safeName}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: "3600",
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return {
    publicUrl: data.publicUrl,
    path,
  };
};

export const removeMediaFile = async (path?: string): Promise<void> => {
  if (!path) return;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) {
    console.warn(`[media] Failed to delete file "${path}": ${error.message}`);
  }
};

export const getStoragePathFromPublicUrl = (publicUrl?: string): string | null => {
  if (!publicUrl) return null;

  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  const path = publicUrl.slice(markerIndex + marker.length);
  return path ? decodeURIComponent(path) : null;
};
