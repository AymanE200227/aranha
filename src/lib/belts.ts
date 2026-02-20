import whiteBelt from "@/assets/belts/white.png";
import greyWhiteBelt from "@/assets/belts/grey_white.png";
import greyBelt from "@/assets/belts/grey.png";
import greyBlackBelt from "@/assets/belts/grey_black.png";
import yellowWhiteBelt from "@/assets/belts/yellow_white.png";
import yellowBelt from "@/assets/belts/yellow.png";
import yellowBlackBelt from "@/assets/belts/yellow_black.png";
import orangeWhiteBelt from "@/assets/belts/orange_white.png";
import orangeBelt from "@/assets/belts/orange.png";
import orangeBlackBelt from "@/assets/belts/orange_black.png";
import greenWhiteBelt from "@/assets/belts/green_white.png";
import greenBelt from "@/assets/belts/green.png";
import greenBlackBelt from "@/assets/belts/green_black.png";
import blueBelt from "@/assets/belts/blue.png";
import purpleBelt from "@/assets/belts/purple.png";
import brownBelt from "@/assets/belts/brown.png";
import blackBelt from "@/assets/belts/black.png";
import redBlackBelt from "@/assets/belts/red_black.png";
import redWhiteBelt from "@/assets/belts/red_white.png";
import redBelt from "@/assets/belts/red.png";

export type BeltCategory = "kids_4_15" | "adult_16_plus" | "black_belt";

export type BeltOption = {
  value: string;
  label: string;
  minDegree: number;
  maxDegree: number;
  image: string;
};

const BELT_IMAGES: Record<string, string> = {
  white: whiteBelt,
  grey_white: greyWhiteBelt,
  grey: greyBelt,
  grey_black: greyBlackBelt,
  yellow_white: yellowWhiteBelt,
  yellow: yellowBelt,
  yellow_black: yellowBlackBelt,
  orange_white: orangeWhiteBelt,
  orange: orangeBelt,
  orange_black: orangeBlackBelt,
  green_white: greenWhiteBelt,
  green: greenBelt,
  green_black: greenBlackBelt,
  blue: blueBelt,
  purple: purpleBelt,
  brown: brownBelt,
  black: blackBelt,
  red_black: redBlackBelt,
  red_white: redWhiteBelt,
  red: redBelt,
};

export const BELT_OPTIONS: Record<BeltCategory, BeltOption[]> = {
  kids_4_15: [
    { value: "white", label: "Blanche", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.white },
    { value: "grey_white", label: "Gris / Blanc", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.grey_white },
    { value: "grey", label: "Grise", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.grey },
    { value: "grey_black", label: "Gris / Noir", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.grey_black },
    { value: "yellow_white", label: "Jaune / Blanc", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.yellow_white },
    { value: "yellow", label: "Jaune", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.yellow },
    { value: "yellow_black", label: "Jaune / Noir", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.yellow_black },
    { value: "orange_white", label: "Orange / Blanc", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.orange_white },
    { value: "orange", label: "Orange", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.orange },
    { value: "orange_black", label: "Orange / Noir", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.orange_black },
    { value: "green_white", label: "Vert / Blanc", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.green_white },
    { value: "green", label: "Verte", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.green },
    { value: "green_black", label: "Vert / Noir", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.green_black },
  ],
  adult_16_plus: [
    { value: "white", label: "Blanche", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.white },
    { value: "blue", label: "Bleue", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.blue },
    { value: "purple", label: "Violette", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.purple },
    { value: "brown", label: "Marron", minDegree: 0, maxDegree: 4, image: BELT_IMAGES.brown },
    { value: "black", label: "Noire", minDegree: 0, maxDegree: 0, image: BELT_IMAGES.black },
  ],
  black_belt: [
    { value: "black", label: "Noire", minDegree: 0, maxDegree: 6, image: BELT_IMAGES.black },
    { value: "red_black", label: "Rouge / Noire", minDegree: 7, maxDegree: 7, image: BELT_IMAGES.red_black },
    { value: "red_white", label: "Rouge / Blanche", minDegree: 8, maxDegree: 8, image: BELT_IMAGES.red_white },
    { value: "red", label: "Rouge", minDegree: 9, maxDegree: 10, image: BELT_IMAGES.red },
  ],
};

export const BELT_CATEGORY_LABELS: Record<BeltCategory, string> = {
  kids_4_15: "Enfants (4-15 ans)",
  adult_16_plus: "Adultes (16+ ans)",
  black_belt: "Ceinture noire",
};

