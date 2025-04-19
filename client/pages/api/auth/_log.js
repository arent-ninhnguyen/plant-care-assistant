// This endpoint is used by NextAuth for debugging purposes
export default function handler(req, res) {
  if (req.method === 'POST') {
    console.log('[NextAuth]', req.body);
    res.status(200).json({ success: true });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 