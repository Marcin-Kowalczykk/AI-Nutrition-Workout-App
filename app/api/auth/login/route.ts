// utils
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { decryptPassword } from "@/lib/crypto";

// types
import { User } from "@supabase/supabase-js";

export interface ILoginRequestBody {
  email: string;
  password: string;
}

export interface ILoginResponse {
  message: string;
  user: User;
}

export async function POST(request: Request) {
  try {
    const { email, password: encryptedPassword } = await request.json();

    if (!email || !encryptedPassword) {
      return NextResponse.json(
        { error: "Email and password are required" },
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

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 401 }
      );
    }

    return NextResponse.json(
      { message: "Login successful", user: data.user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
