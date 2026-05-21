const AUTH_TOKEN_KEY = 'ghor_jwt_token';
const apiBase = '/api';

const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const setToken = (token) => localStorage.setItem(AUTH_TOKEN_KEY, token);
const clearToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

const sendRequest = async (path, options = {}) => {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${apiBase}${path}`, {
    credentials: 'include',
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

const guardAuth = () => {
  if (!getToken()) {
    window.location.href = 'login.html';
  }
};

const showToast = (message) => {
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
};

const formatCurrency = (value) => `GH₵ ${Number(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (value) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const renderSavingsList = (items = []) => {
  const container = document.getElementById('savingsList');
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<p>No savings accounts found. Save and grow your balance here.</p>';
    return;
  }
  container.innerHTML = items.map((saving) => `
    <article class="info-card glass-card">
      <h3>${saving.accountType || 'Savings account'}</h3>
      <p>${saving.accountNumber || 'Account #'}</p>
      <p><strong>${formatCurrency(saving.balance)}</strong></p>
      <span class="badge badge-success">${saving.status || 'Active'}</span>
    </article>
  `).join('');
};

const renderLoans = (items = []) => {
  const table = document.getElementById('loansTable');
  if (!table) return;
  const body = table.querySelector('tbody');
  if (!body) return;
  if (!items.length) {
    body.innerHTML = '<tr><td colspan="5">No loan records yet.</td></tr>';
    return;
  }
  body.innerHTML = items.map((loan) => `
    <tr>
      <td>${loan.loanType || 'Loan'}</td>
      <td>${formatCurrency(loan.amount)}</td>
      <td>${loan.durationMonths || loan.duration || 'N/A'} months</td>
      <td>${loan.status || 'Pending'}</td>
      <td>${formatDate(loan.createdAt || loan.updatedAt)}</td>
    </tr>
  `).join('');
};

const renderTransactions = (items = []) => {
  const table = document.getElementById('transactionsTable');
  if (!table) return;
  const body = table.querySelector('tbody');
  if (!body) return;
  if (!items.length) {
    body.innerHTML = '<tr><td colspan="5">No transactions available.</td></tr>';
    return;
  }
  body.innerHTML = items.map((tx) => `
    <tr>
      <td>${formatDate(tx.createdAt || tx.date)}</td>
      <td>${tx.type || tx.transactionType || 'Payment'}</td>
      <td>${formatCurrency(tx.amount)}</td>
      <td>${tx.status || 'Completed'}</td>
      <td><button class="btn btn-ghost receipt-btn" data-id="${tx._id || ''}">Download</button></td>
    </tr>
  `).join('');
};

const renderNotifications = (items = []) => {
  const container = document.getElementById('notificationList');
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<p>No notifications at this time.</p>';
    return;
  }
  container.innerHTML = items.map((note) => `
    <article class="notification-card glass-card ${note.status === 'unread' ? 'notification-unread' : ''}">
      <p>${note.message || note.title || 'Notification update'}</p>
      <span>${formatDate(note.createdAt || note.date)}</span>
    </article>
  `).join('');
};

const renderOverview = (summary) => {
  document.getElementById('savingsBalance').textContent = formatCurrency(summary.balance);
  document.getElementById('openLoans').textContent = summary.loans || 0;
  document.getElementById('transactionCount').textContent = summary.transactions || 0;
  document.getElementById('notificationCount').textContent = summary.notifications || 0;
};

const updateChart = (values = []) => {
  const bars = Array.from(document.querySelectorAll('.chart-bar'));
  if (!bars.length) return;
  const points = values.slice(-bars.length);
  const max = Math.max(...points, 1);

  bars.forEach((bar, index) => {
    const amount = points[index] || 0;
    const height = amount ? Math.max(16, Math.round((amount / max) * 100)) : 16;
    bar.style.height = `${height}%`;
    bar.dataset.value = amount;
  });
};

const renderProfile = (user) => {
  if (!user) return;
  document.getElementById('welcomeMessage').textContent = `Welcome back, ${user.fullName || user.name || 'Member'}`;
  document.getElementById('dashboardSubtitle').textContent = `Email: ${user.email || 'Not available'} — Role: ${user.role || 'member'}`;
  document.getElementById('profileName').value = user.fullName || user.name || '';
  document.getElementById('profileEmail').value = user.email || '';
  document.getElementById('profilePhone').value = user.phoneNumber || user.phone || '';
  document.getElementById('profileAddress').value = user.address || '';
};

const downloadReceipt = (transaction) => {
  const text = `Receipt\n\nDate: ${formatDate(transaction.createdAt || transaction.date)}\nType: ${transaction.type || transaction.transactionType}\nAmount: ${formatCurrency(transaction.amount)}\nStatus: ${transaction.status || 'Completed'}\nReference: ${transaction.providerReference || transaction.reference || 'N/A'}`;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${transaction._id || Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

const attachReceiptHandlers = (transactions) => {
  document.querySelectorAll('.receipt-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const tx = transactions.find((item) => item._id === id);
      if (tx) downloadReceipt(tx);
    });
  });
};

