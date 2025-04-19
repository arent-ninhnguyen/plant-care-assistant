import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (req.method === 'POST') {
    if (session) {
      // This is handled by NextAuth automatically via [...nextauth].js
      // This endpoint is just a placeholder to avoid 404 errors
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Not signed in" });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 