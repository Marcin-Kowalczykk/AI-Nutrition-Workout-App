"use client";

import { createClient } from "./client";

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || null;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};
