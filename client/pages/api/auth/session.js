// This endpoint provides the current session to clients
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  try {
    // Set proper headers to avoid CORS issues
    res.setHeader('Content-Type', 'application/json');
    
    // Try to get the user session
    const session = await getServerSession(req, res, authOptions);
    
    // Return a simple response
    if (session) {
      // Return session or a minimal session if user is missing
      if (!session.user) {
        // If session exists but user is null, create a minimal user object
        return res.status(200).json({
          ...session,
          user: {
            name: "Authenticated User",
            email: "user@example.com"
          }
        });
      }
      return res.status(200).json(session);
    } else {
      return res.status(200).json({ user: null });
    }
  } catch (error) {
    console.error('Session API error:', error);
    // Return a proper error response rather than throwing
    return res.status(200).json({ 
      user: null, 
      error: 'Error fetching session' 
    });
  }
} 