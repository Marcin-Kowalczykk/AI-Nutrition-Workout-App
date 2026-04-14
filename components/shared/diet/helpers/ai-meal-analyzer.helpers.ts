export { resizeImageForUpload as normalizeImageForUpload } from "./image-resize";

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
