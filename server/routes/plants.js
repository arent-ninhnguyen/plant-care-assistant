const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const auth = require('../middleware/auth');
const { uploadSingleImage } = require('../middleware/upload');

// Get all plants for a user
router.get('/', auth, async (req, res) => {
  try {
    const plants = await Plant.find({ userId: req.user.id });
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific plant
router.get('/:id', auth, async (req, res) => {
  try {
    const plant = await Plant.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json(plant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new plant (with image upload)
router.post('/', auth, uploadSingleImage('plantImage'), async (req, res) => {
  try {
    const { name, species, location, waterFrequency, sunlight, notes } = req.body;
    
    // Create new plant object
    const newPlant = new Plant({
      name,
      species,
      location,
      waterFrequency,
      sunlight,
      notes,
      image: req.filePath || null, // Get image path from upload middleware
      userId: req.user.id
    });
    
    await newPlant.save();
    res.status(201).json(newPlant);
  } catch (error) {
    console.error('Error creating plant:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update a plant (with optional image update)
router.put('/:id', auth, uploadSingleImage('plantImage'), async (req, res) => {
  try {
    const plant = await Plant.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    // Update fields from request body
    const updates = Object.keys(req.body).filter(key => key !== 'deleteImage'); // Exclude deleteImage from direct updates
    updates.forEach(update => plant[update] = req.body[update]);
    
    // Update image if a new one was uploaded
    if (req.filePath) {
      // If replacing an image, delete the old one
      if (plant.image) {
        const fs = require('fs');
        const path = require('path');
        const oldImagePath = path.join(__dirname, '../../server/uploads', plant.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      plant.image = req.filePath;
    } 
    // Delete image if deleteImage flag is set to true
    else if (req.body.deleteImage === 'true') {
      // Delete the physical file
      if (plant.image) {
        const fs = require('fs');
        const path = require('path');
        const imagePath = path.join(__dirname, '../../server/uploads', plant.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      plant.image = null;
    }
    
    await plant.save();
    res.json(plant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Water a plant
router.post('/:id/water', auth, async (req, res) => {
  try {
    const plant = await Plant.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    plant.lastWatered = new Date();
    await plant.save();
    
    res.json(plant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a plant
router.delete('/:id', auth, async (req, res) => {
  try {
    const plant = await Plant.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    // Delete the plant image file if it exists
    if (plant.image) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../server/uploads', plant.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`Deleted image file: ${imagePath}`);
      }
    }
    
    res.json({ message: 'Plant removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 