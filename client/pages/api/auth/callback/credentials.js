// This is the callback endpoint that NextAuth calls after credential authentication
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Define User model schema inline to avoid server-side imports in API routes
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Only create the model if it doesn't exist already
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  return mongoose.connect(process.env.MONGODB_URI);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get the credentials from the request
    const { email, password } = req.body;
    
    console.log('Login attempt:', email); // Log the login attempt
    
    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB, searching for user:', email);
    
    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // If no user found or password doesn't match
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('Login successful for user:', email);
    
    // Generate a JWT token for API access
    const accessToken = jwt.sign(
      { id: user._id.toString() },
      process.env.NEXTAUTH_SECRET || 'fallback_jwt_secret',
      { expiresIn: '7d' }
    );
    
    // Create session user object
    const sessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      accessToken: accessToken
    };
    
    // Set a session token cookie
    const token = Math.random().toString(36).substring(2, 15);
    res.setHeader('Set-Cookie', `next-auth.session-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);
    
    return res.status(200).json({ 
      user: sessionUser, 
      token: accessToken,
      url: '/dashboard' 
    });
    
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
} 