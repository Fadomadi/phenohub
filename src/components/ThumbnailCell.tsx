import { normalizeTmpfilesUrl } from "@/lib/images";

const HTTP_PATTERN = /^https?:\/\//i;

type ThumbnailCellProps = {
  value: string | null | undefined;
  className?: string;
  imgClassName?: string;
  alt?: string;
  fallback?: string;
};

const ThumbnailCell = ({
  value,
  className,
  imgClassName,
  alt,
  fallback = "🌱",
}: ThumbnailCellProps) => {
  const content = typeof value === "string" ? value.trim() : "";
  const isUrl = content ? HTTP_PATTERN.test(content) : false;
  const normalized = isUrl ? normalizeTmpfilesUrl(content) : null;
  const imageSrc = normalized?.preview || normalized?.direct || (isUrl ? content : null);
  const display = content || fallback;
  const containerClass = className ?? "";
  const imageClass = imgClassName ?? "h-full w-full object-cover";
  const altText =
    alt || (imageSrc ? "Thumbnail" : display && display !== fallback ? display : "Thumbnail");

  return (
    <div className={containerClass}>
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt={altText} className={imageClass} loading="lazy" />
      ) : (
        <span>{display}</span>
      )}
    </div>
  );
};

export default ThumbnailCell;
