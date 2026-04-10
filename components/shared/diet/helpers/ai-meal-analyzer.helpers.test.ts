import { afterEach, describe, expect, it, vi } from "vitest";

import { getAnalyzeErrorMessage, normalizeImageForUpload } from "./ai-meal-analyzer.helpers";

describe("getAnalyzeErrorMessage", () => {
  it("returns dedicated message for unsupported image type", () => {
    const result = getAnalyzeErrorMessage(400, "Unsupported image type. Use JPEG, PNG, GIF, or WEBP.");
    expect(result).toBe("Unsupported image format. Please upload JPG, PNG, GIF, or WEBP.");
  });

  it("returns parse-specific message for 422", () => {
    const result = getAnalyzeErrorMessage(422, "Could not parse AI response");
    expect(result).toBe("AI response could not be parsed. Please try again.");
  });

  it("returns size-specific message for 413", () => {
    const result = getAnalyzeErrorMessage(413);
    expect(result).toBe("Image is too large for analysis. Please use a smaller photo.");
  });

  it("returns fallback message for server errors without API payload", () => {
    const result = getAnalyzeErrorMessage(503);
    expect(result).toBe("AI service is temporarily unavailable. Please try again shortly.");
  });
});

describe("normalizeImageForUpload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns same file for non-image uploads", async () => {
    const file = new File(["plain-text"], "notes.txt", { type: "text/plain" });
    const result = await normalizeImageForUpload(file);
    expect(result).toBe(file);
  });

  it("returns original file when image decoding fails", async () => {
    const createObjectURLMock = vi.fn(() => "blob:mock");
    const revokeObjectURLMock = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURLMock,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectURLMock,
      writable: true,
      configurable: true,
    });

    const OriginalImage = global.Image;
    class MockImage {
      public onload: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      public width = 1000;
      public height = 750;

      set src(_value: string) {
        this.onerror?.();
      }
    }
    // @ts-expect-error test-only Image mock
    global.Image = MockImage;

    const file = new File(["fake-image"], "photo.heic", { type: "image/heic" });
    const result = await normalizeImageForUpload(file);

    expect(result).toBe(file);
    expect(createObjectURLMock).toHaveBeenCalledOnce();
    expect(revokeObjectURLMock).toHaveBeenCalledOnce();

    global.Image = OriginalImage;
  });
});
