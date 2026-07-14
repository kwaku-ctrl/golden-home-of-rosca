const AUTH_TOKEN_KEY = 'ghor_jwt_token';
const AUTH_USER_KEY = 'ghor_user_data';
const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : 'https://ghor-backend.onrender.com/api';

const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const setUserData = (user) => {
  if (!user) return;
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn('Unable to cache user data', error);
  }
};

const getUserData = () => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const clearToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);
const clearUserData = () => localStorage.removeItem(AUTH_USER_KEY);

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

const getRole = (user = {}) => {
  return (user?.role || user?.user_role || '')
    .toString()
    .trim()
    .toLowerCase();
};

const isAdminUser = (user = {}) => {
  const role = getRole(user);
  return ['admin', 'super-admin'].includes(role);
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
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};
const buildStatementItems = (items = []) => items.slice(0, 3).map((item, index) => ({
  period: formatDate(item.date || item.createdAt || new Date()),
  type: index === 0 ? 'Recent activity' : 'Account statement',
  amount: Number(item.amount || 0),
  status: 'Ready'
}));

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
  const sidebar = document.getElementById('sidebar');
  sidebar?.classList.remove('open');
  const activeSection = document.getElementById(panelName);
  activeSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const openModal = (title, body, primaryLabel = 'Continue', primaryAction = null) => {
  const overlay = document.getElementById('dashboardModal');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  const primaryBtn = document.getElementById('modalPrimaryBtn');
  const secondaryBtn = document.getElementById('modalSecondaryBtn');

  if (!overlay || !titleEl || !bodyEl || !primaryBtn || !secondaryBtn) return;

  titleEl.textContent = title;
  bodyEl.textContent = body;
  primaryBtn.textContent = primaryLabel;
  primaryBtn.onclick = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    if (typeof primaryAction === 'function') primaryAction();
  };
  secondaryBtn.onclick = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  };

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
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

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Welcome';
};

const renderProfile = (user = {}) => {
  const firstName = getFirstName(user);
  const greeting = getTimeGreeting();
  const initials = firstName.charAt(0).toUpperCase();
  const customerId = user.customerId || user.customer_id || user.member_id || (user.id ? `CUST-${String(user.id).slice(0, 8).toUpperCase()}` : 'N/A');
  const lastLoginValue = user.lastLogin || user.last_login || user.updated_at || user.created_at || null;
  const lastLogin = lastLoginValue ? formatDateTime(lastLoginValue) : 'Not available yet';

  const welcomeName = document.getElementById('welcomeName');
  const profileNameHeader = document.getElementById('profileNameHeader');
  const profileAvatar = document.getElementById('profileAvatar');
  const customerIdEl = document.getElementById('customerId');
  const customerIdHero = document.getElementById('customerIdHero');
  const lastLoginEl = document.getElementById('lastLogin');

  welcomeName && (welcomeName.textContent = `${greeting}, ${firstName}`);
  profileNameHeader && (profileNameHeader.textContent = firstName);
  profileAvatar && (profileAvatar.textContent = initials);
  customerIdEl && (customerIdEl.textContent = customerId);
  customerIdHero && (customerIdHero.textContent = customerId);
  lastLoginEl && (lastLoginEl.textContent = lastLogin);

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
  profileKin && (profileKin.value = user.kin || user.nextOfKin || user.next_of_kin || '');
  profileBeneficiaries && (profileBeneficiaries.value = user.beneficiaries || '');
};

const renderSummaryCards = (savingsItems, loanItems) => {
  const totalSavings = savingsItems.reduce((sum, item) => sum + Number(item.balance || 0), 0);
  const totalOutstanding = loanItems.reduce((sum, item) => sum + Number(item.outstandingBalance || item.amount || item.balance || 0), 0);
  const monthlyGoal = Number(savingsItems[0]?.target || savingsItems[0]?.target_amount || 0);
  const safeGoal = monthlyGoal > 0 ? monthlyGoal : Math.max(totalSavings, 1);
  const progress = Math.min(100, Math.round((totalSavings / safeGoal) * 100));

  document.getElementById('availableBalance').textContent = formatCurrency(totalSavings);
  document.getElementById('savingsBalance').textContent = formatCurrency(totalSavings);
  document.getElementById('activeLoan').textContent = formatCurrency(totalOutstanding);
  document.getElementById('monthlyGoal').textContent = formatCurrency(safeGoal);
  document.getElementById('goalTarget').textContent = formatCurrency(safeGoal);
  document.getElementById('goalSaved').textContent = formatCurrency(totalSavings);
  document.getElementById('goalProgressText').textContent = `${progress}%`;
  const progressBar = document.getElementById('goalProgressBar');
  if (progressBar) progressBar.style.width = `${progress}%`;
};

