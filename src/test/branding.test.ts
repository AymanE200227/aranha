import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  APP_CONFIG_UPDATED_EVENT,
  getAppConfig,
  saveAppConfig,
  saveMedia,
} from "@/lib/storage";
import {
  applyBrandingToDocument,
  clearCustomLogo,
  getResolvedBrandName,
  getResolvedFaviconUrl,
  getResolvedLogoUrl,
  setCustomLogoDataUrl,
} from "@/lib/branding";

describe("Branding utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    document.title = "Test";
    document.head.querySelectorAll("link[rel~='icon']").forEach((node) => node.remove());
  });

  it("merges app config updates and dispatches events", () => {
    const listener = vi.fn();
    window.addEventListener(APP_CONFIG_UPDATED_EVENT, listener);

    saveAppConfig({ brandName: "Dojo One" });
    saveAppConfig({ primaryColor: "#112233" });

    const config = getAppConfig();
    expect(config?.brandName).toBe("Dojo One");
    expect(config?.primaryColor).toBe("#112233");
    expect(listener).toHaveBeenCalledTimes(2);

    window.removeEventListener(APP_CONFIG_UPDATED_EVENT, listener);
  });

  it("resolves logo from custom data url first", () => {
    saveAppConfig({ logoDataUrl: "data:image/png;base64,custom-logo" });
    expect(getResolvedLogoUrl()).toBe("data:image/png;base64,custom-logo");
  });

  it("resolves logo from media id when no custom logo exists", () => {
    saveMedia([
      {
        id: "logo-media-1",
        name: "Primary Logo",
        category: "other",
        url: "data:image/png;base64,from-media",
        type: "image/png",
        size: 100,
        uploadedAt: new Date().toISOString(),
      },
    ]);

    saveAppConfig({ logo: "logo-media-1", logoDataUrl: undefined });
    expect(getResolvedLogoUrl()).toBe("data:image/png;base64,from-media");
  });

  it("falls back to legacy logo key if app config has no logo", () => {
    localStorage.setItem("app_logo", "data:image/png;base64,legacy-logo");
    expect(getResolvedLogoUrl()).toBe("data:image/png;base64,legacy-logo");
  });

  it("sets and clears a custom logo", () => {
    setCustomLogoDataUrl("data:image/png;base64,new-logo");
    expect(getAppConfig()?.logoDataUrl).toBe("data:image/png;base64,new-logo");
    expect(localStorage.getItem("app_logo")).toBe("data:image/png;base64,new-logo");

    clearCustomLogo();
    expect(getAppConfig()?.logoDataUrl).toBeUndefined();
    expect(getAppConfig()?.logo).toBeUndefined();
    expect(localStorage.getItem("app_logo")).toBeNull();
  });

  it("resolves favicon, brand name and applies to document", () => {
    saveMedia([
      {
        id: "fav-media-1",
        name: "Favicon",
        category: "other",
        url: "data:image/png;base64,favicon",
        type: "image/png",
        size: 100,
        uploadedAt: new Date().toISOString(),
      },
    ]);
    saveAppConfig({ favicon: "fav-media-1", brandName: "Aranha Pro" });

    expect(getResolvedFaviconUrl()).toBe("data:image/png;base64,favicon");
    expect(getResolvedBrandName()).toBe("Aranha Pro");

    applyBrandingToDocument();
    const icon = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    expect(icon?.href).toContain("data:image/png;base64,favicon");
    expect(document.title).toBe("Aranha Pro");
  });
});
