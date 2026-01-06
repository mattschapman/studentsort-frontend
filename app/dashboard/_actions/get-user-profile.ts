// app/dashboard/_actions/get-user-profile.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export async function getUserProfile(): Promise<UserProfile> {
  const supabase = await createClient();

  // Get the current authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch the user's profile from the profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    // Fallback to auth user data if profile fetch fails
    return {
      id: user.id,
      name: user.email?.split("@")[0] || "User",
      email: user.email || "",
      avatar: null,
    };
  }

  return {
    id: profile.id,
    name: profile.display_name || profile.email?.split("@")[0] || "User",
    email: profile.email || user.email || "",
    avatar: profile.avatar_url,
  };
}