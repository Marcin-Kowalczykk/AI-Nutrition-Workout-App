import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type UpdateProfileRequest = {
  fullName?: string;
  password?: string;
  theme?: string;
};

export async function POST(request: Request) {
  try {
    const { fullName, password, theme }: UpdateProfileRequest =
      await request.json();

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const updateData: { full_name?: string; theme?: string } = {};
    if (fullName !== undefined) {
      updateData.full_name = fullName;
    }
    if (theme !== undefined) {
      updateData.theme = theme;
    }

    // Update profile if there's data to update
    if (Object.keys(updateData).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 400 }
        );
      }
    }

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: password,
      });

      if (passwordError) {
        return NextResponse.json(
          { error: passwordError.message },
          { status: passwordError.status || 400 }
        );
      }
    }

    return NextResponse.json(
      { message: "Profile updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