const renderLoanOverview = (loanItem) => {
  const activeLoan = loanItem || null;
  if (!activeLoan) {
    document.getElementById('loanType').textContent = 'No active loan';
    document.getElementById('loanStatusBadge').textContent = 'No loan';
    document.getElementById('loanOutstanding').textContent = formatCurrency(0);
    document.getElementById('loanInstallment').textContent = `${formatCurrency(0)} / month`;
    document.getElementById('nextPaymentDate').textContent = 'N/A';
    document.getElementById('remainingMonths').textContent = '0 months left';

    document.getElementById('loanTypeDetailed').textContent = 'No active loan';
    document.getElementById('loanStatusDetailed').textContent = 'No loan';
    document.getElementById('loanOriginal').textContent = formatCurrency(0);
    document.getElementById('loanInstallmentDetailed').textContent = formatCurrency(0);
    document.getElementById('interestRate').textContent = '0% APR';
    document.getElementById('remainingMonthsDetailed').textContent = '0 months';
    document.getElementById('nextPaymentDetailed').textContent = 'N/A';
    document.getElementById('nextDueDate').textContent = 'N/A';
    const loanProgressBar = document.getElementById('loanProgressBar');
    if (loanProgressBar) loanProgressBar.style.width = '0%';
    document.getElementById('loanProgressText').textContent = '0%';
    document.getElementById('outstandingDetailed').textContent = formatCurrency(0);
    return;
  }

  document.getElementById('loanType').textContent = activeLoan.loanType || activeLoan.loan_type || 'Personal loan';
  document.getElementById('loanStatusBadge').textContent = activeLoan.status || 'Active';
  document.getElementById('loanOutstanding').textContent = formatCurrency(activeLoan.outstandingBalance || activeLoan.outstanding_balance || activeLoan.amount || 0);
  document.getElementById('loanInstallment').textContent = `${formatCurrency(activeLoan.monthlyInstallment || activeLoan.monthly_installment || 0)} / month`;
  document.getElementById('nextPaymentDate').textContent = formatDate(activeLoan.nextPaymentDate || activeLoan.next_payment_date || new Date());
  document.getElementById('remainingMonths').textContent = `${activeLoan.remainingMonths || activeLoan.remaining_months || 0} months left`;

  document.getElementById('loanTypeDetailed').textContent = activeLoan.loanType || activeLoan.loan_type || 'Personal loan';
  document.getElementById('loanStatusDetailed').textContent = activeLoan.status || 'Active';
  document.getElementById('loanOriginal').textContent = formatCurrency(activeLoan.originalAmount || activeLoan.original_amount || activeLoan.amount || 0);
  document.getElementById('loanInstallmentDetailed').textContent = formatCurrency(activeLoan.monthlyInstallment || activeLoan.monthly_installment || 0);
  document.getElementById('interestRate').textContent = `${activeLoan.interestRate || activeLoan.interest_rate || '0%'} APR`;
  document.getElementById('remainingMonthsDetailed').textContent = `${activeLoan.remainingMonths || activeLoan.remaining_months || 0} months`;
  document.getElementById('nextPaymentDetailed').textContent = formatDate(activeLoan.nextPaymentDate || activeLoan.next_payment_date || new Date());
  document.getElementById('nextDueDate').textContent = formatDate(activeLoan.nextPaymentDate || activeLoan.next_payment_date || new Date());
  const loanProgressBar = document.getElementById('loanProgressBar');
  if (loanProgressBar) loanProgressBar.style.width = `${activeLoan.progress || 0}%`;
  document.getElementById('loanProgressText').textContent = `${activeLoan.progress || 0}%`;
  document.getElementById('outstandingDetailed').textContent = formatCurrency(activeLoan.outstandingBalance || activeLoan.outstanding_balance || 0);
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
    button.addEventListener('click', (event) => {
      if (button.tagName.toLowerCase() === 'a') return;
      event.preventDefault();
      setPanel(button.dataset.panel);
    });
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
        window.location.href = 'support.html';
      } else if (action === 'loan') {
        setPanel('loans');
      } else if (action === 'deposit') {
        window.location.href = 'checkout.html';
      } else if (action === 'withdraw') {
        setPanel('mobile-money');
        openModal('Withdraw funds', 'Use mobile money or wallet transfer to withdraw securely.', 'Open wallet');
      } else if (action === 'repay') {
        setPanel('loans');
        openModal('Repay loan', 'Your next installment is ready for payment from the loan section.', 'Open loans');
      } else if (action === 'transfer') {
        setPanel('mobile-money');
        openModal('Transfer funds', 'Start a transfer from the mobile money section.', 'Open mobile money');
      } else {
        showToast(`${action.charAt(0).toUpperCase()}${action.slice(1)} action queued.`);
      }
    });
  });

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
      await sendRequest('/auth/logout', { method: 'GET' });
    } catch (error) {
      console.warn('Logout request failed, clearing local session anyway.', error);
    }
    clearToken();
    clearUserData();
    window.location.href = 'login.html';
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
    openModal('Savings plan created', 'Your contribution is now scheduled and will appear in your savings history.', 'View savings', () => setPanel('savings'));
    createSavingForm.reset();
    await loadDashboard();
  });

  document.querySelectorAll('.notice-card, .statement-card, .support-item, .security-item').forEach((item) => {
    item.addEventListener('click', () => {
      if (item.classList.contains('notice-card')) {
        setPanel('notifications');
      } else if (item.classList.contains('statement-card')) {
        setPanel('statements');
      } else if (item.classList.contains('support-item')) {
        setPanel('support');
      } else if (item.classList.contains('security-item')) {
        setPanel('settings');
      }
    });
  });
};

