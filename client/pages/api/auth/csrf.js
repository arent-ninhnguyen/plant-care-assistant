import { getCsrfToken } from "next-auth/react";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  // Generate a random token if one doesn't exist
  const csrfToken = Math.random().toString(36).substring(2, 15);
  
  // Set cookie with the CSRF token
  res.setHeader("Set-Cookie", `next-auth.csrf-token=${csrfToken}|${csrfToken}; Path=/; HttpOnly; SameSite=Lax`);
  
  // Return the token
  res.json({ csrfToken });
} 