const handleLoanSubmit = async (event) => {
  event.preventDefault();
  const amount = Number(document.getElementById('loanAmount').value);
  const durationMonths = Number(document.getElementById('loanTerm').value);
  const purpose = document.getElementById('loanPurpose').value.trim();
  const loanType = document.getElementById('loanType').value;

  if (!amount || !durationMonths || !purpose) {
    showToast('Please complete all loan fields.');
    return;
  }

  try {
    await sendRequest('/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, durationMonths, purpose, loanType })
    });
    showToast('Loan request submitted. Check history for updates.');
    await loadDashboard();
  } catch (error) {
    showToast(error.message);
  }
};

const handleUploadSubmit = async (event) => {
  event.preventDefault();
  const fileInput = document.getElementById('documentFile');
  const documentType = document.getElementById('documentType').value;
  const file = fileInput.files[0];

  if (!file) {
    showToast('Please attach a document.');
    return;
  }

  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);

  try {
    await sendRequest('/kyc', {
      method: 'POST',
      body: formData
    });
    showToast('Document uploaded successfully.');
    fileInput.value = '';
  } catch (error) {
    showToast(error.message);
  }
};

const handleCreateSaving = async (event) => {
  event.preventDefault();
  const amount = Number(document.getElementById('savingAmount').value);
  const frequency = document.getElementById('savingFrequency').value;
  const targetDate = document.getElementById('savingTargetDate').value || undefined;

  if (!amount || amount <= 0) {
    showToast('Please enter a valid saving amount.');
    return;
  }
  // Additional client-side validation
  if (targetDate) {
    const td = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(td.getTime())) {
      showToast('Target date is invalid.');
      return;
    }
    if (td < today) {
      showToast('Target date cannot be in the past.');
      return;
    }
  }

  // Show confirmation modal
  const modal = document.getElementById('createSavingModal');
  const amountEl = document.getElementById('modalAmount');
  const freqEl = document.getElementById('modalFrequency');
  const targetEl = document.getElementById('modalTarget');
  amountEl.textContent = `Amount: ${formatCurrency(amount)}`;
  freqEl.textContent = `Frequency: ${frequency}`;
  targetEl.textContent = `Target date: ${targetDate || 'none'}`;
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');

  const confirmBtn = document.getElementById('confirmSavingBtn');
  const cancelBtn = document.getElementById('cancelSavingBtn');

  const doCreate = async () => {
    confirmBtn.disabled = true;
    try {
      await sendRequest('/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, frequency, targetDate })
      });
      showToast('Savings account created.');
      document.getElementById('createSavingForm').reset();
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      await loadDashboard();
    } catch (err) {
      showToast(err.message);
    } finally {
      confirmBtn.disabled = false;
      cleanup();
    }
  };

  const cleanup = () => {
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
  };

  const onConfirm = (e) => { e.preventDefault(); doCreate(); };
  const onCancel = (e) => { e.preventDefault(); modal.style.display = 'none'; modal.setAttribute('aria-hidden', 'true'); cleanup(); };

  confirmBtn.addEventListener('click', onConfirm);
  cancelBtn.addEventListener('click', onCancel);
};

