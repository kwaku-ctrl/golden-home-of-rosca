const AUTH_TOKEN_KEY = 'ghor_jwt_token';
const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : 'https://ghor-backend.onrender.com/api';

const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const setToken = (token) => localStorage.setItem(AUTH_TOKEN_KEY, token);
const clearToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const sendRequest = async (path, options = {}) => {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

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
    container.innerHTML = '<div class="empty-state" style="padding: 1rem;">No savings accounts found. Create one to get started.</div>';
    return;
  }
  container.innerHTML = items.map((saving) => `
    <div class="card" style="margin-bottom: 1rem;">
      <div class="card-header">
        <div>
          <div class="card-label">${saving.accountType || 'Savings account'}</div>
          <div class="card-value" style="font-size: 1.5rem;">${formatCurrency(saving.balance)}</div>
        </div>
        <span class="card-badge badge-success">${saving.status || 'Active'}</span>
      </div>
      <div class="card-subtext">Account: ${saving.accountNumber || '#' + saving._id?.slice(0, 8) || 'N/A'}</div>
    </div>
  `).join('');
};

const renderLoans = (items = []) => {
  const table = document.getElementById('loansTable');
  if (!table) return;
  const body = table.querySelector('tbody');
  if (!body) return;
  if (!items.length) {
    body.innerHTML = '<tr><td colspan="5" class="empty-state">No loan history yet.</td></tr>';
    return;
  }
  body.innerHTML = items.map((loan) => `
    <tr>
      <td>${loan.loanType || 'Loan'}</td>
      <td>${formatCurrency(loan.amount)}</td>
      <td>${loan.durationMonths || loan.duration || 'N/A'} months</td>
      <td><span class="status-badge status-${loan.status?.toLowerCase() || 'pending'}">${loan.status || 'Pending'}</span></td>
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
    body.innerHTML = '<tr><td colspan="5" class="empty-state">No transactions yet. Start saving or apply for a loan to get started.</td></tr>';
    return;
  }
  body.innerHTML = items.map((tx) => `
    <tr>
      <td>${formatDate(tx.createdAt || tx.date)}</td>
      <td>${tx.type || tx.transactionType || 'Payment'}</td>
      <td>${formatCurrency(tx.amount)}</td>
      <td><span class="status-badge status-${tx.status?.toLowerCase() || 'completed'}">${tx.status || 'Completed'}</span></td>
      <td><button class="btn btn-small btn-secondary receipt-btn" data-id="${tx._id || ''}">Download</button></td>
    </tr>
  `).join('');
};

const renderNotifications = (items = []) => {
  const container = document.getElementById('notificationList');
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<p class="empty-state">No notifications at this time.</p>';
    return;
  }
  
  // Update badge
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    const unreadCount = items.filter(n => n.status === 'unread').length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
  
  container.innerHTML = items.map((note) => `
    <div class="card" style="margin-bottom: 1rem;">
      <div class="card-header">
        <div>
          <div class="card-label">${note.title || 'Notification'}</div>
          <div class="card-subtext">${note.message || note.title || 'Notification update'}</div>
        </div>
        ${note.status === 'unread' ? '<span class="card-badge badge-warning">New</span>' : ''}
      </div>
      <div class="card-subtext">${formatDate(note.createdAt || note.date)}</div>
    </div>
  `).join('');
};

const renderOverview = (summary, allLoans = []) => {
  const savingsEl = document.getElementById('savingsBalance');
  const activeLoanEl = document.getElementById('activeLoanCount');
  const totalLoanEl = document.getElementById('totalLoanAmount');
  const nextRepaymentAmountEl = document.getElementById('nextRepaymentAmount');
  const nextRepaymentDateEl = document.getElementById('nextRepaymentDate');
  
  if (savingsEl) savingsEl.textContent = formatCurrency(summary.balance);
  if (activeLoanEl) activeLoanEl.textContent = summary.loans || 0;
  
  const totalLoanAmount = allLoans.reduce((sum, loan) => {
    if (loan.status === 'approved' || loan.status === 'active') {
      return sum + Number(loan.amount || 0);
    }
    return sum;
  }, 0);
  
  if (totalLoanEl) totalLoanEl.textContent = formatCurrency(totalLoanAmount);
  
  const activeLoan = allLoans.find(l => l.status === 'approved' || l.status === 'active');
  if (activeLoan && nextRepaymentAmountEl && nextRepaymentDateEl) {
    const monthlyPayment = activeLoan.amount / (activeLoan.durationMonths || 1);
    nextRepaymentAmountEl.textContent = formatCurrency(monthlyPayment);
    nextRepaymentDateEl.textContent = activeLoan.nextRepaymentDate ? formatDate(activeLoan.nextRepaymentDate) : 'TBD';
  }
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
  const firstName = (user.fullName || user.name || 'Member').split(' ')[0];
  const initials = firstName.charAt(0).toUpperCase();
  
  document.getElementById('welcomeName').textContent = firstName;
  document.getElementById('profileNameHeader').textContent = firstName;
  document.getElementById('profileAvatar').textContent = initials;
  
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
  
  loanForm?.addEventListener('submit', handleLoanSubmit);
  uploadForm?.addEventListener('submit', handleUploadSubmit);
  const createSavingForm = document.getElementById('createSavingForm');
  createSavingForm?.addEventListener('submit', handleCreateSaving);
  profileForm?.addEventListener('submit', handleProfileSubmit);
  
  applyButton?.addEventListener('click', () => {
    document.getElementById('applySection').style.display = 'block';
    document.getElementById('applySection').scrollIntoView({ behavior: 'smooth' });
  });
  
  uploadButton?.addEventListener('click', () => {
    document.getElementById('uploadSection').style.display = 'block';
    document.getElementById('uploadSection').scrollIntoView({ behavior: 'smooth' });
  });
  
  profileButton?.addEventListener('click', () => {
    document.getElementById('profileSection').style.display = 'block';
    document.getElementById('profileSection').scrollIntoView({ behavior: 'smooth' });
  });
  
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
    
    const savingsItems = Array.isArray(savings.data?.savings || savings.savings) ? (savings.data?.savings || savings.savings) : [];
    const loanList = Array.isArray(loans.data?.loans || loans.loans) ? (loans.data?.loans || loans.loans) : [];
    const transactionList = Array.isArray(transactions.data?.transactions || transactions.transactions) ? (transactions.data?.transactions || transactions.transactions) : [];
    const notificationList = Array.isArray(notifications.data?.notifications || notifications.notifications) ? (notifications.data?.notifications || notifications.notifications) : [];
    
    const loanCount = loanList.length;
    const transactionCount = transactionList.length;
    const notificationCount = notificationList.length;
    const balance = savingsItems.reduce((sum, item) => sum + Number(item.balance || 0), 0);

    renderOverview({ balance, loans: loanCount, transactions: transactionCount, notifications: notificationCount }, loanList);
    renderSavingsList(savingsItems);
    renderLoans(loanList);
    renderTransactions(transactionList);
    renderNotifications(notificationList);
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
