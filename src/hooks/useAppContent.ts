import { useCallback, useEffect, useState } from "react";
import { getResolvedAppContent, subscribeContentUpdates } from "@/lib/content";
import type { AppContentMap } from "@/lib/storage";

export const useAppContent = (): AppContentMap => {
  const [content, setContent] = useState<AppContentMap>(() => getResolvedAppContent());

  const refreshContent = useCallback(() => {
    setContent(getResolvedAppContent());
  }, []);

  useEffect(() => {
    refreshContent();
    return subscribeContentUpdates(refreshContent);
  }, [refreshContent]);

  return content;
};
