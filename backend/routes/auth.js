const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authcontroller');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleWare');

router.post('/register', register);
router.post('/login', login);

// Get user settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notifications');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { notifications } = req.body;
    await User.findByIdAndUpdate(req.user.id, { notifications });
    res.json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
