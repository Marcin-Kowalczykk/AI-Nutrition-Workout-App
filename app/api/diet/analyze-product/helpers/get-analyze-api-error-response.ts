import { NextResponse } from "next/server";

export const getAnalyzeApiErrorResponse = (error: unknown) => {
  const status = typeof error === "object" && error !== null && "status" in error
    ? (error as { status?: number }).status
    : undefined;

  if (status === 400) {
    return NextResponse.json(
      { error: "Invalid analysis request. Check the product description and image format." },
      { status: 400 }
    );
  }

  if (status === 401 || status === 403) {
    return NextResponse.json(
      { error: "AI provider authentication failed. Please contact support." },
      { status: 502 }
    );
  }

  if (status === 413) {
    return NextResponse.json(
      { error: "Uploaded image is too large for AI analysis. Try a smaller image." },
      { status: 413 }
    );
  }

  if (status === 429) {
    return NextResponse.json(
      { error: "AI provider rate limit reached. Please try again in a moment." },
      { status: 429 }
    );
  }

  if (status === 529) {
    return NextResponse.json(
      { error: "AI provider is temporarily overloaded. Please try again shortly." },
      { status: 503 }
    );
  }

  if (status && status >= 500) {
    return NextResponse.json(
      { error: "AI provider is temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "Analysis failed due to an unexpected server error." },
    { status: 500 }
  );
};
