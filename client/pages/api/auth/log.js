export default function handler(req, res) {
  // Log the authentication events but don't break the auth flow
  const { type, message } = req.body || {};
  
  console.log(`[Auth Log] ${type}: ${message}`);
  
  // Always return a valid JSON response
  res.status(200).json({ success: true });
} 