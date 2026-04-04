import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

//libs
import { createClient } from "@/lib/supabase/server";
import { TABLE_NAMES } from "@/app/api/tableNames";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are a nutrition expert. You only output raw JSON. No explanations, no markdown, no code blocks. Only a valid JSON object.`;

const buildAnalyzePrompt = (productName: string) =>
  `Estimate the total nutritional values for this meal/product: "${productName}".
Provide your best estimate for the described portion.
Return exactly: {"kcal": <number|null>, "protein": <number|null>, "carbs": <number|null>, "fat": <number|null>}
All values must be numbers. kcal is kilocalories. protein, carbs, fat are in grams.
If you cannot estimate a value, use null.`;

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

    if (!productName || productName.trim().length === 0) {
      return NextResponse.json(
        { error: "product_name is required" },
        { status: 400 }
      );
    }

    const userContent: Anthropic.MessageParam["content"] = [];

    if (image) {
      const buffer = await image.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mediaType = (
        ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
          image.type
        )
          ? image.type
          : "image/jpeg"
      ) as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

      userContent.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      });
    }

    userContent.push({ type: "text", text: buildAnalyzePrompt(productName) });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const text =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : "";

    let parsed: Record<string, number | null>;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Could not parse AI response" },
        { status: 422 }
      );
    }

    const { kcal, protein, carbs, fat } = parsed;

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

    return NextResponse.json({ kcal, protein, carbs, fat }, { status: 200 });
  } catch (error) {
    console.error("Analyze product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
