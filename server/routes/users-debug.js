const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Test MongoDB connection
router.get('/test-db', async (req, res) => {
  try {
    console.log('Debug: MongoDB connection state:', mongoose.connection.readyState);
    console.log('Debug: Connected to database:', mongoose.connection.db.databaseName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Debug: Collections:', collections.map(c => c.name));
    
    // Count users
    const userCount = await User.countDocuments();
    console.log('Debug: User count:', userCount);
    
    // Get all users (limit to 10)
    const users = await User.find().limit(10);
    console.log('Debug: Users:', users.map(u => ({ id: u._id, email: u.email })));
    
    res.json({
      connection: {
        state: mongoose.connection.readyState,
        database: mongoose.connection.db.databaseName
      },
      collections: collections.map(c => c.name),
      userCount,
      users: users.map(u => ({ id: u._id, email: u.email }))
    });
  } catch (error) {
    console.error('Debug Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Login user with debug logging
router.post('/login-debug', async (req, res) => {
  console.log('Login Debug: Request received', req.body);
  const { email, password } = req.body;
  
  if (!email || !password) {
    console.log('Login Debug: Missing email or password');
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    // Check MongoDB connection
    console.log('Login Debug: MongoDB connection state:', mongoose.connection.readyState);
    console.log('Login Debug: Connected to database:', mongoose.connection.db.databaseName);
    
    // Check if user exists
    console.log('Login Debug: Looking for user with email', email);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('Login Debug: User not found');
      
      // Check if there are any users in the database
      const userCount = await User.countDocuments();
      console.log('Login Debug: User count in database:', userCount);
      
      // List a few users to debug
      const someUsers = await User.find().limit(5);
      console.log('Login Debug: Some users in database:', 
        someUsers.map(u => ({ id: u._id, email: u.email }))
      );
      
      return res.status(400).json({ message: 'Invalid credentials (user not found)' });
    }
    
    console.log('Login Debug: User found', {
      id: user._id,
      email: user.email,
      passwordHash: user.password.substring(0, 10) + '...'
    });
    
    // Check password
    console.log('Login Debug: Comparing password');
    const isMatch = await user.comparePassword(password);
    console.log('Login Debug: Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('Login Debug: Password does not match');
      return res.status(400).json({ message: 'Invalid credentials (password mismatch)' });
    }
    
    // Generate JWT token
    console.log('Login Debug: Generating token');
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('Login Debug: Login successful');
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login Debug: Error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 