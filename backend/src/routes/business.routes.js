const express = require('express');
const router = express.Router();
const dbRepo = require('../db');
const { authenticateOwner } = require('../middleware/auth');
const QRCode = require('qrcode');
const crypto = require('crypto');

// GET /api/business/me
router.get('/me', authenticateOwner, (req, res) => {
  if (!req.business) {
    return res.status(404).json({ success: false, message: 'No business found for this owner.' });
  }

  return res.json({
    success: true,
    business: req.business
  });
});

// POST /api/business
router.post('/', authenticateOwner, async (req, res) => {
  const { name, category, address } = req.body;
  const owner = req.owner;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Business name is required.' });
  }

  let business = await dbRepo.getBusinessByOwnerId(owner.id);

  if (business) {
    business = await dbRepo.updateBusiness(business.id, {
      name: name.trim(),
      category: category || business.category,
      address: address || business.address
    });
  } else {
    const bizId = 'biz_' + crypto.randomBytes(6).toString('hex');
    const qrToken = crypto.randomBytes(4).toString('hex').toUpperCase();

    business = await dbRepo.createBusiness({
      id: bizId,
      ownerId: owner.id,
      name: name.trim(),
      ownerName: owner.name,
      mobile: owner.mobile,
      category: category || 'Kirana & Grocery',
      address: address || 'Main Market',
      qrToken
    });
  }

  return res.json({
    success: true,
    message: 'Business profile updated successfully.',
    business
  });
});

// GET /api/business/me/qr
router.get('/me/qr', authenticateOwner, async (req, res) => {
  if (!req.business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  const biz = req.business;
  const origin = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5173';
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const publicBaseUrl = process.env.PUBLIC_WEB_URL
    ? process.env.PUBLIC_WEB_URL.replace(/\/+$/, '')
    : `${protocol}://${origin.split(':')[0]}:5173`;
  const clientUrl = `${publicBaseUrl}/b/${biz.qr_token}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(clientUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    return res.json({
      success: true,
      business: {
        id: biz.id,
        name: biz.name,
        owner_name: biz.owner_name,
        qr_token: biz.qr_token
      },
      url: clientUrl,
      qrDataUrl
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to generate QR code.', error: err.message });
  }
});

module.exports = router;
