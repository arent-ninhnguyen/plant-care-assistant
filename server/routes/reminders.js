const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const Plant = require('../models/Plant');
const auth = require('../middleware/auth');

// Get all reminders for a user
router.get('/', auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user.id })
      .populate('plantId', 'name species image');
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific reminder
router.get('/:id', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    }).populate('plantId', 'name species image');
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new reminder
router.post('/', auth, async (req, res) => {
  const { plantId, type, dueDate, notes } = req.body;
  
  try {
    // Verify the plant exists and belongs to the user
    const plant = await Plant.findOne({ 
      _id: plantId,
      userId: req.user.id 
    });
    
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }
    
    const newReminder = new Reminder({
      plantId,
      userId: req.user.id,
      type,
      dueDate,
      notes
    });
    
    await newReminder.save();
    res.status(201).json(newReminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a reminder
router.put('/:id', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    const updates = Object.keys(req.body);
    updates.forEach(update => reminder[update] = req.body[update]);
    
    await reminder.save();
    res.json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark a reminder as completed
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    reminder.completed = true;
    await reminder.save();
    
    res.json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a reminder
router.delete('/:id', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 