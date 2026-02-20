import { describe, expect, it } from "vitest";
import {
  BELT_OPTIONS,
  formatBeltRank,
  getBeltDegreeValues,
  getBeltImage,
  getBeltOption,
  getPromotionResult,
  normalizeBeltDegree,
} from "@/lib/belts";

describe("Belts logic", () => {
  it("returns belt images for known and unknown belts", () => {
    expect(getBeltImage("blue")).toBeTruthy();
    expect(getBeltImage("unknown-belt")).toBeTruthy();
  });

  it("returns default belt option for unknown belt name", () => {
    const fallback = getBeltOption("adult_16_plus", "unknown");
    expect(fallback.value).toBe(BELT_OPTIONS.adult_16_plus[0].value);
  });

  it("builds degree ranges correctly", () => {
    const values = getBeltDegreeValues(BELT_OPTIONS.black_belt[3]);
    expect(values).toEqual([9, 10]);
  });

  it("normalizes belt degrees by min and max values", () => {
    expect(normalizeBeltDegree("black_belt", "red_white", 1)).toBe(8);
    expect(normalizeBeltDegree("black_belt", "red", 14)).toBe(10);
    expect(normalizeBeltDegree("adult_16_plus", "white", Number.NaN)).toBe(0);
  });

  it("formats belt rank with degree labels", () => {
    expect(formatBeltRank("adult_16_plus", "purple", 2)).toBe("Ceinture Violette (2e degre)");
    expect(formatBeltRank("adult_16_plus", "black", 3)).toBe("Ceinture Noire");
    expect(formatBeltRank("black_belt", "red_black", 7)).toBe("Ceinture Rouge / Noire (7e degre)");
  });

  it("returns kids promotion path with one-year wait", () => {
    const promotion = getPromotionResult("kids_4_15", "yellow", 2);
    expect(promotion?.nextLabel).toContain("Jaune / Noir");
    expect(promotion?.waitYears).toBe(1);
  });

  it("returns adult promotion path and black transition", () => {
    const whitePromotion = getPromotionResult("adult_16_plus", "white", 0);
    expect(whitePromotion?.nextLabel).toContain("Bleue");
    expect(whitePromotion?.waitYears).toBe(2);

    const blackTransition = getPromotionResult("adult_16_plus", "black", 0);
    expect(blackTransition?.nextCategory).toBe("black_belt");
    expect(blackTransition?.waitYears).toBe(3);
  });

  it("returns black belt degree progression timings", () => {
    const degree3 = getPromotionResult("black_belt", "black", 3);
    expect(degree3?.nextLabel).toContain("4e degre");
    expect(degree3?.waitYears).toBe(5);

    const degree6 = getPromotionResult("black_belt", "black", 6);
    expect(degree6?.nextLabel).toContain("Rouge / Noire");
    expect(degree6?.waitYears).toBe(7);

    const red9 = getPromotionResult("black_belt", "red", 9);
    expect(red9?.nextLabel).toContain("10e degre");
    expect(red9?.waitYears).toBe(10);

    const red10 = getPromotionResult("black_belt", "red", 10);
    expect(red10).toBeNull();
  });
});
