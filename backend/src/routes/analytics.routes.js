const express = require('express');
const router = express.Router();
const dbRepo = require('../db');
const { authenticateOwner } = require('../middleware/auth');

router.use(authenticateOwner);

// GET /api/owner/analytics
router.get('/', async (req, res) => {
  if (!req.business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  try {
    const analytics = await dbRepo.getAnalytics(req.business.id);
    return res.json({
      success: true,
      ...analytics
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
