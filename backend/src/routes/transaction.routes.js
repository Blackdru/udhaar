const express = require('express');
const router = express.Router();
const dbRepo = require('../db');
const { authenticateOwner } = require('../middleware/auth');
const { broadcastToBusiness } = require('../services/websocket');
const crypto = require('crypto');

router.use(authenticateOwner);

// GET /api/owner/transactions
router.get('/', async (req, res) => {
  if (!req.business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  const { search, status, startDate, endDate, limit = 50, page = 1 } = req.query;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  try {
    const result = await dbRepo.getTransactions({
      businessId: req.business.id,
      search,
      status,
      limit: parseInt(limit),
      offset,
      startDate,
      endDate
    });

    return res.json({
      success: true,
      transactions: result.transactions,
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalActiveOutstanding: result.totalActiveOutstanding
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/owner/transactions/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const transaction = await dbRepo.getTransactionById(id, req.business.id);

  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found.' });
  }

  const audits = await dbRepo.getAuditLogs(id);

  return res.json({
    success: true,
    transaction,
    audits
  });
});

// PATCH /api/owner/transactions/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { notes, customer_name } = req.body;

  const existing = await dbRepo.getTransactionById(id, req.business.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Transaction not found.' });
  }

  if (existing.status === 'VOIDED') {
    return res.status(400).json({ success: false, message: 'Cannot modify a voided transaction.' });
  }

  const updated = await dbRepo.updateTransaction(id, req.business.id, {
    customerName: customer_name !== undefined ? customer_name.trim() : existing.customer_name,
    notes: notes !== undefined ? notes.trim() : existing.notes
  });

  await dbRepo.createAuditLog({
    id: 'aud_' + crypto.randomBytes(6).toString('hex'),
    businessId: req.business.id,
    transactionId: id,
    action: 'UPDATED',
    performedBy: 'OWNER',
    details: { previousName: existing.customer_name, newName: updated.customer_name, notes }
  });

  return res.json({
    success: true,
    message: 'Transaction updated successfully.',
    transaction: updated
  });
});

// POST /api/owner/transactions/:id/void
router.post('/:id/void', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const existing = await dbRepo.getTransactionById(id, req.business.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Transaction not found.' });
  }

  if (existing.status === 'VOIDED') {
    return res.status(400).json({ success: false, message: 'Transaction is already voided.' });
  }

  const voidReason = (reason && reason.trim()) || 'Voided by business owner';
  const updated = await dbRepo.voidTransaction(id, req.business.id, voidReason);

  await dbRepo.createAuditLog({
    id: 'aud_' + crypto.randomBytes(6).toString('hex'),
    businessId: req.business.id,
    transactionId: id,
    action: 'VOIDED',
    performedBy: 'OWNER',
    details: { reason: voidReason, amount: existing.amount }
  });

  broadcastToBusiness(req.business.id, {
    type: 'TRANSACTION_VOIDED',
    transactionId: id,
    transaction: updated
  });

  return res.json({
    success: true,
    message: 'Transaction successfully voided. Outstanding balance has been adjusted.',
    transaction: updated
  });
});

module.exports = router;
