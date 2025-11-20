import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { decryptPassword } from "@/lib/crypto";
import { Session, User } from "@supabase/supabase-js";

export interface IRegisterRequestBody {
  email: string;
  password: string;
  fullName: string;
}

export interface IRegisterResponse {
  message: string;
  user: {
    user: User | null;
    session: Session | null;
  };
}

export async function POST(request: Request) {
  try {
    const {
      email,
      password: encryptedPassword,
      fullName,
    } = await request.json();

    if (!email || !encryptedPassword || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 400 }
      );
    }

    return NextResponse.json(
      { message: "Registration successful", user: data.user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
