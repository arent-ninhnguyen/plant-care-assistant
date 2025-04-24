const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const auth = require('../middleware/auth');
const { uploadSingleImage } = require('../middleware/upload');
const fs = require('fs');       // Import fs
const path = require('path');   // Import path

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
      image: req.filePath || null, // Use relative URL path from middleware
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
      // If plant not found & new image was uploaded, delete the new image
      if (req.filePath) {
         const newImagePath = path.join(__dirname, '..', 'public', req.filePath); // Use relative URL
         fs.unlink(newImagePath, (err) => {
           if (err) console.error("Error deleting uploaded plant image for non-existent plant:", err);
         });
      }
      return res.status(404).json({ error: 'Plant not found' });
    }

    const oldImageUrl = plant.image; // Store the old relative URL
    
    // Update fields from request body
    const updates = Object.keys(req.body).filter(key => key !== 'deleteImage');
    updates.forEach(update => plant[update] = req.body[update]);
    
    let imageUpdated = false; // Flag to track if image field was changed

    // --- Handle New Image Upload ---
    if (req.filePath) {
      console.log('New plant image uploaded, path:', req.filePath);
      plant.image = req.filePath; // Set new relative URL
      imageUpdated = true;
    } 
    // --- Handle Image Deletion Request ---
    else if (req.body.deleteImage === 'true') {
      console.log('Request to delete plant image for plant:', plant._id);
      if (plant.image) { // Only proceed if there is an image to delete
         plant.image = null; // Clear image path in DB
         imageUpdated = true;
      } else {
         console.log('No existing image to delete for plant:', plant._id);
         oldImageUrl = null; // Nothing to delete later
      }
    }
    
    await plant.save(); // Save potentially updated plant data

    // --- Delete Old File (if image was updated/deleted and old URL existed) ---
    if (imageUpdated && oldImageUrl && oldImageUrl !== plant.image) {
        const fullOldPath = path.join(__dirname, '..', 'public', oldImageUrl); // Construct FS path
        console.log(`Attempting to delete old plant image: ${fullOldPath}`);
        fs.unlink(fullOldPath, (err) => { // Use async unlink
          if (err) {
            console.error(`Failed to delete old plant image file: ${fullOldPath}`, err);
          } else {
            console.log(`Successfully deleted old plant image: ${fullOldPath}`);
          }
        });
    }

    res.json(plant); // Return updated plant

  } catch (error) {
     console.error('Error updating plant:', error);
     // Attempt to cleanup newly uploaded file on error
     if (req.filePath) {
       const newImagePath = path.join(__dirname, '..', 'public', req.filePath);
       fs.unlink(newImagePath, (err) => {
         if (err) console.error("Error deleting newly uploaded plant image after error:", err);
       });
     }
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
    
    // Delete the associated image file if it exists
    if (plant.image) {
      const imagePath = path.join(__dirname, '..', 'public', plant.image); // Construct FS path
      console.log(`Attempting to delete image for deleted plant: ${imagePath}`);
      fs.unlink(imagePath, (err) => { // Use async unlink
         if (err) {
            console.error(`Failed to delete image file for deleted plant: ${imagePath}`, err);
         } else {
            console.log(`Successfully deleted image for deleted plant: ${imagePath}`);
         }
      });
    }
    
    res.json({ message: 'Plant removed' });
  } catch (error) {
     console.error('Error deleting plant:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 