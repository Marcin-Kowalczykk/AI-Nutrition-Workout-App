const MAX_UPLOAD_IMAGE_BYTES = 2.5 * 1024 * 1024;
const MAX_UPLOAD_IMAGE_DIMENSION = 2048;

export const normalizeImageForUpload = (file: File): Promise<File> => {
  if (!file.type.startsWith("image/")) return Promise.resolve(file);

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const maxSourceDimension = Math.max(img.width, img.height);
      const ratio = maxSourceDimension > MAX_UPLOAD_IMAGE_DIMENSION
        ? MAX_UPLOAD_IMAGE_DIMENSION / maxSourceDimension
        : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * ratio));
      canvas.height = Math.max(1, Math.round(img.height * ratio));
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const exportAsJpeg = (quality: number) => new Promise<Blob | null>((res) => {
        canvas.toBlob((blob) => res(blob), "image/jpeg", quality);
      });

      (async () => {
        const qualities = [0.9, 0.82, 0.74, 0.66, 0.58];
        for (const quality of qualities) {
          const blob = await exportAsJpeg(quality);
          if (!blob) continue;
          if (blob.size <= MAX_UPLOAD_IMAGE_BYTES || quality === qualities[qualities.length - 1]) {
            URL.revokeObjectURL(url);
            resolve(
              new File(
                [blob],
                `${file.name.replace(/\.[^/.]+$/, "") || "photo"}.jpg`,
                { type: "image/jpeg" }
              )
            );
            return;
          }
        }

        URL.revokeObjectURL(url);
        resolve(file);
      })();
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
};

export const getAnalyzeErrorMessage = (status: number, apiError?: string) => {
  if (status === 400) {
    if (apiError?.toLowerCase().includes("unsupported image type")) {
      return "Unsupported image format. Please upload JPG, PNG, GIF, or WEBP.";
    }
    return apiError ?? "Invalid request. Check the description and image format.";
  }

  if (status === 401 || status === 403) {
    return "You are not authorized. Please sign in again.";
  }

  if (status === 413) {
    return "Image is too large for analysis. Please use a smaller photo.";
  }

  if (status === 422) {
    if (apiError === "Could not parse AI response") {
      return "AI response could not be parsed. Please try again.";
    }
    if (apiError === "Could not estimate nutritional values") {
      return "This does not look like a food item. Please provide a clearer meal description.";
    }
    return apiError ?? "The meal could not be analyzed. Please try again.";
  }

  if (status === 429) {
    return apiError ?? "Rate limit reached. Please try again in a moment.";
  }

  if (status >= 500) {
    return apiError ?? "AI service is temporarily unavailable. Please try again shortly.";
  }

  return apiError ?? "Analysis failed. Please try again.";
};
