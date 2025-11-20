import { Theme } from "@/components/shared/theme-toggle/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface IUserResponse {
  email: string;
  id: string;
}

export interface IProfileData {
  full_name: string;
  theme: Theme;
}

export interface IGetProfileResponse {
  user: IUserResponse;
  profile: IProfileData;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error loading profile:", profileError);
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json<IGetProfileResponse>(
      {
        user: {
          email: user.email || "",
          id: user.id,
        },
        profile: {
          full_name: profile?.full_name || "",
          theme: profile?.theme || "dark",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
