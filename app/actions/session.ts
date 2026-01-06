"use server";

import { cookies } from "next/headers";

export async function storeSession(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  
  // 1. Manually set the Auth Token cookie
  // This matches the name Supabase expects (sb-[project-ref]-auth-token)
  // For local development, the project ref is often '127' or 'localhost' or 'default'.
  // We will set a generic one that our manual parser can find.
  
  const cookieName = "sb-127-auth-token"; // Standard for local Docker Supabase
  const sessionData = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {}, // We don't need the full user object here, just the token
  });

  // 2. Set the cookie with strict flags
  cookieStore.set(cookieName, `base64-${Buffer.from(sessionData).toString('base64')}`, {
    httpOnly: true,
    secure: false, // False for localhost
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return { success: true };
}