const AUTH_TOKEN_KEY = 'ghor_jwt_token';
const authForm = document.getElementById('authForm');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const nameField = document.getElementById('nameField');
const phoneField = document.getElementById('phoneField');
const authSubmit = document.querySelector('.auth-submit');

const showToast = (message) => {
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
};

const setAuthMode = (mode) => {
  const isSignup = mode === 'signup';
  loginTab.classList.toggle('active', !isSignup);
  signupTab.classList.toggle('active', isSignup);
  nameField.classList.toggle('hidden', !isSignup);
  phoneField.classList.toggle('hidden', !isSignup);
  authSubmit.textContent = isSignup ? 'Register account' : 'Login';
};

const setToken = (token) => {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
};

const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

const clearToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

const redirectToDashboard = () => {
  window.location.href = 'dashboard.html';
};

const requestAuth = async (mode, payload) => {
  const url = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Authentication failed');
  }

  return data;
};

const handleAuthSubmit = async (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const fullName = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const mode = signupTab.classList.contains('active') ? 'signup' : 'login';

  if (!email || !password) {
    return showToast('Email and password are required.');
  }

  const payload = mode === 'signup'
    ? { fullName, email, phone, password }
    : { email, password };

  authSubmit.disabled = true;
  authSubmit.textContent = 'Processing...';

  try {
    const data = await requestAuth(mode, payload);
    if (data.token) {
      setToken(data.token);
    }
    showToast(`${mode === 'signup' ? 'Registration' : 'Login'} successful.`);
    redirectToDashboard();
  } catch (error) {
    showToast(error.message);
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = signupTab.classList.contains('active') ? 'Register account' : 'Login';
  }
};

const initAuthPage = () => {
  if (!authForm) return;
  if (getToken()) {
    redirectToDashboard();
    return;
  }

  loginTab.addEventListener('click', () => setAuthMode('login'));
  signupTab.addEventListener('click', () => setAuthMode('signup'));
  authForm.addEventListener('submit', handleAuthSubmit);
  setAuthMode('login');
};

document.addEventListener('DOMContentLoaded', initAuthPage);
