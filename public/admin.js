const AUTH_TOKEN_KEY = 'ghor_jwt_token';
const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : 'https://ghor-backend.onrender.com/api';

const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const clearToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

const sendRequest = async (path, options = {}) => {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${apiBase}${path}`, { credentials: 'include', ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const getRole = (user = {}) => {
  return (user?.role || user?.user_role || '')
    .toString()
    .trim()
    .toLowerCase();
};

const guardAdmin = async () => {
  try {
    const me = await sendRequest('/auth/me');
    const user = me.data || me.user || me;
    if (!user || !['admin', 'super-admin'].includes(getRole(user))) {
      clearToken();
      window.location.href = 'login.html';
      return null;
    }
    return user;
  } catch (err) {
    clearToken();
    window.location.href = 'login.html';
    return null;
  }
};

const csvFromArray = (arr) => {
  if (!arr.length) return '';
  const keys = Object.keys(arr[0]);
  const lines = arr.map((row) => keys.map((k) => `"${(row[k] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  return `${keys.join(',')}\n${lines.join('\n')}`;
};

const downloadCSV = (filename, arr) => {
  const csv = csvFromArray(arr);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const renderTable = (tableId, rowsHtml) => {
  const table = document.getElementById(tableId);
  if (!table) return;
  const body = table.querySelector('tbody');
  body.innerHTML = rowsHtml;
};

// Users
const fetchUsers = async (page = 1, q = '', role = '', limit = 20) => {
  const params = new URLSearchParams({ page, q, role, limit });
  return sendRequest(`/users?${params.toString()}`);
};

const renderUsers = (payload) => {
  const users = payload.data?.users || payload.users || payload || [];
  if (!users.length) return renderTable('usersTable', '<tr><td colspan="6">No users found.</td></tr>');
  const rows = users.map((u) => `
    <tr>
      <td>${u.fullName || u.name || ''}</td>
      <td>${u.email || ''}</td>
      <td>${u.phoneNumber || u.phone || ''}</td>
      <td>${u.role || 'member'}</td>
      <td>${u.active ? 'Active' : 'Inactive'}</td>
      <td>
        <button class="btn btn-ghost user-edit" data-id="${u._id}">Edit</button>
        <button class="btn btn-ghost user-toggle" data-id="${u._id}">${u.active ? 'Deactivate' : 'Activate'}</button>
      </td>
    </tr>
  `).join('');
  renderTable('usersTable', rows);
};

const initUsersSection = () => {
  const search = document.getElementById('userSearch');
  const role = document.getElementById('roleFilter');
  const exportBtn = document.getElementById('exportUsers');

  const load = async () => {
    try {
      const res = await fetchUsers(currentPage, search.value.trim(), role.value, pageSize);
      const users = res.data?.users || res.users || res || [];
      const total = res.total || 0;
      renderUsers(users);
      renderPagination('usersPagination', currentPage, Math.ceil(total / pageSize));
      exportBtn.onclick = () => { window.location.href = `${apiBase}/users?export=csv&q=${encodeURIComponent(search.value.trim())}&role=${encodeURIComponent(role.value)}`; };
    } catch (err) {
      console.error(err);
    }
  };

  let currentPage = 1;
  const pageSize = 20;

  const goToPage = (p) => {
    currentPage = Math.max(1, p);
    load();
  };

  const paginationContainer = document.getElementById('usersPagination');
  const renderPagination = (id, page, totalPages) => {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = `
      <div class="pagination">
        <button class="btn btn-ghost" data-action="prev">Prev</button>
        <div class="small-muted">Page ${page} of ${totalPages || 1}</div>
        <button class="btn btn-ghost" data-action="next">Next</button>
      </div>
    `;
    container.querySelector('[data-action="prev"]').addEventListener('click', () => goToPage(page - 1));
    container.querySelector('[data-action="next"]').addEventListener('click', () => goToPage(page + 1));
  };

  search.addEventListener('input', () => { currentPage = 1; load(); });
  role.addEventListener('change', () => { currentPage = 1; load(); });
  load();
};

// Loans
const fetchLoans = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return sendRequest(`/loans?${qs}`);
};

