const express = require('express');
const router = express.Router();
const dbRepo = require('../db');
const { authenticateOwner } = require('../middleware/auth');

router.use(authenticateOwner);

// GET /api/owner/notifications
router.get('/', async (req, res) => {
  if (!req.business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  try {
    const data = await dbRepo.getNotifications(req.business.id);
    return res.json({
      success: true,
      ...data
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/owner/notifications/:id/read
router.post('/:id/read', async (req, res) => {
  const { id } = req.params;
  await dbRepo.markNotificationRead(id, req.business.id);
  return res.json({ success: true, message: 'Notification marked as read.' });
});

// POST /api/owner/notifications/mark-all-read
router.post('/mark-all-read', async (req, res) => {
  await dbRepo.markAllNotificationsRead(req.business.id);
  return res.json({ success: true, message: 'All notifications marked as read.' });
});

module.exports = router;
