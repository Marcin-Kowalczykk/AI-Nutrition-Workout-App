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

const SCAN_PROMPT = `Extract nutritional values from this label.
Always return per-100g values.
If the label also shows values for the full product AND states the total weight in grams, also return whole_product.
Return exactly:
{
  "kcal_per_100g": <number|null>,
  "protein_per_100g": <number|null>,
  "carbs_per_100g": <number|null>,
  "fat_per_100g": <number|null>,
  "whole_product": <{ "grams": number, "kcal": number, "protein": number, "carbs": number, "fat": number } | null>
}
All numeric values must be numbers. Use null when a value cannot be read clearly.
Only include whole_product when the label explicitly states the total package weight in grams AND total nutritional values for the whole product. Otherwise set whole_product to null.`;

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

    const { kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, whole_product: rawWp } =
      parsed;

    const whole_product = isValidWholeProduct(rawWp) ? rawWp : null;

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
      { kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, whole_product: whole_product ?? null },
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
