export default function handler(req, res) {
  const { error } = req.query;
  
  // Redirect to our client-side error page with the error parameter
  res.redirect(`/auth/error?error=${encodeURIComponent(error || 'Unknown authentication error')}`);
} 