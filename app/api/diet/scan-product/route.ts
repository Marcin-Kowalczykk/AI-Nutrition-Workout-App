import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

//libs
import { createClient } from "@/lib/supabase/server";
import { TABLE_NAMES } from "@/app/api/tableNames";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are a nutrition label parser. You only output raw JSON. No explanations, no markdown, no code blocks. Only a valid JSON object.`;

const SCAN_PROMPT = `Extract nutritional values per 100g from this label.
Return exactly: {"kcal_per_100g": <number|null>, "protein_per_100g": <number|null>, "carbs_per_100g": <number|null>, "fat_per_100g": <number|null>}
All values must be numbers. If you cannot read a value clearly, use null.`;

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

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
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

    let parsed: Record<string, number | null>;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Could not parse AI response" },
        { status: 422 }
      );
    }

    const { kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g } =
      parsed;

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
        { user_id: user.id, date: today, count: currentUsageCount + 1 },
        { onConflict: "user_id,date" }
      );
    }

    return NextResponse.json(
      { kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g },
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
