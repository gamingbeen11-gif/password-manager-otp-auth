// Client-side OTP Verification logic
let currentFullPhone = '';
let countdownInterval = null;
const otpInputs = document.querySelectorAll('.otp-digit');

// Auto focus movement across 6 OTP boxes
otpInputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    e.target.value = val;

    if (val && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });

  // Support direct paste in any box
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasteData = (e.clipboardData || window.clipboardData).getData('text');
    fillOtpInputs(pasteData);
  });
});

function fillOtpInputs(text) {
  const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
  if (!digits) return;

  otpInputs.forEach((inp, idx) => {
    inp.value = digits[idx] || '';
  });

  const nextIdx = Math.min(digits.length, 5);
  otpInputs[nextIdx].focus();

  if (digits.length === 6) {
    // Automatically trigger verify when 6 digits are pasted
    setTimeout(() => handleVerifyOtp(), 250);
  }
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    fillOtpInputs(text);
    showToast('Pasted OTP from clipboard', 'info');
  } catch (err) {
    showToast('Clipboard access denied. Please type manually.', 'error');
  }
}

// Toast notification helper
function showToast(msg, type = 'info', title = null) {
  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = toast.querySelector('.toast-icon');

  toast.className = `toast toast-${type}`;
  toastMsg.textContent = msg;

  if (type === 'error') {
    toastTitle.textContent = title || 'Verification Error';
    toastIcon.className = 'toast-icon fa-solid fa-triangle-exclamation';
  } else if (type === 'success') {
    toastTitle.textContent = title || 'Success';
    toastIcon.className = 'toast-icon fa-solid fa-circle-check';
  } else {
    toastTitle.textContent = title || 'Notice';
    toastIcon.className = 'toast-icon fa-solid fa-circle-info';
  }

  toast.classList.remove('hidden');
}

function hideToast() {
  document.getElementById('toast').classList.add('hidden');
}

// Step Switcher
function goToStep(step) {
  document.querySelectorAll('.step-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.step-item').forEach(s => s.classList.remove('active'));

  if (step === 1) {
    document.getElementById('step1View').classList.add('active');
    document.getElementById('stepIndicator1').classList.add('active');
  } else if (step === 2) {
    document.getElementById('step2View').classList.add('active');
    document.getElementById('stepIndicator1').classList.add('active');
    document.getElementById('stepIndicator2').classList.add('active');
    // Clear and focus first input
    otpInputs.forEach(i => i.value = '');
    setTimeout(() => otpInputs[0].focus(), 150);
  } else if (step === 3) {
    document.getElementById('step3View').classList.add('active');
    document.getElementById('stepIndicator1').classList.add('active');
    document.getElementById('stepIndicator2').classList.add('active');
    document.getElementById('stepIndicator3').classList.add('active');
  }
}

function changePhoneNumber() {
  clearInterval(countdownInterval);
  hideToast();
  goToStep(1);
}

// Send OTP
async function handleSendOtp(isResend = false) {
  hideToast();
  const countryCode = document.getElementById('countryCodeSelect').value;
  const rawNumber = document.getElementById('phoneNumber').value.trim();

  if (!rawNumber) {
    showToast('Please enter your mobile number', 'error');
    return;
  }

  // Normalize phone number
  let fullPhone = rawNumber.startsWith('+') ? rawNumber : `${countryCode}${rawNumber}`;
  currentFullPhone = fullPhone;

  const btn = isResend ? document.getElementById('resendBtn') : document.getElementById('sendOtpBtn');
  const btnLoader = isResend ? null : btn.querySelector('.btn-loader');
  const btnText = isResend ? null : btn.querySelector('.btn-text');

  if (btnLoader) {
    btnLoader.classList.remove('hidden');
    btnText.classList.add('hidden');
    btn.disabled = true;
  }

  try {
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: fullPhone })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to dispatch OTP');
    }

    // Mask phone for step 2 view
    const maskedPhone = maskPhoneNumber(fullPhone);
    document.getElementById('displayPhone').textContent = maskedPhone;

    showToast(`Verification code sent to ${maskedPhone}`, 'success', 'Code Sent');
    goToStep(2);
    startCountdown(45);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btnLoader) {
      btnLoader.classList.add('hidden');
      btnText.classList.remove('hidden');
      btn.disabled = false;
    }
  }
}

// Verify OTP
async function handleVerifyOtp() {
  hideToast();
  let code = '';
  otpInputs.forEach(i => code += i.value);

  if (code.length < 6) {
    showToast('Please enter the full 6-digit verification code', 'error');
    return;
  }

  const btn = document.getElementById('verifyOtpBtn');
  const btnLoader = btn.querySelector('.btn-loader');
  const btnText = btn.querySelector('.btn-text');

  btnLoader.classList.remove('hidden');
  btnText.classList.add('hidden');
  btn.disabled = true;

  try {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentFullPhone, code })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Invalid or expired verification code');
    }

    // Success: Populate Vault session data
    clearInterval(countdownInterval);
    document.getElementById('sessionPhone').textContent = currentFullPhone;
    if (data.data && data.data.access_token) {
      document.getElementById('sessionToken').textContent = data.data.access_token;
    } else {
      document.getElementById('sessionToken').textContent = 'mm_sess_' + Math.random().toString(36).substring(2, 15);
    }

    showToast('Identity authenticated successfully! Welcome back.', 'success', 'Access Granted');
    goToStep(3);
  } catch (err) {
    showToast(err.message, 'error');
    // Highlight inputs with error shake
    const box = document.querySelector('.otp-inputs-wrapper');
    box.style.animation = 'shake 0.4s ease';
    setTimeout(() => box.style.animation = '', 400);
  } finally {
    btnLoader.classList.add('hidden');
    btnText.classList.remove('hidden');
    btn.disabled = false;
  }
}

// Timer countdown
function startCountdown(seconds) {
  clearInterval(countdownInterval);
  let timeLeft = seconds;
  const timerText = document.getElementById('timerText');
  const countdownEl = document.getElementById('countdown');
  const resendBtn = document.getElementById('resendBtn');

  timerText.classList.remove('hidden');
  resendBtn.classList.add('hidden');
  countdownEl.textContent = `${timeLeft}s`;

  countdownInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      timerText.classList.add('hidden');
      resendBtn.classList.remove('hidden');
    } else {
      countdownEl.textContent = `${timeLeft}s`;
    }
  }, 1000);
}

function maskPhoneNumber(phone) {
  if (phone.length <= 6) return phone;
  const prefix = phone.slice(0, 4);
  const suffix = phone.slice(-3);
  return `${prefix} •••• ${suffix}`;
}

function copyDemoPwd(pwd) {
  navigator.clipboard.writeText(pwd).then(() => {
    showToast('Password copied securely to clipboard', 'info', 'Clipboard');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

function lockVault() {
  hideToast();
  goToStep(1);
  document.getElementById('phoneNumber').value = '';
  showToast('Vault locked and session token cleared.', 'info', 'Session Terminated');
}
