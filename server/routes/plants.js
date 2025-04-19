const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const auth = require('../middleware/auth');

// Get all plants for a user
router.get('/', auth, async (req, res) => {
  try {
    const plants = await Plant.find({ userId: req.user.id });
    res.json(plants);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      return res.status(404).json({ message: 'Plant not found' });
    }
    
    res.json(plant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new plant
router.post('/', auth, async (req, res) => {
  const { name, species, wateringFrequency, lightRequirements, notes, image } = req.body;
  
  try {
    const newPlant = new Plant({
      name,
      species,
      wateringFrequency,
      lightRequirements,
      notes,
      image,
      userId: req.user.id
    });
    
    await newPlant.save();
    res.status(201).json(newPlant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a plant
router.put('/:id', auth, async (req, res) => {
  try {
    const plant = await Plant.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }
    
    const updates = Object.keys(req.body);
    updates.forEach(update => plant[update] = req.body[update]);
    
    await plant.save();
    res.json(plant);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
      return res.status(404).json({ message: 'Plant not found' });
    }
    
    plant.lastWatered = new Date();
    await plant.save();
    
    res.json(plant);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
      return res.status(404).json({ message: 'Plant not found' });
    }
    
    res.json({ message: 'Plant removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 