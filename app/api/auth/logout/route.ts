import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface ILogoutResponse {
  message: string;
  status: number;
}

export async function POST() {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 400 }
      );
    }

    return NextResponse.json<ILogoutResponse>(
      { message: "Logged out successfully", status: 200 },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
