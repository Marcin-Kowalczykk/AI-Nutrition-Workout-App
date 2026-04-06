import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

//libs
import { createClient } from "@/lib/supabase/server";
import { TABLE_NAMES } from "@/app/api/tableNames";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are a nutrition and dietetics expert. You analyze meals based on a photo and text description to estimate nutritional values.

## How to assess portion size from the photo:
Look for reference points:
- Cutlery (fork ≈ 19cm, spoon ≈ 20cm)
- Plate (dinner plate ≈ 26-28cm, dessert plate ≈ 20cm)
- Glass / mug (≈ 250ml)
- Human hand visible in the photo

Use these to estimate the weight and volume of each component.
If no reference points are visible — assume a standard restaurant portion.

## Analysis rules:
1. Account for preparation method (fried, boiled, baked) — it significantly affects calories
2. Include non-visible but obvious ingredients: frying oil, butter, breading
3. If the description mentions ingredients not visible in the photo, include them in standard portion amounts
4. Provide values for the ENTIRE portion visible in the photo

## Response format — return ONLY a raw JSON object, no markdown, no code blocks, no extra text:
{
  "calories": <number>,
  "protein_g": <number>,
  "fat_g": <number>,
  "carbs_g": <number>,
  "fiber_g": <number>,
  "total_weight_g": <number>,
  "confidence": <"low"|"medium"|"high">,
  "breakdown": [
    {"name": <string>, "weight_g": <number>, "kcal": <number>}
  ],
  "warning": <string|null>
}

Field notes:
- breakdown: list every distinct component (ingredients, sides, sauces, cooking fat, breading, etc.) with estimated weight_g and kcal. Always include — minimum 1 item.
- confidence: "high" = visible reference points + simple meal; "medium" = standard plate or complex dish; "low" = no reference points or meal mostly out of frame
- warning: short note only for real quality issues (no reference points, partial meal, poor lighting, photo-description mismatch). Use null if none.
- language: detect the language of the meal description and use that same language for all text fields (breakdown names, warning). If the description is in Polish — respond in Polish. If English — respond in English. Etc.

## Important:
If the input is clearly not a food or meal (e.g. random words, objects, animals, places, abstract concepts), return all nutritional values as null.`;

const buildAnalyzePrompt = (productName: string, imageCount: number) =>
  `Analyse the meal and estimate nutritional values for the entire visible portion.

Meal name/description: "${productName}"

${imageCount === 0
    ? "No photo provided — use the description only to estimate a standard portion."
    : imageCount === 1
      ? "A photo is attached. Assess portion size based on reference points visible in the photo (plate, cutlery, glass)."
      : "Two photos are attached. Use both to better assess the meal and portion size based on reference points (plate, cutlery, glass)."}

Return ONLY JSON, no additional text.`;

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
        .select("ai_analyze_daily_limit")
        .eq("id", user.id)
        .single();
      const limit = profile?.ai_analyze_daily_limit ?? 5;

      const { data: usage } = await supabase
        .from(TABLE_NAMES.DIET_SCAN_USAGE)
        .select("count")
        .eq("user_id", user.id)
        .eq("date", today)
        .eq("type", "analyze")
        .single();

      currentUsageCount = usage?.count ?? 0;

      if (currentUsageCount >= limit) {
        return NextResponse.json(
          { error: "Daily AI analysis limit reached" },
          { status: 429 }
        );
      }
    }

    const formData = await request.formData();
    const productName = formData.get("product_name") as string | null;
    const image = formData.get("image") as File | null;
    const image2 = formData.get("image2") as File | null;

    if (!productName || productName.trim().length === 0) {
      return NextResponse.json(
        { error: "product_name is required" },
        { status: 400 }
      );
    }

    const validMediaTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const toImageBlock = async (file: File): Promise<Anthropic.ImageBlockParam> => {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mediaType = (validMediaTypes.includes(file.type) ? file.type : "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      return { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };
    };

    const userContent: Anthropic.MessageParam["content"] = [];
    const imageCount = (image ? 1 : 0) + (image2 ? 1 : 0);

    if (image) userContent.push(await toImageBlock(image));
    if (image2) userContent.push(await toImageBlock(image2));

    userContent.push({ type: "text", text: buildAnalyzePrompt(productName, imageCount) });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const rawText =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : "";

    const text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Could not parse AI response" },
        { status: 422 }
      );
    }

    const kcal = parsed.calories as number | null;
    const protein = parsed.protein_g as number | null;
    const carbs = parsed.carbs_g as number | null;
    const fat = parsed.fat_g as number | null;
    const confidence = parsed.confidence as string | null;
    const warning = parsed.warning as string | null;
    const breakdown = Array.isArray(parsed.breakdown) ? parsed.breakdown as { name: string; weight_g: number; kcal: number }[] : null;

    const allNull = [kcal, protein, carbs, fat].every(
      (v) => v === null || v === undefined
    );

    if (allNull) {
      return NextResponse.json(
        { error: "Could not estimate nutritional values" },
        { status: 422 }
      );
    }

    if (!isOwner) {
      await supabase.from(TABLE_NAMES.DIET_SCAN_USAGE).upsert(
        {
          user_id: user.id,
          date: today,
          type: "analyze",
          count: currentUsageCount + 1,
        },
        { onConflict: "user_id,date,type" }
      );
    }

    return NextResponse.json({ kcal, protein, carbs, fat, confidence, breakdown, warning }, { status: 200 });
  } catch (error) {
    console.error("Analyze product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
