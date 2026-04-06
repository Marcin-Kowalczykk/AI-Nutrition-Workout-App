import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

//libs
import { createClient } from "@/lib/supabase/server";
import { TABLE_NAMES } from "@/app/api/tableNames";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are a nutrition and dietetics expert. Analyze meals from a photo and/or text description.

## Splitting rule — CRITICAL:
- If the description contains MULTIPLE DISTINCT food items that can be eaten independently (e.g. "twaróg, chleb, dżem" or "kotlet, ziemniaki, surówka" or "twaróg półtłusty 150g kapusta ogórek kiszony"), return each as a SEPARATE product entry.
- If the description is ONE DISH made of multiple ingredients (e.g. "kotlet schabowy w panierce", "spaghetti bolognese", "zupa pomidorowa"), return it as ONE product with a full ingredient breakdown.
- Key test: can each item be eaten as a standalone food without the others? If yes → separate products.

## How to assess portion size from the photo:
Look for reference points:
- Cutlery (fork ≈ 19cm, spoon ≈ 20cm)
- Plate (dinner plate ≈ 26-28cm, dessert plate ≈ 20cm)
- Glass / mug (≈ 250ml)
- Human hand visible in the photo

## Analysis rules:
1. Account for preparation method (fried, boiled, baked) — it significantly affects calories
2. Include non-visible but obvious ingredients: frying oil, butter, breading
3. If the description mentions ingredients not visible in the photo, include them in standard portion amounts
4. Provide values for the ENTIRE visible portion per product

## Response format — return ONLY a raw JSON object, no markdown, no code blocks, no extra text:
{
  "products": [
    {
      "product_name": <string>,
      "calories": <number>,
      "protein_g": <number>,
      "fat_g": <number>,
      "carbs_g": <number>,
      "breakdown": [
        {"name": <string>, "weight_g": <number>, "kcal": <number>}
      ]
    }
  ],
  "confidence": <"low"|"medium"|"high">,
  "warning": <string|null>
}

Field notes:
- products: always an array (even for a single dish)
- breakdown: for complex dishes list sub-ingredients with weight_g and kcal; for simple single-ingredient items list just that one item
- confidence/warning: apply to the overall analysis
- warning: only for real quality issues (no reference points, poor lighting, partial meal). Use null if none.
- language: detect the language of the meal description and respond in that same language for all text fields (product_name, breakdown names, warning)

## Important:
If the input is clearly not food (random words, objects, places), return: {"products": [], "confidence": "low", "warning": null}`;

const buildAnalyzePrompt = (productName: string, imageCount: number) =>
  `Analyse the meal and estimate nutritional values.

Meal name/description: "${productName}"

${imageCount === 0
    ? "No photo provided — use the description only to estimate standard portions."
    : imageCount === 1
      ? "A photo is attached. Assess portion size based on reference points visible in the photo (plate, cutlery, glass)."
      : "Two photos are attached. Use both to better assess the meal and portion size."}

Return ONLY the JSON object, no additional text.`;

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

    const rawProducts = parsed.products as Array<{
      product_name: string;
      calories: number | null;
      protein_g: number | null;
      fat_g: number | null;
      carbs_g: number | null;
      breakdown: { name: string; weight_g: number; kcal: number }[] | null;
    }> | null;

    if (!rawProducts || rawProducts.length === 0) {
      return NextResponse.json(
        { error: "Could not estimate nutritional values" },
        { status: 422 }
      );
    }

    const confidence = parsed.confidence as string | null;
    const warning = parsed.warning as string | null;

    const products = rawProducts.map((p) => ({
      product_name: p.product_name,
      kcal: p.calories,
      protein: p.protein_g,
      carbs: p.carbs_g,
      fat: p.fat_g,
      breakdown: Array.isArray(p.breakdown) ? p.breakdown : null,
    }));

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

    return NextResponse.json({ products, confidence, warning }, { status: 200 });
  } catch (error) {
    console.error("Analyze product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
