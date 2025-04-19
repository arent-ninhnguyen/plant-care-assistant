const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization').replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user with matching id who has this token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new Error();
    }
    
    // Add user info to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name
    };
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

module.exports = auth; 