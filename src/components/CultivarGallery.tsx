"use client";

import { useMemo } from "react";
import GalleryPreview from "@/components/GalleryPreview";

type CultivarGalleryProps = {
  images: string[];
  name: string;
};

const CultivarGallery = ({ images, name }: CultivarGalleryProps) => {
  const normalized = useMemo(
    () => images.filter((image): image is string => typeof image === "string" && image.length > 0),
    [images],
  );

  return (
    <GalleryPreview
      images={normalized}
      name={name}
      className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm"
    />
  );
};

export default CultivarGallery;
