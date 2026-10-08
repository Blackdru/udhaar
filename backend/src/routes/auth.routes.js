const express = require('express');
const router = express.Router();
const dbRepo = require('../db');
const { generateToken, authenticateOwner } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const SmsService = require('../services/sms.service');
const crypto = require('crypto');

function generateSecureOTP() {
  return crypto.randomInt(1000, 9999).toString();
}

// POST /api/auth/send-otp
router.post('/send-otp', validate('sendOtp'), async (req, res) => {
  const { mobile } = req.body;
  const cleanMobile = mobile.replace(/\D/g, '');

  // Keep 1234 for the demo owner 9876543210, generate secure 4-digit code for others
  const isDemoNumber = cleanMobile === '9876543210';
  const otp = isDemoNumber ? '1234' : generateSecureOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  let owner = await dbRepo.getOwnerByMobile(cleanMobile);
  let business = null;
  const isExistingUser = !!owner;

  if (!owner) {
    const ownerId = 'own_' + crypto.randomBytes(6).toString('hex');
    await dbRepo.createOwner({
      id: ownerId,
      mobile: cleanMobile,
      name: 'Shop Owner',
      otp,
      expiresAt
    });
  } else {
    business = await dbRepo.getBusinessByOwnerId(owner.id);
    await dbRepo.updateOwnerOtp(owner.id, otp, expiresAt);
  }

  const exists = isExistingUser && !!business;

  // Dispatch via SMS Service (Renflair / SMS provider)
  const smsResult = await SmsService.sendOtp(cleanMobile, otp);

  return res.json({
    success: true,
    exists,
    shopName: business ? business.name : null,
    ownerName: owner ? owner.name : null,
    message: exists
      ? `Welcome back! Verification code sent to +91 ${cleanMobile}.`
      : `New store registration. Verification code sent to +91 ${cleanMobile}.`,
    devOtp: process.env.NODE_ENV === 'production' && !isDemoNumber ? undefined : otp,
    smsProvider: smsResult?.provider
  });
});

// POST /api/auth/verify-otp
router.post('/verify-otp', validate('verifyOtp'), async (req, res) => {
  const { mobile, otp, name, shopName } = req.body;
  const cleanMobile = mobile.replace(/\D/g, '');

  const owner = await dbRepo.getOwnerByMobile(cleanMobile);
  if (!owner) {
    return res.status(404).json({ success: false, message: 'Owner account not found. Please request an OTP first.' });
  }

  // Verify OTP (allow both 1234 and 123456 for demo number 9876543210)
  const isDemoMatch = cleanMobile === '9876543210' && (otp === '1234' || otp === '123456');
  if (owner.otp_code !== otp && !isDemoMatch) {
    return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check and try again.' });
  }

  if (owner.otp_expires_at && new Date(owner.otp_expires_at) < new Date()) {
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new verification code.' });
  }

  let business = await dbRepo.getBusinessByOwnerId(owner.id);

  if (!business && (!shopName || !shopName.trim())) {
    return res.status(400).json({ success: false, message: 'Please provide your shop name to complete registration.' });
  }

  if (name && name.trim()) {
    await dbRepo.updateOwnerName(owner.id, name.trim());
    owner.name = name.trim();
  }

  if (!business) {
    const finalShopName = shopName.trim();
    const bizId = 'biz_' + crypto.randomBytes(6).toString('hex');
    const qrToken = crypto.randomBytes(4).toString('hex').toUpperCase();

    business = await dbRepo.createBusiness({
      id: bizId,
      ownerId: owner.id,
      name: finalShopName,
      ownerName: owner.name,
      mobile: cleanMobile,
      qrToken
    });
  }

  const token = generateToken({
    ownerId: owner.id,
    mobile: owner.mobile,
    businessId: business ? business.id : null
  });

  return res.json({
    success: true,
    message: 'Authentication successful.',
    token,
    owner: {
      id: owner.id,
      name: owner.name,
      mobile: owner.mobile
    },
    business
  });
});

// POST /api/auth/simple-login
// If mobile already exists -> instant login, else -> returns exists: false
router.post('/simple-login', validate('simpleLogin'), async (req, res) => {
  const { mobile } = req.body;
  const cleanMobile = mobile.replace(/\D/g, '');

  const owner = await dbRepo.getOwnerByMobile(cleanMobile);
  if (!owner) {
    return res.json({
      success: true,
      exists: false,
      message: 'Mobile number not registered yet. Please enter shop name to create store.'
    });
  }

  // Owner exists -> get or create business
  let business = await dbRepo.getBusinessByOwnerId(owner.id);
  if (!business) {
    const bizId = 'biz_' + crypto.randomBytes(6).toString('hex');
    const qrToken = crypto.randomBytes(4).toString('hex').toUpperCase();
    const finalShopName = owner.name && owner.name !== 'Shop Owner' ? `${owner.name}'s Store` : 'My Kirana Store';

    business = await dbRepo.createBusiness({
      id: bizId,
      ownerId: owner.id,
      name: finalShopName,
      ownerName: owner.name || 'Shop Owner',
      mobile: cleanMobile,
      qrToken
    });
  }

  const token = generateToken({
    ownerId: owner.id,
    mobile: owner.mobile,
    businessId: business.id
  });

  return res.json({
    success: true,
    exists: true,
    message: 'Welcome back! Logged in successfully.',
    token,
    owner: {
      id: owner.id,
      name: owner.name,
      mobile: owner.mobile
    },
    business
  });
});

// POST /api/auth/simple-signup
// For new numbers: creates owner and business with given shopName and logs in directly
router.post('/simple-signup', validate('simpleSignup'), async (req, res) => {
  const { mobile, shopName, name } = req.body;
  const cleanMobile = mobile.replace(/\D/g, '');
  const finalShopName = shopName.trim();
  const finalOwnerName = name && name.trim() ? name.trim() : (finalShopName ? `${finalShopName} Owner` : 'Shop Owner');

  let owner = await dbRepo.getOwnerByMobile(cleanMobile);
  if (!owner) {
    const ownerId = 'own_' + crypto.randomBytes(6).toString('hex');
    owner = await dbRepo.createOwner({
      id: ownerId,
      mobile: cleanMobile,
      name: finalOwnerName,
      otp: '1234',
      expiresAt: new Date(Date.now() + 864000000).toISOString()
    });
  } else if (name && name.trim()) {
    await dbRepo.updateOwnerName(owner.id, finalOwnerName);
    owner.name = finalOwnerName;
  }

  let business = await dbRepo.getBusinessByOwnerId(owner.id);
  if (!business) {
    const bizId = 'biz_' + crypto.randomBytes(6).toString('hex');
    const qrToken = crypto.randomBytes(4).toString('hex').toUpperCase();
    business = await dbRepo.createBusiness({
      id: bizId,
      ownerId: owner.id,
      name: finalShopName,
      ownerName: owner.name,
      mobile: cleanMobile,
      qrToken
    });
  } else if (shopName && shopName.trim()) {
    await dbRepo.updateBusiness(business.id, { name: finalShopName });
    business = await dbRepo.getBusinessById(business.id);
  }

  const token = generateToken({
    ownerId: owner.id,
    mobile: owner.mobile,
    businessId: business.id
  });

  return res.json({
    success: true,
    message: 'Store created successfully! Welcome to Udhaar Ledger.',
    token,
    owner: {
      id: owner.id,
      name: owner.name,
      mobile: owner.mobile
    },
    business
  });
});

// GET /api/auth/me
router.get('/me', authenticateOwner, (req, res) => {
  return res.json({
    success: true,
    owner: req.owner,
    business: req.business
  });
});

module.exports = router;
