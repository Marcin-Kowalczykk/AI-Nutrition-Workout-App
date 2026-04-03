import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

//libs
import { createClient } from "@/lib/supabase/server";
import { TABLE_NAMES } from "@/app/api/tableNames";

const anthropic = new Anthropic();

const SCAN_PROMPT = `You are analyzing a nutrition label photo. Extract ONLY the nutritional values per 100g.
Return a JSON object with exactly these keys: kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g.
All values must be numbers (not strings). If you cannot read a value clearly, use null.
Do not include any other text — only the JSON object.`;

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
