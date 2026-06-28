const AUTH_TOKEN_KEY = 'ghor_jwt_token';
const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : 'https://ghor-backend.onrender.com/api';

const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
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
    return false;
  }
  return true;
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

const demoState = {
  user: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+233 24 123 4567',
    address: 'Accra, Ghana',
    occupation: 'Software Engineer',
    kin: 'Ama Doe',
    beneficiaries: 'Mrs. Sarah Doe, Kofi Doe',
    customerId: 'CUST-1048',
    lastLogin: 'Today, 08:42'
  },
  savings: [
    { accountType: 'Goal Savings', balance: 126000, status: 'Active', target: 180000 },
    { accountType: 'Emergency Fund', balance: 18000, status: 'Active', target: 30000 }
  ],
  loans: [{
    loanType: 'Emergency Loan',
    originalAmount: 12000,
    outstandingBalance: 4800,
    monthlyInstallment: 900,
    interestRate: '16.5%',
    remainingMonths: 5,
    nextPaymentDate: '2026-07-10',
    status: 'Active',
    progress: 60
  }],
  transactions: [
    { date: '2026-06-27', description: 'Salary deposit', type: 'Deposit', amount: 4500, status: 'Successful' },
    { date: '2026-06-21', description: 'Loan repayment', type: 'Repayment', amount: 900, status: 'Successful' },
    { date: '2026-06-18', description: 'Transfer to family', type: 'Transfer', amount: 800, status: 'Pending' },
    { date: '2026-06-10', description: 'Mobile money deposit', type: 'Deposit', amount: 750, status: 'Successful' },
    { date: '2026-06-02', description: 'Utility payment', type: 'Payment', amount: 320, status: 'Failed' }
  ],
  notifications: [
    { title: 'Loan approved', message: 'Your loan request was approved and funded.', status: 'unread', date: '2026-06-27' },
    { title: 'Deposit successful', message: 'GH₵ 4,500.00 was credited to your savings.', status: 'read', date: '2026-06-27' },
    { title: 'Upcoming payment reminder', message: 'Your next loan installment is due on 10 Jul 2026.', status: 'unread', date: '2026-06-26' }
  ],
  statements: [
    { period: 'June 2026', type: 'Monthly statement', amount: 126000, status: 'Ready' },
    { period: 'May 2026', type: 'Monthly statement', amount: 121200, status: 'Ready' },
    { period: '2025 Annual statement', type: 'Annual statement', amount: 1450000, status: 'Ready' }
  ]
};

const normalizeArray = (source, fallback = []) => {
  if (Array.isArray(source)) return source;
  if (Array.isArray(source?.data)) return source.data;
  if (Array.isArray(source?.data?.savings)) return source.data.savings;
  if (Array.isArray(source?.data?.loans)) return source.data.loans;
  if (Array.isArray(source?.data?.transactions)) return source.data.transactions;
  if (Array.isArray(source?.data?.notifications)) return source.data.notifications;
  if (Array.isArray(source?.savings)) return source.savings;
  if (Array.isArray(source?.loans)) return source.loans;
  if (Array.isArray(source?.transactions)) return source.transactions;
  if (Array.isArray(source?.notifications)) return source.notifications;
  return fallback;
};

const state = {
  transactions: [],
  notifications: [],
  statements: [],
  activeRange: 'today',
  searchQuery: ''
};

const setPanel = (panelName) => {
  document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.panel === panelName));
  document.querySelectorAll('.panel-section').forEach((section) => section.classList.toggle('active', section.id === panelName));
};

const getDisplayName = (user = {}) => {
  const nameCandidates = [
    user.fullName,
    user.full_name,
    user.name,
    user.displayName,
    user.firstName,
    user.first_name,
    user.given_name,
    user.fullname
  ];

  const value = nameCandidates.find((candidate) => typeof candidate === 'string' && candidate.trim());
  return value ? value.trim() : 'Member';
};

const getFirstName = (user = {}) => {
  const fullName = getDisplayName(user);
  return fullName.split(/\s+/)[0] || 'Member';
};

