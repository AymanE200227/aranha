import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_CONTENT_UPDATED_EVENT, getAppContent } from "@/lib/storage";
import {
  DEFAULT_APP_CONTENT,
  getContentValue,
  getResolvedAppContent,
  resetContentOverrides,
  saveContentOverrides,
} from "@/lib/content";

describe("Content override utilities", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns defaults when there are no overrides", () => {
    const content = getResolvedAppContent();
    expect(content["navbar.link.home"]).toBe(DEFAULT_APP_CONTENT["navbar.link.home"]);
    expect(content["auth.title_login"]).toBe(DEFAULT_APP_CONTENT["auth.title_login"]);
  });

  it("merges overrides on top of defaults", () => {
    saveContentOverrides({
      "navbar.link.home": "Maison",
      "home.hero.cta_primary": "DEMARRER",
    });

    const content = getResolvedAppContent();
    expect(content["navbar.link.home"]).toBe("Maison");
    expect(content["home.hero.cta_primary"]).toBe("DEMARRER");
    expect(content["auth.title_login"]).toBe(DEFAULT_APP_CONTENT["auth.title_login"]);
  });

  it("getContentValue falls back in the expected order", () => {
    expect(getContentValue("unknown.key", "Fallback value")).toBe("Fallback value");
    expect(getContentValue("auth.title_login")).toBe(DEFAULT_APP_CONTENT["auth.title_login"]);

    saveContentOverrides({
      "auth.title_login": "LOGIN CUSTOM",
    });
    expect(getContentValue("auth.title_login")).toBe("LOGIN CUSTOM");
  });

  it("dispatches update event and stores only string values", () => {
    const listener = vi.fn();
    window.addEventListener(APP_CONTENT_UPDATED_EVENT, listener);

    saveContentOverrides({
      "navbar.link.home": "Start",
      "bad.value": 12 as unknown as string,
    });

    const saved = getAppContent();
    expect(saved["navbar.link.home"]).toBe("Start");
    expect(saved["bad.value"]).toBeUndefined();
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(APP_CONTENT_UPDATED_EVENT, listener);
  });

  it("resets overrides back to defaults", () => {
    saveContentOverrides({
      "navbar.link.home": "Start",
    });
    resetContentOverrides();

    expect(getAppContent()).toEqual({});
    expect(getResolvedAppContent()["navbar.link.home"]).toBe(DEFAULT_APP_CONTENT["navbar.link.home"]);
  });
});
