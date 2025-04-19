const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  species: {
    type: String,
    required: true,
    trim: true
  },
  wateringFrequency: {
    type: Number, // in days
    required: true
  },
  lastWatered: {
    type: Date,
    default: Date.now
  },
  lightRequirements: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  image: {
    type: String // URL to plant image
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Plant = mongoose.model('Plant', plantSchema);

module.exports = Plant; 