const handleProfileSubmit = async (event) => {
  event.preventDefault();
  const user = {
    fullName: document.getElementById('profileName').value.trim(),
    email: document.getElementById('profileEmail').value.trim(),
    phoneNumber: document.getElementById('profilePhone').value.trim(),
    address: document.getElementById('profileAddress').value.trim()
  };

  try {
    await sendRequest('/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    showToast('Profile updated successfully.');
    await loadDashboard();
  } catch (error) {
    showToast(error.message);
  }
};

const initDashboardEvents = (transactions) => {
  const logoutBtn = document.getElementById('logoutBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const loanForm = document.getElementById('loanForm');
  const uploadForm = document.getElementById('uploadForm');
  const profileForm = document.getElementById('profileForm');
  const applyButton = document.getElementById('goToApply');
  const uploadButton = document.getElementById('goToUpload');
  const profileButton = document.getElementById('goToProfile');

  logoutBtn?.addEventListener('click', () => {
    clearToken();
    window.location.href = 'login.html';
  });
  refreshBtn?.addEventListener('click', loadDashboard);
  loanForm?.addEventListener('submit', handleLoanSubmit);
  uploadForm?.addEventListener('submit', handleUploadSubmit);
  const createSavingForm = document.getElementById('createSavingForm');
  createSavingForm?.addEventListener('submit', handleCreateSaving);
  profileForm?.addEventListener('submit', handleProfileSubmit);
  applyButton?.addEventListener('click', () => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' }));
  uploadButton?.addEventListener('click', () => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' }));
  profileButton?.addEventListener('click', () => document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth' }));
  attachReceiptHandlers(transactions);
};

const loadDashboard = async () => {
  try {
    const [auth, savings, loans, transactions, notifications] = await Promise.all([
      sendRequest('/auth/me'),
      sendRequest('/savings'),
      sendRequest('/loans'),
      sendRequest('/transactions'),
      sendRequest('/notifications')
    ]);

    renderProfile(auth.data || auth.user || auth);
    renderSavingsList(Array.isArray(savings.data?.savings || savings.savings) ? (savings.data?.savings || savings.savings) : []);
    renderLoans(Array.isArray(loans.data?.loans || loans.loans) ? (loans.data?.loans || loans.loans) : []);
    renderTransactions(Array.isArray(transactions.data?.transactions || transactions.transactions) ? (transactions.data?.transactions || transactions.transactions) : []);
    renderNotifications(Array.isArray(notifications.data?.notifications || notifications.notifications) ? (notifications.data?.notifications || notifications.notifications) : []);

    const savingsItems = Array.isArray(savings.data?.savings || savings.savings) ? (savings.data?.savings || savings.savings) : [];
    const loanList = Array.isArray(loans.data?.loans || loans.loans) ? (loans.data?.loans || loans.loans) : [];
    const transactionList = Array.isArray(transactions.data?.transactions || transactions.transactions) ? (transactions.data?.transactions || transactions.transactions) : [];
    const notificationList = Array.isArray(notifications.data?.notifications || notifications.notifications) ? (notifications.data?.notifications || notifications.notifications) : [];
    const loanCount = loanList.length;
    const transactionCount = transactionList.length;
    const notificationCount = notificationList.length;
    const balance = savingsItems.reduce((sum, item) => sum + Number(item.balance || 0), 0);

    renderOverview({ balance, loans: loanCount, transactions: transactionCount, notifications: notificationCount });
    renderSavingsList(savingsItems);
    renderLoans(loanList);
    renderTransactions(transactionList);
    renderNotifications(notificationList);
    updateChart(savingsItems.map((item) => Number(item.balance || 0)).slice(-5));
    initDashboardEvents(transactionList);
  } catch (error) {
    showToast(error.message);
    clearToken();
    window.location.href = 'login.html';
  }
};

const initDashboardPage = () => {
  guardAuth();
  loadDashboard();
};

document.addEventListener('DOMContentLoaded', initDashboardPage);
