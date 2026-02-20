import {
  getAppConfig,
  getMediaItems,
  saveAppConfig,
  APP_CONFIG_UPDATED_EVENT,
} from "@/lib/storage";

const LEGACY_LOGO_KEY = "app_logo";

export const DEFAULT_BRAND_NAME = "ARANHA BJJ";
export const DEFAULT_FAVICON_URL = "/logo.svg";

const getMediaUrlById = (id?: string): string | null => {
  if (!id) return null;
  const media = getMediaItems().find((item) => item.id === id);
  return media?.url || null;
};

export const getResolvedLogoUrl = (): string | null => {
  const config = getAppConfig();
  if (config?.logoDataUrl) return config.logoDataUrl;

  const configLogo = getMediaUrlById(config?.logo);
  if (configLogo) return configLogo;

  const legacyLogo = localStorage.getItem(LEGACY_LOGO_KEY);
  return legacyLogo || null;
};

export const getResolvedFaviconUrl = (): string | null => {
  const config = getAppConfig();
  const configFavicon = getMediaUrlById(config?.favicon);
  return configFavicon || DEFAULT_FAVICON_URL;
};

export const getResolvedBrandName = (): string => {
  const config = getAppConfig();
  const brandName = config?.brandName?.trim();
  return brandName || DEFAULT_BRAND_NAME;
};

export const setCustomLogoDataUrl = (dataUrl: string): void => {
  saveAppConfig({ logoDataUrl: dataUrl, logo: undefined });
  localStorage.setItem(LEGACY_LOGO_KEY, dataUrl);
};

export const clearCustomLogo = (): void => {
  const config = getAppConfig() || {};
  saveAppConfig({ ...config, logo: undefined, logoDataUrl: undefined });
  localStorage.removeItem(LEGACY_LOGO_KEY);
};

export const subscribeBrandingUpdates = (callback: () => void): (() => void) => {
  const listener = () => callback();
  window.addEventListener(APP_CONFIG_UPDATED_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(APP_CONFIG_UPDATED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
};

export const applyBrandingToDocument = (): void => {
  const faviconUrl = getResolvedFaviconUrl();
  if (faviconUrl) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }

  document.title = getResolvedBrandName();
};