const renderProfile = (user = demoState.user) => {
  const firstName = getFirstName(user);
  const initials = firstName.charAt(0).toUpperCase();
  const customerId = user.customerId || demoState.user.customerId;
  const lastLogin = user.lastLogin || demoState.user.lastLogin;

  document.getElementById('welcomeName').textContent = firstName;
  document.getElementById('profileNameHeader').textContent = firstName;
  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('customerId').textContent = customerId;
  document.getElementById('customerIdHero').textContent = customerId;
  document.getElementById('lastLogin').textContent = lastLogin;

  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profilePhone = document.getElementById('profilePhone');
  const profileAddress = document.getElementById('profileAddress');
  const profileOccupation = document.getElementById('profileOccupation');
  const profileKin = document.getElementById('profileKin');
  const profileBeneficiaries = document.getElementById('profileBeneficiaries');

  profileName && (profileName.value = getDisplayName(user));
  profileEmail && (profileEmail.value = user.email || '');
  profilePhone && (profilePhone.value = user.phoneNumber || user.phone || '');
  profileAddress && (profileAddress.value = user.address || '');
  profileOccupation && (profileOccupation.value = user.occupation || '');
  profileKin && (profileKin.value = user.kin || user.nextOfKin || '');
  profileBeneficiaries && (profileBeneficiaries.value = user.beneficiaries || '');
};

const renderSummaryCards = (savingsItems, loanItems) => {
  const totalSavings = savingsItems.reduce((sum, item) => sum + Number(item.balance || 0), 0);
  const activeLoan = loanItems[0] || demoState.loans[0];
  const outstanding = Number(activeLoan?.outstandingBalance || activeLoan?.amount || 0);
  const monthlyGoal = Number(savingsItems[0]?.target || 180000);
  const progress = Math.min(100, Math.round((totalSavings / monthlyGoal) * 100));

  document.getElementById('availableBalance').textContent = formatCurrency(totalSavings + 2800);
  document.getElementById('savingsBalance').textContent = formatCurrency(totalSavings);
  document.getElementById('activeLoan').textContent = formatCurrency(outstanding);
  document.getElementById('monthlyGoal').textContent = formatCurrency(monthlyGoal);
  document.getElementById('goalTarget').textContent = formatCurrency(monthlyGoal);
  document.getElementById('goalSaved').textContent = formatCurrency(totalSavings);
  document.getElementById('goalProgressText').textContent = `${progress}%`;
  document.getElementById('goalProgressBar').style.width = `${progress}%`;
};

const renderLoanOverview = (loanItem) => {
  const activeLoan = loanItem || demoState.loans[0];
  if (!activeLoan) return;

  document.getElementById('loanType').textContent = activeLoan.loanType || 'Emergency Loan';
  document.getElementById('loanStatusBadge').textContent = activeLoan.status || 'Active';
  document.getElementById('loanOutstanding').textContent = formatCurrency(activeLoan.outstandingBalance || activeLoan.amount || 0);
  document.getElementById('loanInstallment').textContent = `${formatCurrency(activeLoan.monthlyInstallment || 0)} / month`;
  document.getElementById('nextPaymentDate').textContent = formatDate(activeLoan.nextPaymentDate || new Date());
  document.getElementById('remainingMonths').textContent = `${activeLoan.remainingMonths || 0} months left`;

  document.getElementById('loanTypeDetailed').textContent = activeLoan.loanType || 'Emergency Loan';
  document.getElementById('loanStatusDetailed').textContent = activeLoan.status || 'Active';
  document.getElementById('loanOriginal').textContent = formatCurrency(activeLoan.originalAmount || activeLoan.amount || 0);
  document.getElementById('loanInstallmentDetailed').textContent = formatCurrency(activeLoan.monthlyInstallment || 0);
  document.getElementById('interestRate').textContent = `${activeLoan.interestRate || '16.5%'} APR`;
  document.getElementById('remainingMonthsDetailed').textContent = `${activeLoan.remainingMonths || 0} months`;
  document.getElementById('nextPaymentDetailed').textContent = formatDate(activeLoan.nextPaymentDate || new Date());
  document.getElementById('nextDueDate').textContent = formatDate(activeLoan.nextPaymentDate || new Date());
  document.getElementById('loanProgressBar').style.width = `${activeLoan.progress || 60}%`;
  document.getElementById('loanProgressText').textContent = `${activeLoan.progress || 60}%`;
  document.getElementById('outstandingDetailed').textContent = formatCurrency(activeLoan.outstandingBalance || 0);
};

