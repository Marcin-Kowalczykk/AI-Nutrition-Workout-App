import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { decryptPassword } from "@/lib/crypto";

export interface IUpdateProfileRequestBody {
  fullName?: string;
  password?: string;
  theme?: string;
}

export interface IUpdateProfileDBFields {
  full_name?: string;
  theme?: string;
}

export interface IUpdateProfileResponse {
  message: string;
  status: number;
}

export async function POST(request: Request) {
  try {
    const {
      fullName,
      password: encryptedPassword,
      theme,
    }: IUpdateProfileRequestBody = await request.json();

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const updateData: IUpdateProfileDBFields = {};
    if (fullName !== undefined) {
      updateData.full_name = fullName;
    }
    if (theme !== undefined) {
      updateData.theme = theme;
    }

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

    if (encryptedPassword) {
      let password: string;
      try {
        password = decryptPassword(encryptedPassword);
      } catch (decryptError) {
        console.error("Password decryption error:", decryptError);
        return NextResponse.json(
          { error: "Invalid password format" },
          { status: 400 }
        );
      }

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
      { message: "Profile updated successfully", status: 200 },
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