const renderLoansAdmin = (payload) => {
  const loans = payload.data?.loans || payload.loans || payload || [];
  if (!loans.length) return renderTable('loansTableAdmin', '<tr><td colspan="6">No loans found.</td></tr>');
  const rows = loans.map((L) => `
    <tr>
      <td>${L.user?.fullName || L.userName || L.userEmail || ''}</td>
      <td>GH₵ ${Number(L.amount || L.loanAmount || 0).toLocaleString()}</td>
      <td>${L.durationMonths || L.duration || 'N/A'} months</td>
      <td>${L.status || 'pending'}</td>
      <td>${new Date(L.createdAt || L.appliedAt).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-ghost loan-view" data-id="${L._id}">View</button>
        ${L.status === 'pending' ? `<button class="btn btn-primary loan-approve" data-id="${L._id}">Approve</button><button class="btn btn-ghost loan-reject" data-id="${L._id}">Reject</button>` : ''}
      </td>
    </tr>
  `).join('');
  renderTable('loansTableAdmin', rows);
};

const initLoansSection = () => {
  const search = document.getElementById('loanSearch');
  const status = document.getElementById('loanStatusFilter');
  const exportBtn = document.getElementById('exportLoans');

  const load = async () => {
    try {
      const res = await fetchLoans({ page: currentPage, q: search.value.trim(), status: status.value, limit: pageSize });
      const loans = res.data?.loans || res.loans || res || [];
      const total = res.total || 0;
      renderLoansAdmin(loans);
      renderLoansPagination('loansPagination', currentPage, Math.ceil(total / pageSize));
      exportBtn.onclick = () => { window.location.href = `${apiBase}/loans?export=csv&q=${encodeURIComponent(search.value.trim())}&status=${encodeURIComponent(status.value)}`; };
      // attach action handlers
      document.querySelectorAll('.loan-approve').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            await sendRequest(`/loans/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }) });
            load();
          } catch (err) { console.error(err); }
        });
      });
      document.querySelectorAll('.loan-reject').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            await sendRequest(`/loans/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected' }) });
            load();
          } catch (err) { console.error(err); }
        });
      });
    } catch (err) {
      console.error(err);
    }
  };

  let currentPage = 1;
  const pageSize = 20;

  const goToPage = (p) => {
    currentPage = Math.max(1, p);
    load();
  };

  const renderLoansPagination = (id, page, totalPages) => {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = `
      <div class="pagination">
        <button class="btn btn-ghost" data-action="prev">Prev</button>
        <div class="small-muted">Page ${page} of ${totalPages || 1}</div>
        <button class="btn btn-ghost" data-action="next">Next</button>
      </div>
    `;
    container.querySelector('[data-action="prev"]').addEventListener('click', () => goToPage(page - 1));
    container.querySelector('[data-action="next"]').addEventListener('click', () => goToPage(page + 1));
  };

  search.addEventListener('input', () => { currentPage = 1; load(); });
  status.addEventListener('change', () => { currentPage = 1; load(); });
  load();
};

// KYC
const fetchKyc = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return sendRequest(`/kyc?${qs}`);
};

const renderKyc = (payload) => {
  const items = payload.data?.kyc || payload.kyc || payload || [];
  if (!items.length) return renderTable('kycTable', '<tr><td colspan="6">No KYC records.</td></tr>');
  const rows = items.map((k) => `
    <tr>
      <td>${k.user?.fullName || k.userName || ''}</td>
      <td><a href="/uploads/${k.fileName || k.path || k.filename || ''}" target="_blank">View</a></td>
      <td>${k.documentType || k.fileType || 'document'}</td>
      <td>${k.status || 'pending'}</td>
      <td>${new Date(k.createdAt).toLocaleDateString()}</td>
      <td>
        ${k.status === 'pending' ? `<button class="btn btn-primary kyc-verify" data-id="${k._id}">Verify</button><button class="btn btn-ghost kyc-reject" data-id="${k._id}">Reject</button>` : ''}
      </td>
    </tr>
  `).join('');
  renderTable('kycTable', rows);
};

