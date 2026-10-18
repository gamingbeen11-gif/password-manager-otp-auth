const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.MINIMOTH_API_KEY;
const API_BASE_URL = 'https://api.minimoth.dev';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Endpoint 1: Send OTP to mobile number
app.post('/api/otp/send', async (req, res) => {
  try {
    let { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Mobile number is required' });
    }

    // Clean phone format: remove whitespaces, dashes
    phone = phone.replace(/[\s-]/g, '');
    if (!phone.startsWith('+')) {
      // Default to +91 or require country code
      phone = '+' + phone;
    }

    console.log(`[API] Sending OTP to: ${phone}`);

    const response = await fetch(`${API_BASE_URL}/v1/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY
      },
      body: JSON.stringify({ phone })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[API Send Error]', response.status, data);
      return res.status(response.status).json({
        success: false,
        error: data.message || data.error || 'Failed to send OTP via SMS/WhatsApp'
      });
    }

    console.log('[API Send Success]', data);
    return res.json({
      success: true,
      message: data.message || 'OTP sent successfully',
      otp_id: data.otp_id || null,
      phone
    });
  } catch (err) {
    console.error('[Server Error /api/otp/send]', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// Endpoint 2: Verify OTP
app.post('/api/otp/verify', async (req, res) => {
  try {
    let { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, error: 'Phone number and 6-digit OTP code are required' });
    }

    phone = phone.replace(/[\s-]/g, '');
    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }

    code = String(code).trim();

    console.log(`[API] Verifying OTP for: ${phone} (code: ${code})`);

    const response = await fetch(`${API_BASE_URL}/v1/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY
      },
      body: JSON.stringify({ phone, code })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[API Verify Error]', response.status, data);
      return res.status(response.status).json({
        success: false,
        error: data.message || data.error || 'Invalid or expired OTP code'
      });
    }

    console.log('[API Verify Success]', data);
    return res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        identity_id: data.identity_id || null,
        access_token: data.access_token || null,
        expires_at: data.expires_at || null
      }
    });
  } catch (err) {
    console.error('[Server Error /api/otp/verify]', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// Endpoint 3: Status check
app.get('/api/otp/status/:otp_id', async (req, res) => {
  try {
    const { otp_id } = req.params;
    const response = await fetch(`${API_BASE_URL}/v1/otp/status/${encodeURIComponent(otp_id)}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY
      }
    });
    const data = await response.json().catch(() => ({}));
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 FortressVault Password Manager Auth Server running at http://localhost:${PORT}`);
});
