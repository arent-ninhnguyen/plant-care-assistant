const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const plantRoutes = require('./routes/plants');
const reminderRoutes = require('./routes/reminders');
const userRoutes = require('./routes/users');
const userDebugRoutes = require('./routes/users-debug');

app.use('/api/plants', plantRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/debug', userDebugRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 