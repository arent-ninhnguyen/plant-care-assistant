const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  species: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  waterFrequency: {
    type: String,
    trim: true
  },
  lastWatered: {
    type: Date,
    default: Date.now
  },
  sunlight: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true
  },
  image: {
    type: String // Filename of the uploaded image
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
plantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Plant = mongoose.model('Plant', plantSchema);

module.exports = Plant; 