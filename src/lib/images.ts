export const normalizeTmpfilesUrl = (value: string | null | undefined) => {
  if (!value) {
    return { direct: value ?? "", preview: value ?? "" };
  }

  let previewUrl = value;
  if (previewUrl.startsWith("http://")) {
    previewUrl = previewUrl.replace("http://", "https://");
  }

  let directUrl = previewUrl;

  if (previewUrl.includes("tmpfiles.org")) {
    try {
      const parsed = new URL(previewUrl);
      const segments = parsed.pathname.split("/").filter(Boolean);
      const search = parsed.search ?? "";
      const host = `https://${parsed.hostname}`;

      const directSegments = [...segments];
      if (directSegments.length === 0) {
        directUrl = `${host}${parsed.pathname}${search}`;
      } else {
        if (directSegments[0] === "d") {
          directSegments[0] = "dl";
        } else if (directSegments[0] !== "dl") {
          directSegments.unshift("dl");
        }
        directUrl = `${host}/${directSegments.join("/")}${search}`;
      }

      const previewSegments = [...segments];
      if (previewSegments.length === 0) {
        previewUrl = `${host}${parsed.pathname}${search}`;
      } else {
        if (previewSegments[0] === "dl") {
          previewSegments.shift();
        }
        previewUrl =
          previewSegments.length > 0
            ? `${host}/${previewSegments.join("/")}${search}`
            : `${host}${search}`;
      }
    } catch {
      directUrl = previewUrl.replace("/d/", "/dl/").replace("/org:/", "/");
      previewUrl = previewUrl.replace("/dl/", "/");
    }
  }

  return { direct: directUrl, preview: previewUrl };
};