const initKycSection = () => {
  const search = document.getElementById('kycSearch');
  const status = document.getElementById('kycStatusFilter');
  const exportBtn = document.getElementById('exportKyc');

  const load = async () => {
    try {
      const res = await fetchKyc({ page: currentPage, q: search.value.trim(), status: status.value, limit: pageSize });
      const items = res.data?.kyc || res.kyc || res || [];
      const total = res.total || 0;
      renderKyc(items);
      renderKycPagination('kycPagination', currentPage, Math.ceil(total / pageSize));
      exportBtn.onclick = () => { window.location.href = `${apiBase}/kyc?export=csv&q=${encodeURIComponent(search.value.trim())}&status=${encodeURIComponent(status.value)}`; };
      document.querySelectorAll('.kyc-verify').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            await sendRequest(`/kyc/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'verified' }) });
            load();
          } catch (err) { console.error(err); }
        });
      });
      document.querySelectorAll('.kyc-reject').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            await sendRequest(`/kyc/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected' }) });
            load();
          } catch (err) { console.error(err); }
        });
      });
    } catch (err) { console.error(err); }
  };

    let currentPage = 1;
    const pageSize = 20;

    const goToPage = (p) => {
      currentPage = Math.max(1, p);
      load();
    };

    const renderKycPagination = (id, page, totalPages) => {
      const container = document.getElementById(id);
      if (!container) return;
      container.innerHTML = `
        <div class="pagination">
          <button class="btn btn-ghost" data-action="prev">Prev</button>
          <div class="small-muted">Page ${page} of ${totalPages || 1}</div>
          <button class="btn btn-ghost" data-action="next">Next</button>
        </div>
      `;
      container.querySelector('[data-action="prev"]').addEventListener('click', () => goToPage(page - 1));
      container.querySelector('[data-action="next"]').addEventListener('click', () => goToPage(page + 1));
    };

    search.addEventListener('input', () => { currentPage = 1; load(); });
    status.addEventListener('change', () => { currentPage = 1; load(); });
    load();
};

// Admin bootstrap
const initAdmin = async () => {
  await guardAdmin();
  document.getElementById('adminLogout')?.addEventListener('click', () => { clearToken(); window.location.href = 'login.html'; });
  document.getElementById('refreshAdmin')?.addEventListener('click', () => { initAll(); });
  initUsersSection();
  initLoansSection();
  initKycSection();
  initPaymentsSection();
  initBlogsSection();
  initNotificationsSection();
  initTestimonialsSection();
};

const initAll = async () => {
  try {
    // fetch summary stats
    const [usersRes, loansRes, savingsRes] = await Promise.all([sendRequest('/users'), sendRequest('/loans?status=active'), sendRequest('/savings')]);
    const users = usersRes.data?.users || usersRes.users || usersRes || [];
    const loans = loansRes.data?.loans || loansRes.loans || loansRes || [];
    const savings = savingsRes.data?.savings || savingsRes.savings || savingsRes || [];

    document.getElementById('statUsers').textContent = users.length;
    document.getElementById('statLoans').textContent = loans.length;
    const totalSavings = savings.reduce((s, it) => s + Number(it.balance || 0), 0);
    document.getElementById('statSavings').textContent = `GH₵ ${totalSavings.toLocaleString()}`;

  } catch (err) {
    console.error(err);
  }
};

// Payments (transactions)
const fetchPayments = async (page = 1, q = '', type = '', limit = 20) => {
  const params = new URLSearchParams({ page, q, type, limit });
  return sendRequest(`/transactions?${params.toString()}`);
};

const renderPayments = (payload) => {
  const items = payload.data?.transactions || payload.transactions || payload || [];
  if (!items.length) return renderTable('paymentsTable', '<tr><td colspan="6">No payments found.</td></tr>');
  const rows = items.map((p) => `
    <tr>
      <td>${p.user?.fullName || p.userName || ''}</td>
      <td>${p.type || p.transactionType || ''}</td>
      <td>GH₵ ${Number(p.amount || 0).toLocaleString()}</td>
      <td>${p.status || ''}</td>
      <td>${p.reference || p.providerReference || ''}</td>
      <td><button class="btn btn-ghost" data-id="${p._id}">View</button></td>
    </tr>
  `).join('');
  renderTable('paymentsTable', rows);
};

const initPaymentsSection = () => {
  const search = document.getElementById('paymentsSearch');
  const type = document.getElementById('paymentsTypeFilter');
  const exportBtn = document.getElementById('exportPayments');

  let currentPage = 1;
  const pageSize = 20;

  const load = async () => {
    try {
      const res = await fetchPayments(currentPage, search.value.trim(), type.value, pageSize);
      const items = res.data?.transactions || res.transactions || res || [];
      const total = res.total || 0;
      renderPayments(items);
      const container = document.getElementById('paymentsPagination');
      if (container) container.innerHTML = `<div class="small-muted">Page ${currentPage} of ${Math.ceil(total / pageSize) || 1}</div>`;
      exportBtn.onclick = () => { window.location.href = `${apiBase}/transactions?export=csv&q=${encodeURIComponent(search.value.trim())}&type=${encodeURIComponent(type.value)}`; };
    } catch (err) { console.error(err); }
  };

  search.addEventListener('input', () => { currentPage = 1; load(); });
  type.addEventListener('change', () => { currentPage = 1; load(); });
  load();
};

