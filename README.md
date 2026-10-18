# AegisVault - Mobile OTP Verification for Password Manager

A complete, modern two-factor authentication (2FA) mobile verification system designed for a zero-knowledge password manager. Powered by **MiniMoth** live OTP verification API.

---

## 🚀 Features

- **MiniMoth Live API Integration**: Integrated with the `mm_live_...` production key to dispatch one-time passwords across WhatsApp and SMS with automatic fallback.
- **Sleek Cyberpunk / SaaS Dark Mode UI**: 
  - Dynamic ambient mesh lighting & glassmorphism.
  - Multi-country selector (IN, US, UK, UAE, SG, AU, DE) with phone formatting.
  - 6-digit individual box OTP entry with auto-advance, backspace auto-reverse, and clipboard paste support.
  - Resend countdown timer (45 seconds).
  - Unlocked Vault view with simulated encrypted password credentials demo and session token view.
- **Secure Backend**: Express server acting as a reverse proxy, keeping your MiniMoth API key safe from frontend exposure.

---

## 🛠️ Project Structure

```
c:\gravity\
├── .env                  # Stores your MINIMOTH_API_KEY securely
├── server.js             # Express API proxy (POST /api/otp/send & POST /api/otp/verify)
├── package.json          # Dependencies (express, cors, dotenv)
└── public/
    ├── index.html        # Modern 3-step auth markup
    ├── style.css         # Glassmorphism, modern typography & animations
    └── app.js            # OTP box navigation, clipboard handlers & API integration
```

---

## 🏃 Running the Application

1. **Install dependencies**:
   ```cmd
   npm install
   ```

2. **Start the server**:
   ```cmd
   node server.js
   ```

3. Open **`http://localhost:3000`** in your browser.
