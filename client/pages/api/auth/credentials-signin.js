import { authOptions } from './[...nextauth]';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { email, password } = req.body;
    
    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Make a request to the backend API for authentication
    try {
      const apiRes = await axios.post('http://localhost:5000/api/users/login', {
        email,
        password
      });
      
      if (apiRes.data && apiRes.data.user) {
        return res.status(200).json({
          user: {
            id: apiRes.data.user.id || apiRes.data.user._id,
            name: apiRes.data.user.name,
            email: apiRes.data.user.email
          },
          success: true
        });
      }
    } catch (apiError) {
      console.error('API error:', apiError.message);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // If no match, return error
    return res.status(401).json({ error: 'Invalid credentials' });
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 