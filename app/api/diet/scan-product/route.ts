import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

//libs
import { createClient } from "@/lib/supabase/server";
import { TABLE_NAMES } from "@/app/api/tableNames";

const anthropic = new Anthropic({ maxRetries: 1 });

const PRIMARY_MODEL = "claude-sonnet-4-6";
const FALLBACK_MODEL = "claude-haiku-4-5-20251001";

const createMessageWithFallback = async (params: Anthropic.MessageCreateParamsNonStreaming) => {
  try {
    return await anthropic.messages.create(params);
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 529) {
      return await anthropic.messages.create({ ...params, model: FALLBACK_MODEL });
    }
    throw error;
  }
};

const SYSTEM_PROMPT = `You are a nutrition label parser. You only output raw JSON. No explanations, no markdown, no code blocks. Only a valid JSON object.`;

const SCAN_PROMPT = `You are reading a nutrition label photo. Follow these steps carefully.

STEP 1 — Locate the per-100g column.
Find the column or section explicitly labeled "100g", "per 100g", "na 100g", "100ml", "per 100ml", or an equivalent.
Read ONLY from that column for all _per_100g fields.
NEVER use values from "per serving", "per portion", "porcja", "per package", or any other column for _per_100g fields.

STEP 2 — Detect whole_product (optional).
Look for a second column or section that shows nutritional values for a SPECIFIC weight other than 100g.
This can be labeled as: "per portion Xg", "w porcji Xg", "per package", "per container", "270g", "330g", or similar — any explicit gram weight.
If such a column exists and the weight in grams is clearly stated, populate whole_product using those values and that gram weight.
Do NOT calculate, estimate, or derive whole_product values — extract them only when explicitly printed on the label.
If no such column exists, or the weight is unclear, set whole_product to null.

STEP 3 — Detect total_grams (optional).
Look anywhere on the label for the total/net product weight in grams.
This can appear as: "netto Xg", "masa netto Xg", "net weight Xg", "net Xg", a standalone value like "350g", "200 g", or any clearly printed gram amount that represents the total package/product size.
If found, set total_grams to that number. If whole_product already has a grams value, total_grams should match it.
If no clear total weight is found, set total_grams to null.

Return this exact JSON (no markdown, no code block, no explanation):
{
  "kcal_per_100g": <number|null>,
  "protein_per_100g": <number|null>,
  "carbs_per_100g": <number|null>,
  "fat_per_100g": <number|null>,
  "whole_product": <{ "grams": number, "kcal": number, "protein": number, "carbs": number, "fat": number } | null>,
  "total_grams": <number|null>
}

Rules:
- All values are plain numbers without units.
- Use null for any value that is not clearly readable.
- whole_product is null unless both total package weight AND total package nutrition are explicitly printed on the label.`;

const isValidWholeProduct = (wp: unknown): wp is { grams: number; kcal: number; protein: number; carbs: number; fat: number } => {
  if (!wp || typeof wp !== "object") return false;
  const o = wp as Record<string, unknown>;
  return (
    typeof o.grams === "number" &&
    typeof o.kcal === "number" &&
    typeof o.protein === "number" &&
    typeof o.carbs === "number" &&
    typeof o.fat === "number"
  );
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOwner = user.id === process.env.OWNER_USER_ID;
    const today = new Date().toISOString().split("T")[0];
    let currentUsageCount = 0;

    if (!isOwner) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("scan_daily_limit")
        .eq("id", user.id)
        .single();
      const limit = profile?.scan_daily_limit ?? 5;

      const { data: usage } = await supabase
        .from(TABLE_NAMES.DIET_SCAN_USAGE)
        .select("count")
        .eq("user_id", user.id)
        .eq("date", today)
        .eq("type", "scan")
        .single();

      currentUsageCount = usage?.count ?? 0;

      if (currentUsageCount >= limit) {
        return NextResponse.json(
          { error: "Daily scan limit reached" },
          { status: 429 }
        );
      }
    }

    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const buffer = await image.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mediaType = (
      ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(image.type)
        ? image.type
        : "image/jpeg"
    ) as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const response = await createMessageWithFallback({
      model: PRIMARY_MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: SCAN_PROMPT },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Scan product — JSON parse failed", {
        stopReason: response.stop_reason,
        rawTextPreview: text.slice(0, 200),
      });
      return NextResponse.json(
        { error: "Could not parse AI response" },
        { status: 422 }
      );
    }

    const { kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, whole_product: rawWp, total_grams: rawTotalGrams } =
      parsed;

    const whole_product = isValidWholeProduct(rawWp) ? rawWp : null;
    const total_grams = typeof rawTotalGrams === "number" ? rawTotalGrams : (whole_product?.grams ?? null);

    const allNull = [
      kcal_per_100g,
      protein_per_100g,
      carbs_per_100g,
      fat_per_100g,
    ].every((v) => v === null || v === undefined);

    if (allNull) {
      return NextResponse.json(
        { error: "Could not read nutritional values from image" },
        { status: 422 }
      );
    }

    if (!isOwner) {
      await supabase.from(TABLE_NAMES.DIET_SCAN_USAGE).upsert(
        { user_id: user.id, date: today, type: "scan", count: currentUsageCount + 1 },
        { onConflict: "user_id,date,type" }
      );
    }

    return NextResponse.json(
      { kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, whole_product: whole_product ?? null, total_grams: total_grams ?? null },
      { status: 200 }
    );
  } catch (error) {
    console.error("Scan product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
