import { cn } from "@/lib/utils";

const DEFAULT_LOGO_SRC = "/logo.svg";

const getBrandInitials = (brandName: string): string => {
  const chunks = brandName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const initials = chunks.map((chunk) => chunk.charAt(0).toUpperCase()).join("");
  return initials || "JJ";
};

type BrandLogoProps = {
  logo?: string | null;
  brandName: string;
  alt?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  initialsClassName?: string;
};

export default function BrandLogo({
  logo,
  brandName,
  alt,
  imageClassName,
  fallbackClassName,
  initialsClassName,
}: BrandLogoProps) {
  const resolvedLogo = logo || DEFAULT_LOGO_SRC;

  return (
    <img
      src={resolvedLogo}
      alt={alt || `${brandName} logo`}
      className={cn("h-10 w-auto object-contain", imageClassName, fallbackClassName)}
      onError={(event) => {
        const target = event.currentTarget;
        target.onerror = null;
        target.src = `data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='20' fill='%23c99b1f'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='15' font-family='Arial' fill='%230b0b0c'>${getBrandInitials(
            brandName
          )}</text></svg>`
        )}`;
      }}
    />
  );
}
