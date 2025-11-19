import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { decryptPassword } from "@/lib/crypto";

export async function POST(request: Request) {
  try {
    const { password: encryptedPassword } = await request.json();

    if (!encryptedPassword) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

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

    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 400 }
      );
    }

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
