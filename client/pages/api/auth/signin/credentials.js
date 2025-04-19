// This endpoint serves as an intermediary for credential-based login
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Extract the credentials from the request body
    const { email, password, csrfToken, callbackUrl } = req.body;
    
    // Validate CSRF token (simplified check)
    if (!csrfToken) {
      return res.status(400).json({ error: 'CSRF token missing' });
    }
    
    // Redirect to the callback URL with the credentials
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('password', password);
    if (callbackUrl) params.append('callbackUrl', callbackUrl);
    
    // Forward to the callback endpoint
    return res.status(200).json({ 
      url: `/api/auth/callback/credentials?${params.toString()}` 
    });
  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 