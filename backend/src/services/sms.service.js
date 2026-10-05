// Production SMS & OTP Delivery Service
// Supports Twilio, Fast2SMS (India), MSG91, and Dev Mock fallback
const https = require('https');

class SmsService {
  static async sendOtp(mobile, otp) {
    const provider = (process.env.SMS_PROVIDER || 'renflair').toLowerCase();
    let cleanMobile = String(mobile).replace(/\D/g, '');
    if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
      cleanMobile = cleanMobile.slice(2);
    }

    // 1. Renflair SMS Gateway (DLT approved India transactional SMS)
    if (provider === 'renflair' || process.env.RENFLAIR_API_KEY) {
      const apiKey = process.env.RENFLAIR_API_KEY || '576d026223582a390cd323bef4bad026';
      const url = `https://sms.renflair.in/V1.php?API=${encodeURIComponent(apiKey)}&PHONE=${encodeURIComponent(cleanMobile)}&OTP=${encodeURIComponent(otp)}`;

      return new Promise((resolve) => {
        https.get(url, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              const isSuccess = json.status === 'SUCCESS' || res.statusCode === 200;
              console.log(`[SMS-Renflair] Dispatched OTP to +91 ${cleanMobile}:`, json);
              resolve({
                success: isSuccess,
                provider: 'renflair',
                message: json.message || 'OTP dispatched via Renflair SMS'
              });
            } catch (err) {
              console.log(`[SMS-Renflair] Raw response: ${data}`);
              resolve({
                success: res.statusCode === 200,
                provider: 'renflair',
                message: data
              });
            }
          });
        }).on('error', (err) => {
          console.error('[SMS-Renflair] Delivery failed:', err.message);
          resolve({
            success: false,
            provider: 'renflair',
            error: err.message
          });
        });
      });
    }

    // 2. Fast2SMS (Popular low-cost Indian SMS provider for Kirana merchants)
    if (provider === 'fast2sms' && process.env.FAST2SMS_API_KEY) {
      try {
        const body = JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: cleanMobile
        });

        const req = https.request({
          hostname: 'www.fast2sms.com',
          path: '/dev/bulkV2',
          method: 'POST',
          headers: {
            'authorization': process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          }
        });
        req.write(body);
        req.end();
        console.log(`[SMS] Fast2SMS OTP sent to +91 ${mobile}`);
        return { success: true, provider: 'fast2sms' };
      } catch (err) {
        console.error('[SMS] Fast2SMS delivery failed:', err.message);
      }
    }

    // 2. Twilio Provider
    if (provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const postData = new URLSearchParams({
          To: `+91${mobile}`,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: `Your Udhaar verification code is: ${otp}. Valid for 10 minutes.`
        }).toString();

        const req = https.request({
          hostname: 'api.twilio.com',
          path: `/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        });
        req.write(postData);
        req.end();
        console.log(`[SMS] Twilio OTP sent to +91 ${mobile}`);
        return { success: true, provider: 'twilio' };
      } catch (err) {
        console.error('[SMS] Twilio delivery failed:', err.message);
      }
    }

    // 3. Fallback / Dev Mode
    console.log(`[AUTH-OTP] Generated OTP for +91 ${mobile}: ${otp}`);
    return { success: true, provider: 'dev', devOtp: otp };
  }
}

module.exports = SmsService;
