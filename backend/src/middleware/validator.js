const Joi = require('joi');

// In-memory cache for duplicate submission prevention (Section 22 of Implementation Plan)
// Key: businessId:mobile:amount -> timestamp
const recentSubmissions = new Map();

// Periodic cleanup every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 60000;
  for (const [key, time] of recentSubmissions.entries()) {
    if (time < cutoff) recentSubmissions.delete(key);
  }
}, 300000);

const schemas = {
  sendOtp: Joi.object({
    mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
      'string.pattern.base': 'Please enter a valid 10-digit Indian mobile number.'
    })
  }),

  verifyOtp: Joi.object({
    mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    otp: Joi.string().length(6).required(),
    name: Joi.string().max(100).allow('', null),
    shopName: Joi.string().max(150).allow('', null)
  }),

  publicTransaction: Joi.object({
    qrToken: Joi.string().alphanum().min(4).max(30).required(),
    amount: Joi.number().positive().max(100000).required().messages({
      'number.max': 'Single transaction limit is ₹1,00,000 for public QR scans.'
    }),
    name: Joi.string().min(2).max(100).trim().required(),
    mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
      'string.pattern.base': 'Please enter a valid 10-digit customer mobile number.'
    }),
    notes: Joi.string().max(300).allow('', null)
  }),

  voidTransaction: Joi.object({
    reason: Joi.string().min(3).max(250).required().messages({
      'string.min': 'Please provide an audit reason for voiding (min 3 characters).'
    })
  }),

  updateTransaction: Joi.object({
    customer_name: Joi.string().min(2).max(100).allow('', null),
    notes: Joi.string().max(300).allow('', null)
  }),

  updateBusiness: Joi.object({
    name: Joi.string().min(2).max(150).required(),
    category: Joi.string().max(100).allow('', null),
    address: Joi.string().max(250).allow('', null)
  })
};

function validate(schemaKey) {
  return (req, res, next) => {
    const schema = schemas[schemaKey];
    if (!schema) return next();

    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map(d => d.message).join('. ');
      return res.status(400).json({ success: false, message: messages });
    }

    req.body = value;
    next();
  };
}

// Anti-abuse duplicate submission guard (15s cooldown per same customer + amount + QR)
function duplicateSubmissionGuard(req, res, next) {
  const { qrToken, mobile, amount } = req.body;
  if (!qrToken || !mobile || !amount) return next();

  const key = `${qrToken}:${mobile}:${amount}`;
  const now = Date.now();
  const lastTime = recentSubmissions.get(key);

  if (lastTime && now - lastTime < 15000) {
    return res.status(429).json({
      success: false,
      message: 'Duplicate submission detected. This transaction was just recorded a few seconds ago.'
    });
  }

  recentSubmissions.set(key, now);
  next();
}

module.exports = {
  validate,
  duplicateSubmissionGuard
};