// Blogs
const fetchBlogsAdmin = async () => sendRequest('/blogs');
const renderBlogs = (payload) => {
  const items = payload.data?.blogs || payload.blogs || payload || [];
  if (!items.length) return renderTable('blogsTable', '<tr><td colspan="5">No blog posts.</td></tr>');
  const rows = items.map((b) => `
    <tr>
      <td>${b.title}</td>
      <td>${b.author || ''}</td>
      <td>${b.published ? 'Yes' : 'No'}</td>
      <td>${new Date(b.createdAt).toLocaleDateString()}</td>
      <td><button class="btn btn-ghost" data-id="${b._id}">Edit</button></td>
    </tr>
  `).join('');
  renderTable('blogsTable', rows);
};

const initBlogsSection = () => {
  const search = document.getElementById('blogSearch');
  const exportBtn = document.getElementById('exportBlogs');

  const load = async () => {
    try {
      const res = await fetchBlogsAdmin();
      const items = res.data?.blogs || res.blogs || res || [];
      const filtered = search.value.trim() ? items.filter((i) => i.title.toLowerCase().includes(search.value.trim().toLowerCase()) || (i.tags || []).join(' ').toLowerCase().includes(search.value.trim().toLowerCase())) : items;
      renderBlogs(filtered);
      exportBtn.onclick = () => { /* small export via server not implemented for blogs */ downloadCSV('blogs.csv', filtered); };
    } catch (err) { console.error(err); }
  };

  search.addEventListener('input', () => load());
  load();
};

// Notifications
const fetchNotifsAdmin = async () => sendRequest('/notifications');
const renderNotifsAdmin = (payload) => {
  const items = payload.data?.notifications || payload.notifications || payload || [];
  if (!items.length) return renderTable('notifsTable', '<tr><td colspan="5">No notifications.</td></tr>');
  const rows = items.map((n) => `
    <tr>
      <td>${n.title || ''}</td>
      <td>${(n.message || '').slice(0, 80)}</td>
      <td>${n.priority || ''}</td>
      <td>${new Date(n.createdAt).toLocaleDateString()}</td>
      <td><button class="btn btn-ghost" data-id="${n._id}">Edit</button></td>
    </tr>
  `).join('');
  renderTable('notifsTable', rows);
};

const initNotificationsSection = () => {
  const search = document.getElementById('notifSearch');
  const exportBtn = document.getElementById('exportNotifs');

  const load = async () => {
    try {
      const res = await fetchNotifsAdmin();
      const items = res.data?.notifications || res.notifications || res || [];
      const filtered = search.value.trim() ? items.filter((i) => (i.title + ' ' + i.message).toLowerCase().includes(search.value.trim().toLowerCase())) : items;
      renderNotifsAdmin(filtered);
      exportBtn.onclick = () => downloadCSV('notifications.csv', filtered);
    } catch (err) { console.error(err); }
  };

  search.addEventListener('input', () => load());
  load();
};

// Testimonials
const fetchTestiAdmin = async () => sendRequest('/testimonials');
const renderTestiAdmin = (payload) => {
  const items = payload.data?.testimonials || payload.testimonials || payload || [];
  if (!items.length) return renderTable('testiTable', '<tr><td colspan="5">No testimonials.</td></tr>');
  const rows = items.map((t) => `
    <tr>
      <td>${t.name}</td>
      <td>${t.role || ''}</td>
      <td>${(t.message || '').slice(0, 80)}</td>
      <td>${new Date(t.createdAt).toLocaleDateString()}</td>
      <td><button class="btn btn-ghost" data-id="${t._id}">Edit</button></td>
    </tr>
  `).join('');
  renderTable('testiTable', rows);
};

const initTestimonialsSection = () => {
  const search = document.getElementById('testiSearch');
  const exportBtn = document.getElementById('exportTesti');

  const load = async () => {
    try {
      const res = await fetchTestiAdmin();
      const items = res.data?.testimonials || res.testimonials || res || [];
      const filtered = search.value.trim() ? items.filter((i) => (i.name + ' ' + i.message).toLowerCase().includes(search.value.trim().toLowerCase())) : items;
      renderTestiAdmin(filtered);
      exportBtn.onclick = () => downloadCSV('testimonials.csv', filtered);
    } catch (err) { console.error(err); }
  };

  search.addEventListener('input', () => load());
  load();
};

window.addEventListener('DOMContentLoaded', () => initAdmin());