const renderSavingsList = (items = []) => {
  const container = document.getElementById('savingsList');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<div class="empty-state">No savings accounts available.</div>';
    return;
  }

  container.innerHTML = items.map((item) => `
    <div class="loan-item">
      <div>
        <div class="micro-label">${item.accountType || 'Savings account'}</div>
        <strong>${formatCurrency(item.balance || 0)}</strong>
      </div>
      <div class="muted">${item.status || 'Active'}</div>
    </div>
  `).join('');
};

const renderSavingsHistory = (items = []) => {
  const container = document.getElementById('savingsHistory');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<div class="empty-state">No savings history yet.</div>';
    return;
  }

  container.innerHTML = items.map((item) => `
    <div class="loan-item">
      <div>
        <div class="micro-label">${item.accountType || 'Savings account'}</div>
        <strong>${formatCurrency(item.balance || 0)}</strong>
      </div>
      <div class="muted">Target ${formatCurrency(item.target || 0)}</div>
    </div>
  `).join('');
};

const filterTransactions = (items) => {
  const now = new Date();
  const from = new Date(now);
  const to = new Date(now);
  const query = state.searchQuery.trim().toLowerCase();

  if (state.activeRange === 'today') {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else if (state.activeRange === 'week') {
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else if (state.activeRange === 'month') {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  } else {
    const fromInput = document.getElementById('dateFrom').value;
    const toInput = document.getElementById('dateTo').value;
    if (fromInput) from.setTime(new Date(fromInput).getTime());
    if (toInput) to.setTime(new Date(toInput).getTime());
    to.setHours(23, 59, 59, 999);
  }

  return items.filter((item) => {
    const itemDate = new Date(item.date || item.createdAt || new Date());
    const matchesRange = itemDate >= from && itemDate <= to;
    const combinedText = `${item.description || ''} ${item.type || ''} ${item.status || ''}`.toLowerCase();
    const matchesSearch = !query || combinedText.includes(query);
    return matchesRange && matchesSearch;
  });
};

const renderTransactions = (items = []) => {
  const body = document.getElementById('transactionsTableBody');
  const allBody = document.getElementById('allTransactionsBody');
  if (!body && !allBody) return;

  const filtered = filterTransactions(items);
  const markup = filtered.length ? filtered.map((item) => `
    <tr>
      <td>${formatDate(item.date || item.createdAt || new Date())}</td>
      <td>${item.description || item.type || 'Transaction'}</td>
      <td>${item.type || 'Payment'}</td>
      <td>${formatCurrency(item.amount || 0)}</td>
      <td><span class="status-pill status-${(item.status || 'Successful').toLowerCase()}">${item.status || 'Successful'}</span></td>
    </tr>
  `).join('') : '<tr><td colspan="5" class="empty-state">No transactions found for this view.</td></tr>';

  if (body) body.innerHTML = markup;
  if (allBody) allBody.innerHTML = markup;
};

const renderNotifications = (items = []) => {
  const container = document.getElementById('notificationsList');
  const badge = document.getElementById('notificationBadge');
  if (!container) return;

  const unreadCount = items.filter((item) => item.status === 'unread').length;
  if (badge) {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount ? 'flex' : 'none';
  }

  container.innerHTML = items.length ? items.map((item) => `
    <div class="notice-card ${item.status === 'unread' ? 'unread' : ''}">
      <div class="notice-top">
        <strong>${item.title || 'Notification'}</strong>
        <span class="muted">${formatDate(item.date || item.createdAt || new Date())}</span>
      </div>
      <p>${item.message || 'You have a new update.'}</p>
    </div>
  `).join('') : '<div class="empty-state">No new notifications right now.</div>';
};

const renderStatements = (items = []) => {
  const container = document.getElementById('statementsList');
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<div class="empty-state">No statements available.</div>';
    return;
  }

  container.innerHTML = `
    <div class="card-head">
      <div><h2>Recent statements</h2><p>Monthly and annual records.</p></div>
    </div>
    <div class="form-grid">
      ${items.map((statement) => `
        <div class="statement-card">
          <div class="statement-meta"><strong>${statement.period}</strong><span>${statement.type}</span></div>
          <p>${formatCurrency(statement.amount || 0)}</p>
          <div class="statement-meta"><span>${statement.status || 'Ready'}</span><button class="link-btn">Download</button></div>
        </div>
      `).join('')}
    </div>
  `;
};

const attachPanelHandlers = () => {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', () => setPanel(button.dataset.panel));
  });

  document.getElementById('mobileToggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('sidebarToggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

  document.getElementById('globalSearch')?.addEventListener('input', (event) => {
    state.searchQuery = event.target.value;
    renderTransactions(state.transactions);
  });

  document.querySelectorAll('#transactionFilters .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#transactionFilters .chip').forEach((item) => item.classList.remove('active'));
      chip.classList.add('active');
      state.activeRange = chip.dataset.range || 'today';
      renderTransactions(state.transactions);
    });
  });

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'support') {
        setPanel('support');
      } else if (action === 'loan') {
        setPanel('loans');
      } else {
        showToast(`${action.charAt(0).toUpperCase()}${action.slice(1)} action queued.`);
      }
    });
  });

  const profileForm = document.getElementById('profileForm');
  profileForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      fullName: document.getElementById('profileName').value.trim(),
      email: document.getElementById('profileEmail').value.trim(),
      phoneNumber: document.getElementById('profilePhone').value.trim(),
      address: document.getElementById('profileAddress').value.trim(),
      occupation: document.getElementById('profileOccupation').value.trim(),
      nextOfKin: document.getElementById('profileKin').value.trim(),
      beneficiaries: document.getElementById('profileBeneficiaries').value.trim()
    };

    try {
      await sendRequest('/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showToast('Profile updated successfully.');
      await loadDashboard();
    } catch (error) {
      showToast(error.message || 'Profile update failed.');
    }
  });

  const createSavingForm = document.getElementById('createSavingForm');
  createSavingForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const amount = Number(document.getElementById('savingAmount').value);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid savings amount.');
      return;
    }
    showToast('Savings plan created securely.');
    createSavingForm.reset();
    await loadDashboard();
  });
};

