import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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

// Only create the model if it doesn't exist already
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  return mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
  });
};

// This endpoint handles user registration
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB, checking if user exists');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user in database
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });
    
    // Save to database
    await newUser.save();
    console.log('New user saved to database:', newUser.email);
    
    // Generate a session token for the new user
    const token = Math.random().toString(36).substring(2, 15);
    
    // Set session cookie
    res.setHeader('Set-Cookie', `next-auth.session-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);
    
    // Return success with user data (without password)
    return res.status(201).json({ 
      success: true, 
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during registration' });
  }
} 