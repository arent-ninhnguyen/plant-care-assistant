const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the destination directory for avatar uploads
const avatarUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');

// Ensure the upload directory exists
if (!fs.existsSync(avatarUploadDir)){
    fs.mkdirSync(avatarUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarUploadDir); // Save uploads to server/public/uploads/avatars
  },
  filename: function (req, file, cb) {
    // Create a unique filename: userId-timestamp.extension
    const uniqueSuffix = req.user.id + '-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

// Configure multer instance
const upload = multer({ 
  storage: storage, 
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit
  },
  fileFilter: fileFilter
});

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      password
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl 
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check if user exists - explicitly select password here
    const user = await User.findOne({ email }).select('+password'); 
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user data including avatarUrl
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    // req.user.id comes from the auth middleware
    const user = await User.findById(req.user.id); // No need to select('-password') as it's default
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Return necessary user fields
    res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User Name
router.put('/me', auth, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id; // Get user ID from auth middleware

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    // Find user and update name in one step
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return updated user info (already excludes password by default)
    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl
    });
  } catch (error) {
    console.error('Error updating user name:', error);
    res.status(500).json({ message: 'Server error while updating name' });
  }
});

// Update User Password
router.put('/me/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required' });
  }

  if (newPassword.length < 6) { // Example minimum length validation
     return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  try {
    // Need to find user first to compare password, explicitly select password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the current password matches
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // Update the password (pre-save hook in User model will hash it)
    user.password = newPassword;
    await user.save(); // Use save() to trigger pre-save hook

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error while updating password' });
  }
});

// Update User Avatar
router.put('/me/avatar', auth, upload.single('avatar'), async (req, res, next) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: 'No avatar image file uploaded' });
  }

  let oldAvatarPath = null; // Variable to store the path of the old avatar

  try {
    // --- Step 1: Find the user to get the old avatar URL ---
    const user = await User.findById(userId);
    if (!user) {
      // If user not found, delete the newly uploaded file before returning error
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting uploaded avatar for non-existent user:", err);
      });
      return res.status(404).json({ message: 'User not found' });
    }
    // Store the old relative path if it exists
    if (user.avatarUrl) {
      oldAvatarPath = user.avatarUrl; 
    }

    // --- Step 2: Construct the new URL path ---
    const newAvatarUrl = `/uploads/avatars/${req.file.filename}`;

    // --- Step 3: Update user with the new avatar URL ---
    user.avatarUrl = newAvatarUrl;
    const updatedUser = await user.save(); // Use save to ensure consistency if needed

    // --- Step 4: Delete the old avatar file (if applicable) ---
    if (oldAvatarPath && oldAvatarPath !== newAvatarUrl) {
      const fullOldPath = path.join(__dirname, '..', 'public', oldAvatarPath);
      console.log(`Attempting to delete old avatar: ${fullOldPath}`);
      fs.unlink(fullOldPath, (err) => {
        if (err) {
          // Log error but don't block the response
          console.error(`Failed to delete old avatar file: ${fullOldPath}`, err);
        } else {
          console.log(`Successfully deleted old avatar: ${fullOldPath}`);
        }
      });
    }

    // --- Step 5: Return updated user data ---
    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl
    });

  } catch (error) {
    console.error('Error updating avatar:', error);
    // Attempt to clean up newly uploaded file on general error
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting avatar file after error:", err);
    });
    // Pass error to the next error handler (including multer errors)
    next(error);
  }
}, (error, req, res, next) => {
  // --- Existing Multer Error Handler ---
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: `File upload error: ${error.message}` });
  } else if (error) {
    return res.status(400).json({ message: error.message });
  }
  next();
});

module.exports = router; 