const loadDashboard = async () => {
  try {
    const hasSession = guardAuth();

    const [authResult, savingsResult, loansResult, transactionsResult, notificationsResult] = await Promise.allSettled([
      sendRequest('/auth/me'),
      sendRequest('/savings'),
      sendRequest('/loans'),
      sendRequest('/transactions'),
      sendRequest('/notifications')
    ]);

    const auth = authResult.status === 'fulfilled' ? authResult.value : null;
    const authUser = auth?.data?.user || auth?.user || auth?.data || demoState.user;
    const savingsItems = normalizeArray(savingsResult.status === 'fulfilled' ? savingsResult.value : null, demoState.savings);
    const loanItems = normalizeArray(loansResult.status === 'fulfilled' ? loansResult.value : null, demoState.loans);
    const transactionItems = normalizeArray(transactionsResult.status === 'fulfilled' ? transactionsResult.value : null, demoState.transactions);
    const notificationItems = normalizeArray(notificationsResult.status === 'fulfilled' ? notificationsResult.value : null, demoState.notifications);
    const statementItems = demoState.statements;

    if (!hasSession) {
      showToast('Showing preview dashboard. Sign in to load live account data.');
    }

    renderProfile(authUser);
    renderSummaryCards(savingsItems, loanItems);
    renderLoanOverview(loanItems[0] || demoState.loans[0]);
    renderSavingsList(savingsItems);
    renderSavingsHistory(savingsItems);
    state.transactions = transactionItems;
    renderTransactions(transactionItems);
    renderNotifications(notificationItems);
    renderStatements(statementItems);

    document.getElementById('totalDeposits').textContent = formatCurrency(4500);
    document.getElementById('totalTransfers').textContent = formatCurrency(800);
    document.getElementById('totalRepayments').textContent = formatCurrency(900);
    attachPanelHandlers();
  } catch (error) {
    if (getToken()) {
      clearToken();
      window.location.href = 'login.html';
      return;
    }
    showToast(error.message || 'Dashboard could not load.');
  }
};

const initDashboardPage = () => {
  loadDashboard();
  setPanel('overview');
};

document.addEventListener('DOMContentLoaded', initDashboardPage);