export type PromotionResult = {
  nextLabel: string;
  waitYears: number;
  nextCategory?: BeltCategory;
  notes?: string;
} | null;

const ADULT_PROMOTION_WAIT: Record<string, { next: string; years: number } | undefined> = {
  white: { next: "blue", years: 2 },
  blue: { next: "purple", years: 2 },
  purple: { next: "brown", years: 1.5 },
  brown: { next: "black", years: 1 },
};

const BLACK_DEGREE_WAIT: Record<number, number> = {
  0: 3,
  1: 3,
  2: 3,
  3: 5,
  4: 5,
  5: 5,
};

const KIDS_ORDER = BELT_OPTIONS.kids_4_15.map((b) => b.value);

const getLabel = (category: BeltCategory, value: string): string =>
  BELT_OPTIONS[category].find((b) => b.value === value)?.label ?? value;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const getBeltImage = (beltName: string): string => BELT_IMAGES[beltName] ?? BELT_IMAGES.white;

export const getBeltOption = (category: BeltCategory, beltName: string): BeltOption =>
  BELT_OPTIONS[category].find((belt) => belt.value === beltName) ?? BELT_OPTIONS[category][0];

export const getBeltDegreeValues = (belt: BeltOption): number[] => {
  const values: number[] = [];
  for (let i = belt.minDegree; i <= belt.maxDegree; i += 1) values.push(i);
  return values;
};

export const normalizeBeltDegree = (category: BeltCategory, beltName: string, beltDegree: number): number => {
  const belt = getBeltOption(category, beltName);
  return clamp(Number.isFinite(beltDegree) ? beltDegree : belt.minDegree, belt.minDegree, belt.maxDegree);
};

export const formatBeltRank = (category: BeltCategory, beltName: string, beltDegree: number): string => {
  const belt = getBeltOption(category, beltName);
  const degree = normalizeBeltDegree(category, beltName, beltDegree);
  if (belt.maxDegree === 0) return `Ceinture ${belt.label}`;
  if (belt.minDegree === belt.maxDegree) return `Ceinture ${belt.label} (${belt.minDegree}e degre)`;
  return `Ceinture ${belt.label}${degree > 0 ? ` (${degree}e degre)` : ""}`;
};

export const getPromotionResult = (
  category: BeltCategory,
  beltName: string,
  beltDegree: number
): PromotionResult => {
  const degree = normalizeBeltDegree(category, beltName, beltDegree);

  if (category === "kids_4_15") {
    const idx = KIDS_ORDER.indexOf(beltName);
    if (idx === -1) return null;
    if (idx < KIDS_ORDER.length - 1) {
      const next = KIDS_ORDER[idx + 1];
      return { nextLabel: `Ceinture ${getLabel(category, next)}`, waitYears: 1 };
    }
    return {
      nextLabel: "Ceinture Bleue (passage adulte a partir de 16 ans)",
      waitYears: 1,
      nextCategory: "adult_16_plus",
    };
  }

  if (category === "adult_16_plus") {
    const conf = ADULT_PROMOTION_WAIT[beltName];
    if (conf) {
      return { nextLabel: `Ceinture ${getLabel(category, conf.next)}`, waitYears: conf.years };
    }
    if (beltName === "black") {
      return {
        nextLabel: "Ceinture Noire 1er degre",
        waitYears: 3,
        nextCategory: "black_belt",
        notes: "Basculer vers la categorie ceinture noire pour gerer les degres 1 a 10.",
      };
    }
    return null;
  }

  if (category === "black_belt") {
    if (beltName === "black") {
      if (degree <= 5) {
        return {
          nextLabel: `Ceinture Noire ${degree + 1}e degre`,
          waitYears: BLACK_DEGREE_WAIT[degree] ?? 3,
        };
      }
      if (degree === 6) {
        return { nextLabel: "Ceinture Rouge / Noire (7e degre)", waitYears: 7 };
      }
      return null;
    }

    if (beltName === "red_black") {
      return { nextLabel: "Ceinture Rouge / Blanche (8e degre)", waitYears: 7 };
    }

    if (beltName === "red_white") {
      return { nextLabel: "Ceinture Rouge (9e degre)", waitYears: 10 };
    }

    if (beltName === "red") {
      if (degree === 9) return { nextLabel: "Ceinture Rouge (10e degre)", waitYears: 10 };
      return null;
    }
  }

  return null;
};