const loadDashboard = async () => {
  try {
    const hasSession = guardAuth();
    if (!hasSession) {
      window.location.href = 'login.html';
      return;
    }

    const [authResult, savingsResult, loansResult, transactionsResult, notificationsResult] = await Promise.allSettled([
      sendRequest('/auth/me'),
      sendRequest('/savings'),
      sendRequest('/loans'),
      sendRequest('/transactions'),
      sendRequest('/notifications')
    ]);

    const auth = authResult.status === 'fulfilled' ? authResult.value : null;
    const cachedUser = getUserData();
    const authUser = auth?.data?.user || auth?.user || auth?.data || cachedUser || {};
    if (auth?.data?.user) {
      setUserData(auth.data.user);
    }

    if (isAdminUser(authUser)) {
      clearUserData();
      window.location.href = 'admin.html';
      return;
    }

    const savingsItems = normalizeArray(savingsResult.status === 'fulfilled' ? savingsResult.value : null, []);
    const loanItems = normalizeArray(loansResult.status === 'fulfilled' ? loansResult.value : null, []);
    const transactionItems = normalizeArray(transactionsResult.status === 'fulfilled' ? transactionsResult.value : null, []);
    const notificationItems = normalizeArray(notificationsResult.status === 'fulfilled' ? notificationsResult.value : null, []);
    const statementItems = buildStatementItems(transactionItems);

    renderProfile(authUser);
    renderSummaryCards(savingsItems, loanItems);
    renderLoanOverview(loanItems[0] || null);
    renderSavingsList(savingsItems);
    renderSavingsHistory(savingsItems);
    state.transactions = transactionItems;
    renderTransactions(transactionItems);
    renderNotifications(notificationItems);
    renderStatements(statementItems);

    const depositTotal = transactionItems.reduce((sum, item) => sum + (String(item.type || '').toLowerCase() === 'deposit' ? Number(item.amount || 0) : 0), 0);
    const transferTotal = transactionItems.reduce((sum, item) => sum + (String(item.type || '').toLowerCase() === 'transfer' ? Number(item.amount || 0) : 0), 0);
    const repaymentTotal = transactionItems.reduce((sum, item) => sum + (String(item.type || '').toLowerCase() === 'repayment' ? Number(item.amount || 0) : 0), 0);

    const totalDepositsEl = document.getElementById('totalDeposits');
    const totalTransfersEl = document.getElementById('totalTransfers');
    const totalRepaymentsEl = document.getElementById('totalRepayments');
    if (totalDepositsEl) totalDepositsEl.textContent = formatCurrency(depositTotal);
    if (totalTransfersEl) totalTransfersEl.textContent = formatCurrency(transferTotal);
    if (totalRepaymentsEl) totalRepaymentsEl.textContent = formatCurrency(repaymentTotal);
    attachPanelHandlers();
  } catch (error) {
    if (getToken()) {
      clearToken();
      clearUserData();
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
