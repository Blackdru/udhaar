const express = require('express');
const router = express.Router();
const dbRepo = require('../db');
const { authenticateOwner } = require('../middleware/auth');

router.use(authenticateOwner);

// GET /api/owner/customers
router.get('/', async (req, res) => {
  if (!req.business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  const { search } = req.query;
  try {
    const customers = await dbRepo.getCustomersWithTotals(req.business.id, search);
    return res.json({
      success: true,
      customers,
      count: customers.length
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/owner/customers/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const customer = await dbRepo.getCustomerById(id, req.business.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const transactions = await dbRepo.getCustomerTransactions(id, req.business.id);
    const activeTxns = transactions.filter(t => t.status === 'ACTIVE');
    const voidedTxns = transactions.filter(t => t.status === 'VOIDED');
    const totalOutstanding = activeTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return res.json({
      success: true,
      customer,
      stats: {
        total_outstanding: totalOutstanding,
        active_count: activeTxns.length,
        voided_count: voidedTxns.length,
        latest_txn: transactions.length > 0 ? transactions[0].created_at : null
      },
      transactions
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
