const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// GET: Verify token & return authenticated user profile
router.get('/me', verifyToken, (req, res) => {
  res.json({
    message: 'Authenticated successfully with Express + Firebase Admin',
    uid: req.user.uid,
    email: req.user.email,
    role: req.user.role
  });
});

module.exports = router;