const express = require('express');
const router = express.Router();
const dbRepo = require('../db');
const { publicRateLimiter } = require('../middleware/auth');
const { uploadReceipt } = require('../middleware/upload');
const { validate, duplicateSubmissionGuard } = require('../middleware/validator');
const StorageService = require('../services/storage.service');
const { broadcastToBusiness } = require('../services/websocket');
const crypto = require('crypto');

function generateTransactionNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 7);
  return `UDH-${dateStr}-${randomChars}`;
}

// GET /api/public/business/:qrToken
router.get('/business/:qrToken', async (req, res) => {
  const { qrToken } = req.params;
  const business = await dbRepo.getBusinessByQrToken(qrToken);

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found. Please verify the Udhaar QR code you scanned.'
    });
  }

  return res.json({
    success: true,
    business
  });
});

// POST /api/public/transactions
router.post('/transactions', publicRateLimiter, (req, res, next) => {
  uploadReceipt.single('receipt')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, validate('publicTransaction'), duplicateSubmissionGuard, async (req, res) => {
  try {
    const { qrToken, name, mobile, amount, notes } = req.body;

    const business = await dbRepo.getBusinessByQrToken(qrToken);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business associated with this QR was not found.' });
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    const numAmount = parseFloat(amount);

    let customer = await dbRepo.getCustomerByBizAndMobile(business.id, cleanMobile);

    if (!customer) {
      const custId = 'cust_' + crypto.randomBytes(6).toString('hex');
      customer = await dbRepo.createCustomer({
        id: custId,
        businessId: business.id,
        name: name.trim(),
        mobile: cleanMobile
      });
    } else {
      if (customer.name !== name.trim()) {
        await dbRepo.updateCustomerName(customer.id, name.trim());
        customer.name = name.trim();
      }
    }

    // Upload receipt to Supabase Storage or local
    let receiptUrl = null;
    if (req.file) {
      receiptUrl = await StorageService.uploadReceipt(req.file);
    }

    const txnId = 'tx_' + crypto.randomBytes(6).toString('hex');
    const txnNumber = generateTransactionNumber();

    const createdTransaction = await dbRepo.createTransaction({
      id: txnId,
      transactionNumber: txnNumber,
      businessId: business.id,
      customerId: customer.id,
      customerName: customer.name,
      customerMobile: customer.mobile,
      amount: numAmount,
      notes: notes ? notes.trim() : null,
      receiptUrl
    });

    // Create Audit Log
    await dbRepo.createAuditLog({
      id: 'aud_' + crypto.randomBytes(6).toString('hex'),
      businessId: business.id,
      transactionId: txnId,
      action: 'CREATED',
      performedBy: 'CUSTOMER',
      details: { amount: numAmount, customerName: customer.name, customerMobile: customer.mobile, hasReceipt: !!receiptUrl, notes }
    });

    // In-App Notification
    const notifId = 'notif_' + crypto.randomBytes(6).toString('hex');
    await dbRepo.createNotification({
      id: notifId,
      businessId: business.id,
      transactionId: txnId,
      title: 'New Udhaar Recorded',
      message: `₹${numAmount.toLocaleString('en-IN')} recorded by ${customer.name}`,
      amount: numAmount,
      customerName: customer.name
    });

    // Live WebSocket push to merchant dashboard
    broadcastToBusiness(business.id, {
      type: 'NEW_TRANSACTION',
      transaction: createdTransaction,
      notification: {
        id: notifId,
        title: 'New Udhaar Recorded',
        message: `₹${numAmount.toLocaleString('en-IN')} recorded by ${customer.name}`,
        amount: numAmount,
        customer_name: customer.name,
        created_at: new Date().toISOString()
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Udhaar recorded successfully.',
      transaction: createdTransaction
    });
  } catch (e) {
    console.error('Error creating public transaction:', e);
    return res.status(500).json({ success: false, message: 'Failed to record Udhaar. Please try again.', error: e.message });
  }
});

module.exports = router;
